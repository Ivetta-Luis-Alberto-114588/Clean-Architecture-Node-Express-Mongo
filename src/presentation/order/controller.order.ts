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

export class OrderController {

    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly productRepository: ProductRepository
    ) { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.log("Error en SaleController:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    };

    createSale = (req: Request, res: Response): void => {
        const [error, createSaleDto] = CreateOrderDto.create(req.body);

        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.sale.createSale", error);
            return;
        }

        new CreateOrderUseCase(
            this.orderRepository,
            this.customerRepository,
            this.productRepository
        )
            .execute(createSaleDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    getAllSales = (req: Request, res: Response): void => {
        const { page = 1, limit = 10 } = req.query;

        const [error, paginationDto] = PaginationDto.create(+page, +limit);

        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.sale.getAllSales", error);
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
            console.log("Error en controller.sale.updateSaleStatus", error);
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
            console.log("Error en controller.sale.getSalesByCustomer", error);
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

        // console.log('Fechas recibidas:', { startDate, endDate });

        try {
            // Asegúrate de crear objetos Date correctos
            const start = new Date(startDate);
            const end = new Date(endDate);

            // console.log('Fechas convertidas:', { start, end });

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                res.status(400).json({ error: "Formato de fecha inválido" });
                return;
            }

            const [error, paginationDto] = PaginationDto.create(+page, +limit);

            if (error) {
                res.status(400).json({ error });
                console.log("Error en controller.sale.getSalesByDateRange", error);
                return;
            }

            // Llama una sola vez al caso de uso
            new FindOrderByDateRangeUseCase(this.orderRepository)
                .execute(start, end, paginationDto!)
                .then(data => {
                    console.log(`Se encontraron ${data.length} ventas.`);
                    res.json(data);
                })
                .catch(err => this.handleError(err, res));
        } catch (error) {
            this.handleError(error, res);
        }
    };
}