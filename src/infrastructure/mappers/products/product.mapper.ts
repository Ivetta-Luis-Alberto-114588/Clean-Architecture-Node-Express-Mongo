import { ProductEntity } from "../../../domain/entities/products/product.entity"
import { CustomError } from "../../../domain/errors/custom.error"


export class ProductMapper {
     static fromObjectToProductEntity(object: {[key: string]: any}){
            
            //desestructuramos el objeto
            const { _id, id, name, price, stock, category, unit, imgUrl, isActive, description} = object
            
            //validamos que los campos no esten vacios
            if(!_id && id) throw CustomError.badRequest('mapper missing id')
            if(!name) throw CustomError.badRequest("mapper missing name")
            if(!price) throw CustomError.badRequest("mapper missing price")
            if(!stock) throw CustomError.badRequest("mapper missing stock")
            if(!category) throw CustomError.badRequest("mapper missing category")
            if(!unit) throw CustomError.badRequest("mapper missing unit")
            if(!imgUrl) throw CustomError.badRequest("mapper missing imgUrl")
            if(!isActive) throw CustomError.badRequest("mapper missing isActive")
            if(!description) throw CustomError.badRequest("mapper missing description")
            
            
            //retornamos la entidad
            return new ProductEntity(
                _id || id,
                name,
                price,
                stock,
                category,
                unit,
                imgUrl,
                isActive,
                description
            )
        }
}