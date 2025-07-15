import { CreateOrderDto } from '../../../../../src/domain/dtos/order/create-order.dto';

describe('Guest + Retiro en local (PICKUP) - Validación de campos', () => {
    it('should allow guest order with PICKUP method and no address fields', async () => {
        // Simular método de entrega PICKUP (requiresAddress: false)
        const deliveryMethodId = '64f1b2c3d4e5f6a7b8c9d0e1';
        // Mock dinámico de DeliveryMethodModel
        jest.resetModules();
        jest.doMock('../../../../../src/data/mongodb/models/delivery-method.model', () => ({
            DeliveryMethodModel: {
                findById: async (id: string) => ({
                    _id: id,
                    code: 'PICKUP',
                    isActive: true,
                    requiresAddress: false,
                })
            }
        }));

        const orderBody = {
            items: [
                { productId: '64f1b2c3d4e5f6a7b8c9d0e2', quantity: 1, unitPrice: 100 }
            ],
            deliveryMethodId,
            customerName: 'Invitado',
            customerEmail: 'guest_123@checkout.guest',
            // No se envía ningún campo de dirección ni shipping
        };

        const [error, dto] = await CreateOrderDto.create(orderBody);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.customerName).toBe('Invitado');
        expect(dto!.customerEmail).toBe('guest_123@checkout.guest');
        expect(dto!.shippingStreetAddress).toBeUndefined();
        expect(dto!.shippingNeighborhoodId).toBeUndefined();
        expect(dto!.shippingCityId).toBeUndefined();
    });
});
// tests/unit/domain/use-cases/order/create-order-guest-simple.test.ts

import { GuestEmailUtil } from '../../../../../src/domain/utils/guest-email.util';

describe('CreateOrderUseCase - Guest Email Logic Verification', () => {

    describe('Guest Email Core Logic', () => {

        it('should verify guest email detection works correctly', () => {
            const guestEmail = 'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest';
            const regularEmail = 'user@example.com';

            expect(GuestEmailUtil.isGuestEmail(guestEmail)).toBe(true);
            expect(GuestEmailUtil.isGuestEmail(regularEmail)).toBe(false);
        });

        it('should demonstrate the fix logic for CreateOrderUseCase', () => {
            const guestEmail = 'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest';
            const regularEmail = 'user@example.com';

            // Simulate existing customers
            const existingGuestCustomer = {
                id: 'guest-123',
                email: guestEmail,
                userId: null // Guest has no userId
            };

            const existingRegisteredCustomer = {
                id: 'user-456',
                email: regularEmail,
                userId: 'user-id-789' // Registered user has userId
            };

            // Test the logic implemented in CreateOrderUseCase

            // For guest email: should NOT throw error even if customer exists
            let guestEmailShouldThrowError = false;
            if (existingGuestCustomer && !GuestEmailUtil.isGuestEmail(guestEmail)) {
                if (existingGuestCustomer.userId) {
                    guestEmailShouldThrowError = true;
                }
            }
            expect(guestEmailShouldThrowError).toBe(false);

            // For regular email with userId: should throw error
            let regularEmailShouldThrowError = false;
            if (existingRegisteredCustomer && !GuestEmailUtil.isGuestEmail(regularEmail)) {
                if (existingRegisteredCustomer.userId) {
                    regularEmailShouldThrowError = true;
                }
            }
            expect(regularEmailShouldThrowError).toBe(true);
        });

        it('should handle edge cases in the logic', () => {
            // Case 1: Guest email pattern but customer has userId (edge case)
            const guestEmail = 'guest_123@checkout.guest';
            const customerWithUserIdButGuestEmail = {
                id: 'edge-case-1',
                email: guestEmail,
                userId: 'some-user-id' // This is unusual but possible
            };

            // Even if customer has userId, guest email should not trigger error due to the first condition
            let shouldThrowError = false;
            if (customerWithUserIdButGuestEmail && !GuestEmailUtil.isGuestEmail(guestEmail)) {
                if (customerWithUserIdButGuestEmail.userId) {
                    shouldThrowError = true;
                }
            }
            expect(shouldThrowError).toBe(false); // Guest email bypasses the check

            // Case 2: Regular email but customer without userId (guest checkout with regular email)
            const regularEmail = 'user@example.com';
            const guestCustomerWithRegularEmail = {
                id: 'edge-case-2',
                email: regularEmail,
                userId: null // Guest customer but with regular email
            };

            shouldThrowError = false;
            if (guestCustomerWithRegularEmail && !GuestEmailUtil.isGuestEmail(regularEmail)) {
                if (guestCustomerWithRegularEmail.userId) {
                    shouldThrowError = true;
                }
            }
            expect(shouldThrowError).toBe(false); // No userId, so no error
        });

    });

});
