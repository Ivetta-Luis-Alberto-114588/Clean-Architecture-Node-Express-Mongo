// src/presentation/products/controller.product.ts
import { Response, Request } from "express";
import mongoose from "mongoose"; // <<<--- AÑADIR IMPORTACIÓN FALTANTE
import { ProductRepository } from "../../domain/repositories/products/product.repository";
import { CustomError } from "../../domain/errors/custom.error";
import { CreateProductDto } from "../../domain/dtos/products/create-product.dto";
import { CreateProductUseCase } from "../../domain/use-cases/product/create-product.use-case";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { GetAllProductsUseCase } from "../../domain/use-cases/product/get-all-products.use-case"; // Asegúrate que esta exista o usa el repo directo
import { DeleteProductUseCase } from "../../domain/use-cases/product/delete-product.use-case";
import { GetProductByCategoryUseCase } from "../../domain/use-cases/product/get-product-by-category.use-case";
import { CategoryRepository } from "../../domain/repositories/products/categroy.repository";
import { UpdateProductUseCase } from "../../domain/use-cases/product/update-product.use-case";
import { UpdateProductDto } from "../../domain/dtos/products/update-product.dto";
import { CloudinaryAdapter } from "../../infrastructure/adapters/cloudinary.adapter";
import fs from 'fs';
import { SearchProductsDto } from "../../domain/dtos/products/search-product.dto";
import { SearchProductsUseCase } from "../../domain/use-cases/product/search-products.use-case";
import logger from "../../configs/logger";
import { ProductEntity } from "../../domain/entities/products/product.entity"; // <<<--- IMPORTAR ProductEntity

export class ProductController {

    private readonly cloudinaryAdapter = CloudinaryAdapter.getInstance();

    constructor(
        private readonly productRepository: ProductRepository,
        private readonly categoryRepository: CategoryRepository
    ) { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error("Error en ProductController:", { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
        return res.status(500).json({ error: "Error interno del servidor" });
    }

    // <<<--- MÉTODO searchProducts (Sin cambios respecto a la versión anterior) --- >>>
    searchProducts = (req: Request, res: Response) => {
        const searchParams = req.query;
        const [error, searchDto] = SearchProductsDto.create(searchParams);

        if (error) {
            logger.warn("Error de validación en searchProducts DTO:", { error, query: req.query });
            return res.status(400).json({ error });
        }

        new SearchProductsUseCase(this.productRepository)
            .execute(searchDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    }

    // --- Métodos Create, GetById, GetAll, Delete ---
    // ... (Asegúrate que estos métodos estén aquí como en tu versión anterior,
    //      incluyendo las correcciones de validación de ID con mongoose.Types.ObjectId.isValid
    //      y el uso del logger) ...
    createProduct = async (req: Request, res: Response) => {
        // Declarar fuera del try para el cleanup en catch
        let uploadedImageUrl: string | null = null;

        try {
            let imgUrl = ''; // Renombrar para evitar confusión con la variable externa

            // Si hay un archivo subido, guardarlo en Cloudinary
            if ((req as any).file) {
                uploadedImageUrl = await this.cloudinaryAdapter.uploadImage((req as any).file.path); // Guardar URL subida
                imgUrl = uploadedImageUrl; // Asignar a la URL final

                // Eliminar archivo temporal después de subirlo
                fs.unlink((req as any).file.path, (err) => {
                    if (err) console.error('Error eliminando archivo temporal:', err);
                });
            }

            // Crear DTO con los datos del formulario y la URL de la imagen
            const productData = {
                ...req.body,
                imgUrl: imgUrl || req.body.imgUrl || '' // Usar imagen subida, o la del body, o vacío
            };

            // Validar IDs de categoría y unidad
            if (!productData.category || !mongoose.Types.ObjectId.isValid(productData.category)) {
                throw CustomError.badRequest('ID de categoría inválido o faltante');
            }
            if (!productData.unit || !mongoose.Types.ObjectId.isValid(productData.unit)) {
                throw CustomError.badRequest('ID de unidad inválido o faltante');
            }

            const [error, createProductDto] = CreateProductDto.create(productData);

            if (error) {
                logger.warn("Error creando CreateProductDto:", { error, data: productData });
                // Si falló el DTO DESPUÉS de subir, eliminar la imagen
                if (uploadedImageUrl) {
                    try {
                        const publicId = this.cloudinaryAdapter.getPublicIdFromUrl(uploadedImageUrl);
                        if (publicId) {
                            await this.cloudinaryAdapter.deleteImage(publicId);
                            logger.warn(`Imagen ${publicId} eliminada debido a fallo en DTO de creación.`);
                        }
                    } catch (cleanupError) {
                        logger.error(`Error limpiando imagen ${uploadedImageUrl} tras fallo en DTO de creación:`, cleanupError);
                    }
                }
                return res.status(400).json({ error });
            }

            const product = await new CreateProductUseCase(this.productRepository)
                .execute(createProductDto!);

            logger.info(`Producto creado: ${product.id} - ${product.name}`);
            return res.status(201).json(product); // Status 201 para creación exitosa

        } catch (err) {
            // Si falló DESPUÉS de subir y no fue error de DTO (que ya limpia), intentar limpiar
            if (uploadedImageUrl && !(err instanceof CustomError && err.statusCode === 400)) {
                try {
                    const publicId = this.cloudinaryAdapter.getPublicIdFromUrl(uploadedImageUrl);
                    if (publicId) {
                        await this.cloudinaryAdapter.deleteImage(publicId);
                        logger.warn(`Imagen ${publicId} eliminada debido a fallo en creación de producto.`);
                    }
                } catch (cleanupError) {
                    logger.error(`Error limpiando imagen ${uploadedImageUrl} tras fallo en creación:`, cleanupError);
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

    getAllProducts = async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const [error, paginationDto] = PaginationDto.create(Number(page), Number(limit));
            if (error) {
                logger.warn("Error en paginación para getAllProducts:", { error, query: req.query });
                return res.status(400).json({ error });
            }
            const products = await this.productRepository.getAll(paginationDto!);
            return res.json(products);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    deleteProduct = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'ID de producto inválido' });
            }

            // Primero obtener el producto para saber la URL de la imagen
            const productToDelete = await this.productRepository.findById(id);
            const imageUrlToDelete = productToDelete.imgUrl; // Guardar URL antes de eliminar

            // Eliminar el producto de la base de datos
            const deletedProduct = await new DeleteProductUseCase(this.productRepository).execute(id);

            // Si se eliminó correctamente de la BD y tenía imagen, eliminarla de Cloudinary
            if (imageUrlToDelete) {
                try {
                    const publicId = this.cloudinaryAdapter.getPublicIdFromUrl(imageUrlToDelete);
                    if (publicId) {
                        await this.cloudinaryAdapter.deleteImage(publicId);
                        logger.info(`Imagen ${publicId} eliminada para producto ${id}`);
                    }
                } catch (deleteImgError) {
                    logger.error(`Error eliminando imagen ${imageUrlToDelete} de Cloudinary para producto ${id}:`, deleteImgError);
                    // No fallar la operación principal por esto, solo loguear
                }
            }

            return res.json(deletedProduct); // Devolver el producto eliminado
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    getProductsByCategory = async (req: Request, res: Response) => {
        try {
            const { categoryId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(400).json({ error: 'ID de categoría inválido' });
            }
            const { page = 1, limit = 10 } = req.query;
            const [error, paginationDto] = PaginationDto.create(Number(page), Number(limit));
            if (error) {
                logger.warn("Error en paginación para getProductsByCategory:", { error, query: req.query });
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


    // <<<--- MÉTODO updateProduct CORREGIDO --- >>>
    updateProduct = async (req: Request, res: Response) => {
        // Declarar variables fuera del try para acceso en catch
        let existingProduct: ProductEntity | null = null;
        let newUploadedImageUrl: string | null = null; // Para la nueva imagen si se sube
        let finalImgUrl: string | undefined = undefined; // URL final que se intentará guardar
        let oldPublicId: string | null = null; // ID de la imagen antigua

        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'ID de producto inválido' });
            }

            // 1. Obtener producto existente
            existingProduct = await this.productRepository.findById(id);
            finalImgUrl = existingProduct.imgUrl; // Inicializar con la URL existente
            if (existingProduct.imgUrl) {
                oldPublicId = this.cloudinaryAdapter.getPublicIdFromUrl(existingProduct.imgUrl);
            }

            // 2. Manejar subida de nueva imagen (si existe)
            if ((req as any).file) {
                // Subir la nueva imagen
                newUploadedImageUrl = await this.cloudinaryAdapter.uploadImage((req as any).file.path);
                finalImgUrl = newUploadedImageUrl; // Actualizar la URL final
                logger.info(`Nueva imagen subida para producto ${id}: ${finalImgUrl}`);

                // Eliminar archivo temporal
                fs.unlink((req as any).file.path, (err) => {
                    if (err) console.error('Error eliminando archivo temporal:', err);
                });

                // Si había una imagen antigua, eliminarla de Cloudinary AHORA (después de subir la nueva con éxito)
                if (oldPublicId) {
                    try {
                        await this.cloudinaryAdapter.deleteImage(oldPublicId);
                        logger.info(`Imagen anterior (${oldPublicId}) eliminada para producto ${id}`);
                    } catch (deleteError) {
                        logger.error(`Error eliminando imagen antigua ${oldPublicId} de Cloudinary:`, deleteError);
                    }
                }
            } else if (req.body.imgUrl === '' && oldPublicId) {
                // 3. Manejar eliminación explícita de imagen
                try {
                    await this.cloudinaryAdapter.deleteImage(oldPublicId);
                    logger.info(`Imagen existente (${oldPublicId}) eliminada explícitamente para producto ${id}`);
                    finalImgUrl = ''; // Asegurar que la URL se guarda vacía
                } catch (deleteError) {
                    logger.error(`Error eliminando imagen ${oldPublicId} explícitamente:`, deleteError);
                }
            } else {
                // 4. Mantener o usar URL del body si no hay archivo ni eliminación explícita
                finalImgUrl = req.body.imgUrl !== undefined ? req.body.imgUrl : existingProduct.imgUrl;
            }

            // 5. Preparar datos y validar DTO
            const productData = {
                ...req.body,
                imgUrl: finalImgUrl // Usar la URL determinada
            };

            if (productData.category && !mongoose.Types.ObjectId.isValid(productData.category)) {
                throw CustomError.badRequest('ID de categoría inválido');
            }
            if (productData.unit && !mongoose.Types.ObjectId.isValid(productData.unit)) {
                throw CustomError.badRequest('ID de unidad inválido');
            }

            const [error, updateProductDto] = UpdateProductDto.create(productData);

            if (error) {
                logger.warn("Error creando UpdateProductDto:", { error, data: productData });
                // ¡Limpieza! Si falló el DTO DESPUÉS de subir una *nueva* imagen, eliminarla
                if (newUploadedImageUrl) {
                    try {
                        const publicIdToDelete = this.cloudinaryAdapter.getPublicIdFromUrl(newUploadedImageUrl);
                        if (publicIdToDelete) {
                            await this.cloudinaryAdapter.deleteImage(publicIdToDelete);
                            logger.warn(`Imagen nueva ${publicIdToDelete} eliminada por fallo en DTO de actualización.`);
                        }
                    } catch (cleanupError) {
                        logger.error(`Error limpiando imagen nueva ${newUploadedImageUrl} tras fallo DTO:`, cleanupError);
                    }
                }
                return res.status(400).json({ error });
            }

            // 6. Ejecutar caso de uso
            const product = await new UpdateProductUseCase(this.productRepository)
                .execute(id, updateProductDto!);

            logger.info(`Producto actualizado: ${product.id} - ${product.name}`);
            return res.json(product);

        } catch (err) {
            // 7. Manejo de errores y limpieza en CATCH
            // Si hubo un error DESPUÉS de subir una nueva imagen y NO fue un error de DTO (400)
            if (newUploadedImageUrl && !(err instanceof CustomError && err.statusCode === 400)) {
                try {
                    const publicIdToDelete = this.cloudinaryAdapter.getPublicIdFromUrl(newUploadedImageUrl);
                    if (publicIdToDelete) {
                        await this.cloudinaryAdapter.deleteImage(publicIdToDelete);
                        logger.warn(`Imagen ${publicIdToDelete} eliminada debido a fallo en actualización de producto.`);
                    }
                } catch (cleanupError) {
                    logger.error(`Error limpiando imagen ${newUploadedImageUrl} tras fallo en actualización:`, cleanupError);
                }
            }
            // Ahora puedes usar handleError con seguridad, ya que existingProduct no se usa aquí
            return this.handleError(err, res);
        }
    }
    // <<<--- FIN MÉTODO updateProduct CORREGIDO --- >>>
}