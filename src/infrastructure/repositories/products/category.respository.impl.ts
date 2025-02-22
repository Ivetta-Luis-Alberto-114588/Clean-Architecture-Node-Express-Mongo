import { CreateCategoryDto } from "../../../domain/dtos/products/create-category";
import { UpdateCategoryDto } from "../../../domain/dtos/products/update-category";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CategoryEntity } from "../../../domain/entities/products/category.entity";
import { CategoryRepository } from "../../../domain/repositories/products/categroy.repository";
import { CategoryDataSource } from "../../../domain/datasources/products/category.datasource";


export class CategoryRepositoryImpl implements CategoryRepository {
    
    constructor(
        private readonly categoryDatasource: CategoryDataSource
    ){}


    create(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
        return this.categoryDatasource.create(createCategoryDto)
    }

    getAll(paginationDto: PaginationDto): Promise<CategoryEntity[]> {
        return this.categoryDatasource.getAll(paginationDto)
    }

    findById(id: string): Promise<CategoryEntity> {
        return this.categoryDatasource.findById(id)
    }

    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryEntity> {
        return this.categoryDatasource.update(id, updateCategoryDto)
    }

    delete(id: string): Promise<CategoryEntity> {
        return this.categoryDatasource.delete(id)
    }
  

}