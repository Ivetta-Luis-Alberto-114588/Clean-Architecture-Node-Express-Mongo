import { CategoryEntity } from "../../entities/products/category.entity";
import { CustomError } from "../../errors/custom.error";
import { CategoryRepository } from "../../repositories/products/categroy.repository";

interface IDeleteUnitUseCase {
    execute(id: string): Promise<CategoryEntity>    
}

export class DeleteCategoryUseCase implements IDeleteUnitUseCase {

    constructor(
        private readonly categoryRepository: CategoryRepository
    ){}

    async execute(id: string): Promise<CategoryEntity> {
        try {
            //busco el producto
            const category = await this.categoryRepository.findById(id)

            //si no existe lanzo un error
            if (!category) {
                throw CustomError.notFound("delete-category-use-case, categoria no encontrada");
            }

            // Eliminamos la categoría y la guardo en deletedCategory
            const deletedCategory = await this.categoryRepository.delete(id);
            
            return deletedCategory;

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("delete-category-use-case, error interno del servidor")            
        }
    }

}