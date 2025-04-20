import { CategoryEntity } from "./category.entity";
import { UnitEntity } from "./unit.entity";


export class ProductEntity {
    constructor(
        public id: number,
        public name: string,
        public price: number,
        public stock: number = 10,
        public category: CategoryEntity,
        public unit: UnitEntity,
        public imgUrl: string,
        public isActive: boolean = true,
        public description: string = "",
        public taxRate: number = 21,
        public priceWithTax: number,
        public tags: string[] = []
    ) { }

    // Propiedad calculada para obtener el precio CON IVA

}