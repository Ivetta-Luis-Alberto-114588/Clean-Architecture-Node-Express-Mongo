// src/domain/entities/customers/citiy.ts
export class CityEntity {
    constructor(
        public id: number | string, // <<<--- CAMBIADO A string
        public name: string,
        public description: string,
        public isActive: boolean = true
    ) { }
}