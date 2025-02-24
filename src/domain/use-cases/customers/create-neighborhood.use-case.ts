import { CreateNeighborhoodDto } from "../../dtos/customers/create-neighborhood.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { NeighborhoodEntity } from "../../entities/customers/neighborhood";
import { CustomError } from "../../errors/custom.error";
import { CityRepository } from "../../repositories/customers/city.repository";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";

interface ICreateNeighborhoodUseCase {
    execute(createNeighborhoodDto: CreateNeighborhoodDto): Promise<NeighborhoodEntity>;
}

export class CreateNeighborhoodUseCase implements ICreateNeighborhoodUseCase {
    constructor(
        private readonly neighborhoodRepository: NeighborhoodRepository,
        private readonly cityRepository: CityRepository
    ) {}
    
    async execute(createNeighborhoodDto: CreateNeighborhoodDto): Promise<NeighborhoodEntity> {
        try {
            // Validaciones de negocio
            if (createNeighborhoodDto.name.length < 3) {
                throw CustomError.badRequest("El nombre del barrio debe tener al menos 3 caracteres");
            }
            
            // Verificar que la ciudad exista
            await this.cityRepository.findById(createNeighborhoodDto.cityId);
            
            // Verificar si el barrio ya existe en esa ciudad
            const [error, paginationDto] = PaginationDto.create(1, 1);
            if (error) throw CustomError.badRequest(error);
            
            const existingNeighborhood = await this.neighborhoodRepository.findByNameForCreate(
                createNeighborhoodDto.name,
                createNeighborhoodDto.cityId,
                paginationDto!
            );
            
            if (existingNeighborhood) {
                throw CustomError.badRequest("Ya existe un barrio con este nombre en esta ciudad");
            }
            
            // Crear el barrio
            return await this.neighborhoodRepository.create(createNeighborhoodDto);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("create-neighborhood-use-case, error interno del servidor");
        }
    }
}