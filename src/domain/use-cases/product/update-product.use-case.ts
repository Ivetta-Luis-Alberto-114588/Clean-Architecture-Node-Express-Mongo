import { UpdateProductDto } from "../../dtos/products/update-product.dto";
import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { ProductRepository } from "../../repositories/products/product.repository";


interface IUpdateProductUseCase {
    execute(id: string, updateUnitDto: UpdateProductDto): Promise<ProductEntity>
}

export class UpdateProductUseCase implements IUpdateProductUseCase {
    
    constructor(
        private readonly productRepository: ProductRepository
    ){}

    async execute(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
        try {
            // Verificamos que la unidad exista
            const existingProduct = await this.productRepository.findById(id);
            if (!existingProduct) {
                throw CustomError.notFound('update-unit-use-case, Unidad no encontrada');
            }

            // Si la unidad existe, procedemos a actualizarla
            const updatedUnit = await this.productRepository.update(id, updateProductDto);
            return updatedUnit;

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('update-unit-use-case, error interno del servidor');
        }
    }
}