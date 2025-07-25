// src/configs/mcp-guardrails.ts

/**
 * Configuración de guardarriles para el sistema MCP
 * Define las reglas y restricciones para el uso de IA
 */

export interface GuardrailRule {
    name: string;
    description: string;
    enabled: boolean;
    severity: 'warning' | 'error' | 'block';
}

export interface MCPGuardrailsConfig {
    // Configuración general
    enabled: boolean;
    strictMode: boolean;

    // Prompts del sistema
    systemPrompts: {
        base: string;
        toolsOnly: string;
        restrictions: string;
    };

    // Reglas de contenido
    contentRules: GuardrailRule[];

    // Límites y restricciones
    limits: {
        maxTokens: number;
        maxMessagesPerSession: number;
        maxSessionDuration: number; // en minutos
        allowedTopics: string[];
        blockedKeywords: string[];
        requiredTools: boolean; // Solo permitir conversaciones que usen herramientas
    };

    // Herramientas permitidas
    allowedTools: string[];

    // Respuestas predefinidas
    responses: {
        outOfScope: string;
        toolRequired: string;
        blocked: string;
        limit: string;
    };
}

export const MCP_GUARDRAILS_CONFIG: MCPGuardrailsConfig = {
    enabled: true,
    strictMode: false, // Menos restrictivo para permitir consultas generales

    systemPrompts: {
        base: `Eres un asistente especializado en el sistema de e-commerce. Tu función es ayudar con consultas relacionadas con productos, clientes, pedidos, ventas, inventario y operaciones del negocio. Puedes responder preguntas generales sobre e-commerce y usar herramientas específicas cuando sea necesario para obtener datos exactos.`,

        toolsOnly: `HERRAMIENTAS DISPONIBLES: Tienes acceso a herramientas para consultar productos, clientes y pedidos específicos. Úsalas cuando necesites datos exactos y actualizados del negocio.`,

        restrictions: `RESTRICCIONES:
- Mantente enfocado en temas de e-commerce y operaciones comerciales
- No respondas preguntas sobre política, religión, noticias generales, entretenimiento no relacionado
- Usa las herramientas MCP disponibles cuando necesites datos específicos del negocio
- Proporciona información útil sobre e-commerce general cuando no requiera datos específicos`
    },

    contentRules: [
        {
            name: 'business_only',
            description: 'Solo temas relacionados con el e-commerce',
            enabled: true,
            severity: 'block'
        },
        {
            name: 'tool_required',
            description: 'Sugiere uso de herramientas MCP cuando sea útil',
            enabled: false, // Deshabilitado para permitir respuestas generales
            severity: 'warning'
        },
        {
            name: 'no_personal_data',
            description: 'No solicitar datos personales sensibles',
            enabled: true,
            severity: 'block'
        },
        {
            name: 'professional_tone',
            description: 'Mantener tono profesional y empresarial',
            enabled: true,
            severity: 'warning'
        }
    ],

    limits: {
        maxTokens: 1024,
        maxMessagesPerSession: 50,
        maxSessionDuration: 30, // 30 minutos
        allowedTopics: [
            'productos',
            'clientes',
            'pedidos',
            'ventas',
            'inventario',
            'categorías',
            'precios',
            'stock',
            'búsqueda',
            'filtros',
            'reportes',
            'estadísticas'
        ],
        blockedKeywords: [
            'política',
            'religión',
            'noticias',
            'entretenimiento',
            'deportes',
            'celebridades',
            'guerra',
            'violencia',
            'drogas',
            'personal',
            'privado',
            'secreto'
        ],
        requiredTools: false // Permitir consultas generales sobre e-commerce
    },

    allowedTools: [
        'get_products',
        'get_customers',
        'get_orders',
        'get_product_by_id',
        'search_products',
        'search_customers'
    ],

    responses: {
        outOfScope: 'Lo siento, solo puedo ayudarte con consultas relacionadas con nuestro e-commerce: productos, clientes, pedidos y operaciones del negocio. ¿Hay algo específico sobre nuestros productos o servicios que te gustaría consultar?',

        toolRequired: 'Para responder tu consulta necesito usar nuestras herramientas de datos del negocio. ¿Podrías reformular tu pregunta para que pueda buscar información específica sobre productos, clientes o pedidos?',

        blocked: 'No puedo ayudarte con ese tema. Mi función es asistir exclusivamente con consultas del e-commerce. ¿Te gustaría saber algo sobre nuestros productos o servicios?',

        limit: 'Has alcanzado el límite de consultas para esta sesión. Por favor, inicia una nueva conversación si necesitas más ayuda.'
    }
};
