import { CustomerEntity } from "../../entities/customers/customer";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { SearchCustomersDto } from "../../dtos/customers/search-customers.dto";

export interface SearchCustomersUseCase {
    execute(searchCustomersDto: SearchCustomersDto): Promise<{ total: number; customers: CustomerEntity[] }>;
}

export class SearchCustomersUseCaseImpl implements SearchCustomersUseCase {
    constructor(private readonly customerRepository: CustomerRepository) { }

    async execute(searchCustomersDto: SearchCustomersDto): Promise<{ total: number; customers: CustomerEntity[] }> {
        try {
            const result = await this.customerRepository.searchCustomers(searchCustomersDto);
            return {
                total: result.total,
                customers: result.customers
            };
        } catch (error) {
            throw error;
        }
    }
}
