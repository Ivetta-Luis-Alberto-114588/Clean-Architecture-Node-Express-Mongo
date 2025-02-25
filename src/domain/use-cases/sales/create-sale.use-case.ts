import { CreateSaleDto } from "../../dtos/sales/create-sale.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { ProductRepository } from "../../repositories/products/product.repository";
import { SaleRepository } from "../../repositories/sales/sale.repository";

interface ICreateSaleUseCase {
    execute(createSaleDto: CreateSaleDto): Promise<SaleEntity>;
}

export class CreateSaleUseCase implements ICreateSaleUseCase {
    constructor(
        private readonly saleRepository: SaleRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly productRepository: ProductRepository
    ) {}
    
    async execute(createSaleDto: CreateSaleDto): Promise<SaleEntity> {
        try {
            // Verificar que el cliente exista
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
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError(`Error al crear la venta: ${error}`);
        }
    }
}