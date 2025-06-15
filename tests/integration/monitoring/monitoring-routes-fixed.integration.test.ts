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

        // Crear usuario admin para tests
        const adminUser = await UserModel.create({
            name: 'Admin Test',
            email: 'admin@test.com',
            password: await BcryptAdapter.hash('123456'),
            role: ['ADMIN_ROLE'],
            isEmailValidated: true
        });

        adminToken = await JwtAdapter.generateToken({ id: adminUser._id.toString() });
    });

    afterAll(async () => {
        // Limpiar usuario de test
        await UserModel.deleteMany({ email: 'admin@test.com' });
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
            expect(response.body.services).toHaveProperty('mongodb');
            expect(response.body.services).toHaveProperty('render');
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
            expect(services.render).toHaveProperty('uptime');
            expect(services.render).toHaveProperty('recommendations');
        });
    });

    describe('GET /api/monitoring/mongodb', () => {
        it('should require authentication', async () => {
            await request(app)
                .get('/api/monitoring/mongodb')
                .expect(401);
        });

        it('should return MongoDB detailed report for admin users', async () => {
            const response = await request(app)
                .get('/api/monitoring/mongodb')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('cluster');
            expect(response.body).toHaveProperty('storageUsed');
            expect(response.body).toHaveProperty('limits');
            expect(response.body).toHaveProperty('currentConnections');
            expect(response.body).toHaveProperty('collections');
            expect(response.body).toHaveProperty('recommendations');
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');

            // Verificar estructura de storage
            expect(response.body.storageUsed).toHaveProperty('bytes');
            expect(response.body.storageUsed).toHaveProperty('mb');
            expect(response.body.storageUsed).toHaveProperty('percentage');

            // Verificar límites
            expect(response.body.limits).toHaveProperty('maxStorage');
            expect(response.body.limits).toHaveProperty('maxConnections');

            // Verificar que las colecciones son un array
            expect(Array.isArray(response.body.collections)).toBe(true);

            // Verificar que las recomendaciones son un array
            expect(Array.isArray(response.body.recommendations)).toBe(true);
        });
    });

    describe('GET /api/monitoring/render', () => {
        it('should require authentication', async () => {
            await request(app)
                .get('/api/monitoring/render')
                .expect(401);
        });

        it('should return Render detailed report for admin users', async () => {
            const response = await request(app)
                .get('/api/monitoring/render')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('service');
            expect(response.body).toHaveProperty('memoryUsage');
            expect(response.body).toHaveProperty('limits');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('deployment');
            expect(response.body).toHaveProperty('recommendations');
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');

            // Verificar estructura de memoria
            expect(response.body.memoryUsage).toHaveProperty('used');
            expect(response.body.memoryUsage).toHaveProperty('available');
            expect(response.body.memoryUsage).toHaveProperty('percentage');

            // Verificar límites
            expect(response.body.limits).toHaveProperty('maxMemory');
            expect(response.body.limits).toHaveProperty('maxBandwidth');
            expect(response.body.limits).toHaveProperty('maxBuildMinutes');

            // Verificar deployment
            expect(response.body.deployment).toHaveProperty('region');
            expect(response.body.deployment).toHaveProperty('tier');

            // Verificar que las recomendaciones son un array
            expect(Array.isArray(response.body.recommendations)).toBe(true);
        });
    });

    describe('GET /api/monitoring/complete', () => {
        it('should require authentication', async () => {
            await request(app)
                .get('/api/monitoring/complete')
                .expect(401);
        });

        it('should return complete monitoring report for admin users', async () => {
            const response = await request(app)
                .get('/api/monitoring/complete')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('mongodb');
            expect(response.body).toHaveProperty('render');
            expect(response.body).toHaveProperty('overallStatus');
            expect(response.body).toHaveProperty('summary');
            expect(response.body).toHaveProperty('timestamp');

            // Verificar estructura del resumen
            expect(response.body.summary).toHaveProperty('totalRecommendations');
            expect(response.body.summary).toHaveProperty('criticalIssues');
            expect(response.body.summary).toHaveProperty('warnings');
            expect(response.body.summary).toHaveProperty('allRecommendations');

            // Verificar que allRecommendations es un array
            expect(Array.isArray(response.body.summary.allRecommendations)).toBe(true);
        });
    });

    describe('GET /api/monitoring/alerts', () => {
        it('should require authentication', async () => {
            await request(app)
                .get('/api/monitoring/alerts')
                .expect(401);
        });

        it('should return current alerts for admin users', async () => {
            const response = await request(app)
                .get('/api/monitoring/alerts')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('alerts');
            expect(response.body).toHaveProperty('totalAlerts');
            expect(response.body).toHaveProperty('timestamp');

            // Verificar que alerts es un array
            expect(Array.isArray(response.body.alerts)).toBe(true);

            // Verificar estructura de totalAlerts
            expect(response.body.totalAlerts).toHaveProperty('critical');
            expect(response.body.totalAlerts).toHaveProperty('warning');
            expect(response.body.totalAlerts).toHaveProperty('info');
        });
    });
});
