import { QueryChatbotUseCase } from '../../../../../src/domain/use-cases/chatbot/query-chatbot.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { ChatQueryDto } from '../../../../../src/domain/dtos/chatbot/chat-query.dto';
import { ChatSessionEntity } from '../../../../../src/domain/entities/chatbot/chat-message.entity';

describe('QueryChatbotUseCase', () => {
    let chatRepository: any;
    let useCase: QueryChatbotUseCase;

    beforeEach(() => {
        chatRepository = {
            createSession: jest.fn(),
            getSession: jest.fn(),
            saveMessage: jest.fn(),
            query: jest.fn(),
        };
        useCase = new QueryChatbotUseCase(chatRepository);
    });

    it('should create a new session if sessionId is not provided', async () => {
        const session = { id: 'new-session' } as ChatSessionEntity;
        chatRepository.createSession.mockResolvedValue(session);
        chatRepository.saveMessage.mockResolvedValue(undefined);
        chatRepository.query.mockResolvedValue('respuesta');

        const dto = { query: 'hola', userType: 'customer' } as ChatQueryDto;
        const result = await useCase.execute(dto);
        expect(result.sessionId).toBe('new-session');
        expect(result.answer).toBe('respuesta');
        expect(chatRepository.createSession).toHaveBeenCalledWith('customer');
        expect(chatRepository.saveMessage).toHaveBeenCalledWith('new-session', 'user', 'hola');
        expect(chatRepository.saveMessage).toHaveBeenCalledWith('new-session', 'assistant', 'respuesta');
    });

    it('should use existing session if sessionId is provided and exists', async () => {
        const session = { id: 'sess-1' } as ChatSessionEntity;
        chatRepository.getSession.mockResolvedValue(session);
        chatRepository.saveMessage.mockResolvedValue(undefined);
        chatRepository.query.mockResolvedValue('ok');

        const dto = { query: 'hi', userType: 'customer', sessionId: 'sess-1' } as ChatQueryDto;
        const result = await useCase.execute(dto);
        expect(result.sessionId).toBe('sess-1');
        expect(result.answer).toBe('ok');
        expect(chatRepository.getSession).toHaveBeenCalledWith('sess-1');
    });

    it('should create new session if sessionId does not exist', async () => {
        chatRepository.getSession.mockResolvedValue(null);
        const session = { id: 'sess-2' } as ChatSessionEntity;
        chatRepository.createSession.mockResolvedValue(session);
        chatRepository.saveMessage.mockResolvedValue(undefined);
        chatRepository.query.mockResolvedValue('ok');

        const dto = { query: 'hi', userType: 'customer', sessionId: 'sess-2' } as ChatQueryDto;
        const result = await useCase.execute(dto);
        expect(result.sessionId).toBe('sess-2');
        expect(result.answer).toBe('ok');
        expect(chatRepository.createSession).toHaveBeenCalledWith('customer');
    });

    it('should throw CustomError if chatRepository throws CustomError', async () => {
        chatRepository.createSession.mockRejectedValue(CustomError.badRequest('fail'));
        const dto = { query: 'fail', userType: 'customer' } as ChatQueryDto;
        await expect(useCase.execute(dto)).rejects.toBeInstanceOf(CustomError);
    });

    it('should throw internalServerError if unknown error occurs', async () => {
        chatRepository.createSession.mockRejectedValue(new Error('fail'));
        const dto = { query: 'fail', userType: 'customer' } as ChatQueryDto;
        await expect(useCase.execute(dto)).rejects.toThrow('Error al procesar la consulta');
    });
});
