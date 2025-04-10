// src/domain/repositories/products/product.repository.ts
import { CreateProductDto } from "../../dtos/products/create-product.dto";
import { SearchProductsDto } from "../../dtos/products/search-product.dto"; // <<<--- AÑADIR
import { UpdateProductDto } from "../../dtos/products/update-product.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { ProductEntity } from "../../entities/products/product.entity";

export abstract class ProductRepository {
  abstract create(createProductDto: CreateProductDto): Promise<ProductEntity>;
  abstract getAll(paginationDto: PaginationDto): Promise<ProductEntity[]>;
  abstract findById(id: string): Promise<ProductEntity>;
  abstract update(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity>;
  abstract delete(id: string): Promise<ProductEntity>;
  abstract findByNameForCreate(name: string, paginationDto: PaginationDto): Promise<ProductEntity | null>;

  // Métodos adicionales
  abstract findByName(nameProduct: string, paginationDto: PaginationDto): Promise<ProductEntity[]>;
  abstract findByCategory(idCategory: string, paginationDto: PaginationDto): Promise<ProductEntity[]>;
  abstract findByUnit(idUnit: string, paginationDto: PaginationDto): Promise<ProductEntity[]>;

  // <<<--- NUEVO MÉTODO --- >>>
  abstract search(searchDto: SearchProductsDto): Promise<{ total: number; products: ProductEntity[] }>;
}