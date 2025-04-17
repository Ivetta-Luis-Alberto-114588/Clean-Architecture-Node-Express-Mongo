// src/domain/use-cases/product/get-product-by-category.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { CategoryRepository } from "../../repositories/products/categroy.repository";
import { ProductRepository } from "../../repositories/products/product.repository";

// <<<--- INTERFAZ ACTUALIZADA --- >>>
interface IGetProductByCategoryUseCase {
    execute(categoryId: string, paginationDto: PaginationDto): Promise<{ total: number; products: ProductEntity[] }>;
}
// <<<--- FIN INTERFAZ ACTUALIZADA --- >>>

export class GetProductByCategoryUseCase implements IGetProductByCategoryUseCase {

    constructor(
        private readonly productRepository: ProductRepository,
        private readonly categoryRepository: CategoryRepository
    ) { }

    // <<<--- MÉTODO EXECUTE ACTUALIZADO --- >>>
    async execute(categoryId: string, paginationDto: PaginationDto): Promise<{ total: number; products: ProductEntity[] }> {
        try {
            // Verifico que exista la categoría
            const category = await this.categoryRepository.findById(categoryId);
            if (!category) throw CustomError.notFound(`Categoría con ID ${categoryId} no encontrada`);

            // Llamar al método actualizado del repositorio
            const result = await this.productRepository.findByCategory(categoryId, paginationDto);

            return result; // Devolver el objeto { total, products }
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("get-product-by-category-use-case, internal server error");
        }
    }
    // <<<--- FIN MÉTODO EXECUTE ACTUALIZADO --- >>>
}