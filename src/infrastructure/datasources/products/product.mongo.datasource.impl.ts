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

    // ... otros métodos (create, getAll, findById, update, delete, findByNameForCreate, findByName, findByUnit, search) ...

    // <<<--- MÉTODO findByCategory ACTUALIZADO --- >>>
    async findByCategory(idCategory: string, paginationDto: PaginationDto): Promise<{ total: number; products: ProductEntity[] }> {
        const { limit, page } = paginationDto;

        try {
            if (!mongoose.Types.ObjectId.isValid(idCategory)) {
                throw CustomError.badRequest('ID de categoría inválido');
            }

            const categoryObjectId = new mongoose.Types.ObjectId(idCategory);

            // Usar aggregate con $facet para obtener resultados y conteo
            const aggregationResult = await ProductModel.aggregate([
                {
                    $match: {
                        category: categoryObjectId, // Filtrar por categoría
                        isActive: true           // Solo productos activos
                    }
                },
                {
                    $sort: { createdAt: -1 } // Ordenar antes de paginar (opcional)
                },
                {
                    $facet: {
                        paginatedResults: [
                            { $skip: (page - 1) * limit },
                            { $limit: limit }
                        ],
                        totalCount: [
                            { $count: 'count' }
                        ]
                    }
                }
            ]).exec();

            const results = aggregationResult[0];
            const productsData = results.paginatedResults;
            const totalProducts = results.totalCount.length > 0 ? results.totalCount[0].count : 0;

            // Si no hay productos en esta página, devolver vacío
            if (productsData.length === 0) {
                return { total: totalProducts, products: [] };
            }

            // Obtener IDs para poblar
            const productIds = productsData.map((p: any) => p._id);

            // Poblar los documentos obtenidos
            const populatedProducts = await ProductModel.find({ _id: { $in: productIds } })
                .populate('category')
                .populate('unit')
                .exec(); // No usar lean() aquí si ProductMapper espera Mongoose docs

            // Mapear al orden original (importante si se usó $sort)
            const productMap = new Map(populatedProducts.map(p => [p._id.toString(), p]));
            const finalProductsData = productsData.map((p: any) => productMap.get(p._id.toString()));

            // Mapear a entidades
            const productEntities = finalProductsData
                .filter(p => p) // Filtrar nulos por si acaso
                .map(doc => ProductMapper.fromObjectToProductEntity(doc!));

            return {
                total: totalProducts,
                products: productEntities
            };

        } catch (error) {
            logger.error(`Error en findByCategory ProductMongoDataSourceImpl (Cat: ${idCategory}):`, { error });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("Error al buscar productos por categoría");
        }
    }
    // <<<--- FIN MÉTODO findByCategory ACTUALIZADO --- >>>

    // ... (Asegúrate que los otros métodos sigan aquí) ...
    // findByNameForCreate, create, getAll, findById, update, delete, findByName, findByUnit, search
    async findByNameForCreate(name: string, paginationDto: PaginationDto): Promise<ProductEntity | null> {
        const { limit, page } = paginationDto

        try {

            // Buscamos el documento en la base de datos
            const product = await ProductModel.findOne({ name: name })
                .populate(["category", "unit"])
                .limit(limit)
                .skip((page - 1) * limit)

            // Si no existe, retornamos null para poder crearlo
            if (!product) return null


            // Retornamos el objeto mapeado
            return ProductMapper.fromObjectToProductEntity(product)

        } catch (error) {

            //muestro el error completo
            console.log(error)

            if (error instanceof CustomError) { throw error }

            throw CustomError.internalServerError("ProductMonogoDataSourceImpl findByNameForCreate, internal server error")
        }
    }

    async create(createProductDto: CreateProductDto): Promise<ProductEntity> {

        try {

            // Verificar que la categoría existe
            const categoryExists = await CategoryModel.findById(createProductDto.category);
            if (!categoryExists) {
                throw CustomError.badRequest(`La categoría con ID ${createProductDto.category} no existe`); // Usar CustomError
            }

            // Verificar que la unidad existe
            const unitExists = await UnitModel.findById(createProductDto.unit);
            if (!unitExists) {
                throw CustomError.badRequest(`La unidad con ID ${createProductDto.unit} no existe`); // Usar CustomError
            }

            //creamos el documento en la base de datos
            const productDoc = await ProductModel.create(createProductDto);

            // Populamos DESPUÉS de crear
            const populatedProduct = await ProductModel.findById(productDoc._id)
                .populate('category')
                .populate('unit');

            if (!populatedProduct) { // Verificación extra
                throw CustomError.internalServerError("Error al recuperar el producto recién creado");
            }

            // Retornamos el objeto mapeado y populado
            return ProductMapper.fromObjectToProductEntity(populatedProduct);


        } catch (error: any) { // Tipar error como any para acceder a 'code'

            logger.error("Error al crear producto:", { error: error.message, stack: error.stack });

            // Manejar error de duplicado específico de Mongoose
            if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
                throw CustomError.badRequest(`El nombre de producto '${createProductDto.name}' ya existe.`);
            }

            // Si ya es un CustomError, lo propagamos
            if (error instanceof CustomError) { throw error }

            throw CustomError.internalServerError(`ProductMonogoDataSourceImpl create, internal server error. ${error.message || JSON.stringify(error)}`); // Incluir mensaje original
        }
    }


    async getAll(paginationDto: PaginationDto): Promise<ProductEntity[]> {

        // Extraemos los valores de la paginacion
        const { limit, page } = paginationDto

        try {
            // Buscamos todos los documentos en la base de datos Y POPULAMOS
            const products = await ProductModel.find()
                .populate('category')
                .populate('unit')
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ createdAt: -1 }) // Ordenar por defecto
                .exec();

            // Retornamos el objeto mapeado, pero lo tengo que aplicar de a uno en uno
            return products.map(ProductMapper.fromObjectToProductEntity);

        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if (error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl getAll, internal server error")
        }
    }


    async findById(id: string): Promise<ProductEntity> {
        try {

            // Buscamos el documento en la base de datos Y POPULAMOS
            const product = await ProductModel.findById(id)
                .populate('category')
                .populate('unit');

            // Si no existe, lanzamos un error
            if (!product) throw CustomError.notFound("Product not found");

            // Retornamos el objeto mapeado
            return ProductMapper.fromObjectToProductEntity(product);

        } catch (error) {
            // Verificar si el error es por un ID inválido de Mongoose
            if (error instanceof mongoose.Error.CastError && error.path === '_id') {
                throw CustomError.badRequest(`ID de producto inválido: ${id}`);
            }
            // Si ya es un CustomError, lo propagamos
            if (error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl findById, internal server error");

        }
    }


    async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
        try {
            // Verificar si se intenta actualizar categoría o unidad y si existen
            if (updateProductDto.category) {
                const categoryExists = await CategoryModel.findById(updateProductDto.category);
                if (!categoryExists) throw CustomError.badRequest(`La categoría con ID ${updateProductDto.category} no existe`);
            }
            if (updateProductDto.unit) {
                const unitExists = await UnitModel.findById(updateProductDto.unit);
                if (!unitExists) throw CustomError.badRequest(`La unidad con ID ${updateProductDto.unit} no existe`);
            }


            // Buscamos el documento en la base de datos y actualizamos
            const updatedProduct = await ProductModel.findByIdAndUpdate(id, updateProductDto, { new: true })
                .populate('category') // Populamos después de actualizar
                .populate('unit');


            if (!updatedProduct) throw CustomError.notFound("Product not found");

            // Retornamos el objeto mapeado
            return ProductMapper.fromObjectToProductEntity(updatedProduct);

        } catch (error: any) {
            // Manejar error de duplicado específico de Mongoose
            if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
                throw CustomError.badRequest(`El nombre de producto '${updateProductDto.name}' ya existe.`);
            }
            // Verificar si el error es por un ID inválido de Mongoose
            if (error instanceof mongoose.Error.CastError && error.path === '_id') {
                throw CustomError.badRequest(`ID de producto inválido: ${id}`);
            }
            // Si ya es un CustomError, lo propagamos
            if (error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl update, internal server error");

        }
    }


    async delete(id: string): Promise<ProductEntity> {
        try {
            console.log(`Intentando eliminar producto con ID: ${id}`);

            // Buscamos el documento y lo eliminamos, POPULANDO antes de eliminar (opcional, si necesitas los datos relacionados)
            // O puedes buscarlo primero, guardar la info, y luego eliminar
            const deletedProduct = await ProductModel.findByIdAndDelete(id)
                .populate('category')
                .populate('unit');


            // Verificación adicional por si acaso
            if (!deletedProduct) {
                console.log(`Producto con ID ${id} no encontrado - lanzando error`);
                // Verificar si el ID era inválido
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw CustomError.badRequest(`ID de producto inválido: ${id}`);
                }
                throw CustomError.notFound("Producto no encontrado");
            }

            console.log(`Producto con ID ${id} eliminado correctamente`);

            // Retornamos el objeto mapeado
            return ProductMapper.fromObjectToProductEntity(deletedProduct);

        } catch (error) {
            // Log detallado para depuración
            console.error(`Error al eliminar producto con ID ${id}:`, error);
            // Verificar si el error es por un ID inválido de Mongoose
            if (error instanceof mongoose.Error.CastError && error.path === '_id') {
                throw CustomError.badRequest(`ID de producto inválido: ${id}`);
            }

            // Si ya es un CustomError, lo propagamos
            if (error instanceof CustomError) {
                throw error;
            }

            throw CustomError.internalServerError("ProductMongoDataSourceImpl delete, error interno del servidor");
        }
    }

    async findByName(nameProduct: string, paginationDto: PaginationDto): Promise<ProductEntity[]> {
        const { limit, page } = paginationDto

        try {
            // Buscamos el documento en la base de datos
            const x = await ProductModel.find({ name: nameProduct })
                .populate(["category", "unit"]) // populate para traer los datos de las relaciones
                .limit(limit)
                .skip((page - 1) * limit)

            // Si no existe, lanzamos un error
            // <<<--- CORRECCIÓN: Devolver array vacío si no se encuentra --- >>>
            if (!x || x.length === 0) return [];

            // Retornamos el objeto mapeado
            return x.map(x => ProductMapper.fromObjectToProductEntity(x))


        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if (error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl findByName, internal server error")

        }
    }

    async findByUnit(idUnit: string, paginationDto: PaginationDto): Promise<ProductEntity[]> {

        const { limit, page } = paginationDto

        try {
            // Buscamos el documento en la base de datos
            const x = await ProductModel.find({ unit: idUnit })
                .populate(["category", "unit"])  // populate para traer los datos de las relaciones
                .limit(limit)
                .skip((page - 1) * limit)


            // <<<--- CORRECCIÓN: Devolver array vacío si no se encuentra --- >>>
            if (!x || x.length === 0) return [];

            // Retornamos el objeto mapeado
            return x.map(x => ProductMapper.fromObjectToProductEntity(x))

        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if (error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl findByUnit, internal server error")

        }
    }

    async search(searchDto: SearchProductsDto): Promise<{ total: number; products: ProductEntity[] }> {
        const { pagination, query, categories, minPrice, maxPrice, sortBy, sortOrder, tags } = searchDto;
        const { page, limit } = pagination;

        try {
            // 1. Construir el pipeline de agregación
            const pipeline: mongoose.PipelineStage[] = [];

            // 2. Etapa $match: Filtrado inicial
            const matchStage: mongoose.FilterQuery<any> = {
                isActive: true // Siempre buscar solo productos activos
            };

            // 2.1. Filtrado por texto (si hay query)
            if (query) {
                // $text debe ser la primera condición en $match si se usa
                matchStage.$text = { $search: query };
            }

            // 2.2. Filtrado por categoría
            if (categories && categories.length > 0) {
                matchStage.category = { $in: categories.map(id => new mongoose.Types.ObjectId(id)) };
            }

            // 2.3. Filtrado por precio
            const priceFilter: any = {};
            if (minPrice !== undefined) {
                priceFilter.$gte = minPrice;
            }
            if (maxPrice !== undefined) {
                priceFilter.$lte = maxPrice;
            }
            if (Object.keys(priceFilter).length > 0) {
                matchStage.price = priceFilter;
            }

            // Añadir la etapa $match
            pipeline.push({ $match: matchStage });

            // 3. Etapa $sort: Ordenamiento
            const sortStage: Record<string, any> = {};
            if (query && sortBy === 'relevance') {
                // Añadir campo de score y ordenar por él si hay búsqueda de texto
                pipeline.push({ $addFields: { score: { $meta: 'textScore' } } });
                sortStage.score = { $meta: 'textScore' };
            } else if (sortBy) {
                sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
            }
            // Añadir ordenamiento secundario por defecto (ej: por fecha creación)
            if (sortBy !== 'createdAt') {
                sortStage.createdAt = -1; // Más nuevos primero como secundario
            }
            if (Object.keys(sortStage).length > 0) {
                pipeline.push({ $sort: sortStage });
            }

            // <<<--- AÑADIR FILTRO TAGS --- >>>
            if (tags && tags.length > 0) {
                // $all asegura que el producto tenga TODAS las etiquetas especificadas
                // Si quieres que tenga CUALQUIERA, usa $in
                matchStage.tags = { $all: tags }; // O $in: tags si es cualquiera
                logger.debug(`Filtrando productos por tags: ${tags.join(', ')} usando $all`);
            }
            // <<<--- FIN FILTRO TAGS --- >>>

            // 4. Etapa $facet: Para obtener resultados paginados Y conteo total en una sola query
            pipeline.push({
                $facet: {
                    // Rama para obtener los documentos paginados
                    paginatedResults: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit }
                    ],
                    // Rama para obtener el conteo total de documentos que coinciden con $match
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            });

            // 5. Ejecutar la agregación
            const aggregationResult = await ProductModel.aggregate(pipeline).exec();

            // 6. Procesar resultados
            const results = aggregationResult[0]; // $facet devuelve un array con un objeto
            const productsData = results.paginatedResults;
            const totalProducts = results.totalCount.length > 0 ? results.totalCount[0].count : 0;

            // 7. Popular manualmente las referencias (category, unit) después de la agregación
            // Mongoose populate no funciona directamente con aggregate results si no son Mongoose Documents
            const productIds = productsData.map((p: any) => p._id);
            const populatedProducts = await ProductModel.find({ _id: { $in: productIds } })
                .populate('category')
                .populate('unit')
                .exec();

            // Mapear los documentos populados al orden original de productsData (importante para mantener el sort)
            const productMap = new Map(populatedProducts.map(p => [p._id.toString(), p]));
            const finalProductsData = productsData.map((p: any) => productMap.get(p._id.toString()));


            // 8. Mapear a entidades
            const productEntities = finalProductsData
                .filter(p => p) // Filtrar por si algún ID no se encontró al popular (raro)
                .map(doc => ProductMapper.fromObjectToProductEntity(doc!)); // Usar '!' porque filtramos nulos

            logger.info(`Búsqueda de productos realizada. Query: "${query}", Filtros: ${JSON.stringify({ categories, minPrice, maxPrice, tags })}, Total encontrados: ${totalProducts}`);

            return {
                total: totalProducts,
                products: productEntities
            };

        } catch (error) {
            logger.error("Error en search ProductMongoDataSourceImpl:", { error, searchDto });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("Error al buscar productos");
        }
    }

}