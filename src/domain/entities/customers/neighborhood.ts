// src/domain/entities/customers/neighborhood.ts
import { CityEntity } from "./citiy";

export class NeighborhoodEntity {

    constructor(
        public id: string, // <<<--- CAMBIADO A string
        public name: string,
        public description: string,
        public city: CityEntity, // Aquí establecemos la relación con City
        public isActive: boolean

    ) { }
}