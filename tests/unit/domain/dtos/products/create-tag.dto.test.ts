import { CreateTagDto } from '../../../../../src/domain/dtos/products/create-tag.dto';

describe('CreateTagDto', () => {
    describe('create', () => {
        it('should create a valid DTO when all required fields are provided', () => {
            const validData = { name: 'Oferta', description: 'Descuento', isActive: true };
            const [error, dto] = CreateTagDto.create(validData);
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.name).toBe('oferta'); // Se guarda en minúsculas
            expect(dto!.description).toBe('Descuento');
            expect(dto!.isActive).toBe(true);
        });

        it('should create a valid DTO with only name', () => {
            const [error, dto] = CreateTagDto.create({ name: 'Nuevo' });
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.name).toBe('nuevo');
            expect(dto!.isActive).toBe(true); // default
        });

        it('should return error if name is missing', () => {
            const [error, dto] = CreateTagDto.create({});
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if name is empty', () => {
            const [error, dto] = CreateTagDto.create({ name: '' });
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if name is not a string', () => {
            const [error, dto] = CreateTagDto.create({ name: 123 });
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if description is not a string', () => {
            const [error, dto] = CreateTagDto.create({ name: 'tag', description: 123 });
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if isActive is not a boolean', () => {
            const [error, dto] = CreateTagDto.create({ name: 'tag', isActive: 'yes' });
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });
    });
});
