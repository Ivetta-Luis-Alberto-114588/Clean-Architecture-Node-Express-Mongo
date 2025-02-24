import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CityEntity } from "../../entities/customers/citiy";
import { CustomError } from "../../errors/custom.error";
import { CityRepository } from "../../repositories/customers/city.repository";

interface IFindCityByNameUseCase {
    execute(name: string, paginationDto: PaginationDto): Promise<CityEntity>
}

export class FindCityByNameUseCase implements IFindCityByNameUseCase {
    constructor(
        private readonly cityRepository: CityRepository
    ){}

    async execute(name: string, paginationDto: PaginationDto): Promise<CityEntity> {
        try {
            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 5);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            // Buscamos la ciudad por nombre
            const city = await this.cityRepository.findByName(name, paginationDto);
            
            // Si no existe, el repositorio ya debe haber lanzado un error

            return city;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("find-city-by-name-use-case, error interno del servidor");
        }
    }
}