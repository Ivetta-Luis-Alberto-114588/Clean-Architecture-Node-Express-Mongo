// src/infrastructure/datasources/products/product.mongo.datasource.impl.ts
import mongoose from "mongoose";
import logger from "../../../configs/logger";
import { CategoryModel } from "../../../data/mongodb/models/products/category.model";
import { ProductModel } from "../../../data/mongodb/models/products/product.model";
import { UnitModel } from "../../../data/mongodb/models/products/unit.model";
import { ProductDataSource } from "../../../domain/datasources/products/product.datasource";
import { CreateProductDto } from "../../../domain/dtos/products/create-product.dto";
import { SearchProductsDto } from "../../../domain/dtos/products/search-product.dto";
import { UpdateProductDto } from "../../../domain/dtos/products/update-product.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { ProductMapper } from "../../mappers/products/product.mapper";

export class ProductMongoDataSourceImpl extends ProductDataSource {

    // --- MÉTODO getAll MODIFICADO (para endpoint público) ---
    async getAll(paginationDto: PaginationDto): Promise<{ total: number; products: ProductEntity[] }> {
        const { limit, page } = paginationDto;
        const skip = (page - 1) * limit;

        try {
            // --- MODIFICACIÓN: Filtrar por isActive: true ---
            const queryFilter = { isActive: true };
            // --- FIN MODIFICACIÓN ---

            // Usar Promise.all para ejecutar el conteo y la búsqueda en paralelo
            const [total, productsData] = await Promise.all([
                ProductModel.countDocuments(queryFilter), // Contar solo productos activos
                ProductModel.find(queryFilter) // Encontrar solo productos activos
                    .populate('category')
                    .populate('unit')
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }) // Ordenar por defecto
                    .exec()
            ]);

            // Mapear los productos encontrados a entidades
            const productEntities = productsData.map(ProductMapper.fromObjectToProductEntity);

            // Devolver la estructura esperada
            return {
                total: total,
                products: productEntities
            };

        } catch (error) {
            logger.error("Error en getAll (público) ProductMongoDataSourceImpl:", { error });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("Error al obtener los productos");
        }
    }
    // --- FIN MÉTODO getAll MODIFICADO ---

    // --- findByCategory MODIFICADO (ya devolvía total, sin cambios necesarios aquí) ---
    async findByCategory(idCategory: string, paginationDto: PaginationDto): Promise<{ total: number; products: ProductEntity[] }> {
        const { limit, page } = paginationDto;
        const skip = (page - 1) * limit;
        try {
            if (!mongoose.Types.ObjectId.isValid(idCategory)) {
                throw CustomError.badRequest('ID de categoría inválido');
            }
            const categoryObjectId = new mongoose.Types.ObjectId(idCategory);
            const queryFilter = { category: categoryObjectId, isActive: true };

            const [total, productsData] = await Promise.all([
                ProductModel.countDocuments(queryFilter),
                ProductModel.find(queryFilter)
                    .populate('category')
                    .populate('unit')
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 })
                    .exec()
            ]);

            const productEntities = productsData.map(doc => ProductMapper.fromObjectToProductEntity(doc));

            return {
                total: total,
                products: productEntities
            };
        } catch (error) {
            logger.error(`Error en findByCategory ProductMongoDataSourceImpl (Cat: ${idCategory}):`, { error });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("Error al buscar productos por categoría");
        }
    }

    // --- search MODIFICADO (ya devolvía la estructura correcta, sin cambios necesarios aquí) ---
    async search(searchDto: SearchProductsDto): Promise<{ total: number; products: ProductEntity[] }> {
        const { pagination, query, categories, minPrice, maxPrice, sortBy, sortOrder, tags } = searchDto;
        const { page, limit } = pagination;
        try {
            const pipeline: mongoose.PipelineStage[] = [];
            const matchStage: mongoose.FilterQuery<any> = { isActive: true }; // Asegurar que la búsqueda pública solo incluya activos
            if (query) { matchStage.$text = { $search: query }; }
            if (categories && categories.length > 0) { matchStage.category = { $in: categories.map(id => new mongoose.Types.ObjectId(id)) }; }
            const priceFilter: any = {};
            if (minPrice !== undefined) { priceFilter.$gte = minPrice; }
            if (maxPrice !== undefined) { priceFilter.$lte = maxPrice; }
            if (Object.keys(priceFilter).length > 0) { matchStage.price = priceFilter; }
            if (tags && tags.length > 0) { matchStage.tags = { $all: tags }; }

            pipeline.push({ $match: matchStage });

            const sortStage: Record<string, any> = {};
            if (query && sortBy === 'relevance') {
                pipeline.push({ $addFields: { score: { $meta: 'textScore' } } });
                sortStage.score = { $meta: 'textScore' };
            } else if (sortBy) {
                sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
            }
            if (sortBy !== 'createdAt') { sortStage.createdAt = -1; }
            if (Object.keys(sortStage).length > 0) { pipeline.push({ $sort: sortStage }); }

            pipeline.push({
                $facet: {
                    paginatedResults: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                    totalCount: [{ $count: 'count' }]
                }
            });

            const aggregationResult = await ProductModel.aggregate(pipeline).exec();
            const results = aggregationResult[0];
            const productsData = results.paginatedResults;
            const totalProducts = results.totalCount.length > 0 ? results.totalCount[0].count : 0;

            const productIds = productsData.map((p: any) => p._id);
            const populatedProducts = await ProductModel.find({ _id: { $in: productIds } })
                .populate('category')
                .populate('unit')
                .exec();
            const productMap = new Map(populatedProducts.map(p => [p._id.toString(), p]));
            const finalProductsData = productsData.map((p: any) => productMap.get(p._id.toString()));
            const productEntities = finalProductsData
                .filter(p => p)
                .map(doc => ProductMapper.fromObjectToProductEntity(doc!));

            logger.info(`Búsqueda de productos realizada. Query: "${query}", Filtros: ${JSON.stringify({ categories, minPrice, maxPrice, tags })}, Total encontrados: ${totalProducts}`);
            return { total: totalProducts, products: productEntities };
        } catch (error) {
            logger.error("Error en search ProductMongoDataSourceImpl:", { error, searchDto });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("Error al buscar productos");
        }
    }

    // --- Resto de métodos (create, findById, update, delete, etc.) sin cambios ---
    async findByNameForCreate(name: string, paginationDto: PaginationDto): Promise<ProductEntity | null> {
        const { limit, page } = paginationDto
        try {
            const product = await ProductModel.findOne({ name: name })
                .populate(["category", "unit"])
                .limit(limit)
                .skip((page - 1) * limit)
            if (!product) return null
            return ProductMapper.fromObjectToProductEntity(product)
        } catch (error) {
            console.log(error)
            if (error instanceof CustomError) { throw error }
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl findByNameForCreate, internal server error")
        }
    }

    async create(createProductDto: CreateProductDto): Promise<ProductEntity> {
        try {
            const categoryExists = await CategoryModel.findById(createProductDto.category);
            if (!categoryExists) {
                throw CustomError.badRequest(`La categoría con ID ${createProductDto.category} no existe`);
            }
            const unitExists = await UnitModel.findById(createProductDto.unit);
            if (!unitExists) {
                throw CustomError.badRequest(`La unidad con ID ${createProductDto.unit} no existe`);
            }
            const productDoc = await ProductModel.create(createProductDto);
            const populatedProduct = await ProductModel.findById(productDoc._id)
                .populate('category')
                .populate('unit');
            if (!populatedProduct) {
                throw CustomError.internalServerError("Error al recuperar el producto recién creado");
            }
            return ProductMapper.fromObjectToProductEntity(populatedProduct);
        } catch (error: any) {
            logger.error("Error al crear producto:", { error: error.message, stack: error.stack });
            if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
                throw CustomError.badRequest(`El nombre de producto '${createProductDto.name}' ya existe.`);
            }
            if (error instanceof CustomError) { throw error }
            throw CustomError.internalServerError(`ProductMonogoDataSourceImpl create, internal server error. ${error.message || JSON.stringify(error)}`);
        }
    }

    async findById(id: string): Promise<ProductEntity> {
        try {
            const product = await ProductModel.findById(id)
                .populate('category')
                .populate('unit');
            if (!product) throw CustomError.notFound("Product not found");
            // --- MODIFICACIÓN: Solo devolver si está activo para endpoint público ---
            // if (!product.isActive) throw CustomError.notFound("Product not found"); // Opcional: decidir si mostrar inactivos por ID directo
            return ProductMapper.fromObjectToProductEntity(product);
        } catch (error) {
            if (error instanceof mongoose.Error.CastError && error.path === '_id') {
                throw CustomError.badRequest(`ID de producto inválido: ${id}`);
            }
            if (error instanceof CustomError) { throw error }
            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl findById, internal server error");
        }
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
        // Este método es llamado por el endpoint de admin, no necesita cambios aquí
        try {
            if (updateProductDto.category) {
                const categoryExists = await CategoryModel.findById(updateProductDto.category);
                if (!categoryExists) throw CustomError.badRequest(`La categoría con ID ${updateProductDto.category} no existe`);
            }
            if (updateProductDto.unit) {
                const unitExists = await UnitModel.findById(updateProductDto.unit);
                if (!unitExists) throw CustomError.badRequest(`La unidad con ID ${updateProductDto.unit} no existe`);
            }
            const updatedProduct = await ProductModel.findByIdAndUpdate(id, updateProductDto, { new: true })
                .populate('category')
                .populate('unit');
            if (!updatedProduct) throw CustomError.notFound("Product not found");
            return ProductMapper.fromObjectToProductEntity(updatedProduct);
        } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
                throw CustomError.badRequest(`El nombre de producto '${updateProductDto.name}' ya existe.`);
            }
            if (error instanceof mongoose.Error.CastError && error.path === '_id') {
                throw CustomError.badRequest(`ID de producto inválido: ${id}`);
            }
            if (error instanceof CustomError) { throw error }
            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl update, internal server error");
        }
    }

    async delete(id: string): Promise<ProductEntity> {
        // Este método es llamado por el endpoint de admin, no necesita cambios aquí
        try {
            console.log(`Intentando eliminar producto con ID: ${id}`);
            const deletedProduct = await ProductModel.findByIdAndDelete(id)
                .populate('category')
                .populate('unit');
            if (!deletedProduct) {
                console.log(`Producto con ID ${id} no encontrado - lanzando error`);
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw CustomError.badRequest(`ID de producto inválido: ${id}`);
                }
                throw CustomError.notFound("Producto no encontrado");
            }
            console.log(`Producto con ID ${id} eliminado correctamente`);
            return ProductMapper.fromObjectToProductEntity(deletedProduct);
        } catch (error) {
            console.error(`Error al eliminar producto con ID ${id}:`, error);
            if (error instanceof mongoose.Error.CastError && error.path === '_id') {
                throw CustomError.badRequest(`ID de producto inválido: ${id}`);
            }
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("ProductMongoDataSourceImpl delete, error interno del servidor");
        }
    }

    async findByName(nameProduct: string, paginationDto: PaginationDto): Promise<ProductEntity[]> {
        // Este método es público, debería filtrar por isActive: true
        const { limit, page } = paginationDto
        try {
            const x = await ProductModel.find({ name: nameProduct, isActive: true }) // <-- Añadir isActive: true
                .populate(["category", "unit"])
                .limit(limit)
                .skip((page - 1) * limit)
            if (!x || x.length === 0) return [];
            return x.map(x => ProductMapper.fromObjectToProductEntity(x))
        } catch (error) {
            if (error instanceof CustomError) { throw error }
            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl findByName, internal server error")
        }
    }

    async findByUnit(idUnit: string, paginationDto: PaginationDto): Promise<ProductEntity[]> {
        // Este método es público, debería filtrar por isActive: true
        const { limit, page } = paginationDto
        try {
            const x = await ProductModel.find({ unit: idUnit, isActive: true }) // <-- Añadir isActive: true
                .populate(["category", "unit"])
                .limit(limit)
                .skip((page - 1) * limit)
            if (!x || x.length === 0) return [];
            return x.map(x => ProductMapper.fromObjectToProductEntity(x))
        } catch (error) {
            if (error instanceof CustomError) { throw error }
            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl findByUnit, internal server error")
        }
    }
}