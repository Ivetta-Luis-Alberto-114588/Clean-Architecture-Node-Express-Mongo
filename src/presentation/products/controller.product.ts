// src/presentation/products/controller.product.ts
import { Response, Request } from "express";
import mongoose from "mongoose";
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
import { SearchProductsDto } from "../../domain/dtos/products/search-product.dto";
import { SearchProductsUseCase } from "../../domain/use-cases/product/search-products.use-case";
import { ProductEntity } from "../../domain/entities/products/product.entity";
import { loggerAdapter } from "../../infrastructure/adapters/winston-logger.adapter";

export class ProductController {

    private readonly cloudinaryAdapter = CloudinaryAdapter.getInstance();

    constructor(
        private readonly productRepository: ProductRepository,
        private readonly categoryRepository: CategoryRepository
    ) { } private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        loggerAdapter.error("Error en ProductController:", { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
        return res.status(500).json({ error: "Error interno del servidor" });
    }

    searchProducts = (req: Request, res: Response) => {
        const searchParams = req.query; const [error, searchDto] = SearchProductsDto.create(searchParams);
        if (error) {
            loggerAdapter.warn("Error de validación en searchProducts DTO:", { error, query: req.query });
            return res.status(400).json({ error });
        } new SearchProductsUseCase(this.productRepository, loggerAdapter)
            .execute(searchDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    }

    createProduct = async (req: Request, res: Response) => {
        let uploadedImageUrl: string | null = null;
        try {
            loggerAdapter.debug("createProduct - Request body:", { body: req.body });

            let imgUrl = '';
            if ((req as any).file) {
                uploadedImageUrl = await this.cloudinaryAdapter.uploadImage((req as any).file.path);
                imgUrl = uploadedImageUrl;
                fs.unlink((req as any).file.path, (err) => {
                    if (err) console.error('Error eliminando archivo temporal:', err);
                });
            }

            const productData = { ...req.body, imgUrl: imgUrl || req.body.imgUrl || '' };
            loggerAdapter.debug("createProduct - Product data after processing:", { productData });

            // Validar IDs de category y unit
            if (!productData.category || !mongoose.Types.ObjectId.isValid(productData.category)) {
                loggerAdapter.warn("createProduct - Invalid category ID:", { category: productData.category });
                throw CustomError.badRequest('ID de categoría inválido o faltante');
            }
            if (!productData.unit || !mongoose.Types.ObjectId.isValid(productData.unit)) {
                loggerAdapter.warn("createProduct - Invalid unit ID:", { unit: productData.unit });
                throw CustomError.badRequest('ID de unidad inválido o faltante');
            }

            loggerAdapter.debug("createProduct - About to create DTO with data:", { productData });
            const [error, createProductDto] = CreateProductDto.create(productData);
            if (error) {
                loggerAdapter.warn("Error creando CreateProductDto:", { error, data: productData });
                if (uploadedImageUrl) {
                    try {
                        const publicId = this.cloudinaryAdapter.getPublicIdFromUrl(uploadedImageUrl);
                        if (publicId) {
                            await this.cloudinaryAdapter.deleteImage(publicId);
                            loggerAdapter.warn(`Imagen ${publicId} eliminada debido a fallo en DTO de creación.`);
                        }
                    } catch (cleanupError) {
                        loggerAdapter.error(`Error limpiando imagen ${uploadedImageUrl} tras fallo en DTO de creación:`, cleanupError);
                    }
                }
                return res.status(400).json({ error });
            } const product = await new CreateProductUseCase(this.productRepository).execute(createProductDto!);
            loggerAdapter.info(`Producto creado: ${product.id} - ${product.name}`);
            return res.status(201).json(product);
        } catch (err) {
            if (uploadedImageUrl && !(err instanceof CustomError && err.statusCode === 400)) {
                try {
                    const publicId = this.cloudinaryAdapter.getPublicIdFromUrl(uploadedImageUrl);
                    if (publicId) {
                        await this.cloudinaryAdapter.deleteImage(publicId);
                        loggerAdapter.warn(`Imagen ${publicId} eliminada debido a fallo en creación de producto.`);
                    }
                } catch (cleanupError) {
                    loggerAdapter.error(`Error limpiando imagen ${uploadedImageUrl} tras fallo en creación:`, cleanupError);
                }
            }
            return this.handleError(err, res);
        }
    }

    getProductById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'ID de producto inválido' });
            }
            const product = await this.productRepository.findById(id);
            return res.json(product);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    // --- MÉTODO getAllProducts (Sin cambios lógicos necesarios) ---
    getAllProducts = async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const [error, paginationDto] = PaginationDto.create(Number(page), Number(limit));
            if (error) {
                loggerAdapter.warn("Error en paginación para getAllProducts:", { error, query: req.query });
                return res.status(400).json({ error });
            }
            // El Use Case ahora devuelve { total, products } y se envía directamente
            const data = await new GetAllProductsUseCase(this.productRepository, loggerAdapter).execute(paginationDto!);
            return res.json(data);
        } catch (err) {
            return this.handleError(err, res);
        }
    }
    // --- FIN MÉTODO getAllProducts ---

    deleteProduct = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'ID de producto inválido' });
            }
            const productToDelete = await this.productRepository.findById(id);
            const imageUrlToDelete = productToDelete.imgUrl;
            const deletedProduct = await new DeleteProductUseCase(this.productRepository).execute(id);
            if (imageUrlToDelete) {
                try {
                    const publicId = this.cloudinaryAdapter.getPublicIdFromUrl(imageUrlToDelete);
                    if (publicId) {
                        await this.cloudinaryAdapter.deleteImage(publicId);
                        loggerAdapter.info(`Imagen ${publicId} eliminada para producto ${id}`);
                    }
                } catch (deleteImgError) {
                    loggerAdapter.error(`Error eliminando imagen ${imageUrlToDelete} de Cloudinary para producto ${id}:`, deleteImgError);
                }
            }
            return res.json(deletedProduct);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    getProductsByCategory = async (req: Request, res: Response) => {
        try {
            loggerAdapter.debug("getProductsByCategory called with params:", { params: req.params, query: req.query });
            const { categoryId } = req.params;
            loggerAdapter.debug("Extracted categoryId:", { categoryId });

            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                loggerAdapter.warn("Invalid categoryId:", { categoryId });
                return res.status(400).json({ error: 'ID de categoría inválido' });
            }

            const { page = 1, limit = 10 } = req.query;
            const [error, paginationDto] = PaginationDto.create(Number(page), Number(limit));
            if (error) {
                loggerAdapter.warn("Error en paginación para getProductsByCategory:", { error, query: req.query });
                return res.status(400).json({ error });
            }

            loggerAdapter.debug("About to execute GetProductByCategoryUseCase with:", { categoryId, paginationDto });
            const result = await new GetProductByCategoryUseCase(
                this.productRepository,
                this.categoryRepository
            ).execute(categoryId, paginationDto!);

            loggerAdapter.debug("getProductsByCategory result:", { result });
            return res.json(result);
        } catch (err) {
            loggerAdapter.error("Error in getProductsByCategory:", { error: err });
            return this.handleError(err, res);
        }
    }

    updateProduct = async (req: Request, res: Response) => {
        let existingProduct: ProductEntity | null = null;
        let newUploadedImageUrl: string | null = null;
        let finalImgUrl: string | undefined = undefined;
        let oldPublicId: string | null = null;
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'ID de producto inválido' });
            }
            existingProduct = await this.productRepository.findById(id);
            finalImgUrl = existingProduct.imgUrl;
            if (existingProduct.imgUrl) {
                oldPublicId = this.cloudinaryAdapter.getPublicIdFromUrl(existingProduct.imgUrl);
            }
            if ((req as any).file) {
                newUploadedImageUrl = await this.cloudinaryAdapter.uploadImage((req as any).file.path);
                finalImgUrl = newUploadedImageUrl;
                loggerAdapter.info(`Nueva imagen subida para producto ${id}: ${finalImgUrl}`);
                fs.unlink((req as any).file.path, (err) => {
                    if (err) console.error('Error eliminando archivo temporal:', err);
                });
                if (oldPublicId) {
                    try {
                        await this.cloudinaryAdapter.deleteImage(oldPublicId);
                        loggerAdapter.info(`Imagen anterior (${oldPublicId}) eliminada para producto ${id}`);
                    } catch (deleteError) {
                        loggerAdapter.error(`Error eliminando imagen antigua ${oldPublicId} de Cloudinary:`, deleteError);
                    }
                }
            } else if (req.body.imgUrl === '' && oldPublicId) {
                try {
                    await this.cloudinaryAdapter.deleteImage(oldPublicId);
                    loggerAdapter.info(`Imagen existente (${oldPublicId}) eliminada explícitamente para producto ${id}`);
                    finalImgUrl = '';
                } catch (deleteError) {
                    loggerAdapter.error(`Error eliminando imagen ${oldPublicId} explícitamente:`, deleteError);
                }
            } else {
                finalImgUrl = req.body.imgUrl !== undefined ? req.body.imgUrl : existingProduct.imgUrl;
            }
            const productData = { ...req.body, imgUrl: finalImgUrl };
            if (productData.category && !mongoose.Types.ObjectId.isValid(productData.category)) {
                throw CustomError.badRequest('ID de categoría inválido');
            }
            if (productData.unit && !mongoose.Types.ObjectId.isValid(productData.unit)) {
                throw CustomError.badRequest('ID de unidad inválido');
            }
            const [error, updateProductDto] = UpdateProductDto.create(productData);
            if (error) {
                loggerAdapter.warn("Error creando UpdateProductDto:", { error, data: productData });
                if (newUploadedImageUrl) {
                    try {
                        const publicIdToDelete = this.cloudinaryAdapter.getPublicIdFromUrl(newUploadedImageUrl);
                        if (publicIdToDelete) {
                            await this.cloudinaryAdapter.deleteImage(publicIdToDelete);
                            loggerAdapter.warn(`Imagen nueva ${publicIdToDelete} eliminada por fallo en DTO de actualización.`);
                        }
                    } catch (cleanupError) {
                        loggerAdapter.error(`Error limpiando imagen nueva ${newUploadedImageUrl} tras fallo DTO:`, cleanupError);
                    }
                }
                return res.status(400).json({ error });
            }
            const product = await new UpdateProductUseCase(this.productRepository).execute(id, updateProductDto!);
            loggerAdapter.info(`Producto actualizado: ${product.id} - ${product.name}`);
            return res.json(product);
        } catch (err) {
            if (newUploadedImageUrl && !(err instanceof CustomError && err.statusCode === 400)) {
                try {
                    const publicIdToDelete = this.cloudinaryAdapter.getPublicIdFromUrl(newUploadedImageUrl);
                    if (publicIdToDelete) {
                        await this.cloudinaryAdapter.deleteImage(publicIdToDelete);
                        loggerAdapter.warn(`Imagen ${publicIdToDelete} eliminada debido a fallo en actualización de producto.`);
                    }
                } catch (cleanupError) {
                    loggerAdapter.error(`Error limpiando imagen ${newUploadedImageUrl} tras fallo en actualización:`, cleanupError);
                }
            }
            return this.handleError(err, res);
        }
    }
}
