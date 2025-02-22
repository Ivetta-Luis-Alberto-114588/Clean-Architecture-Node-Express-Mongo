import { UnitEntity } from "../../../domain/entities/products/unit.entity"
import { CustomError } from "../../../domain/errors/custom.error"


export class UnitMapper {
    
    static fromObjectToUnitEntity(object: {[key: string]: any}){
    
            const {_id, id, name, description, isActive} = object
    
            if(!_id || !id) throw CustomError.badRequest('mapper missing id')
            if(!name) throw CustomError.badRequest("mapper missing name")
            if(!description) throw CustomError.badRequest("mapper missing email")
            if(!isActive) throw CustomError.badRequest("mapper missing password")
    
    
            return new UnitEntity(
                _id || id,
                name,
                description,
                isActive 
            )
        }
}