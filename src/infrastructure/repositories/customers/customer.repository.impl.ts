// src/infrastructure/repositories/customers/customer.repository.impl.ts
import { CustomerDataSource } from "../../../domain/datasources/customers/customer.datasource";
import { CreateCustomerDto } from "../../../domain/dtos/customers/create-customer.dto";
import { UpdateCustomerDto } from "../../../domain/dtos/customers/update-customer.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { CustomerRepository } from "../../../domain/repositories/customers/customer.repository";
import { AddressEntity } from "../../../domain/entities/customers/address.entity"; // <<<--- NUEVO
import { CreateAddressDto } from "../../../domain/dtos/customers/create-address.dto"; // <<<--- NUEVO
import { UpdateAddressDto } from "../../../domain/dtos/customers/update-address.dto"; // <<<--- NUEVO

export class CustomerRepositoryImpl implements CustomerRepository {

    constructor(private readonly customerDataSource: CustomerDataSource) { }

    // --- Métodos Customer (delegados) ---
    create(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity> {
        return this.customerDataSource.create(createCustomerDto);
    }
    getAll(paginationDto: PaginationDto): Promise<CustomerEntity[]> {
        return this.customerDataSource.getAll(paginationDto);
    }
    findById(id: string): Promise<CustomerEntity> {
        return this.customerDataSource.findById(id);
    }
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerEntity> {
        return this.customerDataSource.update(id, updateCustomerDto);
    }
    delete(id: string): Promise<CustomerEntity> {
        return this.customerDataSource.delete(id);
    }
    findByEmail(email: string): Promise<CustomerEntity | null> {
        return this.customerDataSource.findByEmail(email);
    }
    findByNeighborhood(neighborhoodId: string, paginationDto: PaginationDto): Promise<CustomerEntity[]> {
        return this.customerDataSource.findByNeighborhood(neighborhoodId, paginationDto);
    }
    findByUserId(userId: string): Promise<CustomerEntity | null> {
        return this.customerDataSource.findByUserId(userId);
    }

    // <<<--- NUEVOS MÉTODOS ADDRESS (delegados) --- >>>
    createAddress(createAddressDto: CreateAddressDto): Promise<AddressEntity> {
        return this.customerDataSource.createAddress(createAddressDto);
    }
    getAddressesByCustomerId(customerId: string, paginationDto: PaginationDto): Promise<AddressEntity[]> {
        return this.customerDataSource.getAddressesByCustomerId(customerId, paginationDto);
    }
    findAddressById(addressId: string): Promise<AddressEntity | null> {
        return this.customerDataSource.findAddressById(addressId);
    }
    updateAddress(addressId: string, updateAddressDto: UpdateAddressDto): Promise<AddressEntity | null> {
        return this.customerDataSource.updateAddress(addressId, updateAddressDto);
    }
    deleteAddress(addressId: string, customerId: string): Promise<AddressEntity | null> {
        return this.customerDataSource.deleteAddress(addressId, customerId);
    }
    setDefaultAddress(addressId: string, customerId: string): Promise<boolean> {
        return this.customerDataSource.setDefaultAddress(addressId, customerId);
    }
    // <<<--- FIN NUEVOS MÉTODOS ADDRESS --- >>>
}