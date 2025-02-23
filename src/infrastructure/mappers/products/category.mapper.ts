import { CategoryEntity } from "../../../domain/entities/products/category.entity"
import { CustomError } from "../../../domain/errors/custom.error"

export class CategoryMapper {
    
    
    static fromObjectToCategoryEntity(object: {[key: string]: any}){
        
        //desestructuramos el objeto
        const {_id, id, name, description, isActive} = object
        
        //validamos que los campos no esten vacios
        if(!_id || !id) throw CustomError.badRequest('mapper missing id')
        if(!name) throw CustomError.badRequest("mapper missing name")
        if(!description) throw CustomError.badRequest("mapper missing description")
        // if(!isActive) throw CustomError.badRequest("mapper missing password")
        if(typeof isActive !== 'boolean') throw CustomError.badRequest("mapper isActive must be a boolean")
        
        
        //retornamos la entidad
        return new CategoryEntity(
            _id || id,
            name,
            description,
            isActive 
        )
    }
}