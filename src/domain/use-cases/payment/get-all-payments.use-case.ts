import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { PaymentEntity } from "../../entities/payment/payment.entity";
import { CustomError } from "../../errors/custom.error";
import { PaymentRepository } from "../../repositories/payment/payment.repository";

interface IGetAllPaymentsUseCase {
  execute(paginationDto: PaginationDto): Promise<PaymentEntity[]>;
}

export class GetAllPaymentsUseCase implements IGetAllPaymentsUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    try {
      const payments = await this.paymentRepository.getAllPayments(paginationDto);
      return payments;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener todos los pagos: ${error}`);
    }
  }
}