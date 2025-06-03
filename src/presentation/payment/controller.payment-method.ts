// src/presentation/payment/controller.payment-method.ts

import { Request, Response } from "express";
import { CreatePaymentMethodDto } from "../../domain/dtos/payment/create-payment-method.dto";
import { UpdatePaymentMethodDto } from "../../domain/dtos/payment/update-payment-method.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { PaymentMethodRepository } from "../../domain/repositories/payment/payment-method.repository";
import { CreatePaymentMethod } from "../../domain/use-cases/payment/create-payment-method.use-case";
import { GetPaymentMethods } from "../../domain/use-cases/payment/get-payment-methods.use-case";
import { GetPaymentMethodById } from "../../domain/use-cases/payment/get-payment-method-by-id.use-case";
import { GetPaymentMethodByCode } from "../../domain/use-cases/payment/get-payment-method-by-code.use-case";
import { UpdatePaymentMethod } from "../../domain/use-cases/payment/update-payment-method.use-case";
import { DeletePaymentMethod } from "../../domain/use-cases/payment/delete-payment-method.use-case";
import { GetActivePaymentMethods } from "../../domain/use-cases/payment/get-active-payment-methods.use-case";
import { CustomError } from "../../domain/errors/custom.error";
import logger from "../../configs/logger";

export class PaymentMethodController {

    constructor(
        private readonly paymentMethodRepository: PaymentMethodRepository
    ) { }    private handleError = (error: unknown, res: Response): void => {
        if (error instanceof CustomError) {
            logger.error(`Error en PaymentMethodController: ${error.message}`);
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        
        if (error instanceof Error) {
            logger.error(`Error en PaymentMethodController: ${error.message}`, { stack: error.stack });
            res.status(500).json({ error: error.message });
        } else {
            logger.error('Error desconocido en PaymentMethodController', { error });
            res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    // POST /api/payment-methods - Crear nuevo método de pago
    createPaymentMethod = (req: Request, res: Response): void => {
        const [error, createPaymentMethodDto] = CreatePaymentMethodDto.create(req.body);

        if (error) {
            res.status(400).json({ error });
            logger.warn('Error en validación de CreatePaymentMethodDto', { error, body: req.body });
            return;
        }

        new CreatePaymentMethod(this.paymentMethodRepository)
            .execute(createPaymentMethodDto!)
            .then(data => res.status(201).json(data))
            .catch(err => this.handleError(err, res));
    };

    // GET /api/payment-methods - Obtener todos los métodos de pago
    getPaymentMethods = (req: Request, res: Response): void => {
        const { page = 1, limit = 10, activeOnly = 'false' } = req.query;

        const [paginationError, paginationDto] = PaginationDto.create(+page, +limit);
        if (paginationError) {
            res.status(400).json({ error: paginationError });
            return;
        }

        const onlyActive = activeOnly === 'true';

        new GetPaymentMethods(this.paymentMethodRepository)
            .execute(paginationDto!, onlyActive)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    // GET /api/payment-methods/active - Obtener solo métodos de pago activos
    getActivePaymentMethods = (req: Request, res: Response): void => {
        new GetActivePaymentMethods(this.paymentMethodRepository)
            .execute()
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    // GET /api/payment-methods/:id - Obtener método de pago por ID
    getPaymentMethodById = (req: Request, res: Response): void => {
        const { id } = req.params;

        new GetPaymentMethodById(this.paymentMethodRepository)
            .execute(id)
            .then(data => {
                if (!data) {
                    return res.status(404).json({ error: 'Payment method not found' });
                }
                res.json(data);
            })
            .catch(err => this.handleError(err, res));
    };

    // GET /api/payment-methods/code/:code - Obtener método de pago por código
    getPaymentMethodByCode = (req: Request, res: Response): void => {
        const { code } = req.params;

        new GetPaymentMethodByCode(this.paymentMethodRepository)
            .execute(code)
            .then(data => {
                if (!data) {
                    return res.status(404).json({ error: 'Payment method not found' });
                }
                res.json(data);
            })
            .catch(err => this.handleError(err, res));
    };

    // PUT /api/payment-methods/:id - Actualizar método de pago
    updatePaymentMethod = (req: Request, res: Response): void => {
        const { id } = req.params;
        const [error, updatePaymentMethodDto] = UpdatePaymentMethodDto.create(req.body);

        if (error) {
            res.status(400).json({ error });
            logger.warn(`Error en validación de UpdatePaymentMethodDto para ID ${id}`, { error, body: req.body });
            return;
        }

        new UpdatePaymentMethod(this.paymentMethodRepository)
            .execute(id, updatePaymentMethodDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    // DELETE /api/payment-methods/:id - Eliminar método de pago
    deletePaymentMethod = (req: Request, res: Response): void => {
        const { id } = req.params;

        new DeletePaymentMethod(this.paymentMethodRepository)
            .execute(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
}
