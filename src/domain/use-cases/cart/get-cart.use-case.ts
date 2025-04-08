import { CartEntity } from "../../entities/cart/cart.entity";
import { CustomError } from "../../errors/custom.error";
import { CartRepository } from "../../repositories/cart/cart.repository";

interface IGetCartUseCase {
    execute(userId: string): Promise<CartEntity | null>;
}

export class GetCartUseCase implements IGetCartUseCase {

    constructor(private readonly cartRepository: CartRepository) { }

    async execute(userId: string): Promise<CartEntity | null> {
        try {
            const cart = await this.cartRepository.getCartByUserId(userId);
            // Si no hay carrito, devolvemos null. El controlador decidirá si crear uno vacío o devolver 404.
            return cart;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            console.error("Error en GetCartUseCase:", error);
            throw CustomError.internalServerError("Error al obtener el carrito");
        }
    }
}