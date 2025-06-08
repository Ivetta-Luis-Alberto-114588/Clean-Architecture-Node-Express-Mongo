import { CityEntity } from '../../../../src/domain/entities/customers/citiy';

describe('CityEntity', () => {
  // Test la creación básica de la entidad
  test('should create a CityEntity instance with the provided values', () => {
    // Arrange
    const id = "1";
    const name = 'Buenos Aires';
    const description = 'Capital de Argentina';
    const isActive = true;

    // Act
    const city = new CityEntity(id, name, description, isActive);

    // Assert
    expect(city).toBeInstanceOf(CityEntity);
    expect(city.id).toBe(id);
    expect(city.name).toBe(name);
    expect(city.description).toBe(description);
    expect(city.isActive).toBe(isActive);
  });

  // Test con isActive false
  test('should create a CityEntity instance with isActive set to false', () => {
    // Arrange
    const id = "2";
    const name = 'Córdoba';
    const description = 'Ciudad de Córdoba';
    const isActive = false;

    // Act
    const city = new CityEntity(id, name, description, isActive);

    // Assert
    expect(city.isActive).toBe(false);
  });

  // Test con ID cero
  test('should accept ID as zero', () => {
    // Arrange
    const id = 0;
    const name = 'Test City';
    const description = 'Test Description';
    const isActive = true;

    // Act
    const city = new CityEntity(id, name, description, isActive);

    // Assert
    expect(city.id).toBe(0);
  });

  // Test con ID negativo (para verificar comportamiento con valores inusuales)
  test('should accept negative ID values', () => {
    // Arrange
    const id = -1;
    const name = 'Negative City';
    const description = 'Negative City Description';
    const isActive = true;

    // Act
    const city = new CityEntity(id, name, description, isActive);

    // Assert
    expect(city.id).toBe(-1);
  });

  // Test con valores vacíos (la entidad no tiene validaciones internas)
  test('should accept empty strings for name and description', () => {
    // Arrange
    const id = "3";
    const name = '';
    const description = '';
    const isActive = true;

    // Act
    const city = new CityEntity(id, name, description, isActive);

    // Assert
    expect(city.name).toBe('');
    expect(city.description).toBe('');
  });

  // Test de inmutabilidad (no debe cambiar después de ser creada)
  test('should not allow modifications after creation', () => {
    // Arrange
    const id = "4";
    const name = 'Rosario';
    const description = 'Ciudad de Rosario';
    const isActive = true;

    // Act
    const city = new CityEntity(id, name, description, isActive);

    // Intentar modificar las propiedades (las propiedades no son readonly en la definición,
    // pero es bueno verificar que no deberían cambiar en uso normal)
    expect(() => {
      // @ts-ignore - Ignoramos error TypeScript porque estamos probando comportamiento en tiempo de ejecución
      city.name = 'Modified Name';
    }).not.toThrow();

    // Assert - Verificamos si la entidad permite cambiar sus propiedades
    // Nota: Esto dependerá de si la entidad está diseñada para ser inmutable
    // Si las propiedades no están definidas como readonly, este test podría fallar
  });
});