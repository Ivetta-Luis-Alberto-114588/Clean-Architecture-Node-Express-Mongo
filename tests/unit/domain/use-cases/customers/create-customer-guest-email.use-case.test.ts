// tests/unit/domain/use-cases/customers/create-customer-guest-email.use-case.test.ts

import { CreateCustomerUseCase } from '../../../../../src/domain/use-cases/customers/create-customer.use-case';
import { CreateCustomerDto } from '../../../../../src/domain/dtos/customers/create-customer.dto';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { CustomerEntity } from '../../../../../src/domain/entities/customers/customer';
import { GuestEmailUtil } from '../../../../../src/domain/utils/guest-email.util';

describe('CreateCustomerUseCase - Guest Email Handling', () => {
    let useCase: CreateCustomerUseCase;
    let mockCustomerRepository: any;
    let mockNeighborhoodRepository: any;

    beforeEach(() => {
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

        useCase = new CreateCustomerUseCase(
            mockCustomerRepository,
            mockNeighborhoodRepository
        );
    });

    describe('Guest Email Validation', () => {
        const mockNeighborhood = {
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
        };

        const mockGuestCustomer: CustomerEntity = {
            id: 'guest-customer-id',
            name: 'Guest Customer',
            email: 'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest',
            phone: '+1234567890',
            address: 'Guest Address',
            neighborhood: mockNeighborhood,
            isActive: true,
            userId: null
        };

        const mockRegisteredCustomer: CustomerEntity = {
            ...mockGuestCustomer,
            id: 'registered-customer-id',
            email: 'regular.user@example.com',
            userId: 'user-id-123'
        };

        it('should allow creating customer with guest email even if similar email exists', async () => {
            const [error, createCustomerDto] = CreateCustomerDto.create({
                name: 'Guest Customer',
                email: 'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest',
                phone: '+1234567890',
                address: 'Guest Address',
                neighborhoodId: '507f1f77bcf86cd799439011' // Valid MongoDB ObjectId
            });

            expect(error).toBeUndefined();
            expect(createCustomerDto).toBeDefined();

            // Mock neighborhood exists
            mockNeighborhoodRepository.findById.mockResolvedValue(mockNeighborhood);

            // Mock that no existing customer is found because it's a guest email
            mockCustomerRepository.findByEmail.mockResolvedValue(null);

            // Mock customer creation
            mockCustomerRepository.create.mockResolvedValue(mockGuestCustomer);

            // Should create customer successfully
            const result = await useCase.execute(createCustomerDto!);
            expect(result).toBeDefined();
            expect(result.email).toBe(createCustomerDto!.email);

            // Verify that findByEmail was NOT called because it's a guest email
            expect(mockCustomerRepository.findByEmail).not.toHaveBeenCalled();
        });

        it('should reject regular email if already exists', async () => {
            const [error, createCustomerDto] = CreateCustomerDto.create({
                name: 'Regular Customer',
                email: 'regular.user@example.com',
                phone: '+1234567890',
                address: 'Regular Address',
                neighborhoodId: '507f1f77bcf86cd799439011' // Valid MongoDB ObjectId
            });

            expect(error).toBeUndefined();
            expect(createCustomerDto).toBeDefined();

            // Mock neighborhood exists
            mockNeighborhoodRepository.findById.mockResolvedValue(mockNeighborhood);

            // Mock that registered customer already exists
            mockCustomerRepository.findByEmail.mockResolvedValue(mockRegisteredCustomer);

            // Should throw error for existing regular email
            await expect(useCase.execute(createCustomerDto!))
                .rejects
                .toThrow(CustomError);

            await expect(useCase.execute(createCustomerDto!))
                .rejects
                .toThrow('Ya existe un cliente con este email');

            // Verify that findByEmail was called for regular email
            expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(createCustomerDto!.email);
        });

        it('should correctly identify guest vs regular emails', () => {
            const guestEmails = [
                'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest',
                'guest_123456789_987654321_555444333_abc123@checkout.guest',
                'guest_temp@checkout.guest',
                'guest_anonymous@example.com'
            ];

            const regularEmails = [
                'user@example.com',
                'test@gmail.com',
                'customer@company.com',
                'admin@ecommerce.com'
            ];

            guestEmails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(true);
            });

            regularEmails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(false);
            });
        });

        it('should allow creating customer with regular email if it does not exist', async () => {
            const [error, createCustomerDto] = CreateCustomerDto.create({
                name: 'New Customer',
                email: 'new.customer@example.com',
                phone: '+1234567890',
                address: 'New Address',
                neighborhoodId: '507f1f77bcf86cd799439011' // Valid MongoDB ObjectId
            });

            expect(error).toBeUndefined();
            expect(createCustomerDto).toBeDefined();

            // Mock neighborhood exists
            mockNeighborhoodRepository.findById.mockResolvedValue(mockNeighborhood);

            // Mock that no customer exists with this email
            mockCustomerRepository.findByEmail.mockResolvedValue(null);

            // Mock customer creation
            const newCustomer = {
                ...mockRegisteredCustomer,
                email: 'new.customer@example.com'
            };
            mockCustomerRepository.create.mockResolvedValue(newCustomer);

            // Should create customer successfully
            const result = await useCase.execute(createCustomerDto!);
            expect(result).toBeDefined();
            expect(result.email).toBe(createCustomerDto!.email);

            // Verify that findByEmail was called for regular email
            expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(createCustomerDto!.email);
        });
    });
});
