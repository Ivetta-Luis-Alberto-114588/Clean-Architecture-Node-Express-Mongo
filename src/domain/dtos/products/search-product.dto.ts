// src/domain/dtos/products/search-product.dto.ts
import { PaginationDto } from "../shared/pagination.dto";

export class SearchProductsDto {

    public readonly pagination: PaginationDto;
    public readonly query?: string; // Keyword search
    public readonly categories?: string[]; // Array of category IDs
    public readonly minPrice?: number;
    public readonly maxPrice?: number;
    public readonly sortBy?: 'price' | 'createdAt' | 'name' | 'relevance'; // Campos por los que ordenar
    public readonly sortOrder?: 'asc' | 'desc'; // Dirección de ordenamiento

    private constructor(props: {
        pagination: PaginationDto;
        query?: string;
        categories?: string[];
        minPrice?: number;
        maxPrice?: number;
        sortBy?: 'price' | 'createdAt' | 'name' | 'relevance';
        sortOrder?: 'asc' | 'desc';
    }) {
        this.pagination = props.pagination;
        this.query = props.query;
        this.categories = props.categories;
        this.minPrice = props.minPrice;
        this.maxPrice = props.maxPrice;
        this.sortBy = props.sortBy;
        this.sortOrder = props.sortOrder;
    }

    static create(props: { [key: string]: any }): [string?, SearchProductsDto?] {
        const {
            page = 1,
            limit = 10,
            q, // Keyword
            categories, // string delimitado por comas: "id1,id2,id3"
            minPrice,
            maxPrice,
            sortBy = 'relevance', // Default a relevancia si hay query, sino a createdAt
            sortOrder = 'desc'
        } = props;

        // 1. Validar paginación
        const [paginationError, paginationDto] = PaginationDto.create(Number(page), Number(limit));
        if (paginationError) return [paginationError];

        // 2. Procesar Keyword
        const query = q ? String(q).trim() : undefined;

        // 3. Procesar Categorías
        let categoryIds: string[] | undefined;
        if (categories) {
            if (typeof categories !== 'string') return ['categories debe ser un string separado por comas'];
            categoryIds = categories.split(',')
                .map(id => id.trim())
                .filter(id => id.length > 0); // Filtrar IDs vacíos
            // Opcional: Validar formato de ObjectId aquí si es necesario
        }

        // 4. Procesar Precios
        let parsedMinPrice: number | undefined = undefined;
        if (minPrice !== undefined) {
            parsedMinPrice = Number(minPrice);
            if (isNaN(parsedMinPrice) || parsedMinPrice < 0) return ['minPrice debe ser un número no negativo'];
        }

        let parsedMaxPrice: number | undefined = undefined;
        if (maxPrice !== undefined) {
            parsedMaxPrice = Number(maxPrice);
            if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) return ['maxPrice debe ser un número no negativo'];
            if (parsedMinPrice !== undefined && parsedMaxPrice < parsedMinPrice) return ['maxPrice debe ser mayor o igual a minPrice'];
        }

        // 5. Validar Ordenamiento
        const validSortBy = ['price', 'createdAt', 'name', 'relevance'];
        let finalSortBy = sortBy;
        // Si no hay query, 'relevance' no tiene sentido, usar 'createdAt'
        if (!query && sortBy === 'relevance') {
            finalSortBy = 'createdAt';
        }
        if (!validSortBy.includes(finalSortBy)) {
            return [`sortBy debe ser uno de: ${validSortBy.join(', ')}`];
        }

        const validSortOrder = ['asc', 'desc'];
        if (!validSortOrder.includes(sortOrder)) {
            return [`sortOrder debe ser 'asc' o 'desc'`];
        }


        return [undefined, new SearchProductsDto({
            pagination: paginationDto!,
            query,
            categories: categoryIds,
            minPrice: parsedMinPrice,
            maxPrice: parsedMaxPrice,
            sortBy: finalSortBy as any,
            sortOrder: sortOrder as any,
        })];
    }
}