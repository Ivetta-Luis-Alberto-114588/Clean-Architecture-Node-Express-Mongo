import { Request, Response } from "express";
import { CreateCityDto } from "../../domain/dtos/customers/create-city.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { UpdateCityDto } from "../../domain/dtos/customers/update-city.dto";
import { CityRepository } from "../../domain/repositories/customers/city.repository";
import { CreateCityUseCase } from "../../domain/use-cases/customers/create-city.use-case";
import { GetAllCitiesUseCase } from "../../domain/use-cases/customers/get-all-cities.use-case";
import { GetCityByIdUseCase } from "../../domain/use-cases/customers/get-city-by-id..use-case";
import { UpdateCityUseCase } from "../../domain/use-cases/customers/update-city.use-case";
import { DeleteCityUseCase } from "../../domain/use-cases/customers/delete-city.use-case";
import { FindCityByNameUseCase } from "../../domain/use-cases/customers/find-city-by-name.use-case";
import { CustomError } from "../../domain/errors/custom.error";

export class CityController {
    
    constructor(private readonly cityRepository: CityRepository) {}
    
    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        
        console.log("Error en CityController:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    };
    
    createCity = (req: Request, res: Response): void => {
        const [error, createCityDto] = CreateCityDto.create(req.body);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.city.createCity", error);
            return;
        }
        
        new CreateCityUseCase(this.cityRepository)
            .execute(createCityDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    getAllCities = (req: Request, res: Response): void => {
        const { page = 1, limit = 10 } = req.query;
        
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.city.getAllCities", error);
            return;
        }
        
        new GetAllCitiesUseCase(this.cityRepository)
            .execute(paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    getCityById = (req: Request, res: Response): void => {
        const { id } = req.params;
        
        new GetCityByIdUseCase(this.cityRepository)
            .execute(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    updateCity = (req: Request, res: Response): void => {
        const { id } = req.params;
        
        const [error, updateCityDto] = UpdateCityDto.update(req.body);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.city.updateCity", error);
            return;
        }
        
        new UpdateCityUseCase(this.cityRepository)
            .execute(id, updateCityDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };

    deleteCity = (req: Request, res: Response): void => {
        const { id } = req.params;
        
        new DeleteCityUseCase(this.cityRepository)
            .execute(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
    
    findCityByName = (req: Request, res: Response): void => {
        const { name } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.city.findCityByName", error);
            return;
        }
        
        new FindCityByNameUseCase(this.cityRepository)
            .execute(name, paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    };
}