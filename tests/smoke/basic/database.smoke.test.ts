// tests/smoke/basic/database.smoke.test.ts

import request from 'supertest';
import { setupSmokeTests, cleanupSmokeTests, app } from '../utils/test-setup';
import { envs } from '../../../src/configs/envs';

describe('Database Health Check - Smoke Tests', () => {
    beforeAll(async () => {
        await setupSmokeTests();
    });

    afterAll(async () => {
        await cleanupSmokeTests();
    });

    describe('Database Health Check', () => {
        it('should verify MongoDB connection is healthy', async () => {
            const response = await request(app)
                .get('/api/health/db')
                .expect(200);

            expect(response.body).toMatchObject({
                database: 'connected'
            });

            expect(response.body.dbName).toBeDefined();
            expect(response.body.timestamp).toBeDefined();
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
        });

        it('should return database name in health check', async () => {
            const response = await request(app)
                .get('/api/health/db')
                .expect(200);

            expect(response.body.dbName).toBe(envs.MONGO_DB_NAME);
        });
    });
});
