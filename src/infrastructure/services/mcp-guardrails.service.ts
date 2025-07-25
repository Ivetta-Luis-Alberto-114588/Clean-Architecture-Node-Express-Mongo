// src/infrastructure/services/mcp-guardrails.service.ts

import { MCP_GUARDRAILS_CONFIG, MCPGuardrailsConfig } from '../../configs/mcp-guardrails';
import logger from '../../configs/logger';

export interface GuardrailValidationResult {
    allowed: boolean;
    reason?: string;
    suggestedResponse?: string;
    modifiedRequest?: any;
    warnings?: string[];
}

export interface AnthropicMessage {
    role: string;
    content: string | any[];
}

export interface AnthropicRequest {
    model: string;
    max_tokens: number;
    messages: AnthropicMessage[];
    tools?: any[];
    system?: string;
    [key: string]: any;
}

export class MCPGuardrailsService {
    private readonly config: MCPGuardrailsConfig;
    private sessionData: Map<string, {
        messageCount: number;
        startTime: number;
        lastActivity: number;
    }> = new Map();

    // Estadísticas de uso para monitoreo
    private stats = {
        totalRequests: 0,
        allowedRequests: 0,
        blockedRequests: 0,
        blockReasons: {} as Record<string, number>,
        startTime: Date.now()
    };

    constructor(config?: Partial<MCPGuardrailsConfig>) {
        this.config = { ...MCP_GUARDRAILS_CONFIG, ...config };
    }

    /**
     * Validar y procesar una request antes de enviarla a Anthropic
     */
    public validateAndProcessRequest(
        request: AnthropicRequest,
        sessionId: string = 'default'
    ): GuardrailValidationResult {

        // Incrementar contador total de requests
        this.stats.totalRequests++;

        if (!this.config.enabled) {
            this.stats.allowedRequests++;
            this.logRequest(sessionId, 'allowed', 'guardrails_disabled', request);
            return { allowed: true };
        }

        logger.info(`[Guardrails] Validating request for session: ${sessionId}`);

        // 1. Validar límites de sesión
        const sessionValidation = this.validateSession(sessionId);
        if (!sessionValidation.allowed) {
            this.stats.blockedRequests++;
            this.incrementBlockReason('session_limit');
            this.logRequest(sessionId, 'blocked', sessionValidation.reason!, request);
            return sessionValidation;
        }

        // 2. Validar contenido de mensajes
        const contentValidation = this.validateMessageContent(request.messages);
        if (!contentValidation.allowed) {
            this.stats.blockedRequests++;
            this.incrementBlockReason(contentValidation.reason!);
            this.logRequest(sessionId, 'blocked', contentValidation.reason!, request);
            return contentValidation;
        }

        // 3. Validar herramientas
        const toolsValidation = this.validateTools(request.tools);
        if (!toolsValidation.allowed) {
            this.stats.blockedRequests++;
            this.incrementBlockReason(toolsValidation.reason!);
            this.logRequest(sessionId, 'blocked', toolsValidation.reason!, request);
            return toolsValidation;
        }

        // 4. Aplicar prompts del sistema y modificaciones
        const modifiedRequest = this.applySystemPrompts(request);

        // 5. Actualizar datos de sesión
        this.updateSessionData(sessionId);

        // Request permitido - actualizar estadísticas
        this.stats.allowedRequests++;
        this.logRequest(sessionId, 'allowed', 'valid_ecommerce_query', request);

        logger.info(`[Guardrails] Request validated successfully`);

        return {
            allowed: true,
            modifiedRequest,
            warnings: contentValidation.warnings
        };
    }

    /**
     * Validar límites de sesión
     */
    private validateSession(sessionId: string): GuardrailValidationResult {
        const session = this.sessionData.get(sessionId);
        const now = Date.now();

        if (!session) {
            // Primera vez de esta sesión
            this.sessionData.set(sessionId, {
                messageCount: 1,
                startTime: now,
                lastActivity: now
            });
            return { allowed: true };
        }

        // Verificar límite de mensajes
        if (session.messageCount >= this.config.limits.maxMessagesPerSession) {
            logger.warn(`[Guardrails] Session ${sessionId} exceeded message limit`);
            return {
                allowed: false,
                reason: 'session_message_limit',
                suggestedResponse: this.config.responses.limit
            };
        }

        // Verificar duración de sesión
        const sessionDuration = (now - session.startTime) / (1000 * 60); // minutos
        if (sessionDuration > this.config.limits.maxSessionDuration) {
            logger.warn(`[Guardrails] Session ${sessionId} exceeded time limit`);
            this.sessionData.delete(sessionId); // Limpiar sesión expirada
            return {
                allowed: false,
                reason: 'session_time_limit',
                suggestedResponse: this.config.responses.limit
            };
        }

        return { allowed: true };
    }

    /**
     * Validar contenido de los mensajes
     */
    private validateMessageContent(messages: AnthropicMessage[]): GuardrailValidationResult {
        const warnings: string[] = [];
        let hasBusinessContent = false;
        let hasBlockedContent = false;

        for (const message of messages) {
            if (message.role === 'user') {
                const content = this.extractTextContent(message.content);

                // Verificar palabras bloqueadas
                const blockedWords = this.config.limits.blockedKeywords.filter(keyword =>
                    content.toLowerCase().includes(keyword.toLowerCase())
                );

                if (blockedWords.length > 0) {
                    logger.warn(`[Guardrails] Blocked keywords detected: ${blockedWords.join(', ')}`);
                    hasBlockedContent = true;
                }

                // Verificar temas permitidos
                const allowedTopics = this.config.limits.allowedTopics.filter(topic =>
                    content.toLowerCase().includes(topic.toLowerCase())
                );

                if (allowedTopics.length > 0) {
                    hasBusinessContent = true;
                }
            }
        }

        // Si hay contenido bloqueado
        if (hasBlockedContent) {
            return {
                allowed: false,
                reason: 'blocked_content',
                suggestedResponse: this.config.responses.blocked
            };
        }

        // Si está en modo estricto y no hay contenido de negocio
        if (this.config.strictMode && !hasBusinessContent) {
            warnings.push('No business-related content detected');

            // Si requiere herramientas y no hay contenido de negocio
            if (this.config.limits.requiredTools) {
                return {
                    allowed: false,
                    reason: 'no_business_content',
                    suggestedResponse: this.config.responses.outOfScope
                };
            }
        }

        return { allowed: true, warnings };
    }

    /**
     * Validar herramientas
     */
    private validateTools(tools?: any[]): GuardrailValidationResult {
        if (!tools || tools.length === 0) {
            if (this.config.limits.requiredTools) {
                logger.warn(`[Guardrails] No tools provided but tools are required`);
                return {
                    allowed: false,
                    reason: 'tools_required',
                    suggestedResponse: this.config.responses.toolRequired
                };
            }
            return { allowed: true };
        }

        // Verificar que todas las herramientas estén permitidas
        for (const tool of tools) {
            if (!this.config.allowedTools.includes(tool.name)) {
                logger.warn(`[Guardrails] Unauthorized tool requested: ${tool.name}`);
                return {
                    allowed: false,
                    reason: 'unauthorized_tool',
                    suggestedResponse: `La herramienta "${tool.name}" no está autorizada. Herramientas disponibles: ${this.config.allowedTools.join(', ')}`
                };
            }
        }

        return { allowed: true };
    }

    /**
     * Aplicar prompts del sistema
     */
    private applySystemPrompts(request: AnthropicRequest): AnthropicRequest {
        const systemPrompt = [
            this.config.systemPrompts.base,
            this.config.systemPrompts.toolsOnly,
            this.config.systemPrompts.restrictions
        ].join('\n\n');

        return {
            ...request,
            system: systemPrompt,
            max_tokens: Math.min(request.max_tokens || 1024, this.config.limits.maxTokens)
        };
    }

    /**
     * Actualizar datos de sesión
     */
    private updateSessionData(sessionId: string): void {
        const session = this.sessionData.get(sessionId);
        if (session) {
            session.messageCount++;
            session.lastActivity = Date.now();
        }
    }

    /**
     * Extraer texto de contenido (puede ser string o array)
     */
    private extractTextContent(content: string | any[]): string {
        if (typeof content === 'string') {
            return content;
        }

        if (Array.isArray(content)) {
            return content
                .filter(item => item.type === 'text')
                .map(item => item.text || '')
                .join(' ');
        }

        return '';
    }

    /**
     * Limpiar sesiones expiradas
     */
    public cleanExpiredSessions(): void {
        const now = Date.now();
        const expiredSessionIds: string[] = [];

        for (const [sessionId, session] of this.sessionData.entries()) {
            const sessionAge = (now - session.startTime) / (1000 * 60); // minutos
            if (sessionAge > this.config.limits.maxSessionDuration) {
                expiredSessionIds.push(sessionId);
            }
        }

        expiredSessionIds.forEach(sessionId => {
            this.sessionData.delete(sessionId);
            logger.info(`[Guardrails] Cleaned expired session: ${sessionId}`);
        });
    }

    /**
     * Obtener estadísticas de sesiones
     */
    public getSessionStats(): any {
        return {
            activeSessions: this.sessionData.size,
            sessions: Array.from(this.sessionData.entries()).map(([id, data]) => ({
                id,
                messageCount: data.messageCount,
                duration: (Date.now() - data.startTime) / (1000 * 60), // minutos
                lastActivity: new Date(data.lastActivity).toISOString()
            }))
        };
    }

    /**
     * Obtener estadísticas completas de guardarriles
     */
    public getDetailedStats(): any {
        const uptime = (Date.now() - this.stats.startTime) / (1000 * 60); // minutos

        return {
            activeSessions: this.sessionData.size,
            totalRequests: this.stats.totalRequests,
            allowedRequests: this.stats.allowedRequests,
            blockedRequests: this.stats.blockedRequests,
            blockReasons: this.stats.blockReasons,
            allowedRate: this.stats.totalRequests > 0 ?
                (this.stats.allowedRequests / this.stats.totalRequests * 100).toFixed(2) + '%' : '0%',
            uptime: `${uptime.toFixed(1)} minutos`,
            topSessionIds: Array.from(this.sessionData.entries())
                .sort((a, b) => b[1].messageCount - a[1].messageCount)
                .slice(0, 10)
                .map(([id, data]) => ({ id, messageCount: data.messageCount }))
        };
    }

    /**
     * Logging detallado de requests
     */
    private logRequest(
        sessionId: string,
        action: 'allowed' | 'blocked',
        reason: string,
        request: AnthropicRequest
    ): void {
        const logData = {
            timestamp: new Date().toISOString(),
            sessionId,
            action,
            reason,
            model: request.model,
            messageCount: request.messages.length,
            hasTools: !!request.tools && request.tools.length > 0,
            toolsUsed: request.tools?.map(t => t.name) || [],
            queryType: this.classifyQuery(request.messages),
            service: 'mcp-guardrails'
        };

        if (action === 'allowed') {
            logger.info('MCP Guardrails - Request processed', logData);
        } else {
            logger.warn('MCP Guardrails - Request blocked', logData);
        }
    }

    /**
     * Incrementar contador de razones de bloqueo
     */
    private incrementBlockReason(reason: string): void {
        this.stats.blockReasons[reason] = (this.stats.blockReasons[reason] || 0) + 1;
    }

    /**
     * Clasificar tipo de consulta para logging
     */
    private classifyQuery(messages: AnthropicMessage[]): string {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || typeof lastMessage.content !== 'string') {
            return 'unknown';
        }

        const content = lastMessage.content.toLowerCase();

        if (content.includes('busca') || content.includes('search') || content.includes('encuentra')) {
            return 'search_query';
        }
        if (content.includes('producto') || content.includes('lomito') || content.includes('empanada')) {
            return 'product_query';
        }
        if (content.includes('cliente') || content.includes('customer')) {
            return 'customer_query';
        }
        if (content.includes('pedido') || content.includes('order')) {
            return 'order_query';
        }
        if (content.includes('precio') || content.includes('price') || content.includes('costo')) {
            return 'pricing_query';
        }

        return 'general_ecommerce';
    }

    /**
     * Reiniciar estadísticas
     */
    public resetStats(): void {
        this.stats = {
            totalRequests: 0,
            allowedRequests: 0,
            blockedRequests: 0,
            blockReasons: {},
            startTime: Date.now()
        };
        logger.info('[Guardrails] Statistics reset');
    }

    /**
     * Reiniciar sesión específica
     */
    public resetSession(sessionId: string): void {
        this.sessionData.delete(sessionId);
        logger.info(`[Guardrails] Session reset: ${sessionId}`);
    }

    /**
     * Obtener configuración actual
     */
    public getConfig(): MCPGuardrailsConfig {
        return { ...this.config };
    }
}
