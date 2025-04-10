// src/domain/repositories/customers/customer.repository.ts
import { CreateCustomerDto } from "../../dtos/customers/create-customer.dto";
import { UpdateCustomerDto } from "../../dtos/customers/update-customer.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CustomerEntity } from "../../entities/customers/customer";
import { AddressEntity } from "../../entities/customers/address.entity"; // <<<--- NUEVO
import { CreateAddressDto } from "../../dtos/customers/create-address.dto"; // <<<--- NUEVO
import { UpdateAddressDto } from "../../dtos/customers/update-address.dto"; // <<<--- NUEVO

export abstract class CustomerRepository {
    // --- Customer ---
    abstract create(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<CustomerEntity[]>;
    abstract findById(id: string): Promise<CustomerEntity>;
    abstract update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerEntity>;
    abstract delete(id: string): Promise<CustomerEntity>;
    abstract findByEmail(email: string): Promise<CustomerEntity | null>;
    abstract findByNeighborhood(neighborhoodId: string, paginationDto: PaginationDto): Promise<CustomerEntity[]>;
    abstract findByUserId(userId: string): Promise<CustomerEntity | null>;

    // <<<--- NUEVOS MÉTODOS ADDRESS --- >>>
    abstract createAddress(createAddressDto: CreateAddressDto): Promise<AddressEntity>;
    abstract getAddressesByCustomerId(customerId: string, paginationDto: PaginationDto): Promise<AddressEntity[]>;
    abstract findAddressById(addressId: string): Promise<AddressEntity | null>;
    abstract updateAddress(addressId: string, updateAddressDto: UpdateAddressDto): Promise<AddressEntity | null>;
    abstract deleteAddress(addressId: string, customerId: string): Promise<AddressEntity | null>;
    abstract setDefaultAddress(addressId: string, customerId: string): Promise<boolean>;
    // <<<--- FIN NUEVOS MÉTODOS ADDRESS --- >>>
}