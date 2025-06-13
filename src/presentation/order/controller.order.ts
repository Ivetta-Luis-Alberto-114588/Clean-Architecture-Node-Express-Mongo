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
import { loggerService } from "../../configs/logger";
import { notificationService } from "../../configs/notification";
import { GetMyOrdersUseCase } from "../../domain/use-cases/order/get-my-orders.use-case";
import { NeighborhoodRepository } from "../../domain/repositories/customers/neighborhood.repository";
import { CityRepository } from "../../domain/repositories/customers/city.repository";
import { OrderStatusRepository } from "../../domain/repositories/order/order-status.repository";
import { GetOrdersForDashboardUseCase } from './../../domain/use-cases/order/get-orders-for-dashboard.use-case';
import { UpdateOrderDto } from "../../domain/dtos/order/update-order.dto";
import { UpdateOrderUseCase } from "../../domain/use-cases/order/update-order.use-case";

export class OrderController {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly productRepository: ProductRepository,
        private readonly couponRepository: CouponRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository,
        private readonly cityRepository: CityRepository,
        private readonly orderStatusRepository: OrderStatusRepository,
        private readonly updateOrderUseCase: UpdateOrderUseCase
    ) { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        loggerService.error("Error en OrderController:", { error: error instanceof Error ? error.stack : error });
        return res.status(500).json({ error: "Error interno del servidor" });
    };

    getOrdersForDashboard = async (req: Request, res: Response): Promise<void> => {
        try {
            const data = await new GetOrdersForDashboardUseCase(this.orderRepository, this.orderStatusRepository).execute();
            res.json(data);
        } catch (error) {
            this.handleError(error, res);
        }
    };

    getAllSales = (req: Request, res: Response): void => {
        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if (error) {
            res.status(400).json({ error });
            loggerService.warn("Error en paginación para getAllSales", { error, query: req.query });
            return;
        }
        new GetAllOrderUseCase(this.orderRepository)
            .execute(paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    getSalesByCustomer = (req: Request, res: Response): void => {
        const { customerId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if (error) {
            res.status(400).json({ error });
            loggerService.warn(`Error en paginación para getSalesByCustomer ${customerId}`, { error, query: req.query });
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
            return;
        }

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                res.status(400).json({ error: "Formato de fecha inválido" });
                return;
            }

            const [error, paginationDto] = PaginationDto.create(+page, +limit);
            if (error) {
                res.status(400).json({ error });
                loggerService.warn(`Error en paginación para getSalesByDateRange`, { error, query: req.query });
                return;
            }

            new FindOrderByDateRangeUseCase(this.orderRepository)
                .execute(start, end, paginationDto!)
                .then(data => {
                    loggerService.info(`Se encontraron ${data.total} pedidos en el rango.`);
                    res.json(data);
                })
                .catch(err => this.handleError(err, res));
        } catch (error) {
            this.handleError(error, res);
        }
    };

    getMyOrders = (req: Request, res: Response): void => {
        const userId = req.body.user?.id;

        if (!userId) {
            this.handleError(CustomError.unauthorized('Usuario no autenticado'), res);
            return;
        }

        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(+page, +limit);

        if (error) {
            res.status(400).json({ error });
            loggerService.warn(`Error en paginación para getMyOrders (User: ${userId})`, { error, query: req.query });
            return;
        }

        new GetMyOrdersUseCase(this.orderRepository, this.customerRepository)
            .execute(userId, paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    createSale = (req: Request, res: Response): void => {
        const userId = req.body.user?.id;
        const [error, createSaleDto] = CreateOrderDto.create(req.body, userId);

        if (error) {
            res.status(400).json({ error });
            loggerService.warn("Error en validación de CreateOrderDto", { error, body: req.body, userId });
            return;
        } new CreateOrderUseCase(
            this.orderRepository, this.customerRepository, this.productRepository,
            this.couponRepository, this.neighborhoodRepository, this.cityRepository,
            this.orderStatusRepository, notificationService, loggerService
        )
            .execute(createSaleDto!, userId).then(async (data) => {
                // Enviar notificación de nueva orden (sin bloquear la respuesta)
                try {
                    await notificationService.sendOrderNotification({
                        orderId: data.id,
                        customerName: data.customer?.name || 'Cliente',
                        total: data.total,
                        items: data.items?.map(detail => ({
                            name: detail.product?.name || 'Producto',
                            quantity: detail.quantity,
                            price: detail.unitPrice
                        })) || []
                    });
                    loggerService.info(`Notificación enviada para orden ${data.id}`);
                } catch (notificationError) {
                    loggerService.warn(`Error al enviar notificación para orden ${data.id}:`, {
                        error: notificationError instanceof Error ? notificationError.message : notificationError
                    });
                    // No lanzamos el error para que no afecte la respuesta de la orden
                }

                res.status(201).json(data);
            })
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
            loggerService.warn(`Error en validación de UpdateOrderStatusDto para ID ${id}`, { error, body: req.body });
            return;
        }
        new UpdateOrderStatusUseCase(this.orderRepository, this.orderStatusRepository)
            .execute(id, updateSaleStatusDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    /**
     * Full update of an order
     */
    updateSale = (req: Request, res: Response): void => {
        const { id } = req.params;
        const [error, updateDto] = UpdateOrderDto.create(req.body);
        if (error) {
            res.status(400).json({ error });
            return;
        }
        this.updateOrderUseCase.execute(id, updateDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
}
