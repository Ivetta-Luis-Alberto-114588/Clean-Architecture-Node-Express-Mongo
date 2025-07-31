import { AddToCartUseCase } from '../../../../../src/domain/use-cases/cart/add-to-cart.use-case';
import { AddItemToCartDto } from '../../../../../src/domain/dtos/cart/add-item-to-cart.dto';
import { CartEntity } from '../../../../../src/domain/entities/cart/cart.entity';
import { CartItemEntity } from '../../../../../src/domain/entities/cart/cart-item.entity';
import { ProductEntity } from '../../../../../src/domain/entities/products/product.entity';
import { CategoryEntity } from '../../../../../src/domain/entities/products/category.entity';
import { UnitEntity } from '../../../../../src/domain/entities/products/unit.entity';
import { UserEntity } from '../../../../../src/domain/entities/user.entity';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('AddToCartUseCase', () => {
    const mockCartRepository = {
        getCartByUserId: jest.fn(),
        addItem: jest.fn(),
    };
    const mockProductRepository = {
        findById: jest.fn(),
    };
    const useCase = new AddToCartUseCase(
        mockCartRepository as any,
        mockProductRepository as any
    );
    const userId = 'user1234567890123456789012';
    const productId = '507f1f77bcf86cd799439011';
    const category = new CategoryEntity('cat1', 'Bebidas', 'desc');
    const unit = new UnitEntity('unit1', 'Litro', 'desc');
    const product = new ProductEntity(productId, 'Coca Cola', 100, 10, category, unit, '', true, '', 21, 121, []);
    const user = new UserEntity(userId, 'Test User', 'test@example.com', 'pass', ['USER']);
    const cartItem = new CartItemEntity(product, 1, 100, 21, 121, 121);
    const cart = new CartEntity('cart1', userId, user, [cartItem], new Date(), new Date(), 1, 100, 21, 121);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should add item to cart (happy path)', async () => {
        mockProductRepository.findById.mockResolvedValue(product);
        mockCartRepository.getCartByUserId.mockResolvedValue(cart);
        mockCartRepository.addItem.mockResolvedValue(cart);
        const [, addItemDto] = AddItemToCartDto.create({ productId, quantity: 1 });
        const result = await useCase.execute(userId, addItemDto!);
        expect(result).toBe(cart);
        expect(mockProductRepository.findById).toHaveBeenCalledWith(productId);
        expect(mockCartRepository.addItem).toHaveBeenCalledWith(userId, addItemDto);
    });

    it('should throw if product does not exist', async () => {
        mockProductRepository.findById.mockResolvedValue(null);
        const [, addItemDto] = AddItemToCartDto.create({ productId, quantity: 1 });
        await expect(useCase.execute(userId, addItemDto!)).rejects.toThrow(CustomError);
        await expect(useCase.execute(userId, addItemDto!)).rejects.toThrow('Producto con ID');
    });

    it('should throw if product is not active', async () => {
        mockProductRepository.findById.mockResolvedValue({ ...product, isActive: false });
        const [, addItemDto] = AddItemToCartDto.create({ productId, quantity: 1 });
        await expect(useCase.execute(userId, addItemDto!)).rejects.toThrow('no está disponible');
    });

    it('should throw if product stock is 0', async () => {
        mockProductRepository.findById.mockResolvedValue({ ...product, stock: 0 });
        const [, addItemDto] = AddItemToCartDto.create({ productId, quantity: 1 });
        await expect(useCase.execute(userId, addItemDto!)).rejects.toThrow('agotado');
    });

    it('should throw if adding more than available stock', async () => {
        mockProductRepository.findById.mockResolvedValue({ ...product, stock: 2 });
        mockCartRepository.getCartByUserId.mockResolvedValue({ ...cart, items: [{ ...cartItem, quantity: 2 }] });
        const [, addItemDto] = AddItemToCartDto.create({ productId, quantity: 2 });
        await expect(useCase.execute(userId, addItemDto!)).rejects.toThrow('Stock insuficiente');
    });

    it('should throw CustomError if repository throws CustomError', async () => {
        mockProductRepository.findById.mockResolvedValue(product);
        mockCartRepository.getCartByUserId.mockResolvedValue(cart);
        mockCartRepository.addItem.mockRejectedValue(CustomError.badRequest('fail repo'));
        const [, addItemDto] = AddItemToCartDto.create({ productId, quantity: 1 });
        await expect(useCase.execute(userId, addItemDto!)).rejects.toThrow('fail repo');
    });

    it('should throw internalServerError if repository throws unknown error', async () => {
        mockProductRepository.findById.mockResolvedValue(product);
        mockCartRepository.getCartByUserId.mockResolvedValue(cart);
        mockCartRepository.addItem.mockRejectedValue(new Error('fail unknown'));
        const [, addItemDto] = AddItemToCartDto.create({ productId, quantity: 1 });
        await expect(useCase.execute(userId, addItemDto!)).rejects.toThrow('Error al añadir producto al carrito');
    });
});
