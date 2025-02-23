import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { UnitEntity } from "../../entities/products/unit.entity";
import { CustomError } from "../../errors/custom.error";
import { UnitRepository } from "../../repositories/products/unit.repository";


interface IGetAllUnitUseCase {
    execute(paginationDto: PaginationDto): Promise<UnitEntity[]>
}

export class GetAllUnitUseCase implements IGetAllUnitUseCase {

    constructor(
        private readonly unitRepository: UnitRepository
    ){}

    async execute(paginationDto: PaginationDto): Promise<UnitEntity[]> {
        try {
            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 5);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            //obtengo todos las unit
            const units = await this.unitRepository.getAll(paginationDto!)

            //devuelvo las unit
            return units;

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("get-all-units-use-case, error interno del servidor")            
        }
    }

}