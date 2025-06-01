import { OrderEntity } from "../../entities/order/order.entity";
import { OrderStatusEntity } from "../../entities/order/order-status.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderRepository } from "../../repositories/order/order.repository";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import logger from "../../../configs/logger";

interface IGroupedOrdersForDashboard {
    status: OrderStatusEntity;
    orders: OrderEntity[];
    totalOrdersInStatus: number; // Total de órdenes en este estado (puede ser > orders.length si hay paginación)
}

interface IGetOrdersForDashboardUseCase {
    execute(): Promise<IGroupedOrdersForDashboard[]>;
}

export class GetOrdersForDashboardUseCase implements IGetOrdersForDashboardUseCase {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly orderStatusRepository: OrderStatusRepository
    ) { }

    async execute(): Promise<IGroupedOrdersForDashboard[]> {
        try {
            // 1. Obtener todos los estados de pedido activos, ordenados
            const [statusError, paginationDto] = PaginationDto.create(1, 100); // Asumimos <100 estados
            if (statusError) throw CustomError.internalServerError('Error de paginación para estados');

            const { orderStatuses } = await this.orderStatusRepository.getAll(paginationDto!, true);
            if (!orderStatuses || orderStatuses.length === 0) {
                logger.warn("[DashboardUC] No se encontraron estados de pedido activos.");
                return [];
            }

            const groupedOrders: IGroupedOrdersForDashboard[] = [];

            // 2. Para cada estado, obtener una muestra de pedidos (ej. los 20 más recientes)
            // Usar Promise.all para eficiencia
            await Promise.all(orderStatuses.map(async (status) => {
                // Podrías tener un método específico en OrderRepository para esto,
                // o filtrar de una llamada más general si la cantidad de pedidos no es masiva.
                // Aquí un ejemplo simplificado usando findByCustomer con un ID "ficticio" de estado
                // Necesitarás un método findByStatus en OrderRepository.
                // Por ahora, simularemos filtrando de todos los pedidos.

                // Esto es ineficiente para muchos pedidos. Idealmente OrderRepository tendría:
                // findByStatus(statusId: string, pagination: PaginationDto): Promise<{total: number, orders: OrderEntity[]}>

                // Solución temporal (menos eficiente, pero funcional para demostración):
                // Obtener TODOS los pedidos y filtrar. NO RECOMENDADO PARA PRODUCCIÓN CON MUCHOS PEDIDOS.
                // Para una implementación real, crea `orderRepository.findByStatus(status.id, pagination)`.

                const [orderPageError, orderPaginationDto] = PaginationDto.create(1, 20); // Primeros 20 pedidos por estado
                if (orderPageError) throw CustomError.internalServerError('Error paginación para órdenes');

                // Supongamos que tenemos un orderRepository.findByStatus
                // Si no, necesitarías ajustar esta lógica.
                // const { orders, total } = await this.orderRepository.findByStatus(status.id, orderPaginationDto!);

                // Simulación si no tienes findByStatus:
                const allOrdersPaginated = await this.orderRepository.getAll(PaginationDto.create(1, 500)[1]!); // Carga muchos pedidos
                const ordersInThisStatus = allOrdersPaginated.orders.filter(o => o.status.id === status.id);
                const totalInThisStatus = allOrdersPaginated.orders.filter(o => o.status.id === status.id).length;


                groupedOrders.push({
                    status: status,
                    orders: ordersInThisStatus.slice(0, 20), // Tomar los primeros 20 para el dashboard
                    totalOrdersInStatus: totalInThisStatus
                });
            }));

            // Asegurar el orden de las columnas según el 'order' del OrderStatusEntity
            groupedOrders.sort((a, b) => a.status.order - b.status.order);

            logger.info(`[DashboardUC] Datos del dashboard preparados con ${groupedOrders.length} columnas de estado.`);
            return groupedOrders;

        } catch (error) {
            logger.error("[DashboardUC] Error ejecutando GetOrdersForDashboardUseCase:", error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al obtener datos para el dashboard de pedidos.");
        }
    }
}