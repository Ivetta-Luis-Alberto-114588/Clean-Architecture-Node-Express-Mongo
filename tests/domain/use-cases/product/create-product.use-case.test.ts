// tests/domain/use-cases/product/create-product.use-case.test.ts
import { CreateProductUseCase } from '../../../../src/domain/use-cases/product/create-product.use-case';
import { CreateProductDto } from '../../../../src/domain/dtos/products/create-product.dto';
import { ProductRepository } from '../../../../src/domain/repositories/products/product.repository';
import { ProductEntity } from '../../../../src/domain/entities/products/product.entity';
import { CategoryEntity } from '../../../../src/domain/entities/products/category.entity';
import { UnitEntity } from '../../../../src/domain/entities/products/unit.entity';
import { CustomError } from '../../../../src/domain/errors/custom.error';
import { ILogger } from '../../../../src/domain/interfaces/logger.interface';

describe('CreateProductUseCase', () => {
  // Mock del ProductRepository
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
    search: jest.fn(),
  };

  // Mock del Logger
  const mockLogger: jest.Mocked<ILogger> = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  };

  // Inicialización del caso de uso a probar
  let createProductUseCase: CreateProductUseCase;

  // Datos de prueba
  const validProductData = {
    name: 'test product',
    description: 'test product description',
    price: 100,
    stock: 10,
    category: 'category-id', // ID de la categoría
    unit: 'unit-id', // ID de la unidad
    imgUrl: 'http://example.com/image.jpg',
    isActive: true
  };

  // Crear el DTO usando el método estático create (que es la forma correcta)
  const [error, validCreateProductDto] = CreateProductDto.create(validProductData);

  // Verificar que no hay error y el DTO se creó correctamente
  if (error || !validCreateProductDto) {
    throw new Error(`Failed to create test CreateProductDto: ${error}`);
  }

  // Entidades mock para la respuesta
  const mockCategory = new CategoryEntity(
    1, // ID de categoría
    'test category',
    'test category description',
    true
  );

  const mockUnit = new UnitEntity(
    1, // ID de unidad
    'test unit',
    'test unit description',
    true
  );

  // Producto de respuesta simulado
  const mockProductEntity = new ProductEntity(
    1, // ID de producto
    'test product', //name
    100, // price
    10, // stock
    mockCategory, // mock category
    mockUnit, // mock unit
    'http://example.com/image.jpg', // imgUrl
    true, // isActive
    'test product description', // description
    21, // taxRate
    121, // priceWithTax (100 + 21% tax)
  );
  // Configuración previa a cada prueba
  beforeEach(() => {
    jest.resetAllMocks();
    createProductUseCase = new CreateProductUseCase(mockProductRepository, mockLogger);

    // Configurar el comportamiento por defecto de los mocks
    mockProductRepository.findByNameForCreate.mockResolvedValue(null); // El producto no existe
    mockProductRepository.create.mockResolvedValue(mockProductEntity);
  });

  // Prueba del flujo exitoso
  test('should create a product successfully', async () => {
    // Ejecutar el caso de uso
    const result = await createProductUseCase.execute(validCreateProductDto);

    // Verificaciones
    expect(mockProductRepository.findByNameForCreate).toHaveBeenCalledWith(
      validCreateProductDto.name,
      expect.any(Object) // La paginación
    );
    expect(mockProductRepository.create).toHaveBeenCalledWith(validCreateProductDto);
    expect(result).toEqual(mockProductEntity);
  });

  // Prueba de producto ya existente
  test('should throw an error if product already exists', async () => {
    // Simular que el producto ya existe
    mockProductRepository.findByNameForCreate.mockResolvedValue(mockProductEntity);

    // Verificar que se lanza el error adecuado
    await expect(createProductUseCase.execute(validCreateProductDto))
      .rejects
      .toThrow(CustomError);

    // Verificar el mensaje específico
    await expect(createProductUseCase.execute(validCreateProductDto))
      .rejects
      .toThrow('create-product-use-case, product already exist');

    // Verificar que no se intentó crear el producto
    expect(mockProductRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de manejo de errores del repositorio
  test('should handle repository errors', async () => {
    // Simular un error en el repositorio
    const repositoryError = new Error('Database connection error');
    mockProductRepository.findByNameForCreate.mockRejectedValue(repositoryError);

    // Verificar que el error se transforma en un CustomError
    await expect(createProductUseCase.execute(validCreateProductDto))
      .rejects
      .toBeInstanceOf(CustomError);

    await expect(createProductUseCase.execute(validCreateProductDto))
      .rejects
      .toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('create-product-use-case')
      });
  });

  // Prueba de error específico del dominio
  test('should handle custom domain errors', async () => {
    // Simular un error específico del dominio
    const domainError = CustomError.badRequest('Invalid product data');
    mockProductRepository.findByNameForCreate.mockRejectedValue(domainError);

    // Verificar que el error se propaga sin cambios
    await expect(createProductUseCase.execute(validCreateProductDto))
      .rejects
      .toThrow(domainError);
  });
});