// src/presentation/delivery-methods/controller.ts

import { Request, Response } from 'express';
import { GetActiveDeliveryMethods } from '../../domain/use-cases/delivery-methods/get-active-delivery-methods.use-case';
import { CreateDeliveryMethod } from '../../domain/use-cases/delivery-methods/create-delivery-method.use-case';
import { CreateDeliveryMethodDto } from '../../domain/dtos/delivery-methods/create-delivery-method.dto';
import { UpdateDeliveryMethodDto } from '../../domain/dtos/delivery-methods/update-delivery-method.dto';
import { PaginationDto } from '../../domain/dtos/shared/pagination.dto';
import { CustomError } from '../../domain/errors/custom.error';
import { DeliveryMethodRepository } from '../../domain/repositories/delivery-methods/delivery-method.repository';

export class DeliveryMethodController {

    constructor(
        private readonly deliveryMethodRepository: DeliveryMethodRepository
    ) { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.log(`${error}`);
        return res.status(500).json({ message: 'Internal server error' });
    };

    // Endpoint público para obtener métodos activos
    getActiveMethods = async (req: Request, res: Response) => {
        try {
            const getActiveDeliveryMethodsUseCase = new GetActiveDeliveryMethods(this.deliveryMethodRepository);
            const deliveryMethods = await getActiveDeliveryMethodsUseCase.execute();

            res.json(deliveryMethods.map(method => ({
                id: method.id,
                code: method.code,
                name: method.name,
                description: method.description,
                requiresAddress: method.requiresAddress,
                isActive: method.isActive
            })));

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Endpoint para administradores - obtener todos con paginación
    getAll = async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const [error, paginationDto] = PaginationDto.create(+page, +limit);

            if (error) return res.status(400).json({ message: error });

            const { total, items } = await this.deliveryMethodRepository.getAll(paginationDto!);

            res.json({
                deliveryMethods: items,
                pagination: {
                    page: paginationDto!.page,
                    limit: paginationDto!.limit,
                    total,
                    totalPages: Math.ceil(total / paginationDto!.limit),
                    next: `/api/admin/delivery-methods?page=${paginationDto!.page + 1}&limit=${paginationDto!.limit}`,
                    prev: paginationDto!.page > 1 ? `/api/admin/delivery-methods?page=${paginationDto!.page - 1}&limit=${paginationDto!.limit}` : null
                }
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Endpoint para administradores - crear método de entrega
    create = async (req: Request, res: Response) => {
        try {
            const [error, createDeliveryMethodDto] = CreateDeliveryMethodDto.create(req.body);
            if (error) return res.status(400).json({ message: error });

            const createDeliveryMethodUseCase = new CreateDeliveryMethod(this.deliveryMethodRepository);
            const deliveryMethod = await createDeliveryMethodUseCase.execute(createDeliveryMethodDto!);

            res.status(201).json(deliveryMethod);

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Endpoint para administradores - obtener por ID
    findById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const deliveryMethod = await this.deliveryMethodRepository.findById(id);

            if (!deliveryMethod) {
                return res.status(404).json({ message: `Delivery method with id ${id} not found` });
            }

            res.json(deliveryMethod);

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Endpoint para administradores - actualizar
    updateById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const [error, updateDeliveryMethodDto] = UpdateDeliveryMethodDto.update(req.body);
            if (error) return res.status(400).json({ message: error });

            const deliveryMethod = await this.deliveryMethodRepository.updateById(id, updateDeliveryMethodDto!);

            res.json(deliveryMethod);

        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Endpoint para administradores - eliminar
    deleteById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await this.deliveryMethodRepository.deleteById(id);

            res.status(204).send();

        } catch (error) {
            this.handleError(error, res);
        }
    };
}
