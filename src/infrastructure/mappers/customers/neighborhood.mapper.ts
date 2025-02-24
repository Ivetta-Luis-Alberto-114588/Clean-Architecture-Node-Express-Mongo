// src/infrastructure/mappers/customers/neighborhood.mapper.ts
import { NeighborhoodEntity } from "../../../domain/entities/customers/neighborhood";
import { CustomError } from "../../../domain/errors/custom.error";
import { CityMapper } from "./city.mapper";

export class NeighborhoodMapper {
    
    static fromObjectToNeighborhoodEntity(object: {[key: string]: any}): NeighborhoodEntity {
        
        const { _id, id, name, description, city, isActive } = object;
        
        // Validaciones básicas
        if(!_id && !id) throw CustomError.badRequest('mapper missing id');
        if(!name) throw CustomError.badRequest("mapper missing name");
        if(!description) throw CustomError.badRequest("mapper missing description");
        if(!city) throw CustomError.badRequest("mapper missing city");
        if(isActive !== undefined && typeof isActive !== 'boolean') 
            throw CustomError.badRequest("mapper isActive must be a boolean");
        
        // Manejo de relación con City
        // Verificamos si city es un objeto (populated) o solo un ID
        const cityEntity = typeof city === 'object' && city !== null
            ? CityMapper.fromObjectToCityEntity(city)
            : { id: city, name: 'Unknown', description: 'Not populated', isActive: true };
        
        return new NeighborhoodEntity(
            _id || id,
            name,
            description,
            cityEntity,
            isActive ?? true
        );
    }
    
    static fromNeighborhoodEntityToObject(entity: NeighborhoodEntity): any {
        return {
            name: entity.name.toLowerCase(),
            description: entity.description.toLowerCase(),
            city: entity.city.id, // Solo guardamos el ID en MongoDB
            isActive: entity.isActive
        };
    }
}