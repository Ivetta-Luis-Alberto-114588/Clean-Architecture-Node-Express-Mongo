import { Request, Response } from "express";
import { CreateCustomerDto } from "../../domain/dtos/customers/create-customer.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { UpdateCustomerDto } from "../../domain/dtos/customers/update-customer.dto";
import { CustomerRepository } from "../../domain/repositories/customers/customer.repository";
import { NeighborhoodRepository } from "../../domain/repositories/customers/neighborhood.repository";
import { CreateCustomerUseCase } from "../../domain/use-cases/customers/create-customer.use-case";
import { GetAllCustomersUseCase } from "../../domain/use-cases/customers/get-all-customers.use-case";
import { GetCustomerByIdUseCase } from "../../domain/use-cases/customers/get-customer-by-id.use-case";
import { UpdateCustomerUseCase } from "../../domain/use-cases/customers/update-customer.use-case";
import { DeleteCustomerUseCase } from "../../domain/use-cases/customers/delete-customer.use-case";
import { FindCustomersByNeighborhoodUseCase } from "../../domain/use-cases/customers/find-customers-by-neighborhood.use-case";
import { GetCustomerByEmailUseCase } from "../../domain/use-cases/customers/get-customer-by-email.use-case";
import { CustomError } from "../../domain/errors/custom.error";

export class CustomerController {
    
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository
    ) {}
    
    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        
        console.log("Error en CustomerController:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    };
    
    createCustomer = (req: Request, res: Response): void => {
        const [error, createCustomerDto] = CreateCustomerDto.create(req.body);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.customer.createCustomer", error);
            return;
        }
        
        new CreateCustomerUseCase(
            this.customerRepository,
            this.neighborhoodRepository
        )
            .execute(createCustomerDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    getAllCustomers = (req: Request, res: Response): void => {
        const { page = 1, limit = 10 } = req.query;
        
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.customer.getAllCustomers", error);
            return;
        }
        
        new GetAllCustomersUseCase(this.customerRepository)
            .execute(paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    getCustomerById = (req: Request, res: Response): void => {
        const { id } = req.params;
        
        new GetCustomerByIdUseCase(this.customerRepository)
            .execute(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    updateCustomer = (req: Request, res: Response): void => {
        const { id } = req.params;
        
        const [error, updateCustomerDto] = UpdateCustomerDto.update(req.body);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.customer.updateCustomer", error);
            return;
        }
        
        new UpdateCustomerUseCase(
            this.customerRepository,
            this.neighborhoodRepository
        )
            .execute(id, updateCustomerDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    deleteCustomer = (req: Request, res: Response): void => {
        const { id } = req.params;
        
        new DeleteCustomerUseCase(this.customerRepository)
            .execute(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    getCustomersByNeighborhood = (req: Request, res: Response): void => {
        const { neighborhoodId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.customer.getCustomersByNeighborhood", error);
            return;
        }
        
        new FindCustomersByNeighborhoodUseCase(
            this.customerRepository,
            this.neighborhoodRepository
        )
            .execute(neighborhoodId, paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    getCustomerByEmail = (req: Request, res: Response): void => {
        const { email } = req.params;
        
        new GetCustomerByEmailUseCase(this.customerRepository)
            .execute(email)
            .then(data => {
                if (!data) {
                    return res.status(404).json({ error: "Cliente no encontrado" });
                }
                res.json(data);
            })
            .catch(err => this.handleError(err, res));
    };
}