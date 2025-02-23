import { CreateCategoryDto } from "../../dtos/products/create-category";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CategoryEntity } from "../../entities/products/category.entity";
import { CustomError } from "../../errors/custom.error";
import { CategoryRepository } from "../../repositories/products/categroy.repository";

interface ICreateCategoryUseCase {
    execute(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity>
}

export class CreateCategoryUseCase implements ICreateCategoryUseCase {

    constructor(
        private readonly categoryRepository: CategoryRepository,
    ) { }

    async execute(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {

        try {

            // Validaciones de negocio específicas para categoria
            if (createCategoryDto.name.length < 2) {
                throw CustomError.badRequest('El nombre de la categoria debe tener al menos 2 caracteres');
                }


            // crear paginacion por defecto
            const [error, paginationDto] = PaginationDto.create(1, 5);
            if (error) throw CustomError.badRequest(error);

            //verifico que no exista la categoria
            const categoryExist = await this.categoryRepository.findByNameForCreate(createCategoryDto.name, paginationDto!)
            if (categoryExist) throw CustomError.badRequest("create-category-use-case, category already exist")

            //creo la categoria pero todo con minusculas
            createCategoryDto.name = createCategoryDto.name.toLowerCase();
            createCategoryDto.description = createCategoryDto.description.toLowerCase();


            const category = await this.categoryRepository.create(createCategoryDto)

            return category;

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("create-category-use-case, internal server error");
        }
    }

}