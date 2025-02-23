import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { ProductRepository } from "../../repositories/products/product.repository";


interface IGetAllProductsUseCase {
    execute (paginationDto: PaginationDto): Promise<ProductEntity[]>
}

export class GetAllProductsUseCase implements IGetAllProductsUseCase {
    
    constructor(
        private readonly productRepository:ProductRepository,
        
    ){}
    
    async execute(paginationDto: PaginationDto): Promise<ProductEntity[]> {
        
        try {


            //creo una paginacion 
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 5);
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
            throw CustomError.internalServerError("create-product-use-case, internal server error")            
        }
    }

}