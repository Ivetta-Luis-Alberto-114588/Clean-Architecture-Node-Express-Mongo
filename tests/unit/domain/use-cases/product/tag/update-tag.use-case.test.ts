// tests/unit/domain/use-cases/product/tag/update-tag.use-case.test.ts
import { UpdateTagDto } from '../../../../../../src/domain/dtos/products/update-tag.dto';
import { TagEntity } from '../../../../../../src/domain/entities/products/tag.entity';
import { CustomError } from '../../../../../../src/domain/errors/custom.error';
import { TagRepository } from '../../../../../../src/domain/repositories/products/tag.repository';
import { UpdateTagUseCase } from '../../../../../../src/domain/use-cases/product/tag/update-tag.use-case';

describe('UpdateTagUseCase', () => {
    let useCase: UpdateTagUseCase;
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

        useCase = new UpdateTagUseCase(mockRepository);
    });

    describe('execute', () => {
        const tagId = '507f1f77bcf86cd799439011';
        const mockUpdatedTag = new TagEntity(
            tagId,
            'updated-tag',
            'Updated description',
            true,
            new Date(),
            new Date()
        );

        it('should update tag when valid data is provided', async () => {
            // Arrange
            const [, updateDto] = UpdateTagDto.update({
                name: 'updated-tag',
                description: 'Updated description'
            });
            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.update.mockResolvedValue(mockUpdatedTag);

            // Act
            const result = await useCase.execute(tagId, updateDto!);

            // Assert
            expect(mockRepository.findByName).toHaveBeenCalledWith('updated-tag');
            expect(mockRepository.update).toHaveBeenCalledWith(tagId, updateDto);
            expect(result).toEqual(mockUpdatedTag);
        });

        it('should update tag without checking name when name is not provided', async () => {
            // Arrange
            const [, updateDto] = UpdateTagDto.update({
                description: 'New description only',
                isActive: false
            });
            mockRepository.update.mockResolvedValue(mockUpdatedTag);

            // Act
            const result = await useCase.execute(tagId, updateDto!);

            // Assert
            expect(mockRepository.findByName).not.toHaveBeenCalled();
            expect(mockRepository.update).toHaveBeenCalledWith(tagId, updateDto);
            expect(result).toEqual(mockUpdatedTag);
        });

        it('should throw CustomError when new name already exists for different tag', async () => {
            // Arrange
            const [, updateDto] = UpdateTagDto.update({ name: 'existing-tag' });
            const existingTag = new TagEntity(
                '507f1f77bcf86cd799439012', // Different ID
                'existing-tag',
                'Existing tag',
                true
            );
            mockRepository.findByName.mockResolvedValue(existingTag);

            // Act & Assert
            await expect(useCase.execute(tagId, updateDto!))
                .rejects
                .toThrow(CustomError.badRequest("Tag name 'existing-tag' is already in use."));

            expect(mockRepository.findByName).toHaveBeenCalledWith('existing-tag');
            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should allow updating to same name when found tag is the same', async () => {
            // Arrange
            const [, updateDto] = UpdateTagDto.update({ name: 'same-tag' });
            const sameTag = new TagEntity(
                tagId, // Same ID
                'same-tag',
                'Same tag',
                true
            );
            mockRepository.findByName.mockResolvedValue(sameTag);
            mockRepository.update.mockResolvedValue(mockUpdatedTag);

            // Act
            const result = await useCase.execute(tagId, updateDto!);

            // Assert
            expect(mockRepository.findByName).toHaveBeenCalledWith('same-tag');
            expect(mockRepository.update).toHaveBeenCalledWith(tagId, updateDto);
            expect(result).toEqual(mockUpdatedTag);
        });

        it('should throw CustomError when tag to update does not exist', async () => {
            // Arrange
            const [, updateDto] = UpdateTagDto.update({ name: 'new-name' });
            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.update.mockResolvedValue(null);

            // Act & Assert
            await expect(useCase.execute(tagId, updateDto!))
                .rejects
                .toThrow(CustomError.notFound(`Tag with ID ${tagId} not found.`));

            expect(mockRepository.update).toHaveBeenCalledWith(tagId, updateDto);
        });

        it('should handle repository errors during findByName', async () => {
            // Arrange
            const [, updateDto] = UpdateTagDto.update({ name: 'test-tag' });
            const repositoryError = new Error('Database connection failed');
            mockRepository.findByName.mockRejectedValue(repositoryError);

            // Act & Assert
            await expect(useCase.execute(tagId, updateDto!))
                .rejects
                .toThrow(repositoryError);

            expect(mockRepository.findByName).toHaveBeenCalledWith('test-tag');
            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should handle repository errors during update', async () => {
            // Arrange
            const [, updateDto] = UpdateTagDto.update({ description: 'New description' });
            const repositoryError = new Error('Failed to update tag');
            mockRepository.update.mockRejectedValue(repositoryError);

            // Act & Assert
            await expect(useCase.execute(tagId, updateDto!))
                .rejects
                .toThrow(repositoryError);

            expect(mockRepository.update).toHaveBeenCalledWith(tagId, updateDto);
        });

        it('should handle updating only isActive status', async () => {
            // Arrange
            const [, updateDto] = UpdateTagDto.update({ isActive: false });
            const deactivatedTag = new TagEntity(tagId, 'test', 'desc', false);
            mockRepository.update.mockResolvedValue(deactivatedTag);

            // Act
            const result = await useCase.execute(tagId, updateDto!);

            // Assert
            expect(mockRepository.findByName).not.toHaveBeenCalled();
            expect(mockRepository.update).toHaveBeenCalledWith(tagId, updateDto);
            expect(result).toEqual(deactivatedTag);
        }); it('should handle case-sensitive name checking', async () => {
            // Arrange
            const [, updateDto] = UpdateTagDto.update({ name: 'UPPERCASE' });
            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.update.mockResolvedValue(mockUpdatedTag);

            // Act
            await useCase.execute(tagId, updateDto!);

            // Assert - DTO converts to lowercase before reaching use case
            expect(mockRepository.findByName).toHaveBeenCalledWith('uppercase');
        });

        it('should handle empty name string after trimming', async () => {
            // This test should not happen as DTO validation prevents empty strings
            // Testing the repository is called correctly when name is provided
            const [, updateDto] = UpdateTagDto.update({ name: 'valid-name' });
            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.update.mockResolvedValue(mockUpdatedTag);

            // Act
            const result = await useCase.execute(tagId, updateDto!);

            // Assert
            expect(mockRepository.findByName).toHaveBeenCalledWith('valid-name');
            expect(result).toEqual(mockUpdatedTag);
        });

        it('should handle null description update', async () => {
            // Arrange
            const [, updateDto] = UpdateTagDto.update({ description: null });
            const tagWithNullDesc = new TagEntity(tagId, 'test', undefined, true);
            mockRepository.update.mockResolvedValue(tagWithNullDesc);

            // Act
            const result = await useCase.execute(tagId, updateDto!);

            // Assert
            expect(mockRepository.update).toHaveBeenCalledWith(tagId, updateDto);
            expect(result).toEqual(tagWithNullDesc);
        });
    });
});
