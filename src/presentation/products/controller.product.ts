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


import { CloudinaryAdapter } from "../../infrastructure/adapters/cloudinary.adapter";
import fs from 'fs';


export class ProductController {


    private readonly cloudinaryAdapter = CloudinaryAdapter.getInstance();

    constructor(
        private readonly productRepository: ProductRepository,
        private readonly categoryRepository: CategoryRepository
    ) { }

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
            let imgUrl = '';

            // Si hay un archivo subido, guardarlo en Cloudinary
            if ((req as any).file) {
                imgUrl = await this.cloudinaryAdapter.uploadImage((req as any).file.path);

                // Eliminar archivo temporal después de subirlo
                fs.unlink((req as any).file.path, (err) => {
                    if (err) console.error('Error eliminando archivo temporal:', err);
                });
            }

            // Crear DTO con los datos del formulario y la URL de la imagen
            const productData = {
                ...req.body,
                imgUrl: imgUrl || req.body.imgUrl || ''
            };

            const [error, createProductDto] = CreateProductDto.create(productData);

            if (error) {
                console.log("error en controller.products.createProduct", error);
                return res.status(400).json({ error });
            }

            const product = await new CreateProductUseCase(this.productRepository)
                .execute(createProductDto!);

            return res.json(product);
        } catch (err) {
            return this.handleError(err, res);
        }
    }


    // Método getProductById para manejar GET /api/products/:id
    getProductById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // Aquí deberías usar un caso de uso apropiado si existe, o directamente el repositorio
            const product = await this.productRepository.findById(id);
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
            const { id } = req.params;

            // Obtener el producto para eliminar su imagen también
            const product = await this.productRepository.findById(id);

            // Eliminar la imagen de Cloudinary si existe
            if (product.imgUrl) {
                const publicId = this.cloudinaryAdapter.getPublicIdFromUrl(product.imgUrl);
                if (publicId) {
                    await this.cloudinaryAdapter.deleteImage(publicId);
                }
            }

            const deletedProduct = await this.productRepository.delete(id);
            return res.json(deletedProduct);
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
    // Actualiza el producto con una nueva imagen si se proporciona
    updateProduct = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Obtener el producto existente para verificar si tiene imagen
            const existingProduct = await this.productRepository.findById(id);

            let imgUrl = existingProduct.imgUrl;

            // Si hay un archivo subido, actualizar la imagen
            if ((req as any).file) {
                // Si ya existe una imagen, eliminarla primero
                if (existingProduct.imgUrl) {
                    try {
                        // Extraer el public_id de la URL de Cloudinary
                        const publicId = this.cloudinaryAdapter.getPublicIdFromUrl(existingProduct.imgUrl);
                        if (publicId) {
                            // Intentar eliminar la imagen antigua y manejar errores
                            await this.cloudinaryAdapter.deleteImage(publicId);
                            console.log(`Imagen anterior eliminada correctamente: ${publicId}`);
                        } else {
                            console.warn(`No se pudo extraer publicId de la URL: ${existingProduct.imgUrl}`);
                        }
                    } catch (deleteError) {
                        // Solo logueamos el error pero continuamos con la actualización
                        console.error('Error al eliminar imagen antigua de Cloudinary:', deleteError);
                    }
                }

                // Subir la nueva imagen
                imgUrl = await this.cloudinaryAdapter.uploadImage((req as any).file.path);
                console.log(`Nueva imagen subida: ${imgUrl}`);

                // Eliminar archivo temporal
                fs.unlink((req as any).file.path, (err) => {
                    if (err) console.error('Error eliminando archivo temporal:', err);
                });
            }

            // Crear DTO con los datos actualizados y la URL de la imagen
            const productData = {
                ...req.body,
                imgUrl: (req as any).file ? imgUrl : (req.body.imgUrl || imgUrl)
            };

            const [error, updateProductDto] = UpdateProductDto.create(productData);

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