// src/presentation/mcp/controller.mcp.ts
import { Request, Response } from 'express';
import axios from 'axios';
import { CustomError } from '../../domain/errors/custom.error';
import logger from '../../configs/logger';
import { envs } from '../../configs/envs';
import { ListToolsUseCase } from '../../domain/use-cases/mcp/list-tools.use-case';
import { CallToolUseCase } from '../../domain/use-cases/mcp/call-tool.use-case';
import { MCPCallDto } from '../../domain/dtos/mcp/mcp-call.dto';
import { MCPGuardrailsService } from '../../infrastructure/services/mcp-guardrails.service';

export class MCPController {

    // Modelos válidos de Claude (actualizados a 2024)
    private readonly VALID_CLAUDE_MODELS = [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-sonnet-20240620',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
    ];

    // Servicio de guardarriles
    private readonly guardrailsService: MCPGuardrailsService;
    private cleanupInterval?: NodeJS.Timeout;

    constructor(
        private readonly listToolsUseCase: ListToolsUseCase,
        private readonly callToolUseCase: CallToolUseCase,
        private readonly startCleanupInterval: boolean = true
    ) {
        this.guardrailsService = new MCPGuardrailsService();

        // Limpiar sesiones expiradas cada 5 minutos (solo en producción)
        if (startCleanupInterval) {
            this.cleanupInterval = setInterval(() => {
                this.guardrailsService.cleanExpiredSessions();
            }, 5 * 60 * 1000);
        }
    }

    // Método para limpiar el interval en tests
    public cleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
    }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        logger.error('Unexpected error in MCPController:', error);
        return res.status(500).json({ error: 'Internal server error' });
    };

    // Endpoint proxy para Anthropic Claude CON GUARDARRILES
    public anthropicProxy = async (req: Request, res: Response) => {
        try {
            logger.info('Received request for Anthropic proxy');

            // Verificar que existe la API key
            if (!envs.ANTHROPIC_API_KEY) {
                throw CustomError.internalServerError('Anthropic API key not configured');
            }

            // Obtener el cuerpo de la petición
            const { model, max_tokens, messages, ...otherParams } = req.body;

            // Validar parámetros básicos
            if (!model || !messages) {
                throw CustomError.badRequest('Model and messages are required');
            }

            // Validar que el modelo sea válido
            if (!this.VALID_CLAUDE_MODELS.includes(model)) {
                logger.warn(`Invalid model requested: ${model}`);
                throw CustomError.badRequest(
                    `Invalid model: ${model}. Valid models are: ${this.VALID_CLAUDE_MODELS.join(', ')}`
                );
            }

            // **APLICAR GUARDARRILES**
            const sessionId = req.headers['x-session-id'] as string ||
                req.ip ||
                `session_${Date.now()}`;

            const guardrailValidation = this.guardrailsService.validateAndProcessRequest(
                { model, max_tokens, messages, ...otherParams },
                sessionId
            );

            // Si los guardarriles bloquean la request
            if (!guardrailValidation.allowed) {
                logger.warn(`[Guardrails] Request blocked for session ${sessionId}: ${guardrailValidation.reason}`);

                return res.status(400).json({
                    error: 'Request blocked by guardrails',
                    reason: guardrailValidation.reason,
                    message: guardrailValidation.suggestedResponse || 'Request not allowed',
                    suggestions: guardrailValidation.suggestedResponse
                });
            }

            // Usar la request modificada por los guardarriles
            const processedRequest = guardrailValidation.modifiedRequest || req.body;

            // Log de warnings si existen
            if (guardrailValidation.warnings && guardrailValidation.warnings.length > 0) {
                logger.warn(`[Guardrails] Warnings for session ${sessionId}:`, guardrailValidation.warnings);
            }

            // Configurar headers para Anthropic
            const headers = {
                'Content-Type': 'application/json',
                'x-api-key': envs.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            };

            logger.info(`Making request to Anthropic API`, {
                model: processedRequest.model,
                messageCount: processedRequest.messages.length,
                maxTokens: processedRequest.max_tokens,
                sessionId,
                hasSystemPrompt: !!processedRequest.system
            });

            // Realizar la petición a la API de Anthropic
            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                processedRequest,
                {
                    headers,
                    timeout: 30000 // 30 segundos timeout
                }
            );

            logger.info('Anthropic API request successful', {
                sessionId,
                responseTokens: response.data.usage?.output_tokens || 0
            });

            // **POST-PROCESO DE RESPUESTA**
            const processedResponse = await this.postProcessAnthropicResponse(response.data, sessionId, processedRequest.messages);

            // Devolver la respuesta procesada
            return res.status(200).json(processedResponse);

        } catch (error) {
            // Manejo específico de errores de Axios/Anthropic
            if (axios.isAxiosError(error)) {
                const status = error.response?.status || 500;
                const message = error.response?.data?.error?.message || 'Error communicating with Anthropic API';

                logger.error(`Anthropic API error (${status}):`, message);

                return res.status(status).json({
                    error: message,
                    details: error.response?.data
                });
            }

            this.handleError(error, res);
        }
    };

    /**
     * Post-procesar respuesta de Anthropic con detección automática de herramientas
     */
    private async postProcessAnthropicResponse(response: any, sessionId: string, originalMessages: any[]): Promise<any> {
        try {
            // Extraer el último mensaje del usuario para analizar si necesita herramientas
            const lastUserMessage = originalMessages
                .filter(msg => msg.role === 'user')
                .pop()?.content || '';

            logger.info(`[MCP] Analyzing user message for tool detection: "${lastUserMessage}"`);

            // Detectar si se necesitan herramientas automáticamente
            const requiredTools = this.detectRequiredTools(lastUserMessage);

            if (requiredTools.length > 0) {
                logger.info(`[MCP] Detected required tools: ${requiredTools.join(', ')}`);

                // Verificar si la respuesta original indica falta de información
                const responseText = response.content?.[0]?.text || '';
                const needsToolExecution = this.responseNeedsToolExecution(responseText);

                if (needsToolExecution) {
                    logger.info(`[MCP] Response indicates missing information, executing tools automatically`);

                    // Ejecutar herramientas automáticamente
                    for (const tool of requiredTools) {
                        const toolParams = this.extractParametersFromMessage(lastUserMessage, tool);
                        const toolResult = await this.executeToolAutomatically(tool, toolParams);

                        if (toolResult.success) {
                            // Generar una nueva respuesta con los datos de la herramienta
                            const formattedResponse = this.formatToolResultForUser(toolResult.data, tool);

                            return {
                                ...response,
                                content: [{
                                    type: 'text',
                                    text: formattedResponse
                                }],
                                _guardrails: {
                                    sessionId,
                                    processed: true,
                                    timestamp: new Date().toISOString(),
                                    toolsUsed: requiredTools,
                                    automaticExecution: true
                                }
                            };
                        }
                    }
                }
            }

            // Si no se necesitan herramientas o no se detectó necesidad, devolver respuesta original
            return {
                ...response,
                _guardrails: {
                    sessionId,
                    processed: true,
                    timestamp: new Date().toISOString(),
                    toolsDetected: requiredTools,
                    automaticExecution: false
                }
            };

        } catch (error) {
            logger.error(`[MCP] Error in post-processing response:`, error);

            // En caso de error, devolver respuesta original con metadata de error
            return {
                ...response,
                _guardrails: {
                    sessionId,
                    processed: true,
                    timestamp: new Date().toISOString(),
                    error: 'Tool detection failed',
                    automaticExecution: false
                }
            };
        }
    }

    /**
     * Verificar si la respuesta indica que falta información y necesita herramientas
     */
    private responseNeedsToolExecution(responseText: string): boolean {
        const text = responseText.toLowerCase();

        // Indicadores claros de que Claude no tiene la información
        const strongIndicators = [
            'no puedo mostrar',
            'no tengo acceso',
            'no puedo proporcionar',
            'no tengo información',
            'lo mejor sería',
            'consultar con',
            'revisar el catálogo',
            'verificar la sección',
            // NUEVOS indicadores más comunes
            'lo siento, no puedo',
            'no puedo responder',
            'sin más contexto',
            'necesitaría más información',
            'no tengo datos específicos',
            'requiero información adicional',
            // NUEVOS para casos como "no puedo ver directamente"
            'no puedo ver directamente',
            'no puedo acceder',
            'no tengo acceso directo',
            'consultar directamente',
            'te sugiero',
            'te recomiendo'
        ];

        // Indicadores débiles que sugieren necesidad de herramientas
        const weakIndicators = [
            'saber de qué negocio',
            'qué tipo de',
            'especificar',
            'más detalles',
            'información específica'
        ];

        // Si tiene indicadores fuertes, definitivamente ejecutar
        const hasStrongIndicator = strongIndicators.some(indicator =>
            text.includes(indicator)
        );

        // Si tiene indicadores débiles Y es una respuesta corta/genérica, probablemente ejecutar
        const hasWeakIndicator = weakIndicators.some(indicator =>
            text.includes(indicator)
        );
        const isShortResponse = text.length < 300; // Respuestas cortas suelen ser genéricas

        const shouldExecute = hasStrongIndicator || (hasWeakIndicator && isShortResponse);

        logger.debug(`[MCP] Response analysis - Text length: ${text.length}, Strong: ${hasStrongIndicator}, Weak: ${hasWeakIndicator}, Should execute: ${shouldExecute}`);

        return shouldExecute;
    }

    /**
     * Extraer parámetros del mensaje del usuario para una herramienta específica
     */
    private extractParametersFromMessage(message: string, tool: string): any {
        const params: any = {};

        switch (tool) {
            case 'get_products':
                // Para listado general de productos
                if (message.toLowerCase().includes('disponible')) {
                    params.page = 1;
                    params.limit = 20; // Mostrar más productos
                } else {
                    params.page = 1;
                    params.limit = 10;
                }
                break;

            case 'search_products':
                // Para búsqueda específica de productos
                const searchTerm = this.extractProductSearchTerm(message.toLowerCase());
                if (searchTerm) {
                    params.q = searchTerm;
                    params.page = 1;
                    params.limit = 10;
                    logger.info(`[MCP] Search parameters for search_products:`, params);
                } else {
                    // Fallback: buscar palabras clave conocidas
                    const fallbackTerms = ['empanada', 'pizza', 'lomito', 'picada', 'combo'];
                    const foundTerm = fallbackTerms.find(term => message.includes(term));
                    params.q = foundTerm || 'productos';
                    params.page = 1;
                    params.limit = 10;
                }
                break;

            case 'get_customers':
                // Para listado general de clientes
                params.page = 1;
                params.limit = 10;
                break;

            case 'search_customers':
                // Para búsqueda específica de clientes
                const customerSearchTerm = this.extractCustomerSearchTerm(message);
                if (customerSearchTerm) {
                    // Usar 'q' como parámetro unificado para búsqueda
                    params.q = customerSearchTerm;
                    params.page = 1;
                    params.limit = 10;
                    logger.info(`[MCP] Search parameters for search_customers:`, params);
                }
                break;

            case 'get_orders':
                // Para consultas de órdenes (puede incluir filtros)
                const orderParams = this.extractOrderSearchParams(message);
                if (orderParams) {
                    Object.assign(params, orderParams);
                }
                params.page = 1;
                params.limit = 10;
                logger.info(`[MCP] Parameters for get_orders:`, params);
                break;
        }

        return params;
    }

    // **ENDPOINTS DE GESTIÓN DE GUARDARRILES**

    // Obtener configuración de guardarriles
    public getGuardrailsConfig = async (req: Request, res: Response) => {
        try {
            const config = this.guardrailsService.getConfig();

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Guardrails Config',
                timestamp: new Date().toISOString(),
                config: {
                    enabled: config.enabled,
                    strictMode: config.strictMode,
                    limits: config.limits,
                    allowedTools: config.allowedTools,
                    contentRules: config.contentRules
                }
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Obtener estadísticas de sesiones
    public getGuardrailsStats = async (req: Request, res: Response) => {
        try {
            const stats = this.guardrailsService.getSessionStats();

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Guardrails Stats',
                timestamp: new Date().toISOString(),
                stats
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Obtener estadísticas de sesiones activas
    public getSessionStats = async (req: Request, res: Response) => {
        try {
            const sessionStats = this.guardrailsService.getSessionStats();

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Session Stats',
                timestamp: new Date().toISOString(),
                stats: sessionStats
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Reiniciar todas las estadísticas de guardarriles
    public resetGuardrailsStats = async (req: Request, res: Response) => {
        try {
            this.guardrailsService.resetStats();

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Guardrails Stats Reset',
                timestamp: new Date().toISOString(),
                message: 'All guardrails statistics have been reset'
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Reiniciar una sesión específica
    public resetSession = async (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;

            if (!sessionId) {
                throw CustomError.badRequest('Session ID is required');
            }

            this.guardrailsService.resetSession(sessionId);

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Session Reset',
                timestamp: new Date().toISOString(),
                message: `Session ${sessionId} has been reset`,
                sessionId
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Limpiar todas las sesiones expiradas
    public cleanExpiredSessions = async (req: Request, res: Response) => {
        try {
            this.guardrailsService.cleanExpiredSessions();

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Sessions Cleanup',
                timestamp: new Date().toISOString(),
                message: 'Expired sessions cleaned successfully'
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // **ENDPOINTS ORIGINALES DE MCP**

    // Endpoint para listar herramientas MCP disponibles
    public listTools = async (req: Request, res: Response) => {
        try {
            logger.info('List MCP tools requested');

            const tools = await this.listToolsUseCase.execute();

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Tools List',
                timestamp: new Date().toISOString(),
                tools
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Endpoint para ejecutar herramientas MCP
    public callTool = async (req: Request, res: Response) => {
        try {
            const { toolName, args } = req.body;

            if (!toolName) {
                throw CustomError.badRequest('Tool name is required');
            }

            logger.info(`Calling MCP tool: ${toolName}`, { args });

            // Crear el DTO usando el formato correcto
            const [error, mcpCallDto] = MCPCallDto.create({
                toolName,
                arguments: args || {}
            });

            if (error) {
                throw CustomError.badRequest(error);
            }

            const result = await this.callToolUseCase.execute(mcpCallDto!);

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Tool Call',
                timestamp: new Date().toISOString(),
                toolName,
                result
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Endpoint simple para obtener información de herramientas disponibles
    public getToolsInfo = async (req: Request, res: Response) => {
        try {
            logger.info('Tools info requested');

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Tools Info',
                timestamp: new Date().toISOString(),
                tools: [
                    {
                        name: 'get_products',
                        description: 'Obtiene la lista de productos con opciones de filtrado',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                search: { type: 'string', description: 'Término de búsqueda en nombre y descripción' },
                                categoryId: { type: 'string', description: 'ID de la categoría para filtrar' },
                                minPrice: { type: 'number', description: 'Precio mínimo' },
                                maxPrice: { type: 'number', description: 'Precio máximo' },
                                page: { type: 'number', default: 1, description: 'Número de página' },
                                limit: { type: 'number', default: 10, description: 'Elementos por página' }
                            }
                        }
                    },
                    {
                        name: 'get_customers',
                        description: 'Obtiene la lista de clientes con opciones de búsqueda',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                search: { type: 'string', description: 'Buscar por nombre, email o teléfono' },
                                neighborhoodId: { type: 'string', description: 'ID del barrio para filtrar' },
                                page: { type: 'number', default: 1, description: 'Número de página' },
                                limit: { type: 'number', default: 10, description: 'Elementos por página' },
                                sortBy: { type: 'string', description: 'Campo para ordenar (name, email, createdAt)' },
                                sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Orden de clasificación' }
                            }
                        }
                    },
                    {
                        name: 'get_orders',
                        description: 'Obtiene la lista de pedidos con filtros',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                customerId: { type: 'string', description: 'ID del cliente para filtrar' },
                                status: { type: 'string', description: 'Estado del pedido' },
                                dateFrom: { type: 'string', format: 'date', description: 'Fecha inicial (YYYY-MM-DD)' },
                                dateTo: { type: 'string', format: 'date', description: 'Fecha final (YYYY-MM-DD)' },
                                page: { type: 'number', default: 1, description: 'Número de página' },
                                limit: { type: 'number', default: 10, description: 'Elementos por página' }
                            }
                        }
                    },
                    {
                        name: 'get_product_by_id',
                        description: 'Obtiene un producto específico por ID',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', required: true, description: 'ID único del producto' }
                            },
                            required: ['id']
                        }
                    }
                ]
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    /**
     * Manejar mensaje de chat con detección inteligente de herramientas
     */
    public handleChatMessage = async (req: Request, res: Response) => {
        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required'
                });
            }

            logger.info(`[MCP] Chat message received: ${message}`);

            // Detectar y ejecutar herramientas automáticamente
            const requiredTools = this.detectRequiredTools(message);

            if (requiredTools.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Lo siento, no pude entender tu consulta. ¿Podrías ser más específico?'
                });
            }

            // Ejecutar la primera herramienta detectada
            const tool = requiredTools[0];
            const toolParams = this.extractParametersFromMessage(message, tool);

            logger.info(`[MCP] Executing tool: ${tool} with params:`, toolParams);

            const toolResult = await this.executeToolAutomatically(tool, toolParams);

            if (toolResult.success) {
                const formattedResponse = this.formatToolResultForUser(toolResult.data, tool);

                return res.status(200).json({
                    success: true,
                    message: formattedResponse,
                    tool_used: tool,
                    tool_params: toolParams
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: toolResult.error || 'Error executing tool',
                    tool_attempted: tool
                });
            }

        } catch (error) {
            logger.error(`[MCP] Error in handleChatMessage:`, error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    // Health check del servicio MCP
    public health = async (req: Request, res: Response) => {
        try {
            logger.info('Health check requested');

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Service',
                timestamp: new Date().toISOString(),
                anthropic_configured: !!envs.ANTHROPIC_API_KEY,
                guardrails: {
                    enabled: this.guardrailsService.getConfig().enabled,
                    activeSessions: this.guardrailsService.getSessionStats().activeSessions
                }
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Endpoint para listar modelos disponibles de Anthropic
    public listModels = async (req: Request, res: Response) => {
        try {
            logger.info('List models requested');

            if (!envs.ANTHROPIC_API_KEY) {
                throw CustomError.internalServerError('Anthropic API key not configured');
            }

            // Devolver modelos válidos disponibles
            const models = this.VALID_CLAUDE_MODELS.map(modelId => {
                const modelInfo: any = {
                    id: modelId,
                    object: 'model',
                    created: Date.now(),
                    owned_by: 'anthropic'
                };

                // Agregar información específica según el modelo
                if (modelId.includes('sonnet')) {
                    modelInfo.name = 'Claude 3.5 Sonnet';
                    modelInfo.description = 'Most intelligent model, best for complex tasks';
                    modelInfo.max_tokens = 4096;
                } else if (modelId.includes('haiku')) {
                    modelInfo.name = 'Claude 3.5 Haiku';
                    modelInfo.description = 'Fastest model, best for simple tasks';
                    modelInfo.max_tokens = 4096;
                } else if (modelId.includes('opus')) {
                    modelInfo.name = 'Claude 3 Opus';
                    modelInfo.description = 'Previous generation flagship model';
                    modelInfo.max_tokens = 4096;
                }

                return modelInfo;
            });

            return res.status(200).json({
                status: 'OK',
                service: 'Anthropic Models',
                timestamp: new Date().toISOString(),
                data: models
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // ===============================
    // MÉTODOS PRIVADOS PARA DETECCIÓN AUTOMÁTICA DE HERRAMIENTAS
    // ===============================

    /**
     * Detectar qué herramientas se necesitan basándose en el mensaje del usuario
     */
    private detectRequiredTools(message: string): string[] {
        const tools: string[] = [];
        const lowerMessage = message.toLowerCase();

        // Detectar necesidad de herramientas de productos
        if (this.shouldUseProductTools(lowerMessage)) {
            // Análisis inteligente: ¿Es una búsqueda específica o una lista general?
            const searchTerm = this.extractProductSearchTerm(lowerMessage);

            if (searchTerm) {
                // Si hay un término de búsqueda específico, usar search_products
                logger.info(`[MCP] Detected specific search for: "${searchTerm}", using search_products`);
                tools.push('search_products');
            } else {
                // Si es una consulta general, usar get_products
                logger.info(`[MCP] Detected general product query, using get_products`);
                tools.push('get_products');
            }
        }

        // Detectar necesidad de herramientas de clientes
        if (this.shouldUseCustomerTools(lowerMessage)) {
            // Análisis inteligente para clientes
            const customerSearchTerm = this.extractCustomerSearchTerm(lowerMessage);

            if (customerSearchTerm) {
                // Si hay un término de búsqueda específico, usar search_customers
                logger.info(`[MCP] Detected specific customer search for: "${customerSearchTerm}", using search_customers`);
                tools.push('search_customers');
            } else {
                // Si es una consulta general, usar get_customers
                logger.info(`[MCP] Detected general customer query, using get_customers`);
                tools.push('get_customers');
            }
        }

        // Detectar necesidad de herramientas de pedidos
        if (this.shouldUseOrderTools(lowerMessage)) {
            // Para órdenes usamos get_orders con filtros específicos
            logger.info(`[MCP] Detected order query, using get_orders`);
            tools.push('get_orders');
        }

        return tools;
    }

    /**
     * Extraer término de búsqueda específico del mensaje - ENFOQUE INTELIGENTE
     */
    private extractProductSearchTerm(message: string): string | null {
        // Lista de productos conocidos (esto podría venir de la base de datos)
        const knownProducts = [
            'empanada', 'empanadas', 'pizza', 'pizzas', 'lomito', 'lomitos',
            'picada', 'picadas', 'combo', 'combos', 'hamburguesa', 'hamburguesas'
        ];

        // Palabras que indican intención de búsqueda específica
        const searchIntentWords = [
            'precio', 'costo', 'valor', 'cuanto', 'cuánto', 'cuesta',
            'información', 'info', 'datos', 'busco', 'quiero', 'necesito',
            // NUEVOS para consultas de disponibilidad
            'tenes', 'tienes', 'tenés', 'hay', 'disponible', 'existe'
        ];

        // 1. ¿Hay intención de búsqueda?
        const hasSearchIntent = searchIntentWords.some(word =>
            message.toLowerCase().includes(word)
        );

        logger.debug(`[MCP] Product search analysis for: "${message}"`);
        logger.debug(`[MCP] - Has search intent: ${hasSearchIntent}`);

        if (!hasSearchIntent) {
            logger.debug(`[MCP] - No search intent detected`);
            return null;
        }

        // 2. ¿Menciona algún producto específico?
        const lowerMessage = message.toLowerCase();

        for (const product of knownProducts) {
            if (lowerMessage.includes(product)) {
                logger.debug(`[MCP] - Found known product: "${product}" in message`);
                // 3. Validar que es un término válido (no solo ruido)
                if (this.isValidProductTerm(product)) {
                    logger.info(`[MCP] Detected product search intent: "${product}" in message: "${message}"`);
                    return product;
                } else {
                    logger.debug(`[MCP] - Product "${product}" failed validation`);
                }
            }
        }

        // 4. Si no encontró productos conocidos, intentar extracción inteligente
        // Buscar sustantivos después de palabras clave
        const intelligentPatterns = [
            // Busca cualquier palabra después de indicadores de búsqueda
            /(?:precio|costo|valor|cuanto|cuánto).*?(?:la|las|el|los|de|del|)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
            /(?:información|info|datos).*?(?:la|las|el|los|de|del|sobre|)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
            /(?:busco|quiero|necesito).*?([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
            // NUEVOS patrones para consultas de disponibilidad
            /(?:tenes|tienes|tenés|hay).*?(?:producto|)\s*([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
            /(?:disponible|existe).*?([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i
        ];

        for (const pattern of intelligentPatterns) {
            const match = lowerMessage.match(pattern);
            if (match && match[1]) {
                let candidateTerm = match[1].trim();

                // Limpiar términos comunes al final
                candidateTerm = candidateTerm.replace(/\?$/, '').trim();

                // Validar que parece ser un producto (no palabras como "es", "un", etc.)
                if (candidateTerm.length > 2 && this.isValidProductTerm(candidateTerm)) {
                    logger.info(`[MCP] Extracted potential product term: "${candidateTerm}" from message: "${message}"`);
                    return candidateTerm;
                }
            }
        }

        return null;
    }

    /**
     * Extraer término de búsqueda específico para clientes
     */
    private extractCustomerSearchTerm(message: string): string | null {
        // Patrones para detectar búsquedas específicas de clientes
        const patterns = [
            /(?:buscar cliente (?:llamado|con nombre|que se llama)\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s@.]+)/i,
            /(?:cliente (?:llamado|con nombre|que se llama)\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s@.]+)/i,
            /(?:información del cliente\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s@.]+)/i,
            /(?:datos del cliente\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s@.]+)/i,
            /(?:cliente con email\s+)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
            /(?:busco al cliente\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s@.]+)/i,
            /(?:buscar por nombre\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
            /(?:buscar por email\s+)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                const searchTerm = match[1].trim();
                // Validar que el término extraído es válido
                if (this.isValidCustomerTerm(searchTerm)) {
                    return searchTerm;
                }
            }
        }

        return null;
    }

    /**
     * Extraer parámetros específicos para órdenes
     */
    private extractOrderSearchParams(message: string): any {
        const params: any = {};

        // Detectar filtros por estado
        const statusPatterns = [
            /(?:pedidos?|órdenes?)\s+(?:en estado|con estado|de estado)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
            /(?:pedidos?|órdenes?)\s+(pendientes?|completados?|cancelados?|en proceso)/i,
            /(?:estado)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i
        ];

        for (const pattern of statusPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                params.status = match[1].trim().toLowerCase();
                break;
            }
        }

        // Detectar filtros por fecha
        const datePatterns = [
            /(?:desde|a partir del?)\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i,
            /(?:hasta|antes del?)\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i,
            /(?:del día|fecha)\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i
        ];

        for (const pattern of datePatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                // Convertir fecha al formato esperado si es necesario
                const dateStr = match[1];
                if (message.includes('desde') || message.includes('a partir')) {
                    params.dateFrom = this.formatDate(dateStr);
                } else if (message.includes('hasta') || message.includes('antes')) {
                    params.dateTo = this.formatDate(dateStr);
                } else {
                    params.dateFrom = this.formatDate(dateStr);
                    params.dateTo = this.formatDate(dateStr);
                }
            }
        }

        return Object.keys(params).length > 0 ? params : null;
    }

    /**
     * Formatear fecha para filtros
     */
    private formatDate(dateStr: string): string {
        // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }

        // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        return dateStr; // Devolver tal como está si no se puede parsear
    }

    /**
     * Validar si es un término de producto válido - VERSIÓN INTELIGENTE
     */
    private isValidProductTerm(term: string): boolean {
        const lowerTerm = term.toLowerCase().trim();

        // 1. Lista de productos conocidos (más completa)
        const validProductTerms = [
            'empanada', 'empanadas', 'pizza', 'pizzas', 'lomito', 'lomitos',
            'picada', 'picadas', 'combo', 'combos', 'margarita', 'provenzal',
            'albaca', 'bufala', 'cherry', 'arabes', 'casera', 'hamburguesa',
            'hamburguesas', 'milanesa', 'milanesas', 'tarta', 'tartas'
        ];

        // 2. Verificar coincidencia exacta o parcial
        const hasKnownProduct = validProductTerms.some(validTerm =>
            lowerTerm.includes(validTerm) || validTerm.includes(lowerTerm)
        );

        if (hasKnownProduct) {
            return true;
        }

        // 3. Validación heurística para términos desconocidos
        // - Debe tener al menos 3 caracteres
        // - No debe ser una palabra muy común (artículos, preposiciones, etc.)
        // - Debe contener letras (no solo números o símbolos)

        const commonWords = [
            'que', 'cual', 'como', 'donde', 'cuando', 'quien', 'por', 'para',
            'con', 'sin', 'del', 'las', 'los', 'una', 'uno', 'ese', 'esa',
            'esto', 'esta', 'muy', 'mas', 'menos', 'bien', 'mal', 'son',
            'está', 'tiene', 'hacer', 'dice', 'dijo', 'puede', 'debe'
        ];

        // No debe ser una palabra común
        if (commonWords.includes(lowerTerm)) {
            return false;
        }

        // Debe tener características de un producto
        const isValidLength = lowerTerm.length >= 3;
        const hasLetters = /[a-záéíóúñ]/.test(lowerTerm);
        const notOnlyNumbers = !/^\d+$/.test(lowerTerm);
        const notOnlySymbols = !/^[\s\.,;!?¿¡]+$/.test(lowerTerm);

        const isLikelyProduct = isValidLength && hasLetters && notOnlyNumbers && notOnlySymbols;

        logger.debug(`[MCP] Validating product term: "${term}" -> ${isLikelyProduct ? 'VALID' : 'INVALID'}`);

        return isLikelyProduct;
    }

    /**
     * Validar si el término es un término de búsqueda válido para clientes
     */
    private isValidCustomerTerm(term: string): boolean {
        // Validar email
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (emailPattern.test(term)) {
            return true;
        }

        // Validar nombre (al menos 2 caracteres, no solo números o símbolos)
        return term.length >= 2 &&
            !/^\d+$/.test(term) &&
            !/^[\s\.,;!?]+$/.test(term) &&
            /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(term);
    }

    /**
     * Determinar si es una consulta específica sobre un producto (DEPRECATED - usar extractProductSearchTerm)
     */
    private isSpecificProductQuery(message: string): boolean {
        return this.extractProductSearchTerm(message) !== null;
    }

    /**
     * Determinar si se necesitan herramientas de productos - VERSIÓN INTELIGENTE
     */
    private shouldUseProductTools(message: string): boolean {
        // Palabras clave tradicionales para productos
        const productKeywords = [
            'productos', 'product', 'catálogo', 'inventario', 'disponibles',
            'stock', 'precio', 'pizza', 'comida', 'bebida', 'menu', 'menú',
            'qué tienes', 'que tienes', 'qué vendes', 'que vendes',
            'qué hay', 'que hay', 'qué productos', 'que productos'
        ];

        // Palabras que indican intención de búsqueda de productos
        const searchIntentWords = [
            'precio', 'costo', 'valor', 'cuanto', 'cuánto', 'cuesta',
            'vale', 'información', 'info', 'datos', 'busco', 'quiero', 'necesito'
        ];

        // Productos conocidos
        const knownProducts = [
            'empanada', 'empanadas', 'pizza', 'pizzas', 'lomito', 'lomitos',
            'picada', 'picadas', 'combo', 'combos', 'hamburguesa', 'hamburguesas',
            'margarita', 'provenzal', 'albaca', 'bufala', 'cherry', 'arabes', 'casera'
        ];

        // 1. Verificar palabras clave tradicionales
        const hasProductKeywords = productKeywords.some(keyword => message.includes(keyword));

        // 2. Verificar intención de búsqueda + mención de producto
        const hasSearchIntent = searchIntentWords.some(word => message.includes(word));
        const mentionsProduct = knownProducts.some(product => message.includes(product));
        const hasIntelligentSearch = hasSearchIntent && mentionsProduct;

        const shouldUse = hasProductKeywords || hasIntelligentSearch;

        logger.debug(`[MCP] shouldUseProductTools("${message}") -> ${shouldUse} (keywords: ${hasProductKeywords}, intelligent: ${hasIntelligentSearch})`);

        return shouldUse;
    }

    /**
     * Determinar si se necesitan herramientas de clientes
     */
    private shouldUseCustomerTools(message: string): boolean {
        const customerKeywords = [
            'clientes', 'customers', 'usuarios', 'compradores',
            'cliente', 'customer', 'usuario', 'comprador'
        ];

        return customerKeywords.some(keyword => message.includes(keyword));
    }

    /**
     * Determinar si se necesitan herramientas de pedidos
     */
    private shouldUseOrderTools(message: string): boolean {
        const orderKeywords = [
            'pedidos', 'orders', 'ventas', 'compras',
            'pedido', 'order', 'venta', 'compra'
        ];

        return orderKeywords.some(keyword => message.includes(keyword));
    }

    /**
     * Ejecutar una herramienta automáticamente
     */
    private async executeToolAutomatically(tool: string, params: any): Promise<{ success: boolean, data?: any, error?: string }> {
        try {
            logger.info(`[MCP] Executing tool automatically: ${tool}`, params);

            // Usar MCPCallDto para validar y ejecutar la herramienta
            const [error, mcpCallDto] = MCPCallDto.create({
                toolName: tool,
                arguments: params  // Usar 'arguments' en lugar de 'args'
            });

            if (error) {
                logger.error(`[MCP] Error creating MCPCallDto: ${error}`);
                return { success: false, error: `Error in tool call: ${error}` };
            }

            // Ejecutar la herramienta usando el Use Case
            const result = await this.callToolUseCase.execute(mcpCallDto!);

            return { success: true, data: result };

        } catch (error) {
            logger.error(`[MCP] Error executing tool ${tool}:`, error);
            return { success: false, error: `Error executing ${tool}: ${error}` };
        }
    }

    /**
     * Formatear el resultado de una herramienta para el usuario
     */
    private formatToolResultForUser(data: any, tool: string): string {
        try {
            switch (tool) {
                case 'get_products':
                case 'search_products':
                    return this.formatProductsResponse(data);

                case 'get_customers':
                case 'search_customers':
                    return this.formatCustomersResponse(data);

                case 'get_orders':
                    return this.formatOrdersResponse(data);

                default:
                    return `Resultados de ${tool}: ${JSON.stringify(data, null, 2)}`;
            }

        } catch (error) {
            logger.error(`[MCP] Error formatting response for tool ${tool}:`, error);
            return `Error al formatear respuesta de ${tool}`;
        }
    }

    /**
     * Formatear respuesta de productos
     */
    private formatProductsResponse(data: any): string {
        try {
            // Los datos vienen en data.content[0].text como JSON string
            let productsData;

            if (data.content && data.content[0] && data.content[0].text) {
                productsData = JSON.parse(data.content[0].text);
            } else {
                productsData = data;
            }

            if (!productsData || !productsData.products || productsData.products.length === 0) {
                return "Lo siento, actualmente no tenemos productos disponibles en nuestro inventario.";
            }

            const { products, total } = productsData;
            let response = `🍕 **Nuestros Productos Disponibles** (${total} productos en total):\n\n`;

            products.forEach((product: any, index: number) => {
                const priceWithTax = product.priceWithTax || (product.price * (1 + (product.taxRate || 0) / 100));

                response += `**${index + 1}. ${product.name}**\n`;
                response += `   📝 ${product.description}\n`;
                response += `   💰 Precio: $${priceWithTax.toFixed(2)}\n`;
                response += `   📦 Stock: ${product.stock} unidades\n`;

                if (product.category) {
                    response += `   🏷️ Categoría: ${product.category}\n`;
                }

                if (product.tags && product.tags.length > 0) {
                    response += `   🏆 Etiquetas: ${product.tags.join(', ')}\n`;
                }

                response += '\n';
            });

            response += "💬 ¿Te interesa algún producto en particular? ¡Puedo darte más información o ayudarte con tu pedido!";

            return response;

        } catch (error) {
            logger.error(`[MCP] Error parsing products data:`, error);
            return "Error al procesar la información de productos. Por favor, inténtalo de nuevo.";
        }
    }

    /**
     * Formatear respuesta de clientes
     */
    private formatCustomersResponse(data: any): string {
        if (!data || !data.items || data.items.length === 0) {
            return "No se encontraron clientes en el sistema.";
        }

        const { items, total } = data;
        let response = `👥 **Clientes Registrados** (${total} clientes en total):\n\n`;

        items.forEach((customer: any, index: number) => {
            response += `**${index + 1}. ${customer.name}**\n`;
            response += `   📧 Email: ${customer.email}\n`;
            if (customer.phone) {
                response += `   📱 Teléfono: ${customer.phone}\n`;
            }
            response += '\n';
        });

        return response;
    }

    /**
     * Formatear respuesta de pedidos
     */
    private formatOrdersResponse(data: any): string {
        if (!data || !data.items || data.items.length === 0) {
            return "No se encontraron pedidos en el sistema.";
        }

        const { items, total } = data;
        let response = `📋 **Pedidos Registrados** (${total} pedidos en total):\n\n`;

        items.forEach((order: any, index: number) => {
            response += `**${index + 1}. Pedido #${order.id}**\n`;
            response += `   💰 Total: $${order.total}\n`;
            response += `   📅 Fecha: ${new Date(order.createdAt).toLocaleDateString()}\n`;
            if (order.status) {
                response += `   📊 Estado: ${order.status}\n`;
            }
            response += '\n';
        });

        return response;
    }
}
