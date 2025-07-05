// src/infrastructure/datasources/chatbot/chat.mongo.datasource.impl.ts
import mongoose from "mongoose";
import { ChatDatasource } from "../../../domain/datasources/chatbot/chat.datasource";
import { ChatMessageEntity, ChatSessionEntity, MessageRole } from "../../../domain/entities/chatbot/chat-message.entity";
import { ChatQueryDto } from "../../../domain/dtos/chatbot/chat-query.dto";
import { CustomError } from "../../../domain/errors/custom.error";
import { ChatMessageModel, ChatSessionModel, EmbeddingModel } from "../../../data/mongodb/models/chatbot/chat-models";
import { LangchainAdapter } from "../../adapters/langchain.adapter";
import { TransformersAdapter } from "../../adapters/transformers.adapter";
import { ProductModel } from "../../../data/mongodb/models/products/product.model";
import { CategoryModel } from "../../../data/mongodb/models/products/category.model";
import { OrderModel } from "../../../data/mongodb/models/order/order.model";
import { CustomerModel } from "../../../data/mongodb/models/customers/customer.model";
import { CategoryEntity } from "../../../domain/entities/products/category.entity";
import { UnitModel } from "../../../data/mongodb/models/products/unit.model";
import { NeighborhoodModel } from "../../../data/mongodb/models/customers/neighborhood.model";
import { CityModel } from "../../../data/mongodb/models/customers/city.model";
import { PaymentModel } from "../../../data/mongodb/models/payment/payment.model";

export class ChatMongoDatasourceImpl implements ChatDatasource {
    private readonly langchainAdapter: LangchainAdapter;
    private readonly transformersAdapter: TransformersAdapter;
    private readonly isAIAvailable: boolean;

    constructor() {
        this.langchainAdapter = LangchainAdapter.getInstance();
        this.transformersAdapter = TransformersAdapter.getInstance();
        this.isAIAvailable = this.transformersAdapter.isFeatureAvailable();
    }

    private async safeGenerateEmbedding(text: string): Promise<number[] | null> {
        if (!this.isAIAvailable) {
            console.warn('⚠️ [ChatMongoDatasourceImpl] Embeddings no disponibles - saltando generación');
            return null;
        }
        try {
            return await this.safeGenerateEmbedding(text);
        } catch (error) {
            console.error('❌ [ChatMongoDatasourceImpl] Error generando embedding:', error);
            return null;
        }
    }

    async query(chatQueryDto: ChatQueryDto): Promise<string> {
        try {
            const { query, sessionId, userType } = chatQueryDto;

            // Input validation
            if (!query || query.trim().length === 0) {
                throw CustomError.badRequest('La consulta no puede estar vacía');
            }

            // Si las funcionalidades de IA no están disponibles, devolver mensaje informativo
            if (!this.isAIAvailable) {
                return 'Lo siento, las funcionalidades de chat inteligente no están disponibles en este momento. Por favor, contacta con nuestro equipo de soporte para obtener ayuda.';
            }

            // Obtener historial de mensajes si hay sessionId
            let chatHistory: ChatMessageEntity[] = [];
            if (sessionId) {
                const session = await this.getSession(sessionId);
                if (session) {
                    chatHistory = session.messages;
                }
            }

            // Buscar contexto relevante
            const searchResults = await this.langchainAdapter.searchSimilarContent(query, userType);
            console.log('Resultados de búsqueda:', searchResults);

            const context = searchResults.map(result => result.text);
            console.log('Contexto:', context);

            // Generar respuesta
            const response = await this.langchainAdapter.generateResponse(query, context, chatHistory, userType);
            console.log('Respuesta generada:', response);

            return response;
        } catch (error) {
            console.error('Error al procesar consulta:', error);
            if (error instanceof CustomError) {
                throw error;
            }

            // More detailed error handling
            if ((error as any).isAxiosError && (error as any).response) {
                const axiosError = error as any;
                const status = axiosError.response.status;
                const data = (error as any).response.data;
                throw CustomError.internalServerError(`Error en la API de Claude (${status}): ${JSON.stringify(data)}`);
            }

            if (error instanceof Error) {
                throw CustomError.internalServerError('Error al procesar consulta: ' + (error.message || 'Error desconocido'));
            }
            throw CustomError.internalServerError('Error al procesar consulta: Error desconocido');
        }
    }

    async saveMessage(sessionId: string, role: string, content: string): Promise<ChatMessageEntity> {
        try {
            const message = await ChatMessageModel.create({
                sessionId,
                role,
                content,
                timestamp: new Date()
            });

            // Actualizar timestamp de la sesión
            await ChatSessionModel.findByIdAndUpdate(
                sessionId,
                { updatedAt: new Date() }
            );

            return {
                id: message._id.toString(),
                sessionId: message.sessionId.toString(),
                role: role as MessageRole,
                content: message.content,
                timestamp: message.timestamp,
                metadata: message.metadata
            };
        } catch (error) {
            console.error('Error al guardar mensaje:', error);
            throw CustomError.internalServerError('Error al guardar mensaje');
        }
    }

    async getSession(sessionId: string): Promise<ChatSessionEntity | null> {
        try {
            const session = await ChatSessionModel.findById(sessionId);
            if (!session) return null;

            // Obtener mensajes de la sesión
            const messages = await ChatMessageModel.find({ sessionId }).sort('timestamp');

            return {
                id: session._id.toString(),
                userType: session.userType,
                messages: messages.map(msg => ({
                    id: msg._id.toString(),
                    sessionId: msg.sessionId.toString(),
                    role: msg.role as MessageRole,
                    content: msg.content,
                    timestamp: msg.timestamp,
                    metadata: msg.metadata
                })),
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            };
        } catch (error) {
            console.error('Error al obtener sesión:', error);
            throw CustomError.internalServerError('Error al obtener sesión');
        }
    }

    async createSession(userType: 'customer' | 'owner'): Promise<ChatSessionEntity> {
        try {
            const session = await ChatSessionModel.create({
                userType,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Mensaje de bienvenida basado en el tipo de usuario
            const welcomeMessage = userType === 'owner'
                ? "Bienvenido al asistente para dueños. Puedo ayudarte con análisis de ventas, productos más vendidos y otras métricas de tu negocio."
                : "¡Hola! Soy el asistente virtual de la tienda. ¿En qué puedo ayudarte hoy?";

            // Guardar mensaje de bienvenida
            await ChatMessageModel.create({
                sessionId: session._id,
                role: 'assistant',
                content: welcomeMessage,
                timestamp: new Date()
            });

            return {
                id: session._id.toString(),
                userType: session.userType,
                messages: [{
                    id: 'welcome',
                    sessionId: session._id.toString(),
                    role: MessageRole.ASSISTANT,
                    content: welcomeMessage,
                    timestamp: new Date()
                }],
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            };
        } catch (error) {
            console.error('Error al crear sesión:', error);
            throw CustomError.internalServerError('Error al crear sesión');
        }
    }

    async getSessions(): Promise<ChatSessionEntity[]> {
        try {
            const sessions = await ChatSessionModel.find().sort('-updatedAt');

            const sessionEntities: ChatSessionEntity[] = [];
            for (const session of sessions) {
                const messages = await ChatMessageModel.find({ sessionId: session._id }).sort('timestamp');

                sessionEntities.push({
                    id: session._id.toString(),
                    userType: session.userType,
                    messages: messages.map(msg => ({
                        id: msg._id.toString(),
                        sessionId: msg.sessionId.toString(),
                        role: msg.role as MessageRole,
                        content: msg.content,
                        timestamp: msg.timestamp,
                        metadata: msg.metadata
                    })),
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt
                });
            }

            return sessionEntities;
        } catch (error) {
            console.error('Error al obtener sesiones:', error);
            throw CustomError.internalServerError('Error al obtener sesiones');
        }
    }

    async generateEmbeddings(): Promise<void> {
        try {
            console.log("Iniciando generación de embeddings...");

            // Vaciar colección de embeddings existente
            await EmbeddingModel.deleteMany({});

            // Generar embeddings para productos
            await this.generateProductEmbeddings();

            // Generar embeddings para categorías
            await this.generateCategoryEmbeddings();

            // Generar embeddings para ventas (accesibles solo para dueños)
            await this.generateSalesEmbeddings();

            // Generar embeddings para clientes (accesibles solo para dueños)
            await this.generateCustomerEmbeddings();


            // Generar embeddings para los nuevos modelos
            await this.generateCityEmbeddings();
            await this.generateNeighborhoodEmbeddings();
            await this.generateUnitEmbeddings();
            await this.generatePaymentEmbeddings();

            console.log("Generación de embeddings completada");

            // Validar y reportar el estado de los embeddings
            await this.validateEmbeddings();

        } catch (error) {
            console.error('Error en generación de embeddings:', error);
            throw CustomError.internalServerError('Error en generación de embeddings');
        }
    }



    private async generateProductEmbeddings(): Promise<void> {
        const products = await ProductModel.find({ isActive: true }).populate(['category', 'unit']);

        for (const product of products) {
            // Crear texto representativo del producto
            const text = `Producto: ${product.name}. 
            Descripción: ${product.description || 'No disponible'}. 
            Precio: ${product.price}. 
            Stock disponible: ${product.stock}. 
            Categoría: ${product.category && (product.category as any).name || 'No especificada'}.
            Unidad: ${product.unit && (product.unit as any).name || 'No especificada'}.`;;

            // Generar embedding
            const embedding = await this.safeGenerateEmbedding(text);

            // Solo guardar si se pudo generar el embedding
            if (embedding) {
                await EmbeddingModel.create({
                    objectId: product._id,
                    collectionName: 'Product',
                    embedding,
                    text,
                    metadata: {
                        name: product.name,
                        price: product.price,
                        stock: product.stock,
                        category: product.category && (product.category as any).name || 'No especificada',
                        unit: product.unit && (product.unit as any).name || 'No especificada'
                    }
                });
            }
        }

        console.log(`Embeddings generados para ${products.length} productos`);
    }

    private async generateCategoryEmbeddings(): Promise<void> {
        const categories = await CategoryModel.find({ isActive: true });

        for (const category of categories) {
            // Texto representativo
            const text = `Categoría: ${category.name}. Descripción: ${category.description || 'No disponible'}.`;

            // Generar embedding
            const embedding = await this.safeGenerateEmbedding(text);

            // Solo guardar si se pudo generar el embedding
            if (embedding) {
                await EmbeddingModel.create({
                    objectId: category._id,
                    collectionName: 'Category',
                    embedding,
                    text,
                    metadata: {
                        name: category.name,
                        description: category.description
                    }
                });
            }
        }

        console.log(`Embeddings generados para ${categories.length} categorías`);
    }

    private async generateSalesEmbeddings(): Promise<void> {
        const sales = await OrderModel.find()
            .populate({
                path: 'customer',
                populate: {
                    path: 'neighborhood',
                    populate: { path: 'city' }
                }
            })
            .populate({
                path: 'items.product',
                populate: [
                    { path: 'category' },
                    { path: 'unit' }
                ]
            })
            .sort('-date')
            .limit(500); // Limitamos a las 500 ventas más recientes para eficiencia

        for (const sale of sales) {
            // Productos en la venta
            const itemsText = sale.items.map(item =>
                `${item.quantity} x ${item.product && (item.product as any).name || 'Producto desconocido'} a ${item.unitPrice} cada uno`
            ).join(', ');

            // Texto representativo de la venta
            const text = `Venta ID: ${sale._id}. 
            Fecha: ${sale.date.toISOString().split('T')[0]}. 
            Cliente: ${sale.customer && (sale.customer as any).name || 'No especificado'}. 
            Estado: ${sale.status}. 
            Productos: ${itemsText}. 
            Subtotal: ${sale.subtotal}. 
            Total: ${sale.total}.`;

            // Generar embedding
            const embedding = await this.safeGenerateEmbedding(text);

            // Solo guardar si se pudo generar el embedding
            if (embedding) {
                await EmbeddingModel.create({
                    objectId: sale._id,
                    collectionName: 'Sale',
                    embedding,
                    text,
                    metadata: {
                        date: sale.date,
                        customer: sale.customer && (sale.customer as any).name,
                        status: sale.status,
                        total: sale.total,
                        items: sale.items.length
                    }
                });
            }
        }

        console.log(`Embeddings generados para ${sales.length} ventas`);
    }



    private async generateCustomerEmbeddings(): Promise<void> {
        const customers = await CustomerModel.find({ isActive: true })
            .populate({
                path: 'neighborhood',
                populate: { path: 'city' }
            });

        for (const customer of customers) {
            // Texto representativo del cliente
            const text = `Cliente: ${customer.name}. 
            Email: ${customer.email}. 
            Teléfono: ${customer.phone}. 
            Dirección: ${customer.address}. 
            Barrio: ${customer.neighborhood && (customer.neighborhood as any).name || 'No especificado'}. 
            Ciudad: ${customer.neighborhood && (customer.neighborhood as any).city.name || 'No especificada'}.`;

            // Generar embedding
            const embedding = await this.safeGenerateEmbedding(text);

            // Solo guardar si se pudo generar el embedding
            if (embedding) {
                await EmbeddingModel.create({
                    objectId: customer._id,
                    collectionName: 'Customer',
                    embedding,
                    text,
                    metadata: {
                        name: customer.name,
                        email: customer.email,
                        neighborhood: customer.neighborhood && (customer.neighborhood as any).name,
                        city: customer.neighborhood && (customer.neighborhood as any).city.name
                    }
                });
            }
        }

        console.log(`Embeddings generados para ${customers.length} clientes`);
    }


    // Método para generar embeddings de las ciudades
    private async generateCityEmbeddings(): Promise<void> {
        const cities = await CityModel.find({ isActive: true });

        for (const city of cities) {
            // Texto representativo
            const text = `Ciudad: ${city.name}. 
        Descripción: ${city.description || 'No disponible'}.`;

            // Generar embedding
            const embedding = await this.safeGenerateEmbedding(text);

            // Solo guardar si se pudo generar el embedding
            if (embedding) {
                await EmbeddingModel.create({
                    objectId: city._id,
                    collectionName: 'City',
                    embedding,
                    text,
                    metadata: {
                        name: city.name,
                        description: city.description,
                        isActive: city.isActive
                    }
                });
            }
        }

        console.log(`Embeddings generados para ${cities.length} ciudades`);
    }

    // Método para generar embeddings de los barrios
    private async generateNeighborhoodEmbeddings(): Promise<void> {
        const neighborhoods = await NeighborhoodModel.find({ isActive: true })
            .populate('city');

        for (const neighborhood of neighborhoods) {
            // Texto representativo
            const text = `Barrio: ${neighborhood.name}. 
        Descripción: ${neighborhood.description || 'No disponible'}.
        Ciudad: ${neighborhood.city && (neighborhood.city as any).name || 'No especificada'}.`;

            // Generar embedding
            const embedding = await this.safeGenerateEmbedding(text);

            // Solo guardar si se pudo generar el embedding
            if (embedding) {
                await EmbeddingModel.create({
                    objectId: neighborhood._id,
                    collectionName: 'Neighborhood',
                    embedding,
                    text,
                    metadata: {
                        name: neighborhood.name,
                        description: neighborhood.description,
                        city: neighborhood.city && (neighborhood.city as any).name,
                        isActive: neighborhood.isActive
                    }
                });
            }
        }

        console.log(`Embeddings generados para ${neighborhoods.length} barrios`);
    }

    // Método para generar embeddings de las unidades de medida
    private async generateUnitEmbeddings(): Promise<void> {
        const units = await UnitModel.find({ isActive: true });

        for (const unit of units) {
            // Texto representativo
            const text = `Unidad de medida: ${unit.name}. 
        Descripción: ${unit.description || 'No disponible'}.`;

            // Generar embedding
            const embedding = await this.safeGenerateEmbedding(text);

            // Solo guardar si se pudo generar el embedding
            if (embedding) {
                await EmbeddingModel.create({
                    objectId: unit._id,
                    collectionName: 'Unit',
                    embedding,
                    text,
                    metadata: {
                        name: unit.name,
                        description: unit.description,
                        isActive: unit.isActive
                    }
                });
            }
        }

        console.log(`Embeddings generados para ${units.length} unidades de medida`);
    }

    // Método para generar embeddings de los pagos
    private async generatePaymentEmbeddings(): Promise<void> {
        const payments = await PaymentModel.find()
            .populate({
                path: 'saleId',
                model: 'Sale'
            })
            .populate({
                path: 'customerId',
                model: 'Customer'
            })
            .limit(500); // Limitamos para eficiencia

        for (const payment of payments) {
            // Texto representativo
            const text = `Pago ID: ${payment._id}. 
        Monto: ${payment.amount}.
        Estado: ${payment.status}.
        Método de pago: ${payment.paymentMethod}.
        Cliente: ${payment.customerId && (payment.customerId as any).name || 'No especificado'}.
        Venta asociada: ${payment.saleId && payment.saleId._id || 'No especificada'}.
        Fecha de creación: ${payment.createdAt.toISOString().split('T')[0]}.`;

            // Generar embedding
            const embedding = await this.safeGenerateEmbedding(text);

            // Solo guardar si se pudo generar el embedding
            if (embedding) {
                await EmbeddingModel.create({
                    objectId: payment._id,
                    collectionName: 'Payment',
                    embedding,
                    text,
                    metadata: {
                        amount: payment.amount,
                        status: payment.status,
                        paymentMethod: payment.paymentMethod,
                        customer: payment.customerId && (payment.customerId as any).name,
                        sale: payment.saleId && payment.saleId._id,
                        createdAt: payment.createdAt
                    }
                });
            }
        }

        console.log(`Embeddings generados para ${payments.length} pagos`);
    }
    async validateEmbeddings(): Promise<{ [key: string]: number }> {
        try {
            // Objeto para almacenar los conteos de cada tipo de entidad
            const counts: { [key: string]: number } = {};

            // Obtener conteos directos de las colecciones
            counts.totalCustomers = await CustomerModel.countDocuments({ isActive: true });
            counts.totalProducts = await ProductModel.countDocuments({ isActive: true });
            counts.totalCategories = await CategoryModel.countDocuments({ isActive: true });
            counts.totalCities = await CityModel.countDocuments({ isActive: true });
            counts.totalNeighborhoods = await NeighborhoodModel.countDocuments({ isActive: true });
            counts.totalUnits = await UnitModel.countDocuments({ isActive: true });
            counts.totalSales = await OrderModel.countDocuments();
            counts.totalPayments = await PaymentModel.countDocuments();

            // Obtener conteos de los embeddings por tipo
            const embeddingCounts = await EmbeddingModel.aggregate([
                { $group: { _id: "$collectionName", count: { $sum: 1 } } }
            ]);

            // Mapear los resultados a un objeto
            embeddingCounts.forEach((item) => {
                counts[`embedded${item._id}`] = item.count;
            });

            // Verificar y reportar discrepancias
            const discrepancies = [];
            if (counts.totalCustomers !== (counts.embeddedCustomer || 0)) {
                discrepancies.push(`Clientes: ${counts.totalCustomers} en DB vs ${counts.embeddedCustomer || 0} embeddings`);
            }
            if (counts.totalProducts !== (counts.embeddedProduct || 0)) {
                discrepancies.push(`Productos: ${counts.totalProducts} en DB vs ${counts.embeddedProduct || 0} embeddings`);
            }
            if (counts.totalCategories !== (counts.embeddedCategory || 0)) {
                discrepancies.push(`Categorías: ${counts.totalCategories} en DB vs ${counts.embeddedCategory || 0} embeddings`);
            }
            if (counts.totalCities !== (counts.embeddedCity || 0)) {
                discrepancies.push(`Ciudades: ${counts.totalCities} en DB vs ${counts.embeddedCity || 0} embeddings`);
            }
            if (counts.totalNeighborhoods !== (counts.embeddedNeighborhood || 0)) {
                discrepancies.push(`Barrios: ${counts.totalNeighborhoods} en DB vs ${counts.embeddedNeighborhood || 0} embeddings`);
            }
            if (counts.totalUnits !== (counts.embeddedUnit || 0)) {
                discrepancies.push(`Unidades: ${counts.totalUnits} en DB vs ${counts.embeddedUnit || 0} embeddings`);
            }

            // Registrar resultados
            console.log("Estado de embeddings:", counts);
            if (discrepancies.length > 0) {
                console.warn("Discrepancias encontradas:", discrepancies);
            } else {
                console.log("Todos los conteos coinciden correctamente");
            }

            // Retornar el objeto counts
            return counts;
        } catch (error) {
            console.error("Error validando embeddings:", error);
            throw CustomError.internalServerError("Error al validar embeddings");
        }
    }



}
