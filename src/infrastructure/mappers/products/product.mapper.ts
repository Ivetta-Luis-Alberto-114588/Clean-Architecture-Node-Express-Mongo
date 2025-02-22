import { ProductEntity } from "../../../domain/entities/products/product.entity"


export class ProductMapper {
     static fromObjectToProductEntity(object: {[key: string]: any}){
            
            //desestructuramos el objeto
            const { _id, id, name, price, stock, category, unit, imgUrl, isActive, description} = object
            
            //validamos que los campos no esten vacios
            if(!_id || id) throw new Error('mapper missing id')
            if(!name) throw new Error("mapper missing name")
            if(!price) throw new Error("mapper missing price")
            if(!stock) throw new Error("mapper missing stock")
            if(!category) throw new Error("mapper missing category")
            if(!unit) throw new Error("mapper missing unit")
            if(!imgUrl) throw new Error("mapper missing imgUrl")
            if(!isActive) throw new Error("mapper missing isActive")
            if(!description) throw new Error("mapper missing description")
            
            
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