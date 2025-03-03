// src/domain/entities/chatbot/chat-message.entity.ts
export enum MessageRole {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system'
}

export class ChatMessageEntity {
    constructor(
        public id: string,
        public sessionId: string,
        public role: MessageRole,
        public content: string,
        public timestamp: Date,
        public metadata?: any
    ) {}
}

export class ChatSessionEntity {
    constructor(
        public id: string,
        public userType: 'customer' | 'owner',
        public messages: ChatMessageEntity[],
        public createdAt: Date,
        public updatedAt: Date,
    ) {}
}