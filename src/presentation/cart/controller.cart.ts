import { Request, Response } from "express";
import { CustomError } from "../../domain/errors/custom.error";
import { CartRepository } from "../../domain/repositories/cart/cart.repository";
import { ProductRepository } from "../../domain/repositories/products/product.repository";
import { AddItemToCartDto } from "../../domain/dtos/cart/add-item-to-cart.dto";
import { UpdateCartItemDto } from "../../domain/dtos/cart/update-cart-item.dto";
import { AddToCartUseCase } from "../../domain/use-cases/cart/add-to-cart.use-case";
import { GetCartUseCase } from "../../domain/use-cases/cart/get-cart.use-case";
import { RemoveFromCartUseCase } from "../../domain/use-cases/cart/remove-from-cart.use-case";
import { UpdateCartItemUseCase } from "../../domain/use-cases/cart/update-cart-item.use-case";
import { ClearCartUseCase } from "../../domain/use-cases/cart/clear-cart.use-case";
import { CartEntity } from "../../domain/entities/cart/cart.entity"; // Importar CartEntity
import logger from "../../configs/logger"; // Importar logger

export class CartController {

    // Inyectamos las dependencias necesarias
    constructor(
        private readonly cartRepository: CartRepository,
        private readonly productRepository: ProductRepository,
    ) { }

    private handleError = (error: unknown, res: Response, reqId?: string) => {
        const errorData = { error: 'Error interno del servidor', message: '', requestId: reqId };
        let statusCode = 500;

        if (error instanceof CustomError) {
            statusCode = error.statusCode;
            errorData.error = error.message;
        } else if (error instanceof Error) {
            errorData.message = error.message; // Incluir mensaje original en desarrollo/debug
        }

        // Loguear el error con el ID de la solicitud
        logger.error(`Error en CartController (ReqID: ${reqId || 'N/A'})`, {
            statusCode,
            errorMessage: errorData.error,
            originalError: error instanceof Error ? { message: error.message, stack: error.stack } : error,
            requestId: reqId
        });

        return res.status(statusCode).json(errorData);
    }    // Obtener el carrito del usuario actual
    getCart = (req: Request, res: Response) => {
        const userId = req.body.user?.id; // Obtenido del AuthMiddleware

        if (!userId) {
            return this.handleError(CustomError.unauthorized('Usuario no autenticado'), res);
        }

        new GetCartUseCase(this.cartRepository)
            .execute(userId)
            .then(cart => {
                if (!cart) {                    // Si no hay carrito, podemos devolver un carrito vacío o 404
                    // Devolver un carrito vacío suele ser más práctico para el frontend
                    logger.info(`Usuario ${userId} no tiene carrito, devolviendo vacío.`);
                    const emptyCart: CartEntity = { // Crear objeto que cumpla la interfaz
                        id: 'new',
                        userId: userId,
                        user: req.body.user, // Podemos añadir el usuario si lo tenemos
                        items: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        total: 0,
                        totalItems: 0,
                        totalTaxAmount: 0,
                        subtotalWithoutTax: 0,
                    };
                    return res.status(200).json(emptyCart);
                } logger.info(`Carrito obtenido para usuario ${userId}`);
                res.json(cart);
            })
            .catch(err => this.handleError(err, res));
    }    // Añadir un item al carrito
    addItem = (req: Request, res: Response) => {
        const userId = req.body.user?.id;

        if (!userId) {
            return this.handleError(CustomError.unauthorized('Usuario no autenticado'), res);
        }

        const [error, addItemDto] = AddItemToCartDto.create(req.body); if (error) {
            logger.warn(`Error de validación en addItem para usuario ${userId}: ${error}`);
            return res.status(400).json({ error });
        }

        new AddToCartUseCase(this.cartRepository, this.productRepository)
            .execute(userId, addItemDto!)
            .then(cart => {
                logger.info(`Item añadido/actualizado para usuario ${userId}, producto ${addItemDto!.productId}`);
                res.status(200).json(cart); // Usar 200 para indicar éxito en la adición/actualización
            })
            .catch(err => this.handleError(err, res));
    }    // Actualizar la cantidad de un item
    updateItem = (req: Request, res: Response) => {
        const userId = req.body.user?.id;
        const { productId } = req.params;

        if (!userId) {
            return this.handleError(CustomError.unauthorized('Usuario no autenticado'), res);
        } const [error, updateDto] = UpdateCartItemDto.create({ ...req.body, productId });
        if (error) {
            logger.warn(`Error de validación en updateItem para usuario ${userId}, producto ${productId}: ${error}`);
            return res.status(400).json({ error });
        }

        new UpdateCartItemUseCase(this.cartRepository, this.productRepository)
            .execute(userId, updateDto!)
            .then(cart => {
                logger.info(`Item actualizado para usuario ${userId}, producto ${productId}`);
                res.json(cart);
            })
            .catch(err => this.handleError(err, res));
    }    // Eliminar un item del carrito
    removeItem = (req: Request, res: Response) => {
        const userId = req.body.user?.id;
        const { productId } = req.params;

        if (!userId) {
            return this.handleError(CustomError.unauthorized('Usuario no autenticado'), res);
        }

        if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
            logger.warn(`Intento de eliminar item con ID inválido: ${productId} por usuario ${userId}`);
            return res.status(400).json({ error: 'Se requiere un productId válido' });
        } new RemoveFromCartUseCase(this.cartRepository)
            .execute(userId, productId)
            .then(cart => {
                logger.info(`Item eliminado para usuario ${userId}, producto ${productId}`);
                res.json(cart);
            })
            .catch(err => this.handleError(err, res));
    }    // Vaciar el carrito completo
    clearCart = (req: Request, res: Response) => {
        const userId = req.body.user?.id;

        if (!userId) {
            return this.handleError(CustomError.unauthorized('Usuario no autenticado'), res);
        } new ClearCartUseCase(this.cartRepository)
            .execute(userId)
            .then(cart => {
                logger.info(`Carrito vaciado para usuario ${userId}`);
                res.json(cart);
            })
            .catch(err => this.handleError(err, res));
    }
}