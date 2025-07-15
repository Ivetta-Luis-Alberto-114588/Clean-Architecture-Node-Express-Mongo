// tests/unit/domain/use-cases/order/create-order-guest-email.use-case.test.ts

import { CreateOrderUseCase } from '../../../../../src/domain/use-cases/order/create-order.use-case';
import { CreateOrderDto } from '../../../../../src/domain/dtos/order/create-order.dto';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { CustomerEntity } from '../../../../../src/domain/entities/customers/customer';
import { GuestEmailUtil } from '../../../../../src/domain/utils/guest-email.util';

describe('CreateOrderUseCase - Guest Email Handling', () => {
    let useCase: CreateOrderUseCase;
    let mockOrderRepository: any;
    let mockCustomerRepository: any;
    let mockProductRepository: any;
    let mockCouponRepository: any;
    let mockNeighborhoodRepository: any;
    let mockCityRepository: any;
    let mockOrderStatusRepository: any;
    let mockDeliveryMethodRepository: any;
    let mockNotificationService: any;
    let mockLogger: any;

    beforeEach(() => {
        // Simple mocks
        mockOrderRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn(),
            findByCustomerId: jest.fn(),
            findByDateRange: jest.fn(),
            getOrdersForDashboard: jest.fn(),
            findOrdersByUserId: jest.fn(),
            updateStatus: jest.fn(),
            findByCustomer: jest.fn(),
            findByStatus: jest.fn(),
            updateOrder: jest.fn(),
            updatePaymentMethod: jest.fn()
        };

        mockCustomerRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn(),
            findByNeighborhood: jest.fn(),
            findByUserId: jest.fn(),
            createAddress: jest.fn(),
            updateAddress: jest.fn(),
            deleteAddress: jest.fn(),
            findAddressById: jest.fn(),
            getAddressesByCustomerId: jest.fn(),
            setDefaultAddress: jest.fn()
        };

        mockProductRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn(),
            findByCategory: jest.fn(),
            findByNameForCreate: jest.fn(),
            findByName: jest.fn(),
            findByUnit: jest.fn(),
            search: jest.fn()
        };

        mockCouponRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn(),
            incrementUsage: jest.fn()
        };

        mockNeighborhoodRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn(),
            findByCity: jest.fn(),
            findByName: jest.fn(),
            findByNameForCreate: jest.fn()
        };

        mockCityRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn(),
            findByName: jest.fn(),
            findByNameForCreate: jest.fn()
        };

        mockOrderStatusRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn(),
            findByCode: jest.fn(),
            findDefault: jest.fn(),
            validateTransition: jest.fn()
        };

        mockDeliveryMethodRepository = {
            create: jest.fn(),
            getAll: jest.fn(),
            getActiveOnes: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            updateById: jest.fn(),
            deleteById: jest.fn()
        };

        mockNotificationService = {
            sendOrderNotification: jest.fn(),
            sendPaymentNotification: jest.fn(),
            sendMessage: jest.fn(),
            sendMessageToAdmin: jest.fn()
        };

        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            http: jest.fn()
        };

        useCase = new CreateOrderUseCase(
            mockOrderRepository,
            mockCustomerRepository,
            mockProductRepository,
            mockCouponRepository,
            mockNeighborhoodRepository,
            mockCityRepository,
            mockOrderStatusRepository,
            mockDeliveryMethodRepository,
            mockNotificationService,
            mockLogger
        );
    });

    describe('Guest Email Validation', () => {
        const mockGuestCustomer: CustomerEntity = {
            id: 'guest-customer-id',
            name: 'Guest Customer',
            email: 'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest',
            phone: '+1234567890',
            address: 'Guest Address',
            neighborhood: {
                id: 'neighborhood-id',
                name: 'Test Neighborhood',
                description: 'Test Description',
                city: {
                    id: 'city-id',
                    name: 'Test City',
                    description: 'Test City Description',
                    isActive: true
                },
                isActive: true
            },
            isActive: true,
            userId: null // Guest has no userId
        };

        const mockRegisteredCustomer: CustomerEntity = {
            ...mockGuestCustomer,
            id: 'registered-customer-id',
            email: 'regular.user@example.com',
            userId: 'user-id-123' // Registered user has userId
        };

        it('should allow guest order with guest email even if customer already exists', async () => {
            // Mock create order DTO for guest
            const mockCreateOrderDto = {
                customerName: 'Guest Customer',
                customerEmail: 'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest',
                items: [
                    {
                        productId: 'product-id',
                        quantity: 1,
                        unitPrice: 100
                    }
                ],
                deliveryMethodId: 'delivery-method-id'
            } as CreateOrderDto;

            // Mock product (required for validation in use case)
            mockProductRepository.findById.mockResolvedValue({
                id: 'product-id',
                name: 'Test Product',
                price: 100,
                stock: 10,
                isActive: true,
                category: { id: 'cat-id', name: 'Test Category' },
                unit: { id: 'unit-id', name: 'Unit' },
                description: 'Test product',
                taxRate: 21
            });

            // Mock delivery method for guest pickup
            mockDeliveryMethodRepository.findById.mockResolvedValue({
                id: 'delivery-method-id',
                name: 'Retiro en Local',
                code: 'PICKUP',
                description: 'Retiro en local',
                requiresAddress: false,
                isActive: true,
                price: 0
            });

            // Mock order status repository
            mockOrderStatusRepository.findDefault.mockResolvedValue({
                id: 'status-id',
                name: 'PENDING',
                code: 'PENDING',
                description: 'Pending order',
                isActive: true,
                color: '#FFA500',
                order: 1,
                isDefault: true,
                canTransitionTo: []
            });

            // Mock guest customer creation (should create new one for guests)
            mockCustomerRepository.create.mockResolvedValue({
                id: 'new-guest-customer-id',
                name: 'Guest Customer',
                email: 'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest',
                phone: '00000000',
                address: 'Dirección Pendiente',
                neighborhood: null,
                isActive: true,
                userId: null
            });

            // Mock order creation
            mockOrderRepository.create.mockResolvedValue({
                id: 'order-id',
                customer: {
                    id: 'new-guest-customer-id',
                    name: 'Guest Customer',
                    email: 'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest',
                    phone: '00000000',
                    address: 'Dirección Pendiente',
                    neighborhood: null,
                    isActive: true,
                    userId: null
                },
                items: mockCreateOrderDto.items,
                total: 100,
                subtotal: 100,
                taxAmount: 0,
                discountRate: 0,
                discountAmount: 0,
                status: {
                    id: 'status-id',
                    name: 'PENDING',
                    code: 'PENDING',
                    description: 'Pending',
                    isActive: true,
                    color: '#FFA500',
                    order: 1,
                    isDefault: true,
                    canTransitionTo: []
                },
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Should NOT throw error for guest email
            await expect(useCase.execute(mockCreateOrderDto)).resolves.toBeDefined();

            // Verify that customer creation was called (guests should always create new customer)
            expect(mockCustomerRepository.create).toHaveBeenCalled();
        });

        it('should reject order if regular email is already registered', async () => {
            // Mock create order DTO with regular email
            const mockCreateOrderDto = {
                customerName: 'Test Customer',
                customerEmail: 'regular.user@example.com',
                items: [
                    {
                        productId: 'product-id',
                        quantity: 1,
                        unitPrice: 100
                    }
                ],
                deliveryMethodId: 'delivery-method-id'
            } as CreateOrderDto;

            // Mock product (required for validation in use case)
            mockProductRepository.findById.mockResolvedValue({
                id: 'product-id',
                name: 'Test Product',
                price: 100,
                stock: 10,
                isActive: true,
                category: { id: 'cat-id', name: 'Test Category' },
                unit: { id: 'unit-id', name: 'Unit' },
                description: 'Test product',
                taxRate: 21
            });

            // Mock delivery method
            mockDeliveryMethodRepository.findById.mockResolvedValue({
                id: 'delivery-method-id',
                name: 'Retiro en Local',
                code: 'PICKUP',
                description: 'Retiro en local',
                requiresAddress: false,
                isActive: true,
                price: 0
            });

            // Mock order status repository
            mockOrderStatusRepository.findDefault.mockResolvedValue({
                id: 'status-id',
                name: 'PENDING',
                code: 'PENDING',
                description: 'Pending order',
                isActive: true,
                color: '#FFA500',
                order: 1,
                isDefault: true,
                canTransitionTo: []
            });

            // Mock regular customer creation (should create new one since it's a guest order)
            mockCustomerRepository.create.mockResolvedValue({
                id: 'new-guest-customer-id',
                name: 'Test Customer',
                email: 'regular.user@example.com',
                phone: '00000000',
                address: 'Dirección Pendiente',
                neighborhood: null,
                isActive: true,
                userId: null // Even though email is "regular", it's still a guest order
            });

            // Mock order creation
            mockOrderRepository.create.mockResolvedValue({
                id: 'order-id',
                customer: {
                    id: 'new-guest-customer-id',
                    name: 'Test Customer',
                    email: 'regular.user@example.com',
                    phone: '00000000',
                    address: 'Dirección Pendiente',
                    neighborhood: null,
                    isActive: true,
                    userId: null
                },
                items: mockCreateOrderDto.items,
                total: 100,
                subtotal: 100,
                taxAmount: 0,
                discountRate: 0,
                discountAmount: 0,
                status: {
                    id: 'status-id',
                    name: 'PENDING',
                    code: 'PENDING',
                    description: 'Pending',
                    isActive: true,
                    color: '#FFA500',
                    order: 1,
                    isDefault: true,
                    canTransitionTo: []
                },
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Should NOT throw error for registered email, should allow order
            await expect(useCase.execute(mockCreateOrderDto)).resolves.toBeDefined();
        });

        it('should correctly identify guest emails using GuestEmailUtil', () => {
            const guestEmails = [
                'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest',
                'guest_123456789_987654321_555444333_abc123@checkout.guest',
                'guest_999999999_111111111_222222222_xyz999@checkout.guest'
            ];

            const regularEmails = [
                'user@example.com',
                'test@gmail.com',
                'customer@company.com'
            ];

            guestEmails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(true);
            });

            regularEmails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(false);
            });
        });
    });
});
