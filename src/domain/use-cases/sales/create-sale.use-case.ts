// src/domain/use-cases/sales/create-sale.use-case.ts
import { CreateSaleDto } from "../../dtos/sales/create-sale.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";
import { SaleRepository } from "../../repositories/sales/sale.repository";
// Update the import path below if the actual file or folder name differs (e.g., 'customers' instead of 'customer')
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { ProductRepository } from "../../repositories/products/product.repository";
import { CustomError } from "../../errors/custom.error";

export interface CreateSaleUseCase {
    execute(createSaleDto: CreateSaleDto): Promise<SaleEntity>;
}

export class CreateSaleUseCaseImpl implements CreateSaleUseCase {

    constructor(
        private readonly saleRepository: SaleRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly productRepository: ProductRepository
    ) { }

    async execute(createSaleDto: CreateSaleDto): Promise<SaleEntity> {
        // Verificar que el cliente existe
        const customer = await this.customerRepository.findById(createSaleDto.customerId);
        if (!customer) {
            throw CustomError.notFound(`Cliente con ID ${createSaleDto.customerId} no encontrado`);
        }

        // Verificar cada producto y que tenga stock suficiente
        for (const item of createSaleDto.items) {
            const product = await this.productRepository.findById(item.productId);
            if (!product) {
                throw CustomError.notFound(`Producto con ID ${item.productId} no encontrado`);
            }

            if (product.stock < item.quantity) {
                throw CustomError.badRequest(`Stock insuficiente para el producto ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
            }
        }

        // Crear la venta
        return await this.saleRepository.create(createSaleDto);
    }
}
