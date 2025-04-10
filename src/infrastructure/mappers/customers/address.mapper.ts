// src/infrastructure/mappers/customers/address.mapper.ts
import { AddressEntity } from "../../../domain/entities/customers/address.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { NeighborhoodMapper } from "./neighborhood.mapper";
import { CityMapper } from "./city.mapper";
import { NeighborhoodEntity } from "../../../domain/entities/customers/neighborhood";
import { CityEntity } from "../../../domain/entities/customers/citiy";
import logger from "../../../configs/logger";

export class AddressMapper {

    static fromObjectToAddressEntity(object: { [key: string]: any }): AddressEntity {
        const {
            _id, id, customerId, recipientName, phone, streetAddress,
            postalCode, neighborhood, city, additionalInfo,
            isDefault, alias, createdAt, updatedAt
        } = object;

        if (!_id && !id) throw CustomError.badRequest('AddressMapper: missing id');
        if (!customerId) throw CustomError.badRequest('AddressMapper: missing customerId');
        if (!recipientName) throw CustomError.badRequest('AddressMapper: missing recipientName');
        if (!phone) throw CustomError.badRequest('AddressMapper: missing phone');
        if (!streetAddress) throw CustomError.badRequest('AddressMapper: missing streetAddress');
        if (!neighborhood) throw CustomError.badRequest('AddressMapper: missing neighborhood reference');
        if (!city) throw CustomError.badRequest('AddressMapper: missing city reference');

        let neighborhoodEntity: NeighborhoodEntity;
        if (typeof neighborhood === 'object' && neighborhood !== null && (neighborhood._id || neighborhood.id)) {
            try {
                if (!neighborhood.city || typeof neighborhood.city !== 'object') {
                    logger.warn(`AddressMapper: City data missing in populated neighborhood for address ${_id || id}. Creating placeholder city.`);
                    neighborhood.city = { _id: neighborhood.city?.toString() || 'unknown-city', name: 'Ciudad (No Poblada)', description: '', isActive: true };
                }
                neighborhoodEntity = NeighborhoodMapper.fromObjectToNeighborhoodEntity(neighborhood);
            } catch (err) {
                logger.error(`AddressMapper: Error mapping populated neighborhood for address ${_id || id}`, { error: err });
                throw CustomError.internalServerError(`AddressMapper: Error mapping neighborhood: ${err instanceof Error ? err.message : err}`);
            }
        } else {
            logger.error(`AddressMapper: Neighborhood data is not populated for address ${_id || id}. Cannot create full NeighborhoodEntity.`);
            throw CustomError.internalServerError('AddressMapper: neighborhood data must be populated');
        }

        let cityEntity: CityEntity;
        if (typeof city === 'object' && city !== null && (city._id || city.id)) {
            try {
                cityEntity = CityMapper.fromObjectToCityEntity(city);
            } catch (err) {
                logger.error(`AddressMapper: Error mapping populated city for address ${_id || id}`, { error: err });
                throw CustomError.internalServerError(`AddressMapper: Error mapping city: ${err instanceof Error ? err.message : err}`);
            }
        } else if (neighborhoodEntity && neighborhoodEntity.city) {
            cityEntity = neighborhoodEntity.city;
            logger.debug(`AddressMapper: Using city data from populated neighborhood for address ${_id || id}`);
        }
        else {
            logger.error(`AddressMapper: City data is not populated directly or via neighborhood for address ${_id || id}. Cannot create full CityEntity.`);
            throw CustomError.internalServerError('AddressMapper: city data must be populated');
        }

        // <<<--- CORRECCIÓN: Orden correcto de argumentos --- >>>
        return new AddressEntity(
            _id?.toString() || id?.toString(),
            customerId.toString(),
            recipientName,
            phone,
            streetAddress,
            postalCode, // postalCode va aquí
            neighborhoodEntity,
            cityEntity.id.toString(),
            additionalInfo,
            isDefault ?? false,
            alias,
            createdAt ? new Date(createdAt) : undefined,
            updatedAt ? new Date(updatedAt).toISOString() : undefined
        );
    }

    static fromObjectListToEntityList(objects: any[]): AddressEntity[] {
        return objects.map(obj => this.fromObjectToAddressEntity(obj));
    }
}