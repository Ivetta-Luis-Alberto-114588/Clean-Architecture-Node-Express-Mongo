// tests/unit/presentation/controllers/mcp.controller.test.ts
import { Request, Response } from 'express';
import { MCPController } from '../../../../src/presentation/mcp/controller.mcp';
import { ListToolsUseCase } from '../../../../src/domain/use-cases/mcp/list-tools.use-case';
import { CallToolUseCase } from '../../../../src/domain/use-cases/mcp/call-tool.use-case';
import { envs } from '../../../../src/configs/envs';

// Mock del logger
jest.mock('../../../../src/configs/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));

describe('MCPController', () => {
    let controller: MCPController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;
    let mockListToolsUseCase: jest.Mocked<ListToolsUseCase>;
    let mockCallToolUseCase: jest.Mocked<CallToolUseCase>;

    beforeEach(() => {
        // Crear mocks para los use cases
        mockListToolsUseCase = {
            execute: jest.fn()
        } as any;

        mockCallToolUseCase = {
            execute: jest.fn()
        } as any;

        controller = new MCPController(mockListToolsUseCase, mockCallToolUseCase, false);

        mockStatus = jest.fn().mockReturnThis();
        mockJson = jest.fn().mockReturnThis();

        mockRequest = {};
        mockResponse = {
            status: mockStatus,
            json: mockJson
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
        controller.cleanup();
    });

    describe('health', () => {
        it('should return health status with OK when service is running', async () => {
            // Arrange
            const expectedResponse = {
                status: 'OK',
                service: 'MCP Service',
                timestamp: expect.any(String),
                anthropic_configured: expect.any(Boolean),
                guardrails: {
                    enabled: true,
                    activeSessions: expect.any(Number)
                }
            };

            // Act
            await controller.health(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(expectedResponse);
        });

        it('should include anthropic_configured as true when API key is configured', async () => {
            // Arrange
            const originalApiKey = envs.ANTHROPIC_API_KEY;
            (envs as any).ANTHROPIC_API_KEY = 'test-api-key';

            // Act
            await controller.health(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    anthropic_configured: true
                })
            );

            // Cleanup
            (envs as any).ANTHROPIC_API_KEY = originalApiKey;
        });

        it('should include anthropic_configured as false when API key is not configured', async () => {
            // Arrange
            const originalApiKey = envs.ANTHROPIC_API_KEY;
            (envs as any).ANTHROPIC_API_KEY = undefined;

            // Act
            await controller.health(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    anthropic_configured: false
                })
            );

            // Cleanup
            (envs as any).ANTHROPIC_API_KEY = originalApiKey;
        }); it('should include current timestamp in ISO format', async () => {
            // Arrange
            const beforeTime = Date.now();

            // Act
            await controller.health(mockRequest as Request, mockResponse as Response);

            // Assert
            const afterTime = Date.now();
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
                })
            );

            // Verificar que el timestamp está en el rango esperado
            const callArgs = mockJson.mock.calls[0][0];
            const timestamp = new Date(callArgs.timestamp).getTime();
            expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(timestamp).toBeLessThanOrEqual(afterTime);
        });
    });
});
