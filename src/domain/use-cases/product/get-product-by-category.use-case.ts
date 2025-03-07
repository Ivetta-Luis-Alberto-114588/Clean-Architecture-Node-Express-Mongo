import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { CategoryRepository } from "../../repositories/products/categroy.repository";
import { ProductRepository } from "../../repositories/products/product.repository";


interface IGetProductByCategoryUseCase {
    execute(categoryId: string, paginationDto: PaginationDto): Promise<ProductEntity[]>
}


export class GetProductByCategoryUseCase implements IGetProductByCategoryUseCase {
    
    constructor(
        private readonly productRepository:ProductRepository,
        private readonly categoryRepository: CategoryRepository
    ){}
    
    async execute(categoryId: string, paginationDto: PaginationDto): Promise<ProductEntity[]> {
        try {
            // Verifico que exista la categoría
            const category = await this.categoryRepository.findById(categoryId);
            if (!category) throw CustomError.badRequest("get-product-by-category-use-case, category not found");
    
            // Modificar esta línea: en lugar de getAll, usar findByCategory
            const products = await this.productRepository.findByCategory(categoryId, paginationDto);
            
            return products;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("get-product-by-category-use-case, internal server error");
        }
    }

}
