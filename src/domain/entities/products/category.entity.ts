export class CategoryEntity {
    constructor(
        public id: number | string,
        public name: string,
        public description: string,
        public isActive: boolean = true
    ) { };

}