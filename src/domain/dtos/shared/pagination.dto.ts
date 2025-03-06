
export class PaginationDto {
    page: number;
    limit: number;

    private constructor(page: number, limit: number){
        this.page = page;
        this.limit = limit;
    }

    //este metodo va a devolver una instancia de la clase actual o un array con un string y undefined
    static create(page: number = 1, limit: number = 10): [string?, PaginationDto?] {
            // object("page": number, "limit": number)       [error, instancia del dto]
        
               
        // Convertir a números
        const pageNum = Number(page);
        const limitNum = Number(limit);

        //aca verifico si el objeto esta vacio
        if (!page || !limit) return ["page and limit are required", undefined];
        
        //verifico que sean numeros mayores a cero
        if (isNaN(pageNum) || pageNum < 1) return ["page must be greater than 0", undefined];
        if (isNaN(limitNum) || limitNum < 1) return ["limit must be greater than 0", undefined];

        //como no hay error devuelvo undefined y la instancia del dto (que es privada)
        return [undefined, new PaginationDto(pageNum, limitNum)];
    }
}