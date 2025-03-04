import { ProductController } from '../../../src/presentation/products/controller.product';
import { ProductRepository } from '../../../src/domain/repositories/products/product.repository';
import { CategoryRepository } from '../../../src/domain/repositories/products/categroy.repository';
import { ProductEntity } from '../../../src/domain/entities/products/product.entity';
import { CategoryEntity } from '../../../src/domain/entities/products/category.entity';
import { UnitEntity } from '../../../src/domain/entities/products/unit.entity';
import { CreateProductDto } from '../../../src/domain/dtos/products/create-product.dto';
import { CustomError } from '../../../src/domain/errors/custom.error';
import { mockRequest, mockResponse } from '../../utils/test-utils';

// Mock completo del módulo de los casos de uso para controlar su comportamiento
jest.mock('../../../src/domain/use-cases/product/create-product.use-case', () => {
  return {
    CreateProductUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn()
    }))
  };
});

jest.mock('../../../src/domain/use-cases/product/get-all-products.use-case', () => {
  return {
    GetAllProductsUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn()
    }))
  };
});

jest.mock('../../../src/domain/use-cases/product/delete-product.use-case', () => {
  return {
    DeleteProductUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn()
    }))
  };
});

jest.mock('../../../src/domain/use-cases/product/get-product-by-category.use-case', () => {
  return {
    GetProductByCategoryUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn()
    }))
  };
});

jest.mock('../../../src/domain/use-cases/product/update-product.use-case', () => {
  return {
    UpdateProductUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn()
    }))
  };
});

// Importar después de los mocks
import { CreateProductUseCase } from '../../../src/domain/use-cases/product/create-product.use-case';
import { GetAllProductsUseCase } from '../../../src/domain/use-cases/product/get-all-products.use-case';
import { DeleteProductUseCase } from '../../../src/domain/use-cases/product/delete-product.use-case';
import { GetProductByCategoryUseCase } from '../../../src/domain/use-cases/product/get-product-by-category.use-case';
import { UpdateProductUseCase } from '../../../src/domain/use-cases/product/update-product.use-case';

describe('ProductController', () => {
  // Mocks de los repositorios
  const mockProductRepository: jest.Mocked<ProductRepository> = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByNameForCreate: jest.fn(),
    findByName: jest.fn(),
    findByCategory: jest.fn(),
    findByUnit: jest.fn()
  };
  
  const mockCategoryRepository: jest.Mocked<CategoryRepository> = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByName: jest.fn(),
    findByNameForCreate: jest.fn()
  };
  
  // Instancia del controlador a probar
  let productController: ProductController;
  
  // Entidades mock para pruebas (corregidas para usar número en id)
  const mockCategory = new CategoryEntity(
    1,  // Cambiado de 'category-id' a 1 (número)
    'test category',
    'test category description',
    true
  );
  
  const mockUnit = new UnitEntity(
    1,  // Cambiado de 'unit-id' a 1 (número)
    'test unit',
    'test unit description',
    true
  );
  
  // Producto de prueba (corregido para usar número en id)
  const mockProduct = new ProductEntity(
    1,  // Cambiado de 'product-id' a 1 (número)
    'test product',
    100,
    10,
    mockCategory,
    mockUnit,
    'http://example.com/image.jpg',
    true,
    'test product description'
  );
  
  // Datos de prueba para crear un producto
  const validProductData = {
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    stock: 10,
    category: 'category-id',
    unit: 'unit-id',
    imgUrl: 'http://example.com/image.jpg',
    isActive: true
  };
  
  // Configuración previa a cada prueba
  beforeEach(() => {
    jest.clearAllMocks();
    productController = new ProductController(mockProductRepository, mockCategoryRepository);
    
    // Configurar el comportamiento por defecto de los casos de uso
    (CreateProductUseCase as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue(mockProduct)
    }));
    
    (GetAllProductsUseCase as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue([mockProduct])
    }));
    
    (DeleteProductUseCase as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue(mockProduct)
    }));
    
    (GetProductByCategoryUseCase as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue([mockProduct])
    }));
    
    (UpdateProductUseCase as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue(mockProduct)
    }));
  });
  
  describe('createProduct', () => {
    // Prueba de creación exitosa
    test('should create a product successfully', async () => {
      // Preparar request y response
      const req = mockRequest({ body: validProductData });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await productController.createProduct(req as any, res as any);
      
      // Verificaciones
      expect(CreateProductUseCase).toHaveBeenCalledWith(mockProductRepository);
      expect(res.json).toHaveBeenCalledWith(mockProduct);
      expect(res.status).not.toHaveBeenCalled(); // No se debe cambiar el status en caso de éxito
    });
    
    // Prueba de datos inválidos (corregido para evitar delete)
    test('should return 400 when product data is invalid', async () => {
      // Datos inválidos (sin nombre) - creado directamente sin name
      const invalidData = {
        description: validProductData.description,
        price: validProductData.price,
        stock: validProductData.stock,
        category: validProductData.category,
        unit: validProductData.unit,
        imgUrl: validProductData.imgUrl,
        isActive: validProductData.isActive
      };
      
      // Preparar request y response
      const req = mockRequest({ body: invalidData });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await productController.createProduct(req as any, res as any);
      
      // Verificaciones
      expect(CreateProductUseCase).not.toHaveBeenCalled(); // No debe llegar a crear el caso de uso
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
    
    // Prueba de manejo de errores del caso de uso
    test('should handle use case errors during product creation', async () => {
      // Simular un error en el caso de uso
      const customError = CustomError.badRequest('Product already exists');
      (CreateProductUseCase as jest.Mock).mockImplementation(() => ({
        execute: jest.fn().mockRejectedValue(customError)
      }));
      
      // Preparar request y response
      const req = mockRequest({ body: validProductData });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await productController.createProduct(req as any, res as any);
      
      // Verificaciones
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product already exists' });
    });
  });
  
  describe('getAllProducts', () => {
    // Prueba de obtención exitosa
    test('should get all products successfully', async () => {
      // Preparar request y response
      const req = mockRequest({ query: { page: '1', limit: '10' } });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await productController.getAllProducts(req as any, res as any);
      
      // Verificaciones
      expect(GetAllProductsUseCase).toHaveBeenCalledWith(mockProductRepository);
      expect(res.json).toHaveBeenCalledWith([mockProduct]);
      expect(res.status).not.toHaveBeenCalled(); // No se debe cambiar el status en caso de éxito
    });
    
    // Prueba de parámetros de paginación inválidos
    test('should use default pagination when invalid parameters are provided', async () => {
      // Preparar request con parámetros inválidos
      const req = mockRequest({ query: { page: 'invalid', limit: 'invalid' } });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await productController.getAllProducts(req as any, res as any);
      
      // Verificaciones
      expect(GetAllProductsUseCase).toHaveBeenCalledWith(mockProductRepository);
      expect(res.json).toHaveBeenCalledWith([mockProduct]);
      expect(res.status).not.toHaveBeenCalled(); // No se debe cambiar el status
    });
    
    // Prueba de manejo de errores del caso de uso
    test('should handle use case errors when getting all products', async () => {
      // Simular un error en el caso de uso
      const customError = CustomError.internalServerError('Database error');
      (GetAllProductsUseCase as jest.Mock).mockImplementation(() => ({
        execute: jest.fn().mockRejectedValue(customError)
      }));
      
      // Preparar request y response
      const req = mockRequest({ query: {} });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await productController.getAllProducts(req as any, res as any);
      
      // Verificaciones
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });
  
  describe('getProductsByCategory', () => {
    // Prueba de obtención exitosa
    test('should get products by category successfully', async () => {
      // Preparar request y response
      const req = mockRequest({ 
        params: { categoryId: 'category-id' },
        query: { page: '1', limit: '10' }
      });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await productController.getProductsByCategory(req as any, res as any);
      
      // Verificaciones
      expect(GetProductByCategoryUseCase).toHaveBeenCalledWith(
        mockProductRepository,
        mockCategoryRepository
      );
      expect(res.json).toHaveBeenCalledWith([mockProduct]);
      expect(res.status).not.toHaveBeenCalled(); // No se debe cambiar el status en caso de éxito
    });
    
    // Prueba de manejo de errores del caso de uso
    test('should handle use case errors when getting products by category', async () => {
      // Simular un error en el caso de uso
      const customError = CustomError.notFound('Category not found');
      (GetProductByCategoryUseCase as jest.Mock).mockImplementation(() => ({
        execute: jest.fn().mockRejectedValue(customError)
      }));
      
      // Preparar request y response
      const req = mockRequest({ 
        params: { categoryId: 'nonexistent-id' },
        query: {}
      });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await productController.getProductsByCategory(req as any, res as any);
      
      // Verificaciones
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });
});