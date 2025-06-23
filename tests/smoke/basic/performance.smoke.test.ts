// tests/smoke/basic/performance.smoke.test.ts

import request from 'supertest';
import { setupSmokeTests, cleanupSmokeTests, app } from '../utils/test-setup';

describe('Performance Basic Check - Smoke Tests', () => {
    beforeAll(async () => {
        await setupSmokeTests();
    });

    afterAll(async () => {
        await cleanupSmokeTests();
    });

    describe('Performance Basic Check', () => {
        it('should respond to health check within reasonable time', async () => {
            const startTime = Date.now();

            await request(app)
                .get('/api/health')
                .expect(200);

            const responseTime = Date.now() - startTime;

            // El health check debería responder en menos de 1 segundo
            expect(responseTime).toBeLessThan(1000);
        });

        it('should respond to database health check within reasonable time', async () => {
            const startTime = Date.now();

            await request(app)
                .get('/api/health/db')
                .expect(200);

            const responseTime = Date.now() - startTime;

            // La verificación de DB debería responder en menos de 2 segundos
            expect(responseTime).toBeLessThan(2000);
        });
    });
});
