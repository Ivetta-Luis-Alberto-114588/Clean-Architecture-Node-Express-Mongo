// tests/unit/domain/use-cases/product/tag/delete-tag.use-case.test.ts
import { TagEntity } from '../../../../../../src/domain/entities/products/tag.entity';
import { CustomError } from '../../../../../../src/domain/errors/custom.error';
import { TagRepository } from '../../../../../../src/domain/repositories/products/tag.repository';
import { DeleteTagUseCase } from '../../../../../../src/domain/use-cases/product/tag/delete-tag.use-case';

describe('DeleteTagUseCase', () => {
    let useCase: DeleteTagUseCase;
    let mockRepository: jest.Mocked<TagRepository>;

    beforeEach(() => {
        mockRepository = {
            create: jest.fn(),
            findByName: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn()
        } as jest.Mocked<TagRepository>;

        useCase = new DeleteTagUseCase(mockRepository);
    });

    describe('execute', () => {
        const tagId = '507f1f77bcf86cd799439011';
        const mockTagEntity = new TagEntity(
            tagId,
            'popular',
            'Popular items',
            true,
            new Date(),
            new Date()
        );

        it('should delete tag when it exists', async () => {
            // Arrange
            mockRepository.delete.mockResolvedValue(mockTagEntity);

            // Act
            const result = await useCase.execute(tagId);

            // Assert
            expect(mockRepository.delete).toHaveBeenCalledWith(tagId);
            expect(result).toEqual(mockTagEntity);
        });

        it('should throw CustomError when tag does not exist', async () => {
            // Arrange
            mockRepository.delete.mockResolvedValue(null);

            // Act & Assert
            await expect(useCase.execute(tagId))
                .rejects
                .toThrow(CustomError.notFound(`Tag with ID ${tagId} not found.`));

            expect(mockRepository.delete).toHaveBeenCalledWith(tagId);
        });

        it('should handle repository errors', async () => {
            // Arrange
            const repositoryError = new Error('Database connection failed');
            mockRepository.delete.mockRejectedValue(repositoryError);

            // Act & Assert
            await expect(useCase.execute(tagId))
                .rejects
                .toThrow(repositoryError);

            expect(mockRepository.delete).toHaveBeenCalledWith(tagId);
        });

        it('should work with different tag IDs', async () => {
            // Arrange
            const differentId = '507f1f77bcf86cd799439012';
            const differentTag = new TagEntity(
                differentId,
                'sale',
                'Sale items',
                false
            );
            mockRepository.delete.mockResolvedValue(differentTag);

            // Act
            const result = await useCase.execute(differentId);

            // Assert
            expect(mockRepository.delete).toHaveBeenCalledWith(differentId);
            expect(result).toEqual(differentTag);
        });

        it('should handle invalid ObjectId format', async () => {
            // Arrange
            const invalidId = 'invalid-id';
            mockRepository.delete.mockResolvedValue(null);

            // Act & Assert
            await expect(useCase.execute(invalidId))
                .rejects
                .toThrow(CustomError.notFound(`Tag with ID ${invalidId} not found.`));

            expect(mockRepository.delete).toHaveBeenCalledWith(invalidId);
        });

        it('should handle empty tag ID', async () => {
            // Arrange
            const emptyId = '';
            mockRepository.delete.mockResolvedValue(null);

            // Act & Assert
            await expect(useCase.execute(emptyId))
                .rejects
                .toThrow(CustomError.notFound(`Tag with ID ${emptyId} not found.`));

            expect(mockRepository.delete).toHaveBeenCalledWith(emptyId);
        });

        it('should return deleted tag with all properties', async () => {
            // Arrange
            const fullTagEntity = new TagEntity(
                tagId,
                'premium',
                'Premium quality items',
                true,
                new Date('2023-01-01'),
                new Date('2023-12-01')
            );
            mockRepository.delete.mockResolvedValue(fullTagEntity);

            // Act
            const result = await useCase.execute(tagId);

            // Assert
            expect(result.id).toBe(tagId);
            expect(result.name).toBe('premium');
            expect(result.description).toBe('Premium quality items');
            expect(result.isActive).toBe(true);
            expect(result.createdAt).toEqual(new Date('2023-01-01'));
            expect(result.updatedAt).toEqual(new Date('2023-12-01'));
        });
    });
});
