// src/domain/repositories/chatbot/chat.repository.ts
import { ChatMessageEntity, ChatSessionEntity } from "../../entities/chatbot/chat-message.entity";
import { ChatQueryDto } from "../../dtos/chatbot/chat-query.dto";

export abstract class ChatRepository {
    abstract query(chatQueryDto: ChatQueryDto): Promise<string>;
    abstract saveMessage(sessionId: string, role: string, content: string): Promise<ChatMessageEntity>;
    abstract getSession(sessionId: string): Promise<ChatSessionEntity | null>;
    abstract createSession(userType: 'customer' | 'owner'): Promise<ChatSessionEntity>;
    abstract getSessions(): Promise<ChatSessionEntity[]>;
    abstract generateEmbeddings(): Promise<void>;
    abstract validateEmbeddings(): Promise<{ [key: string]: number }>;
}