import { SearchCustomersDto } from '../../src/domain/dtos/customers/search-customers.dto';

describe('SearchCustomersDto Integration', () => {
    it('should create a valid DTO with q', () => {
        const [error, dto] = SearchCustomersDto.create({ q: 'Juan' });
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.q).toBe('Juan');
        expect(dto!.page).toBe(1);
        expect(dto!.limit).toBe(10);
        expect(dto!.sortBy).toBe('createdAt');
        expect(dto!.sortOrder).toBe('desc');
    });

    it('should create a valid DTO with neighborhoodId', () => {
        const [error, dto] = SearchCustomersDto.create({ neighborhoodId: '123' });
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.neighborhoodId).toBe('123');
    });

    it('should return error if neither q nor neighborhoodId is present', () => {
        const [error, dto] = SearchCustomersDto.create({});
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if q is not a string', () => {
        const [error, dto] = SearchCustomersDto.create({ q: 123 });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if q is too short', () => {
        const [error, dto] = SearchCustomersDto.create({ q: 'a' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if neighborhoodId is not a string', () => {
        const [error, dto] = SearchCustomersDto.create({ neighborhoodId: 123 });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if sortBy is invalid', () => {
        const [error, dto] = SearchCustomersDto.create({ q: 'Juan', sortBy: 'invalid' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if sortOrder is invalid', () => {
        const [error, dto] = SearchCustomersDto.create({ q: 'Juan', sortOrder: 'up' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should trim q', () => {
        const [error, dto] = SearchCustomersDto.create({ q: '  Juan  ' });
        expect(error).toBeUndefined();
        expect(dto!.q).toBe('Juan');
    });

    it('should use custom pagination', () => {
        const [error, dto] = SearchCustomersDto.create({ q: 'Juan', page: 2, limit: 5 });
        expect(error).toBeUndefined();
        expect(dto!.page).toBe(2);
        expect(dto!.limit).toBe(5);
    });

    it('should use custom sortBy and sortOrder', () => {
        const [error, dto] = SearchCustomersDto.create({ q: 'Juan', sortBy: 'name', sortOrder: 'asc' });
        expect(error).toBeUndefined();
        expect(dto!.sortBy).toBe('name');
        expect(dto!.sortOrder).toBe('asc');
    });
});
