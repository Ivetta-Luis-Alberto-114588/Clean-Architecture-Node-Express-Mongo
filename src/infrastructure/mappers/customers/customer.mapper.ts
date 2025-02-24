// src/infrastructure/mappers/customers/customer.mapper.ts
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { CustomError } from "../../../domain/errors/custom.error";
import { NeighborhoodMapper } from "./neighborhood.mapper";

export class CustomerMapper {
    
    static fromObjectToCustomerEntity(object: {[key: string]: any}): CustomerEntity {
        
        const { _id, id, name, email, phone, address, neighborhood, isActive } = object;
        
        // Validaciones mejoradas
        if(!_id && !id) throw CustomError.badRequest('mapper missing id');
        if(!name) throw CustomError.badRequest("mapper missing name");
        if(!email) throw CustomError.badRequest("mapper missing email");
        if(!phone) throw CustomError.badRequest("mapper missing phone");
        if(!address) throw CustomError.badRequest("mapper missing address");
        if(!neighborhood) throw CustomError.badRequest("mapper missing neighborhood");
        if(isActive !== undefined && typeof isActive !== 'boolean') 
            throw CustomError.badRequest("mapper isActive must be a boolean");
            
        // Validación adicional del email con regex
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if(!emailRegex.test(email)) throw CustomError.badRequest("mapper invalid email format");
        
        // Manejo de relación con Neighborhood
        const neighborhoodEntity = typeof neighborhood === 'object' && neighborhood !== null
            ? NeighborhoodMapper.fromObjectToNeighborhoodEntity(neighborhood)
            : { id: neighborhood, name: 'Unknown', description: 'Not populated', 
                city: { id: 0, name: 'Unknown', description: 'Not populated', isActive: true }, 
                isActive: true };
        
        return new CustomerEntity(
            _id || id,
            name,
            email,
            phone,
            address,
            neighborhoodEntity,
            isActive ?? true
        );
    }
    
    static fromCustomerEntityToObject(entity: CustomerEntity): any {
        return {
            name: entity.name.toLowerCase(),
            email: entity.email.toLowerCase(),
            phone: entity.phone,
            address: entity.address.toLowerCase(),
            neighborhood: entity.neighborhood.id, // Solo guardamos el ID
            isActive: entity.isActive
        };
    }
    
    // Método para transformar listas de objetos a entidades
    static fromObjectListToEntityList(objects: any[]): CustomerEntity[] {
        return objects.map(obj => this.fromObjectToCustomerEntity(obj));
    }
}