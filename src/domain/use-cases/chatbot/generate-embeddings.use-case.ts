// src/domain/use-cases/chatbot/generate-embeddings.use-case.ts
import { CustomError } from "../../errors/custom.error";
import { ChatRepository } from "../../repositories/chatbot/chat.repository";

export class GenerateEmbeddingsUseCase {
    constructor(
        private readonly chatRepository: ChatRepository
    ) {}

    async execute(): Promise<void> {
        try {
            await this.chatRepository.generateEmbeddings();
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            console.error(error);
            throw CustomError.internalServerError('Error al generar embeddings');
        }
    }
}