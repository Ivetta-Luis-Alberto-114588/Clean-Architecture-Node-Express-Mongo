// src/presentation/customers/controller.address.ts
import { Request, Response } from "express";
import { CustomError } from "../../domain/errors/custom.error";
import { CustomerRepository } from "../../domain/repositories/customers/customer.repository";
import { CreateAddressUseCase } from "../../domain/use-cases/customers/create-address.use-case";
import { GetMyAddressesUseCase } from "../../domain/use-cases/customers/get-my-addresses.use-case";
import { UpdateAddressUseCase } from "../../domain/use-cases/customers/update-address.use-case";
import { DeleteAddressUseCase } from "../../domain/use-cases/customers/delete-address.use-case";
import { SetDefaultAddressUseCase } from "../../domain/use-cases/customers/set-default-address.use-case";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import logger from "../../configs/logger";
import { NeighborhoodRepository } from "../../domain/repositories/customers/neighborhood.repository"; // <<<--- Necesario

export class AddressController {

    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository // <<<--- Inyectar
    ) { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error("Error en AddressController:", { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
        return res.status(500).json({ error: "Error interno del servidor" });
    }

    // POST /api/addresses
    createAddress = (req: Request, res: Response) => {
        const userId = req.body.user?.id;
        if (!userId) return this.handleError(CustomError.unauthorized("Usuario no autenticado"), res);

        new CreateAddressUseCase(this.customerRepository, this.neighborhoodRepository) // <<<--- Pasar repo
            .execute(userId, req.body)
            .then(address => res.status(201).json(address))
            .catch(err => this.handleError(err, res));
    }

    // GET /api/addresses
    getMyAddresses = (req: Request, res: Response) => {
        const userId = req.body.user?.id;
        if (!userId) return this.handleError(CustomError.unauthorized("Usuario no autenticado"), res);

        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(Number(page), Number(limit));
        if (error) return res.status(400).json({ error });

        new GetMyAddressesUseCase(this.customerRepository)
            .execute(userId, paginationDto!)
            .then(addresses => res.json(addresses))
            .catch(err => this.handleError(err, res));
    }

    // PUT /api/addresses/:id
    updateAddress = (req: Request, res: Response) => {
        const userId = req.body.user?.id;
        const { id: addressId } = req.params;
        if (!userId) return this.handleError(CustomError.unauthorized("Usuario no autenticado"), res);

        new UpdateAddressUseCase(this.customerRepository, this.neighborhoodRepository) // <<<--- Pasar repo
            .execute(userId, addressId, req.body)
            .then(address => res.json(address))
            .catch(err => this.handleError(err, res));
    }

    // DELETE /api/addresses/:id
    deleteAddress = (req: Request, res: Response) => {
        const userId = req.body.user?.id;
        const { id: addressId } = req.params;
        if (!userId) return this.handleError(CustomError.unauthorized("Usuario no autenticado"), res);

        new DeleteAddressUseCase(this.customerRepository)
            .execute(userId, addressId)
            .then(deletedAddress => res.json({ message: "Dirección eliminada", address: deletedAddress }))
            .catch(err => this.handleError(err, res));
    }

    // PATCH /api/addresses/:id/default
    setDefaultAddress = (req: Request, res: Response) => {
        const userId = req.body.user?.id;
        const { id: addressId } = req.params;
        if (!userId) return this.handleError(CustomError.unauthorized("Usuario no autenticado"), res);

        new SetDefaultAddressUseCase(this.customerRepository)
            .execute(userId, addressId)
            .then(result => res.json(result))
            .catch(err => this.handleError(err, res));
    }
}