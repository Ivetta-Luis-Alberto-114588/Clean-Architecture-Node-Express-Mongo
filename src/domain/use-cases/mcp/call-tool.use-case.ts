// src/domain/use-cases/mcp/call-tool.use-case.ts
import { MCPRepository } from "../../repositories/mcp/mcp.repository";
import { MCPCallResult } from "../../entities/mcp/mcp.entity";
import { MCPCallDto } from "../../dtos/mcp/mcp-call.dto";
import { CustomError } from "../../errors/custom.error";

export class CallToolUseCase {
    constructor(
        private readonly mcpRepository: MCPRepository
    ) { }

    async execute(mcpCallDto: MCPCallDto): Promise<MCPCallResult> {
        try {
            return await this.mcpRepository.callTool(
                mcpCallDto.toolName,
                mcpCallDto.args
            );
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError(`Error ejecutando herramienta MCP: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
}
