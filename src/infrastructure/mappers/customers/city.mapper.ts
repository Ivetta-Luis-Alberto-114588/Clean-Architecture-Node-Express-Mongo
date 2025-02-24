import { CityEntity } from "../../../domain/entities/customers/citiy";
import { CustomError } from "../../../domain/errors/custom.error";

export class CityMapper {
    
    // De objeto MongoDB a entidad
    static fromObjectToCityEntity(object: {[key: string]: any}): CityEntity {
        
        const {_id, id, name, description, isActive} = object;
        
        // Validaciones
        if(!_id && !id) throw CustomError.badRequest('mapper missing id');
        if(!name) throw CustomError.badRequest("mapper missing name");
        if(!description) throw CustomError.badRequest("mapper missing description");
        if(isActive !== undefined && typeof isActive !== 'boolean') 
            throw CustomError.badRequest("mapper isActive must be a boolean");
        
        return new CityEntity(
            _id || id,
            name,
            description,
            isActive ?? true // Valor por defecto si isActive es undefined
        );
    }
    
    // De entidad a objeto para MongoDB
    static fromCityEntityToObject(entity: CityEntity): any {
        return {
            name: entity.name.toLowerCase(),
            description: entity.description.toLowerCase(),
            isActive: entity.isActive
        };
    }
}