// src/domain/dtos/products/update-product.dto.ts

export class UpdateProductDto {
    private constructor(
        public name?: string,
        public description?: string,
        public price?: number, // Precio SIN IVA
        public stock?: number,
        public category?: string,
        public unit?: string,
        public imgUrl?: string,
        public isActive?: boolean,
        public taxRate?: number,
        public tags?: string[] | null // Permitir null para indicar borrado
    ) { }

    static create(object: { [key: string]: any }): [string?, UpdateProductDto?] {
        const { name, description, price, stock, category, unit, imgUrl, isActive, taxRate, tags } = object;

        // Verificar que al menos un campo se proporcione para la actualización
        // Excluimos imgUrl de esta comprobación si es '' (indica borrar)
        const updateKeys = Object.keys(object).filter(key => key !== 'imgUrl' || object.imgUrl !== '');
        if (updateKeys.length === 0 && object.imgUrl !== '') { // Permitir enviar solo imgUrl=''
            return ["Al menos un campo (o la intención de borrar la imagen) es requerido para actualizar", undefined];
        }


        // --- VALIDACIONES MODIFICADAS PARA NÚMEROS ---
        let priceNum: number | undefined = undefined;
        if (price !== undefined && price !== null && price !== '') {
            priceNum = Number(price);
            if (isNaN(priceNum) || priceNum < 0) {
                return ["El precio debe ser un número mayor o igual a 0", undefined];
            }
        }

        let stockNum: number | undefined = undefined;
        if (stock !== undefined && stock !== null && stock !== '') {
            stockNum = Number(stock);
            // Permitir stock 0, pero validar que sea número entero no negativo
            if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
                return ["El stock debe ser un número entero mayor o igual a 0", undefined];
            }
        }

        let taxRateNum: number | undefined = undefined;
        if (taxRate !== undefined && taxRate !== null && taxRate !== '') {
            taxRateNum = Number(taxRate);
            if (isNaN(taxRateNum) || taxRateNum < 0 || taxRateNum > 100) {
                return ["La tasa de IVA (taxRate) debe ser un número entre 0 y 100", undefined];
            }
        }
        // --- FIN VALIDACIONES NUMÉRICAS ---

        // --- VALIDACIÓN PARA TAGS (Permitir borrar con null o array vacío) ---
        let processedTags: string[] | null | undefined = undefined; // undefined si no se envía
        if ('tags' in object) { // Verificar si la clave 'tags' está presente
            const tagsValue = object.tags;
            if (tagsValue === null || (Array.isArray(tagsValue) && tagsValue.length === 0) || tagsValue === '') {
                processedTags = null; // Usar null para indicar borrado explícito
            } else if (Array.isArray(tagsValue)) {
                if (!tagsValue.every(tag => typeof tag === 'string')) {
                    return ["Todos los elementos en tags deben ser strings", undefined];
                }
                processedTags = tagsValue.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
                // Si después de procesar queda vacío, tratar como borrado
                if (processedTags.length === 0) processedTags = null;
            } else if (typeof tagsValue === 'string') {
                // Si viene como string CSV desde FormData
                processedTags = tagsValue.split(',')
                    .map(tag => tag.trim().toLowerCase())
                    .filter(tag => tag.length > 0);
                if (processedTags.length === 0) processedTags = null;
            } else {
                return ["tags debe ser un array de strings, un string separado por comas, o null/[]/'' para borrar", undefined];
            }
        }
        // --- FIN VALIDACIÓN TAGS ---

        // --- VALIDACIÓN isActive (Convertir string 'true'/'false' a boolean) ---
        let isActiveBool: boolean | undefined = undefined;
        if (isActive !== undefined && isActive !== null) {
            if (typeof isActive === 'string') {
                if (isActive.toLowerCase() === 'true') {
                    isActiveBool = true;
                } else if (isActive.toLowerCase() === 'false') {
                    isActiveBool = false;
                } else {
                    return ["isActive debe ser 'true' o 'false' si es string", undefined];
                }
            } else if (typeof isActive === 'boolean') {
                isActiveBool = isActive;
            } else {
                return ["isActive debe ser booleano o string 'true'/'false'", undefined];
            }
        }
        // --- FIN VALIDACIÓN isActive ---


        // --- VALIDACIÓN imgUrl (Permitir string vacío para indicar borrado) ---
        let finalImgUrl: string | undefined = undefined;
        if ('imgUrl' in object) { // Si se envió explícitamente
            if (typeof object.imgUrl !== 'string') {
                return ["imgUrl debe ser un string", undefined];
            }
            finalImgUrl = object.imgUrl; // Puede ser ''
        }
        // --- FIN VALIDACIÓN imgUrl ---


        // Devolver solo los campos que realmente se enviaron (y son válidos)
        return [undefined, new UpdateProductDto(
            name ? name.toLowerCase() : undefined,
            description, // description puede ser string vacío
            priceNum,
            stockNum,
            category, // Asume que category y unit son IDs válidos (string)
            unit,
            finalImgUrl, // Puede ser '' o undefined
            isActiveBool,
            taxRateNum,
            processedTags // Puede ser array, null o undefined
        )];
    }
}