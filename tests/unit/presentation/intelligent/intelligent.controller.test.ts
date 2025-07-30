import { IntelligentController } from '../../../../src/presentation/intelligent/intelligent.controller';
import { Request, Response } from 'express';

describe('IntelligentController', () => {
    let controller: IntelligentController;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        controller = new IntelligentController();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        res = { status: statusMock, json: jsonMock } as any;
    });

    describe('chat', () => {
        it('should return 400 if message is missing', async () => {
            req = { body: {} };
            await controller.chat(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Message is required' }));
        });
        it('should return 200 and response for valid message', async () => {
            req = { body: { message: 'pizza' } };
            await controller.chat(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: expect.any(String) }));
        });
    });

    describe('anthropicCompatible', () => {
        it('should return 400 if messages array is missing', async () => {
            req = { body: {} };
            await controller.anthropicCompatible(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Messages array is required' }));
        });
        it('should return 400 if no user message found', async () => {
            req = { body: { messages: [{ role: 'assistant', content: 'hi' }] } };
            await controller.anthropicCompatible(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'No user message found' }));
        });
        it('should return 200 and anthropic-compatible response for valid user message', async () => {
            req = { body: { messages: [{ role: 'user', content: 'pizza' }] } };
            await controller.anthropicCompatible(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String), type: 'message', role: 'assistant', content: expect.any(Array) }));
        });
    });

    describe('info', () => {
        it('should return 200 and system info', async () => {
            req = {};
            await controller.info(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true, system: expect.any(String), endpoints: expect.any(Object) }));
        });
    });

    describe('health', () => {
        it('should return 200 and healthy status', async () => {
            req = {};
            await controller.health(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true, status: 'healthy' }));
        });
    });
});
