// src/domain/use-cases/order/validate-order-status-transition.use-case.ts
import { CustomError } from "../../errors/custom.error";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";
import { ILogger } from "../../interfaces/logger.interface";

interface IValidateOrderStatusTransitionUseCase {
    execute(fromStatusId: string, toStatusId: string): Promise<boolean>;
}

export class ValidateOrderStatusTransitionUseCase implements IValidateOrderStatusTransitionUseCase {
    constructor(
        private readonly orderStatusRepository: OrderStatusRepository,
        private readonly logger: ILogger
    ) { }

    async execute(fromStatusId: string, toStatusId: string): Promise<boolean> {
        try {
            // Verificar que ambos estados existan
            const [fromStatus, toStatus] = await Promise.all([
                this.orderStatusRepository.findById(fromStatusId),
                this.orderStatusRepository.findById(toStatusId)
            ]);

            if (!fromStatus) {
                throw CustomError.notFound('Estado de origen no encontrado');
            }

            if (!toStatus) {
                throw CustomError.notFound('Estado de destino no encontrado');
            }

            // Verificar que el estado de destino esté activo
            if (!toStatus.isActive) {
                throw CustomError.badRequest('No se puede transicionar a un estado inactivo');
            }            // Validar la transición
            const isValidTransition = await this.orderStatusRepository.validateTransition(fromStatusId, toStatusId);

            this.logger.info(`Validación de transición ${fromStatus.code} -> ${toStatus.code}: ${isValidTransition ? 'permitida' : 'denegada'}`);
            return isValidTransition;

        } catch (error) {
            this.logger.error('Error en ValidateOrderStatusTransitionUseCase:', error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al validar transición de estado');
        }
    }
}
