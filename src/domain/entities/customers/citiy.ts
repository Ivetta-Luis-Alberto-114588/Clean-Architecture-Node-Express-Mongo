

export class CityEntity {
    constructor(
        public id: number,
        public name: string,
        public description: string,
        public isActive: boolean = true
    ){}
}