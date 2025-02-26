
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { PaymentEntity } from "../../entities/payment/payment.entity";
import { CustomError } from "../../errors/custom.error";
import { PaymentRepository } from "../../repositories/payment/payment.repository";
import { SaleRepository } from "../../repositories/sales/sale.repository";

interface IGetPaymentBySaleUseCase {
  execute(saleId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]>;
}

export class GetPaymentBySaleUseCase implements IGetPaymentBySaleUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly saleRepository: SaleRepository
  ) {}

  async execute(saleId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    try {
      // Verificar que exista la venta
      const sale = await this.saleRepository.findById(saleId);
      if (!sale) {
        throw CustomError.notFound(`Venta con ID ${saleId} no encontrada`);
      }

      // Obtener los pagos de la venta
      const payments = await this.paymentRepository.getPaymentsBySaleId(saleId, paginationDto);
      return payments;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener los pagos de la venta: ${error}`);
    }
  }
}