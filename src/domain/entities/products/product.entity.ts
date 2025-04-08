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
        public taxRate: number = 21
    ) { }

    // Propiedad calculada para obtener el precio CON IVA
    get priceWithTax(): number {
        if (this.price === undefined || this.taxRate === undefined) return 0;
        return Math.round(this.price * (1 + this.taxRate / 100) * 100) / 100;
    }
}