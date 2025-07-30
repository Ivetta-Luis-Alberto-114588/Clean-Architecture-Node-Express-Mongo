import { SearchProductsDto } from '../../../../../src/domain/dtos/products/search-product.dto';

describe('SearchProductsDto', () => {
    describe('create', () => {
        it('should create a valid DTO with minimal params', () => {
            const [error, dto] = SearchProductsDto.create({ page: 1, limit: 10 });
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.pagination.page).toBe(1);
            expect(dto!.pagination.limit).toBe(10);
        });

        it('should create a valid DTO with all params', () => {
            const [error, dto] = SearchProductsDto.create({
                page: 2,
                limit: 5,
                q: 'pizza',
                categories: 'cat1,cat2',
                minPrice: 10,
                maxPrice: 100,
                sortBy: 'price',
                sortOrder: 'asc',
                tags: 'tag1,tag2'
            });
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.pagination.page).toBe(2);
            expect(dto!.query).toBe('pizza');
            expect(dto!.categories).toEqual(['cat1', 'cat2']);
            expect(dto!.minPrice).toBe(10);
            expect(dto!.maxPrice).toBe(100);
            expect(dto!.sortBy).toBe('price');
            expect(dto!.sortOrder).toBe('asc');
        });

        it('should return error if page is invalid', () => {
            const [error, dto] = SearchProductsDto.create({ page: 'abc', limit: 10 });
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if categories is not a string', () => {
            const [error, dto] = SearchProductsDto.create({ page: 1, limit: 10, categories: 123 });
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if sortBy is invalid', () => {
            const [error, dto] = SearchProductsDto.create({ page: 1, limit: 10, sortBy: 'invalid' });
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if sortOrder is invalid', () => {
            const [error, dto] = SearchProductsDto.create({ page: 1, limit: 10, sortOrder: 'up' });
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });
    });
});
