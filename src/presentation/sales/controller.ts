// src/presentation/sales/controller.ts
import { Request, Response } from "express";
import { CreateSaleDto } from "../../domain/dtos/sales/create-sale.dto";
import { UpdateSaleStatusDto } from "../../domain/dtos/sales/update-sale-status.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { CreateSaleUseCase } from "../../domain/use-cases/sales/create-sale.use-case";
import { GetSaleByIdUseCase } from "../../domain/use-cases/sales/get-sale-by-id.use-case";
import { UpdateSaleStatusUseCase } from "../../domain/use-cases/sales/update-sale-status.use-case";
import { GetAllSalesUseCase } from "../../domain/use-cases/sales/get-all-sales.use-case";
import { GetSalesByCustomerUseCase } from "../../domain/use-cases/sales/get-sales-by-customer.use-case";
import { GetSalesByStatusUseCase } from "../../domain/use-cases/sales/get-sales-by-status.use-case";
import { CustomError } from "../../domain/errors/custom.error";

export class SalesController {    constructor(
        private readonly createSaleUseCase: CreateSaleUseCase,
        private readonly getSaleByIdUseCase: GetSaleByIdUseCase,
        private readonly updateSaleStatusUseCase: UpdateSaleStatusUseCase,
        private readonly getAllSalesUseCase: GetAllSalesUseCase,
        private readonly getSalesByCustomerUseCase: GetSalesByCustomerUseCase,
        private readonly getSalesByStatusUseCase: GetSalesByStatusUseCase
    ) {}

    createSale = async (req: Request, res: Response) => {
        try {
            const [error, createSaleDto] = CreateSaleDto.create(req.body);
            if (error) return res.status(400).json({ error });

            const sale = await this.createSaleUseCase.execute(createSaleDto!);
            return res.status(201).json(sale);

        } catch (error) {
            this.handleError(error, res);
        }
    };

    getSaleById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ error: "Sale ID is required" });

            const sale = await this.getSaleByIdUseCase.execute(id);
            return res.json(sale);

        } catch (error) {
            this.handleError(error, res);
        }
    };    getAllSales = async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const [error, paginationDto] = PaginationDto.create(+page, +limit);
            if (error) return res.status(400).json({ error });

            const result = await this.getAllSalesUseCase.execute(paginationDto!);
            return res.json({
                sales: result.sales,
                total: result.total,
                page: paginationDto!.page,
                limit: paginationDto!.limit
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };    updateSaleStatus = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ error: "Sale ID is required" });

            const [error, updateSaleStatusDto] = UpdateSaleStatusDto.update(req.body);
            if (error) return res.status(400).json({ error });

            const sale = await this.updateSaleStatusUseCase.execute(id, updateSaleStatusDto!);
            return res.json(sale);

        } catch (error) {
            this.handleError(error, res);
        }
    };    getSalesByCustomer = async (req: Request, res: Response) => {
        try {
            const { customerId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            if (!customerId) return res.status(400).json({ error: "Customer ID is required" });

            const [error, paginationDto] = PaginationDto.create(+page, +limit);
            if (error) return res.status(400).json({ error });

            const result = await this.getSalesByCustomerUseCase.execute(customerId, paginationDto!);
            return res.json({
                sales: result.sales,
                total: result.total,
                page: paginationDto!.page,
                limit: paginationDto!.limit
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };    getSalesByStatus = async (req: Request, res: Response) => {
        try {
            const { status } = req.params;
            const { page = 1, limit = 10 } = req.query;

            if (!status) return res.status(400).json({ error: "Status is required" });

            const [error, paginationDto] = PaginationDto.create(+page, +limit);
            if (error) return res.status(400).json({ error });

            const result = await this.getSalesByStatusUseCase.execute(status, paginationDto!);
            return res.json({
                sales: result.sales,
                total: result.total,
                page: paginationDto!.page,
                limit: paginationDto!.limit
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    };
}
