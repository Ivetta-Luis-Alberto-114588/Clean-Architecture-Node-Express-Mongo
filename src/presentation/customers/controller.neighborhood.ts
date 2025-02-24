import { Request, Response } from "express";
import { CreateNeighborhoodDto } from "../../domain/dtos/customers/create-neighborhood.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { UpdateNeighborhoodDto } from "../../domain/dtos/customers/update-neighborhood.dto";
import { NeighborhoodRepository } from "../../domain/repositories/customers/neighborhood.repository";
import { CityRepository } from "../../domain/repositories/customers/city.repository";
import { CreateNeighborhoodUseCase } from "../../domain/use-cases/customers/create-neighborhood.use-case";
import { GetAllNeighborhoodsUseCase } from "../../domain/use-cases/customers/get-all-neighborhoods.use-case";
import { GetNeighborhoodByIdUseCase } from "../../domain/use-cases/customers/get-neighborhood-by-id.use-case";
import { UpdateNeighborhoodUseCase } from "../../domain/use-cases/customers/update-neighborhood.use-case";
import { DeleteNeighborhoodUseCase } from "../../domain/use-cases/customers/delete-neighborhood.use-case";
import { FindNeighborhoodsByCityUseCase } from "../../domain/use-cases/customers/find-neighborhoods-by-city.use-case";
import { CustomError } from "../../domain/errors/custom.error";

export class NeighborhoodController {
    
    constructor(
        private readonly neighborhoodRepository: NeighborhoodRepository,
        private readonly cityRepository: CityRepository
    ) {}
    
    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        
        console.log("Error en NeighborhoodController:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    };
    
    createNeighborhood = (req: Request, res: Response): void => {
        const [error, createNeighborhoodDto] = CreateNeighborhoodDto.create(req.body);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.neighborhood.createNeighborhood", error);
            return;
        }
        
        new CreateNeighborhoodUseCase(
            this.neighborhoodRepository,
            this.cityRepository
        )
            .execute(createNeighborhoodDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    getAllNeighborhoods = (req: Request, res: Response): void => {
        const { page = 1, limit = 10 } = req.query;
        
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.neighborhood.getAllNeighborhoods", error);
            return;
        }
        
        new GetAllNeighborhoodsUseCase(this.neighborhoodRepository)
            .execute(paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    getNeighborhoodById = (req: Request, res: Response): void => {
        const { id } = req.params;
        
        new GetNeighborhoodByIdUseCase(this.neighborhoodRepository)
            .execute(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    updateNeighborhood = (req: Request, res: Response): void => {
        const { id } = req.params;
        
        const [error, updateNeighborhoodDto] = UpdateNeighborhoodDto.update(req.body);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.neighborhood.updateNeighborhood", error);
            return;
        }
        
        new UpdateNeighborhoodUseCase(
            this.neighborhoodRepository,
            this.cityRepository
        )
            .execute(id, updateNeighborhoodDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    deleteNeighborhood = (req: Request, res: Response): void => {
        const { id } = req.params;
        
        new DeleteNeighborhoodUseCase(this.neighborhoodRepository)
            .execute(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    getNeighborhoodsByCity = (req: Request, res: Response): void => {
        const { cityId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.neighborhood.getNeighborhoodsByCity", error);
            return;
        }
        
        new FindNeighborhoodsByCityUseCase(
            this.neighborhoodRepository,
            this.cityRepository
        )
            .execute(cityId, paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
}