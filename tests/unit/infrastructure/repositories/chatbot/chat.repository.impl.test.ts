import { ChatRepositoryImpl } from '../../../../../src/infrastructure/repositories/chatbot/chat.repository.impl';
import { ChatDatasource } from '../../../../../src/domain/datasources/chatbot/chat.datasource';
import { ChatQueryDto } from '../../../../../src/domain/dtos/chatbot/chat-query.dto';
import { ChatMessageEntity, ChatSessionEntity } from '../../../../../src/domain/entities/chatbot/chat-message.entity';

describe('ChatRepositoryImpl', () => {
    let chatDatasource: jest.Mocked<ChatDatasource>;
    let repository: ChatRepositoryImpl;

    beforeEach(() => {
        chatDatasource = {
            query: jest.fn(),
            saveMessage: jest.fn(),
            getSession: jest.fn(),
            createSession: jest.fn(),
            getSessions: jest.fn(),
            generateEmbeddings: jest.fn(),
            validateEmbeddings: jest.fn(),
        } as any;
        repository = new ChatRepositoryImpl(chatDatasource);
    });

    it('should call datasource.query', async () => {
        const dto = {} as ChatQueryDto;
        chatDatasource.query.mockResolvedValue('response');
        const result = await repository.query(dto);
        expect(chatDatasource.query).toHaveBeenCalledWith(dto);
        expect(result).toBe('response');
    });

    it('should call datasource.saveMessage', async () => {
        const mockMsg = {} as ChatMessageEntity;
        chatDatasource.saveMessage.mockResolvedValue(mockMsg);
        const result = await repository.saveMessage('sid', 'role', 'content');
        expect(chatDatasource.saveMessage).toHaveBeenCalledWith('sid', 'role', 'content');
        expect(result).toBe(mockMsg);
    });

    it('should call datasource.getSession', async () => {
        const mockSession = {} as ChatSessionEntity;
        chatDatasource.getSession.mockResolvedValue(mockSession);
        const result = await repository.getSession('sid');
        expect(chatDatasource.getSession).toHaveBeenCalledWith('sid');
        expect(result).toBe(mockSession);
    });

    it('should call datasource.createSession', async () => {
        const mockSession = {} as ChatSessionEntity;
        chatDatasource.createSession.mockResolvedValue(mockSession);
        const result = await repository.createSession('customer');
        expect(chatDatasource.createSession).toHaveBeenCalledWith('customer');
        expect(result).toBe(mockSession);
    });

    it('should call datasource.getSessions', async () => {
        const mockSessions = [{} as ChatSessionEntity];
        chatDatasource.getSessions.mockResolvedValue(mockSessions);
        const result = await repository.getSessions();
        expect(chatDatasource.getSessions).toHaveBeenCalled();
        expect(result).toBe(mockSessions);
    });

    it('should call datasource.generateEmbeddings', async () => {
        await repository.generateEmbeddings();
        expect(chatDatasource.generateEmbeddings).toHaveBeenCalled();
    });

    it('should call datasource.validateEmbeddings', async () => {
        const mockResult = { a: 1 };
        chatDatasource.validateEmbeddings.mockResolvedValue(mockResult);
        const result = await repository.validateEmbeddings();
        expect(chatDatasource.validateEmbeddings).toHaveBeenCalled();
        expect(result).toBe(mockResult);
    });
});
