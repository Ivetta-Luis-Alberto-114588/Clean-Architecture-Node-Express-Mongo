// src/domain/dtos/customers/create-address.dto.ts
import mongoose from "mongoose"; // Necesario para validar ObjectId

export class CreateAddressDto {
    private constructor(
        public customerId: string, // Se asignará en el UseCase
        public recipientName: string,
        public phone: string,
        public streetAddress: string,
        public postalCode?: string,
        public neighborhoodId?: string, // Aceptamos el ID aquí
        public cityId?: string,       // Aceptamos ID aquí (se derivará si no se da)
        public additionalInfo?: string,
        public isDefault?: boolean,
        public alias?: string,
        // Añadido para uso interno si se selecciona un barrio
        public selectedNeighborhoodId?: string
    ) { }

    static create(props: { [key: string]: any }, customerId: string): [string?, CreateAddressDto?] {
        const {
            recipientName, phone, streetAddress, postalCode,
            neighborhoodId, cityId, // Mantener por si vienen del body
            additionalInfo, isDefault = false, alias,
            selectedNeighborhoodId // Campo preferido para selección
        } = props;

        // Validaciones
        if (!customerId) return ['customerId es requerido (interno)', undefined];
        if (!recipientName) return ['Nombre del destinatario es requerido', undefined];
        if (!phone) return ['Teléfono es requerido', undefined];
        if (!/^\+?[\d\s-]{8,15}$/.test(phone)) return ['Teléfono inválido', undefined];
        if (!streetAddress) return ['Dirección (calle y número) es requerida', undefined];

        // Usar selectedNeighborhoodId si existe, sino neighborhoodId
        const finalNeighborhoodId = selectedNeighborhoodId || neighborhoodId;
        if (!finalNeighborhoodId) {
            return ['Se requiere ID de barrio (neighborhoodId o selectedNeighborhoodId)', undefined];
        }
        if (!mongoose.Types.ObjectId.isValid(finalNeighborhoodId)) {
            return ['ID de Barrio inválido', undefined];
        }
        // cityId es opcional aquí, se derivará en el backend si falta
        let finalCityId = cityId;
        if (finalCityId && !mongoose.Types.ObjectId.isValid(finalCityId)) {
            return ['ID de Ciudad inválido (si se proporciona)', undefined];
        }

        if (postalCode && typeof postalCode !== 'string') return ['Código Postal debe ser texto', undefined];
        if (additionalInfo && typeof additionalInfo !== 'string') return ['Información adicional debe ser texto', undefined];
        if (typeof isDefault !== 'boolean') return ['isDefault debe ser booleano', undefined];
        if (alias && typeof alias !== 'string') return ['Alias debe ser texto', undefined];

        return [undefined, new CreateAddressDto(
            customerId,
            recipientName.trim(),
            phone.trim(),
            streetAddress.trim(),
            postalCode?.trim(),
            finalNeighborhoodId, // Pasar el ID final del barrio
            finalCityId,         // Pasar el ID de ciudad (puede ser undefined)
            additionalInfo?.trim(),
            isDefault,
            alias?.trim(),
            finalNeighborhoodId  // Pasar el ID seleccionado para uso interno si es necesario
        )];
    }
}