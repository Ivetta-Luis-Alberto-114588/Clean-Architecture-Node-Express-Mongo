// src/domain/dtos/products/update-tag.dto.ts
export class UpdateTagDto {
    private constructor(
        public name?: string,
        public description?: string | null, // Permitir null para borrar
        public isActive?: boolean,
    ) { }

    static update(props: { [key: string]: any }): [string?, UpdateTagDto?] {
        const { name, description, isActive } = props;

        if (Object.keys(props).length === 0) {
            return ['At least one property must be provided for update', undefined];
        }

        const updateData: Partial<UpdateTagDto> = {};

        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) return ['Tag name must be a non-empty string', undefined];
            updateData.name = name.trim().toLowerCase();
        }

        if ('description' in props) { // Check if key exists, even if null
            if (description !== null && typeof description !== 'string') return ['Description must be a string or null', undefined];
            updateData.description = description === null ? null : description?.trim();
        }

        if (isActive !== undefined) {
            if (typeof isActive !== 'boolean') return ['isActive must be a boolean', undefined];
            updateData.isActive = isActive;
        }

        return [undefined, new UpdateTagDto(
            updateData.name,
            updateData.description,
            updateData.isActive
        )];
    }
}