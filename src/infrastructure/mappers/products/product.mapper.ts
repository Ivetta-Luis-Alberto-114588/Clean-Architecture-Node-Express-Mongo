import { ProductEntity } from "../../../domain/entities/products/product.entity"
import { CustomError } from "../../../domain/errors/custom.error"

export class ProductMapper {
     static fromObjectToProductEntity(object: {[key: string]: any}){
            
            //desestructuramos el objeto
            const { _id, id, name, price, stock = 0, category, unit, imgUrl, isActive, description = "" } = object
            
            // Mejoramos la validación del ID para ser más flexible
            const productId = _id || id;
            if(!productId) throw CustomError.badRequest('mapper missing id');
            
            if(!name) throw CustomError.badRequest("mapper missing name")
            if(price === undefined) throw CustomError.badRequest("mapper missing price")
            if(!category) throw CustomError.badRequest("mapper missing category")
            if(!unit) throw CustomError.badRequest("mapper missing unit")
            if(!imgUrl) throw CustomError.badRequest("mapper missing imgUrl")
            
            // Si isActive no está definido, asumimos que es true
            const productIsActive = isActive !== undefined ? isActive : true;
            if(typeof productIsActive !== 'boolean') throw CustomError.badRequest("mapper isActive must be a boolean")
            
            //retornamos la entidad
            return new ProductEntity(
                productId,
                name,
                price || 0,
                stock, // Usamos el valor predeterminado si no existe
                category,
                unit,
                imgUrl || "",
                productIsActive,
                description
            )
        }
}