// tests/unit/domain/use-cases/product/tag/create-tag.use-case.test.ts
import { CreateTagDto } from '../../../../../../src/domain/dtos/products/create-tag.dto';
import { TagEntity } from '../../../../../../src/domain/entities/products/tag.entity';
import { CustomError } from '../../../../../../src/domain/errors/custom.error';
import { TagRepository } from '../../../../../../src/domain/repositories/products/tag.repository';
import { CreateTagUseCase } from '../../../../../../src/domain/use-cases/product/tag/create-tag.use-case';

describe('CreateTagUseCase', () => {
    let useCase: CreateTagUseCase;
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

        useCase = new CreateTagUseCase(mockRepository);
    });

    describe('execute', () => {
        const validCreateTagDto = new (CreateTagDto as any)('popular', 'Popular items', true);
        const mockTagEntity = new TagEntity(
            '507f1f77bcf86cd799439011',
            'popular',
            'Popular items',
            true,
            new Date(),
            new Date()
        );

        it('should create tag when name is unique', async () => {
            // Arrange
            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(mockTagEntity);

            // Act
            const result = await useCase.execute(validCreateTagDto);

            // Assert
            expect(mockRepository.findByName).toHaveBeenCalledWith('popular');
            expect(mockRepository.create).toHaveBeenCalledWith(validCreateTagDto);
            expect(result).toEqual(mockTagEntity);
        });

        it('should throw CustomError when tag name already exists', async () => {
            // Arrange
            const existingTag = new TagEntity(
                '507f1f77bcf86cd799439012',
                'popular',
                'Existing popular tag',
                true
            );
            mockRepository.findByName.mockResolvedValue(existingTag);

            // Act & Assert
            await expect(useCase.execute(validCreateTagDto))
                .rejects
                .toThrow(CustomError.badRequest("Tag 'popular' already exists."));

            expect(mockRepository.findByName).toHaveBeenCalledWith('popular');
            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should handle repository errors during findByName', async () => {
            // Arrange
            const repositoryError = new Error('Database connection failed');
            mockRepository.findByName.mockRejectedValue(repositoryError);

            // Act & Assert
            await expect(useCase.execute(validCreateTagDto))
                .rejects
                .toThrow(repositoryError);

            expect(mockRepository.findByName).toHaveBeenCalledWith('popular');
            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should handle repository errors during create', async () => {
            // Arrange
            mockRepository.findByName.mockResolvedValue(null);
            const repositoryError = new Error('Failed to create tag');
            mockRepository.create.mockRejectedValue(repositoryError);

            // Act & Assert
            await expect(useCase.execute(validCreateTagDto))
                .rejects
                .toThrow(repositoryError);

            expect(mockRepository.findByName).toHaveBeenCalledWith('popular');
            expect(mockRepository.create).toHaveBeenCalledWith(validCreateTagDto);
        });

        it('should work with minimal tag data', async () => {
            // Arrange
            const minimalDto = new (CreateTagDto as any)('new', undefined, true);
            const minimalEntity = new TagEntity('123', 'new', undefined, true);

            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(minimalEntity);

            // Act
            const result = await useCase.execute(minimalDto);

            // Assert
            expect(mockRepository.findByName).toHaveBeenCalledWith('new');
            expect(mockRepository.create).toHaveBeenCalledWith(minimalDto);
            expect(result).toEqual(minimalEntity);
        });

        it('should handle case-sensitive tag names correctly', async () => {
            // Arrange
            const upperCaseDto = new (CreateTagDto as any)('POPULAR', 'Popular items', true);
            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(mockTagEntity);

            // Act
            await useCase.execute(upperCaseDto);

            // Assert
            expect(mockRepository.findByName).toHaveBeenCalledWith('POPULAR');
        });
    });
});
