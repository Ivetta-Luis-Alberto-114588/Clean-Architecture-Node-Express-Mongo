// tests/unit/domain/use-cases/order/select-payment-method.use-case.test.ts
import { SelectPaymentMethodUseCase } from '../../../../../src/domain/use-cases/order/select-payment-method.use-case';
import { OrderRepository } from '../../../../../src/domain/repositories/order/order.repository';
import { PaymentMethodRepository } from '../../../../../src/domain/repositories/payment/payment-method.repository';
import { OrderStatusRepository } from '../../../../../src/domain/repositories/order/order-status.repository';
import { ILogger } from '../../../../../src/domain/interfaces/logger.interface';
import { SelectPaymentMethodDto } from '../../../../../src/domain/dtos/order/select-payment-method.dto';
import { OrderEntity } from '../../../../../src/domain/entities/order/order.entity';
import { PaymentMethodEntity } from '../../../../../src/domain/entities/payment/payment-method.entity';
import { OrderStatusEntity } from '../../../../../src/domain/entities/order/order-status.entity';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('SelectPaymentMethodUseCase', () => {
    let useCase: SelectPaymentMethodUseCase;
    let mockOrderRepository: jest.Mocked<OrderRepository>;
    let mockPaymentMethodRepository: jest.Mocked<PaymentMethodRepository>;
    let mockOrderStatusRepository: jest.Mocked<OrderStatusRepository>;
    let mockLogger: jest.Mocked<ILogger>;

    beforeEach(() => {
        mockOrderRepository = {
            findById: jest.fn(),
            updatePaymentMethod: jest.fn(),
        } as any;
        
        mockPaymentMethodRepository = {
            findByCode: jest.fn(),
        } as any;
        
        mockOrderStatusRepository = {
            findByCode: jest.fn(),
        } as any;
          mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            http: jest.fn(),
        };

        useCase = new SelectPaymentMethodUseCase(
            mockOrderRepository,
            mockPaymentMethodRepository,
            mockOrderStatusRepository,
            mockLogger
        );
    });    const createMockOrder = (status: string = 'PENDING', total: number = 1000): OrderEntity => {
        const mockOrder = new OrderEntity(
            'order-123',
            {} as any, // customer
            [], // items
            total, // subtotal
            0, // taxRate
            0, // taxAmount
            0, // discountRate
            0, // discountAmount
            total, // total
            new Date(), // date
            { code: status, name: status } as OrderStatusEntity, // status
            undefined, // paymentMethod
            '', // notes
            { cityName: 'Ciudad Local' } as any // shippingDetails
        );
        return mockOrder;
    };

    const createMockPaymentMethod = (code: string, isActive: boolean = true): PaymentMethodEntity => {
        return {
            id: 'pm-123',
            code,
            name: `Payment ${code}`,
            isActive,
        } as PaymentMethodEntity;
    };

    const createMockOrderStatus = (code: string): OrderStatusEntity => {
        return {
            id: 'status-123',
            code,
            name: code,
        } as OrderStatusEntity;
    };

    describe('execute', () => {
        it('should successfully select CASH payment method for pending order', async () => {
            const selectDto = { orderId: 'order-123', paymentMethodCode: 'CASH' } as SelectPaymentMethodDto;            const mockOrder = createMockOrder('PENDING', 500); // Within cash limit
            const mockPaymentMethod = createMockPaymentMethod('CASH');
            const mockNewStatus = createMockOrderStatus('CONFIRMED');
            const mockUpdatedOrder = createMockOrder('CONFIRMED', 500);
            (mockUpdatedOrder as any).paymentMethod = mockPaymentMethod;

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockPaymentMethodRepository.findByCode.mockResolvedValue(mockPaymentMethod);
            mockOrderStatusRepository.findByCode.mockResolvedValue(mockNewStatus);
            mockOrderRepository.updatePaymentMethod.mockResolvedValue(mockUpdatedOrder);

            const result = await useCase.execute(selectDto);

            expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-123');
            expect(mockPaymentMethodRepository.findByCode).toHaveBeenCalledWith('CASH');
            expect(mockOrderStatusRepository.findByCode).toHaveBeenCalledWith('CONFIRMED');
            expect(mockOrderRepository.updatePaymentMethod).toHaveBeenCalledWith('order-123', {
                paymentMethodId: 'pm-123',
                statusId: 'status-123',
                notes: 'Método de pago seleccionado: Payment CASH'
            });
            expect(result).toEqual(mockUpdatedOrder);
        });

        it('should successfully select MERCADO_PAGO payment method', async () => {
            const selectDto = { orderId: 'order-123', paymentMethodCode: 'MERCADO_PAGO' } as SelectPaymentMethodDto;            const mockOrder = createMockOrder('PENDING', 1000);
            const mockPaymentMethod = createMockPaymentMethod('MERCADO_PAGO');
            const mockNewStatus = createMockOrderStatus('AWAITING_PAYMENT');
            const mockUpdatedOrder = createMockOrder('AWAITING_PAYMENT', 1000);
            (mockUpdatedOrder as any).paymentMethod = mockPaymentMethod;

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockPaymentMethodRepository.findByCode.mockResolvedValue(mockPaymentMethod);
            mockOrderStatusRepository.findByCode.mockResolvedValue(mockNewStatus);
            mockOrderRepository.updatePaymentMethod.mockResolvedValue(mockUpdatedOrder);

            const result = await useCase.execute(selectDto);

            expect(mockOrderStatusRepository.findByCode).toHaveBeenCalledWith('AWAITING_PAYMENT');
            expect(result).toEqual(mockUpdatedOrder);
        });

        it('should throw error when order not found', async () => {
            const selectDto = { orderId: 'order-123', paymentMethodCode: 'CASH' } as SelectPaymentMethodDto;

            mockOrderRepository.findById.mockResolvedValue(null as any);

            await expect(useCase.execute(selectDto)).rejects.toThrow(CustomError);
            await expect(useCase.execute(selectDto)).rejects.toThrow('Orden con ID order-123 no encontrada');
        });

        it('should throw error when order status is invalid', async () => {
            const selectDto = { orderId: 'order-123', paymentMethodCode: 'CASH' } as SelectPaymentMethodDto;
            const mockOrder = createMockOrder('COMPLETED'); // Invalid status

            mockOrderRepository.findById.mockResolvedValue(mockOrder);

            await expect(useCase.execute(selectDto)).rejects.toThrow(CustomError);
            await expect(useCase.execute(selectDto)).rejects.toThrow('No se puede seleccionar método de pago');
        });

        it('should throw error when payment method not found', async () => {
            const selectDto = { orderId: 'order-123', paymentMethodCode: 'INVALID' } as SelectPaymentMethodDto;
            const mockOrder = createMockOrder('PENDING');

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockPaymentMethodRepository.findByCode.mockResolvedValue(null);

            await expect(useCase.execute(selectDto)).rejects.toThrow(CustomError);
            await expect(useCase.execute(selectDto)).rejects.toThrow('Método de pago INVALID no encontrado');
        });

        it('should throw error when payment method is inactive', async () => {
            const selectDto = { orderId: 'order-123', paymentMethodCode: 'CASH' } as SelectPaymentMethodDto;
            const mockOrder = createMockOrder('PENDING');
            const mockPaymentMethod = createMockPaymentMethod('CASH', false); // Inactive

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockPaymentMethodRepository.findByCode.mockResolvedValue(mockPaymentMethod);

            await expect(useCase.execute(selectDto)).rejects.toThrow(CustomError);
            await expect(useCase.execute(selectDto)).rejects.toThrow('Método de pago CASH no está activo');
        });

        it('should throw error when cash payment exceeds limit', async () => {
            const selectDto = { orderId: 'order-123', paymentMethodCode: 'CASH' } as SelectPaymentMethodDto;
            const mockOrder = createMockOrder('PENDING', 10000); // Exceeds cash limit
            const mockPaymentMethod = createMockPaymentMethod('CASH');

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockPaymentMethodRepository.findByCode.mockResolvedValue(mockPaymentMethod);

            await expect(useCase.execute(selectDto)).rejects.toThrow(CustomError);
            await expect(useCase.execute(selectDto)).rejects.toThrow('Esta orden no es elegible para pago en efectivo');
        });

        it('should throw error when mercado pago amount is too low', async () => {
            const selectDto = { orderId: 'order-123', paymentMethodCode: 'MERCADO_PAGO' } as SelectPaymentMethodDto;
            const mockOrder = createMockOrder('PENDING', 50); // Below minimum
            const mockPaymentMethod = createMockPaymentMethod('MERCADO_PAGO');

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockPaymentMethodRepository.findByCode.mockResolvedValue(mockPaymentMethod);

            await expect(useCase.execute(selectDto)).rejects.toThrow(CustomError);
            await expect(useCase.execute(selectDto)).rejects.toThrow('El monto mínimo para Mercado Pago es $100');
        });

        it('should include custom notes when provided', async () => {
            const selectDto = { 
                orderId: 'order-123', 
                paymentMethodCode: 'CASH',
                notes: 'Custom payment notes'
            } as SelectPaymentMethodDto;            const mockOrder = createMockOrder('PENDING', 500);
            const mockPaymentMethod = createMockPaymentMethod('CASH');
            const mockNewStatus = createMockOrderStatus('CONFIRMED');
            const mockUpdatedOrder = createMockOrder('CONFIRMED', 500);
            (mockUpdatedOrder as any).paymentMethod = mockPaymentMethod;

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockPaymentMethodRepository.findByCode.mockResolvedValue(mockPaymentMethod);
            mockOrderStatusRepository.findByCode.mockResolvedValue(mockNewStatus);
            mockOrderRepository.updatePaymentMethod.mockResolvedValue(mockUpdatedOrder);

            await useCase.execute(selectDto);

            expect(mockOrderRepository.updatePaymentMethod).toHaveBeenCalledWith('order-123', {
                paymentMethodId: 'pm-123',
                statusId: 'status-123',
                notes: 'Custom payment notes'
            });
        });
    });
});
