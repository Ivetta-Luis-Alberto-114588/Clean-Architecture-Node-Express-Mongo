// tests/unit/domain/use-cases/mcp/call-tool.use-case.test.ts
import { CallToolUseCase } from "../../../../../src/domain/use-cases/mcp/call-tool.use-case";
import { MCPRepository } from "../../../../../src/domain/repositories/mcp/mcp.repository";
import { MCPCallDto } from "../../../../../src/domain/dtos/mcp/mcp-call.dto";
import { MCPCallResult } from "../../../../../src/domain/entities/mcp/mcp.entity";
import { CustomError } from "../../../../../src/domain/errors/custom.error";

describe('CallToolUseCase', () => {
  let useCase: CallToolUseCase;
  let mockRepository: jest.Mocked<MCPRepository>;

  beforeEach(() => {
    mockRepository = {
      getAvailableTools: jest.fn(),
      callTool: jest.fn()
    } as jest.Mocked<MCPRepository>;

    useCase = new CallToolUseCase(mockRepository);
  });

  test('should execute tool call successfully', async () => {
    // Arrange
    const [, dto] = MCPCallDto.create({
      toolName: 'get_customers',
      arguments: { page: 1, limit: 10 }
    });

    const mockResult: MCPCallResult = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ customers: [], total: 0 })
        }
      ]
    };

    mockRepository.callTool.mockResolvedValue(mockResult);

    // Act
    const result = await useCase.execute(dto!);

    // Assert
    expect(mockRepository.callTool).toHaveBeenCalledWith('get_customers', { page: 1, limit: 10 });
    expect(result).toEqual(mockResult);
  });

  test('should handle CustomError from repository', async () => {
    // Arrange
    const [, dto] = MCPCallDto.create({
      toolName: 'invalid_tool',
      arguments: {}
    });

    const customError = CustomError.badRequest('Tool not found');
    mockRepository.callTool.mockRejectedValue(customError);

    // Act & Assert
    await expect(useCase.execute(dto!)).rejects.toThrow(customError);
    expect(mockRepository.callTool).toHaveBeenCalledWith('invalid_tool', {});
  });

  test('should wrap non-CustomError in CustomError', async () => {
    // Arrange
    const [, dto] = MCPCallDto.create({
      toolName: 'get_customers',
      arguments: { page: 1 }
    });

    const regularError = new Error('Database connection failed');
    mockRepository.callTool.mockRejectedValue(regularError);

    // Act & Assert
    await expect(useCase.execute(dto!)).rejects.toThrow(CustomError);
    
    try {
      await useCase.execute(dto!);
    } catch (error) {
      expect(error).toBeInstanceOf(CustomError);
      expect((error as CustomError).message).toContain('Error ejecutando herramienta MCP');
      expect((error as CustomError).message).toContain('Database connection failed');
    }
  });

  test('should handle unknown error types', async () => {
    // Arrange
    const [, dto] = MCPCallDto.create({
      toolName: 'get_customers',
      arguments: { page: 1 }
    });

    mockRepository.callTool.mockRejectedValue('string error');

    // Act & Assert
    await expect(useCase.execute(dto!)).rejects.toThrow(CustomError);
    
    try {
      await useCase.execute(dto!);
    } catch (error) {
      expect(error).toBeInstanceOf(CustomError);
      expect((error as CustomError).message).toContain('Error desconocido');
    }
  });
});
