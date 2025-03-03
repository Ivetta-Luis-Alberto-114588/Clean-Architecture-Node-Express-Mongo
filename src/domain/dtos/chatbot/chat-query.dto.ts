// src/domain/dtos/chatbot/chat-query.dto.ts
import { CustomError } from "../../errors/custom.error";

export class ChatQueryDto {
    private constructor(
        public readonly query: string,
        public readonly sessionId?: string,
        public readonly userType: 'customer' | 'owner' = 'customer',
    ) {}

    static create(object: { [key: string]: any }): [string?, ChatQueryDto?] {
        const { query, sessionId, userType = 'customer' } = object;

        // Validaciones
        if (!query) return ["La consulta es requerida", undefined];
        if (query.length < 2) return ["La consulta debe tener al menos 2 caracteres", undefined];
        
        // Validar userType
        if (userType !== 'customer' && userType !== 'owner') {
            return ["El tipo de usuario debe ser 'customer' o 'owner'", undefined];
        }

        return [
            undefined,
            new ChatQueryDto(
                query.trim(),
                sessionId,
                userType
            )
        ];
    }
}