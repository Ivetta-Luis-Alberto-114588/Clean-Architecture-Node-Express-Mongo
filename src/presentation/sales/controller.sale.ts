import { Request, Response } from "express";
import { CreateOrderDto } from "../../domain/dtos/order/create-order.dto";
import { UpdateOrderStatusDto } from "../../domain/dtos/order/update-order-status.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { CustomError } from "../../domain/errors/custom.error";
import { CustomerRepository } from "../../domain/repositories/customers/customer.repository";
import { ProductRepository } from "../../domain/repositories/products/product.repository";
import { SaleRepository } from "../../domain/repositories/sales/sale.repository";
import { CreateSaleUseCase } from "../../domain/use-cases/sales/create-sale.use-case";
import { FindSalesByCustomerUseCase } from "../../domain/use-cases/sales/find-sales-by-customer.use-case";
import { FindSalesByDateRangeUseCase } from "../../domain/use-cases/sales/find-sales-by-date-range.use-case";
import { GetAllSalesUseCase } from "../../domain/use-cases/sales/get-all-sales.use-case";
import { GetSaleByIdUseCase } from "../../domain/use-cases/sales/get-sale-by-id.use-case";
import { UpdateSaleStatusUseCase } from "../../domain/use-cases/sales/update-sale-status.use-case";

export class SaleController {

    constructor(
        private readonly orderRepository: SaleRepository,
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

        new CreateSaleUseCase(
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

        new GetAllSalesUseCase(this.orderRepository)
            .execute(paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    getSaleById = (req: Request, res: Response): void => {
        const { id } = req.params;

        new GetSaleByIdUseCase(this.orderRepository)
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

        new UpdateSaleStatusUseCase(this.orderRepository)
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

        new FindSalesByCustomerUseCase(
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
            new FindSalesByDateRangeUseCase(this.orderRepository)
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