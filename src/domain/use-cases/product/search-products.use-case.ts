// src/domain/use-cases/product/search-products.use-case.ts
import { SearchProductsDto } from "../../dtos/products/search-product.dto";
import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { ProductRepository } from "../../repositories/products/product.repository";
import logger from "../../../configs/logger";

interface ISearchProductsUseCase {
    execute(searchDto: SearchProductsDto): Promise<{ total: number; products: ProductEntity[] }>;
}

export class SearchProductsUseCase implements ISearchProductsUseCase {

    constructor(
        private readonly productRepository: ProductRepository
    ) { }

    async execute(searchDto: SearchProductsDto): Promise<{ total: number; products: ProductEntity[] }> {
        try {
            // La lógica principal está en el Datasource, el UseCase solo orquesta.
            const result = await this.productRepository.search(searchDto);
            logger.info(`SearchProductsUseCase ejecutado. Total: ${result.total}, Devolviendo: ${result.products.length}`);
            return result;
        } catch (error) {
            logger.error("Error en SearchProductsUseCase:", { error, searchDto });
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("Error al buscar productos");
        }
    }
}