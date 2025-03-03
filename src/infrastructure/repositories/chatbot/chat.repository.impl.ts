// src/infrastructure/repositories/chatbot/chat.repository.impl.ts
import { ChatDatasource } from "../../../domain/datasources/chatbot/chat.datasource";
import { ChatMessageEntity, ChatSessionEntity } from "../../../domain/entities/chatbot/chat-message.entity";
import { ChatQueryDto } from "../../../domain/dtos/chatbot/chat-query.dto";
import { ChatRepository } from "../../../domain/repositories/chatbot/chat.repository";

export class ChatRepositoryImpl implements ChatRepository {
    constructor(
        private readonly chatDatasource: ChatDatasource
    ) {}

    async query(chatQueryDto: ChatQueryDto): Promise<string> {
        return this.chatDatasource.query(chatQueryDto);
    }

    async saveMessage(sessionId: string, role: string, content: string): Promise<ChatMessageEntity> {
        return this.chatDatasource.saveMessage(sessionId, role, content);
    }

    async getSession(sessionId: string): Promise<ChatSessionEntity | null> {
        return this.chatDatasource.getSession(sessionId);
    }

    async createSession(userType: 'customer' | 'owner'): Promise<ChatSessionEntity> {
        return this.chatDatasource.createSession(userType);
    }

    async getSessions(): Promise<ChatSessionEntity[]> {
        return this.chatDatasource.getSessions();
    }

    async generateEmbeddings(): Promise<void> {
        return this.chatDatasource.generateEmbeddings();
    }
}