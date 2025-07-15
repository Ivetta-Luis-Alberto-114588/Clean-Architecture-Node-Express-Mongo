// src/domain/utils/guest-email.util.ts

/**
 * Utilidad para detectar emails generados automáticamente para invitados
 */
export class GuestEmailUtil {

    /**
     * Detecta si un email es de un invitado generado automáticamente
     * @param email - Email a validar
     * @returns true si es un email de invitado, false si no
     */
    static isGuestEmail(email: string): boolean {
        if (!email || typeof email !== 'string') {
            return false;
        }

        // Convertir a lowercase para comparación case-insensitive
        const lowerEmail = email.toLowerCase().trim();

        // Detectar patrones de emails de invitados
        const guestPatterns = [
            // Patrón principal: guest_[timestamp]_[random]_[random]_[random]@checkout.guest
            /^guest_\d+_\d+_\d+_[a-z0-9]+@checkout\.guest$/,

            // Patrones adicionales para flexibilidad futura
            /@checkout\.guest$/,
            /^guest_.*@/,
            /^temp_guest_/,
            /^anonymous_guest_/
        ];

        return guestPatterns.some(pattern => pattern.test(lowerEmail));
    }

    /**
     * Valida si un email es válido para un usuario registrado (no es de invitado)
     * @param email - Email a validar
     * @returns true si es válido para usuario registrado, false si es de invitado
     */
    static isValidRegisteredUserEmail(email: string): boolean {
        return !this.isGuestEmail(email);
    }

    /**
     * Genera información sobre el tipo de email
     * @param email - Email a analizar
     * @returns objeto con información del email
     */
    static analyzeEmail(email: string): {
        isGuest: boolean;
        isRegistered: boolean;
        pattern?: string;
    } {
        const isGuest = this.isGuestEmail(email);

        let pattern: string | undefined;
        if (isGuest) {
            if (email.includes('@checkout.guest')) {
                pattern = 'checkout.guest';
            } else if (email.startsWith('guest_')) {
                pattern = 'guest_prefix';
            } else {
                pattern = 'other_guest_pattern';
            }
        }

        return {
            isGuest,
            isRegistered: !isGuest,
            pattern
        };
    }
}
