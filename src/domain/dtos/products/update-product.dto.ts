// src/domain/dtos/products/update-product.dto.ts

export class UpdateProductDto {
    private constructor(
        public name?: string,
        public description?: string,
        public price?: number,// Precio SIN IVA
        public stock?: number,
        public category?: string,
        public unit?: string,
        public imgUrl?: string,
        public isActive?: boolean,
        public taxRate?: number,
    ) { }

    static create(object: { [key: string]: any }): [string?, UpdateProductDto?] {
        const { name, description, price, stock, category, unit, imgUrl, isActive, taxRate } = object;

        // Verificamos que al menos un campo se proporcione para la actualización
        if (Object.keys(object).length === 0) {
            return ["At least one field is required for update", undefined];
        }

        // Validaciones para los campos proporcionados
        if (price !== undefined && price < 0) {
            return ["Price must be greater than or equal to 0", undefined];
        }

        if (stock !== undefined && stock < 0) {
            return ["Stock must be greater than or equal to 0", undefined];
        }

        if (taxRate !== undefined && (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100)) {
            return ["taxRate debe ser un número entre 0 y 100", undefined];
        }

        // Preparamos los valores a actualizar
        const updateData: any = {};

        // Solo incluimos los campos que realmente se proporcionan para actualizar
        if (name !== undefined) updateData.name = name.toLowerCase();
        if (description !== undefined) updateData.description = description.toLowerCase();
        if (price !== undefined) updateData.price = price;
        if (stock !== undefined) updateData.stock = stock;
        if (category !== undefined) updateData.category = category;
        if (unit !== undefined) updateData.unit = unit;
        if (imgUrl !== undefined) updateData.imgUrl = imgUrl;
        if (isActive !== undefined) updateData.isActive = isActive;

        return [undefined, new UpdateProductDto(
            updateData.name,
            updateData.description,
            updateData.price,
            updateData.stock,
            updateData.category,
            updateData.unit,
            updateData.imgUrl,
            updateData.isActive,
            updateData.taxRate
        )];
    }
}