import { ChatbotController } from '../../../../src/presentation/chatbot/controller.chatbot';
import { CustomError } from '../../../../src/domain/errors/custom.error';
import { QueryChatbotUseCase } from '../../../../src/domain/use-cases/chatbot/query-chatbot.use-case';
import { GenerateEmbeddingsUseCase } from '../../../../src/domain/use-cases/chatbot/generate-embeddings.use-case';
import { LLMType } from '../../../../src/infrastructure/adapters/llm.adapter';

describe('ChatbotController', () => {
    let controller: ChatbotController;
    let chatRepository: any;
    let req: any;
    let res: any;

    beforeEach(() => {
        chatRepository = {
            getSession: jest.fn(),
            getSessions: jest.fn(),
            createSession: jest.fn(),
            validateEmbeddings: jest.fn(),
        };
        controller = new ChatbotController(chatRepository);
        req = { body: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe('queryChatbot', () => {
        it('should return 400 if dto is invalid', () => {
            jest.spyOn(require('../../../../src/domain/dtos/chatbot/chat-query.dto').ChatQueryDto, 'create').mockReturnValue(['error', undefined]);
            req.body = {};
            controller.queryChatbot(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'error' });
        });
        it('should return data if use case succeeds', async () => {
            jest.spyOn(require('../../../../src/domain/dtos/chatbot/chat-query.dto').ChatQueryDto, 'create').mockReturnValue([undefined, { prompt: 'hi' }]);
            QueryChatbotUseCase.prototype.execute = jest.fn().mockResolvedValue({ answer: 'ok' });
            req.body = { prompt: 'hi' };
            await controller.queryChatbot(req, res);
            expect(res.json).toHaveBeenCalledWith({ answer: 'ok' });
        });
        it('should handle error from use case', async () => {
            jest.spyOn(require('../../../../src/domain/dtos/chatbot/chat-query.dto').ChatQueryDto, 'create').mockReturnValue([undefined, { prompt: 'hi' }]);
            QueryChatbotUseCase.prototype.execute = jest.fn().mockRejectedValue(CustomError.internalServerError('fail'));
            req.body = { prompt: 'hi' };
            await controller.queryChatbot(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
        });
    });

    describe('getSession', () => {
        it('should return 400 if sessionId missing', () => {
            req.params = {};
            controller.getSession(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
        it('should return 404 if session not found', async () => {
            req.params = { sessionId: '1' };
            chatRepository.getSession.mockResolvedValue(null);
            await controller.getSession(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
        it('should return session if found', async () => {
            req.params = { sessionId: '1' };
            chatRepository.getSession.mockResolvedValue({ id: '1' });
            await controller.getSession(req, res);
            expect(res.json).toHaveBeenCalledWith({ id: '1' });
        });
    });

    describe('getSessions', () => {
        it('should return sessions', async () => {
            chatRepository.getSessions.mockResolvedValue([{ id: '1' }]);
            await controller.getSessions(req, res);
            expect(res.json).toHaveBeenCalledWith([{ id: '1' }]);
        });
    });

    describe('createSession', () => {
        it('should return 400 if userType invalid', () => {
            req.body = { userType: 'invalid' };
            controller.createSession(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
        it('should create session for valid userType', async () => {
            req.body = { userType: 'customer' };
            chatRepository.createSession.mockResolvedValue({ id: '1' });
            await controller.createSession(req, res);
            expect(res.json).toHaveBeenCalledWith({ id: '1' });
        });
    });

    describe('generateEmbeddings', () => {
        it('should return success message', async () => {
            GenerateEmbeddingsUseCase.prototype.execute = jest.fn().mockResolvedValue(undefined);
            await controller.generateEmbeddings(req, res);
            expect(res.json).toHaveBeenCalledWith({ message: 'Embeddings generados exitosamente' });
        });
        it('should handle error', async () => {
            GenerateEmbeddingsUseCase.prototype.execute = jest.fn().mockRejectedValue(CustomError.internalServerError('fail'));
            await controller.generateEmbeddings(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
        });
    });

    describe('changeLLM', () => {
        it('should return 400 if model invalid', () => {
            req.body = { model: 'invalid' };
            controller.changeLLM(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
        it('should change model if valid', () => {
            req.body = { model: Object.values(LLMType)[0] };
            controller.llmAdapter.setModel = jest.fn();
            controller.llmAdapter.getCurrentModel = jest.fn().mockReturnValue(Object.values(LLMType)[0]);
            controller.changeLLM(req, res);
            expect(res.json).toHaveBeenCalledWith({
                message: expect.stringContaining('Modelo cambiado exitosamente'),
                currentModel: Object.values(LLMType)[0],
            });
        });
    });

    describe('getCurrentLLM', () => {
        it('should return current model', () => {
            controller.llmAdapter.getCurrentModel = jest.fn().mockReturnValue('gpt-3');
            controller.getCurrentLLM(req, res);
            expect(res.json).toHaveBeenCalledWith({ currentModel: 'gpt-3' });
        });
    });

    describe('validateEmbeddings', () => {
        it('should return validation results', async () => {
            chatRepository.validateEmbeddings.mockResolvedValue({ valid: true });
            await controller.validateEmbeddings(req, res);
            expect(res.json).toHaveBeenCalledWith({ valid: true });
        });
    });
});
