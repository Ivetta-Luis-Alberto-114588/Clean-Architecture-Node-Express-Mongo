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
import { SelectPaymentMethodDto } from "../../domain/dtos/order/select-payment-method.dto";
import { SelectPaymentMethodUseCase } from "../../domain/use-cases/order/select-payment-method.use-case";
import { PaymentMethodRepository } from "../../domain/repositories/payment/payment-method.repository";
import { DeliveryMethodRepository } from "../../domain/repositories/delivery-methods/delivery-method.repository";
import { ILogger } from "../../domain/interfaces/logger.interface";

export class OrderController {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly productRepository: ProductRepository,
        private readonly couponRepository: CouponRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository,
        private readonly cityRepository: CityRepository,
        private readonly orderStatusRepository: OrderStatusRepository,
        private readonly deliveryMethodRepository: DeliveryMethodRepository,
        private readonly paymentMethodRepository: PaymentMethodRepository,
        private readonly logger: ILogger,
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
            const { page = 1, limit = 10 } = req.query;
            const [error, paginationDto] = PaginationDto.create(+page, +limit);
            if (error) {
                res.status(400).json({ error });
                return;
            }
            const dashboardUseCase = new GetOrdersForDashboardUseCase(this.orderRepository, this.orderStatusRepository);
            const data = await dashboardUseCase.execute();
            res.json(data);
        } catch (err) {
            this.handleError(err, res);
        }
    };

    getAllSales = (req: Request, res: Response): void => {
        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if (error) {
            res.status(400).json({ error });
            loggerService.warn("Error en validación de PaginationDto", { error, query: req.query });
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
            loggerService.warn(`Error en validación de PaginationDto para customer ${customerId}`, { error, query: req.query });
            return;
        }
        new FindOrderByCustomerUseCase(this.orderRepository, this.customerRepository)
            .execute(customerId, paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    getSalesByDateRange = (req: Request, res: Response): void => {
        const { startDate, endDate } = req.body;
        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if (error) {
            res.status(400).json({ error });
            loggerService.warn("Error en validación de PaginationDto para búsqueda por fechas", { error, query: req.query });
            return;
        }
        if (!startDate || !endDate) {
            res.status(400).json({ error: "startDate y endDate son requeridos" });
            loggerService.warn("Fechas de inicio y fin no proporcionadas", { body: req.body });
            return;
        }

        // Validar que las fechas sean válidas
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
            res.status(400).json({ error: "Formato de fecha inválido. Use formato ISO (YYYY-MM-DD)" });
            loggerService.warn("Fechas con formato inválido", { startDate, endDate });
            return;
        }

        new FindOrderByDateRangeUseCase(this.orderRepository)
            .execute(parsedStartDate, parsedEndDate, paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    getMyOrders = (req: Request, res: Response): void => {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.body.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Usuario no autenticado" });
            return;
        }
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if (error) {
            res.status(400).json({ error });
            loggerService.warn(`Error en validación de PaginationDto para usuario ${userId}`, { error, query: req.query });
            return;
        }
        const useCase = new GetMyOrdersUseCase(this.orderRepository, this.customerRepository);
        useCase.execute(userId, paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    createSale = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.body.user?.id;
            const [error, createSaleDto] = await CreateOrderDto.create(req.body, userId);

            if (error) {
                res.status(400).json({ error });
                loggerService.warn("Error en validación de CreateOrderDto", { error, body: req.body, userId });
                return;
            }

            const orderUseCase = new CreateOrderUseCase(
                this.orderRepository, this.customerRepository, this.productRepository,
                this.couponRepository, this.neighborhoodRepository, this.cityRepository,
                this.orderStatusRepository, this.deliveryMethodRepository, notificationService, loggerService
            );

            const data = await orderUseCase.execute(createSaleDto!, userId);

            // Enviar notificación de nueva orden (sin bloquear la respuesta)
            try {
                // await notificationService.sendOrderNotification({
                //     orderId: data.id,
                //     customerName: data.customer?.name || 'Cliente',
                //     total: data.total,
                //     items: data.items?.map(detail => ({
                //         name: detail.product?.name || 'Producto',
                //         quantity: detail.quantity,
                //         price: detail.unitPrice
                //     })) || []
                // });
                loggerService.info(`Notificación enviada para orden ${data.id}`);
            } catch (notificationError) {
                loggerService.warn(`Error al enviar notificación para orden ${data.id}:`, {
                    error: notificationError instanceof Error ? notificationError.message : notificationError
                });
                // No lanzamos el error para que no afecte la respuesta de la orden
            }

            res.status(201).json({
                success: true,
                message: "Orden creada exitosamente",
                data
            });
        } catch (error) {
            this.handleError(error, res);
        }
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

    /**
     * Select payment method for an order
     */
    selectPaymentMethod = async (req: Request, res: Response): Promise<void> => {
        try {
            const { orderId } = req.params;
            const { paymentMethodCode, notes } = req.body;

            // Validar el DTO
            const [error, selectPaymentMethodDto] = SelectPaymentMethodDto.create({
                orderId,
                paymentMethodCode,
                notes
            });

            if (error) {
                res.status(400).json({ error });
                return;
            }

            // Ejecutar el use case
            const useCase = new SelectPaymentMethodUseCase(
                this.orderRepository,
                this.paymentMethodRepository,
                this.orderStatusRepository,
                this.logger
            );

            const updatedOrder = await useCase.execute(selectPaymentMethodDto!);

            res.json({
                success: true,
                message: 'Método de pago seleccionado exitosamente',
                data: updatedOrder
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };
}
