import { CreateProductDto } from "../../dtos/products/create-product.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { ProductRepository } from "../../repositories/products/product.repository";


// Definimos la interfaz que describe qué hace este caso de uso
interface ICreateProductUseCase {
    execute(createProductDto: CreateProductDto): Promise<ProductEntity>
}



export class CreateProductUseCase implements ICreateProductUseCase{
    
    constructor(
        private readonly productRepository:ProductRepository,
        
    ){}
    
    async execute(createProductDto: CreateProductDto): Promise<ProductEntity> {
        
        try {

            //creo una paginacion 
            const [error, paginationDto] = PaginationDto.create(1,10)

            //obtengo el producto por el nombre
            const productExist = await this.productRepository.findByName(createProductDto.name,paginationDto! )
            
            //verifico que no exista el producto con el mismo nombre
            if(productExist) throw CustomError.badRequest("create-product-use-case, product already exist")  

            //creo todo con minusculas
            createProductDto.name = createProductDto.name.toLowerCase();
            createProductDto.description = createProductDto.description.toLowerCase();
            
            //creo el producto
            const product = await this.productRepository.create(createProductDto)

            return product;
            
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("create-product-use-case, internal server error");            
        }
    }

}