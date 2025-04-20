// src/domain/dtos/products/create-tag.dto.ts
export class CreateTagDto {
    private constructor(
        public name: string,
        public description?: string,
        public isActive?: boolean,
    ) { }

    static create(props: { [key: string]: any }): [string?, CreateTagDto?] {
        const { name, description, isActive = true } = props;

        if (!name) return ['Tag name is required', undefined];
        if (typeof name !== 'string' || name.trim().length === 0) return ['Tag name must be a non-empty string', undefined];

        if (description && typeof description !== 'string') return ['Description must be a string', undefined];
        if (isActive !== undefined && typeof isActive !== 'boolean') return ['isActive must be a boolean', undefined];

        return [undefined, new CreateTagDto(
            name.trim().toLowerCase(), // Guardar en minúsculas
            description?.trim(),
            isActive
        )];
    }
}