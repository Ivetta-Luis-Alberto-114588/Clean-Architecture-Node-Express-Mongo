import { ProductDataSource } from "../../../domain/datasources/products/product.datasource";
import { CreateProductDto } from "../../../domain/dtos/products/create-product.dto";
import { UpdateProductDto } from "../../../domain/dtos/products/update-product.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { ProductRepository } from "../../../domain/repositories/products/product.repository";

export class ProductRepositoryImpl implements ProductRepository {
    
    constructor(private readonly productDatasource: ProductDataSource){}
    findByNameForCreate(name: string, paginationDto: PaginationDto): Promise<ProductEntity | null> {
        return this.productDatasource.findByNameForCreate(name, paginationDto)
    }
    
    create(createProductDto: CreateProductDto): Promise<ProductEntity> {
        return this.productDatasource.create(createProductDto)
    }
    
    getAll(paginationDto: PaginationDto): Promise<ProductEntity[]> {
        return this.productDatasource.getAll(paginationDto)
    }

    findById(id: string): Promise<ProductEntity> {
        return this.productDatasource.findById(id)
    }

    update(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
        return this.productDatasource.update(id, updateProductDto)
    }

    delete(id: string): Promise<ProductEntity> {
        return this.productDatasource.delete(id)
    }

    findByName(nameProduct: string, paginationDto: PaginationDto): Promise<ProductEntity[]> {
        return this.productDatasource.findByName(nameProduct, paginationDto)
    }

    findByCategory(idCategory: string, paginationDto: PaginationDto): Promise<ProductEntity[]> {
        return this.productDatasource.findByCategory(idCategory, paginationDto)
    }

    findByUnit(idUnit: string, paginationDto: PaginationDto): Promise<ProductEntity[]> {
        return this.productDatasource.findByUnit(idUnit, paginationDto)
    }

}