import { NeighborhoodEntity } from "./neighborhood";

export class CustomerEntity {

    constructor(
        public id: number,
        public name: string,
        public email: string,
        public phone: string,
        public address: string,
        public neighborhood: NeighborhoodEntity, // Aquí establecemos la relación con Neighborhood
        public isActive: boolean = true
    ){}
}