import { CartEntity } from "../../entities/cart/cart.entity";
import { CustomError } from "../../errors/custom.error";
import { CartRepository } from "../../repositories/cart/cart.repository";

interface IRemoveFromCartUseCase {
    execute(userId: string, productId: string): Promise<CartEntity>;
}

export class RemoveFromCartUseCase implements IRemoveFromCartUseCase {

    constructor(private readonly cartRepository: CartRepository) { }

    async execute(userId: string, productId: string): Promise<CartEntity> {
        if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
            throw CustomError.badRequest("Se requiere un productId válido");
        }

        try {
            const updatedCart = await this.cartRepository.removeItem(userId, productId);
            return updatedCart;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            console.error("Error en RemoveFromCartUseCase:", error);
            throw CustomError.internalServerError("Error al eliminar producto del carrito");
        }
    }
}