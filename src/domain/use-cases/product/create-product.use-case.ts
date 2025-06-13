import { CreateProductDto } from "../../dtos/products/create-product.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { ProductRepository } from "../../repositories/products/product.repository";
import { ILogger } from "../../interfaces/logger.interface";


// Definimos la interfaz que describe qué hace este caso de uso
interface ICreateProductUseCase {
    execute(createProductDto: CreateProductDto): Promise<ProductEntity>
}



export class CreateProductUseCase implements ICreateProductUseCase {

    constructor(
        private readonly productRepository: ProductRepository,
        private readonly logger: ILogger
    ) { }
    async execute(createProductDto: CreateProductDto): Promise<ProductEntity> {

        this.logger.info('Starting product creation', { productName: createProductDto.name });

        try {

            //creo una paginacion 
            const [error, paginationDto] = PaginationDto.create(1, 10)

            //obtengo el producto por el nombre
            const productExist = await this.productRepository.findByNameForCreate(createProductDto.name, paginationDto!)

            //verifico que no exista el producto con el mismo nombre
            if (productExist) {
                this.logger.warn('Product creation failed - product already exists', { productName: createProductDto.name });
                throw CustomError.badRequest("create-product-use-case, product already exist");
            }

            //creo todo con minusculas
            createProductDto.name = createProductDto.name.toLowerCase();
            createProductDto.description = createProductDto.description.toLowerCase();

            //creo el producto
            const product = await this.productRepository.create(createProductDto);

            this.logger.info('Product created successfully', {
                productId: product.id,
                productName: product.name
            });

            return product;

        } catch (error) {
            if (error instanceof CustomError) {
                this.logger.error('Product creation failed with business error', { error: error });
                throw error;
            }
            this.logger.error('Product creation failed with internal error', { error: error as Error });
            throw CustomError.internalServerError("create-product-use-case, internal server error");
        }
    }

}