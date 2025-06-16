// src/domain/entities/mcp/mcp.entity.ts

export interface MCPToolEntity {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface MCPCallResult {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: any;
    }>;
}

export interface MCPErrorEntity {
    code: string;
    message: string;
    details?: any;
}
