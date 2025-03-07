import { NeighborhoodEntity } from '../../../../src/domain/entities/customers/neighborhood';
import { CityEntity } from '../../../../src/domain/entities/customers/citiy';

describe('NeighborhoodEntity', () => {
  // Crear un objeto mock de City para las pruebas
  const mockCity = new CityEntity(
    1,
    'Test City',
    'Test City Description',
    true
  );

  // Test de creación básica
  test('should create a NeighborhoodEntity instance with all properties', () => {
    // Arrange
    const id = 2;
    const name = 'Test Neighborhood';
    const description = 'Test Neighborhood Description';
    const isActive = true;

    // Act
    const neighborhood = new NeighborhoodEntity(
      id, 
      name, 
      description, 
      mockCity, 
      isActive
    );

    // Assert
    expect(neighborhood).toBeInstanceOf(NeighborhoodEntity);
    expect(neighborhood.id).toBe(id);
    expect(neighborhood.name).toBe(name);
    expect(neighborhood.description).toBe(description);
    expect(neighborhood.city).toBe(mockCity);
    expect(neighborhood.isActive).toBe(isActive);
  });

  // Test con isActive false
  test('should create a NeighborhoodEntity instance with isActive set to false', () => {
    // Arrange
    const id = 3;
    const name = 'Inactive Neighborhood';
    const description = 'Inactive Neighborhood Description';
    const isActive = false;

    // Act
    const neighborhood = new NeighborhoodEntity(
      id, 
      name, 
      description, 
      mockCity, 
      isActive
    );

    // Assert
    expect(neighborhood.isActive).toBe(false);
  });

  // Test con valores vacíos para nombre y descripción
  test('should accept empty strings for name and description', () => {
    // Arrange
    const id = 4;
    const name = '';
    const description = '';
    const isActive = true;

    // Act
    const neighborhood = new NeighborhoodEntity(
      id, 
      name, 
      description, 
      mockCity, 
      isActive
    );

    // Assert
    expect(neighborhood.name).toBe('');
    expect(neighborhood.description).toBe('');
  });

  // Test relación con City
  test('should correctly reference the provided City entity', () => {
    // Arrange
    const id = 5;
    const name = 'City Related Neighborhood';
    const description = 'Neighborhood with City relation';
    const isActive = true;

    // Act
    const neighborhood = new NeighborhoodEntity(
      id, 
      name, 
      description, 
      mockCity, 
      isActive
    );

    // Assert
    expect(neighborhood.city).toBe(mockCity);
    expect(neighborhood.city.name).toBe('Test City');
    expect(neighborhood.city.description).toBe('Test City Description');
    expect(neighborhood.city.isActive).toBe(true);
  });

  // Test con diferentes instancias de City
  test('should work with different City instances', () => {
    // Arrange
    const anotherCity = new CityEntity(
      99, 
      'Another City', 
      'Another City Description', 
      false
    );

    const id = 6;
    const name = 'Multi-city Neighborhood';
    const description = 'Neighborhood testing multiple cities';
    const isActive = true;

    // Act
    const neighborhood = new NeighborhoodEntity(
      id, 
      name, 
      description, 
      anotherCity, 
      isActive
    );

    // Assert
    expect(neighborhood.city).toBe(anotherCity);
    expect(neighborhood.city.id).toBe(99);
    expect(neighborhood.city.name).toBe('Another City');
    expect(neighborhood.city.isActive).toBe(false);
  });

  // Test con ID cero o negativo
  test('should accept zero or negative ID values', () => {
    // Arrange - ID cero
    const idZero = 0;
    const neighborhood1 = new NeighborhoodEntity(
      idZero, 
      'Zero ID', 
      'Zero ID Description', 
      mockCity, 
      true
    );
    
    // ID negativo
    const idNegative = -7;
    const neighborhood2 = new NeighborhoodEntity(
      idNegative, 
      'Negative ID', 
      'Negative ID Description', 
      mockCity, 
      true
    );

    // Assert
    expect(neighborhood1.id).toBe(0);
    expect(neighborhood2.id).toBe(-7);
  });
});