import { UpdateUnitDto } from "../../dtos/products/udpate-unit.dto";
import { UnitEntity } from "../../entities/products/unit.entity";
import { CustomError } from "../../errors/custom.error";
import { UnitRepository } from "../../repositories/products/unit.repository";

interface IUpdateUnitUseCase {
    execute(id: string, updateUnitDto: UpdateUnitDto): Promise<UnitEntity>
}

export class UpdateUnitUseCase implements IUpdateUnitUseCase {
    
    constructor(
        private readonly unitRepository: UnitRepository
    ){}

    async execute(id: string, updateUnitDto: UpdateUnitDto): Promise<UnitEntity> {
        try {
            // Verificamos que la unidad exista
            const existingUnit = await this.unitRepository.findById(id);
            if (!existingUnit) {
                throw CustomError.notFound('update-unit-use-case, Unidad no encontrada');
            }

            // Si la unidad existe, procedemos a actualizarla
            const updatedUnit = await this.unitRepository.updateUnit(id, updateUnitDto);
            return updatedUnit;

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('update-unit-use-case, error interno del servidor');
        }
    }
}