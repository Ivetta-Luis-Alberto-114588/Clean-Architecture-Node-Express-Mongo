// src/domain/use-cases/cart/update-cart-item.use-case.ts
import { UpdateCartItemDto } from "../../dtos/cart/update-cart-item.dto";
import { CartEntity } from "../../entities/cart/cart.entity";
import { CustomError } from "../../errors/custom.error";
import { CartRepository } from "../../repositories/cart/cart.repository";
import { ProductRepository } from "../../repositories/products/product.repository";
// --- Importaciones necesarias para el placeholder ---
import { UserEntity } from "../../entities/user.entity";
import { NeighborhoodEntity } from "../../entities/customers/neighborhood";
import { CityEntity } from "../../entities/customers/citiy";
// --- Fin Importaciones ---


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
                // Esta llamada debería funcionar porque usa el CartMapper corregido
                return await this.cartRepository.removeItem(userId, updateDto.productId);
            } catch (error) {
                // Ignorar error si el carrito no existe o el item ya no está
                // Intentar obtener el carrito actual (usa CartMapper corregido)
                const currentCart = await this.cartRepository.getCartByUserId(userId);
                // Si no hay carrito, DEVOLVER EL PLACEHOLDER CORREGIDO
                return currentCart ?? await this.createEmptyCartPlaceholder(userId); // <--- PUNTO PROBLEMÁTICO
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
            // Esta llamada debería funcionar porque usa el CartMapper corregido
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

        // --- ¡¡CORRECCIÓN AQUÍ!! Pasar 10 argumentos ---
        const placeholderUser = new UserEntity(userId, 'Usuario (Placeholder)', 'placeholder@mail.com', '******', ['USER_ROLE']);
        const now = new Date();

        return new CartEntity(
            'placeholder-cart-id', // id
            userId,                // userId
            placeholderUser,       // user
            [],                    // items
            now,                   // createdAt
            now,                   // updatedAt
            0,                     // totalItems
            0,                     // subtotalWithoutTax
            0,                     // totalTaxAmount
            0                      // total
        );
        // --- FIN CORRECCIÓN ---
    }
}