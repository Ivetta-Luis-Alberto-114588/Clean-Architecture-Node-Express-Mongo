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

            //verifico que exista la categoria
            const category = await this.categoryRepository.findById(categoryId) 
            if(!category) throw CustomError.badRequest("get-product-by-category-use-case, category not found")

            //creo una paginacion 
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 10);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            //obtengo todos los productos
            const products = await this.productRepository.getAll(paginationDto!)
            
            //devuelvo los productos
            return products;
            
        } catch (error) {
           if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("get-product-by-category-use-case, internal server error")            
        }
    }

}
