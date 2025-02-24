import { CreateCustomerDto } from "../../dtos/customers/create-customer.dto";
import { UpdateCustomerDto } from "../../dtos/customers/update-customer.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CustomerEntity } from "../../entities/customers/customer";

export abstract class CustomerDataSource {
    abstract create(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<CustomerEntity[]>;
    abstract findById(id: string): Promise<CustomerEntity>;
    abstract update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerEntity>;
    abstract delete(id: string): Promise<CustomerEntity>;
    abstract findByEmail(email: string): Promise<CustomerEntity | null>;
    abstract findByNeighborhood(neighborhoodId: string, paginationDto: PaginationDto): Promise<CustomerEntity[]>;
}