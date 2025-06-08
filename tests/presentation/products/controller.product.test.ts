// tests/presentation/products/controller.product.test.ts

// Modificaciones principales:
// 1. Asegurarnos de esperar correctamente las promesas en tests asíncronos
// 2. Corregir la configuración de los mocks
// 3. Asegurar que los datos de prueba sean válidos

import { ProductController } from '../../../src/presentation/products/controller.product';
import { ProductRepository } from '../../../src/domain/repositories/products/product.repository';
import { CategoryRepository } from '../../../src/domain/repositories/products/categroy.repository';
import { ProductEntity } from '../../../src/domain/entities/products/product.entity';
import { CategoryEntity } from '../../../src/domain/entities/products/category.entity';
import { UnitEntity } from '../../../src/domain/entities/products/unit.entity';
import { CreateProductDto } from '../../../src/domain/dtos/products/create-product.dto';
import { CustomError } from '../../../src/domain/errors/custom.error';
import { mockRequest, mockResponse } from '../../utils/test-utils';
import { PaginationDto } from '../../../src/domain/dtos/shared/pagination.dto';

// Mock de las funciones execute para los casos de uso
const mockCreateExecute = jest.fn();
const mockGetAllExecute = jest.fn();
const mockDeleteExecute = jest.fn();
const mockGetByCategoryExecute = jest.fn();
const mockUpdateExecute = jest.fn();

// Mock de los módulos de los casos de uso
jest.mock('../../../src/domain/use-cases/product/create-product.use-case', () => {
  return {
    CreateProductUseCase: jest.fn().mockImplementation(() => ({
      execute: mockCreateExecute
    }))
  };
});

jest.mock('../../../src/domain/use-cases/product/get-all-products.use-case', () => {
  return {
    GetAllProductsUseCase: jest.fn().mockImplementation(() => ({
      execute: mockGetAllExecute
    }))
  };
});

jest.mock('../../../src/domain/use-cases/product/delete-product.use-case', () => {
  return {
    DeleteProductUseCase: jest.fn().mockImplementation(() => ({
      execute: mockDeleteExecute
    }))
  };
});

jest.mock('../../../src/domain/use-cases/product/get-product-by-category.use-case', () => {
  return {
    GetProductByCategoryUseCase: jest.fn().mockImplementation(() => ({
      execute: mockGetByCategoryExecute
    }))
  };
});

jest.mock('../../../src/domain/use-cases/product/update-product.use-case', () => {
  return {
    UpdateProductUseCase: jest.fn().mockImplementation(() => ({
      execute: mockUpdateExecute
    }))
  };
});

// Mock de PaginationDto.create
jest.mock('../../../src/domain/dtos/shared/pagination.dto', () => {
  return {
    ...jest.requireActual('../../../src/domain/dtos/shared/pagination.dto'),
    PaginationDto: {
      create: jest.fn().mockImplementation((page, limit) => {
        // Simulamos la validación real pero con valores predeterminados para tests
        if (page && limit) {
          return [undefined, { page, limit }];
        }
        return [undefined, { page: 1, limit: 5 }];
      })
    }
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
    findByUnit: jest.fn(),
    search: jest.fn()
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

  // Entidades mock para pruebas
  const mockCategory = new CategoryEntity(
    "1",
    'test category',
    'test category description',
    true
  );

  const mockUnit = new UnitEntity(
    "1",
    'test unit',
    'test unit description',
    true
  );

  // Producto de prueba
  const mockProduct = new ProductEntity(
    "1", // ID del producto
    'test product', //name
    100, // price
    10, // stock
    mockCategory, // category
    mockUnit, // unit
    'http://example.com/image.jpg', // imgUrl
    true, // isActive
    'test product description', // description
    21, // taxRate
    121, // priceWithTax (100 + 21% de IVA)
  );
  // Datos de prueba para crear un producto
  const validProductData = {
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    stock: 10,
    category: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId
    unit: '507f1f77bcf86cd799439012', // Valid MongoDB ObjectId
    imgUrl: 'http://example.com/image.jpg',
    isActive: true
  };

  // Configuración previa a cada prueba
  beforeEach(() => {
    jest.clearAllMocks();

    // Limpiar mocks de execute
    mockCreateExecute.mockClear();
    mockGetAllExecute.mockClear();
    mockDeleteExecute.mockClear();
    mockGetByCategoryExecute.mockClear();
    mockUpdateExecute.mockClear();

    // Configurar valores por defecto
    mockCreateExecute.mockResolvedValue(mockProduct);
    mockGetAllExecute.mockResolvedValue([mockProduct]);
    mockDeleteExecute.mockResolvedValue(mockProduct);
    mockGetByCategoryExecute.mockResolvedValue([mockProduct]);
    mockUpdateExecute.mockResolvedValue(mockProduct);

    productController = new ProductController(mockProductRepository, mockCategoryRepository);
  });

  describe('createProduct', () => {    // Prueba de creación exitosa
    test('should create a product successfully', async () => {
      // Mock CreateProductDto.create to return a valid DTO
      const mockCreateSpy = jest.spyOn(CreateProductDto, 'create').mockReturnValue([
        undefined,
        validProductData as any
      ]);

      // Preparar request y response
      const req = mockRequest({ body: validProductData });
      const res = mockResponse();

      // Ejecutar el controlador
      await productController.createProduct(req as any, res as any);      // Verificaciones
      expect(CreateProductUseCase).toHaveBeenCalledWith(mockProductRepository);
      expect(mockCreateExecute).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockProduct);

      // Limpiar el mock
      mockCreateSpy.mockRestore();
    });    // Prueba de datos inválidos
    test('should return 400 when product data is invalid', async () => {
      // Mock CreateProductDto.create to return an error
      const mockCreateSpy = jest.spyOn(CreateProductDto, 'create').mockReturnValue([
        'Missing required field: name',
        undefined
      ]);      // Crear datos inválidos directamente sin la propiedad name
      const invalidData = {
        description: validProductData.description,
        price: validProductData.price,
        stock: validProductData.stock,
        category: validProductData.category, // Valid ObjectId but missing name
        unit: validProductData.unit, // Valid ObjectId but missing name
        imgUrl: validProductData.imgUrl,
        isActive: validProductData.isActive
      };

      // Preparar request y response
      const req = mockRequest({ body: invalidData });
      const res = mockResponse();

      // Ejecutar el controlador
      await productController.createProduct(req as any, res as any);

      // Verificaciones
      expect(CreateProductUseCase).not.toHaveBeenCalled();
      expect(mockCreateExecute).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required field: name' });

      // Limpiar el mock
      mockCreateSpy.mockRestore();
    });    // Prueba de manejo de errores del caso de uso
    test('should handle use case errors during product creation', async () => {
      // Mock CreateProductDto.create to return a valid DTO
      const mockCreateSpy = jest.spyOn(CreateProductDto, 'create').mockReturnValue([
        undefined,
        validProductData as any
      ]);

      // Simular un error en el caso de uso
      const customError = CustomError.badRequest('Product already exists');
      mockCreateExecute.mockRejectedValue(customError);

      // Preparar request y response
      const req = mockRequest({ body: validProductData });
      const res = mockResponse();

      // Ejecutar el controlador y manejar la promesa
      await productController.createProduct(req as any, res as any);

      // Verificaciones
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product already exists' });

      // Limpiar el mock
      mockCreateSpy.mockRestore();
    });
  });

  describe('getAllProducts', () => {
    // Prueba de obtención exitosa
    test('should get all products successfully', async () => {
      // Preparar request y response con valores válidos
      const req = mockRequest({ query: { page: '1', limit: '10' } });
      const res = mockResponse();

      // Ejecutar el controlador
      await productController.getAllProducts(req as any, res as any);

      // Verificaciones
      expect(GetAllProductsUseCase).toHaveBeenCalledWith(mockProductRepository);
      expect(mockGetAllExecute).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([mockProduct]);
      expect(res.status).not.toHaveBeenCalled();
    });

    // Prueba con valores predeterminados
    test('should use default pagination when no parameters are provided', async () => {
      // Preparar request sin parámetros
      const req = mockRequest({ query: {} });
      const res = mockResponse();

      // Ejecutar el controlador
      await productController.getAllProducts(req as any, res as any);

      // Verificaciones
      expect(GetAllProductsUseCase).toHaveBeenCalledWith(mockProductRepository);
      expect(mockGetAllExecute).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([mockProduct]);
      expect(res.status).not.toHaveBeenCalled();
    });

    // Prueba de manejo de error para parámetros de paginación inválidos
    test('should handle invalid pagination parameters gracefully', async () => {
      // Mockear PaginationDto.create para devolver un error
      (PaginationDto.create as jest.Mock).mockReturnValueOnce(['Invalid pagination', undefined]);

      // Preparar request con parámetros que no se pueden convertir a número
      const req = mockRequest({ query: { page: 'invalid', limit: 'invalid' } });
      const res = mockResponse();

      // Ejecutar el controlador
      await productController.getAllProducts(req as any, res as any);

      // Verificaciones
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid pagination' });
      expect(GetAllProductsUseCase).not.toHaveBeenCalled();
      expect(mockGetAllExecute).not.toHaveBeenCalled();
    });

    // Prueba de manejo de errores del caso de uso
    test('should handle use case errors when getting all products', async () => {
      // Simular un error en el caso de uso
      const customError = CustomError.internalServerError('Database error');
      mockGetAllExecute.mockRejectedValue(customError);

      // Preparar request y response
      const req = mockRequest({ query: { page: '1', limit: '10' } });
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
    test('should get products by category successfully', async () => {      // Preparar request y response
      const req = mockRequest({
        params: { categoryId: '507f1f77bcf86cd799439013' }, // Valid MongoDB ObjectId
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
      expect(mockGetByCategoryExecute).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([mockProduct]);
      expect(res.status).not.toHaveBeenCalled();
    });

    // Prueba de manejo de errores del caso de uso
    test('should handle use case errors when getting products by category', async () => {
      // Simular un error en el caso de uso
      const customError = CustomError.notFound('Category not found');
      mockGetByCategoryExecute.mockRejectedValue(customError);      // Preparar request y response
      const req = mockRequest({
        params: { categoryId: '507f1f77bcf86cd799439014' }, // Valid MongoDB ObjectId
        query: { page: '1', limit: '10' }
      });
      const res = mockResponse();

      // Ejecutar el controlador
      await productController.getProductsByCategory(req as any, res as any);      // Verificaciones
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });
});