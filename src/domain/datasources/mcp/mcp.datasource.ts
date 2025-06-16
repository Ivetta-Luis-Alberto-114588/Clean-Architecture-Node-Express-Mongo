// src/domain/datasources/mcp/mcp.datasource.ts
import { MCPToolEntity, MCPCallResult } from "../../entities/mcp/mcp.entity";

export abstract class MCPDatasource {
  abstract getAvailableTools(): Promise<MCPToolEntity[]>;
  abstract callTool(toolName: string, args: Record<string, any>): Promise<MCPCallResult>;
}
