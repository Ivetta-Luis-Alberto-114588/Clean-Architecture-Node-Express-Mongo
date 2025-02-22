import { CategoryModel } from "../../../data/mongodb/models/category.model";
import { CategoryDataSource } from "../../../domain/datasources/products/category.datasource";
import { CreateCategoryDto } from "../../../domain/dtos/products/create-category";
import { UpdateCategoryDto } from "../../../domain/dtos/products/update-category";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CategoryEntity } from "../../../domain/entities/products/category.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { CategoryMapper } from "../../mappers/products/category.mapper";

export class CategoryMongoDataSourceImpl extends CategoryDataSource {
    
    
    async findByName(name: string): Promise<CategoryEntity> {
        try {
            // Buscamos el documento en la base de datos
            const x = await CategoryModel.findOne({name: name})
            
            // Si no existe, lanzamos un error
            if(!x) throw CustomError.notFound("category not found")
            
            // Retornamos el objeto mapeado
            return CategoryMapper.fromObjectToCategoryEntity(x)
            
        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("CategoryMonogoDataSourceImpl, internal server error")
        }
    }
    
    
    
    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
        
        
        try {
            // Creamos el documento en la base de datos
            const x = await CategoryModel.create(createCategoryDto)
    
            // Retornamos el objeto mapeado
            return CategoryMapper.fromObjectToCategoryEntity(x)
            
        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }
    
            console.log(error)
            throw CustomError.internalServerError("CategoryMonogoDataSourceImpl, internal server error")
        }            
    }
    


    async getAll(paginationDto: PaginationDto): Promise<CategoryEntity[]> {
       
       const {limit, page} = paginationDto
       
       try {

            // Buscamos el documento en la base de datos
            const x = await CategoryModel.find()
                .limit(limit)
                .skip(page * limit)
                .exec()
            
            // Retornamos el objeto mapeado, pero lo tengo que aplicar de a uno en uno
            return x.map(CategoryMapper.fromObjectToCategoryEntity)
        
       } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }
    
            console.log(error)
            throw CustomError.internalServerError("CategoryMonogoDataSourceImpl, internal server error")
        }                
       
    }


    async findById(id: string): Promise<CategoryEntity> {
       
        try {

            // Buscamos el documento en la base de datos
            const x = await CategoryModel.findById(id)
            
            // Si no existe, lanzamos un error
            if(!x) throw CustomError.notFound("Unit not found")
            
            // Retornamos el objeto mapeado
            return CategoryMapper.fromObjectToCategoryEntity(x)
        
       } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("CategoryMonogoDataSourceImpl, internal server error")
       }
    }


    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryEntity> {
        

        try {
            
            // Buscamos el documento en la base de datos
            const x = await CategoryModel.findByIdAndUpdate(id, updateCategoryDto, {new: true})

            // Si no existe, lanzamos un error
            if(!x) throw CustomError.notFound("Unit not found")

            // Retornamos el objeto mapeado
            return CategoryMapper.fromObjectToCategoryEntity(x)
            
        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("CategoryMonogoDataSourceImpl, internal server error")            
        }
    }


    async delete(id: string): Promise<CategoryEntity> {
        
        
        try {

            // Buscamos el documento en la base de datos
            const x = await CategoryModel.findByIdAndDelete(id, {new: true})
            
            // Si no existe, lanzamos un error
            if(!x) throw CustomError.notFound("Unit not found")
            
            // Retornamos el objeto mapeado
            return CategoryMapper.fromObjectToCategoryEntity(x)
            
        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("CategoryMonogoDataSourceImpl, internal server error")             
        }
    }

   
}   