// tests/unit/domain/use-cases/product/tag/get-all-tags.use-case.test.ts
import { PaginationDto } from '../../../../../../src/domain/dtos/shared/pagination.dto';
import { TagEntity } from '../../../../../../src/domain/entities/products/tag.entity';
import { TagRepository } from '../../../../../../src/domain/repositories/products/tag.repository';
import { GetAllTagsUseCase } from '../../../../../../src/domain/use-cases/product/tag/get-all-tags.use-case';

describe('GetAllTagsUseCase', () => {
    let useCase: GetAllTagsUseCase;
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

        useCase = new GetAllTagsUseCase(mockRepository);
    });

    describe('execute', () => {
        const mockTags = [
            new TagEntity('1', 'popular', 'Popular items', true, new Date(), new Date()),
            new TagEntity('2', 'sale', 'Sale items', true, new Date(), new Date()),
            new TagEntity('3', 'new', 'New arrivals', false, new Date(), new Date())
        ]; it('should return all tags with default pagination', async () => {
            // Arrange
            const [, paginationDto] = PaginationDto.create(1, 10);
            mockRepository.getAll.mockResolvedValue(mockTags);

            // Act
            const result = await useCase.execute(paginationDto!);

            // Assert
            expect(mockRepository.getAll).toHaveBeenCalledWith(paginationDto);
            expect(result).toEqual(mockTags);
            expect(result).toHaveLength(3);
        });

        it('should handle custom pagination parameters', async () => {
            // Arrange
            const [, customPagination] = PaginationDto.create(2, 5);
            const paginatedTags = [mockTags[0], mockTags[1]];
            mockRepository.getAll.mockResolvedValue(paginatedTags);

            // Act
            const result = await useCase.execute(customPagination!);

            // Assert
            expect(mockRepository.getAll).toHaveBeenCalledWith(customPagination);
            expect(result).toEqual(paginatedTags);
            expect(result).toHaveLength(2);
        }); it('should return empty array when no tags exist', async () => {
            // Arrange
            const [, paginationDto] = PaginationDto.create(1, 10);
            mockRepository.getAll.mockResolvedValue([]);

            // Act
            const result = await useCase.execute(paginationDto!);

            // Assert
            expect(mockRepository.getAll).toHaveBeenCalledWith(paginationDto);
            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        }); it('should handle repository errors', async () => {
            // Arrange
            const [, paginationDto] = PaginationDto.create(1, 10);
            const repositoryError = new Error('Database connection failed');
            mockRepository.getAll.mockRejectedValue(repositoryError);

            // Act & Assert
            await expect(useCase.execute(paginationDto!))
                .rejects
                .toThrow(repositoryError);

            expect(mockRepository.getAll).toHaveBeenCalledWith(paginationDto);
        });

        it('should handle large pagination limits', async () => {
            // Arrange
            const [, largePagination] = PaginationDto.create(100, 10);
            mockRepository.getAll.mockResolvedValue([]);

            // Act
            const result = await useCase.execute(largePagination!);

            // Assert
            expect(mockRepository.getAll).toHaveBeenCalledWith(largePagination);
            expect(result).toEqual([]);
        }); it('should preserve tag properties in result', async () => {
            // Arrange
            const [, paginationDto] = PaginationDto.create(1, 10);
            const specificTag = new TagEntity(
                '507f1f77bcf86cd799439011',
                'premium',
                'Premium quality items',
                true,
                new Date('2023-01-01'),
                new Date('2023-12-01')
            );
            mockRepository.getAll.mockResolvedValue([specificTag]);

            // Act
            const result = await useCase.execute(paginationDto!);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('507f1f77bcf86cd799439011');
            expect(result[0].name).toBe('premium');
            expect(result[0].description).toBe('Premium quality items');
            expect(result[0].isActive).toBe(true);
            expect(result[0].createdAt).toEqual(new Date('2023-01-01'));
            expect(result[0].updatedAt).toEqual(new Date('2023-12-01'));
        }); it('should work with tags having minimal data', async () => {
            // Arrange
            const [, paginationDto] = PaginationDto.create(1, 10);
            const minimalTag = new TagEntity('1', 'simple');
            mockRepository.getAll.mockResolvedValue([minimalTag]);

            // Act
            const result = await useCase.execute(paginationDto!);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
            expect(result[0].name).toBe('simple');
            expect(result[0].description).toBeUndefined();
            expect(result[0].isActive).toBeUndefined();
        }); it('should handle mixed active and inactive tags', async () => {
            // Arrange
            const [, paginationDto] = PaginationDto.create(1, 10);
            const mixedTags = [
                new TagEntity('1', 'active', 'Active tag', true),
                new TagEntity('2', 'inactive', 'Inactive tag', false),
                new TagEntity('3', 'undefined', 'Undefined status')
            ];
            mockRepository.getAll.mockResolvedValue(mixedTags);

            // Act
            const result = await useCase.execute(paginationDto!);

            // Assert
            expect(result).toHaveLength(3);
            expect(result[0].isActive).toBe(true);
            expect(result[1].isActive).toBe(false);
            expect(result[2].isActive).toBeUndefined();
        });
    });
});
