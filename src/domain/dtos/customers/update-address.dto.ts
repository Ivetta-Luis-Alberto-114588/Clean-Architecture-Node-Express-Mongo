// src/domain/dtos/customers/update-address.dto.ts
import mongoose from "mongoose";

export class UpdateAddressDto {
    private constructor(
        // No incluimos customerId, no se puede cambiar
        public recipientName?: string,
        public phone?: string,
        public streetAddress?: string,
        public postalCode?: string | null, // Permitir null para borrar
        public neighborhoodId?: string,
        public cityId?: string,          // Permitir cambio explícito de ciudad (validar en use case)
        public additionalInfo?: string | null, // Permitir null para borrar
        public isDefault?: boolean,
        public alias?: string | null // Permitir null para borrar
    ) { }

    static create(props: { [key: string]: any }): [string?, UpdateAddressDto?] {
        const {
            recipientName, phone, streetAddress, postalCode,
            neighborhoodId, cityId, additionalInfo, isDefault, alias
        } = props;

        if (Object.keys(props).length === 0) {
            return ['Debe proporcionar al menos un campo para actualizar', undefined];
        }

        const updateData: Partial<UpdateAddressDto> = {};

        // Validaciones individuales si el campo está presente
        if (recipientName !== undefined) {
            if (typeof recipientName !== 'string' || recipientName.trim().length === 0) return ['Nombre del destinatario inválido', undefined];
            updateData.recipientName = recipientName.trim();
        }
        if (phone !== undefined) {
            if (!/^\+?[\d\s-]{8,15}$/.test(phone)) return ['Teléfono inválido', undefined];
            updateData.phone = phone.trim();
        }
        if (streetAddress !== undefined) {
            if (typeof streetAddress !== 'string' || streetAddress.trim().length === 0) return ['Dirección inválida', undefined];
            updateData.streetAddress = streetAddress.trim();
        }

        if (neighborhoodId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(neighborhoodId)) return ['ID de Barrio inválido', undefined];
            updateData.neighborhoodId = neighborhoodId;
        }
        if (cityId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(cityId)) return ['ID de Ciudad inválido', undefined];
            updateData.cityId = cityId;
        }

        // Campos que pueden ser null para borrar
        if ('postalCode' in props) {
            if (postalCode !== null && typeof postalCode !== 'string') return ['Código Postal debe ser texto o null', undefined];
            updateData.postalCode = postalCode ? postalCode.trim() : null;
        }
        if ('additionalInfo' in props) {
            if (additionalInfo !== null && typeof additionalInfo !== 'string') return ['Información adicional debe ser texto o null', undefined];
            updateData.additionalInfo = additionalInfo ? additionalInfo.trim() : null;
        }
        if ('alias' in props) {
            if (alias !== null && typeof alias !== 'string') return ['Alias debe ser texto o null', undefined];
            updateData.alias = alias ? alias.trim() : null;
        }

        if (isDefault !== undefined) {
            if (typeof isDefault !== 'boolean') return ['isDefault debe ser booleano', undefined];
            updateData.isDefault = isDefault;
        }

        return [undefined, new UpdateAddressDto(
            updateData.recipientName,
            updateData.phone,
            updateData.streetAddress,
            updateData.postalCode,
            updateData.neighborhoodId,
            updateData.cityId,
            updateData.additionalInfo,
            updateData.isDefault,
            updateData.alias
        )];
    }
}