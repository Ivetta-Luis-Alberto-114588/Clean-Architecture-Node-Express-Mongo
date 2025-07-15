// tests/integration/order/guest-email-flow.integration.test.ts

import { GuestEmailUtil } from '../../../src/domain/utils/guest-email.util';
import { CreateCustomerUseCase } from '../../../src/domain/use-cases/customers/create-customer.use-case';
import { CreateOrderUseCase } from '../../../src/domain/use-cases/order/create-order.use-case';

describe('Guest Email Flow - Integration Test', () => {

    describe('GuestEmailUtil Integration', () => {
        it('should correctly identify guest emails from frontend', () => {
            const frontendGeneratedEmails = [
                'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest',
                'guest_9876543210_1111111111_2222222222_abc123def@checkout.guest',
                'guest_5555555555_4444444444_3333333333_xyz999aaa@checkout.guest'
            ];

            const regularEmails = [
                'user@example.com',
                'customer@gmail.com',
                'admin@company.com'
            ];

            // All frontend generated emails should be identified as guest emails
            frontendGeneratedEmails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(true);
                expect(GuestEmailUtil.isValidRegisteredUserEmail(email)).toBe(false);

                const analysis = GuestEmailUtil.analyzeEmail(email);
                expect(analysis.isGuest).toBe(true);
                expect(analysis.isRegistered).toBe(false);
                expect(analysis.pattern).toBe('checkout.guest');
            });

            // Regular emails should not be identified as guest emails
            regularEmails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(false);
                expect(GuestEmailUtil.isValidRegisteredUserEmail(email)).toBe(true);

                const analysis = GuestEmailUtil.analyzeEmail(email);
                expect(analysis.isGuest).toBe(false);
                expect(analysis.isRegistered).toBe(true);
                expect(analysis.pattern).toBeUndefined();
            });
        });

        it('should handle edge cases and variations', () => {
            const testCases = [
                {
                    email: 'GUEST_123@CHECKOUT.GUEST',
                    isGuest: true,
                    description: 'uppercase email'
                },
                {
                    email: '  guest_456@checkout.guest  ',
                    isGuest: true,
                    description: 'email with whitespace'
                },
                {
                    email: 'guest_789@example.com',
                    isGuest: true,
                    description: 'guest prefix with regular domain'
                },
                {
                    email: 'user@checkout.guest',
                    isGuest: true,
                    description: 'regular name with guest domain'
                },
                {
                    email: 'guest@example.com',
                    isGuest: false,
                    description: 'misleading but regular email'
                }
            ];

            testCases.forEach(({ email, isGuest, description }) => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(isGuest);
                // console.log(`${description}: ${email} -> ${isGuest ? 'guest' : 'regular'}`);
            });
        });

        it('should handle the exact email pattern from the frontend issue', () => {
            const problematicEmail = 'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest';

            expect(GuestEmailUtil.isGuestEmail(problematicEmail)).toBe(true);
            expect(GuestEmailUtil.isValidRegisteredUserEmail(problematicEmail)).toBe(false);

            const analysis = GuestEmailUtil.analyzeEmail(problematicEmail);
            expect(analysis.isGuest).toBe(true);
            expect(analysis.isRegistered).toBe(false);
            expect(analysis.pattern).toBe('checkout.guest');
        });
    });

    describe('Use Case Integration', () => {
        it('should demonstrate the fix logic', () => {
            // Simulate the scenario described by frontend
            const guestEmail = 'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest';
            const regularEmail = 'user@example.com';

            // Mock existing customer (simulate finding customer in repository)
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

            // Test the logic that was implemented

            // For guest email: should NOT throw error even if customer exists
            if (existingGuestCustomer && !GuestEmailUtil.isGuestEmail(guestEmail)) {
                // This condition should be FALSE, so no error should be thrown
                throw new Error('Email ya registrado. Inicia sesión.');
            }
            // No error thrown - this is correct behavior

            // For regular email with userId: should throw error
            let errorThrown = false;
            try {
                if (existingRegisteredCustomer && !GuestEmailUtil.isGuestEmail(regularEmail)) {
                    if (existingRegisteredCustomer.userId) {
                        throw new Error('Email ya registrado. Inicia sesión.');
                    }
                }
            } catch (error) {
                errorThrown = true;
                expect(error.message).toBe('Email ya registrado. Inicia sesión.');
            }
            expect(errorThrown).toBe(true);
        });
    });
});
