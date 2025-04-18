// src/domain/dtos/order/create-order.dto.ts
import { Validators } from "../../../configs/validator";
import mongoose from "mongoose";

export class CreateOrderDto {
    private constructor(
        // --- Datos del Pedido ---
        public items: Array<{ productId: string, quantity: number, unitPrice: number }>,
        public notes?: string,
        public couponCode?: string,

        // --- Dirección de Envío ---
        public selectedAddressId?: string | null,
        public shippingRecipientName?: string,
        public shippingPhone?: string,
        public shippingStreetAddress?: string,
        public shippingPostalCode?: string,
        public shippingNeighborhoodId?: string,
        public shippingCityId?: string, // Podría obtenerse del barrio
        public shippingAdditionalInfo?: string,

        // --- Datos del Cliente (SOLO para invitados NUEVOS) ---
        public customerId?: string | null, // ID si el invitado ya existe
        public customerName?: string,
        public customerEmail?: string,

    ) { }

    static create(object: { [key: string]: any }, userId?: string): [string?, CreateOrderDto?] {

        console.log('CreateOrderDto - Received userId:', userId); // <-- AÑADIR LOG
        console.log('CreateOrderDto - Received object keys:', Object.keys(object))

        const {
            items, notes = "", couponCode,
            selectedAddressId,
            shippingRecipientName, shippingPhone, shippingStreetAddress, shippingPostalCode,
            shippingNeighborhoodId, shippingCityId, shippingAdditionalInfo,
            customerId, customerName, customerEmail,
        } = object;

        // --- Validaciones Pedido ---
        if (!items || !Array.isArray(items) || items.length === 0) return ["items debe ser un array no vacío"];
        for (const item of items) {
            if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) return [`productId inválido para item ${item.productId}`];
            if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity < 1) return [`quantity inválida para item ${item.productId}`];
            if (item.unitPrice === undefined || typeof item.unitPrice !== 'number' || item.unitPrice < 0) return [`unitPrice inválido para item ${item.productId}`];
        }
        if (couponCode && typeof couponCode !== 'string') return ["couponCode debe ser un string"];

        // --- Validaciones Dirección y Cliente ---
        let finalCustomerId = customerId || null;
        let finalCustomerName = customerName;
        let finalCustomerEmail = customerEmail;
        let finalSelectedAddressId = selectedAddressId || null;
        let finalShippingRecipientName = shippingRecipientName;
        let finalShippingPhone = shippingPhone;
        let finalShippingStreetAddress = shippingStreetAddress;
        let finalShippingPostalCode = shippingPostalCode;
        let finalShippingNeighborhoodId = shippingNeighborhoodId;
        let finalShippingCityId = shippingCityId;
        let finalShippingAdditionalInfo = shippingAdditionalInfo;

        if (userId) {
            // --- Usuario Registrado ---
            if (!finalSelectedAddressId && !finalShippingStreetAddress) return ["Debes seleccionar una dirección guardada (selectedAddressId) o ingresar una nueva dirección de envío.", undefined];
            if (finalSelectedAddressId && finalShippingStreetAddress) return ["No puedes seleccionar una dirección guardada y proporcionar una nueva al mismo tiempo.", undefined];
            if (finalSelectedAddressId && !mongoose.Types.ObjectId.isValid(finalSelectedAddressId)) return ["ID de dirección seleccionada inválido.", undefined];

            if (!finalSelectedAddressId && finalShippingStreetAddress) { // Si proporciona nueva dirección
                if (!finalShippingRecipientName) return ["Nombre del destinatario requerido para nueva dirección", undefined];
                if (!finalShippingPhone) return ["Teléfono de envío requerido para nueva dirección", undefined];
                if (!/^\+?[\d\s-]{8,15}$/.test(finalShippingPhone)) return ['Teléfono de envío inválido', undefined];
                if (!finalShippingStreetAddress) return ["Calle y número de envío requeridos", undefined];
                if (!finalShippingNeighborhoodId) return ["Barrio de envío requerido", undefined];
                if (!mongoose.Types.ObjectId.isValid(finalShippingNeighborhoodId)) return ["ID de Barrio de envío inválido", undefined];
                if (finalShippingCityId && !mongoose.Types.ObjectId.isValid(finalShippingCityId)) return ["ID de Ciudad de envío inválido", undefined];
                // Sanitizar datos de envío nuevos
                finalShippingRecipientName = finalShippingRecipientName.trim();
                finalShippingPhone = finalShippingPhone.trim();
                finalShippingStreetAddress = finalShippingStreetAddress.trim();
                finalShippingPostalCode = finalShippingPostalCode?.trim();
                finalShippingAdditionalInfo = finalShippingAdditionalInfo?.trim();
            } else if (finalSelectedAddressId) {
                // Si seleccionó una, limpiar los campos de envío nuevos
                finalShippingRecipientName = undefined;
                finalShippingPhone = undefined;
                finalShippingStreetAddress = undefined;
                finalShippingPostalCode = undefined;
                finalShippingNeighborhoodId = undefined;
                finalShippingCityId = undefined;
                finalShippingAdditionalInfo = undefined;
            }
            // Ignorar datos de cliente del body
            finalCustomerName = undefined;
            finalCustomerEmail = undefined;
            finalCustomerId = null;

        } else {
            // --- Usuario Invitado ---
            if (finalSelectedAddressId) return ["Invitados no pueden seleccionar direcciones guardadas", undefined];
            if (!finalShippingRecipientName) return ["Nombre del destinatario requerido para invitados", undefined];
            if (!finalShippingPhone) return ["Teléfono de envío requerido para invitados", undefined];
            if (!/^\+?[\d\s-]{8,15}$/.test(finalShippingPhone)) return ['Teléfono de envío inválido', undefined];
            if (!finalShippingStreetAddress) return ["Calle y número de envío requeridos para invitados", undefined];
            if (!finalShippingNeighborhoodId) return ["Barrio de envío requerido para invitados", undefined];
            if (!mongoose.Types.ObjectId.isValid(finalShippingNeighborhoodId)) return ["ID de Barrio de envío inválido", undefined];
            if (finalShippingCityId && !mongoose.Types.ObjectId.isValid(finalShippingCityId)) return ["ID de Ciudad de envío inválido", undefined];

            if (!finalCustomerName) return ["Nombre del cliente requerido para invitados", undefined];
            if (!finalCustomerEmail) return ["Email del cliente requerido para invitados", undefined];
            if (!Validators.checkEmail.test(finalCustomerEmail)) return ["Email del cliente inválido", undefined];

            // Sanitizar datos del invitado y envío
            finalCustomerName = finalCustomerName.trim();
            finalCustomerEmail = finalCustomerEmail.trim().toLowerCase();
            finalShippingRecipientName = finalShippingRecipientName.trim();
            finalShippingPhone = finalShippingPhone.trim();
            finalShippingStreetAddress = finalShippingStreetAddress.trim();
            finalShippingPostalCode = finalShippingPostalCode?.trim();
            finalShippingAdditionalInfo = finalShippingAdditionalInfo?.trim();
        }

        return [
            undefined,
            new CreateOrderDto(
                items, notes, couponCode,
                finalSelectedAddressId,
                finalShippingRecipientName, finalShippingPhone, finalShippingStreetAddress,
                finalShippingPostalCode, finalShippingNeighborhoodId, finalShippingCityId, finalShippingAdditionalInfo,
                finalCustomerId, finalCustomerName, finalCustomerEmail
            )
        ];
    }
}