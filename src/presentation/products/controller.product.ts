import { Response, Request } from "express";
import { ProductRepository } from "../../domain/repositories/products/product.repository";
import { CustomError } from "../../domain/errors/custom.error";
import { CreateProductDto } from "../../domain/dtos/products/create-product.dto";
import { CreateProductUseCase } from "../../domain/use-cases/product/create-product.use-case";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { GetAllCategoryUseCase } from "../../domain/use-cases/product/get-all-category.use-case";
import { GetAllProductsUseCase } from "../../domain/use-cases/product/get-all-products.use-case";
import { DeleteProductUseCase } from "../../domain/use-cases/product/delete-product.use-case";
import { GetProductByCategoryUseCase } from "../../domain/use-cases/product/get-product-by-category.use-case";
import { CategoryRepository } from "../../domain/repositories/products/categroy.repository";
import { UpdateProductUseCase } from "../../domain/use-cases/product/update-product.use-case";
import { UpdateProductDto } from "../../domain/dtos/products/update-product.dto";


export class ProductController {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly categoryRepository: CategoryRepository
    ) {}

    //manejo los errores dentro de la clase
    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.log("Error en ProductController:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }

    createProduct = (req: Request, res: Response) => {

        //desestructuro el body
        const [error, createProductDto] = CreateProductDto.create(req.body);

        //si existe un error en el Dto lo capturo y envio como respuesta en el controller
        if (error) {
            res.status(400).json({ error });
            console.log("error en controller.products.createProduct", error);
            return;
        }

        //creo una instancia del caso de uso y le paso el repositorio
        new CreateProductUseCase(this.productRepository)
            .execute(createProductDto!)    
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    }



    getAllProducts = (req: Request, res: Response) => {

         //desestructuro la paginacion de la request
        const { page=1 , limit=5 } = req.query;

        //creo una instancia del dto de paginacion
        const [error, paginationDto] = PaginationDto.create(+page, +limit);

        //si existe un error en el Dto lo capturo y envio como respuesta en el controller
        if (error) {
            res.status(400).json({ error });
            console.log("error en controller.products.getAllProducts", error);
            return;
        }

        new GetAllProductsUseCase(this.productRepository)
                .execute(paginationDto!)
                .then(data => res.json(data))
                .catch(err => this.handleError(err, res));

    }


    deleteProduct = (req: Request, res: Response) => {
        //desestructuro el id de la request
        const { id } = req.params;

        //creo una instancia del caso de uso y le paso el repositorio
        new DeleteProductUseCase(this.productRepository)
                .execute(id)
                .then(data => res.json(data))
                .catch(err => this.handleError(err, res));
    }


    getProductsByCategory = (req: Request, res: Response) => {
        //desestructuro el id de la request
        const { categoryId } = req.params;

        //desestructuro la paginacion de la request
        const { page=1 , limit=5 } = req.query;

        //creo una instancia del dto de paginacion
        const [error, paginationDto] = PaginationDto.create(+page, +limit);

        //si existe un error en el Dto lo capturo y envio como respuesta en el controller
        if (error) {
            res.status(400).json({ error });
            console.log("error en controller.products.getProductsByCategory", error);
            return;
        }

        new GetProductByCategoryUseCase(this.productRepository, this.categoryRepository)
            .execute(categoryId, paginationDto!)
            .then(data => res.json(data))
            .catch(error => this.handleError(error, res));
    }



    updateProduct = (req: Request, res: Response) => {
        //desestructuro el id de la request
        const { id } = req.params;

        //desectructuro el error y el dto del request
        const [error, updateProductDto] = UpdateProductDto.create(req.body);

        //si existe un error en el Dto lo capturo y envio como respuesta en el controller
        if (error) {
            res.status(400).json({ error });
            console.log("error en controller.products.updateProduct", error);
            return;
        }

        //creo una instancia del caso de uso y le paso el repositorio
        new UpdateProductUseCase(this.productRepository)
            .execute(id, updateProductDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res));
    }

}