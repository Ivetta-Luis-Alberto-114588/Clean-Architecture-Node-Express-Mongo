// src/presentation/products/controller.product.ts

import { Response, Request } from "express";
import { ProductRepository } from "../../domain/repositories/products/product.repository";
import { CustomError } from "../../domain/errors/custom.error";
import { CreateProductDto } from "../../domain/dtos/products/create-product.dto";
import { CreateProductUseCase } from "../../domain/use-cases/product/create-product.use-case";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { GetAllProductsUseCase } from "../../domain/use-cases/product/get-all-products.use-case";
import { DeleteProductUseCase } from "../../domain/use-cases/product/delete-product.use-case";
import { GetProductByCategoryUseCase } from "../../domain/use-cases/product/get-product-by-category.use-case";
import { CategoryRepository } from "../../domain/repositories/products/categroy.repository";
import { UpdateProductUseCase } from "../../domain/use-cases/product/update-product.use-case";
import { UpdateProductDto } from "../../domain/dtos/products/update-product.dto";

export class ProductController {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly categoryRepository: CategoryRepository
    ) {}

    // Manejo de errores mejorado
    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.log("Error en ProductController:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Método asincrónico para crear producto
    createProduct = async (req: Request, res: Response) => {
        try {
            // Desestructuro el body para validar
            const [error, createProductDto] = CreateProductDto.create(req.body);

            // Si existe un error en el DTO lo capturo y envío como respuesta en el controller
            if (error) {
                console.log("error en controller.products.createProduct", error);
                return res.status(400).json({ error });
            }

            // Creo una instancia del caso de uso y le paso el repositorio
            const product = await new CreateProductUseCase(this.productRepository)
                .execute(createProductDto!);
                
            return res.json(product);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    // Método asincrónico para obtener todos los productos
    getAllProducts = async (req: Request, res: Response) => {
        try {
            // Desestructuro la paginación de la request con valores por defecto
            const { page = 1, limit = 10 } = req.query;

            // Creo una instancia del dto de paginación
            const [error, paginationDto] = PaginationDto.create(
                Number(page), 
                Number(limit)
            );

            // Si existe un error en el DTO lo capturo y envío como respuesta
            if (error) {
                console.log("error en controller.products.getAllProducts", error);
                return res.status(400).json({ error });
            }

            const products = await new GetAllProductsUseCase(this.productRepository)
                .execute(paginationDto!);
                
            return res.json(products);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    // Método asincrónico para eliminar producto
    deleteProduct = async (req: Request, res: Response) => {
        try {
            // Desestructuro el id de la request
            const { id } = req.params;

            const product = await new DeleteProductUseCase(this.productRepository)
                .execute(id);
                
            return res.json(product);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    // Método asincrónico para obtener productos por categoría
    getProductsByCategory = async (req: Request, res: Response) => {
        try {
            // Desestructuro el id de la request
            const { categoryId } = req.params;

            // Desestructuro la paginación con valores por defecto
            const { page = 1, limit = 10 } = req.query;

            // Creo una instancia del dto de paginación
            const [error, paginationDto] = PaginationDto.create(
                Number(page), 
                Number(limit)
            );

            // Si existe un error en el DTO lo capturo y envío como respuesta
            if (error) {
                console.log("error en controller.products.getProductsByCategory", error);
                return res.status(400).json({ error });
            }

            const products = await new GetProductByCategoryUseCase(
                this.productRepository, 
                this.categoryRepository
            ).execute(categoryId, paginationDto!);
                
            return res.json(products);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    // Método asincrónico para actualizar producto
    updateProduct = async (req: Request, res: Response) => {
        try {
            // Desestructuro el id de la request
            const { id } = req.params;

            // Desectructuro el error y el dto del request
            const [error, updateProductDto] = UpdateProductDto.create(req.body);

            // Si existe un error en el DTO lo capturo y envío como respuesta
            if (error) {
                console.log("error en controller.products.updateProduct", error);
                return res.status(400).json({ error });
            }

            const product = await new UpdateProductUseCase(this.productRepository)
                .execute(id, updateProductDto!);
                
            return res.json(product);
        } catch (err) {
            return this.handleError(err, res);
        }
    }
}