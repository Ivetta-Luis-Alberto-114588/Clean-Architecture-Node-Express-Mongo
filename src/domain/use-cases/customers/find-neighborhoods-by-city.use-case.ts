import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { NeighborhoodEntity } from "../../entities/customers/neighborhood";
import { CustomError } from "../../errors/custom.error";
import { CityRepository } from "../../repositories/customers/city.repository";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";

interface IFindNeighborhoodsByCityUseCase {
    execute(cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity[]>
}

export class FindNeighborhoodsByCityUseCase implements IFindNeighborhoodsByCityUseCase {
    constructor(
        private readonly neighborhoodRepository: NeighborhoodRepository,
        private readonly cityRepository: CityRepository
    ){}

    async execute(cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity[]> {
        try {
            // Verificamos que la ciudad exista
            await this.cityRepository.findById(cityId);
            
            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 5);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            // Buscamos los barrios por ciudad
            const neighborhoods = await this.neighborhoodRepository.findByCity(cityId, paginationDto);
            
            return neighborhoods;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("find-neighborhoods-by-city-use-case, error interno del servidor");
        }
    }
}