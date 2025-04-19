import { UnitEntity } from "../../../domain/entities/products/unit.entity"
import { CustomError } from "../../../domain/errors/custom.error"

export class UnitMapper {

    static fromObjectToUnitEntity(object: { [key: string]: any }) {

        const { _id, id, name, description, isActive } = object

        // --- VALIDACIONES ---
        // ID: Correcto, asegura que haya un identificador.
        if (!_id && !id) throw CustomError.badRequest('UnitMapper: missing id')
        // Name: Correcto.
        if (!name) throw CustomError.badRequest("UnitMapper: missing name")
        // Description: Correcto.
        if (!description) throw CustomError.badRequest("UnitMapper: missing description")
        // isActive (Type Check): Correcto, valida si se proporciona y no es booleano.
        // La validación comentada `if(!isActive)` no es necesaria si tienes un default.
        if (isActive !== undefined && typeof isActive !== 'boolean') throw CustomError.badRequest("UnitMapper: isActive must be a boolean") // Modificado para chequear solo si existe

        // --- INSTANCIACIÓN ---
        return new UnitEntity(
            _id?.toString() || id?.toString(), // Mejor asegurar que sea string
            name,
            description,
            isActive ?? true // Usar ?? true para asignar explícitamente el default si isActive es null/undefined
        )
    }
}