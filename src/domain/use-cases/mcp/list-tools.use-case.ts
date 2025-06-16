// src/domain/use-cases/mcp/list-tools.use-case.ts
import { MCPRepository } from "../../repositories/mcp/mcp.repository";
import { MCPToolEntity } from "../../entities/mcp/mcp.entity";

export class ListToolsUseCase {
  constructor(
    private readonly mcpRepository: MCPRepository
  ) {}

  async execute(): Promise<MCPToolEntity[]> {
    return await this.mcpRepository.getAvailableTools();
  }
}
