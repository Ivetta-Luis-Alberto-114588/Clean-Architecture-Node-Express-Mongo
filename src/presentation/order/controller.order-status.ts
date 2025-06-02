// src/presentation/order/controller.order-status.ts
import { Request, Response } from "express";
import { CreateOrderStatusDto } from "../../domain/dtos/order/create-order-status.dto";
import { UpdateOrderStatusDataDto } from "../../domain/dtos/order/update-order-status-data.dto";
import { UpdateOrderStatusTransitionsDto } from "../../domain/dtos/order/update-order-status-transitions.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { OrderStatusRepository } from "../../domain/repositories/order/order-status.repository";
import { CreateOrderStatusUseCase } from "../../domain/use-cases/order/create-order-status.use-case";
import { GetAllOrderStatusesUseCase } from "../../domain/use-cases/order/get-all-order-statuses.use-case";
import { UpdateOrderStatusDataUseCase } from "../../domain/use-cases/order/update-order-status-data.use-case";
import { DeleteOrderStatusUseCase } from "../../domain/use-cases/order/delete-order-status.use-case";
import { ValidateOrderStatusTransitionUseCase } from "../../domain/use-cases/order/validate-order-status-transition.use-case";
import { UpdateOrderStatusTransitionsUseCaseImpl } from "../../domain/use-cases/order/update-order-status-transitions.use-case";
import logger from "../../configs/logger";

export class OrderStatusController {
    constructor(
        private readonly orderStatusRepository: OrderStatusRepository
    ) { }

    private handleError = (error: unknown, res: Response): void => {
        if (error instanceof Error) {
            logger.error(`Error en OrderStatusController: ${error.message}`, { stack: error.stack });
            res.status(500).json({ error: error.message });
        } else {
            logger.error('Error desconocido en OrderStatusController', { error });
            res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    // GET /api/order-statuses - Obtener todos los estados
    getOrderStatuses = (req: Request, res: Response): void => {
        const { page = 1, limit = 10, activeOnly = 'false' } = req.query;

        const [paginationError, paginationDto] = PaginationDto.create(+page, +limit);
        if (paginationError) {
            res.status(400).json({ error: paginationError });
            return;
        }

        const onlyActive = activeOnly === 'true';

        new GetAllOrderStatusesUseCase(this.orderStatusRepository)
            .execute(paginationDto!, onlyActive)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    // POST /api/order-statuses - Crear nuevo estado
    createOrderStatus = (req: Request, res: Response): void => {
        const [error, createOrderStatusDto] = CreateOrderStatusDto.create(req.body);

        if (error) {
            res.status(400).json({ error });
            logger.warn('Error en validación de CreateOrderStatusDto', { error, body: req.body });
            return;
        }

        new CreateOrderStatusUseCase(this.orderStatusRepository)
            .execute(createOrderStatusDto!)
            .then(data => res.status(201).json(data))
            .catch(err => this.handleError(err, res));
    };

    // GET /api/order-statuses/:id - Obtener estado por ID
    getOrderStatusById = (req: Request, res: Response): void => {
        const { id } = req.params;

        this.orderStatusRepository.findById(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    // PUT /api/order-statuses/:id - Actualizar estado
    updateOrderStatus = (req: Request, res: Response): void => {
        const { id } = req.params;

        const [error, updateOrderStatusDataDto] = UpdateOrderStatusDataDto.update(req.body);
        if (error) {
            res.status(400).json({ error });
            logger.warn(`Error en validación de UpdateOrderStatusDataDto para ID ${id}`, { error, body: req.body });
            return;
        }

        new UpdateOrderStatusDataUseCase(this.orderStatusRepository)
            .execute(id, updateOrderStatusDataDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    // DELETE /api/order-statuses/:id - Eliminar estado
    deleteOrderStatus = (req: Request, res: Response): void => {
        const { id } = req.params;

        new DeleteOrderStatusUseCase(this.orderStatusRepository)
            .execute(id)
            .then(data => res.json({ message: 'Estado eliminado exitosamente', deletedStatus: data }))
            .catch(err => this.handleError(err, res));
    };

    // GET /api/order-statuses/code/:code - Obtener estado por código
    getOrderStatusByCode = (req: Request, res: Response): void => {
        const { code } = req.params;

        this.orderStatusRepository.findByCode(code)
            .then(data => {
                if (!data) {
                    res.status(404).json({ error: 'Estado de pedido no encontrado' });
                    return;
                }
                res.json(data);
            })
            .catch(err => this.handleError(err, res));
    };

    // GET /api/order-statuses/default - Obtener estado por defecto
    getDefaultOrderStatus = (req: Request, res: Response): void => {
        this.orderStatusRepository.findDefault()
            .then(data => {
                if (!data) {
                    res.status(404).json({ error: 'No hay estado por defecto configurado' });
                    return;
                }
                res.json(data);
            })
            .catch(err => this.handleError(err, res));
    };    // GET /api/order-statuses/active - Obtener solo estados activos
    getActiveOrderStatuses = (req: Request, res: Response): void => {
        const { page = 1, limit = 10 } = req.query;

        const [paginationError, paginationDto] = PaginationDto.create(+page, +limit);
        if (paginationError) {
            res.status(400).json({ error: paginationError });
            return;
        }

        // Forzar activeOnly = true para esta ruta
        new GetAllOrderStatusesUseCase(this.orderStatusRepository)
            .execute(paginationDto!, true)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    // POST /api/order-statuses/validate-transition - Validar transición entre estados
    validateTransition = (req: Request, res: Response): void => {
        const { fromStatusId, toStatusId } = req.body;

        if (!fromStatusId || !toStatusId) {
            res.status(400).json({ error: 'Se requieren fromStatusId y toStatusId' });
            return;
        }

        new ValidateOrderStatusTransitionUseCase(this.orderStatusRepository)
            .execute(fromStatusId, toStatusId)
            .then(isValid => res.json({ isValid }))
            .catch(err => this.handleError(err, res));
    };

    // PATCH /api/order-statuses/:id/transitions - Actualizar transiciones permitidas
    updateOrderStatusTransitions = (req: Request, res: Response): void => {
        const { id } = req.params;

        const [error, updateOrderStatusTransitionsDto] = UpdateOrderStatusTransitionsDto.create(req.body);
        if (error) {
            res.status(400).json({ error });
            logger.warn(`Error en validación de UpdateOrderStatusTransitionsDto para ID ${id}`, { error, body: req.body });
            return;
        }

        new UpdateOrderStatusTransitionsUseCaseImpl(this.orderStatusRepository)
            .execute(id, updateOrderStatusTransitionsDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
}
