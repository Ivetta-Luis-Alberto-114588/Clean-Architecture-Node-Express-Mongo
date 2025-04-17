// src/infrastructure/mappers/products/product.mapper.ts (Backend - CORREGIDO)
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { CategoryEntity } from "../../../domain/entities/products/category.entity"; // Importar si es necesario para placeholders
import { UnitEntity } from "../../../domain/entities/products/unit.entity";       // Importar si es necesario para placeholders
import { CategoryMapper } from "./category.mapper"; // Importar si mapeas aquí
import { UnitMapper } from "./unit.mapper";         // Importar si mapeas aquí

export class ProductMapper {
    static fromObjectToProductEntity(object: { [key: string]: any }): ProductEntity {

        const { _id, id, name, price, stock = 0, category, unit, imgUrl, isActive, description = "", taxRate = 21 } = object;

        const productId = _id || id;
        if (!productId) throw CustomError.badRequest('mapper missing id');
        if (!name) throw CustomError.badRequest("mapper missing name");
        if (price === undefined) throw CustomError.badRequest("mapper missing price");
        if (!category) throw CustomError.badRequest("mapper missing category");
        if (!unit) throw CustomError.badRequest("mapper missing unit");
        if (taxRate === undefined) throw CustomError.badRequest("mapper missing taxRate");

        const productImgUrl = imgUrl || "";
        const productIsActive = isActive !== undefined ? isActive : true;
        if (typeof productIsActive !== 'boolean') throw CustomError.badRequest("mapper isActive must be a boolean");
        if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) throw CustomError.badRequest("mapper invalid taxRate");

        // --- Mapear Category y Unit (si vienen pobladas) o crear placeholders ---
        let categoryEntity: CategoryEntity;
        if (typeof category === 'object' && category !== null && (category._id || category.id)) {
            // Asumiendo que CategoryMapper existe y funciona
            categoryEntity = CategoryMapper.fromObjectToCategoryEntity(category);
        } else {
            // Placeholder si solo viene el ID o es inválido
            categoryEntity = { id: category?.toString() || 'unknown', name: 'Categoría (No Poblada)', description: '', isActive: true };
        }

        let unitEntity: UnitEntity;
        if (typeof unit === 'object' && unit !== null && (unit._id || unit.id)) {
            // Asumiendo que UnitMapper existe y funciona
            unitEntity = UnitMapper.fromObjectToUnitEntity(unit);
        } else {
            // Placeholder si solo viene el ID o es inválido
            unitEntity = { id: unit?.toString() || 'unknown', name: 'Unidad (No Poblada)', description: '', isActive: true };
        }
        // --- Fin Mapeo Category/Unit ---


        // --- CALCULAR priceWithTax ---
        const basePrice = Number(price) || 0;
        const rate = Number(taxRate);
        const priceWithTax = Math.round(basePrice * (1 + rate / 100) * 100) / 100;
        // --- FIN CÁLCULO ---

        return new ProductEntity(
            productId.toString(), // Asegurar que sea string
            name,
            basePrice,
            Number(stock),
            categoryEntity, // Usar la entidad mapeada/placeholder
            unitEntity,     // Usar la entidad mapeada/placeholder
            productImgUrl,
            productIsActive,
            description,
            rate,
            priceWithTax // <-- Pasar el valor calculado
        );
    }
}