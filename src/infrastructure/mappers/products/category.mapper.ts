import { CategoryEntity } from "../../../domain/entities/products/category.entity"
import { CustomError } from "../../../domain/errors/custom.error"

export class CategoryMapper {


    static fromObjectToCategoryEntity(object: { [key: string]: any }) {

        //desestructuramos el objeto
        const { _id, id, name, description, isActive } = object

        // --- VALIDACIONES ---
        // ID: Correcto.
        if (!_id && !id) throw CustomError.badRequest('CategoryMapper: missing id')
        // Name: Correcto.
        if (!name) throw CustomError.badRequest("CategoryMapper: missing name")
        // Description: Correcto.
        if (!description) throw CustomError.badRequest("CategoryMapper: missing description")
        // isActive (Type Check): Correcto.
        if (isActive !== undefined && typeof isActive !== 'boolean') throw CustomError.badRequest("CategoryMapper: isActive must be a boolean") // Modificado


        // --- INSTANCIACIÓN ---
        return new CategoryEntity(
            _id?.toString() || id?.toString(), // Mejor asegurar que sea string
            name,
            description,
            isActive ?? true // Usar ?? true para asignar explícitamente el default
        )
    }
}