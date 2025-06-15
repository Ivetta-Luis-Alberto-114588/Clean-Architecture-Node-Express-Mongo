// src/domain/use-cases/order/select-payment-method.use-case.ts

import { CustomError } from "../../errors/custom.error";
import { OrderRepository } from "../../repositories/order/order.repository";
import { PaymentMethodRepository } from "../../repositories/payment/payment-method.repository";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";
import { SelectPaymentMethodDto } from "../../dtos/order/select-payment-method.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { ILogger } from "../../interfaces/logger.interface";

export interface ISelectPaymentMethodUseCase {
    execute(selectPaymentMethodDto: SelectPaymentMethodDto): Promise<OrderEntity>;
}

export class SelectPaymentMethodUseCase implements ISelectPaymentMethodUseCase {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly paymentMethodRepository: PaymentMethodRepository,
        private readonly orderStatusRepository: OrderStatusRepository,
        private readonly loggerService: ILogger
    ) { }

    async execute(selectPaymentMethodDto: SelectPaymentMethodDto): Promise<OrderEntity> {
        const { orderId, paymentMethodCode, notes } = selectPaymentMethodDto;

        try {
            // 1. Verificar que la orden existe
            const existingOrder = await this.orderRepository.findById(orderId);
            if (!existingOrder) {
                throw CustomError.notFound(`Orden con ID ${orderId} no encontrada`);
            }

            // 2. Verificar que la orden está en estado válido para seleccionar método de pago
            const validStatuses = ['PENDING', 'CONFIRMED'];
            if (!validStatuses.includes(existingOrder.status?.code || '')) {
                throw CustomError.badRequest(
                    `No se puede seleccionar método de pago para una orden en estado: ${existingOrder.status?.name}`
                );
            }

            // 3. Obtener el método de pago
            const paymentMethod = await this.paymentMethodRepository.findByCode(paymentMethodCode);
            if (!paymentMethod) {
                throw CustomError.notFound(`Método de pago ${paymentMethodCode} no encontrado`);
            }

            if (!paymentMethod.isActive) {
                throw CustomError.badRequest(`Método de pago ${paymentMethodCode} no está activo`);
            }

            // 4. Determinar el nuevo estado de la orden según el método de pago
            let newStatusCode: string;

            switch (paymentMethodCode) {
                case 'MERCADO_PAGO':
                    newStatusCode = 'AWAITING_PAYMENT'; // Esperando el pago online
                    break;
                case 'CASH':
                case 'BANK_TRANSFER':
                    newStatusCode = 'CONFIRMED'; // Confirmado, pago será manual
                    break;
                default:
                    newStatusCode = 'PENDING';
            }

            // 5. Validaciones específicas por método de pago
            if (paymentMethodCode === 'CASH') {
                // Validar que la orden permita pago en efectivo
                if (!this.isEligibleForCashPayment(existingOrder)) {
                    throw CustomError.badRequest(
                        'Esta orden no es elegible para pago en efectivo'
                    );
                }
            }

            if (paymentMethodCode === 'MERCADO_PAGO') {
                // Validar que el monto sea válido para MP
                if (existingOrder.total < 100) { // Monto mínimo ejemplo
                    throw CustomError.badRequest(
                        'El monto mínimo para Mercado Pago es $100'
                    );
                }
            }

            // 6. Obtener el nuevo estado
            const newStatus = await this.orderStatusRepository.findByCode(newStatusCode);
            if (!newStatus) {
                throw CustomError.internalServerError(`Estado ${newStatusCode} no encontrado`);
            }

            // 7. Actualizar la orden con el método de pago y estado
            const updatedOrder = await this.orderRepository.updatePaymentMethod(orderId, {
                paymentMethodId: paymentMethod.id,
                statusId: newStatus.id,
                notes: notes || `Método de pago seleccionado: ${paymentMethod.name}`
            });

            this.loggerService.info(`Método de pago ${paymentMethodCode} seleccionado para orden ${orderId}`);

            return updatedOrder;

        } catch (error) {
            this.loggerService.error(`Error al seleccionar método de pago: ${error}`);
            throw error;
        }
    } private isEligibleForCashPayment(order: OrderEntity): boolean {
        // Lógica de validación para pago en efectivo
        // Ejemplo: solo órdenes locales, monto máximo, etc.
        const maxCashAmount = 5000;

        // Asumimos que si hay detalles de envío con ciudad local, es entrega local
        // Esto se puede personalizar según la lógica de negocio específica
        const hasLocalDelivery = order.shippingDetails?.cityName === 'Ciudad Local' ||
            order.total <= maxCashAmount; // Ejemplo alternativo

        return order.total <= maxCashAmount && hasLocalDelivery;
    }
}
