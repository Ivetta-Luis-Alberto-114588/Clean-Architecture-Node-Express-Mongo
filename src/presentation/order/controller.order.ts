// src/presentation/order/controller.order.ts
import { Request, Response } from "express";
import { CreateOrderDto } from "../../domain/dtos/order/create-order.dto";
import { UpdateOrderStatusDto } from "../../domain/dtos/order/update-order-status.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { CustomError } from "../../domain/errors/custom.error";
import { CustomerRepository } from "../../domain/repositories/customers/customer.repository";
import { ProductRepository } from "../../domain/repositories/products/product.repository";
import { OrderRepository } from "../../domain/repositories/order/order.repository";
import { CreateOrderUseCase } from "../../domain/use-cases/order/create-order.use-case";
import { FindOrderByCustomerUseCase } from "../../domain/use-cases/order/find-order-by-customer.use-case";
import { FindOrderByDateRangeUseCase } from "../../domain/use-cases/order/find-order-by-date-range.use-case";
import { GetAllOrderUseCase } from "../../domain/use-cases/order/get-all-order.use-case";
import { GetOrderByIdUseCase } from "../../domain/use-cases/order/get-order-by-id.use-case";
import { UpdateOrderStatusUseCase } from "../../domain/use-cases/order/update-order-status.use-case";
import { CouponRepository } from "../../domain/repositories/coupon/coupon.repository";
import logger from "../../configs/logger"; // Importar logger

export class OrderController {

    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly productRepository: ProductRepository,
        private readonly couponRepository: CouponRepository
    ) { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error("Error en OrderController:", { error: error instanceof Error ? error.stack : error }); // Loguear stack si es Error
        return res.status(500).json({ error: "Error interno del servidor" });
    };

    createSale = (req: Request, res: Response): void => {
        // <<<--- Obtener userId si el usuario está autenticado --- >>>
        const userId = req.body.user?.id; // Viene del AuthMiddleware (si se usa)

        // <<<--- Pasar userId opcional al DTO.create --- >>>
        const [error, createSaleDto] = CreateOrderDto.create(req.body, userId);

        if (error) {
            res.status(400).json({ error });
            logger.warn("Error en validación de CreateOrderDto", { error, body: req.body, userId });
            return;
        }

        // <<<--- Pasar userId opcional al UseCase.execute --- >>>
        new CreateOrderUseCase(
            this.orderRepository,
            this.customerRepository,
            this.productRepository,
            this.couponRepository
        )
            .execute(createSaleDto!, userId) // Pasar userId aquí
            .then(data => res.status(201).json(data))
            .catch(err => this.handleError(err, res));
    };

    // ... (resto de los métodos sin cambios necesarios para esta feature) ...
    getAllSales = (req: Request, res: Response): void => {
        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if (error) {
            res.status(400).json({ error });
            logger.warn("Error en paginación para getAllSales", { error, query: req.query });
            return;
        }
        new GetAllOrderUseCase(this.orderRepository)
            .execute(paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    getSaleById = (req: Request, res: Response): void => {
        const { id } = req.params;
        new GetOrderByIdUseCase(this.orderRepository)
            .execute(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    updateSaleStatus = (req: Request, res: Response): void => {
        const { id } = req.params;
        const [error, updateSaleStatusDto] = UpdateOrderStatusDto.update(req.body);
        if (error) {
            res.status(400).json({ error });
            logger.warn(`Error en validación de UpdateOrderStatusDto para ID ${id}`, { error, body: req.body });
            return;
        }
        new UpdateOrderStatusUseCase(this.orderRepository)
            .execute(id, updateSaleStatusDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    getSalesByCustomer = (req: Request, res: Response): void => {
        const { customerId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if (error) {
            res.status(400).json({ error });
            logger.warn(`Error en paginación para getSalesByCustomer ${customerId}`, { error, query: req.query });
            return;
        }
        new FindOrderByCustomerUseCase(
            this.orderRepository,
            this.customerRepository
        )
            .execute(customerId, paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    getSalesByDateRange = (req: Request, res: Response): void => {
        const { startDate, endDate } = req.body;
        const { page = 1, limit = 10 } = req.query;

        if (!startDate || !endDate) {
            res.status(400).json({ error: "Debe proporcionar fechas de inicio y fin" });
        }

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                res.status(400).json({ error: "Formato de fecha inválido" });
            }

            const [error, paginationDto] = PaginationDto.create(+page, +limit);
            if (error) {
                res.status(400).json({ error });
                logger.warn(`Error en paginación para getSalesByDateRange`, { error, query: req.query });
                return;
            }

            new FindOrderByDateRangeUseCase(this.orderRepository)
                .execute(start, end, paginationDto!)
                .then(data => {
                    logger.info(`Se encontraron ${data.length} pedidos en el rango.`);
                    res.json(data);
                })
                .catch(err => this.handleError(err, res));
        } catch (error) {
            this.handleError(error, res);
        }
    };
}