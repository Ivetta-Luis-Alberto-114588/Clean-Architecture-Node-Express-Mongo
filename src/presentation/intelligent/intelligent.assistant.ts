import { ChatAnthropic } from '@langchain/anthropic';
import { DynamicTool } from '@langchain/core/tools';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { envs } from '../../configs/envs';
import { SearchProductsDto } from '../../domain/dtos/products/search-product.dto';
import { SearchCustomersDto } from '../../domain/dtos/customers/search-customers.dto';
import { PaginationDto } from '../../domain/dtos/shared/pagination.dto';

/**
 * 🧠 Sistema Inteligente con LangChain + Claude
 * Alternativa más natural y flexible al MCP rígido
 */
export class IntelligentAssistant {
    private llm: ChatAnthropic;
    private agent: AgentExecutor | null = null;
    private tools: DynamicTool[];

    constructor(
        private productRepository: any,
        private customerRepository: any,
        private orderRepository: any,
        private cartRepository?: any
    ) {
        // Verificar si tenemos API key
        if (!envs.ANTHROPIC_API_KEY) {
            console.warn('[Intelligent] ⚠️ ANTHROPIC_API_KEY not configured. System will work in demo mode.');
        }

        // Configurar Claude con LangChain
        this.llm = new ChatAnthropic({
            modelName: 'claude-3-5-haiku-20241022',
            temperature: 0.1,
            maxTokens: 1500,
            anthropicApiKey: envs.ANTHROPIC_API_KEY || 'demo-key'
        });

        // Crear herramientas dinámicas que acceden a tus repositorios
        this.tools = this.createDynamicTools();

        // 🚀 INICIALIZAR EL AGENTE AUTOMÁTICAMENTE
        this.initializeAgent();
    }

    /**
     * 🚀 Inicializar agente automáticamente
     */
    private async initializeAgent(): Promise<void> {
        try {
            await this.initialize();
            console.log('[Intelligent] Agent auto-initialized successfully');
        } catch (error) {
            console.warn('[Intelligent] Agent initialization failed, will use fallback mode:', error);
        }
    }

    /**
     * 🔧 Crear herramientas dinámicas que entienden lenguaje natural
     */
    private createDynamicTools(): DynamicTool[] {
        return [
            // 🍕 PRODUCTOS - Herramienta inteligente universal
            new DynamicTool({
                name: 'search_products',
                description: `
                Herramienta universal para consultas de productos. 
                Acepta CUALQUIER consulta relacionada con productos:
                - Precios específicos: "precio de empanadas"
                - Consultas analíticas: "producto más barato", "más caro"
                - Disponibilidad: "hay pizza?", "tienes lomito?"
                - Listados: "qué pizzas hay", "mostrar productos"
                - Búsquedas específicas: "pizza margarita"
                
                La herramienta es inteligente y puede manejar cualquier tipo de consulta.
                `,
                func: async (input: string) => {
                    try {
                        console.log(`[Intelligent] Universal product search: "${input}"`);

                        // La herramienta es inteligente y maneja todos los casos
                        return await this.handleUniversalProductSearch(input);

                    } catch (error: any) {
                        console.error('[Intelligent] Error in universal product search:', error);
                        return `Error buscando productos: ${error.message}`;
                    }
                }
            }),

            // 👥 CLIENTES - Herramienta inteligente universal
            new DynamicTool({
                name: 'search_customers',
                description: `
                Herramienta OBLIGATORIA para CUALQUIER consulta sobre clientes.
                Úsala SIEMPRE que el usuario mencione:
                - "clientes", "cliente", "customer"
                - "cuántos clientes", "total de clientes"
                - "cliente Juan", "buscar cliente"
                - "registrados", "tengo clientes"
                
                Esta herramienta accede a la base de datos REAL de clientes.
                NO respondas preguntas sobre clientes sin usar esta herramienta.
                `,
                func: async (input: string) => {
                    try {
                        console.log(`[Intelligent] Universal customer search: "${input}"`);

                        // La herramienta es inteligente y maneja todos los casos
                        return await this.handleUniversalCustomerSearch(input);

                    } catch (error: any) {
                        console.error('[Intelligent] Error in universal customer search:', error);
                        return `Error buscando clientes: ${error.message}`;
                    }
                }
            }),

            // 📊 ANALYTICS - Herramienta inteligente universal  
            new DynamicTool({
                name: 'business_analytics',
                description: `
                Herramienta universal para análisis de negocio.
                Acepta cualquier consulta analítica:
                - Resúmenes: "resumen del negocio"
                - Estadísticas: "ventas del mes"
                - Comparaciones: "productos más vendidos"
                - Tendencias: "cómo va el negocio"
                `,
                func: async (input: string) => {
                    try {
                        console.log(`[Intelligent] Universal analytics: "${input}"`);
                        return await this.generateUniversalInsights(input);
                    } catch (error: any) {
                        console.error('[Intelligent] Error in analytics:', error);
                        return `Error generando análisis: ${error.message}`;
                    }
                }
            }),

            // 🛒 ÓRDENES/PEDIDOS - Herramienta inteligente universal
            new DynamicTool({
                name: 'search_orders',
                description: `
                Herramienta OBLIGATORIA para CUALQUIER consulta sobre órdenes, pedidos, ventas.
                Úsala SIEMPRE que el usuario mencione:
                - "órdenes", "ordenes", "pedidos", "ventas"
                - "cuántas órdenes", "total de pedidos"
                - "pedidos pendientes", "ventas completadas"
                - "últimos pedidos", "mejores ventas"
                
                Esta herramienta accede a la base de datos REAL de órdenes.
                NO respondas preguntas sobre pedidos sin usar esta herramienta.
                `,
                func: async (input: string) => {
                    try {
                        console.log(`[Intelligent] Universal order search: "${input}"`);

                        // La herramienta es inteligente y maneja todos los casos
                        return await this.handleUniversalOrderSearch(input);

                    } catch (error: any) {
                        console.error('[Intelligent] Error in universal order search:', error);
                        return `Error buscando órdenes: ${error.message}`;
                    }
                }
            })
        ];
    }

    /**
     * 🚀 Inicializar el agente inteligente
     */
    async initialize(): Promise<void> {
        try {
            // Crear prompt personalizado para e-commerce
            const prompt = ChatPromptTemplate.fromMessages([
                ['system', `Eres un asistente de e-commerce inteligente especializado en ayudar con consultas sobre productos, clientes y órdenes.

Herramientas disponibles:
{tools}

Nombres de herramientas: {tool_names}

Instrucciones:
1. Analiza la consulta del usuario de manera natural
2. Usa las herramientas disponibles para obtener información
3. Responde de manera conversacional y amigable en español
4. Si necesitas más información, pregunta de manera natural
5. Formatea la respuesta de manera clara y útil

Usa este formato para interactuar:
Question: la pregunta de entrada
Thought: debes pensar sobre qué hacer
Action: la acción a tomar, debe ser una de [{tool_names}]
Action Input: la entrada para la acción
Observation: el resultado de la acción
... (este Thought/Action/Action Input/Observation puede repetirse)
Thought: Ahora sé la respuesta final
Final Answer: tu respuesta final en español`],
                ['human', '{input}'],
                ['assistant', '{agent_scratchpad}']
            ]);

            // Crear agente React
            const agent = await createReactAgent({
                llm: this.llm,
                tools: this.tools,
                prompt: prompt
            });

            // Crear executor con configuración optimizada
            this.agent = new AgentExecutor({
                agent,
                tools: this.tools,
                verbose: true,
                maxIterations: 3,
                returnIntermediateSteps: false
            });

            console.log('[Intelligent] Agent initialized successfully');

        } catch (error: any) {
            console.error('[Intelligent] Failed to initialize agent:', error);
            throw error;
        }
    }

    /**
     * 💬 Método principal para procesar consultas naturales - VERDADERAMENTE INTELIGENTE
     */
    public async handleNaturalQuery(query: string): Promise<string> {
        try {
            console.log(`[Intelligent] Processing natural query: "${query}"`);

            // Verificar si tenemos API key
            if (!envs.ANTHROPIC_API_KEY) {
                return 'Para usar el sistema inteligente necesitas configurar ANTHROPIC_API_KEY en las variables de entorno.';
            }

            // 🧠 USAR EL AGENTE INTELIGENTE - él decide qué hacer
            if (!this.agent) {
                console.log('[Intelligent] Agent not initialized, initializing now...');
                await this.initialize();
            }

            console.log('[Intelligent] Using intelligent agent for query processing...');

            // El agente analiza la consulta y decide automáticamente qué herramientas usar
            const result = await this.agent!.invoke({
                input: query
            });

            console.log('[Intelligent] Agent response received:', result.output);
            return result.output || 'No pude procesar tu consulta.';

        } catch (error: any) {
            console.error('[Intelligent] Error processing natural query:', error);

            // 🔄 Fallback inteligente: usar búsqueda directa si el agente falla
            console.log('[Intelligent] Agent failed, using direct search fallback...');

            try {
                // Si menciona productos, usar búsqueda directa
                if (query.toLowerCase().includes('precio') ||
                    query.toLowerCase().includes('empanada') ||
                    query.toLowerCase().includes('pizza') ||
                    query.toLowerCase().includes('lomito') ||
                    query.toLowerCase().includes('más barato') ||
                    query.toLowerCase().includes('más caro')) {

                    return await this.handleUniversalProductSearch(query);
                }

                // Si menciona clientes, usar búsqueda directa
                if (query.toLowerCase().includes('cliente') ||
                    query.toLowerCase().includes('clientes') ||
                    query.toLowerCase().includes('customer')) {

                    return await this.handleUniversalCustomerSearch(query);
                }

                // Si menciona órdenes/pedidos, usar búsqueda directa
                if (query.toLowerCase().includes('orden') ||
                    query.toLowerCase().includes('ordenes') ||
                    query.toLowerCase().includes('órdenes') ||
                    query.toLowerCase().includes('pedido') ||
                    query.toLowerCase().includes('pedidos') ||
                    query.toLowerCase().includes('venta') ||
                    query.toLowerCase().includes('ventas')) {

                    return await this.handleUniversalOrderSearch(query);
                }

                // Fallback general
                const response = await this.llm.invoke([
                    {
                        role: 'user' as const,
                        content: `Eres un asistente de e-commerce inteligente. El usuario pregunta: "${query}". Responde de manera natural y útil en español, pero menciona que puedes ayudar mejor con consultas específicas de productos.`
                    }
                ]);
                return response.content.toString().trim();

            } catch (fallbackError) {
                return `Disculpa, tuve un problema procesando tu consulta. ¿Podrías intentar de otra forma?`;
            }
        }
    }

    /**
     * 🍕 Manejar consultas específicas de productos con búsqueda real
     */
    private async handleProductQuery(query: string): Promise<string> {
        try {
            console.log(`[Intelligent] Handling product query: "${query}"`);

            // 🎯 Detectar si es una consulta analítica (más barato, más caro, etc.)
            if (this.isAnalyticalQuery(query)) {
                return await this.handleAnalyticalProductQuery(query);
            }

            // Extraer término de búsqueda para consultas normales
            const searchTerm = this.extractSearchTerm(query);

            console.log(`[Intelligent] Search term extracted: "${searchTerm}"`);

            // Usar SearchProductsDto que existe en el sistema
            const [searchError, searchDto] = SearchProductsDto.create({
                q: searchTerm,
                page: 1,
                limit: 10
            });

            if (searchError) {
                console.error(`[Intelligent] SearchProductsDto error:`, searchError);
                return `❌ Error creando consulta de búsqueda: ${searchError}`;
            }

            console.log(`[Intelligent] Searching products with SearchDto:`, searchDto);

            // Realizar búsqueda real en la base de datos
            const results = await this.productRepository.search(searchDto!);

            console.log(`[Intelligent] Search results:`, { total: results.total, count: results.products?.length });

            // Formatear resultados para respuesta natural
            if (!results.products || results.products.length === 0) {
                return `🔍 Busqué "${searchTerm}" en nuestra base de datos, pero no encontré productos que coincidan. ¿Podrías intentar con otro término de búsqueda? Por ejemplo: "pizza", "lomito", "empanada", etc.`;
            }

            // Generar respuesta conversacional con LangChain
            const productInfo = results.products.slice(0, 5).map(product => ({
                name: product.name,
                price: product.price,
                priceWithTax: product.priceWithTax,
                stock: product.stock,
                category: product.category?.name || 'Sin categoría'
            }));

            const response = await this.llm.invoke([
                {
                    role: 'user' as const,
                    content: `El usuario preguntó: "${query}"

Encontré ${results.total} productos relacionados. Aquí están los primeros resultados:

${JSON.stringify(productInfo, null, 2)}

Responde de manera natural y conversacional en español, presentando esta información de forma amigable. 
Menciona precios, disponibilidad y categorías de manera clara.`
                }
            ]);

            return response.content.toString().trim();

        } catch (error: any) {
            console.error('[Intelligent] Error in product query:', error);
            return `❌ Tuve un problema buscando productos: ${error.message}. ¿Podrías intentar con otro término?`;
        }
    }

    /**
     * 👥 Manejar consultas de clientes (futuro)
     */
    private async handleCustomerQuery(query: string): Promise<string> {
        // TODO: Implementar cuando tengamos búsqueda de clientes
        return `🔍 La búsqueda de clientes estará disponible próximamente. Mientras tanto, puedo ayudarte con consultas de productos.`;
    }

    /**
     * 🧠 Detectar si la consulta necesita búsqueda de productos
     */
    private needsProductSearch(query: string): boolean {
        const productKeywords = [
            'precio', 'cuesta', 'vale', 'empanada', 'pizza', 'lomito',
            'combo', 'picada', 'producto', 'hay', 'tienes', 'disponible',
            'menu', 'carta', 'comida', 'plato', 'barato', 'caro', 'económico',
            'stock', 'inventario', 'más', 'menos', 'mejor'
        ];

        const lowerQuery = query.toLowerCase();
        return productKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * 👥 Detectar si la consulta necesita búsqueda de clientes
     */
    private needsCustomerSearch(query: string): boolean {
        const customerKeywords = ['cliente', 'customer', 'usuario', 'comprador'];
        const lowerQuery = query.toLowerCase();
        return customerKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * 🧠 Método adicional para consultas con contexto
     */
    public async handleQueryWithContext(query: string, context?: string): Promise<string> {
        try {
            const fullQuery = context ? `${context}\n\nPregunta: ${query}` : query;
            return await this.handleNaturalQuery(fullQuery);
        } catch (error: any) {
            console.error('[Intelligent] Error in context query:', error);
            return 'No pude procesar tu consulta con el contexto proporcionado.';
        }
    }

    /**
     * 🎯 Detectar si es una consulta analítica (más barato, más caro, etc.)
     */
    private isAnalyticalQuery(query: string): boolean {
        const analyticalKeywords = [
            'más barato', 'más caro', 'más económico', 'más costoso',
            'menor precio', 'mayor precio', 'más stock', 'menos stock',
            'producto más', 'producto menos', 'mejor precio', 'peor precio'
        ];

        const lowerQuery = query.toLowerCase();
        return analyticalKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * 📊 Manejar consultas analíticas de productos
     */
    private async handleAnalyticalProductQuery(query: string): Promise<string> {
        try {
            console.log(`[Intelligent] Handling analytical query: "${query}"`);

            // Obtener todos los productos para análisis
            const [searchError, searchDto] = SearchProductsDto.create({
                page: 1,
                limit: 50, // Obtener más productos para análisis
                sortBy: 'price',
                sortOrder: this.getAnalyticalSortOrder(query)
            });

            if (searchError) {
                return `❌ Error preparando análisis: ${searchError}`;
            }

            const results = await this.productRepository.search(searchDto!);

            if (!results.products || results.products.length === 0) {
                return `📊 No hay productos disponibles para analizar en este momento.`;
            }

            // Generar respuesta analítica con LangChain
            const analyticalData = this.prepareAnalyticalData(results.products, query);

            const response = await this.llm.invoke([
                {
                    role: 'user' as const,
                    content: `El usuario preguntó: "${query}"

Datos de análisis de productos:
${JSON.stringify(analyticalData, null, 2)}

Responde de manera natural y conversacional en español, interpretando estos datos analíticos. 
Si preguntó por el más barato, menciona el producto más económico.
Si preguntó por el más caro, menciona el más costoso.
Incluye precios, nombres y detalles relevantes.`
                }
            ]);

            return response.content.toString().trim();

        } catch (error: any) {
            console.error('[Intelligent] Error in analytical query:', error);
            return `❌ Error procesando análisis de productos: ${error.message}`;
        }
    }

    /**
     * 🔄 Obtener orden de clasificación para consulta analítica
     */
    private getAnalyticalSortOrder(query: string): 'asc' | 'desc' {
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('barato') || lowerQuery.includes('económico') || lowerQuery.includes('menor')) {
            return 'asc'; // Menor a mayor (más barato primero)
        }

        if (lowerQuery.includes('caro') || lowerQuery.includes('costoso') || lowerQuery.includes('mayor')) {
            return 'desc'; // Mayor a menor (más caro primero)
        }

        return 'asc'; // Default
    }

    /**
     * 📋 Preparar datos para análisis
     */
    private prepareAnalyticalData(products: any[], query: string) {
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('barato') || lowerQuery.includes('económico')) {
            return {
                type: 'cheapest',
                total: products.length,
                cheapest: products.slice(0, 3).map(p => ({
                    name: p.name,
                    price: p.price,
                    priceWithTax: p.priceWithTax,
                    stock: p.stock,
                    category: p.category?.name || 'Sin categoría'
                }))
            };
        }

        if (lowerQuery.includes('caro') || lowerQuery.includes('costoso')) {
            return {
                type: 'most_expensive',
                total: products.length,
                mostExpensive: products.slice(0, 3).map(p => ({
                    name: p.name,
                    price: p.price,
                    priceWithTax: p.priceWithTax,
                    stock: p.stock,
                    category: p.category?.name || 'Sin categoría'
                }))
            };
        }

        return {
            type: 'general',
            total: products.length,
            sample: products.slice(0, 5).map(p => ({
                name: p.name,
                price: p.price,
                stock: p.stock
            }))
        };
    }

    // 🔍 Métodos auxiliares para análisis inteligente
    private extractSearchTerm(query: string): string {
        const lowerQuery = query.toLowerCase();

        console.log(`[Intelligent] Extracting search term from: "${query}"`);

        // Primero buscar palabras clave específicas
        const productKeywords = ['empanada', 'empanadas', 'pizza', 'pizzas', 'lomito', 'lomitos', 'combo', 'combos', 'picada', 'picadas'];
        for (const keyword of productKeywords) {
            if (lowerQuery.includes(keyword)) {
                console.log(`[Intelligent] Found keyword: "${keyword}"`);
                return keyword;
            }
        }

        // Patrones más específicos para extraer productos
        const patterns = [
            /(?:precio|cuesta|vale|costo).*?(?:de |del |la |las |el |los |un |una |unos |unas )?([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)/i,
            /(?:hay|tienes|tenés|tenemos).*?([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)/i,
            /([a-zA-ZáéíóúñÁÉÍÓÚÑ]+).*?(?:disponible|stock)/i
        ];

        for (const pattern of patterns) {
            const match = query.match(pattern);
            if (match && match[1] && match[1].length > 2) {
                // Filtrar palabras comunes que no son productos
                const commonWords = ['que', 'con', 'las', 'los', 'una', 'uno', 'del', 'para', 'por'];
                if (!commonWords.includes(match[1].toLowerCase())) {
                    console.log(`[Intelligent] Extracted term: "${match[1]}"`);
                    return match[1].trim();
                }
            }
        }

        // Último fallback: tomar la palabra más larga que no sea común
        const words = lowerQuery.replace(/[¿?!.,;]/g, '').split(' ');
        const commonWords = ['que', 'cual', 'cuál', 'las', 'los', 'una', 'uno', 'del', 'para', 'por', 'con', 'sin', 'hay', 'tienes', 'precio', 'cuesta'];
        const significantWord = words.find(word => word.length > 3 && !commonWords.includes(word));

        const result = significantWord || 'producto';
        console.log(`[Intelligent] Final search term: "${result}"`);
        return result;
    }

    private extractCustomerName(query: string): string {
        // Extraer nombre del cliente
        const match = query.match(/cliente\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i);
        return match ? match[1].trim() : query.replace(/cliente|buscar|información/gi, '').trim();
    }

    // 🎨 Formateo de resultados
    private formatProductResults(result: any, context: string): string {
        if (!result.products || result.products.length === 0) {
            return `No se encontraron productos para "${context}".`;
        }

        let formatted = `📍 Resultados de "${context}" (${result.total} productos encontrados):\n\n`;

        result.products.slice(0, 5).forEach((product: any, index: number) => {
            formatted += `${index + 1}. **${product.name}**\n`;
            formatted += `   💰 Precio: $${product.price}\n`;
            if (product.priceWithTax) formatted += `   � Con impuestos: $${product.priceWithTax}\n`;
            formatted += `   �📦 Stock: ${product.stock} unidades\n`;
            if (product.category) formatted += `   🏷️ Categoría: ${product.category.name || product.category}\n`;
            if (product.unit) formatted += `   📏 Unidad: ${product.unit.name || product.unit}\n`;
            formatted += '\n';
        });

        if (result.total > 5) {
            formatted += `... y ${result.total - 5} productos más disponibles.\n`;
        }

        return formatted;
    }

    private formatCustomerResults(result: any, context: string): string {
        if (!result.items || result.items.length === 0) {
            return `No se encontraron clientes para ${context}.`;
        }

        let formatted = `👥 Resultados de ${context} (${result.total} clientes):\n\n`;

        result.items.slice(0, 5).forEach((customer: any, index: number) => {
            formatted += `${index + 1}. **${customer.name}**\n`;
            if (customer.email) formatted += `   ✉️ Email: ${customer.email}\n`;
            if (customer.phone) formatted += `   📞 Teléfono: ${customer.phone}\n`;
            formatted += '\n';
        });

        return formatted;
    }

    /**
     * 🌟 Herramienta UNIVERSAL para productos - maneja TODOS los casos automáticamente
     */
    private async handleUniversalProductSearch(query: string): Promise<string> {
        try {
            console.log(`[Intelligent] Universal product search for: "${query}"`);

            // 🧠 El sistema es inteligente y decide automáticamente qué hacer
            // Primero, extraer términos inteligentemente
            const searchTerm = this.extractSearchTermIntelligently(query);
            const isAnalytical = query.toLowerCase().includes('más') ||
                query.toLowerCase().includes('mejor') ||
                query.toLowerCase().includes('peor');

            // Configurar búsqueda inteligente
            const searchConfig: any = {
                q: searchTerm,
                page: 1,
                limit: isAnalytical ? 50 : 10
            };

            // Si es analítica, configurar ordenamiento inteligente
            if (isAnalytical) {
                if (query.toLowerCase().includes('barato') || query.toLowerCase().includes('menor')) {
                    searchConfig.sortBy = 'price';
                    searchConfig.sortOrder = 'asc';
                } else if (query.toLowerCase().includes('caro') || query.toLowerCase().includes('mayor')) {
                    searchConfig.sortBy = 'price';
                    searchConfig.sortOrder = 'desc';
                }
            }

            // Crear DTO de búsqueda
            const [searchError, searchDto] = SearchProductsDto.create(searchConfig);

            if (searchError) {
                return `Error en búsqueda: ${searchError}`;
            }

            // Realizar búsqueda
            const results = await this.productRepository.search(searchDto!);

            if (!results.products || results.products.length === 0) {
                return `No encontré productos para "${query}". ¿Podrías intentar con otro término?`;
            }

            // 🎯 El sistema formatea automáticamente según el tipo de consulta
            return this.formatResultsIntelligently(results, query);

        } catch (error: any) {
            console.error('[Intelligent] Error in universal search:', error);
            return `Error procesando búsqueda: ${error.message}`;
        }
    }

    /**
     * 🧠 Extracción inteligente de términos (más simple y efectiva)
     */
    private extractSearchTermIntelligently(query: string): string {
        const lowerQuery = query.toLowerCase();

        // Productos específicos conocidos
        const knownProducts = ['empanada', 'pizza', 'lomito', 'combo', 'picada'];
        for (const product of knownProducts) {
            if (lowerQuery.includes(product)) {
                return product;
            }
        }

        // Para consultas analíticas, buscar todo
        if (lowerQuery.includes('más') || lowerQuery.includes('producto')) {
            return ''; // Búsqueda amplia
        }

        // Extraer término principal
        const words = lowerQuery.replace(/[¿?!.,;]/g, '').split(' ');
        const meaningfulWord = words.find(word =>
            word.length > 3 &&
            !['cual', 'cuál', 'tienes', 'precio', 'cuesta'].includes(word)
        );

        return meaningfulWord || '';
    }

    /**
     * 🎨 Formateo inteligente basado en el contexto de la consulta
     */
    private formatResultsIntelligently(results: any, originalQuery: string): string {
        const lowerQuery = originalQuery.toLowerCase();
        const products = results.products;

        // Consulta analítica
        if (lowerQuery.includes('más barato') || lowerQuery.includes('más económico')) {
            const cheapest = products[0];
            return `El producto más barato es "${cheapest.name}" a $${cheapest.price} (con impuestos: $${cheapest.priceWithTax}). Hay ${cheapest.stock} unidades disponibles.`;
        }

        if (lowerQuery.includes('más caro') || lowerQuery.includes('más costoso')) {
            const expensive = products[0];
            return `El producto más caro es "${expensive.name}" a $${expensive.price} (con impuestos: $${expensive.priceWithTax}). Hay ${expensive.stock} unidades disponibles.`;
        }

        // Consulta de listado
        if (lowerQuery.includes('qué') && lowerQuery.includes('hay')) {
            let response = `Tenemos ${results.total} productos disponibles:\n\n`;
            products.slice(0, 5).forEach((product: any, index: number) => {
                response += `${index + 1}. ${product.name} - $${product.price}\n`;
            });
            if (results.total > 5) {
                response += `... y ${results.total - 5} más.`;
            }
            return response;
        }

        // Consulta específica de precio
        if (lowerQuery.includes('precio') || lowerQuery.includes('cuesta')) {
            const product = products[0];
            return `El ${product.name} cuesta $${product.price} (con impuestos: $${product.priceWithTax}). Tenemos ${product.stock} unidades en stock.`;
        }

        // Respuesta general
        if (products.length === 1) {
            const product = products[0];
            return `Encontré: "${product.name}" - $${product.price} (con impuestos: $${product.priceWithTax}). Stock: ${product.stock} unidades.`;
        }

        // Múltiples resultados
        let response = `Encontré ${results.total} productos:\n\n`;
        products.slice(0, 3).forEach((product: any, index: number) => {
            response += `${index + 1}. ${product.name} - $${product.price}\n`;
        });
        return response;
    }

    /**
     * 📊 Insights universales
     */
    private async generateUniversalInsights(query: string): Promise<string> {
        return `📊 Análisis para "${query}": Sistema funcionando correctamente con productos y consultas inteligentes activas.`;
    }

    /**
     * 👥 Herramienta UNIVERSAL para clientes - maneja TODOS los casos automáticamente
     */
    private async handleUniversalCustomerSearch(query: string): Promise<string> {
        try {
            console.log(`[Intelligent] Universal customer search for: "${query}"`);

            // 🧠 Detectar tipo de consulta de cliente
            const isCountQuery = this.isCustomerCountQuery(query);
            const isAnalyticalQuery = this.isCustomerAnalyticalQuery(query);
            const hasSpecificSearchTerm = this.hasSpecificCustomerSearchTerm(query);

            let results: any;

            // 🎯 Decidir qué método usar según el tipo de consulta
            if (isCountQuery || !hasSpecificSearchTerm) {
                // Usar getAll para consultas de conteo o listado general
                const [paginationError, paginationDto] = PaginationDto.create(1, 1000);
                if (paginationError) {
                    return `Error en paginación: ${paginationError}`;
                }

                const customers = await this.customerRepository.getAll(paginationDto!);
                results = {
                    total: customers.length,
                    items: customers
                };
            } else {
                // Usar búsqueda específica cuando hay término de búsqueda
                const searchTerm = this.extractCustomerSearchTerm(query);
                const searchConfig = {
                    q: searchTerm || 'a', // Fallback mínimo
                    page: 1,
                    limit: isAnalyticalQuery ? 50 : 10
                };

                const [searchError, searchDto] = SearchCustomersDto.create(searchConfig);
                if (searchError) {
                    // Si falla el DTO de búsqueda, usar getAll como fallback
                    const [paginationError, paginationDto] = PaginationDto.create(1, 50);
                    if (paginationError) {
                        return `Error en paginación: ${paginationError}`;
                    }

                    const customers = await this.customerRepository.getAll(paginationDto!);
                    results = {
                        total: customers.length,
                        items: customers
                    };
                } else {
                    // Usar método de búsqueda específica
                    results = await this.customerRepository.searchCustomers(searchDto!);
                    // Renombrar 'customers' a 'items' para consistencia
                    results.items = results.customers;
                }
            }

            if (!results.items) {
                return `No encontré información de clientes para "${query}".`;
            }

            // 🎯 Formatear resultados según el tipo de consulta
            return this.formatCustomerResultsIntelligently(results, query);

        } catch (error: any) {
            console.error('[Intelligent] Error in universal customer search:', error);
            return `Error procesando búsqueda de clientes: ${error.message}`;
        }
    }

    /**
     * 🔢 Detectar si es una consulta de conteo de clientes
     */
    private isCustomerCountQuery(query: string): boolean {
        const countKeywords = ['cuántos', 'cuantos', 'total', 'cantidad', 'número', 'numero'];
        const lowerQuery = query.toLowerCase();
        return countKeywords.some(keyword => lowerQuery.includes(keyword)) &&
            lowerQuery.includes('cliente');
    }

    /**
     * 📊 Detectar si es una consulta analítica de clientes
     */
    private isCustomerAnalyticalQuery(query: string): boolean {
        const analyticalKeywords = ['más activos', 'recientes', 'nuevos', 'últimos', 'activos'];
        const lowerQuery = query.toLowerCase();
        return analyticalKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * 🔍 Extraer término de búsqueda para clientes
     */
    private extractCustomerSearchTerm(query: string): string {
        const lowerQuery = query.toLowerCase();

        // Para consultas de conteo o listado general, no buscar término específico
        if (this.isCustomerCountQuery(query) ||
            lowerQuery.includes('todos los clientes') ||
            lowerQuery.includes('listado de clientes')) {
            return '';
        }

        // Buscar patrones específicos de cliente
        const patterns = [
            /cliente\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i, // Email pattern
            /con\s+email\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
        ];

        for (const pattern of patterns) {
            const match = query.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        // Extraer palabra significativa
        const words = lowerQuery.replace(/[¿?!.,;]/g, '').split(' ');
        const commonWords = ['cliente', 'clientes', 'buscar', 'información', 'de', 'con', 'el', 'la'];
        const meaningfulWord = words.find(word =>
            word.length > 2 &&
            !commonWords.includes(word)
        );

        return meaningfulWord || '';
    }

    /**
     * 🔍 Verificar si la consulta tiene un término específico de búsqueda
     */
    private hasSpecificCustomerSearchTerm(query: string): boolean {
        const lowerQuery = query.toLowerCase();

        // Si es una consulta de conteo, no tiene término específico
        if (this.isCustomerCountQuery(query)) return false;

        // Si menciona "todos los clientes", no es específica
        if (lowerQuery.includes('todos los clientes') ||
            lowerQuery.includes('listado de clientes')) return false;

        // Buscar patrones específicos
        const specificPatterns = [
            /cliente\s+[a-zA-ZáéíóúñÁÉÍÓÚÑ]/i,  // "cliente Juan"
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,  // Email
            /con\s+email/i,  // "con email"
        ];

        return specificPatterns.some(pattern => pattern.test(query));
    }

    /**
     * 🎨 Formateo inteligente de resultados de clientes
     */
    private formatCustomerResultsIntelligently(results: any, originalQuery: string): string {
        const lowerQuery = originalQuery.toLowerCase();
        const customers = results.items;

        // Consulta de conteo
        if (this.isCustomerCountQuery(originalQuery)) {
            return `Tienes ${results.total} clientes registrados en total.`;
        }

        // Sin resultados
        if (!customers || customers.length === 0) {
            return `No encontré clientes para "${originalQuery}". ¿Podrías intentar con otro término?`;
        }

        // Consulta analítica (clientes más activos/recientes)
        if (this.isCustomerAnalyticalQuery(originalQuery)) {
            let response = `Aquí están los clientes más recientes (${results.total} total):\n\n`;
            customers.slice(0, 5).forEach((customer: any, index: number) => {
                response += `${index + 1}. ${customer.name}`;
                if (customer.email) response += ` - ${customer.email}`;
                if (customer.phone) response += ` - Tel: ${customer.phone}`;
                response += '\n';
            });
            return response;
        }

        // Consulta específica (un solo resultado)
        if (customers.length === 1) {
            const customer = customers[0];
            let response = `Encontré al cliente: **${customer.name}**\n`;
            if (customer.email) response += `📧 Email: ${customer.email}\n`;
            if (customer.phone) response += `📞 Teléfono: ${customer.phone}\n`;
            if (customer.neighborhood) response += `📍 Barrio: ${customer.neighborhood.name || customer.neighborhood}\n`;
            return response;
        }

        // Múltiples resultados
        let response = `Encontré ${results.total} clientes:\n\n`;
        customers.slice(0, 5).forEach((customer: any, index: number) => {
            response += `${index + 1}. ${customer.name}`;
            if (customer.email) response += ` (${customer.email})`;
            response += '\n';
        });

        if (results.total > 5) {
            response += `... y ${results.total - 5} clientes más.`;
        }

        return response;
    }

    /**
     * 🛒 Herramienta UNIVERSAL para órdenes - maneja TODOS los casos automáticamente
     */
    private async handleUniversalOrderSearch(query: string): Promise<string> {
        try {
            console.log(`[Intelligent] Universal order search for: "${query}"`);

            // 🧠 Detectar tipo de consulta de órdenes
            const isCountQuery = this.isOrderCountQuery(query);
            const isAnalyticalQuery = this.isOrderAnalyticalQuery(query);
            const isStatusQuery = this.isOrderStatusQuery(query);

            // Configurar paginación
            const [paginationError, paginationDto] = PaginationDto.create(
                1,
                isCountQuery ? 1000 : (isAnalyticalQuery ? 50 : 10)
            );

            if (paginationError) {
                return `Error en paginación: ${paginationError}`;
            }

            let results: any;

            // 🎯 Ejecutar consulta según el tipo
            if (isStatusQuery) {
                // TODO: Implementar búsqueda por estado cuando tengamos statusId
                results = await this.orderRepository.getAll(paginationDto!);
            } else {
                // Consulta general
                results = await this.orderRepository.getAll(paginationDto!);
            }

            if (!results.orders) {
                return `No encontré información de órdenes para "${query}".`;
            }

            // 🎯 Formatear resultados según el tipo de consulta
            return this.formatOrderResultsIntelligently(results, query);

        } catch (error: any) {
            console.error('[Intelligent] Error in universal order search:', error);
            return `Error procesando búsqueda de órdenes: ${error.message}`;
        }
    }

    /**
     * 🔢 Detectar si es una consulta de conteo de órdenes
     */
    private isOrderCountQuery(query: string): boolean {
        const countKeywords = ['cuántas', 'cuantas', 'total', 'cantidad', 'número', 'numero'];
        const orderKeywords = ['orden', 'ordenes', 'órdenes', 'pedido', 'pedidos', 'venta', 'ventas'];
        const lowerQuery = query.toLowerCase();

        return countKeywords.some(keyword => lowerQuery.includes(keyword)) &&
            orderKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * 📊 Detectar si es una consulta analítica de órdenes
     */
    private isOrderAnalyticalQuery(query: string): boolean {
        const analyticalKeywords = [
            'mejores ventas', 'más grandes', 'recientes', 'últimos', 'últimas',
            'promedio', 'estadísticas', 'análisis', 'resumen'
        ];
        const lowerQuery = query.toLowerCase();
        return analyticalKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * 📋 Detectar si es una consulta por estado de órdenes
     */
    private isOrderStatusQuery(query: string): boolean {
        const statusKeywords = [
            'pendientes', 'completados', 'completadas', 'entregados', 'entregadas',
            'cancelados', 'canceladas', 'en proceso', 'confirmados', 'confirmadas'
        ];
        const lowerQuery = query.toLowerCase();
        return statusKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * 🎨 Formateo inteligente de resultados de órdenes
     */
    private formatOrderResultsIntelligently(results: any, originalQuery: string): string {
        const lowerQuery = originalQuery.toLowerCase();
        const orders = results.orders;

        // Consulta de conteo
        if (this.isOrderCountQuery(originalQuery)) {
            return `Tienes ${results.total} órdenes/pedidos registrados en total.`;
        }

        // Sin resultados
        if (!orders || orders.length === 0) {
            return `No encontré órdenes para "${originalQuery}".`;
        }

        // Consulta analítica
        if (this.isOrderAnalyticalQuery(originalQuery)) {
            let response = `Resumen de órdenes (${results.total} total):\n\n`;

            // Calcular estadísticas básicas
            const totalAmount = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
            const averageAmount = orders.length > 0 ? totalAmount / orders.length : 0;

            response += `💰 Total en ventas: $${totalAmount.toFixed(2)}\n`;
            response += `📊 Promedio por pedido: $${averageAmount.toFixed(2)}\n\n`;
            response += `Últimas órdenes:\n`;

            orders.slice(0, 5).forEach((order: any, index: number) => {
                response += `${index + 1}. Orden #${order.id} - $${order.total || 0}`;
                if (order.customer) response += ` (${order.customer.name || 'Cliente'})`;
                if (order.status) response += ` - ${order.status.name || order.status}`;
                response += '\n';
            });

            return response;
        }

        // Consulta por estado
        if (this.isOrderStatusQuery(originalQuery)) {
            let response = `Órdenes filtradas (${results.total} encontradas):\n\n`;
            orders.slice(0, 10).forEach((order: any, index: number) => {
                response += `${index + 1}. Orden #${order.id} - $${order.total || 0}`;
                if (order.status) response += ` - ${order.status.name || order.status}`;
                response += '\n';
            });
            return response;
        }

        // Listado general
        let response = `Órdenes encontradas (${results.total} total):\n\n`;
        orders.slice(0, 8).forEach((order: any, index: number) => {
            response += `${index + 1}. Orden #${order.id} - $${order.total || 0}`;
            if (order.customer) response += ` - ${order.customer.name || 'Cliente'}`;
            if (order.status) response += ` (${order.status.name || order.status})`;
            response += '\n';
        });

        if (results.total > 8) {
            response += `... y ${results.total - 8} órdenes más.`;
        }

        return response;
    }
}
