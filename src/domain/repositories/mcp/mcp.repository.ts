// src/domain/repositories/mcp/mcp.repository.ts
import { MCPToolEntity, MCPCallResult } from "../../entities/mcp/mcp.entity";

export abstract class MCPRepository {
  abstract getAvailableTools(): Promise<MCPToolEntity[]>;
  abstract callTool(toolName: string, args: Record<string, any>): Promise<MCPCallResult>;
}
