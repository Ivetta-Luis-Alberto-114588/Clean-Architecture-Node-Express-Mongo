import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CityEntity } from "../../entities/customers/citiy";
import { CustomError } from "../../errors/custom.error";
import { CityRepository } from "../../repositories/customers/city.repository";

interface IGetAllCitiesUseCase {
    execute(paginationDto: PaginationDto): Promise<CityEntity[]>
}

export class GetAllCitiesUseCase implements IGetAllCitiesUseCase {
    constructor(
        private readonly cityRepository: CityRepository
    ){}

    async execute(paginationDto: PaginationDto): Promise<CityEntity[]> {
        try {
            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 5);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            // Obtenemos todas las ciudades
            const cities = await this.cityRepository.getAll(paginationDto!);

            // Devolvemos las ciudades
            return cities;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("get-all-cities-use-case, error interno del servidor");
        }
    }
}