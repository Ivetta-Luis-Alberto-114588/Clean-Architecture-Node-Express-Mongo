// src/domain/use-cases/product/update-product.use-case.ts

import { UpdateProductDto } from "../../dtos/products/update-product.dto";
import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { ProductRepository } from "../../repositories/products/product.repository";

interface IUpdateProductUseCase {
    execute(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity>
}

export class UpdateProductUseCase implements IUpdateProductUseCase {
    
    constructor(
        private readonly productRepository: ProductRepository
    ){}

    async execute(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
        try {
            // Verificar que el producto existe
            const existingProduct = await this.productRepository.findById(id);
            if (!existingProduct) {
                throw CustomError.notFound(`Product with ID ${id} not found`);
            }
            
            // Actualizar el producto
            const updatedProduct = await this.productRepository.update(id, updateProductDto);
            return updatedProduct;
            
        } catch (error) {
            // Propagar errores personalizados
            if (error instanceof CustomError) {
                throw error;
            }
            
            // Manejar otros errores
            console.error("Error in update-product-use-case:", error);
            throw CustomError.internalServerError("update-product-use-case, internal server error");
        }
    }
}