// tests/unit/domain/use-cases/product/tag/get-tag-by-id.use-case.test.ts
import { TagEntity } from '../../../../../../src/domain/entities/products/tag.entity';
import { CustomError } from '../../../../../../src/domain/errors/custom.error';
import { TagRepository } from '../../../../../../src/domain/repositories/products/tag.repository';
import { GetTagByIdUseCase } from '../../../../../../src/domain/use-cases/product/tag/get-tag-by-id.use-case';

describe('GetTagByIdUseCase', () => {
    let useCase: GetTagByIdUseCase;
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

        useCase = new GetTagByIdUseCase(mockRepository);
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

        it('should return tag when it exists', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockTagEntity);

            // Act
            const result = await useCase.execute(tagId);

            // Assert
            expect(mockRepository.findById).toHaveBeenCalledWith(tagId);
            expect(result).toEqual(mockTagEntity);
        });

        it('should throw CustomError when tag does not exist', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(useCase.execute(tagId))
                .rejects
                .toThrow(CustomError.notFound(`Tag with ID ${tagId} not found.`));

            expect(mockRepository.findById).toHaveBeenCalledWith(tagId);
        });

        it('should handle repository errors', async () => {
            // Arrange
            const repositoryError = new Error('Database connection failed');
            mockRepository.findById.mockRejectedValue(repositoryError);

            // Act & Assert
            await expect(useCase.execute(tagId))
                .rejects
                .toThrow(repositoryError);

            expect(mockRepository.findById).toHaveBeenCalledWith(tagId);
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
            mockRepository.findById.mockResolvedValue(differentTag);

            // Act
            const result = await useCase.execute(differentId);

            // Assert
            expect(mockRepository.findById).toHaveBeenCalledWith(differentId);
            expect(result).toEqual(differentTag);
        });

        it('should handle invalid ObjectId format', async () => {
            // Arrange
            const invalidId = 'invalid-id';
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(useCase.execute(invalidId))
                .rejects
                .toThrow(CustomError.notFound(`Tag with ID ${invalidId} not found.`));

            expect(mockRepository.findById).toHaveBeenCalledWith(invalidId);
        });

        it('should handle empty tag ID', async () => {
            // Arrange
            const emptyId = '';
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(useCase.execute(emptyId))
                .rejects
                .toThrow(CustomError.notFound(`Tag with ID ${emptyId} not found.`));

            expect(mockRepository.findById).toHaveBeenCalledWith(emptyId);
        });

        it('should return tag with all properties', async () => {
            // Arrange
            const fullTagEntity = new TagEntity(
                tagId,
                'premium',
                'Premium quality items',
                true,
                new Date('2023-01-01'),
                new Date('2023-12-01')
            );
            mockRepository.findById.mockResolvedValue(fullTagEntity);

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

        it('should return tag with minimal data', async () => {
            // Arrange
            const minimalTag = new TagEntity('123', 'simple');
            mockRepository.findById.mockResolvedValue(minimalTag);

            // Act
            const result = await useCase.execute('123');

            // Assert
            expect(result.id).toBe('123');
            expect(result.name).toBe('simple');
            expect(result.description).toBeUndefined();
            expect(result.isActive).toBeUndefined();
            expect(result.createdAt).toBeUndefined();
            expect(result.updatedAt).toBeUndefined();
        });

        it('should handle tags with inactive status', async () => {
            // Arrange
            const inactiveTag = new TagEntity(
                tagId,
                'disabled',
                'Disabled tag',
                false,
                new Date(),
                new Date()
            );
            mockRepository.findById.mockResolvedValue(inactiveTag);

            // Act
            const result = await useCase.execute(tagId);

            // Assert
            expect(result.isActive).toBe(false);
            expect(result.name).toBe('disabled');
        });

        it('should handle tags with null description', async () => {
            // Arrange
            const tagWithNullDesc = new TagEntity(
                tagId,
                'no-desc',
                undefined,
                true
            );
            mockRepository.findById.mockResolvedValue(tagWithNullDesc);

            // Act
            const result = await useCase.execute(tagId);

            // Assert
            expect(result.description).toBeUndefined();
            expect(result.name).toBe('no-desc');
        });
    });
});
