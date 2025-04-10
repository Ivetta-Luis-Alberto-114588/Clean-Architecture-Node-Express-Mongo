// src/domain/entities/customers/address.entity.ts
import { CityEntity } from "./citiy";
import { NeighborhoodEntity } from "./neighborhood";

export class AddressEntity {
    constructor(
        public id: string,
        public customerId: string,
        public recipientName: string,
        public phone: string,
        public streetAddress: string,
        public neighborhood: NeighborhoodEntity, // Entidad poblada
        public city: CityEntity,             // Entidad poblada
        public additionalInfo?: string,
        public isDefault: boolean = false,
        public alias?: string,
        public createdAt?: Date,
        public updatedAt?: Date,
        public postalCode?: string,
    ) { }

    // Método de conveniencia para obtener la dirección completa formateada
    get fullAddress(): string {
        let address = `${this.streetAddress}, ${this.neighborhood.name}, ${this.city.name}`;
        if (this.postalCode) {
            address += `, CP ${this.postalCode}`;
        }
        return address;
    }
}