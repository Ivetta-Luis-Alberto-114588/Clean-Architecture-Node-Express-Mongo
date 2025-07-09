// tests/unit/domain/dtos/chatbot/chat-query.dto.test.ts
import { ChatQueryDto } from '../../../../../src/domain/dtos/chatbot/chat-query.dto';

describe('ChatQueryDto', () => {
    it('should create a valid ChatQueryDto object', () => {
        const props = {
            query: 'Hola, ¿cuál es el estado de mi pedido?',
            sessionId: '12345',
            userType: 'customer' as 'customer' | 'owner',
        };

        const [error, dto] = ChatQueryDto.create(props);

        expect(error).toBeUndefined();
        expect(dto).toBeInstanceOf(ChatQueryDto);
        expect(dto?.query).toBe(props.query);
        expect(dto?.sessionId).toBe(props.sessionId);
        expect(dto?.userType).toBe(props.userType);
    });

    it('should create a valid ChatQueryDto object with default userType', () => {
        const props = {
            query: 'Hola, ¿cuál es el estado de mi pedido?',
            sessionId: '12345',
        };

        const [error, dto] = ChatQueryDto.create(props);

        expect(error).toBeUndefined();
        expect(dto).toBeInstanceOf(ChatQueryDto);
        expect(dto?.query).toBe(props.query);
        expect(dto?.sessionId).toBe(props.sessionId);
        expect(dto?.userType).toBe('customer');
    });

    it('should return an error if query is not provided', () => {
        const props = {
            sessionId: '12345',
            userType: 'customer' as 'customer' | 'owner',
        };

        const [error, dto] = ChatQueryDto.create(props);

        expect(error).toBe('La consulta es requerida');
        expect(dto).toBeUndefined();
    });

    it('should return an error if query is too short', () => {
        const props = {
            query: 'a',
            sessionId: '12345',
            userType: 'customer' as 'customer' | 'owner',
        };

        const [error, dto] = ChatQueryDto.create(props);

        expect(error).toBe('La consulta debe tener al menos 2 caracteres');
        expect(dto).toBeUndefined();
    });

    it('should return an error for an invalid userType', () => {
        const props = {
            query: 'Hola, ¿cuál es el estado de mi pedido?',
            sessionId: '12345',
            userType: 'invalid_user_type',
        };

        const [error, dto] = ChatQueryDto.create(props);

        expect(error).toBe("El tipo de usuario debe ser 'customer' o 'owner'");
        expect(dto).toBeUndefined();
    });

    it('should create a valid ChatQueryDto without a sessionId', () => {
        const props = {
            query: 'Hola, ¿cuál es el estado de mi pedido?',
            userType: 'owner' as 'customer' | 'owner',
        };

        const [error, dto] = ChatQueryDto.create(props);

        expect(error).toBeUndefined();
        expect(dto).toBeInstanceOf(ChatQueryDto);
        expect(dto?.query).toBe(props.query);
        expect(dto?.sessionId).toBeUndefined();
        expect(dto?.userType).toBe('owner');
    });

    it('should trim the query string', () => {
        const props = {
            query: '  Hola, ¿cuál es el estado de mi pedido?  ',
            sessionId: '12345',
            userType: 'customer' as 'customer' | 'owner',
        };

        const [error, dto] = ChatQueryDto.create(props);

        expect(error).toBeUndefined();
        expect(dto).toBeInstanceOf(ChatQueryDto);
        expect(dto?.query).toBe('Hola, ¿cuál es el estado de mi pedido?');
    });
});
