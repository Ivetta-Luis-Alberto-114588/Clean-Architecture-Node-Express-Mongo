import { AddItemToCartDto } from "../../dtos/cart/add-item-to-cart.dto";
import { CartEntity } from "../../entities/cart/cart.entity";
import { CustomError } from "../../errors/custom.error";
import { CartRepository } from "../../repositories/cart/cart.repository";
import { ProductRepository } from "../../repositories/products/product.repository";

interface IAddToCartUseCase {
    execute(userId: string, addItemDto: AddItemToCartDto): Promise<CartEntity>;
}

export class AddToCartUseCase implements IAddToCartUseCase {

    constructor(
        private readonly cartRepository: CartRepository,
        private readonly productRepository: ProductRepository,
    ) { }

    async execute(userId: string, addItemDto: AddItemToCartDto): Promise<CartEntity> {
        // 1. Validar que el producto exista
        const product = await this.productRepository.findById(addItemDto.productId);
        if (!product) {
            throw CustomError.notFound(`Producto con ID ${addItemDto.productId} no encontrado`);
        }

        // 2. Validar que el producto esté activo
        if (!product.isActive) {
            throw CustomError.badRequest(`El producto '${product.name}' no está disponible actualmente`);
        }

        // 3. (Opcional pero recomendado) Validar Stock (aunque el stock real se descuenta en la venta)
        // Esto previene añadir más de lo disponible, aunque podría haber concurrencia.
        // La verificación final debe estar en CreateSaleUseCase.
        // Aquí sólo verificamos si hay *algo* de stock.
        if (product.stock <= 0) {
            throw CustomError.badRequest(`El producto '${product.name}' está agotado`);
        }
        // Podríamos verificar si la cantidad a añadir supera el stock,
        // pero depende de si queremos permitir añadir más y fallar al pagar,
        // o limitar desde el carrito. Limitaremos aquí por simplicidad:
        // --- Descomentar si se quiere verificar stock exacto al añadir ---
        const cart = await this.cartRepository.getCartByUserId(userId);
        const existingItem = cart?.items.find(item => item.product.id.toString() === addItemDto.productId);
        const currentQuantityInCart = existingItem?.quantity ?? 0;
        if ((currentQuantityInCart + addItemDto.quantity) > product.stock) {
            throw CustomError.badRequest(`Stock insuficiente para '${product.name}'. Disponible: ${product.stock}, En carrito: ${currentQuantityInCart}, Intentando añadir: ${addItemDto.quantity}`);
        }
        // --- Fin de verificación de stock exacto ---


        // 4. Llamar al repositorio para agregar/actualizar el item
        try {
            const updatedCart = await this.cartRepository.addItem(userId, addItemDto);
            return updatedCart;
        } catch (error) {
            // Manejo de errores específicos del repositorio si es necesario
            if (error instanceof CustomError) throw error;
            console.error("Error en AddToCartUseCase:", error);
            throw CustomError.internalServerError("Error al añadir producto al carrito");
        }
    }
}