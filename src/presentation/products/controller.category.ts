import {Request, Response} from "express";
import { CustomError } from "../../domain/errors/custom.error";
import { CategoryRepository } from "../../domain/repositories/products/categroy.repository";
import { CreateCategoryDto } from "../../domain/dtos/products/create-category";
import { CreateCategoryUseCase } from "../../domain/use-cases/product/create-category.use-case";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { GetAllCategoryUseCase } from "../../domain/use-cases/product/get-all-category.use-case";
import { DeleteCategoryUseCase } from "../../domain/use-cases/product/delete-category.use-case";
import { GetCategoryByIdUseCase } from "../../domain/use-cases/product/get-category-by-id.use-case";


export class CategoryController {

    constructor(
        private readonly categoryRepository: CategoryRepository
    ) {}

    
    // metodo para manejar errores dentro de esta clase
    private handleError = (error: unknown, res: Response) => {
        if(error instanceof CustomError){
            return res.status(error.statusCode).json({error: error.message});
        }
    
        console.log("metodo handleError del controller ", error);
        return res.status(500).json({error: "Internal server error"});
    }

    

    createCategory = (req: Request, res: Response): void => {
        
        const [error, createCategoryDto] = CreateCategoryDto.create(req.body);
    
        //si existe un error en el Dto lo capturo y envio como respuesta en el controller
        if (error) {
             res.status(400).json({ error });
             console.log("error en controller.category.createCategory", error)
             
             //si hay un error de validacion tengo que cortar la ejecucion
             return
        }
 
        //creo una instancia del caso de uso y le paso el repositorio
        new CreateCategoryUseCase(this.categoryRepository)
            .execute(createCategoryDto!)
            .then(data => res.json(data))  //aca puede haber error de binding
            .catch(err => this.handleError(err, res))
    }


    getAllCategories = (req: Request, res: Response): void => {

        //desestruro la query para obtener la paginacion
        const { page=1, limit=5 } = req.query;

        //creo un objeto de tipo Pagination
        const [error, paginationDto] = PaginationDto.create(+page, +limit );

        //si existe un error en el Dto lo capturo y envio como respuesta en el controller
        if (error) {
            res.status(400).json({ error });
            console.log("error en controller.category.getAllCategories", error)
            
            //si hay un error de validacion tengo que cortar la ejecucion
            return
        }

        //creo una instancia del caso de uso y le paso el repositorio
        new GetAllCategoryUseCase(this.categoryRepository)
            .execute(paginationDto!)
            .then(data => res.json(data))  //aca puede haber error de binding
            .catch(err => this.handleError(err, res))
    }


    deleteCategory = (req: Request, res: Response): void => {
        //desestructuro el id de la request
        const { id } = req.params;

        //creo una instancia del caso de uso y le paso el repositorio
        new DeleteCategoryUseCase(this.categoryRepository)
            .execute(id)    
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    }



    getCategoryById = (req: Request, res: Response): void => {
        const { id } = req.params;
    
        new GetCategoryByIdUseCase(this.categoryRepository)
            .execute(id)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    }

    

    updateCategory = (req: Request, res: Response): void => {
        //desestructuro el id de la request
        const { id } = req.params;

        //desectructuro el error y el dto del request
        const [error, createCategoryDto] = CreateCategoryDto.create(req.body);

        //si existe un error en el Dto lo capturo y envio como respuesta en el controller
        if (error) {
            res.status(400).json({ error });
            console.log("error en controller.category.updateCategory", error);
            return;
        }

        //creo una instancia del caso de uso y le paso el repositorio
        //TODO: implementar el caso de uso para actualizar una categoria
    }
}