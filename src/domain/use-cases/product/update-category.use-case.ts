import { UpdateCategoryDto } from "../../dtos/products/update-category.dto";
import { CategoryEntity } from "../../entities/products/category.entity";
import { CustomError } from "../../errors/custom.error";
import { CategoryRepository } from "../../repositories/products/categroy.repository";

interface IUpdateCategoryUseCase {
    execute(id: string, updateUnitDto: UpdateCategoryDto): Promise<CategoryEntity>
}


export class UpdateCategoryUseCase implements IUpdateCategoryUseCase {
    
    constructor(
        private readonly categoryRepository: CategoryRepository
    ){}

    async execute(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryEntity> {
        try {
            // Verificamos que la category exista
            const existingCategory = await this.categoryRepository.findById(id);
            if (!existingCategory) {
                throw CustomError.notFound('update-unit-use-case, Unidad no encontrada');
            }

            // Si la category existe, procedemos a actualizarla
            const updatedCategory = await this.categoryRepository.update(id, updateCategoryDto);
            return updatedCategory;

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('update-unit-use-case, error interno del servidor');
        }
    }
}