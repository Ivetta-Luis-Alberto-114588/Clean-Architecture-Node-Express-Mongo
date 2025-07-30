import { ChatMessageEntity, ChatSessionEntity, MessageRole } from '../../../../../src/domain/entities/chatbot/chat-message.entity';

describe('ChatMessageEntity', () => {
    it('should create a ChatMessageEntity with all properties', () => {
        const now = new Date();
        const entity = new ChatMessageEntity(
            'msg1',
            'session1',
            MessageRole.USER,
            'Hola, ¿cómo estás?',
            now,
            { important: true }
        );
        expect(entity.id).toBe('msg1');
        expect(entity.sessionId).toBe('session1');
        expect(entity.role).toBe(MessageRole.USER);
        expect(entity.content).toBe('Hola, ¿cómo estás?');
        expect(entity.timestamp).toBe(now);
        expect(entity.metadata).toEqual({ important: true });
    });

    it('should allow metadata to be undefined', () => {
        const now = new Date();
        const entity = new ChatMessageEntity(
            'msg2',
            'session2',
            MessageRole.ASSISTANT,
            '¡Hola! Soy el asistente.',
            now
        );
        expect(entity.metadata).toBeUndefined();
    });
});

describe('ChatSessionEntity', () => {
    it('should create a ChatSessionEntity with all properties', () => {
        const now = new Date();
        const msg = new ChatMessageEntity('msg1', 'session1', MessageRole.USER, 'Hola', now);
        const session = new ChatSessionEntity(
            'session1',
            'customer',
            [msg],
            now,
            now
        );
        expect(session.id).toBe('session1');
        expect(session.userType).toBe('customer');
        expect(session.messages.length).toBe(1);
        expect(session.messages[0]).toBe(msg);
        expect(session.createdAt).toBe(now);
        expect(session.updatedAt).toBe(now);
    });

    it('should allow userType to be owner', () => {
        const now = new Date();
        const session = new ChatSessionEntity('session2', 'owner', [], now, now);
        expect(session.userType).toBe('owner');
        expect(session.messages).toEqual([]);
    });
});

describe('MessageRole', () => {
    it('should have correct enum values', () => {
        expect(MessageRole.USER).toBe('user');
        expect(MessageRole.ASSISTANT).toBe('assistant');
        expect(MessageRole.SYSTEM).toBe('system');
    });
});
