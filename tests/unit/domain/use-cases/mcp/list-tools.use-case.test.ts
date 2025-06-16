// tests/unit/domain/use-cases/mcp/list-tools.use-case.test.ts
import { ListToolsUseCase } from "../../../../../src/domain/use-cases/mcp/list-tools.use-case";
import { MCPRepository } from "../../../../../src/domain/repositories/mcp/mcp.repository";
import { MCPToolEntity } from "../../../../../src/domain/entities/mcp/mcp.entity";

describe('ListToolsUseCase', () => {
    let useCase: ListToolsUseCase;
    let mockRepository: jest.Mocked<MCPRepository>;

    beforeEach(() => {
        mockRepository = {
            getAvailableTools: jest.fn(),
            callTool: jest.fn()
        } as jest.Mocked<MCPRepository>;

        useCase = new ListToolsUseCase(mockRepository);
    });

    test('should return available tools from repository', async () => {
        // Arrange
        const mockTools: MCPToolEntity[] = [
            {
                name: 'get_customers',
                description: 'Get customers list',
                inputSchema: {
                    type: 'object',
                    properties: {
                        page: { type: 'number' }
                    }
                }
            },
            {
                name: 'get_products',
                description: 'Get products list',
                inputSchema: {
                    type: 'object',
                    properties: {
                        search: { type: 'string' }
                    }
                }
            }
        ];

        mockRepository.getAvailableTools.mockResolvedValue(mockTools);

        // Act
        const result = await useCase.execute();

        // Assert
        expect(mockRepository.getAvailableTools).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockTools);
        expect(result).toHaveLength(2);
    });

    test('should handle repository errors', async () => {
        // Arrange
        const error = new Error('Repository error');
        mockRepository.getAvailableTools.mockRejectedValue(error);

        // Act & Assert
        await expect(useCase.execute()).rejects.toThrow('Repository error');
        expect(mockRepository.getAvailableTools).toHaveBeenCalledTimes(1);
    });

    test('should return empty array when no tools available', async () => {
        // Arrange
        mockRepository.getAvailableTools.mockResolvedValue([]);

        // Act
        const result = await useCase.execute();

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
    });
});
