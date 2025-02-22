import { CreateCategoryDto } from "../../dtos/products/create-category";
import { UpdateCategoryDto } from "../../dtos/products/update-category";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CategoryEntity } from "../../entities/products/category.entity";

export abstract class CategoryRepository {

    abstract create(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity>
    abstract getAll(paginationDto: PaginationDto): Promise<CategoryEntity[]>
    abstract findById(id: string): Promise<CategoryEntity>
    abstract update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryEntity>
    abstract delete(id: string): Promise<CategoryEntity>
    abstract findByName(name: string, paginationDto: PaginationDto ): Promise<CategoryEntity>


}