// src/domain/dtos/delivery-methods/create-delivery-method.dto.ts

export class CreateDeliveryMethodDto {
    private constructor(
        public readonly code: string,
        public readonly name: string,
        public readonly description?: string,
        public readonly requiresAddress: boolean = true,
        public readonly isActive: boolean = true
    ) { }

    static create(object: { [key: string]: any }): [string?, CreateDeliveryMethodDto?] {
        const { code, name, description, requiresAddress, isActive } = object;

        // Validaciones
        if (!code) return ['Code is required'];
        if (typeof code !== 'string') return ['Code must be a string'];
        if (code.trim().length === 0) return ['Code cannot be empty'];

        if (!name) return ['Name is required'];
        if (typeof name !== 'string') return ['Name must be a string'];
        if (name.trim().length === 0) return ['Name cannot be empty'];

        if (description !== undefined && typeof description !== 'string') {
            return ['Description must be a string'];
        }

        if (requiresAddress !== undefined && typeof requiresAddress !== 'boolean') {
            return ['RequiresAddress must be a boolean'];
        }

        if (isActive !== undefined && typeof isActive !== 'boolean') {
            return ['IsActive must be a boolean'];
        }

        return [undefined, new CreateDeliveryMethodDto(
            code.trim().toUpperCase(),
            name.trim(),
            description?.trim(),
            requiresAddress ?? true,
            isActive ?? true
        )];
    }
}
