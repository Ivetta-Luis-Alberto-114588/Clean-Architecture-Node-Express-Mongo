import { CreateUnitDto } from "../../dtos/products/create-unit.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { UnitEntity } from "../../entities/products/unit.entity";
import { CustomError } from "../../errors/custom.error";
import { UnitRepository } from "../../repositories/products/unit.repository";


interface ICreateUnitUseCase {
    execute(createUnitDto: CreateUnitDto): Promise<UnitEntity>
}

export class CreateUnitUseCase implements ICreateUnitUseCase {
    
    constructor(private readonly unitRepository: UnitRepository){}

    async execute(createUnitDto: CreateUnitDto): Promise<UnitEntity> {
        try {

            // Validaciones de negocio específicas para unit
            if (createUnitDto.name.length < 2) {
            throw CustomError.badRequest('El nombre de la unidad debe tener al menos 2 caracteres');
            }


            // crear paginacion por defecto
            const [error, paginationDto] = PaginationDto.create(1, 5);
            if (error) throw CustomError.badRequest(error);

            // verificar si existe la unity
            const xExist = await this.unitRepository.findByNameForCreate(createUnitDto.name, paginationDto!)
            if(xExist) throw CustomError.badRequest("create-unit-use-case, unit already exist")  

            //creo la unidad todo con minusculas
            createUnitDto.name = createUnitDto.name.toLowerCase();
            createUnitDto.description = createUnitDto.description.toLowerCase();

            // crear la unity
            const x = await this.unitRepository.create(createUnitDto)
            return x;
            
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("create-unit-use-case, internal server error")                
        }
    }

}