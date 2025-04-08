import { CartEntity } from "../../entities/cart/cart.entity";
import { CustomError } from "../../errors/custom.error";
import { CartRepository } from "../../repositories/cart/cart.repository";

interface IClearCartUseCase {
    execute(userId: string): Promise<CartEntity>;
}

export class ClearCartUseCase implements IClearCartUseCase {

    constructor(private readonly cartRepository: CartRepository) { }

    async execute(userId: string): Promise<CartEntity> {
        try {
            const updatedCart = await this.cartRepository.clearCart(userId);
            return updatedCart;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            console.error("Error en ClearCartUseCase:", error);
            throw CustomError.internalServerError("Error al vaciar el carrito");
        }
    }
}