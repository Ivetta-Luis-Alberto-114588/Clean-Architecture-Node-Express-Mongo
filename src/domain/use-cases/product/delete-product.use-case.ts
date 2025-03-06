// Verificar/corregir src/domain/use-cases/product/delete-product.use-case.ts

import { ProductEntity } from "../../entities/products/product.entity";
import { CustomError } from "../../errors/custom.error";
import { ProductRepository } from "../../repositories/products/product.repository";

interface IDeleteProductUseCase {
  execute(productId: string): Promise<ProductEntity>
}

export class DeleteProductUseCase implements IDeleteProductUseCase {
  
    constructor(private readonly productRepository: ProductRepository) {}

  async execute(productId: string): Promise<ProductEntity> {
    
    try {
        //busco el producto
        const product = await this.productRepository.findById(productId);

        //si no existe lanzo un error
        if (!product) {
            throw CustomError.notFound("delete-product-use-case, producto no encontrado");
        }

        //guardo el producto eliminado 
        const deletedProduct = await this.productRepository.delete(productId);

        //devuelvo el producto eliminado
        return deletedProduct;
        
    } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("delete-product-use-case, error interno del servidor");           
    }
  }
}