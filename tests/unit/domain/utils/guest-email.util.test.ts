// tests/unit/domain/utils/guest-email.util.test.ts

import { GuestEmailUtil } from '../../../../src/domain/utils/guest-email.util';

describe('GuestEmailUtil', () => {
    describe('isGuestEmail', () => {
        it('should return true for checkout.guest emails', () => {
            const guestEmails = [
                'guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest',
                'guest_123456789_987654321_555444333_abc123@checkout.guest',
                'guest_999999999_111111111_222222222_xyz999@checkout.guest'
            ];

            guestEmails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(true);
            });
        });

        it('should return true for emails with @checkout.guest domain', () => {
            const guestEmails = [
                'any.email@checkout.guest',
                'test123@checkout.guest',
                'temporary-user@checkout.guest'
            ];

            guestEmails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(true);
            });
        });

        it('should return true for emails starting with guest_', () => {
            const guestEmails = [
                'guest_123@example.com',
                'guest_temp_user@test.com',
                'guest_anonymous@domain.com'
            ];

            guestEmails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(true);
            });
        });

        it('should return false for regular user emails', () => {
            const regularEmails = [
                'user@example.com',
                'test@gmail.com',
                'customer@company.com',
                'admin@ecommerce.com',
                'john.doe@business.org'
            ];

            regularEmails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(false);
            });
        });

        it('should return false for invalid inputs', () => {
            const invalidInputs = [
                '',
                null,
                undefined,
                123,
                {},
                []
            ];

            invalidInputs.forEach(input => {
                expect(GuestEmailUtil.isGuestEmail(input as any)).toBe(false);
            });
        });

        it('should handle case insensitive emails', () => {
            const emails = [
                'GUEST_123@CHECKOUT.GUEST',
                'Guest_456@Checkout.Guest',
                'gUeSt_789@ChEcKoUt.GuEsT'
            ];

            emails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(true);
            });
        });

        it('should handle emails with extra whitespace', () => {
            const emails = [
                '  guest_123@checkout.guest  ',
                '\tguest_456@checkout.guest\t',
                '\n guest_789@checkout.guest \n'
            ];

            emails.forEach(email => {
                expect(GuestEmailUtil.isGuestEmail(email)).toBe(true);
            });
        });
    });

    describe('isValidRegisteredUserEmail', () => {
        it('should return true for regular user emails', () => {
            const regularEmails = [
                'user@example.com',
                'test@gmail.com',
                'customer@company.com'
            ];

            regularEmails.forEach(email => {
                expect(GuestEmailUtil.isValidRegisteredUserEmail(email)).toBe(true);
            });
        });

        it('should return false for guest emails', () => {
            const guestEmails = [
                'guest_123@checkout.guest',
                'guest_456@example.com'
            ];

            guestEmails.forEach(email => {
                expect(GuestEmailUtil.isValidRegisteredUserEmail(email)).toBe(false);
            });
        });
    });

    describe('analyzeEmail', () => {
        it('should correctly analyze guest emails', () => {
            const guestEmail = 'guest_123456_789012_345678_abc123@checkout.guest';
            const result = GuestEmailUtil.analyzeEmail(guestEmail);

            expect(result.isGuest).toBe(true);
            expect(result.isRegistered).toBe(false);
            expect(result.pattern).toBe('checkout.guest');
        });

        it('should correctly analyze regular emails', () => {
            const regularEmail = 'user@example.com';
            const result = GuestEmailUtil.analyzeEmail(regularEmail);

            expect(result.isGuest).toBe(false);
            expect(result.isRegistered).toBe(true);
            expect(result.pattern).toBeUndefined();
        });

        it('should identify different guest patterns', () => {
            const testCases = [
                {
                    email: 'guest_123@checkout.guest',
                    expectedPattern: 'checkout.guest'
                },
                {
                    email: 'guest_456@example.com',
                    expectedPattern: 'guest_prefix'
                }
            ];

            testCases.forEach(({ email, expectedPattern }) => {
                const result = GuestEmailUtil.analyzeEmail(email);
                expect(result.isGuest).toBe(true);
                expect(result.pattern).toBe(expectedPattern);
            });
        });
    });
});
