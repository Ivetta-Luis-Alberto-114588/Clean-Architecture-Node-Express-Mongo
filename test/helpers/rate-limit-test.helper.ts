import request from 'supertest';
import { Express } from 'express';

/**
 * Helper utilities para testing de Rate Limiting
 */
export class RateLimitTestHelper {

    /**
     * Hace múltiples requests hasta activar el rate limiting
     * @param app - Express app instance
     * @param endpoint - Endpoint a probar
     * @param method - Método HTTP (GET, POST, etc.)
     * @param payload - Payload para requests POST/PUT
     * @param maxAttempts - Número máximo de intentos
     * @param headers - Headers adicionales
     * @returns Resultado de la prueba de rate limiting
     */
    static async testRateLimitActivation(
        app: Express,
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        payload?: any,
        maxAttempts: number = 50,
        headers?: Record<string, string>
    ): Promise<{
        successfulRequests: number;
        rateLimitedRequests: number;
        totalRequests: number;
        rateLimitActivated: boolean;
        lastResponse?: any;
        rateLimitHeaders?: Record<string, string>;
    }> {
        let successfulRequests = 0;
        let rateLimitedRequests = 0;
        let rateLimitActivated = false;
        let lastResponse: any;
        let rateLimitHeaders: Record<string, string> = {};

        for (let i = 0; i < maxAttempts; i++) {
            let response: any;

            try {
                switch (method) {
                    case 'GET':
                        response = await request(app)
                            .get(endpoint)
                            .set(headers || {});
                        break;
                    case 'POST':
                        response = await request(app)
                            .post(endpoint)
                            .send(payload || {})
                            .set(headers || {});
                        break;
                    case 'PUT':
                        response = await request(app)
                            .put(endpoint)
                            .send(payload || {})
                            .set(headers || {});
                        break;
                    case 'DELETE':
                        response = await request(app)
                            .delete(endpoint)
                            .set(headers || {});
                        break;
                }

                lastResponse = response;

                if (response.status === 429) {
                    rateLimitedRequests++;
                    rateLimitActivated = true;

                    // Capturar headers de rate limiting
                    Object.keys(response.headers).forEach(key => {
                        if (key.toLowerCase().startsWith('ratelimit-')) {
                            rateLimitHeaders[key] = response.headers[key];
                        }
                    });

                    break; // Parar después del primer rate limit
                } else if (response.status < 500) {
                    successfulRequests++;
                }
            } catch (error) {
                console.error(`Error en request ${i + 1}:`, error);
                break;
            }

            // Pequeña pausa entre requests
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return {
            successfulRequests,
            rateLimitedRequests,
            totalRequests: successfulRequests + rateLimitedRequests,
            rateLimitActivated,
            lastResponse,
            rateLimitHeaders
        };
    }

    /**
     * Verifica que los headers de rate limiting estén presentes y sean válidos
     * @param headers - Headers de la respuesta HTTP
     * @returns Resultado de la validación
     */
    static validateRateLimitHeaders(headers: Record<string, any>): {
        isValid: boolean;
        errors: string[];
        parsedHeaders: {
            limit?: number;
            remaining?: number;
            reset?: number;
            policy?: string;
        };
    } {
        const errors: string[] = [];
        const parsedHeaders: any = {};

        // Verificar header RateLimit-Limit
        if (!headers['ratelimit-limit']) {
            errors.push('Missing RateLimit-Limit header');
        } else {
            const limit = parseInt(headers['ratelimit-limit']);
            if (isNaN(limit) || limit <= 0) {
                errors.push('Invalid RateLimit-Limit value');
            } else {
                parsedHeaders.limit = limit;
            }
        }

        // Verificar header RateLimit-Remaining
        if (!headers['ratelimit-remaining']) {
            errors.push('Missing RateLimit-Remaining header');
        } else {
            const remaining = parseInt(headers['ratelimit-remaining']);
            if (isNaN(remaining) || remaining < 0) {
                errors.push('Invalid RateLimit-Remaining value');
            } else {
                parsedHeaders.remaining = remaining;
            }
        }

        // Verificar header RateLimit-Reset
        if (!headers['ratelimit-reset']) {
            errors.push('Missing RateLimit-Reset header');
        } else {
            const reset = parseInt(headers['ratelimit-reset']);
            if (isNaN(reset) || reset <= 0) {
                errors.push('Invalid RateLimit-Reset value');
            } else {
                parsedHeaders.reset = reset;
            }
        }

        // Verificar header RateLimit-Policy (opcional pero recomendado)
        if (headers['ratelimit-policy']) {
            parsedHeaders.policy = headers['ratelimit-policy'];
        }

        return {
            isValid: errors.length === 0,
            errors,
            parsedHeaders
        };
    }

    /**
     * Simula requests de diferentes IPs usando headers de proxy
     * @param app - Express app instance
     * @param endpoint - Endpoint a probar
     * @param ips - Array de IPs a simular
     * @param method - Método HTTP
     * @param payload - Payload para requests POST/PUT
     * @returns Resultados por IP
     */
    static async testMultipleIPs(
        app: Express,
        endpoint: string,
        ips: string[],
        method: 'GET' | 'POST' = 'GET',
        payload?: any
    ): Promise<Record<string, {
        status: number;
        rateLimitHeaders: Record<string, string>;
        body: any;
    }>> {
        const results: Record<string, any> = {};

        for (const ip of ips) {
            try {
                let response: any;

                const headers = { 'X-Forwarded-For': ip };

                if (method === 'GET') {
                    response = await request(app)
                        .get(endpoint)
                        .set(headers);
                } else {
                    response = await request(app)
                        .post(endpoint)
                        .send(payload || {})
                        .set(headers);
                }

                const rateLimitHeaders: Record<string, string> = {};
                Object.keys(response.headers).forEach(key => {
                    if (key.toLowerCase().startsWith('ratelimit-')) {
                        rateLimitHeaders[key] = response.headers[key];
                    }
                });

                results[ip] = {
                    status: response.status,
                    rateLimitHeaders,
                    body: response.body
                };
            } catch (error) {
                results[ip] = {
                    status: 500,
                    rateLimitHeaders: {},
                    body: { error: error.message }
                };
            }

            // Pequeña pausa entre requests
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        return results;
    }

    /**
     * Espera hasta que el rate limit se resetee
     * @param app - Express app instance
     * @param endpoint - Endpoint a probar
     * @param maxWaitTime - Tiempo máximo de espera en ms
     * @param checkInterval - Intervalo entre checks en ms
     * @returns Si el rate limit se reseteó
     */
    static async waitForRateLimitReset(
        app: Express,
        endpoint: string,
        maxWaitTime: number = 60000,
        checkInterval: number = 1000
    ): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const response = await request(app)
                    .get(endpoint);

                if (response.status !== 429) {
                    return true; // Rate limit se reseteó
                }

                // Verificar el header de reset si está disponible
                const resetHeader = response.headers['ratelimit-reset'];
                if (resetHeader) {
                    const resetTime = parseInt(resetHeader) * 1000; // Convertir a ms
                    if (resetTime <= checkInterval) {
                        await new Promise(resolve => setTimeout(resolve, resetTime + 100));
                        continue;
                    }
                }

                await new Promise(resolve => setTimeout(resolve, checkInterval));
            } catch (error) {
                console.error('Error checking rate limit reset:', error);
                await new Promise(resolve => setTimeout(resolve, checkInterval));
            }
        }

        return false; // Timeout alcanzado
    }

    /**
     * Genera datos de test para diferentes escenarios
     * @param scenario - Tipo de escenario
     * @returns Datos de test apropiados
     */
    static generateTestData(scenario: 'login' | 'register' | 'forgot-password' | 'generic'): any {
        switch (scenario) {
            case 'login':
                return {
                    email: `test-rate-limit-${Date.now()}@example.com`,
                    password: 'wrongpassword123'
                };
            case 'register':
                return {
                    email: `test-register-${Date.now()}@example.com`,
                    password: 'testpassword123',
                    name: 'Test User'
                };
            case 'forgot-password':
                return {
                    email: `test-forgot-${Date.now()}@example.com`
                };
            default:
                return {};
        }
    }

    /**
     * Calcula métricas de rate limiting
     * @param limit - Límite configurado
     * @param windowMs - Ventana de tiempo en ms
     * @returns Métricas calculadas
     */
    static calculateRateLimitMetrics(limit: number, windowMs: number): {
        requestsPerSecond: number;
        requestsPerMinute: number;
        windowMinutes: number;
        isRestrictive: boolean;
        isPermissive: boolean;
    } {
        const windowMinutes = Math.ceil(windowMs / 60000);
        const requestsPerMinute = limit / windowMinutes;
        const requestsPerSecond = requestsPerMinute / 60;

        return {
            requestsPerSecond,
            requestsPerMinute,
            windowMinutes,
            isRestrictive: requestsPerMinute < 10, // Menos de 10 req/min es restrictivo
            isPermissive: requestsPerMinute > 100  // Más de 100 req/min es permisivo
        };
    }

    /**
     * Crea un mock de respuesta 429 para testing
     * @param remainingTime - Tiempo restante para reset
     * @param limit - Límite configurado
     * @returns Mock de respuesta 429
     */
    static createMock429Response(remainingTime: string = '5 minutos', limit: number = 100): any {
        return {
            status: 429,
            headers: {
                'ratelimit-limit': limit.toString(),
                'ratelimit-remaining': '0',
                'ratelimit-reset': '300', // 5 minutos
                'ratelimit-policy': `${limit};w=300`
            },
            body: {
                error: 'Límite de solicitudes excedido',
                message: `Has excedido el límite de solicitudes. Por favor, espera ${remainingTime}.`,
                statusCode: 429,
                remainingTime,
                intentosRestantes: 0
            }
        };
    }

    /**
     * Valida que una respuesta de error 429 tenga el formato correcto
     * @param response - Respuesta HTTP
     * @param expectedType - Tipo esperado ('global' | 'auth')
     * @returns Resultado de la validación
     */
    static validateRateLimitErrorResponse(
        response: any,
        expectedType: 'global' | 'auth' = 'global'
    ): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Verificar status code
        if (response.status !== 429) {
            errors.push(`Expected status 429, got ${response.status}`);
        }

        // Verificar estructura del body
        if (!response.body) {
            errors.push('Missing response body');
            return { isValid: false, errors };
        }

        if (!response.body.error) {
            errors.push('Missing error field in response body');
        }

        if (!response.body.statusCode || response.body.statusCode !== 429) {
            errors.push('Missing or invalid statusCode field');
        }

        if (!response.body.remainingTime) {
            errors.push('Missing remainingTime field');
        }

        // Verificar mensaje específico según tipo
        if (expectedType === 'auth' && response.body.error) {
            if (!response.body.error.toLowerCase().includes('autenticación')) {
                errors.push('Auth rate limit error should mention authentication');
            }
        }

        // Verificar headers
        const headerValidation = this.validateRateLimitHeaders(response.headers);
        if (!headerValidation.isValid) {
            errors.push(...headerValidation.errors);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
