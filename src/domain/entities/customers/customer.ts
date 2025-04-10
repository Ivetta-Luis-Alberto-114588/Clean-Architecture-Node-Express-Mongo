// src/domain/entities/customers/customer.ts
import { NeighborhoodEntity } from "./neighborhood";

export class CustomerEntity {

    constructor(
        public id: number | string, // Permitir string para IDs de Mongo
        public name: string,
        public email: string,
        public phone: string,
        public address: string,
        public neighborhood: NeighborhoodEntity,
        public isActive: boolean = true,
        public userId?: string | null // <<<--- AÑADIR userId opcional
    ) { }
}