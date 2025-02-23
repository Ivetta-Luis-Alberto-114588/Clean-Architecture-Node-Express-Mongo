import { Response, Request } from "express";
import { CustomError } from "../../domain/errors/custom.error";
import { UnitRepository } from "../../domain/repositories/products/unit.repository";
import { CreateUnitDto } from "../../domain/dtos/products/create-unit.dto";
import { CreateUnitUseCase } from "../../domain/use-cases/product/create-unit.use-case";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { GetAllUnitUseCase } from "../../domain/use-cases/product/get-all-unit.use-case";
import { DeleteUnitUseCase } from "../../domain/use-cases/product/delete-unit.use-case";
import { GetUnitByIdUseCase } from "../../domain/use-cases/product/get-unit-by-id.use-case";
import { UpdateUnitUseCase } from "../../domain/use-cases/product/update-unit.use-case";
import { UpdateUnitDto } from "../../domain/dtos/products/udpate-unit.dto";


export class UnitController {
    
    constructor(private readonly unitRepository: UnitRepository) {}

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.log("Error en UnitController:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }

    createUnit = (req: Request, res: Response) => {
        
        //desectructuro el error y el dto del request
        const [error, createUnitDto] = CreateUnitDto.create(req.body);

        //si existe un error en el Dto lo capturo y envio como respuesta en el controller
        if (error) {
            res.status(400).json({ error });
            console.log("error en controller.products.createUnit", error);
            return;
        }

        //creo una instancia del caso de uso y le paso el repositorio
        new CreateUnitUseCase(this.unitRepository)
            .execute(createUnitDto!)    
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    }


    getAllUnits = (req: Request, res: Response) => {
        
        //desestructuro la paginacion de la request
        const { page=1 , limit=5 } = req.query;

        //creo una instancia del dto de paginacion
        const [error, paginationDto] = PaginationDto.create(+page, +limit);

        //si existe un error en el Dto lo capturo y envio como respuesta en el controller
        if (error) {
            res.status(400).json({ error });
            console.log("error en controller.products.getAllUnits", error);
            return;
        }

        //creo una instancia del caso de uso y le paso el repositorio
        new GetAllUnitUseCase(this.unitRepository)
            .execute(paginationDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));

    }

    deleteUnit = (req: Request, res: Response) => {
        //desestructuro el id de la request
        const { id } = req.params;

        //creo una instancia del caso de uso y le paso el repositorio
        new DeleteUnitUseCase(this.unitRepository)
            .execute(id)    
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    }


    getUnitById = (req: Request, res: Response): void => {
        const { id } = req.params;
    
        new GetUnitByIdUseCase(this.unitRepository)
            .execute(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    }



    updateUnit = (req: Request, res: Response) => {
        const { id } = req.params;

        // Usamos el método update del UpdateUnitDto
        const [error, updateUnitDto] = UpdateUnitDto.update(req.body);

        if (error) {
            res.status(400).json({ error });
            console.log("error en controller.unit.updateUnit", error);
            return;
        }

        // Ejecutamos el caso de uso con los campos actualizados
        new UpdateUnitUseCase(this.unitRepository)
            .execute(id, updateUnitDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    }

    
}