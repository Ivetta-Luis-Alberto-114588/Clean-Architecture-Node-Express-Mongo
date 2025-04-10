// src/domain/datasources/products/product.datasource.ts
import { CreateProductDto } from "../../dtos/products/create-product.dto";
import { SearchProductsDto } from "../../dtos/products/search-product.dto"; // <<<--- AÑADIR
import { UpdateProductDto } from "../../dtos/products/update-product.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { ProductEntity } from "../../entities/products/product.entity";

export abstract class ProductDataSource {
  abstract create(createProductDto: CreateProductDto): Promise<ProductEntity>;
  abstract getAll(paginationDto: PaginationDto): Promise<ProductEntity[]>;
  abstract findById(id: string): Promise<ProductEntity>;
  abstract update(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity>;
  abstract delete(id: string): Promise<ProductEntity>;
  abstract findByNameForCreate(name: string, paginationDto: PaginationDto): Promise<ProductEntity | null>;

  // Métodos adicionales específicos
  abstract findByName(nameProduct: string, paginationDto: PaginationDto): Promise<ProductEntity[]>;
  abstract findByCategory(idCategory: string, paginationDto: PaginationDto): Promise<ProductEntity[]>;
  abstract findByUnit(idUnit: string, paginationDto: PaginationDto): Promise<ProductEntity[]>;

  // <<<--- NUEVO MÉTODO --- >>>
  // Devolverá también el conteo total para la paginación del frontend
  abstract search(searchDto: SearchProductsDto): Promise<{ total: number; products: ProductEntity[] }>;
}