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
    strictMode: true,

    systemPrompts: {
        base: `Eres un asistente especializado en el sistema de e-commerce. Tu función es EXCLUSIVAMENTE ayudar con consultas relacionadas con productos, clientes, pedidos y operaciones del negocio.`,

        toolsOnly: `IMPORTANTE: Solo puedes responder preguntas que requieran el uso de las herramientas MCP disponibles. Si una pregunta no requiere usar herramientas del e-commerce, debes declinar educadamente y redirigir hacia temas del negocio.`,

        restrictions: `RESTRICCIONES ESTRICTAS:
- NO puedes responder preguntas generales que no estén relacionadas con este e-commerce
- NO puedes ayudar con temas externos al negocio (política, noticias, entretenimiento, etc.)
- NO puedes generar contenido creativo no relacionado con productos o servicios
- SOLO puedes usar las herramientas MCP proporcionadas para consultar datos del negocio
- Si no puedes usar una herramienta para responder, declina educadamente`
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
            description: 'Requiere uso de herramientas MCP',
            enabled: true,
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
        requiredTools: true
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
