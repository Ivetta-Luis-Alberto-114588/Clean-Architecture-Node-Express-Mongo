// src/domain/use-cases/order/create-order.use-case.ts
import { CreateOrderDto } from "../../dtos/order/create-order.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { OrderRepository } from "../../repositories/order/order.repository";
import { ProductRepository } from "../../repositories/products/product.repository";
import { CouponRepository } from "../../repositories/coupon/coupon.repository";
import { CouponEntity } from "../../entities/coupon/coupon.entity";
import { CustomerEntity } from "../../entities/customers/customer";
import { CreateCustomerDto } from "../../dtos/customers/create-customer.dto";
import { ILogger } from "../../interfaces/logger.interface";
import { NotificationService } from "../../interfaces/services/notification.service";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";
import { CityRepository } from "../../repositories/customers/city.repository";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";

interface ICreateOrderUseCase {
    execute(createOrderDto: CreateOrderDto, userId?: string): Promise<OrderEntity>;
}

// <<<--- Interfaz para detalles resueltos (para pasar al repositorio) --- >>>
interface ResolvedShippingDetails {
    recipientName: string; phone: string; streetAddress: string; postalCode?: string;
    neighborhoodName: string; cityName: string; additionalInfo?: string;
    originalAddressId?: string; originalNeighborhoodId: string; originalCityId: string;
}


export class CreateOrderUseCase implements ICreateOrderUseCase {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly productRepository: ProductRepository,
        private readonly couponRepository: CouponRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository,
        private readonly cityRepository: CityRepository,
        private readonly orderStatusRepository: OrderStatusRepository,
        private readonly notificationService: NotificationService,
        private readonly logger: ILogger
    ) { }

    async execute(createOrderDto: CreateOrderDto, userId?: string): Promise<OrderEntity> {
        let coupon: CouponEntity | null = null;
        let calculatedDiscountRate = 0;
        let couponIdToIncrement: string | null = null;
        let customerForOrder: CustomerEntity;
        let finalCustomerId: string;
        let resolvedShippingDetails: ResolvedShippingDetails | undefined;

        try {
            // --- 0. Obtener estado por defecto para la orden ---
            const defaultStatus = await this.orderStatusRepository.findDefault();
            if (!defaultStatus) {
                throw CustomError.internalServerError('No se encontró un estado por defecto para pedidos. Configure uno en el sistema.');
            }

            // --- 1. Determinar/Crear Cliente ---
            if (userId) {
                const existingCustomer = await this.customerRepository.findByUserId(userId);
                if (!existingCustomer) throw CustomError.internalServerError('Perfil de cliente no encontrado para usuario autenticado.');
                customerForOrder = existingCustomer;
                finalCustomerId = customerForOrder.id.toString();
                this.logger.info(`[CreateOrderUC] Cliente ${finalCustomerId} encontrado para User ${userId}`);
            } else {
                this.logger.info(`[CreateOrderUC] Procesando pedido para invitado. Email: ${createOrderDto.customerEmail}`);

                // Verificar datos básicos del cliente
                if (!createOrderDto.customerEmail || !createOrderDto.customerName) {
                    throw CustomError.badRequest('Faltan datos básicos del cliente invitado (email y nombre).');
                }

                const existingGuest = await this.customerRepository.findByEmail(createOrderDto.customerEmail);
                if (existingGuest) {
                    if (existingGuest.userId) throw CustomError.badRequest('Email ya registrado. Inicia sesión.');
                    customerForOrder = existingGuest;
                    finalCustomerId = existingGuest.id.toString();
                    this.logger.info(`[CreateOrderUC] Cliente invitado existente ${finalCustomerId} encontrado por email.`);
                } else {
                    // Para crear un cliente invitado necesitamos al menos un barrio (usaremos uno temporal si no hay dirección)
                    let neighborhoodId = createOrderDto.shippingNeighborhoodId;

                    // Si no hay neighborhoodId, usar uno temporal/default para permitir la creación del cliente
                    if (!neighborhoodId) {
                        // Buscar un barrio por defecto o usar el primero disponible
                        try {
                            const { NeighborhoodModel } = await import('../../../data/mongodb/models/customers/neighborhood.model');
                            const defaultNeighborhood = await NeighborhoodModel.findOne().limit(1);
                            if (defaultNeighborhood) {
                                neighborhoodId = defaultNeighborhood._id.toString();
                                this.logger.info(`[CreateOrderUC] Usando barrio temporal para cliente invitado: ${neighborhoodId}`);
                            } else {
                                throw CustomError.internalServerError('No hay barrios configurados en el sistema.');
                            }
                        } catch (error) {
                            this.logger.error('Error obteniendo barrio temporal:', error);
                            throw CustomError.internalServerError('Error al crear cliente invitado.');
                        }
                    } else {
                        // Verificar que el barrio existe antes de crear cliente
                        await this.neighborhoodRepository.findById(neighborhoodId);
                    }

                    const [errorDto, createGuestDto] = CreateCustomerDto.create({
                        name: createOrderDto.customerName,
                        email: createOrderDto.customerEmail,
                        phone: createOrderDto.shippingPhone || '00000000',
                        address: createOrderDto.shippingStreetAddress || 'Dirección Pendiente',
                        neighborhoodId: neighborhoodId,
                    });
                    if (errorDto) throw CustomError.badRequest(`Datos cliente invitado inválidos: ${errorDto}`);

                    customerForOrder = await this.customerRepository.create(createGuestDto!);
                    finalCustomerId = customerForOrder.id.toString();
                    this.logger.info(`[CreateOrderUC] Nuevo cliente invitado creado: ${finalCustomerId}`);
                }
            }            // --- 2. Verificar si método de entrega requiere dirección y resolver dirección de envío ---
            let requiresAddress = true; // Default por seguridad
            let resolvedShippingDetails: ResolvedShippingDetails | undefined;

            // Verificar el método de entrega para determinar si requiere dirección
            if (createOrderDto.deliveryMethodId) {
                try {
                    const { DeliveryMethodModel } = await import('../../../data/mongodb/models/delivery-method.model');
                    const deliveryMethod = await DeliveryMethodModel.findById(createOrderDto.deliveryMethodId);

                    if (deliveryMethod) {
                        requiresAddress = deliveryMethod.requiresAddress;
                        this.logger.info(`[CreateOrderUC] Método de entrega: ${deliveryMethod.code}, requiresAddress: ${requiresAddress}`);
                    } else {
                        throw CustomError.badRequest("Método de entrega no encontrado");
                    }
                } catch (error) {
                    this.logger.error('Error obteniendo método de entrega:', error);
                    throw CustomError.internalServerError("Error al verificar método de entrega");
                }
            }

            // Solo resolver dirección si el método de entrega la requiere
            if (requiresAddress) {
                if (createOrderDto.selectedAddressId) {
                    if (!userId) throw CustomError.badRequest("Invitados no pueden seleccionar direcciones.");
                    const selectedAddress = await this.customerRepository.findAddressById(createOrderDto.selectedAddressId);
                    if (!selectedAddress) throw CustomError.notFound("Dirección seleccionada no encontrada.");
                    if (selectedAddress.customerId !== finalCustomerId) throw CustomError.forbiden("No tienes permiso para usar esta dirección.");
                    if (!selectedAddress.neighborhood || !selectedAddress.city) throw CustomError.internalServerError(`Dirección ${selectedAddress.id} sin datos de barrio/ciudad.`);
                    resolvedShippingDetails = {
                        recipientName: selectedAddress.recipientName, phone: selectedAddress.phone, streetAddress: selectedAddress.streetAddress,
                        postalCode: selectedAddress.postalCode, neighborhoodName: selectedAddress.neighborhood.name, cityName: selectedAddress.city.name,
                        additionalInfo: selectedAddress.additionalInfo, originalAddressId: selectedAddress.id,
                        originalNeighborhoodId: selectedAddress.neighborhood.id.toString(), originalCityId: selectedAddress.city.id.toString(),
                    };
                    this.logger.info(`[CreateOrderUC] Usando dirección guardada ${selectedAddress.id}`);

                } else if (createOrderDto.shippingStreetAddress) {
                    if (!createOrderDto.shippingNeighborhoodId) throw CustomError.badRequest("Falta ID de barrio para dirección de envío.");
                    const neighborhood = await this.neighborhoodRepository.findById(createOrderDto.shippingNeighborhoodId);
                    if (!neighborhood) throw CustomError.badRequest("Barrio de envío no encontrado.");
                    let city = neighborhood.city; // Asumir populado
                    if (!city || typeof city !== 'object') {
                        const cityFromRepo = await this.cityRepository.findById(city?.toString() || createOrderDto.shippingCityId || neighborhood.city.id.toString());
                        if (!cityFromRepo) throw CustomError.badRequest("Ciudad de envío no encontrada.");
                        city = cityFromRepo;
                    }
                    resolvedShippingDetails = {
                        recipientName: createOrderDto.shippingRecipientName!, phone: createOrderDto.shippingPhone!, streetAddress: createOrderDto.shippingStreetAddress!,
                        postalCode: createOrderDto.shippingPostalCode, neighborhoodName: neighborhood.name, cityName: city.name,
                        additionalInfo: createOrderDto.shippingAdditionalInfo, originalAddressId: undefined,
                        originalNeighborhoodId: neighborhood.id.toString(), originalCityId: city.id.toString(),
                    };
                    this.logger.info(`[CreateOrderUC] Usando dirección de envío proporcionada.`);

                } else {
                    // Ni seleccionó ni proporcionó: Intentar usar la default si es usuario registrado
                    if (!userId) throw CustomError.badRequest("Invitados deben proporcionar dirección de envío.");

                    this.logger.info(`[CreateOrderUC] No se seleccionó ni proporcionó dirección. Buscando default para cliente ${finalCustomerId}`);
                    const [pgError, pgDto] = PaginationDto.create(1, 1); // Buscar solo 1
                    if (pgError) throw CustomError.internalServerError("Error creando paginación para buscar dirección default.");
                    const addresses = await this.customerRepository.getAddressesByCustomerId(finalCustomerId, pgDto!);
                    const defaultAddress = addresses.find(a => a.isDefault);

                    if (!defaultAddress) throw CustomError.badRequest("No se encontró dirección predeterminada y no se proporcionó una nueva.");
                    if (!defaultAddress.neighborhood || !defaultAddress.city) throw CustomError.internalServerError(`Dirección default ${defaultAddress.id} sin datos de barrio/ciudad.`);

                    resolvedShippingDetails = {
                        recipientName: defaultAddress.recipientName, phone: defaultAddress.phone, streetAddress: defaultAddress.streetAddress,
                        postalCode: defaultAddress.postalCode, neighborhoodName: defaultAddress.neighborhood.name, cityName: defaultAddress.city.name,
                        additionalInfo: defaultAddress.additionalInfo, originalAddressId: defaultAddress.id,
                        originalNeighborhoodId: defaultAddress.neighborhood.id.toString(), originalCityId: defaultAddress.city.id.toString(),
                    };
                    this.logger.info(`[CreateOrderUC] Usando dirección default encontrada ${defaultAddress.id}`);
                }
            } else {
                // Método de entrega NO requiere dirección (ej: PICKUP)
                this.logger.info(`[CreateOrderUC] Método de entrega no requiere dirección, omitiendo resolución de dirección`);
                resolvedShippingDetails = undefined; // No se necesita dirección
            }

            // --- 3. Lógica de Cupón ---
            calculatedDiscountRate = 0;
            if (createOrderDto.couponCode) {
                coupon = await this.couponRepository.findByCode(createOrderDto.couponCode);
                if (!coupon) throw CustomError.badRequest(`Cupón '${createOrderDto.couponCode}' inválido.`);
                if (!coupon.isValidNow || coupon.isUsageLimitReached) throw CustomError.badRequest(`Cupón '${createOrderDto.couponCode}' no aplicable.`);
                let subtotalForCouponCheck = 0;
                for (const itemDto of createOrderDto.items) {
                    const product = await this.productRepository.findById(itemDto.productId); // Podría optimizarse guardando productos ya buscados
                    if (!product) throw CustomError.internalServerError(`Producto ${itemDto.productId} no encontrado.`);
                    subtotalForCouponCheck += product.price * itemDto.quantity;
                }
                subtotalForCouponCheck = Math.round(subtotalForCouponCheck * 100) / 100;
                if (coupon.minPurchaseAmount && subtotalForCouponCheck < coupon.minPurchaseAmount) throw CustomError.badRequest(`Compra mínima $${coupon.minPurchaseAmount} (s/IVA) para cupón '${coupon.code}'.`);
                let subtotalWithTaxForCouponCalc = createOrderDto.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
                subtotalWithTaxForCouponCalc = Math.round(subtotalWithTaxForCouponCalc * 100) / 100;
                if (coupon.discountType === 'percentage') calculatedDiscountRate = coupon.discountValue;
                else calculatedDiscountRate = (subtotalWithTaxForCouponCalc > 0) ? Math.min((coupon.discountValue / subtotalWithTaxForCouponCalc) * 100, 100) : 0;
                couponIdToIncrement = coupon.id;
                this.logger.info(`[CreateOrderUC] Cupón ${coupon.code} validado. Tasa desc: ${calculatedDiscountRate.toFixed(2)}%`);
            }

            // --- 4. Llamar al repositorio de Pedidos ---
            this.logger.info(`[CreateOrderUC] Llamando a orderRepository.create con Cliente: ${finalCustomerId}`); const createdOrder = await this.orderRepository.create(
                createOrderDto, calculatedDiscountRate, couponIdToIncrement, finalCustomerId,
                resolvedShippingDetails, defaultStatus.id // Pasar el ID del estado por defecto
            );
            this.logger.info(`[CreateOrderUC] Pedido creado exitosamente: ${createdOrder.id}`);

            // --- 5. Enviar notificación de nueva orden ---            // COMENTADO: La notificación ahora se maneja desde el frontend cuando el pago es exitoso
            /*
            try {
                await this.notificationService.sendOrderNotification({
                    orderId: createdOrder.id,
                    customerName: createdOrder.customer?.name || 'Cliente',
                    total: createdOrder.total, items: createdOrder.items.map(item => ({
                        name: item.product?.name || 'Producto',
                        quantity: item.quantity,
                        price: item.unitPrice
                    }))
                });
                this.logger.info(`[CreateOrderUC] Notificación enviada para orden: ${createdOrder.id}`);
            } catch (notificationError) {
                // No fallar la creación de la orden por errores de notificación
                this.logger.warn(`[CreateOrderUC] Error enviando notificación para orden ${createdOrder.id}`, {
                    error: notificationError as Error
                });
            }
            */
            this.logger.info(`[CreateOrderUC] Orden creada exitosamente: ${createdOrder.id}. Notificación se enviará desde frontend cuando pago sea confirmado. VERSION: 2024-06-24-21:15`);

            return createdOrder;

        } catch (error) {
            this.logger.error("[CreateOrderUC] Error ejecutando:", { error: error instanceof Error ? { message: error.message, stack: error.stack } : error, userId, dto: createOrderDto });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al crear la venta: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
