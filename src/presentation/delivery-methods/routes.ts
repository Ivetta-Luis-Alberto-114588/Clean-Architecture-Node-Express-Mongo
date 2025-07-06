// src/presentation/delivery-methods/routes.ts

import { Router } from 'express';
import { DeliveryMethodController } from './controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { DeliveryMethodMongoDatasourceImpl } from '../../infrastructure/datasources/delivery-methods/delivery-method.mongo.datasource.impl';
import { DeliveryMethodRepositoryImpl } from '../../infrastructure/repositories/delivery-methods/delivery-method.repository.impl';

export class DeliveryMethodRoutes {

    static get routes(): Router {
        const router = Router();

        const datasource = new DeliveryMethodMongoDatasourceImpl();
        const repository = new DeliveryMethodRepositoryImpl(datasource);
        const controller = new DeliveryMethodController(repository);

        // Rutas públicas
        router.get('/', controller.getActiveMethods.bind(controller));

        // DEBUG: Endpoint temporal para verificar la base de datos
        router.get('/debug', async (req, res) => {
            try {
                const mongoose = require('mongoose');
                const collections = await mongoose.connection.db.listCollections().toArray();
                console.log('📊 Colecciones en la base de datos:', collections.map(c => c.name));

                // Verificar múltiples variaciones del nombre de la colección
                const deliveryMethodsData = await mongoose.connection.db.collection('deliverymethods').find({}).toArray();
                const deliveryMethodData = await mongoose.connection.db.collection('deliverymethod').find({}).toArray();
                const deliveryMethodsDataPlural = await mongoose.connection.db.collection('DeliveryMethods').find({}).toArray();

                console.log('📋 Datos en deliverymethods:', deliveryMethodsData);
                console.log('📋 Datos en deliverymethod:', deliveryMethodData);
                console.log('📋 Datos en DeliveryMethods:', deliveryMethodsDataPlural);

                res.json({
                    collections: collections.map(c => c.name),
                    deliverymethods: { count: deliveryMethodsData.length, data: deliveryMethodsData },
                    deliverymethod: { count: deliveryMethodData.length, data: deliveryMethodData },
                    DeliveryMethods: { count: deliveryMethodsDataPlural.length, data: deliveryMethodsDataPlural }
                });
            } catch (error) {
                console.error('❌ Error en debug:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Rutas de administrador
        router.get('/admin', [AuthMiddleware.validateJwt, AuthMiddleware.checkRole(['ADMIN_ROLE'])], controller.getAll.bind(controller));
        router.post('/admin', [AuthMiddleware.validateJwt, AuthMiddleware.checkRole(['ADMIN_ROLE'])], controller.create.bind(controller));
        router.get('/admin/:id', [AuthMiddleware.validateJwt, AuthMiddleware.checkRole(['ADMIN_ROLE'])], controller.findById.bind(controller));
        router.put('/admin/:id', [AuthMiddleware.validateJwt, AuthMiddleware.checkRole(['ADMIN_ROLE'])], controller.updateById.bind(controller));
        router.delete('/admin/:id', [AuthMiddleware.validateJwt, AuthMiddleware.checkRole(['ADMIN_ROLE'])], controller.deleteById.bind(controller));

        return router;
    }
}
