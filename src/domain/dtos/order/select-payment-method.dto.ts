// src/domain/dtos/order/select-payment-method.dto.ts
import mongoose from "mongoose";

export class SelectPaymentMethodDto {
    private constructor(
        public readonly orderId: string,
        public readonly paymentMethodCode: string,
        public readonly notes?: string
    ) { }

    static create(object: { [key: string]: any }): [string?, SelectPaymentMethodDto?] {
        const { orderId, paymentMethodCode, notes } = object;

        // Validar orderId
        if (!orderId) return ['orderId es requerido'];
        if (typeof orderId !== 'string') return ['orderId debe ser un string'];
        if (!mongoose.Types.ObjectId.isValid(orderId)) return ['ID de orden inválido'];

        // Validar paymentMethodCode
        if (!paymentMethodCode) return ['paymentMethodCode es requerido'];
        if (typeof paymentMethodCode !== 'string') return ['paymentMethodCode debe ser un string'];
        if (paymentMethodCode.trim() === '') return ['paymentMethodCode no puede estar vacío'];

        const validPaymentMethods = ['CASH', 'MERCADO_PAGO', 'BANK_TRANSFER'];
        if (!validPaymentMethods.includes(paymentMethodCode.toUpperCase())) {
            return [`paymentMethodCode debe ser uno de: ${validPaymentMethods.join(', ')}`];
        }

        // Validar notes (opcional)
        if (notes !== undefined && typeof notes !== 'string') return ['notes debe ser un string'];

        return [undefined, new SelectPaymentMethodDto(
            orderId,
            paymentMethodCode.toUpperCase(),
            notes
        )];
    }
}
