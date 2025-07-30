import { GenerateEmbeddingsUseCase } from '../../../../../src/domain/use-cases/chatbot/generate-embeddings.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('GenerateEmbeddingsUseCase', () => {
    let chatRepository: any;
    let useCase: GenerateEmbeddingsUseCase;

    beforeEach(() => {
        chatRepository = {
            generateEmbeddings: jest.fn(),
        };
        useCase = new GenerateEmbeddingsUseCase(chatRepository);
    });

    it('should call chatRepository.generateEmbeddings()', async () => {
        await useCase.execute();
        expect(chatRepository.generateEmbeddings).toHaveBeenCalled();
    });

    it('should throw CustomError if chatRepository throws CustomError', async () => {
        chatRepository.generateEmbeddings.mockRejectedValue(CustomError.badRequest('fail'));
        await expect(useCase.execute()).rejects.toBeInstanceOf(CustomError);
    });

    it('should throw internalServerError if unknown error occurs', async () => {
        chatRepository.generateEmbeddings.mockRejectedValue(new Error('fail'));
        await expect(useCase.execute()).rejects.toThrow('Error al generar embeddings');
    });
});
