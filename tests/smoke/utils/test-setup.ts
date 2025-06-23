// tests/smoke/utils/test-setup.ts

import { Express } from 'express';
import request from 'supertest';
import { MainRoutes } from '../../../src/presentation/routes';
import { server } from '../../../src/presentation/server';
import { envs } from '../../../src/configs/envs';

export let app: Express;
export let adminToken: string | null = null;
export let testUserId: string | null = null;
export let testServer: server;

// Shared test utilities
export const setupSmokeTests = async () => {
    console.log('Setting up smoke tests...');

    // Initialize the app
    testServer = new server({
        p_port: 3002, // Puerto diferente para evitar conflictos
        p_routes: MainRoutes.getMainRoutes
    });

    app = testServer.app;

    // Try to get admin token for tests that need it
    try {
        const adminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@admin.com',
                password: 'Abc123456'
            });

        if (adminLoginResponse.status === 200 && adminLoginResponse.body.user?.token) {
            adminToken = adminLoginResponse.body.user.token;
            console.log('Admin token obtained for smoke tests');
        }
    } catch (error) {
        console.log('Could not obtain admin token for smoke tests:', error);
    }
};

export const cleanupSmokeTests = async () => {
    console.log('Cleaning up smoke tests...');
    adminToken = null;
    testUserId = null;
};

// Common test helpers
export const createTestUser = async () => {
    const uniqueEmail = `smoke-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`;

    const response = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Smoke Test User',
            email: uniqueEmail,
            password: 'validPassword123'
        });

    return { response, email: uniqueEmail };
};

export const expectValidResponse = (response: any, expectedStatus: number | number[]) => {
    const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    expect(statuses).toContain(response.status);
};

export const expectValidObjectProperties = (obj: any, properties: string[]) => {
    properties.forEach(prop => {
        expect(obj).toHaveProperty(prop);
    });
};
