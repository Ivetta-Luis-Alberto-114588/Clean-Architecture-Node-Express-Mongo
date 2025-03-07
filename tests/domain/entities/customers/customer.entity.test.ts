import { CustomerEntity } from '../../../../src/domain/entities/customers/customer';
import { NeighborhoodEntity } from '../../../../src/domain/entities/customers/neighborhood';
import { CityEntity } from '../../../../src/domain/entities/customers/citiy';

describe('CustomerEntity', () => {
  // Crear objetos mock para las pruebas
  const mockCity = new CityEntity(
    1,
    'Test City',
    'Test City Description',
    true
  );

  const mockNeighborhood = new NeighborhoodEntity(
    2,
    'Test Neighborhood',
    'Test Neighborhood Description',
    mockCity,
    true
  );

  // Test de creación básica
  test('should create a CustomerEntity instance with all properties', () => {
    // Arrange
    const id = 3;
    const name = 'John Doe';
    const email = 'john.doe@example.com';
    const phone = '+123456789';
    const address = 'Test Street 123';
    const isActive = true;

    // Act
    const customer = new CustomerEntity(
      id, 
      name, 
      email, 
      phone, 
      address, 
      mockNeighborhood, 
      isActive
    );

    // Assert
    expect(customer).toBeInstanceOf(CustomerEntity);
    expect(customer.id).toBe(id);
    expect(customer.name).toBe(name);
    expect(customer.email).toBe(email);
    expect(customer.phone).toBe(phone);
    expect(customer.address).toBe(address);
    expect(customer.neighborhood).toBe(mockNeighborhood);
    expect(customer.isActive).toBe(isActive);
  });

  // Test con isActive false
  test('should create a CustomerEntity instance with isActive set to false', () => {
    // Arrange
    const id = 4;
    const name = 'Jane Doe';
    const email = 'jane.doe@example.com';
    const phone = '+987654321';
    const address = 'Another Street 456';
    const isActive = false;

    // Act
    const customer = new CustomerEntity(
      id, 
      name, 
      email, 
      phone, 
      address, 
      mockNeighborhood, 
      isActive
    );

    // Assert
    expect(customer.isActive).toBe(false);
  });

  // Test con valor por defecto para isActive
  test('should set isActive to true by default when not provided', () => {
    // Arrange
    const id = 5;
    const name = 'Default Active User';
    const email = 'default.active@example.com';
    const phone = '+111222333';
    const address = 'Default Street 789';

    // Act - No enviamos isActive (usará valor por defecto)
    const customer = new CustomerEntity(
      id, 
      name, 
      email, 
      phone, 
      address, 
      mockNeighborhood
    );

    // Assert
    expect(customer.isActive).toBe(true);
  });

  // Test de relación completa (acceder a la ciudad a través del barrio)
  test('should allow access to city through neighborhood', () => {
    // Arrange
    const id = 6;
    const name = 'Relation Test User';
    const email = 'relation.test@example.com';
    const phone = '+444555666';
    const address = 'Relation Street 101';
    const isActive = true;

    // Act
    const customer = new CustomerEntity(
      id, 
      name, 
      email, 
      phone, 
      address, 
      mockNeighborhood, 
      isActive
    );

    // Assert - Verificamos que podemos navegar por la relación
    expect(customer.neighborhood.city).toBe(mockCity);
    expect(customer.neighborhood.city.name).toBe('Test City');
  });

  // Test con valores extraños (verificar comportamiento con valores inusuales)
  test('should accept unusual values for id, name, email, etc.', () => {
    // Arrange
    const id = -7; // ID negativo
    const name = ''; // Nombre vacío
    const email = 'ñáéíóú@special-chars.com'; // Email con caracteres especiales
    const phone = ''; // Teléfono vacío
    const address = ''; // Dirección vacía
    const isActive = true;

    // Act
    const customer = new CustomerEntity(
      id, 
      name, 
      email, 
      phone, 
      address, 
      mockNeighborhood, 
      isActive
    );

    // Assert - La entidad no tiene validaciones internas, así que debería aceptar estos valores
    expect(customer.id).toBe(-7);
    expect(customer.name).toBe('');
    expect(customer.email).toBe('ñáéíóú@special-chars.com');
    expect(customer.phone).toBe('');
    expect(customer.address).toBe('');
  });
});