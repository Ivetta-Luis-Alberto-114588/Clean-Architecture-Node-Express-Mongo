import { AddressEntity } from '../../../../../src/domain/entities/customers/address.entity';
import { NeighborhoodEntity } from '../../../../../src/domain/entities/customers/neighborhood';
import { CityEntity } from '../../../../../src/domain/entities/customers/citiy';

describe('AddressEntity', () => {
    const city = new CityEntity('city1', 'Ciudad X', 'desc ciudad', true);
    const neighborhood = new NeighborhoodEntity('neigh1', 'Barrio Centro', 'desc barrio', city, true);

    it('should create an AddressEntity with all properties', () => {
        const now = new Date();
        const address = new AddressEntity(
            'id1',
            'customerId1',
            'Juan Perez',
            '+5491112345678',
            'Calle Falsa 123',
            neighborhood,
            city,
            'Piso 2',
            true,
            'Casa',
            now,
            now,
            '1234'
        );
        expect(address.id).toBe('id1');
        expect(address.customerId).toBe('customerId1');
        expect(address.recipientName).toBe('Juan Perez');
        expect(address.phone).toBe('+5491112345678');
        expect(address.streetAddress).toBe('Calle Falsa 123');
        expect(address.neighborhood).toBe(neighborhood);
        expect(address.city).toBe(city);
        expect(address.additionalInfo).toBe('Piso 2');
        expect(address.isDefault).toBe(true);
        expect(address.alias).toBe('Casa');
        expect(address.createdAt).toBe(now);
        expect(address.updatedAt).toBe(now);
        expect(address.postalCode).toBe('1234');
    });

    it('should return the correct fullAddress', () => {
        const address = new AddressEntity(
            'id2',
            'customerId2',
            'Ana Lopez',
            '+5491112345678',
            'Av. Siempre Viva 742',
            neighborhood,
            city,
            undefined,
            false,
            undefined,
            undefined,
            undefined,
            '4321'
        );
        expect(address.fullAddress).toBe('Av. Siempre Viva 742, Barrio Centro, Ciudad X, CP 4321');
    });

    it('should return the correct fullAddress without postalCode', () => {
        const address = new AddressEntity(
            'id3',
            'customerId3',
            'Pedro Gomez',
            '+5491112345678',
            'Calle Sin CP',
            neighborhood,
            city
        );
        expect(address.fullAddress).toBe('Calle Sin CP, Barrio Centro, Ciudad X');
    });
});
