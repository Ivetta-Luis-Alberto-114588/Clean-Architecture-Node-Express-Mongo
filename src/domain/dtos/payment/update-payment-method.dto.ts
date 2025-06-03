// src/domain/dtos/payment/update-payment-method.dto.ts

export class UpdatePaymentMethodDto {
    constructor(
        public readonly code?: string,
        public readonly name?: string,
        public readonly description?: string,
        public readonly isActive?: boolean,
        public readonly defaultOrderStatusId?: string,
        public readonly requiresOnlinePayment?: boolean
    ) {}

    static create(props: { [key: string]: any }): [string?, UpdatePaymentMethodDto?] {
        const { code, name, description, isActive, defaultOrderStatusId, requiresOnlinePayment } = props;

        return [undefined, new UpdatePaymentMethodDto(
            code ? code.toUpperCase().trim() : undefined,
            name ? name.trim() : undefined,
            description ? description.trim() : undefined,
            isActive !== undefined ? Boolean(isActive) : undefined,
            defaultOrderStatusId ? defaultOrderStatusId.trim() : undefined,
            requiresOnlinePayment !== undefined ? Boolean(requiresOnlinePayment) : undefined
        )];
    }
}
