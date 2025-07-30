import { CreateOrderUseCase } from '../../../../../src/domain/use-cases/order/create-order.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { CreateOrderDto } from '../../../../../src/domain/dtos/order/create-order.dto';

const mockOrderRepository = {
    create: jest.fn()
};

const mockCustomerRepository = {
    findByUserId: jest.fn(),
    create: jest.fn(),
    findAddressById: jest.fn(),
    getAddressesByCustomerId: jest.fn().mockResolvedValue([
        {
            id: 'address1',
            customerId: 'customer1',
            isDefault: true,
            recipientName: 'Test User',
            phone: '123456789',
            streetAddress: 'Calle Falsa 123',
            city: {
                id: 'city1',
                name: 'Ciudad',
            },
            neighborhood: {
                id: 'neigh1',
                name: 'Barrio',
            },
            postalCode: '1234',
            additionalInfo: 'Depto 2B',
        },
    ])
};

const mockProductRepository = {
    findById: jest.fn().mockResolvedValue({
        id: 'p1',
        name: 'Producto Test',
        price: 100,
        taxRate: 0.21,
        stock: 10,
        unit: { id: 'unit1', name: 'Unidad' },
        category: { id: 'cat1', name: 'Categoría' },
        tags: [],
    })
};

const mockCouponRepository = {
    findByCode: jest.fn()
};

const mockNeighborhoodRepository = {
    findById: jest.fn().mockResolvedValue({
        id: 'neigh1',
        name: 'Barrio Test',
        city: {
            id: 'city1',
            name: 'Ciudad Test'
        }
    })
};

const mockCityRepository = {
    findById: jest.fn().mockResolvedValue({
        id: 'city1',
        name: 'Ciudad Test'
    })
};

const mockOrderStatusRepository = {
    findDefault: jest.fn()
};

const mockDeliveryMethodRepository = {
    findById: jest.fn().mockResolvedValue({
        id: 'dm1',
        code: 'DELIVERY',
        isActive: true,
        requiresAddress: true
    })
};

const mockNotificationService = {
    sendOrderNotification: jest.fn()
};

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

describe('CreateOrderUseCase', () => {
    let useCase: CreateOrderUseCase;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset mocks to default values
        mockProductRepository.findById.mockResolvedValue({
            id: 'p1',
            name: 'Producto Test',
            price: 100,
            taxRate: 0.21,
            stock: 10,
            unit: { id: 'unit1', name: 'Unidad' },
            category: { id: 'cat1', name: 'Categoría' },
            tags: [],
        });

        mockCustomerRepository.getAddressesByCustomerId.mockResolvedValue([
            {
                id: 'address1',
                customerId: 'customer1',
                isDefault: true,
                recipientName: 'Test User',
                phone: '123456789',
                streetAddress: 'Calle Falsa 123',
                city: {
                    id: 'city1',
                    name: 'Ciudad',
                },
                neighborhood: {
                    id: 'neigh1',
                    name: 'Barrio',
                },
                postalCode: '1234',
                additionalInfo: 'Depto 2B',
            },
        ]);

        useCase = new CreateOrderUseCase(
            mockOrderRepository as any,
            mockCustomerRepository as any,
            mockProductRepository as any,
            mockCouponRepository as any,
            mockNeighborhoodRepository as any,
            mockCityRepository as any,
            mockOrderStatusRepository as any,
            mockDeliveryMethodRepository as any,
            mockNotificationService as any,
            mockLogger as any
        );
    });

    it('should create an order for a registered user (happy path)', async () => {
        const dto = {
            items: [{ productId: 'p1', quantity: 1, unitPrice: 100 }],
            deliveryMethodId: 'dm1'
        } as any;
        const userId = 'user1';

        // Mock all necessary dependencies
        mockOrderStatusRepository.findDefault.mockResolvedValue({ id: 'status1' });
        mockCustomerRepository.findByUserId.mockResolvedValue({
            id: 'customer1',
            name: 'Test Customer',
            email: 'test@test.com',
            phone: '123456789',
            address: 'Test Address',
            isActive: true,
            userId: 'user1'
        });
        mockOrderRepository.create.mockResolvedValue({ id: 'order1' });

        const result = await useCase.execute(dto, userId);
        expect(result.id).toBe('order1');
        expect(mockOrderRepository.create).toHaveBeenCalled();
    });

    it('should throw if no default order status', async () => {
        mockOrderStatusRepository.findDefault.mockResolvedValue(null);
        await expect(useCase.execute({} as any, 'user1')).rejects.toThrow('No se encontró un estado por defecto');
    });

    it('should throw if customer not found for user', async () => {
        mockOrderStatusRepository.findDefault.mockResolvedValue({ id: 'status1' });
        mockCustomerRepository.findByUserId.mockResolvedValue(null);
        await expect(useCase.execute({} as any, 'user1')).rejects.toThrow('Perfil de cliente no encontrado');
    });

    it('should throw if guest missing email or name', async () => {
        mockOrderStatusRepository.findDefault.mockResolvedValue({ id: 'status1' });
        await expect(useCase.execute({} as any)).rejects.toThrow('Faltan datos básicos del cliente invitado');
        await expect(useCase.execute({ customerEmail: 'a@a.com' } as any)).rejects.toThrow('Faltan datos básicos del cliente invitado');
        await expect(useCase.execute({ customerName: 'Invitado' } as any)).rejects.toThrow('Faltan datos básicos del cliente invitado');
    });

    it('should throw if coupon is invalid', async () => {
        mockOrderStatusRepository.findDefault.mockResolvedValue({ id: 'status1' });
        mockCustomerRepository.findByUserId.mockResolvedValue({
            id: 'customer1',
            name: 'Test Customer',
            email: 'test@test.com',
            phone: '123456789',
            address: 'Test Address',
            isActive: true,
            userId: 'user1'
        });
        mockOrderRepository.create.mockResolvedValue({ id: 'order1' });
        mockCouponRepository.findByCode.mockResolvedValue(null);

        const dto = {
            items: [{ productId: 'p1', quantity: 1, unitPrice: 100 }],
            couponCode: 'NOPE',
            deliveryMethodId: 'dm1'
        } as any;

        await expect(useCase.execute(dto, 'user1')).rejects.toThrow("Cupón 'NOPE' inválido");
    });

    it('should throw if coupon is not applicable', async () => {
        mockOrderStatusRepository.findDefault.mockResolvedValue({ id: 'status1' });
        mockCustomerRepository.findByUserId.mockResolvedValue({
            id: 'customer1',
            name: 'Test Customer',
            email: 'test@test.com',
            phone: '123456789',
            address: 'Test Address',
            isActive: true,
            userId: 'user1'
        });
        mockOrderRepository.create.mockResolvedValue({ id: 'order1' });
        mockCouponRepository.findByCode.mockResolvedValue({
            id: 'coupon1',
            code: 'NOPE',
            isValidNow: false,
            isUsageLimitReached: false
        });

        const dto = {
            items: [{ productId: 'p1', quantity: 1, unitPrice: 100 }],
            couponCode: 'NOPE',
            deliveryMethodId: 'dm1'
        } as any;

        await expect(useCase.execute(dto, 'user1')).rejects.toThrow("Cupón 'NOPE' no aplicable");
    });

    it('should throw if product not found when validating coupon', async () => {
        mockOrderStatusRepository.findDefault.mockResolvedValue({ id: 'status1' });
        mockCustomerRepository.findByUserId.mockResolvedValue({
            id: 'customer1',
            name: 'Test Customer',
            email: 'test@test.com',
            phone: '123456789',
            address: 'Test Address',
            isActive: true,
            userId: 'user1'
        });
        mockCouponRepository.findByCode.mockResolvedValue({
            id: 'coupon1',
            code: 'OK',
            isValidNow: true,
            isUsageLimitReached: false,
            discountType: 'percentage',
            discountValue: 10
        });
        mockProductRepository.findById.mockResolvedValue(null);

        const dto = {
            items: [{ productId: 'p1', quantity: 1, unitPrice: 100 }],
            couponCode: 'OK',
            deliveryMethodId: 'dm1'
        } as any;

        await expect(useCase.execute(dto, 'user1')).rejects.toThrow('Producto p1 no encontrado');
    });

    it('should throw CustomError if thrown inside try', async () => {
        mockOrderStatusRepository.findDefault.mockResolvedValue({ id: 'status1' });
        mockCustomerRepository.findByUserId.mockImplementation(() => { throw CustomError.badRequest('fail'); });
        await expect(useCase.execute({} as any, 'user1')).rejects.toThrow('fail');
    });

    it('should throw internalServerError for unknown errors', async () => {
        mockOrderStatusRepository.findDefault.mockResolvedValue({ id: 'status1' });
        mockCustomerRepository.findByUserId.mockImplementation(() => { throw new Error('fail'); });
        await expect(useCase.execute({} as any, 'user1')).rejects.toThrow('Error al crear la venta: fail');
    });
});
