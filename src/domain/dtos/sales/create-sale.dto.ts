// src/domain/dtos/sales/create-sale.dto.ts
import mongoose from "mongoose";

import mongoose from "mongoose";
import { CreateAddressDto } from "../customers/create-address.dto";
import { CreateCustomerDto } from "../customers/create-customer.dto";

export class CreateSaleDto {
    private constructor(
        public customerId: string | null, // Optional for guest users
        public items: Array<{
            productId: string,
            quantity: number,
            unitPrice: number
        }>,
        public taxRate: number = 21,
        public discountRate: number = 0,
        public notes: string = "",
        public customerData?: CreateCustomerDto, // For guest users
        public shippingAddress?: CreateAddressDto // For guest users
    ) {}

    static create(object: { [key: string]: any }): [string?, CreateSaleDto?] {
        const { 
            customerId, 
            items, 
            taxRate = 21, 
            discountRate = 0, 
            notes = "",
            customerData,
            shippingAddress
        } = object;

        let customerIdValidated: string | null = null;
        let customerDataValidated: CreateCustomerDto | undefined = undefined;
        let shippingAddressValidated: CreateAddressDto | undefined = undefined;

        // Validate customerId OR customerData + shippingAddress
        if (customerId) {
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                return ["customerId debe ser un id válido para MongoDB", undefined];
            }
            customerIdValidated = customerId;
        } else {
            // If no customerId, then customerData and shippingAddress are required
            if (!customerData) {
                return ["customerData es requerido para usuarios invitados", undefined];
            }
            if (!shippingAddress) {
                return ["shippingAddress es requerido para usuarios invitados", undefined];
            }

            const [customerError, customerDto] = CreateCustomerDto.create(customerData);
            if (customerError) {
                return [`Error en customerData: ${customerError}`, undefined];
            }
            customerDataValidated = customerDto;

            const [addressError, addressDto] = CreateAddressDto.create(shippingAddress);
            if (addressError) {
                return [`Error en shippingAddress: ${addressError}`, undefined];
            }
            shippingAddressValidated = addressDto;
        }

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return ["items debe ser un array no vacío", undefined];
        }

        // Validate each item
        for (const item of items) {
            if (!item.productId) {
                return ["productId es requerido para cada item", undefined];
            }
            if (!mongoose.Types.ObjectId.isValid(item.productId)) {
                return ["productId debe ser un id válido para MongoDB", undefined];
            }
            if (item.quantity === undefined || item.quantity < 1) {
                return ["quantity debe ser un número mayor a 0", undefined];
            }
            if (item.unitPrice === undefined || item.unitPrice < 0) {
                return ["unitPrice debe ser un número no negativo", undefined];
            }
        }
        
        // Validate taxRate and discountRate
        if (taxRate < 0 || taxRate > 100) {
            return ["taxRate debe estar entre 0 y 100", undefined];
        }
        
        if (discountRate < 0 || discountRate > 100) {
            return ["discountRate debe estar entre 0 y 100", undefined];
        }

        return [
            undefined, 
            new CreateSaleDto(
                customerIdValidated,
                items,
                taxRate,
                discountRate,
                notes,
                customerDataValidated,
                shippingAddressValidated
            )
        ];
    }
}
