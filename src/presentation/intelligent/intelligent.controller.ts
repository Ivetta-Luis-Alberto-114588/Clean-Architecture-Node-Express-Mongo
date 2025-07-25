import { Request, Response } from 'express';
import { IntelligentAssistant } from './intelligent.assistant';

// Importar repositorios existentes
import { ProductRepositoryImpl } from '../../infrastructure/repositories/products/product.repository.impl';
import { CustomerRepositoryImpl } from '../../infrastructure/repositories/customers/customer.repository.impl';
import { OrderRepositoryImpl } from '../../infrastructure/repositories/order/order.repository.impl';

// Importar datasources existentes
import { ProductMongoDataSourceImpl } from '../../infrastructure/datasources/products/product.mongo.datasource.impl';
import { CustomerMongoDataSourceImpl } from '../../infrastructure/datasources/customers/customer.mongo.datasource.impl';
import { OrderMongoDataSourceImpl } from '../../infrastructure/datasources/order/order.mongo.datasource.impl';

/**
 * 🧠 Controlador Inteligente con LangChain + Claude
 * Alternativa natural y conversacional al MCP rígido
 */
export class IntelligentController {
    private assistant: IntelligentAssistant;

    constructor() {
        // Configurar datasources
        const productDataSource = new ProductMongoDataSourceImpl();
        const customerDataSource = new CustomerMongoDataSourceImpl();
        const orderDataSource = new OrderMongoDataSourceImpl();

        // Configurar repositorios
        const productRepository = new ProductRepositoryImpl(productDataSource);
        const customerRepository = new CustomerRepositoryImpl(customerDataSource);
        const orderRepository = new OrderRepositoryImpl(orderDataSource);

        // Crear asistente inteligente
        this.assistant = new IntelligentAssistant(
            productRepository,
            customerRepository,
            orderRepository
        );
    }

    /**
     * ❌ Manejo centralizado de errores
     */
    private handleError = (error: unknown, res: Response) => {
        console.error('[Intelligent] Error:', error);

        if (error instanceof Error) {
            return res.status(500).json({
                success: false,
                error: 'Error processing request',
                details: error.message,
                system: 'langchain-claude'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Unknown error occurred',
            system: 'langchain-claude'
        });
    };

    /**
     * 🎯 Endpoint principal para consultas naturales
     */
    public chat = async (req: Request, res: Response) => {
        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required'
                });
            }

            console.log(`[Intelligent] Received query: "${message}"`);

            // Procesar consulta natural con LangChain + Claude
            const response = await this.assistant.handleNaturalQuery(message);

            return res.status(200).json({
                success: true,
                message: response,
                timestamp: new Date().toISOString(),
                system: 'langchain-claude',
                query: message
            });

        } catch (error: any) {
            console.error('[Intelligent] Error in chat endpoint:', error);

            return res.status(500).json({
                success: false,
                error: 'Error processing natural query',
                details: error.message,
                system: 'langchain-claude'
            });
        }
    };

    /**
     * 🔄 Endpoint de compatibilidad con formato Anthropic
     */
    public anthropicCompatible = async (req: Request, res: Response) => {
        try {
            const { messages } = req.body;

            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Messages array is required'
                });
            }

            // Extraer último mensaje del usuario
            const lastUserMessage = messages
                .filter(msg => msg.role === 'user')
                .pop()?.content;

            if (!lastUserMessage) {
                return res.status(400).json({
                    success: false,
                    error: 'No user message found'
                });
            }

            console.log(`[Intelligent] Anthropic-compatible query: "${lastUserMessage}"`);

            // Procesar con asistente inteligente
            const response = await this.assistant.handleNaturalQuery(lastUserMessage);

            // Devolver en formato compatible con Anthropic
            return res.status(200).json({
                id: `intelligent_${Date.now()}`,
                type: 'message',
                role: 'assistant',
                model: 'langchain-claude-3-5-haiku-20241022',
                content: [
                    {
                        type: 'text',
                        text: response
                    }
                ],
                stop_reason: 'end_turn',
                stop_sequence: null,
                usage: {
                    input_tokens: lastUserMessage.length,
                    output_tokens: response.length,
                    service_tier: 'intelligent'
                },
                _intelligent: {
                    processed: true,
                    timestamp: new Date().toISOString(),
                    system: 'langchain-claude',
                    query: lastUserMessage
                }
            });

        } catch (error: any) {
            console.error('[Intelligent] Error in Anthropic-compatible endpoint:', error);

            return res.status(500).json({
                success: false,
                error: 'Error processing natural query',
                details: error.message,
                system: 'langchain-claude'
            });
        }
    };

    /**
     * 📊 Información del sistema inteligente
     */
    public info = async (req: Request, res: Response) => {
        try {
            return res.status(200).json({
                success: true,
                system: 'Intelligent Assistant (LangChain + Claude)',
                version: '1.0.0',
                features: [
                    '🧠 Procesamiento de lenguaje natural',
                    '🔧 Herramientas dinámicas e inteligentes',
                    '🎯 Consultas flexibles sin patrones rígidos',
                    '💬 Respuestas conversacionales',
                    '📊 Analytics de negocio',
                    '🍕 Búsqueda inteligente de productos',
                    '👥 Gestión natural de clientes',
                    '📦 Consulta flexible de órdenes'
                ],
                advantages: [
                    'No requiere herramientas específicas como MCP',
                    'Entiende consultas en español natural',
                    'Claude decide automáticamente qué hacer',
                    'Respuestas más conversacionales',
                    'Fácil de extender y personalizar'
                ],
                endpoints: {
                    chat: 'POST /api/intelligent/chat - Consulta natural simple',
                    anthropic: 'POST /api/intelligent/anthropic - Compatible con formato Anthropic',
                    info: 'GET /api/intelligent/info - Información del sistema'
                },
                examples: [
                    '¿Cuál es el precio de las empanadas?',
                    '¿Tienes pizza con provenzal?',
                    'Búscame información del cliente Juan',
                    'Órdenes pendientes de hoy',
                    'Resumen del negocio'
                ]
            });

        } catch (error: any) {
            console.error('[Intelligent] Error in info endpoint:', error);

            return res.status(500).json({
                success: false,
                error: 'Error getting system info',
                details: error.message
            });
        }
    };

    /**
     * ❤️ Health check
     */
    public health = async (req: Request, res: Response) => {
        try {
            return res.status(200).json({
                success: true,
                status: 'healthy',
                system: 'langchain-claude',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });

        } catch (error: any) {
            return res.status(500).json({
                success: false,
                status: 'unhealthy',
                error: error.message
            });
        }
    };
}
