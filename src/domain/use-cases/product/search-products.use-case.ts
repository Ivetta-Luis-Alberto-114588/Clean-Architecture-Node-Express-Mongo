// src/domain/use-cases/product/search-products.use-case.ts
import { SearchProductsDto } from "../../dtos/products/search-product.dto";
import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { ProductRepository } from "../../repositories/products/product.repository";
import { ILogger } from "../../interfaces/logger.interface";

interface ISearchProductsUseCase {
    execute(searchDto: SearchProductsDto): Promise<{ total: number; products: ProductEntity[] }>;
}

export class SearchProductsUseCase implements ISearchProductsUseCase {

    constructor(
        private readonly productRepository: ProductRepository,
        private readonly logger: ILogger
    ) { } async execute(searchDto: SearchProductsDto): Promise<{ total: number; products: ProductEntity[] }> {
        try {
            // La lógica principal está en el Datasource, el UseCase solo orquesta.
            const result = await this.productRepository.search(searchDto);
            this.logger.info(`SearchProductsUseCase ejecutado. Total: ${result.total}, Devolviendo: ${result.products.length}`);
            return result;
        } catch (error) {
            this.logger.error("Error en SearchProductsUseCase:", { error, searchDto });
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("Error al buscar productos");
        }
    }
}