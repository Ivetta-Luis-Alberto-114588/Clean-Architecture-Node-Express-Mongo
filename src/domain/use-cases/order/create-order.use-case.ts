// src/domain/use-cases/order/create-order.use-case.ts
import { CreateOrderDto } from "../../dtos/order/create-order.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { ProductRepository } from "../../repositories/products/product.repository";
import { OrderRepository } from "../../repositories/order/order.repository";
import { CouponRepository } from "../../repositories/coupon/coupon.repository";
import { CouponEntity } from "../../entities/coupon/coupon.entity";
import logger from "../../../configs/logger";
import { CustomerEntity } from "../../entities/customers/customer";
import { CreateCustomerDto } from "../../dtos/customers/create-customer.dto";
// import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";

interface ICreateOrderUseCase {
    execute(createOrderDto: CreateOrderDto, userId?: string): Promise<OrderEntity>;
}

export class CreateOrderUseCase implements ICreateOrderUseCase {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly productRepository: ProductRepository,
        private readonly couponRepository: CouponRepository,
        // private readonly neighborhoodRepository: NeighborhoodRepository
    ) { }

    async execute(createOrderDto: CreateOrderDto, userId?: string): Promise<OrderEntity> {
        let coupon: CouponEntity | null = null;
        let calculatedDiscountRate = 0;
        let couponIdToIncrement: string | null = null;
        let customerForOrder: CustomerEntity;
        let finalCustomerId: string;

        try {
            // --- Determinar/Crear Cliente ---
            if (userId) {
                // *** Escenario Usuario Autenticado ***
                logger.info(`Creando pedido para usuario autenticado: ${userId}`);
                // <<<--- Buscar Customer por userId --- >>>
                const existingCustomer = await this.customerRepository.findByUserId(userId);
                if (!existingCustomer) {
                    // Esto es un estado inconsistente, el cliente debería haberse creado al registrarse.
                    logger.error(`¡INCONSISTENCIA! No se encontró Customer para el User autenticado ${userId}.`);
                    throw CustomError.internalServerError('No se encontró el perfil de cliente para este usuario. Contacte a soporte.');
                }
                customerForOrder = existingCustomer;
                finalCustomerId = customerForOrder.id.toString();
                logger.info(`Cliente ${finalCustomerId} encontrado para usuario ${userId}`);

            } else {
                // *** Escenario Invitado ***
                logger.info(`Creando pedido para invitado. Email: ${createOrderDto.customerEmail}`);
                if (!createOrderDto.customerEmail || !createOrderDto.customerName || !createOrderDto.customerPhone || !createOrderDto.customerAddress || !createOrderDto.customerNeighborhoodId) {
                    throw CustomError.badRequest('Faltan datos del cliente invitado en la solicitud.');
                }

                const existingCustomer = await this.customerRepository.findByEmail(createOrderDto.customerEmail);

                if (existingCustomer) {
                    // Verificar si el cliente existente está vinculado a un usuario
                    if (existingCustomer.userId) {
                        logger.warn(`Intento de compra como invitado con email ${createOrderDto.customerEmail} que pertenece al usuario ${existingCustomer.userId}`);
                        throw CustomError.badRequest('Este email ya está registrado. Por favor, inicia sesión para completar tu compra.');
                    }
                    logger.info(`Cliente existente encontrado por email para invitado: ${existingCustomer.id}`);
                    customerForOrder = existingCustomer;
                    finalCustomerId = existingCustomer.id.toString();
                } else {
                    logger.info(`Creando nuevo registro de cliente para invitado con email: ${createOrderDto.customerEmail}`);
                    // await this.neighborhoodRepository.findById(createOrderDto.customerNeighborhoodId);

                    const [errorDto, createGuestDto] = CreateCustomerDto.create({
                        name: createOrderDto.customerName,
                        email: createOrderDto.customerEmail,
                        phone: createOrderDto.customerPhone,
                        address: createOrderDto.customerAddress,
                        neighborhoodId: createOrderDto.customerNeighborhoodId,
                    });
                    if (errorDto) throw CustomError.badRequest(`Datos de cliente invitado inválidos: ${errorDto}`);

                    customerForOrder = await this.customerRepository.create(createGuestDto!);
                    finalCustomerId = customerForOrder.id.toString();
                    logger.info(`Nuevo cliente invitado creado: ${finalCustomerId}`);
                }
            }
            // --- Fin Determinar/Crear Cliente ---

            // --- Lógica de Cupón (sin cambios respecto a la versión anterior) ---
            calculatedDiscountRate = 0; // Reiniciar por si acaso
            if (createOrderDto.couponCode) {
                logger.info(`Intentando aplicar cupón: ${createOrderDto.couponCode}`);
                coupon = await this.couponRepository.findByCode(createOrderDto.couponCode);

                if (!coupon) throw CustomError.badRequest(`Código de cupón '${createOrderDto.couponCode}' inválido.`);
                logger.debug(`Cupón encontrado: ${coupon.code} (ID: ${coupon.id})`);

                if (!coupon.isValidNow) throw CustomError.badRequest(`El cupón '${coupon.code}' no está activo o está fuera de fecha.`);
                if (coupon.isUsageLimitReached) throw CustomError.badRequest(`El cupón '${coupon.code}' ha alcanzado su límite de uso.`);

                let subtotalWithoutTaxForCouponCheck = 0;
                for (const itemDto of createOrderDto.items) {
                    const product = await this.productRepository.findById(itemDto.productId);
                    if (!product) throw CustomError.internalServerError(`Producto ${itemDto.productId} no encontrado durante validación de cupón.`);
                    subtotalWithoutTaxForCouponCheck += product.price * itemDto.quantity;
                }
                subtotalWithoutTaxForCouponCheck = Math.round(subtotalWithoutTaxForCouponCheck * 100) / 100;
                logger.debug(`Subtotal (sin IVA) para chequeo de cupón: ${subtotalWithoutTaxForCouponCheck}`);

                if (coupon.minPurchaseAmount && subtotalWithoutTaxForCouponCheck < coupon.minPurchaseAmount) {
                    throw CustomError.badRequest(`Se requiere una compra mínima de $${coupon.minPurchaseAmount} (sin IVA) para usar el cupón '${coupon.code}'.`);
                }

                let subtotalWithTaxForCouponCalc = 0;
                for (const itemDto of createOrderDto.items) {
                    subtotalWithTaxForCouponCalc += itemDto.unitPrice * itemDto.quantity;
                }
                subtotalWithTaxForCouponCalc = Math.round(subtotalWithTaxForCouponCalc * 100) / 100;
                logger.debug(`Subtotal (con IVA) para cálculo de descuento fijo: ${subtotalWithTaxForCouponCalc}`);

                if (coupon.discountType === 'percentage') {
                    calculatedDiscountRate = coupon.discountValue;
                } else if (coupon.discountType === 'fixed') {
                    calculatedDiscountRate = (subtotalWithTaxForCouponCalc > 0)
                        ? Math.min((coupon.discountValue / subtotalWithTaxForCouponCalc) * 100, 100)
                        : 0;
                }
                couponIdToIncrement = coupon.id;
                logger.info(`Cupón ${coupon.code} validado. Tasa de descuento final: ${calculatedDiscountRate.toFixed(2)}%. ID a incrementar: ${couponIdToIncrement}`);
            } else {
                calculatedDiscountRate = 0;
                logger.info('No se aplicó cupón. Tasa de descuento: 0%');
            }
            // --- Fin Lógica de Cupón ---

            // Llamar al repositorio con los datos necesarios
            logger.info(`Llamando a orderRepository.create`, {
                customerId: finalCustomerId,
                itemCount: createOrderDto.items.length,
                finalDiscountRate: calculatedDiscountRate,
                couponId: couponIdToIncrement
            });

            const createdOrder = await this.orderRepository.create(
                createOrderDto,
                calculatedDiscountRate,
                couponIdToIncrement,
                finalCustomerId // Pasar el ID del cliente determinado
            );

            logger.info(`Pedido creado exitosamente por UseCase: ${createdOrder.id}`);

            // await this.sendConfirmationEmail(customerForOrder, createdOrder);

            return createdOrder;

        } catch (error) {
            logger.error("Error en CreateOrderUseCase:", {
                error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error,
                userId: userId,
                guestEmail: createOrderDto.customerEmail,
                couponCode: createOrderDto.couponCode
            });
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError(`Error al crear la venta: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}