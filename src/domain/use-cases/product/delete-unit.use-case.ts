import { UnitEntity } from "../../entities/products/unit.entity";
import { CustomError } from "../../errors/custom.error";
import { UnitRepository } from "../../repositories/products/unit.repository";

interface IDeleteUnitUseCase {
    execute(id: string): Promise<UnitEntity>
}


export class DeleteUnitUseCase implements IDeleteUnitUseCase {

    constructor(
        private readonly unitRepository: UnitRepository
    ){}

    async execute(id: string): Promise<UnitEntity> {
        try {
            //busco el producto
            const unit = await this.unitRepository.findById(id)

            //si no existe lanzo un error
            if (!unit) {
                throw CustomError.notFound("delete-unit-use-case, unidad no encontrada");
            }

            //guardo la unidad eliminada 
            const deletedUnit = await this.unitRepository.deleteUnit(id);

            //elimino el producto
            return deletedUnit

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("delete-unit-use-case, error interno del servidor")            
        }
    }

}