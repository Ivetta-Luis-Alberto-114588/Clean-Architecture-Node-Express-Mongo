// src/infrastructure/mappers/products/product.mapper.ts
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { CategoryEntity } from "../../../domain/entities/products/category.entity";
import { UnitEntity } from "../../../domain/entities/products/unit.entity";
import { CategoryMapper } from "./category.mapper";
import { UnitMapper } from "./unit.mapper";
import { TagEntity } from "../../../domain/entities/products/tag.entity"
import logger from "../../../configs/logger"; // Importar logger

export class ProductMapper {
    static fromObjectToProductEntity(object: { [key: string]: any }): ProductEntity {

        const { _id, id, name, price, stock = 0, category, unit, imgUrl, isActive, description = "", taxRate = 21, tags = [] } = object;

        const productId = _id || id;
        // Validaciones básicas (mantenerlas)
        if (!productId) throw CustomError.badRequest('ProductMapper: missing id');
        if (!name) throw CustomError.badRequest("ProductMapper: missing name");
        if (price === undefined) throw CustomError.badRequest("ProductMapper: missing price");
        // Quitar validaciones estrictas para category y unit aquí, las manejaremos abajo
        // if (!category) throw CustomError.badRequest("mapper missing category");
        // if (!unit) throw CustomError.badRequest("mapper missing unit");
        if (taxRate === undefined) throw CustomError.badRequest("ProductMapper: missing taxRate");

        const productImgUrl = imgUrl || "";
        const productIsActive = isActive !== undefined ? isActive : true;
        if (typeof productIsActive !== 'boolean') throw CustomError.badRequest("ProductMapper: isActive must be a boolean");
        if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) throw CustomError.badRequest("ProductMapper: invalid taxRate");

        // --- Mapeo ROBUSTO de Category y Unit ---
        let categoryEntity: CategoryEntity;
        // ... (lógica robusta de mapeo/placeholder para category) ...
        try { // Mapeo robusto de category
            if (category && typeof category === 'object' && (category._id || category.id)) {
                categoryEntity = CategoryMapper.fromObjectToCategoryEntity(category);
            } else if (category) {
                logger.warn(`ProductMapper: Category data for product ${productId} seems not populated. Creating placeholder.`);
                categoryEntity = { id: category.toString(), name: 'Categoría (No Poblada)', description: '', isActive: true };
            } else {
                logger.warn(`ProductMapper: Missing category data for product ${productId}. Creating placeholder.`);
                categoryEntity = { id: 0, name: 'Categoría Desconocida', description: '', isActive: true };
            }
        } catch (catError) {
            logger.error(`ProductMapper: Error mapping category for product ${productId}. Creating placeholder.`, { catError, categoryData: category });
            categoryEntity = { id: category?._id?.toString() || category?.id?.toString() || category?.toString() || 'error-category', name: 'Error Categoría', description: '', isActive: true };
        }


        let unitEntity: UnitEntity;
        try { // Mapeo robusto de unit
            if (unit && typeof unit === 'object' && (unit._id || unit.id)) {
                unitEntity = UnitMapper.fromObjectToUnitEntity(unit);
            } else if (unit) {
                logger.warn(`ProductMapper: Unit data for product ${productId} seems not populated. Creating placeholder.`);
                unitEntity = { id: unit.toString(), name: 'Unidad (No Poblada)', description: '', isActive: true };
            } else {
                logger.warn(`ProductMapper: Missing unit data for product ${productId}. Creating placeholder.`);
                unitEntity = { id: 0, name: 'Unidad Desconocida', description: '', isActive: true };
            }
        } catch (unitError) {
            logger.error(`ProductMapper: Error mapping unit for product ${productId}. Creating placeholder.`, { unitError, unitData: unit });
            unitEntity = { id: unit?._id?.toString() || unit?.id?.toString() || unit?.toString() || 'error-unit', name: 'Error Unidad', description: '', isActive: true };
        }
        // --- Fin Mapeo ROBUSTO ---

        // --- CALCULAR priceWithTax (sin cambios) ---
        const basePrice = Number(price) || 0;
        const rate = Number(taxRate);
        const priceWithTax = Math.round(basePrice * (1 + rate / 100) * 100) / 100;
        // --- FIN CÁLCULO ---


        // <<<--- MAPEO DE TAGS --- >>>
        // Asegurarse que tags sea un array de strings
        const productTags: string[] = Array.isArray(tags)
            ? tags.filter(tag => typeof tag === 'string') // Filtrar elementos que no sean string
            : [];
        // <<<--- FIN MAPEO TAGS --- >>>

        return new ProductEntity(
            productId.toString(),
            name,
            basePrice,
            Number(stock),
            categoryEntity, // Usar la entidad mapeada/placeholder
            unitEntity,     // Usar la entidad mapeada/placeholder
            productImgUrl,
            productIsActive,
            description,
            rate,
            priceWithTax,
            productTags
        );
    }
}