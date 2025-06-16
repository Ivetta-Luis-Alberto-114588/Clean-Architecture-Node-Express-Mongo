// tests/unit/infrastructure/repositories/mcp/mcp.repository.impl.test.ts
import { MCPRepositoryImpl } from "../../../../../src/infrastructure/repositories/mcp/mcp.repository.impl";
import { MCPDatasource } from "../../../../../src/domain/datasources/mcp/mcp.datasource";
import { MCPToolEntity, MCPCallResult } from "../../../../../src/domain/entities/mcp/mcp.entity";

describe('MCPRepositoryImpl', () => {
  let repository: MCPRepositoryImpl;
  let mockDatasource: jest.Mocked<MCPDatasource>;

  beforeEach(() => {
    mockDatasource = {
      getAvailableTools: jest.fn(),
      callTool: jest.fn()
    } as jest.Mocked<MCPDatasource>;

    repository = new MCPRepositoryImpl(mockDatasource);
  });

  describe('getAvailableTools', () => {
    test('should delegate to datasource', async () => {
      // Arrange
      const mockTools: MCPToolEntity[] = [
        {
          name: 'get_customers',
          description: 'Get customers',
          inputSchema: { type: 'object', properties: {} }
        }
      ];
      mockDatasource.getAvailableTools.mockResolvedValue(mockTools);

      // Act
      const result = await repository.getAvailableTools();

      // Assert
      expect(mockDatasource.getAvailableTools).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTools);
    });

    test('should propagate datasource errors', async () => {
      // Arrange
      const error = new Error('Datasource error');
      mockDatasource.getAvailableTools.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.getAvailableTools()).rejects.toThrow('Datasource error');
    });
  });

  describe('callTool', () => {
    test('should delegate to datasource with correct parameters', async () => {
      // Arrange
      const toolName = 'get_customers';
      const args = { page: 1, limit: 10 };
      const mockResult: MCPCallResult = {
        content: [{ type: 'text', text: 'result' }]
      };
      mockDatasource.callTool.mockResolvedValue(mockResult);

      // Act
      const result = await repository.callTool(toolName, args);

      // Assert
      expect(mockDatasource.callTool).toHaveBeenCalledWith(toolName, args);
      expect(result).toEqual(mockResult);
    });

    test('should propagate datasource errors', async () => {
      // Arrange
      const error = new Error('Tool execution failed');
      mockDatasource.callTool.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.callTool('test', {})).rejects.toThrow('Tool execution failed');
    });
  });
});
