// src/domain/use-cases/chatbot/query-chatbot.use-case.ts
import { ChatQueryDto } from "../../dtos/chatbot/chat-query.dto";
import { ChatMessageEntity, ChatSessionEntity } from "../../entities/chatbot/chat-message.entity";
import { CustomError } from "../../errors/custom.error";
import { ChatRepository } from "../../repositories/chatbot/chat.repository";

interface QueryResponse {
    answer: string;
    sessionId: string;
}

export class QueryChatbotUseCase {
    constructor(
        private readonly chatRepository: ChatRepository
    ) {}

    async execute(chatQueryDto: ChatQueryDto): Promise<QueryResponse> {
        try {
            let sessionId = chatQueryDto.sessionId;
            let session: ChatSessionEntity | null = null;

            // Si no hay sessionId, crear una nueva sesión
            if (!sessionId) {
                session = await this.chatRepository.createSession(chatQueryDto.userType);
                sessionId = session.id;
            } else {
                // Verificar que la sesión existe
                session = await this.chatRepository.getSession(sessionId);
                if (!session) {
                    session = await this.chatRepository.createSession(chatQueryDto.userType);
                    sessionId = session.id;
                }
            }

            // Guardar el mensaje del usuario
            await this.chatRepository.saveMessage(sessionId, 'user', chatQueryDto.query);

            // Enviar la consulta y obtener respuesta
            const answer = await this.chatRepository.query({
                ...chatQueryDto,
                sessionId
            });

            // Guardar la respuesta del asistente
            await this.chatRepository.saveMessage(sessionId, 'assistant', answer);

            return {
                answer,
                sessionId,
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            console.error(error);
            throw CustomError.internalServerError('Error al procesar la consulta');
        }
    }
}