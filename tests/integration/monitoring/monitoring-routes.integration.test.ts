import request from 'supertest';
import { server } from '../../../src/presentation/server';
import { MainRoutes } from '../../../src/presentation/routes';
import { UserModel } from '../../../src/data/mongodb/models/user.model';
import { BcryptAdapter } from '../../../src/configs/bcrypt';
import { JwtAdapter } from '../../../src/configs/jwt';
import '../../../tests/utils/setup';

describe('Monitoring Routes Integration Tests', () => {
    let app: any;
    let adminToken: string;

    beforeAll(async () => {
        // Crear instancia del servidor para tests
        app = new server({ p_port: 0, p_routes: MainRoutes.getMainRoutes }).app;
    });

    beforeEach(async () => {
        // Crear usuario admin para cada test (después de que setup.js limpie la DB)
        const adminUser = await UserModel.create({
            name: 'Admin Test',
            email: 'admin@test.com',
            password: await BcryptAdapter.hash('123456'),
            roles: ['ADMIN_ROLE'], // Usar 'roles' según el modelo Mongoose
            isEmailValidated: true
        });

        console.log('User created:', {
            id: adminUser._id.toString(),
            email: adminUser.email,
            roles: adminUser.roles // Usar 'roles' según el modelo
        });

        const token = await JwtAdapter.generateToken({ id: adminUser._id.toString() });
        if (!token) {
            throw new Error('Failed to generate token');
        }
        adminToken = token;
        console.log('Token generated:', adminToken.substring(0, 20) + '...');
    });

    describe('GET /api/monitoring/health', () => {
        it('should return health status without authentication', async () => {
            const response = await request(app)
                .get('/api/monitoring/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('services');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body.services).toHaveProperty('mongodb'); expect(response.body.services).toHaveProperty('render');
        });

        it('should include service status details', async () => {
            const response = await request(app)
                .get('/api/monitoring/health')
                .expect(200);

            const { services } = response.body;

            // MongoDB service details
            expect(services.mongodb).toHaveProperty('status');
            expect(services.mongodb).toHaveProperty('storageUsage');
            expect(services.mongodb).toHaveProperty('connections');
            expect(services.mongodb).toHaveProperty('recommendations');

            // Render service details
            expect(services.render).toHaveProperty('status');
            expect(services.render).toHaveProperty('memoryUsage');
            expect(services.render).toHaveProperty('hoursUsage');
            expect(services.render).toHaveProperty('recommendations');
        });
    });

    describe('GET /api/monitoring/mongodb', () => {
        it('should require authentication', async () => {
            await request(app)
                .get('/api/monitoring/mongodb').expect(401);
        }); it('should return MongoDB detailed report for admin users', async () => {
            console.log('Testing with token:', adminToken ? 'Token exists' : 'No token');

            const response = await request(app)
                .get('/api/monitoring/mongodb')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);            // La respuesta tiene la estructura: { data: {...}, service: "...", timestamp: "..." }
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('service');
            expect(response.body).toHaveProperty('timestamp');

            // Verificar propiedades dentro de data
            expect(response.body.data).toHaveProperty('cluster');
            expect(response.body.data).toHaveProperty('storage');
            expect(response.body.data).toHaveProperty('connections');
            expect(response.body.data).toHaveProperty('collections');
            expect(response.body.data).toHaveProperty('recommendations');
            expect(response.body.data).toHaveProperty('status');
            expect(response.body.data).toHaveProperty('timestamp');

            // Verificar estructura de storage
            expect(response.body.data.storage).toHaveProperty('used');
            expect(response.body.data.storage).toHaveProperty('limits');
            expect(response.body.data.storage).toHaveProperty('remaining');

            // Verificar storage.used
            expect(response.body.data.storage.used).toHaveProperty('mb');
            expect(response.body.data.storage.used).toHaveProperty('gb');
            expect(response.body.data.storage.used).toHaveProperty('percentage');

            // Verificar storage.limits
            expect(response.body.data.storage.limits).toHaveProperty('maxStorage');
            expect(response.body.data.storage.limits).toHaveProperty('maxConnections');            // Verificar que las colecciones son un array
            expect(Array.isArray(response.body.data.collections)).toBe(true);

            // Verificar estructura de cada colección
            if (response.body.data.collections.length > 0) {
                const firstCollection = response.body.data.collections[0];
                expect(firstCollection).toHaveProperty('name');
                expect(firstCollection).toHaveProperty('documentCount');
                expect(firstCollection).toHaveProperty('storage');
                expect(firstCollection.storage).toHaveProperty('sizeMB');
                expect(firstCollection.storage).toHaveProperty('indexMB');
                expect(firstCollection.storage).toHaveProperty('totalMB');
            }

            // Verificar conexiones
            expect(response.body.data.connections).toHaveProperty('current');
            expect(response.body.data.connections).toHaveProperty('limit');
            expect(response.body.data.connections).toHaveProperty('available');
            expect(response.body.data.connections).toHaveProperty('percentage');

            // Verificar que las recomendaciones son un array
            expect(Array.isArray(response.body.data.recommendations)).toBe(true);
        });
    });

    describe('GET /api/monitoring/render', () => {
        it('should require authentication', async () => {
            await request(app)
                .get('/api/monitoring/render')
                .expect(401);
        }); it('should return Render detailed report for admin users', async () => {
            const response = await request(app)
                .get('/api/monitoring/render')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // La respuesta tiene la estructura: { data: {...}, service: "...", timestamp: "..." }
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('service');
            expect(response.body).toHaveProperty('timestamp');

            // Verificar propiedades dentro de data
            expect(response.body.data).toHaveProperty('service');
            expect(response.body.data).toHaveProperty('currentInstance');
            expect(response.body.data).toHaveProperty('currentMonth');
            expect(response.body.data).toHaveProperty('limits');
            expect(response.body.data).toHaveProperty('plan');
            expect(response.body.data).toHaveProperty('recommendations');
            expect(response.body.data).toHaveProperty('timestamp');

            // Verificar estructura de currentInstance con memoryUsage
            expect(response.body.data.currentInstance).toHaveProperty('memoryUsage');
            expect(response.body.data.currentInstance.memoryUsage).toHaveProperty('free');
            expect(response.body.data.currentInstance.memoryUsage).toHaveProperty('total');
            expect(response.body.data.currentInstance.memoryUsage).toHaveProperty('used');
            expect(response.body.data.currentInstance.memoryUsage).toHaveProperty('percentage');

            // Verificar límites
            expect(response.body.data.limits).toHaveProperty('monthlyHours');
            expect(response.body.data.limits).toHaveProperty('sleepAfterMinutes');
            expect(response.body.data.limits).toHaveProperty('coldStartTime');

            // Verificar que las recomendaciones son un array
            expect(Array.isArray(response.body.data.recommendations)).toBe(true);
        });
    });

    describe('GET /api/monitoring/complete', () => {
        it('should require authentication', async () => {
            await request(app)
                .get('/api/monitoring/complete')
                .expect(401);
        }); it('should return complete monitoring report for admin users', async () => {
            const response = await request(app)
                .get('/api/monitoring/complete')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Estructura basada en la respuesta real: services contiene mongodb y render
            expect(response.body).toHaveProperty('services');
            expect(response.body).toHaveProperty('summary');
            expect(response.body).toHaveProperty('timestamp');

            // Verificar services
            expect(response.body.services).toHaveProperty('mongodb');
            expect(response.body.services).toHaveProperty('render');

            // Verificar estructura del resumen
            expect(response.body.summary).toHaveProperty('criticalAlerts');
            expect(response.body.summary).toHaveProperty('overallStatus');

            // Verificar que criticalAlerts es un array
            expect(Array.isArray(response.body.summary.criticalAlerts)).toBe(true);
        });
    });

    describe('GET /api/monitoring/alerts', () => {
        it('should require authentication', async () => {
            await request(app)
                .get('/api/monitoring/alerts')
                .expect(401);
        }); it('should return current alerts for admin users', async () => {
            const response = await request(app)
                .get('/api/monitoring/alerts')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('alerts');
            expect(response.body).toHaveProperty('totalAlerts');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('criticalCount');
            expect(response.body).toHaveProperty('warningCount');

            // Verificar que alerts es un array
            expect(Array.isArray(response.body.alerts)).toBe(true);
        });
    });
});
