// Test simple para verificar la abstracción del logger
import { loggerAdapter } from '../infrastructure/adapters/winston-logger.adapter';
import { SearchProductsUseCase } from '../domain/use-cases/product/search-products.use-case';
import { ProductRepository } from '../domain/repositories/products/product.repository';

// Mock del repository
const mockRepository: ProductRepository = {
    search: jest.fn(),
    getAll: jest.fn(),
    findByNameForCreate: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByCategory: jest.fn(),
    checkIfProductExist: jest.fn()
};

// Test rápido
console.log('🧪 Testing logger abstraction...');

try {
    // Probar que el logger adapter funciona
    loggerAdapter.info('Logger test - info level');
    loggerAdapter.error('Logger test - error level');
    loggerAdapter.warn('Logger test - warn level');
    loggerAdapter.debug('Logger test - debug level');

    console.log('✅ Logger adapter funciona correctamente');

    // Probar que el use case se puede instanciar con el logger
    const useCase = new SearchProductsUseCase(mockRepository, loggerAdapter);
    console.log('✅ SearchProductsUseCase se instancia correctamente con logger');

    console.log('🎉 ¡Abstracción del logger implementada exitosamente!');

} catch (error) {
    console.error('❌ Error en la abstracción del logger:', error);
    process.exit(1);
}
