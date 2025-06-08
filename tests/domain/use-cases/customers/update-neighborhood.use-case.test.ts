// tests/domain/use-cases/customers/update-neighborhood.use-case.test.ts
import { UpdateNeighborhoodDto } from "../../../../src/domain/dtos/customers/update-neighborhood.dto";
import { NeighborhoodEntity } from "../../../../src/domain/entities/customers/neighborhood";
import { CityEntity } from "../../../../src/domain/entities/customers/citiy";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { NeighborhoodRepository } from "../../../../src/domain/repositories/customers/neighborhood.repository";
import { CityRepository } from "../../../../src/domain/repositories/customers/city.repository";
import { UpdateNeighborhoodUseCase } from "../../../../src/domain/use-cases/customers/update-neighborhood.use-case";
import mongoose from "mongoose";

describe('UpdateNeighborhoodUseCase', () => {
  // Mocks de los repositorios
  const mockNeighborhoodRepository: jest.Mocked<NeighborhoodRepository> = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByName: jest.fn(),
    findByNameForCreate: jest.fn(),
    findByCity: jest.fn()
  };

  const mockCityRepository: jest.Mocked<CityRepository> = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByName: jest.fn(),
    findByNameForCreate: jest.fn()
  };

  // Inicialización del caso de uso a probar
  let updateNeighborhoodUseCase: UpdateNeighborhoodUseCase;

  // Datos de prueba
  const neighborhoodId = new mongoose.Types.ObjectId().toString();
  const cityId = new mongoose.Types.ObjectId().toString();
  const newCityId = new mongoose.Types.ObjectId().toString();

  const validUpdateData = {
    name: 'Barrio Actualizado',
    description: 'Descripción actualizada',
    cityId: newCityId,
    isActive: false
  };

  // Crear el DTO usando el método estático update
  const [error, validUpdateNeighborhoodDto] = UpdateNeighborhoodDto.update(validUpdateData);

  // Verificar que no hay error y el DTO se creó correctamente
  if (error || !validUpdateNeighborhoodDto) {
    throw new Error(`Failed to create test UpdateNeighborhoodDto: ${error}`);
  }

  // Mocks de entidades para las pruebas
  const mockCity: CityEntity = {
    id: "1",
    name: 'Ciudad Original',
    description: 'Descripción Original',
    isActive: true
  };

  const mockNewCity: CityEntity = {
    id: "2",
    name: 'Ciudad Nueva',
    description: 'Descripción Nueva',
    isActive: true
  };

  const mockExistingNeighborhood: NeighborhoodEntity = {
    id: "3",
    name: 'Barrio Original',
    description: 'Descripción Original',
    city: mockCity,
    isActive: true
  };

  const mockUpdatedNeighborhood: NeighborhoodEntity = {
    id: "3",
    name: 'Barrio Actualizado',
    description: 'Descripción actualizada',
    city: mockNewCity,
    isActive: false
  };

  // Configuración previa a cada prueba
  beforeEach(() => {
    jest.resetAllMocks();
    updateNeighborhoodUseCase = new UpdateNeighborhoodUseCase(
      mockNeighborhoodRepository,
      mockCityRepository
    );

    // Configurar el comportamiento por defecto de los mocks
    mockNeighborhoodRepository.findById.mockResolvedValue(mockExistingNeighborhood);
    mockCityRepository.findById.mockResolvedValue(mockNewCity);
    mockNeighborhoodRepository.update.mockResolvedValue(mockUpdatedNeighborhood);
  });

  // Prueba del flujo exitoso
  test('should update a neighborhood successfully', async () => {
    // Ejecutar el caso de uso
    const result = await updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto);

    // Verificaciones
    expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(neighborhoodId);

    // Si el DTO incluye cityId, verificamos que se consultó la ciudad
    if (validUpdateNeighborhoodDto.cityId) {
      expect(mockCityRepository.findById).toHaveBeenCalledWith(validUpdateNeighborhoodDto.cityId);
    }

    expect(mockNeighborhoodRepository.update).toHaveBeenCalledWith(neighborhoodId, validUpdateNeighborhoodDto);
    expect(result).toEqual(mockUpdatedNeighborhood);
  });

  // Prueba de barrio no encontrado
  test('should throw an error if neighborhood is not found', async () => {
    // Simular que el barrio no existe
    mockNeighborhoodRepository.findById.mockRejectedValue(
      CustomError.notFound('update-neighborhood-use-case, Barrio no encontrado')
    );

    // Verificar que se lanza el error adecuado
    await expect(updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto))
      .rejects
      .toThrow(CustomError);

    await expect(updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto))
      .rejects
      .toThrow(/Barrio no encontrado/);

    // Verificar que no se intentó actualizar el barrioshould throw an error if new city is not found
    expect(mockNeighborhoodRepository.update).not.toHaveBeenCalled();
  });

  // Prueba de ciudad no encontrada
  test('should throw an error if new city is not found', async () => {
    // Creamos un DTO que solo actualiza la ciudad
    const updateCityOnlyDto = {
      name: 'Nombre temporal',
      description: 'Descripción temporal',
      cityId: newCityId
    };

    const [error, dto] = UpdateNeighborhoodDto.update(updateCityOnlyDto);
    expect(error).toBeUndefined();

    // Simular que la ciudad no existe
    mockCityRepository.findById.mockRejectedValue(
      CustomError.notFound('Ciudad no encontrada')
    );

    // Verificar que se lanza el error adecuado
    await expect(updateNeighborhoodUseCase.execute(neighborhoodId, dto!))
      .rejects
      .toThrow(CustomError);

    await expect(updateNeighborhoodUseCase.execute(neighborhoodId, dto!))
      .rejects
      .toThrow(/Ciudad no encontrada/);

    // Verificar que no se intentó actualizar el barrio
    expect(mockNeighborhoodRepository.update).not.toHaveBeenCalled();
  });

  // Prueba para actualizar solo el nombre
  test('should update only the name successfully', async () => {
    // Creamos un DTO que solo actualiza el nombre
    const updateNameOnlyDto = {
      name: 'Nuevo Nombre de Barrio',
      description: "Descripción temporal", // Incluimos un campo temporal para evitar errores de validación
    };

    const [error, dto] = UpdateNeighborhoodDto.update(updateNameOnlyDto);
    expect(error).toBeUndefined();

    // Actualizamos el resultado esperado para reflejar solo el cambio de nombre
    const expectedResult = {
      ...mockExistingNeighborhood,
      name: 'Nuevo Nombre de Barrio'
    };

    mockNeighborhoodRepository.update.mockResolvedValue(expectedResult);

    // Ejecutar el caso de uso
    const result = await updateNeighborhoodUseCase.execute(neighborhoodId, dto!);

    // Verificaciones
    expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(neighborhoodId);
    expect(mockCityRepository.findById).not.toHaveBeenCalled(); // No debería verificar la ciudad
    expect(mockNeighborhoodRepository.update).toHaveBeenCalledWith(neighborhoodId, dto);
    expect(result).toEqual(expectedResult);
  });

  // Prueba para actualizar solo la descripción
  test('should update only the description successfully', async () => {
    // Creamos un DTO que solo actualiza la descripción
    const updateDescriptionOnlyDto = {
      name: 'Nombre temporal', // Incluimos un campo temporal para evitar errores de validación
      description: 'Nueva descripción detallada'
    };

    const [error, dto] = UpdateNeighborhoodDto.update(updateDescriptionOnlyDto);
    expect(error).toBeUndefined();

    // Actualizamos el resultado esperado para reflejar solo el cambio de descripción
    const expectedResult = {
      ...mockExistingNeighborhood,
      description: 'Nueva descripción detallada'
    };

    mockNeighborhoodRepository.update.mockResolvedValue(expectedResult);

    // Ejecutar el caso de uso
    const result = await updateNeighborhoodUseCase.execute(neighborhoodId, dto!);

    // Verificaciones
    expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(neighborhoodId);
    expect(mockCityRepository.findById).not.toHaveBeenCalled(); // No debería verificar la ciudad
    expect(mockNeighborhoodRepository.update).toHaveBeenCalledWith(neighborhoodId, dto);
    expect(result).toEqual(expectedResult);
  });

  // Prueba para actualizar solo el estado activo
  test('should update only the active status successfully', async () => {
    // Creamos un DTO que solo actualiza el estado activo
    const updateActiveStatusOnlyDto = {
      name: 'Nombre temporal', // Incluimos un campo temporal para evitar errores de validación
      description: 'Descripción temporal', // Incluimos un campo temporal para evitar errores de validación
      isActive: false
    };

    const [error, dto] = UpdateNeighborhoodDto.update(updateActiveStatusOnlyDto);
    expect(error).toBeUndefined();

    // Actualizamos el resultado esperado para reflejar solo el cambio de estado
    const expectedResult = {
      ...mockExistingNeighborhood,
      isActive: false
    };

    mockNeighborhoodRepository.update.mockResolvedValue(expectedResult);

    // Ejecutar el caso de uso
    const result = await updateNeighborhoodUseCase.execute(neighborhoodId, dto!);

    // Verificaciones
    expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(neighborhoodId);
    expect(mockCityRepository.findById).not.toHaveBeenCalled(); // No debería verificar la ciudad
    expect(mockNeighborhoodRepository.update).toHaveBeenCalledWith(neighborhoodId, dto);
    expect(result).toEqual(expectedResult);
  });

  // Prueba de manejo de errores del repositorio
  test('should handle repository errors', async () => {
    // Simular un error en el repositorio de barrios
    const repositoryError = new Error('Database connection error');
    mockNeighborhoodRepository.update.mockRejectedValue(repositoryError);

    // Verificar que el error se transforma en un CustomError
    await expect(updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto))
      .rejects
      .toBeInstanceOf(CustomError);

    await expect(updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto))
      .rejects
      .toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('update-neighborhood-use-case')
      });
  });

  // Prueba de error específico del dominio
  test('should handle custom domain errors', async () => {
    // Simular un error específico del dominio
    const domainError = CustomError.badRequest('Invalid neighborhood data');
    mockNeighborhoodRepository.update.mockRejectedValue(domainError);

    // Verificar que el error se propaga sin cambios
    await expect(updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto))
      .rejects
      .toThrow(domainError);
  });
});