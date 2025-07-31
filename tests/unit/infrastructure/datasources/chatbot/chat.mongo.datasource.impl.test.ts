import { ChatMongoDatasourceImpl } from '../../../../../src/infrastructure/datasources/chatbot/chat.mongo.datasource.impl';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('ChatMongoDatasourceImpl', () => {
    let datasource: ChatMongoDatasourceImpl;

    beforeEach(() => {
        datasource = new ChatMongoDatasourceImpl();
    });
    // Eliminar subclase y usar Object.defineProperty para mockear isAIAvailable
    it('should throw badRequest if query is empty', async () => {
        await expect(datasource.query({ query: '', sessionId: undefined, userType: 'customer' } as any)).rejects.toThrow(CustomError);
        await expect(datasource.query({ query: '', sessionId: undefined, userType: 'customer' } as any)).rejects.toThrow('La consulta no puede estar vacía');
    });

    it('should return unavailable message if AI is not available', async () => {
        Object.defineProperty(datasource, 'isAIAvailable', { get: () => false });
        const result = await datasource.query({ query: 'hola', sessionId: undefined, userType: 'customer' } as any);
        expect(result).toMatch(/no están disponibles/);
    });

    it('should handle error in saveMessage', async () => {
        jest.spyOn(require('../../../../../src/data/mongodb/models/chatbot/chat-models'), 'ChatMessageModel').mockImplementation(() => { throw new Error('fail'); });
        await expect(datasource.saveMessage('id', 'role', 'content')).rejects.toThrow('Error al guardar mensaje');
    });

    it('should handle error in getSession', async () => {
        jest.spyOn(require('../../../../../src/data/mongodb/models/chatbot/chat-models'), 'ChatSessionModel').mockImplementation(() => { throw new Error('fail'); });
        await expect(datasource.getSession('id')).rejects.toThrow('Error al obtener sesión');
    });

    it('should handle error in createSession', async () => {
        jest.spyOn(require('../../../../../src/data/mongodb/models/chatbot/chat-models'), 'ChatSessionModel').mockImplementation(() => { throw new Error('fail'); });
        await expect(datasource.createSession('customer')).rejects.toThrow('Error al crear sesión');
    });

    it('should handle error in getSessions', async () => {
        jest.spyOn(require('../../../../../src/data/mongodb/models/chatbot/chat-models'), 'ChatSessionModel').mockImplementation(() => { throw new Error('fail'); });
        await expect(datasource.getSessions()).rejects.toThrow('Error al obtener sesiones');
    });

    it('should handle error in generateEmbeddings', async () => {
        jest.spyOn(datasource as any, 'generateProductEmbeddings').mockRejectedValue(new Error('fail'));
        await expect(datasource.generateEmbeddings()).rejects.toThrow('Error en generación de embeddings');
    });

    it('should handle error in validateEmbeddings', async () => {
        const customerModel = require('../../../../../src/data/mongodb/models/customers/customer.model');
        const orig = customerModel.CustomerModel.countDocuments;
        customerModel.CustomerModel.countDocuments = jest.fn().mockRejectedValue(new Error('fail'));
        await expect(datasource.validateEmbeddings()).rejects.toThrow('Error al validar embeddings');
        customerModel.CustomerModel.countDocuments = orig;
    });
});
