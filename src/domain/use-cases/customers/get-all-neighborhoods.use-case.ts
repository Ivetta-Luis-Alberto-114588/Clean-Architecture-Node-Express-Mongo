import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { NeighborhoodEntity } from "../../entities/customers/neighborhood";
import { CustomError } from "../../errors/custom.error";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";

interface IGetAllNeighborhoodsUseCase {
    execute(paginationDto: PaginationDto): Promise<NeighborhoodEntity[]>
}

export class GetAllNeighborhoodsUseCase implements IGetAllNeighborhoodsUseCase {
    constructor(
        private readonly neighborhoodRepository: NeighborhoodRepository
    ){}

    async execute(paginationDto: PaginationDto): Promise<NeighborhoodEntity[]> {
        try {
            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 5);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            // Obtenemos todos los barrios
            const neighborhoods = await this.neighborhoodRepository.getAll(paginationDto!);

            // Devolvemos los barrios
            return neighborhoods;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("get-all-neighborhoods-use-case, error interno del servidor");
        }
    }
}