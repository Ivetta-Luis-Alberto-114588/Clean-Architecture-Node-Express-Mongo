import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CategoryEntity } from "../../entities/products/category.entity";
import { CustomError } from "../../errors/custom.error";
import { CategoryRepository } from "../../repositories/products/categroy.repository";


interface IGetAllCategoryUseCase {
    execute(paginationDto: PaginationDto): Promise<CategoryEntity[]>
}

export class GetAllCategoryUseCase implements IGetAllCategoryUseCase {

    constructor(
        private readonly categoryRepository: CategoryRepository
    ){}

    async execute(paginationDto: PaginationDto): Promise<CategoryEntity[]> {
        try {
            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 5);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            //obtengo todos las categorias
            const categories = await this.categoryRepository.getAll(paginationDto!)

            //devuelvo las categorias
            return categories;

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("get-all-categories-use-case, error interno del servidor")            
        }
    }

}