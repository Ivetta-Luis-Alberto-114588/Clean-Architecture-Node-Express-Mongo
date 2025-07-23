import { PaginationDto } from "../shared/pagination.dto";

export class SearchCustomersDto {
    private constructor(
        public readonly q?: string,
        public readonly neighborhoodId?: string,
        public readonly page: number = 1,
        public readonly limit: number = 10,
        public readonly sortBy: string = 'createdAt',
        public readonly sortOrder: 'asc' | 'desc' = 'desc'
    ) { }

    static create(object: { [key: string]: any }): [string?, SearchCustomersDto?] {
        const { q, neighborhoodId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = object;

        // Validar paginación
        const [paginationError, paginationDto] = PaginationDto.create(page, limit);
        if (paginationError) return [paginationError];

        // Validar que al menos un criterio de búsqueda esté presente
        if (!q && !neighborhoodId) {
            return ['Al menos un criterio de búsqueda (q o neighborhoodId) debe estar presente'];
        }

        // Validar query string si está presente
        if (q !== undefined) {
            if (typeof q !== 'string') {
                return ['El término de búsqueda (q) debe ser un string'];
            }
            if (q.trim().length < 2) {
                return ['El término de búsqueda debe tener al menos 2 caracteres'];
            }
        }

        // Validar neighborhoodId si está presente
        if (neighborhoodId !== undefined && typeof neighborhoodId !== 'string') {
            return ['El neighborhoodId debe ser un string'];
        }

        // Validar sortBy
        const validSortFields = ['name', 'email', 'phone', 'createdAt', 'updatedAt'];
        if (sortBy && !validSortFields.includes(sortBy)) {
            return [`El campo sortBy debe ser uno de: ${validSortFields.join(', ')}`];
        }

        // Validar sortOrder
        if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
            return ['El sortOrder debe ser "asc" o "desc"'];
        }

        return [undefined, new SearchCustomersDto(
            q?.trim(),
            neighborhoodId,
            paginationDto!.page,
            paginationDto!.limit,
            sortBy,
            sortOrder as 'asc' | 'desc'
        )];
    }
}
