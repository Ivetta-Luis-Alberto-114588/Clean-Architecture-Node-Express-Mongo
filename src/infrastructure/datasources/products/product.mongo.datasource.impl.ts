import { ProductModel } from "../../../data/mongodb/models/products/product.model";
import { ProductDataSource } from "../../../domain/datasources/products/product.datasource";
import { CreateProductDto } from "../../../domain/dtos/products/create-product.dto";
import { UpdateProductDto } from "../../../domain/dtos/products/update-product.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { ProductMapper } from "../../mappers/products/product.mapper";


export class ProductMongoDataSourceImpl extends ProductDataSource {
   
    async findByNameForCreate(name: string, paginationDto: PaginationDto): Promise<ProductEntity | null> {
        const {limit, page} = paginationDto  
        
        try {
                    // Buscamos el documento en la base de datos
                    const product = await ProductModel.findOne({ name: name })
                                    .populate(["Category", "Unit"]) 
                                    .limit(limit)
                                    .skip((page - 1) * limit)
                    
                    // Si no existe, retornamos null para poder crearlo
                    if (!product) return null
    
                    // Retornamos el objeto mapeado
                    return ProductMapper.fromObjectToProductEntity(product)
    
                } catch (error) {
                    if (error instanceof CustomError) { throw error }
                    throw CustomError.internalServerError("ProductMonogoDataSourceImpl, internal server error")
                }
    }
    
    async create(createProductDto: CreateProductDto): Promise<ProductEntity> {
       
        try {

            //creamos el documento en la base de datos
            const x = await ProductModel.create(createProductDto)

            // Retornamos el objeto mapeado y populado
            return ProductMapper.fromObjectToProductEntity(x)
            
        
       } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }
                
            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl, internal server error")        
       }
    }


    async getAll(paginationDto: PaginationDto): Promise<ProductEntity[]> {
        
        // Extraemos los valores de la paginacion
        const {limit, page} = paginationDto
        
        try {
            // Buscamos todos los documentos en la base de datos
            const x = await ProductModel.find()
                .limit(limit)
                .skip((page - 1) * limit)
                .exec()
            
            // Retornamos el objeto mapeado, pero lo tengo que aplicar de a uno en uno
            return x.map(ProductMapper.fromObjectToProductEntity)

        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }
    
            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl, internal server error")
        }
    }


    async findById(id: string): Promise<ProductEntity> {
        try {
            
            // Buscamos el documento en la base de datos
            const x = await ProductModel.findById(id)

            // Si no existe, lanzamos un error
            if(!x) throw CustomError.notFound("Product not found")
            
            // Retornamos el objeto mapeado
            return ProductMapper.fromObjectToProductEntity(x)   

        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }
    
            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl, internal server error")
            
        }
    }


    async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
        try {
            
            // Buscamos el documento en la base de datos
            const x = await ProductModel.findByIdAndUpdate(id, updateProductDto, {new: true})

            //
            if(!x) throw CustomError.notFound("Product not found")

            // Retornamos el objeto mapeado
            return ProductMapper.fromObjectToProductEntity(x)
            
        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }
    
            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl, internal server error")
            
        }
    }


    async delete(id: string): Promise<ProductEntity> {
        try {
            console.log(`Intentando eliminar producto con ID: ${id}`);
            
            // Primero verificamos si el producto existe
            const existingProduct = await ProductModel.findById(id);
            if (!existingProduct) {
                console.log(`Producto con ID ${id} no encontrado - lanzando error`);
                throw CustomError.notFound("Producto no encontrado");
            }
            
            // Buscamos el documento y lo eliminamos
            const deletedProduct = await ProductModel.findByIdAndDelete(id);
            
            // Verificación adicional por si acaso
            if (!deletedProduct) {
                console.log(`ProductModel.findByIdAndDelete no encontró el producto con ID ${id}`);
                throw CustomError.notFound("Producto no encontrado durante la eliminación");
            }
            
            console.log(`Producto con ID ${id} eliminado correctamente`);
            
            // Retornamos el objeto mapeado
            return ProductMapper.fromObjectToProductEntity(deletedProduct);

        } catch (error) {
            // Log detallado para depuración
            console.error(`Error al eliminar producto con ID ${id}:`, error);
            
            // Si ya es un CustomError, lo propagamos
            if (error instanceof CustomError) { 
                throw error; 
            }
            
            throw CustomError.internalServerError("ProductMongoDataSourceImpl.delete, error interno del servidor");
        }
    }


    async findByName(nameProduct: string, paginationDto: PaginationDto ): Promise<ProductEntity[]> {
        const {limit, page} = paginationDto

        try {
            // Buscamos el documento en la base de datos
            const x = await ProductModel.find({name: nameProduct})
                        .populate(["Category", "Unit"]) // populate para traer los datos de las relaciones
                        .limit(limit)
                        .skip((page - 1) * limit)

            // Si no existe, lanzamos un error 
            if(!x) throw CustomError.notFound("Product not found")

            // Retornamos el objeto mapeado
            return x.map(x => ProductMapper.fromObjectToProductEntity(x))

            
        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl, internal server error")
            
        }
    }


    async findByCategory(idCategory: string, paginationDto: PaginationDto): Promise<ProductEntity[]> {
        const {limit, page} = paginationDto;
    
        try {
            // Buscamos el documento en la base de datos
            const products = await ProductModel.find({category: idCategory})
                        .populate("category")  // Asegurarse de popular ambos
                        .populate("unit")
                        .limit(limit)
                        .skip((page - 1) * limit);
    
            // Si no hay productos, devolver array vacío en lugar de error
            if (!products || products.length === 0) return [];
    
            // Retornamos el objeto mapeado
            return products.map(product => ProductMapper.fromObjectToProductEntity(product));
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("ProductMongoDataSourceImpl, internal server error");
        }
    }


    async findByUnit(idUnit: string, paginationDto : PaginationDto): Promise<ProductEntity[]> {
        
        const {limit, page} = paginationDto

        try {
            // Buscamos el documento en la base de datos
            const x = await ProductModel.find({unit: idUnit})
                        .populate(["Category", "Unit"])  // populate para traer los datos de las relaciones
                        .limit(limit)
                        .skip((page - 1) * limit)


            // Si no existe, lanzamos un error
            if(!x) throw CustomError.notFound("Product not found")

            // Retornamos el objeto mapeado
            return x.map(x => ProductMapper.fromObjectToProductEntity(x))
            
        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("ProductMonogoDataSourceImpl, internal server error")
            
        }
    }

}