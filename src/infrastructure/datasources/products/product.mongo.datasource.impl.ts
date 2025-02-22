import { ProductModel } from "../../../data/mongodb/models/product.model";
import { ProductDataSource } from "../../../domain/datasources/products/product.datasource";
import { CreateProductDto } from "../../../domain/dtos/products/create-product.dto";
import { UpdateProductDto } from "../../../domain/dtos/products/update-product.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { ProductMapper } from "../../mappers/products/product.mapper";


export class ProductMongoDataSourceImpl extends ProductDataSource {
    
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
                .skip(page * limit)
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
            
            // Buscamos el documento en la base de datos
            const x = await ProductModel.findByIdAndDelete(id, {new: true})

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


    async findByName(nameProduct: string, paginationDto: PaginationDto ): Promise<ProductEntity[]> {
        const {limit, page} = paginationDto

        try {
            // Buscamos el documento en la base de datos
            const x = await ProductModel.find({name: nameProduct})
                        .populate(["Category", "Unit"]) // populate para traer los datos de las relaciones
                        .limit(limit)
                        .skip(page * limit)

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
       
        const {limit, page} = paginationDto

        try {
            // Buscamos el documento en la base de datos
            const x = await ProductModel.find({category: idCategory})
                        .populate(["Category", "Unit"]) // populate para traer los datos de las relaciones
                        .limit(limit)
                        .skip(page * limit)

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


    async findByUnit(idUnit: string, paginationDto : PaginationDto): Promise<ProductEntity[]> {
        
        const {limit, page} = paginationDto

        try {
            // Buscamos el documento en la base de datos
            const x = await ProductModel.find({unit: idUnit})
                        .populate(["Category", "Unit"])  // populate para traer los datos de las relaciones
                        .limit(limit)
                        .skip(page * limit)


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