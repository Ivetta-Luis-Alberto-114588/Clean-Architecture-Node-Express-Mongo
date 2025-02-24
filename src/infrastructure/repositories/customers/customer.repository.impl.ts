// src/infrastructure/repositories/customers/customer.repository.impl.ts
import { CustomerDataSource } from "../../../domain/datasources/customers/customer.datasource";
import { CreateCustomerDto } from "../../../domain/dtos/customers/create-customer.dto";
import { UpdateCustomerDto } from "../../../domain/dtos/customers/update-customer.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { CustomerRepository } from "../../../domain/repositories/customers/customer.repository";

export class CustomerRepositoryImpl implements CustomerRepository {
    
    constructor(private readonly customerDataSource: CustomerDataSource) {}
    
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
}