/**
 * Utilidades para tests de performance
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getConfig, TEST_DATA } from './performance-config';

const config = getConfig();

/**
 * Función para hacer el warmup del servidor (importante para Render)
 */
export async function warmupServer(): Promise<void> {
    console.log('🔥 Iniciando warmup del servidor...');
    console.log(`⏱️ Esperando ${config.initialWarmupDelay / 1000}s para cold start...`);

    // Esperar el tiempo de cold start
    await sleep(config.initialWarmupDelay);

    const maxRetries = 3; // Reducido de 5 a 3
    let retries = 0;

    while (retries < maxRetries) {
        try {
            console.log(`🌡️ Intento de warmup ${retries + 1}/${maxRetries}...`);

            const response = await axios.get(config.warmupUrl, {
                timeout: 5000, // Timeout más corto para warmup
                validateStatus: () => true // Aceptar cualquier status code
            });

            console.log(`✅ Warmup exitoso! Status: ${response.status}`);

            // Solo hacer requests adicionales si el servidor responde
            if (response.status < 500) {
                try {
                    await Promise.all([
                        makeRequest('GET', '/api/products'),
                        makeRequest('GET', '/'), // Endpoint raíz también
                    ]);
                } catch (e) {
                    console.warn('⚠️ Requests adicionales fallaron, pero servidor está disponible');
                }
            }

            console.log('🎯 Servidor listo para tests de performance!');
            return;

        } catch (error) {
            retries++;
            console.warn(`⚠️ Warmup intento ${retries} falló:`, error.message);

            if (retries < maxRetries) {
                console.log(`⏳ Esperando 5s antes del siguiente intento...`);
                await sleep(5000); // Reducido de 10s a 5s
            }
        }
    }

    // Si llegamos aquí, el warmup falló
    console.error('❌ Warmup del servidor falló después de todos los intentos');
    console.warn('⚠️ Los tests de performance pueden fallar o ser lentos');

    // En lugar de lanzar error, permitir que continúen los tests
    // throw new Error('Servidor no disponible para tests de performance');
}

/**
 * Función para hacer requests HTTP con manejo de errores
 */
export async function makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
): Promise<AxiosResponse> {
    const url = `${config.baseUrl}${endpoint}`;

    const requestConfig: AxiosRequestConfig = {
        method,
        url,
        timeout: config.requestTimeout,
        validateStatus: () => true, // No lanzar error por status codes
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        requestConfig.data = data;
    }

    return axios(requestConfig);
}

/**
 * Función para obtener un token JWT de autenticación
 */
export async function getAuthToken(): Promise<string> {
    try {
        const response = await makeRequest('POST', '/api/auth/login', {
            email: TEST_DATA.testUser.email,
            password: TEST_DATA.testUser.password
        }); if (response.status === 200 && response.data?.user?.token) {
            return response.data.user.token;
        }

        // Si el login falla, intentar registrar el usuario
        console.log('👤 Usuario de prueba no existe, creando...');
        const registerResponse = await makeRequest('POST', '/api/auth/register', {
            ...TEST_DATA.testUser
        }); if (registerResponse.status === 201 && registerResponse.data?.user?.token) {
            console.log('✅ Usuario de prueba creado exitosamente');
            return registerResponse.data.user.token;
        }

        console.log('❌ Estructura de respuesta del register:', JSON.stringify(registerResponse.data, null, 2));
        throw new Error(`No se pudo obtener token: ${registerResponse.status} - ${registerResponse.data?.message || 'Error desconocido'}`);
    } catch (error) {
        console.error('❌ Error obteniendo token de autenticación:', error.message);
        throw error;
    }
}

/**
 * Función para crear headers de autenticación
 */
export function createAuthHeaders(token: string): Record<string, string> {
    return {
        'Authorization': `Bearer ${token}`
    };
}

/**
 * Función sleep para delays
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Función para generar datos aleatorios de prueba
 */
export function generateTestData() {
    const timestamp = Date.now();
    return {
        user: {
            email: `test-${timestamp}@performance.test`,
            password: 'TestPassword123!',
            name: `Performance User ${timestamp}`
        },
        product: {
            name: `Test Product ${timestamp}`,
            price: Math.floor(Math.random() * 1000) + 100,
            description: `Performance test product created at ${new Date().toISOString()}`
        }
    };
}

/**
 * Función para medir tiempo de respuesta
 */
export async function measureResponseTime<T>(
    operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;

    return { result, duration };
}

/**
 * Función para verificar que el servidor esté respondiendo
 */
export async function healthCheck(): Promise<boolean> {
    try {
        const response = await makeRequest('GET', '/'); // Usar endpoint raíz en lugar de /api/health
        const isHealthy = response.status >= 200 && response.status < 300;
        console.log(`🩺 Health check result: ${response.status} - ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
        return isHealthy;
    } catch (error) {
        console.error('❌ Health check falló:', error.message);
        return false;
    }
}
