// src/domain/dtos/payment/create-payment-method.dto.ts

export class CreatePaymentMethodDto {
    constructor(
        public readonly code: string,
        public readonly name: string,
        public readonly description: string,
        public readonly isActive: boolean,
        public readonly defaultOrderStatusId: string,
        public readonly requiresOnlinePayment: boolean,
        public readonly allowsManualConfirmation: boolean
    ) { }

    static create(props: { [key: string]: any }): [string?, CreatePaymentMethodDto?] {
        const {
            code,
            name,
            description,
            isActive,
            defaultOrderStatusId,
            requiresOnlinePayment,
            allowsManualConfirmation
        } = props;

        if (!code) return ['Code is required'];
        if (!name) return ['Name is required'];
        if (!description) return ['Description is required'];
        if (isActive === undefined || isActive === null) return ['isActive is required'];
        if (!defaultOrderStatusId) return ['Default order status ID is required'];
        if (requiresOnlinePayment === undefined || requiresOnlinePayment === null) return ['requiresOnlinePayment is required'];
        if (allowsManualConfirmation === undefined || allowsManualConfirmation === null) return ['allowsManualConfirmation is required'];

        return [undefined, new CreatePaymentMethodDto(
            code.toUpperCase().trim(),
            name.trim(),
            description.trim(),
            Boolean(isActive),
            defaultOrderStatusId.trim(),
            Boolean(requiresOnlinePayment),
            Boolean(allowsManualConfirmation)
        )];
    }
}
