import { CategoryEntity } from "../../entities/products/category.entity";
import { UnitEntity } from "../../entities/products/unit.entity";
import { CustomError } from "../../errors/custom.error";
import { UnitRepository } from "../../repositories/products/unit.repository";

interface IGetUnitByIdUseCase {
    execute(id: string): Promise<UnitEntity>
}

export class GetUnitByIdUseCase implements IGetUnitByIdUseCase {
    constructor(
        private readonly unitRepository: UnitRepository
    ) {}

    async execute(id: string): Promise<CategoryEntity> {
        try {
            // Buscamos la categoría por ID
            const unit = await this.unitRepository.findById(id);
            
            // Si no existe, lanzamos un error
            if (!unit) {
                throw CustomError.notFound('Categoría no encontrada');
            }

            return unit;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('get-unit-by-id-use-case error');
        }
    }
}