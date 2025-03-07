import { CreateProductDto } from '../../../../src/domain/dtos/products/create-product.dto';
import mongoose from 'mongoose';

describe('CreateProductDto', () => {
  // ID válido para pruebas
  const validCategoryId = new mongoose.Types.ObjectId().toString();
  const validUnitId = new mongoose.Types.ObjectId().toString();

  // Prueba de creación exitosa
  test('should create a valid DTO with correct values', () => {
    // Datos de prueba válidos
    const productData = {
      name: 'Test Product',
      description: 'Test product description',
      price: 100,
      stock: 10,
      category: validCategoryId,
      unit: validUnitId,
      imgUrl: 'http://example.com/image.jpg',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createProductDto] = CreateProductDto.create(productData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createProductDto).toBeInstanceOf(CreateProductDto);
    
    // Verificar valores correctos y transformaciones
    expect(createProductDto?.name).toBe('test product'); // debe estar en minúsculas
    expect(createProductDto?.description).toBe('test product description'); // debe estar en minúsculas
    expect(createProductDto?.price).toBe(100);
    expect(createProductDto?.stock).toBe(10);
    expect(createProductDto?.category).toBe(validCategoryId);
    expect(createProductDto?.unit).toBe(validUnitId);
    expect(createProductDto?.imgUrl).toBe('http://example.com/image.jpg');
    expect(createProductDto?.isActive).toBe(true);
  });
  
  // Prueba de validación: nombre requerido
  test('should return error if name is not provided', () => {
    // Datos de prueba con nombre faltante
    const productData = {
      description: 'Test product description',
      price: 100,
      stock: 10,
      category: validCategoryId,
      unit: validUnitId,
      imgUrl: 'http://example.com/image.jpg',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createProductDto] = CreateProductDto.create(productData);
    
    // Verificaciones
    expect(error).toBe('name is required');
    expect(createProductDto).toBeUndefined();
  });
  
  // Prueba de validación: descripción requerida
  test('should return error if description is not provided', () => {
    // Datos de prueba con descripción faltante
    const productData = {
      name: 'Test Product',
      price: 100,
      stock: 10,
      category: validCategoryId,
      unit: validUnitId,
      imgUrl: 'http://example.com/image.jpg',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createProductDto] = CreateProductDto.create(productData);
    
    // Verificaciones
    expect(error).toBe('description is required');
    expect(createProductDto).toBeUndefined();
  });
  
  // Prueba de validación: precio requerido y mayor que 0
  test('should return error if price is not provided or less than 0', () => {
    // Datos de prueba con precio faltante
    const productDataWithoutPrice = {
      name: 'Test Product',
      description: 'Test product description',
      stock: 10,
      category: validCategoryId,
      unit: validUnitId,
      imgUrl: 'http://example.com/image.jpg',
      isActive: true
    };
    
    // Creación del DTO sin precio
    const [errorWithoutPrice, dtoWithoutPrice] = CreateProductDto.create(productDataWithoutPrice);
    
    // Verificaciones
    expect(errorWithoutPrice).toBe('price is required and greater than 0');
    expect(dtoWithoutPrice).toBeUndefined();
    
    // Datos de prueba con precio negativo
    const productDataWithNegativePrice = {
      name: 'Test Product',
      description: 'Test product description',
      price: -10,
      stock: 10,
      category: validCategoryId,
      unit: validUnitId,
      imgUrl: 'http://example.com/image.jpg',
      isActive: true
    };
    
    // Creación del DTO con precio negativo
    const [errorWithNegativePrice, dtoWithNegativePrice] = CreateProductDto.create(productDataWithNegativePrice);
    
    // Verificaciones
    expect(errorWithNegativePrice).toBe('price is required and greater than 0');
    expect(dtoWithNegativePrice).toBeUndefined();
  });
  
  // Prueba de validación: stock requerido y mayor que 0
  test('should return error if stock is not provided or less than 0', () => {
    // Datos de prueba con stock faltante
    const productDataWithoutStock = {
      name: 'Test Product',
      description: 'Test product description',
      price: 100,
      category: validCategoryId,
      unit: validUnitId,
      imgUrl: 'http://example.com/image.jpg',
      isActive: true
    };
    
    // Creación del DTO sin stock
    const [errorWithoutStock, dtoWithoutStock] = CreateProductDto.create(productDataWithoutStock);
    
    // Verificaciones
    expect(errorWithoutStock).toBe('stock is required and greater than 0');
    expect(dtoWithoutStock).toBeUndefined();
    
    // Datos de prueba con stock negativo
    const productDataWithNegativeStock = {
      name: 'Test Product',
      description: 'Test product description',
      price: 100,
      stock: -10,
      category: validCategoryId,
      unit: validUnitId,
      imgUrl: 'http://example.com/image.jpg',
      isActive: true
    };
    
    // Creación del DTO con stock negativo
    const [errorWithNegativeStock, dtoWithNegativeStock] = CreateProductDto.create(productDataWithNegativeStock);
    
    // Verificaciones
    expect(errorWithNegativeStock).toBe('stock is required and greater than 0');
    expect(dtoWithNegativeStock).toBeUndefined();
  });
  
  // Prueba de validación: categoría requerida
  test('should return error if category is not provided', () => {
    // Datos de prueba con categoría faltante
    const productData = {
      name: 'Test Product',
      description: 'Test product description',
      price: 100,
      stock: 10,
      unit: validUnitId,
      imgUrl: 'http://example.com/image.jpg',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createProductDto] = CreateProductDto.create(productData);
    
    // Verificaciones
    expect(error).toBe('category is required');
    expect(createProductDto).toBeUndefined();
  });
  
  // Prueba de validación: unidad requerida
  test('should return error if unit is not provided', () => {
    // Datos de prueba con unidad faltante
    const productData = {
      name: 'Test Product',
      description: 'Test product description',
      price: 100,
      stock: 10,
      category: validCategoryId,
      imgUrl: 'http://example.com/image.jpg',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createProductDto] = CreateProductDto.create(productData);
    
    // Verificaciones
    expect(error).toBe('unit is required');
    expect(createProductDto).toBeUndefined();
  });
  
  // Prueba de validación: imagen URL requerida
  test('should return error if imgUrl is not provided', () => {
    // Datos de prueba con imagen URL faltante
    const productData = {
      name: 'Test Product',
      description: 'Test product description',
      price: 100,
      stock: 10,
      category: validCategoryId,
      unit: validUnitId,
      isActive: true
    };
    
    // Creación del DTO
    const [error, createProductDto] = CreateProductDto.create(productData);
    
    // Verificaciones
    expect(error).toBe('imgUrl is required');
    expect(createProductDto).toBeUndefined();
  });
  
  // Prueba de validación: isActive requerido
  test('should return error if isActive is not provided', () => {
    // Datos de prueba con isActive faltante
    const productData = {
      name: 'Test Product',
      description: 'Test product description',
      price: 100,
      stock: 10,
      category: validCategoryId,
      unit: validUnitId,
      imgUrl: 'http://example.com/image.jpg'
    };
    
    // Creación del DTO
    const [error, createProductDto] = CreateProductDto.create(productData);
    
    // Verificaciones
    expect(error).toBe('isActive is required');
    expect(createProductDto).toBeUndefined();
  });
});