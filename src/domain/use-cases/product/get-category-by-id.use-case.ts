import { CategoryEntity } from "../../entities/products/category.entity";
import { CustomError } from "../../errors/custom.error";
import { CategoryRepository } from "../../repositories/products/categroy.repository";

interface IGetCategoryByIdUseCase {
    execute(id: string): Promise<CategoryEntity>
}

export class GetCategoryByIdUseCase implements IGetCategoryByIdUseCase {
    constructor(
        private readonly categoryRepository: CategoryRepository
    ) {}

    async execute(id: string): Promise<CategoryEntity> {
        try {
            // Buscamos la categoría por ID
            const category = await this.categoryRepository.findById(id);
            
            // Si no existe, lanzamos un error
            if (!category) {
                throw CustomError.notFound('Categoría no encontrada');
            }

            return category;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('get-category-by-id-use-case error');
        }
    }
}