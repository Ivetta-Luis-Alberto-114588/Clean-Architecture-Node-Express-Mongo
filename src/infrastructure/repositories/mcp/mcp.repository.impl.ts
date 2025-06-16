// src/infrastructure/repositories/mcp/mcp.repository.impl.ts
import { MCPRepository } from "../../../domain/repositories/mcp/mcp.repository";
import { MCPDatasource } from "../../../domain/datasources/mcp/mcp.datasource";
import { MCPToolEntity, MCPCallResult } from "../../../domain/entities/mcp/mcp.entity";

export class MCPRepositoryImpl extends MCPRepository {
    constructor(
        private readonly mcpDatasource: MCPDatasource
    ) {
        super();
    }

    async getAvailableTools(): Promise<MCPToolEntity[]> {
        return await this.mcpDatasource.getAvailableTools();
    }

    async callTool(toolName: string, args: Record<string, any>): Promise<MCPCallResult> {
        return await this.mcpDatasource.callTool(toolName, args);
    }
}
