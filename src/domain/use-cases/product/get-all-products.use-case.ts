// src/domain/use-cases/product/get-all-products.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { ProductRepository } from "../../repositories/products/product.repository";
import logger from "../../../configs/logger"; // Importar logger

// --- INTERFAZ MODIFICADA ---
interface IGetAllProductsUseCase {
    execute(paginationDto: PaginationDto): Promise<{ total: number; products: ProductEntity[] }>
}
// --- FIN INTERFAZ MODIFICADA ---

export class GetAllProductsUseCase implements IGetAllProductsUseCase {

    constructor(
        private readonly productRepository: ProductRepository,
    ) { }

    // --- MÉTODO EXECUTE MODIFICADO ---
    async execute(paginationDto: PaginationDto): Promise<{ total: number; products: ProductEntity[] }> {
        try {
            // La validación de paginationDto ya se hace en el controller

            // Llamar al método actualizado del repositorio
            const result = await this.productRepository.getAll(paginationDto);

            // Devolver el objeto { total, products }
            return result;

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            logger.error("Error en GetAllProductsUseCase:", { error }); // Usar logger
            throw CustomError.internalServerError("Error al obtener todos los productos");
        }
    }
    // --- FIN MÉTODO EXECUTE MODIFICADO ---
}