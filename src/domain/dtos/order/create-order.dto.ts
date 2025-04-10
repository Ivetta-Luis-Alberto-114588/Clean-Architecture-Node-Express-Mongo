// src/domain/dtos/order/create-order.dto.ts
import { Validators } from "../../../configs/validator"; // Asegúrate de importar Validators

export class CreateOrderDto {
    private constructor(
        // --- Datos del Pedido ---
        public items: Array<{
            productId: string,
            quantity: number,
            unitPrice: number // <<<--- PRECIO CON IVA
        }>,
        public notes?: string,
        public couponCode?: string, // Código para validación inicial

        // --- Datos del Cliente (Opcionales - para invitados o primer pedido de usuario) ---
        public customerId?: string | null, // ID si el cliente ya existe (registrado o invitado previo)
        public customerName?: string,
        public customerEmail?: string,
        public customerPhone?: string,
        public customerAddress?: string,
        public customerNeighborhoodId?: string,

        // --- Tasa de descuento (calculada en UseCase, no viene de la request) ---
        // public discountRate?: number // Lo quitamos, se calcula internamente
    ) { }

    static create(object: { [key: string]: any }, userId?: string): [string?, CreateOrderDto?] {
        const {
            items, notes = "", couponCode,
            // Datos del cliente (pueden venir si es invitado)
            customerId, // Puede venir si se selecciona un cliente existente (admin) o si es un invitado recurrente
            customerName, customerEmail, customerPhone, customerAddress, customerNeighborhoodId
        } = object;

        // --- Validaciones del Pedido ---
        if (!items || !Array.isArray(items) || items.length === 0) {
            return ["items debe ser un array no vacío", undefined];
        }
        for (const item of items) {
            // ... (validaciones de items existentes) ...
            if (!item.productId || !/^[0-9a-fA-F]{24}$/.test(item.productId)) {
                return ["productId debe ser un id válido para MongoDB para cada item", undefined];
            }
            if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity < 1) {
                return ["quantity debe ser un número entero mayor a 0", undefined];
            }
            if (item.unitPrice === undefined || typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
                return ["unitPrice (con IVA) debe ser un número no negativo", undefined];
            }
        }
        if (couponCode && typeof couponCode !== 'string') {
            return ["couponCode debe ser un string", undefined];
        }

        // --- Validaciones del Cliente (SI NO HAY USUARIO AUTENTICADO) ---
        let finalCustomerId = customerId || null; // Usar el ID si viene
        let finalCustomerName = customerName;
        let finalCustomerEmail = customerEmail;
        let finalCustomerPhone = customerPhone;
        let finalCustomerAddress = customerAddress;
        let finalCustomerNeighborhoodId = customerNeighborhoodId;

        if (!userId) { // Si NO es un usuario autenticado (invitado)
            if (!finalCustomerId) { // Si es un invitado NUEVO (no viene ID)
                if (!customerName) return ["Nombre del cliente requerido para invitados", undefined];
                if (!customerEmail) return ["Email del cliente requerido para invitados", undefined];
                if (!Validators.checkEmail.test(customerEmail)) return ["Email del cliente inválido", undefined];
                if (!customerPhone) return ["Teléfono del cliente requerido para invitados", undefined];
                if (!/^\+?[\d\s-]{8,15}$/.test(customerPhone)) return ["Teléfono del cliente inválido", undefined];
                if (!customerAddress) return ["Dirección del cliente requerida para invitados", undefined];
                if (!customerNeighborhoodId) return ["Barrio del cliente requerido para invitados", undefined];
                if (!/^[0-9a-fA-F]{24}$/.test(customerNeighborhoodId)) return ["ID de Barrio inválido", undefined];

                // Sanitizar datos del invitado
                finalCustomerName = customerName.trim();
                finalCustomerEmail = customerEmail.trim().toLowerCase();
                finalCustomerPhone = customerPhone.trim();
                finalCustomerAddress = customerAddress.trim();
                finalCustomerNeighborhoodId = customerNeighborhoodId; // Ya validado
            }
            // Si es invitado pero viene customerId, confiamos en que el UseCase lo validará/usará.
        } else {
            // Si es usuario autenticado, ignoramos los datos de cliente del body
            // El UseCase se encargará de buscar/crear el Customer asociado al userId.
            finalCustomerName = undefined;
            finalCustomerEmail = undefined;
            finalCustomerPhone = undefined;
            finalCustomerAddress = undefined;
            finalCustomerNeighborhoodId = undefined;
            // El customerId se determinará en el UseCase
            finalCustomerId = null; // Forzar a null para que el UseCase lo busque/cree
        }


        return [
            undefined,
            new CreateOrderDto(
                items,
                notes,
                couponCode,
                finalCustomerId, // Puede ser null
                finalCustomerName,
                finalCustomerEmail,
                finalCustomerPhone,
                finalCustomerAddress,
                finalCustomerNeighborhoodId
            )
        ];
    }
}