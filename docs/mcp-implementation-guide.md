# Guía Práctica para Replicar el Sistema MCP Inteligente

## Template de Implementación

Esta guía proporciona templates y ejemplos concretos para implementar un sistema similar de detección inteligente de herramientas MCP en cualquier proyecto.

---

## 1. Estructura de Carpetas Base

```
src/
├── presentation/
│   └── mcp/
│       ├── controller.mcp.ts      # Controlador principal con IA
│       └── routes.mcp.ts          # Configuración de rutas
├── domain/
│   ├── use-cases/mcp/
│   │   ├── call-tool.use-case.ts  # Lógica de ejecución
│   │   └── list-tools.use-case.ts # Lógica de listado
│   ├── repositories/
│   │   └── mcp.repository.ts      # Interface
│   ├── entities/
│   │   └── [tu-entidad].entity.ts # Entidades de dominio
│   └── dtos/
│       └── pagination.dto.ts      # DTOs compartidos
├── infrastructure/
│   ├── repositories/mcp/
│   │   └── mcp.repository.impl.ts # Implementación
│   ├── datasources/mcp/
│   │   └── mcp.datasource.impl.ts # Orquestador principal
│   ├── repositories/[tu-dominio]/
│   │   └── [tu-dominio].repository.impl.ts
│   ├── datasources/[tu-dominio]/
│   │   └── [tu-dominio].mongo.datasource.impl.ts
│   └── mappers/[tu-dominio]/
│       └── [tu-dominio].mapper.ts
└── data/mongodb/models/
    └── [tu-dominio].model.ts
```

---

## 2. Template del Controlador Principal

### `controller.mcp.ts` - Template Base

```typescript
import { Request, Response } from 'express';
import { logger } from '../../configs/logger';

export class MCPController {
    constructor(
        private listToolsUseCase: ListToolsUseCase,
        private callToolUseCase: CallToolUseCase,
        enableCleanupInterval: boolean = true
    ) {}

    /**
     * 🎯 MÉTODO PRINCIPAL - Chat con Detección Inteligente
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

            // 1. Detectar herramientas requeridas
            const requiredTools = this.detectRequiredTools(message);
            
            if (requiredTools.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Lo siento, no pude entender tu consulta. ¿Podrías ser más específico?'
                });
            }

            // 2. Ejecutar la primera herramienta detectada
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

    /**
     * 🧠 DETECCIÓN INTELIGENTE DE HERRAMIENTAS
     * Personaliza esta función según tu dominio
     */
    private detectRequiredTools(message: string): string[] {
        const lowerMessage = message.toLowerCase();
        
        // === TU DOMINIO 1 - Específico ===
        const domain1SearchTerm = this.extractDomain1SearchTerm(lowerMessage);
        if (domain1SearchTerm) {
            logger.info(`[MCP] Detected specific domain1 search: "${domain1SearchTerm}" -> using search_domain1`);
            return ['search_domain1'];
        }
        
        // === TU DOMINIO 1 - General ===
        if (lowerMessage.includes('domain1') || lowerMessage.includes('listar')) {
            logger.info(`[MCP] Detected general domain1 query -> using get_domain1`);
            return ['get_domain1'];
        }
        
        // === TU DOMINIO 2 - Específico ===
        const domain2SearchTerm = this.extractDomain2SearchTerm(lowerMessage);
        if (domain2SearchTerm) {
            logger.info(`[MCP] Detected specific domain2 search: "${domain2SearchTerm}" -> using search_domain2`);
            return ['search_domain2'];
        }
        
        // === TU DOMINIO 2 - General ===
        if (lowerMessage.includes('domain2')) {
            logger.info(`[MCP] Detected general domain2 query -> using get_domain2`);
            return ['get_domain2'];
        }
        
        return []; // No tool detected
    }

    /**
     * 🔍 EXTRACCIÓN DE TÉRMINOS ESPECÍFICOS
     * Personaliza los patrones regex según tu caso de uso
     */
    private extractDomain1SearchTerm(message: string): string | null {
        const patterns = [
            // Personaliza estos patrones según tu dominio
            /(?:buscar (?:en )?domain1\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
            /(?:información (?:de |sobre )?(?:el |la )?domain1\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
            /(?:datos (?:del |de la )?domain1\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                const searchTerm = match[1].trim();
                if (this.isValidDomain1Term(searchTerm)) {
                    return searchTerm;
                }
            }
        }

        return null;
    }

    private extractDomain2SearchTerm(message: string): string | null {
        // Similar al anterior, personaliza según tu dominio
        const patterns = [
            /(?:buscar (?:en )?domain2\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
            // ... más patrones
        ];

        // Implementa lógica similar
        return null;
    }

    /**
     * ✅ VALIDACIÓN DE TÉRMINOS
     * Define qué términos son válidos para cada dominio
     */
    private isValidDomain1Term(term: string): boolean {
        // Opción 1: Lista predefinida
        const validTerms = ['term1', 'term2', 'term3'];
        const lowerTerm = term.toLowerCase();
        return validTerms.some(validTerm => 
            lowerTerm.includes(validTerm) || validTerm.includes(lowerTerm)
        );
        
        // Opción 2: Validación por longitud y contenido
        // return term.length >= 2 && !/^\d+$/.test(term) && !/^[\s\.,;!?]+$/.test(term);
    }

    private isValidDomain2Term(term: string): boolean {
        // Implementa según tu lógica de validación
        return term.length >= 2 && /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(term);
    }

    /**
     * 📝 EXTRACCIÓN DE PARÁMETROS
     * Construye parámetros específicos para cada herramienta
     */
    private extractParametersFromMessage(message: string, tool: string): any {
        const params: any = {};

        switch (tool) {
            case 'search_domain1':
                const domain1Term = this.extractDomain1SearchTerm(message);
                if (domain1Term) {
                    params.q = domain1Term;
                    params.page = 1;
                    params.limit = 10;
                }
                break;
                
            case 'get_domain1':
                params.page = 1;
                params.limit = 10;
                break;
                
            case 'search_domain2':
                const domain2Term = this.extractDomain2SearchTerm(message);
                if (domain2Term) {
                    params.q = domain2Term;
                    params.page = 1;
                    params.limit = 10;
                }
                break;
                
            case 'get_domain2':
                params.page = 1;
                params.limit = 10;
                break;
        }

        return params;
    }

    /**
     * ⚡ EJECUCIÓN AUTOMÁTICA
     */
    private async executeToolAutomatically(tool: string, params: any): Promise<{success: boolean, data?: any, error?: string}> {
        try {
            logger.info(`[MCP] Executing tool: ${tool} with params:`, params);
            
            const result = await this.callToolUseCase.execute(tool, params);
            
            logger.info(`[MCP] Tool ${tool} executed successfully`);
            return { success: true, data: result };
            
        } catch (error) {
            logger.error(`[MCP] Error executing tool ${tool}:`, error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    /**
     * 🎨 FORMATEO DE RESPUESTAS
     */
    private formatToolResultForUser(data: any, tool: string): string {
        try {
            switch (tool) {
                case 'get_domain1':
                case 'search_domain1':
                    return this.formatDomain1Response(data);

                case 'get_domain2':
                case 'search_domain2':
                    return this.formatDomain2Response(data);

                default:
                    return `Resultados de ${tool}: ${JSON.stringify(data, null, 2)}`;
            }

        } catch (error) {
            logger.error(`[MCP] Error formatting response for tool ${tool}:`, error);
            return `Error al formatear respuesta de ${tool}`;
        }
    }

    /**
     * 🎨 FORMATEO ESPECÍFICO POR DOMINIO
     */
    private formatDomain1Response(data: any): string {
        try {
            if (!data || !data.items || data.items.length === 0) {
                return "No se encontraron elementos en el dominio 1.";
            }

            const { items, total } = data;
            let response = `🎯 **Elementos del Dominio 1** (${total} elementos en total):\n\n`;

            items.forEach((item: any, index: number) => {
                response += `**${index + 1}. ${item.name}**\n`;
                response += `   📝 ${item.description}\n`;
                response += `   ℹ️ Info adicional: ${item.additionalInfo}\n`;
                response += '\n';
            });

            response += "💬 ¿Necesitas más información sobre algún elemento?";
            return response;

        } catch (error) {
            logger.error(`[MCP] Error parsing domain1 data:`, error);
            return "Error al procesar la información del dominio 1.";
        }
    }

    private formatDomain2Response(data: any): string {
        // Implementa según tu dominio
        return "Implementar formateo para dominio 2";
    }
}
```

---

## 3. Template del DataSource Principal

### `mcp.datasource.impl.ts` - Orquestador de Herramientas

```typescript
import { MCPDataSource } from '../../domain/datasources/mcp.datasource';
import { PaginationDto } from '../../domain/dtos/shared/pagination.dto';

export class MCPDataSourceImpl implements MCPDataSource {
    constructor(
        private domain1Repository: Domain1Repository,
        private domain2Repository: Domain2Repository,
        // Agrega más repositorios según necesites
    ) {}

    /**
     * 📋 LISTAR HERRAMIENTAS DISPONIBLES
     */
    async listTools(): Promise<any> {
        return {
            tools: [
                {
                    name: "get_domain1",
                    description: "Lista general de elementos del dominio 1 con paginación",
                    input_schema: {
                        type: "object",
                        properties: {
                            page: {
                                type: "number",
                                description: "Número de página (default: 1)"
                            },
                            limit: {
                                type: "number", 
                                description: "Elementos por página (default: 10)"
                            }
                        }
                    }
                },
                {
                    name: "search_domain1",
                    description: "Búsqueda específica de elementos del dominio 1 por nombre o criterios",
                    input_schema: {
                        type: "object",
                        properties: {
                            q: {
                                type: "string",
                                description: "Término de búsqueda"
                            },
                            page: {
                                type: "number",
                                description: "Número de página (default: 1)"
                            },
                            limit: {
                                type: "number",
                                description: "Elementos por página (default: 10)"
                            }
                        },
                        required: ["q"]
                    }
                },
                // Agrega más herramientas aquí
                {
                    name: "get_domain2",
                    description: "Lista general de elementos del dominio 2",
                    input_schema: {
                        type: "object",
                        properties: {
                            page: { type: "number" },
                            limit: { type: "number" }
                        }
                    }
                },
                {
                    name: "search_domain2", 
                    description: "Búsqueda específica en dominio 2",
                    input_schema: {
                        type: "object",
                        properties: {
                            q: { type: "string" },
                            page: { type: "number" },
                            limit: { type: "number" }
                        },
                        required: ["q"]
                    }
                }
            ]
        };
    }

    /**
     * ⚡ ROUTER PRINCIPAL DE HERRAMIENTAS
     */
    async callTool(toolName: string, params: any): Promise<any> {
        switch (toolName) {
            case 'get_domain1':
                return await this.getDomain1Items(params);
            case 'search_domain1':
                return await this.searchDomain1Items(params);
            case 'get_domain2':
                return await this.getDomain2Items(params);
            case 'search_domain2':
                return await this.searchDomain2Items(params);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    /**
     * 🎯 IMPLEMENTACIONES DE HERRAMIENTAS ESPECÍFICAS
     */
    private async getDomain1Items(params: any): Promise<any> {
        try {
            const { page = 1, limit = 10 } = params;
            
            // Crear DTO de paginación
            const [paginationError, pagination] = PaginationDto.create(page, limit);
            if (paginationError) {
                throw new Error(paginationError);
            }

            // Llamar al repository
            const result = await this.domain1Repository.getPaginated(pagination!);

            return {
                items: result.items,
                total: result.total,
                page,
                limit
            };

        } catch (error) {
            logger.error('[MCPDataSource] Error in getDomain1Items:', error);
            throw new Error(`Error getting domain1 items: ${error}`);
        }
    }

    private async searchDomain1Items(params: any): Promise<any> {
        try {
            const { q, page = 1, limit = 10 } = params;

            // Validar parámetros requeridos
            if (!q) {
                throw new Error('Search query (q) is required');
            }

            // Crear DTO de paginación
            const [paginationError, pagination] = PaginationDto.create(page, limit);
            if (paginationError) {
                throw new Error(paginationError);
            }

            // Ejecutar búsqueda
            const result = await this.domain1Repository.searchByQuery(q, pagination!);

            return {
                items: result.items,
                total: result.total,
                page,
                limit,
                query: q
            };

        } catch (error) {
            logger.error('[MCPDataSource] Error in searchDomain1Items:', error);
            throw new Error(`Error searching domain1 items: ${error}`);
        }
    }

    private async getDomain2Items(params: any): Promise<any> {
        // Implementa similar a getDomain1Items
        // ...
    }

    private async searchDomain2Items(params: any): Promise<any> {
        // Implementa similar a searchDomain1Items
        // ...
    }
}
```

---

## 4. Template de Repository

### `[tu-dominio].repository.impl.ts`

```typescript
import { Domain1Repository } from '../../../domain/repositories/domain1.repository';
import { Domain1DataSource } from '../../../domain/datasources/domain1.datasource';
import { Domain1Entity } from '../../../domain/entities/domain1.entity';
import { PaginationDto } from '../../../domain/dtos/shared/pagination.dto';

export class Domain1RepositoryImpl implements Domain1Repository {
    constructor(private datasource: Domain1DataSource) {}

    async getPaginated(pagination: PaginationDto): Promise<{items: Domain1Entity[], total: number}> {
        return await this.datasource.getPaginated(pagination);
    }

    async searchByQuery(query: string, pagination: PaginationDto): Promise<{items: Domain1Entity[], total: number}> {
        return await this.datasource.searchByQuery(query, pagination);
    }

    async findById(id: string): Promise<Domain1Entity | null> {
        return await this.datasource.findById(id);
    }

    // Agrega más métodos según necesites
}
```

---

## 5. Template de DataSource MongoDB

### `[tu-dominio].mongo.datasource.impl.ts`

```typescript
import { Domain1DataSource } from '../../../domain/datasources/domain1.datasource';
import { Domain1Entity } from '../../../domain/entities/domain1.entity';
import { PaginationDto } from '../../../domain/dtos/shared/pagination.dto';
import { Domain1Model } from '../../../data/mongodb/models/domain1.model';
import { Domain1Mapper } from '../../mappers/domain1/domain1.mapper';
import { logger } from '../../../configs/logger';

export class Domain1MongoDataSourceImpl implements Domain1DataSource {

    async getPaginated(pagination: PaginationDto): Promise<{items: Domain1Entity[], total: number}> {
        try {
            // Filtro base (personaliza según tu lógica)
            const filter = { isActive: true };

            // Contar total
            const total = await Domain1Model.countDocuments(filter);

            // Obtener documentos con paginación
            const documents = await Domain1Model
                .find(filter)
                .populate('relatedField1')  // Personaliza según tus relaciones
                .populate('relatedField2')
                .sort({ createdAt: -1 })    // Personaliza el ordenamiento
                .skip((pagination.page - 1) * pagination.limit)
                .limit(pagination.limit);

            // Mapear a entidades de dominio
            const items = documents.map(Domain1Mapper.fromObjectToEntity);

            return { items, total };

        } catch (error) {
            logger.error('[Domain1MongoDataSource] Error in getPaginated:', error);
            throw new Error(`Error getting paginated domain1 items: ${error}`);
        }
    }

    async searchByQuery(query: string, pagination: PaginationDto): Promise<{items: Domain1Entity[], total: number}> {
        try {
            // Construir filtro de búsqueda (personaliza según tus campos)
            const searchFilter = {
                $and: [
                    { isActive: true },
                    {
                        $or: [
                            { name: { $regex: query, $options: 'i' } },
                            { description: { $regex: query, $options: 'i' } },
                            // Agrega más campos de búsqueda
                        ]
                    }
                ]
            };

            // Contar total con filtro
            const total = await Domain1Model.countDocuments(searchFilter);

            // Obtener documentos filtrados
            const documents = await Domain1Model
                .find(searchFilter)
                .populate('relatedField1')
                .populate('relatedField2')
                .sort({ 
                    // Puntuación de relevancia (opcional)
                    score: { $meta: "textScore" },
                    createdAt: -1 
                })
                .skip((pagination.page - 1) * pagination.limit)
                .limit(pagination.limit);

            // Mapear a entidades
            const items = documents.map(Domain1Mapper.fromObjectToEntity);

            return { items, total };

        } catch (error) {
            logger.error('[Domain1MongoDataSource] Error in searchByQuery:', error);
            throw new Error(`Error searching domain1 items: ${error}`);
        }
    }

    async findById(id: string): Promise<Domain1Entity | null> {
        try {
            const document = await Domain1Model
                .findById(id)
                .populate('relatedField1')
                .populate('relatedField2');

            return document ? Domain1Mapper.fromObjectToEntity(document) : null;

        } catch (error) {
            logger.error('[Domain1MongoDataSource] Error in findById:', error);
            throw new Error(`Error finding domain1 item by id: ${error}`);
        }
    }
}
```

---

## 6. Template de Configuración de Rutas

### `routes.mcp.ts`

```typescript
import { Router, Request, Response } from "express";
import { MCPController } from "./controller.mcp";

// Importar Use Cases
import { ListToolsUseCase } from "../../domain/use-cases/mcp/list-tools.use-case";
import { CallToolUseCase } from "../../domain/use-cases/mcp/call-tool.use-case";

// Importar Repositories e Implementaciones MCP
import { MCPRepositoryImpl } from "../../infrastructure/repositories/mcp/mcp.repository.impl";
import { MCPDataSourceImpl } from "../../infrastructure/datasources/mcp/mcp.datasource.impl";

// Importar tus dominios específicos
import { Domain1RepositoryImpl } from "../../infrastructure/repositories/domain1/domain1.repository.impl";
import { Domain2RepositoryImpl } from "../../infrastructure/repositories/domain2/domain2.repository.impl";
import { Domain1MongoDataSourceImpl } from "../../infrastructure/datasources/domain1/domain1.mongo.datasource.impl";
import { Domain2MongoDataSourceImpl } from "../../infrastructure/datasources/domain2/domain2.mongo.datasource.impl";

export class MCPRoutes {
    static get getMCPRoutes(): Router {
        const router = Router();

        // 1. Configurar datasources específicos
        const domain1DataSource = new Domain1MongoDataSourceImpl();
        const domain2DataSource = new Domain2MongoDataSourceImpl();
        // Agrega más datasources según necesites

        // 2. Configurar repositorios específicos
        const domain1Repository = new Domain1RepositoryImpl(domain1DataSource);
        const domain2Repository = new Domain2RepositoryImpl(domain2DataSource);
        // Agrega más repositorios según necesites

        // 3. Configurar MCP datasource y repository
        const mcpDataSource = new MCPDataSourceImpl(
            domain1Repository,
            domain2Repository
            // Agrega más repositorios aquí
        );
        const mcpRepository = new MCPRepositoryImpl(mcpDataSource);

        // 4. Configurar use cases
        const listToolsUseCase = new ListToolsUseCase(mcpRepository);
        const callToolUseCase = new CallToolUseCase(mcpRepository);

        // 5. Inicializar el controlador MCP
        const isTestEnvironment = process.env.NODE_ENV === 'test';
        const controller = new MCPController(
            listToolsUseCase, 
            callToolUseCase, 
            !isTestEnvironment
        );

        // 6. Configurar rutas

        // Ruta principal para chat inteligente
        router.post('/chat', (req: Request, res: Response) => { 
            controller.handleChatMessage(req, res) 
        });

        // Rutas adicionales de utilidad
        router.get('/health', (req: Request, res: Response) => { 
            controller.health(req, res) 
        });
        
        router.get('/tools', (req: Request, res: Response) => { 
            controller.listTools(req, res) 
        });
        
        router.get('/tools/info', (req: Request, res: Response) => { 
            controller.getToolsInfo(req, res) 
        });
        
        router.post('/tools/call', (req: Request, res: Response) => { 
            controller.callTool(req, res) 
        });

        return router;
    }
}
```

---

## 7. Template de Modelo MongoDB

### `[tu-dominio].model.ts`

```typescript
import { Schema, model } from 'mongoose';

const domain1Schema = new Schema({
    name: { 
        type: String, 
        required: true,
        index: true // Para búsquedas rápidas
    },
    description: { 
        type: String, 
        required: true 
    },
    // Personaliza según tu dominio
    category: { 
        type: Schema.Types.ObjectId, 
        ref: 'Category' 
    },
    tags: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Tag' 
    }],
    isActive: { 
        type: Boolean, 
        default: true,
        index: true
    },
    // Agrega más campos según necesites
    additionalInfo: String,
    priority: { 
        type: Number, 
        default: 0 
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para búsqueda de texto
domain1Schema.index({ 
    name: 'text', 
    description: 'text' 
}, {
    weights: {
        name: 10,      // Más peso al nombre
        description: 5 // Menos peso a la descripción
    }
});

// Índices compuestos para consultas frecuentes
domain1Schema.index({ isActive: 1, createdAt: -1 });

// Virtual para campos calculados (opcional)
domain1Schema.virtual('displayName').get(function() {
    return `${this.name} (${this.category?.name || 'Sin categoría'})`;
});

export const Domain1Model = model('Domain1', domain1Schema);
```

---

## 8. Template de Mapper

### `[tu-dominio].mapper.ts`

```typescript
import { Domain1Entity } from '../../../domain/entities/domain1.entity';

export class Domain1Mapper {
    static fromObjectToEntity(object: any): Domain1Entity {
        return new Domain1Entity(
            object._id?.toString() || object.id,
            object.name,
            object.description,
            object.category?.name || object.category,
            object.tags?.map((tag: any) => tag.name || tag) || [],
            object.isActive !== false,
            object.additionalInfo,
            object.priority || 0,
            object.createdAt,
            object.updatedAt
        );
    }

    static fromEntityToObject(entity: Domain1Entity): any {
        return {
            name: entity.name,
            description: entity.description,
            category: entity.category,
            tags: entity.tags,
            isActive: entity.isActive,
            additionalInfo: entity.additionalInfo,
            priority: entity.priority
        };
    }
}
```

---

## 9. Template de Entidad de Dominio

### `[tu-dominio].entity.ts`

```typescript
export class Domain1Entity {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly description: string,
        public readonly category: string,
        public readonly tags: string[],
        public readonly isActive: boolean,
        public readonly additionalInfo?: string,
        public readonly priority: number = 0,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date
    ) {}

    // Métodos de negocio (opcional)
    public isHighPriority(): boolean {
        return this.priority >= 5;
    }

    public hasTag(tagName: string): boolean {
        return this.tags.includes(tagName);
    }

    public getDisplayName(): string {
        return `${this.name} (${this.category})`;
    }
}
```

---

## 10. Script de Test

### `test-intelligent-system.js`

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function sendMCPQuery(message) {
    try {
        console.log(`🤖 Enviando consulta: "${message}"`);
        console.log('=' .repeat(50));
        
        const response = await axios.post(`${BASE_URL}/api/mcp/chat`, {
            message: message
        });

        if (response.data.success) {
            console.log('✅ Respuesta exitosa:');
            console.log(response.data.message);
            console.log(`🔧 Herramienta usada: ${response.data.tool_used}`);
            console.log(`📋 Parámetros: ${JSON.stringify(response.data.tool_params)}`);
        } else {
            console.log('❌ Error en la respuesta:');
            console.log(response.data.error);
        }
        
        console.log('\n' + '=' .repeat(80) + '\n');
        
    } catch (error) {
        console.error('❌ Error en la petición:', error.response?.data || error.message);
        console.log('\n' + '=' .repeat(80) + '\n');
    }
}

async function testIntelligentSystem() {
    console.log('🔍 PROBANDO SISTEMA DE DETECCIÓN INTELIGENTE');
    console.log('=' .repeat(80));
    
    // Personaliza estas consultas según tu dominio
    const testQueries = [
        // Consultas específicas
        'buscar en domain1 elemento específico',
        'información sobre domain2 item importante',
        
        // Consultas generales
        'muéstrame todos los elementos de domain1',
        'lista todos los domain2',
        
        // Consultas complejas
        'busco domain1 con características especiales',
        'elementos de domain2 con alta prioridad'
    ];
    
    for (const query of testQueries) {
        await sendMCPQuery(query);
        // Esperar un poco entre consultas
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✨ Pruebas completadas');
}

// Ejecutar las pruebas
testIntelligentSystem().catch(console.error);
```

---

## 11. Checklist de Implementación

### ✅ Pasos para Implementar tu Sistema

1. **📁 Estructura Base**
   - [ ] Crear estructura de carpetas
   - [ ] Configurar imports y exports

2. **🎯 Definir tu Dominio**
   - [ ] Identificar entidades principales
   - [ ] Definir herramientas necesarias (get_X, search_X)
   - [ ] Crear lista de términos válidos de búsqueda

3. **🧠 Configurar Detección Inteligente**
   - [ ] Personalizar `detectRequiredTools()`
   - [ ] Crear métodos `extractXSearchTerm()`
   - [ ] Definir patrones regex específicos
   - [ ] Implementar validaciones `isValidXTerm()`

4. **📝 Implementar Extracción de Parámetros**
   - [ ] Personalizar `extractParametersFromMessage()`
   - [ ] Definir parámetros por herramienta
   - [ ] Implementar validaciones

5. **⚡ Configurar Ejecución**
   - [ ] Implementar DataSource principal
   - [ ] Crear repositorios específicos
   - [ ] Configurar acceso a datos (MongoDB/otros)

6. **🎨 Personalizar Formateo**
   - [ ] Implementar `formatXResponse()`
   - [ ] Definir templates de respuesta
   - [ ] Agregar emojis y estructura amigable

7. **🔗 Configurar Rutas**
   - [ ] Configurar inyección de dependencias
   - [ ] Definir rutas HTTP
   - [ ] Agregar middleware necesario

8. **🧪 Testing**
   - [ ] Crear script de test
   - [ ] Probar consultas específicas vs generales
   - [ ] Validar formateo de respuestas

### 🎯 Personalización por Dominio

Para cada nuevo dominio, necesitas:

1. **Términos de búsqueda válidos**
2. **Patrones regex específicos**
3. **Herramientas (get_X, search_X)**
4. **Parámetros específicos**
5. **Formato de respuesta**

### 💡 Consejos de Implementación

- **Empieza simple**: Implementa un dominio primero
- **Usa logging**: Agrega logs detallados para debugging
- **Valida siempre**: Valida inputs en cada capa
- **Testa frecuentemente**: Prueba cada cambio inmediatamente
- **Mantén consistencia**: Usa patterns similares para todos los dominios

¡Con estos templates puedes implementar un sistema de detección inteligente para cualquier dominio!
