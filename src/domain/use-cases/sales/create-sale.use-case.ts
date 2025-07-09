// src/domain/use-cases/sales/create-sale.use-case.ts
import { CreateSaleDto } from "../../dtos/sales/create-sale.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";
import { SaleRepository } from "../../repositories/sales/sale.repository";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { ProductRepository } from "../../repositories/products/product.repository";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";
import { CustomError } from "../../errors/custom.error";
import { CustomerEntity } from "../../entities/customers/customer";

export interface CreateSaleUseCase {
    execute(createSaleDto: CreateSaleDto): Promise<SaleEntity>;
}

export class CreateSaleUseCaseImpl implements CreateSaleUseCase {

    constructor(
        private readonly saleRepository: SaleRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly productRepository: ProductRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository
    ) { }

    async execute(createSaleDto: CreateSaleDto): Promise<SaleEntity> {
        let customer: CustomerEntity | null = null;

        if (createSaleDto.customerId) {
            // Existing customer
            customer = await this.customerRepository.findById(createSaleDto.customerId);
            if (!customer) {
                throw CustomError.notFound(`Cliente con ID ${createSaleDto.customerId} no encontrado`);
            }
        } else if (createSaleDto.customerData && createSaleDto.shippingAddress) {
            // Guest user: create new customer and address
            const { customerData, shippingAddress } = createSaleDto;

            // Validate neighborhood exists for the shipping address
            const neighborhood = await this.neighborhoodRepository.findById(shippingAddress.neighborhoodId);
            if (!neighborhood) {
                throw CustomError.badRequest(`Barrio con ID ${shippingAddress.neighborhoodId} no encontrado para la dirección de envío.`);
            }

            // Create customer
            customer = await this.customerRepository.create(customerData);
            if (!customer) {
                throw CustomError.internalServerError("Error al crear el cliente para el usuario invitado.");
            }

            // Create address and link to customer
            const createdAddress = await this.customerRepository.createAddress({
                ...shippingAddress,
                customerId: customer.id // Link address to newly created customer
            });

            if (!createdAddress) {
                throw CustomError.internalServerError("Error al crear la dirección para el usuario invitado.");
            }

            // Update the DTO with the new customer's ID
            createSaleDto.customerId = customer.id;

        } else {
            throw CustomError.badRequest("Debe proporcionar customerId o customerData y shippingAddress.");
        }

        // Verify products and stock
        for (const item of createSaleDto.items) {
            const product = await this.productRepository.findById(item.productId);
            if (!product) {
                throw CustomError.notFound(`Producto con ID ${item.productId} no encontrado`);
            }

            if (product.stock < item.quantity) {
                throw CustomError.badRequest(`Stock insuficiente para el producto ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
            }
        }

        // Create the sale
        return await this.saleRepository.create(createSaleDto);
    }
}
