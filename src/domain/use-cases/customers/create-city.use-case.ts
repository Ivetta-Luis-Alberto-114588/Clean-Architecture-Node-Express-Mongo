// src/domain/use-cases/customers/create-city.use-case.ts
import { CreateCityDto } from "../../dtos/customers/create-city.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CityEntity } from "../../entities/customers/citiy";
import { CustomError } from "../../errors/custom.error";
import { CityRepository } from "../../repositories/customers/city.repository";

interface ICreateCityUseCase {
    execute(createCityDto: CreateCityDto): Promise<CityEntity>;
}

export class CreateCityUseCase implements ICreateCityUseCase {
    
    constructor(private readonly cityRepository: CityRepository) {}
    
    async execute(createCityDto: CreateCityDto): Promise<CityEntity> {
        try {
            // Validaciones de negocio
            if (createCityDto.name.length < 3) {
                throw CustomError.badRequest("City name must have at least 3 characters");
            }
            
            // Verificar si la ciudad ya existe
            const [error, paginationDto] = PaginationDto.create(1, 1);
            if (error) throw CustomError.badRequest(error);
            
            const existingCity = await this.cityRepository.findByNameForCreate(
                createCityDto.name,
                paginationDto!
            );
            
            if (existingCity) {
                throw CustomError.badRequest("City with this name already exists");
            }
            
            // Crear la ciudad
            return await this.cityRepository.create(createCityDto);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("create-city-use-case, internal server error");
        }
    }
}