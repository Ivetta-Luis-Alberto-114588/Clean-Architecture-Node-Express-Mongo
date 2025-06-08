// src/infrastructure/mappers/customers/customer.mapper.ts
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { CustomError } from "../../../domain/errors/custom.error";
import { NeighborhoodMapper } from "./neighborhood.mapper";
import { NeighborhoodEntity } from "../../../domain/entities/customers/neighborhood"; // Importar NeighborhoodEntity

export class CustomerMapper {

    static fromObjectToCustomerEntity(object: { [key: string]: any }): CustomerEntity {

        const { _id, id, name, email, phone, address, isActive, userId } = object; // <<<--- Añadir userId
        // Support both populated 'neighborhood' and raw 'neighborhoodId' from DTO
        const neighborhoodRaw = (object as any).neighborhood ?? (object as any).neighborhoodId;

        // Validaciones
        if (!_id && !id) throw CustomError.badRequest('mapper missing id');
        if (!name) throw CustomError.badRequest("mapper missing name");
        if (!email) throw CustomError.badRequest("mapper missing email");
        // Hacer opcionales phone y address en la validación si pueden ser placeholders
        // if(!phone) throw CustomError.badRequest("mapper missing phone");
        // if(!address) throw CustomError.badRequest("mapper missing address");
        if (!neighborhoodRaw) throw CustomError.badRequest("mapper missing neighborhood");
        if (isActive !== undefined && typeof isActive !== 'boolean')
            throw CustomError.badRequest("mapper isActive must be a boolean");

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) throw CustomError.badRequest("mapper invalid email format");

        // Manejo de relación con Neighborhood
        let neighborhoodEntity: NeighborhoodEntity;
        if (typeof neighborhoodRaw === 'object' && neighborhoodRaw !== null && ((neighborhoodRaw as any)._id || (neighborhoodRaw as any).id)) {
            neighborhoodEntity = NeighborhoodMapper.fromObjectToNeighborhoodEntity(neighborhoodRaw);
        } else if (typeof neighborhoodRaw === 'string' || typeof neighborhoodRaw === 'object') {
            // If raw ID or string, create placeholder entity
            neighborhoodEntity = {
                id: neighborhoodRaw.toString(),
                name: 'Barrio (No Poblado)',
                description: '',
                city: { id: '', name: 'Ciudad (No Poblada)', description: '', isActive: true },
                isActive: true
            };
        } else {
            throw CustomError.badRequest("mapper invalid neighborhood data");
        }


        return new CustomerEntity(
            _id?.toString() || id?.toString(), // Asegurar que el ID sea string
            name,
            email,
            phone || '', // Default a string vacío si es null/undefined
            address || '', // Default a string vacío si es null/undefined
            neighborhoodEntity,
            isActive ?? true,
            userId?.toString() || null // <<<--- Mapear userId (convertir a string o null)
        );
    }

    // No necesitamos mapear userId al guardar generalmente, ya que se establece al crear/vincular
    static fromCustomerEntityToObject(entity: CustomerEntity): any {
        return {
            // userId: entity.userId, // No incluirlo aquí usualmente
            name: entity.name.toLowerCase(),
            email: entity.email.toLowerCase(),
            phone: entity.phone,
            address: entity.address.toLowerCase(),
            neighborhood: entity.neighborhood.id,
            isActive: entity.isActive
        };
    }

    static fromObjectListToEntityList(objects: any[]): CustomerEntity[] {
        return objects.map(obj => this.fromObjectToCustomerEntity(obj));
    }
}