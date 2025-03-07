import { CityEntity } from "../../../../src/domain/entities/customers/citiy";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { DeleteCityUseCase } from "../../../../src/domain/use-cases/customers/delete-city.use-case";

describe('DeleteCityUseCase', () => {
  // Mock del CityRepository
  const mockCityRepository = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByName: jest.fn(),
    findByNameForCreate: jest.fn()
  };

  // Instancia del caso de uso que vamos a probar
  const deleteCity = new DeleteCityUseCase(mockCityRepository);

  // Ciudad de ejemplo para pruebas
  const mockCity: CityEntity = {
    id: 1,
    name: 'test city',
    description: 'test description',
    isActive: true
  };

  // Antes de cada prueba, reiniciar los mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should delete a city when it exists', async () => {
    // Configurar el comportamiento esperado del mock
    mockCityRepository.findById.mockResolvedValue(mockCity);
    mockCityRepository.delete.mockResolvedValue(mockCity);

    // Ejecutar el caso de uso
    const result = await deleteCity.execute('1');

    // Verificar que se llamaron los métodos correctos
    expect(mockCityRepository.findById).toHaveBeenCalledWith('1');
    expect(mockCityRepository.delete).toHaveBeenCalledWith('1');

    // Verificar el resultado
    expect(result).toEqual(mockCity);
  });

  test('should throw a not found error when city does not exist', async () => {
    // Configurar el comportamiento esperado del mock para simular una ciudad no encontrada
    mockCityRepository.findById.mockResolvedValue(null);

    // Ejecutar el caso de uso y esperar que lance un error
    await expect(deleteCity.execute('nonexistent-id'))
      .rejects
      .toBeInstanceOf(CustomError);

    // Verificar que findById fue llamado pero delete no
    expect(mockCityRepository.findById).toHaveBeenCalledWith('nonexistent-id');
    expect(mockCityRepository.delete).not.toHaveBeenCalled();
  });

  test('should propagate CustomErrors from repository', async () => {
    // Configurar el mock para que findById lance un CustomError
    const customError = new CustomError(404, 'city not found');
    mockCityRepository.findById.mockRejectedValue(customError);

    // Ejecutar y verificar que el error se propaga
    await expect(deleteCity.execute('1'))
      .rejects
      .toBe(customError);

    expect(mockCityRepository.findById).toHaveBeenCalledWith('1');
    expect(mockCityRepository.delete).not.toHaveBeenCalled();
  });

  test('should convert unknown errors to internal server errors', async () => {
    // Configurar el mock para lanzar un error genérico
    mockCityRepository.findById.mockResolvedValue(mockCity);
    mockCityRepository.delete.mockRejectedValue(new Error('Database connection failed'));

    // Ejecutar el caso de uso
    const resultPromise = deleteCity.execute('1');

    // Verificar que se convierte a un CustomError con código 500
    await expect(resultPromise)
      .rejects
      .toBeInstanceOf(CustomError);
    
    await resultPromise.catch(error => {
      expect(error.statusCode).toBe(500);
      expect(error.message).toContain('error interno del servidor');
    });

    // Verificar que los métodos fueron llamados
    expect(mockCityRepository.findById).toHaveBeenCalledWith('1');
    expect(mockCityRepository.delete).toHaveBeenCalledWith('1');
  });

  test('should handle successfully deleted city', async () => {
    // Configurar el comportamiento esperado para una eliminación exitosa
    const deletedCity: CityEntity = { ...mockCity, isActive: false };
    mockCityRepository.findById.mockResolvedValue(mockCity);
    mockCityRepository.delete.mockResolvedValue(deletedCity);

    // Ejecutar el caso de uso
    const result = await deleteCity.execute('1');

    // Verificar que se llamaron los métodos correctos
    expect(mockCityRepository.findById).toHaveBeenCalledWith('1');
    expect(mockCityRepository.delete).toHaveBeenCalledWith('1');

    // Verificar el resultado (la ciudad eliminada)
    expect(result).toEqual(deletedCity);
    expect(result).not.toBe(mockCity); // Asegurarse de que es una referencia diferente
  });
});