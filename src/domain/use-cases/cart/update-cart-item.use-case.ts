import { UpdateCartItemDto } from "../../dtos/cart/update-cart-item.dto";
import { CartEntity } from "../../entities/cart/cart.entity";
import { CustomError } from "../../errors/custom.error";
import { CartRepository } from "../../repositories/cart/cart.repository";
import { ProductRepository } from "../../repositories/products/product.repository";

interface IUpdateCartItemUseCase {
    execute(userId: string, updateDto: UpdateCartItemDto): Promise<CartEntity>;
}

export class UpdateCartItemUseCase implements IUpdateCartItemUseCase {

    constructor(
        private readonly cartRepository: CartRepository,
        private readonly productRepository: ProductRepository,
    ) { }

    async execute(userId: string, updateDto: UpdateCartItemDto): Promise<CartEntity> {
        // 1. Validar que el producto exista (aunque ya debería estar en el carrito)
        const product = await this.productRepository.findById(updateDto.productId);
        if (!product) {
            // Si el producto no existe, pero estaba en el carrito, lo eliminamos del carrito.
            console.warn(`Producto ${updateDto.productId} no encontrado, eliminando del carrito ${userId}`);
            try {
                return await this.cartRepository.removeItem(userId, updateDto.productId);
            } catch (error) {
                // Ignorar error si el carrito no existe o el item ya no está
                return await this.cartRepository.getCartByUserId(userId) ?? await this.createEmptyCartPlaceholder(userId);
            }
        }

        // 2. Si la cantidad es > 0, validar stock (opcional, como en AddToCart)
        if (updateDto.quantity > 0) {
            if (updateDto.quantity > product.stock) {
                throw CustomError.badRequest(`Stock insuficiente para '${product.name}'. Disponible: ${product.stock}, Solicitado: ${updateDto.quantity}`);
            }
        }

        // 3. Llamar al repositorio para actualizar la cantidad (o eliminar si es 0)
        try {
            const updatedCart = await this.cartRepository.updateItemQuantity(userId, updateDto);
            return updatedCart;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            console.error("Error en UpdateCartItemUseCase:", error);
            throw CustomError.internalServerError("Error al actualizar item del carrito");
        }
    }

    // Helper para devolver un carrito vacío si no existe
    private async createEmptyCartPlaceholder(userId: string): Promise<CartEntity> {
        // Esta función es un placeholder. En una implementación real,
        // getCartByUserId debería devolver null y el controlador manejarlo.
        // O findOrCreate debería usarse siempre.
        return new CartEntity('temp-id', userId, {} as any, [], new Date(), new Date());
    }
}