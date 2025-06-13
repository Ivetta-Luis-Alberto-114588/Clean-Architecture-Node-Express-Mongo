// Test simple para verificar que los use cases funcionan con logger
import { SearchProductsUseCase } from '../../../src/domain/use-cases/product/search-products.use-case';
import { GetAllProductsUseCase } from '../../../src/domain/use-cases/product/get-all-products.use-case';
import { ProductRepository } from '../../../src/domain/repositories/products/product.repository';
import { ILogger } from '../../../src/domain/interfaces/logger.interface';

describe('Use Cases with Logger', () => {
    const mockRepository: jest.Mocked<ProductRepository> = {
        search: jest.fn(),
        getAll: jest.fn(),
        findByNameForCreate: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByCategory: jest.fn(),
        checkIfProductExist: jest.fn(),
        findByName: jest.fn(),
        findByUnit: jest.fn()
    };

    const mockLogger: jest.Mocked<ILogger> = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        http: jest.fn()
    };

    test('SearchProductsUseCase should be instantiable with logger', () => {
        expect(() => {
            new SearchProductsUseCase(mockRepository, mockLogger);
        }).not.toThrow();
    });

    test('GetAllProductsUseCase should be instantiable with logger', () => {
        expect(() => {
            new GetAllProductsUseCase(mockRepository, mockLogger);
        }).not.toThrow();
    });
});
