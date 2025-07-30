/**
 * Configuración para tests de performance
 * 
 * Este archivo contiene la configuración para tests de rendimiento,
 * teniendo en cuenta las limitaciones de Render.com capa gratuita
 */

export interface PerformanceConfig {
    baseUrl: string;
    warmupUrl: string;
    maxUsers: number;
    duration: string;
    rampUpDuration: string;
    cooldownDuration: string;
    requestTimeout: number;
    initialWarmupDelay: number; // Tiempo para el cold start de Render
}

export const RENDER_CONFIG: PerformanceConfig = {
    // URL de tu backend en producción (sin /api ya que se agrega en los endpoints)
    baseUrl: 'https://backend-ecomerce.tiendaonline.digital',
    warmupUrl: 'https://backend-ecomerce.tiendaonline.digital', // Endpoint raíz que devuelve "Running OK"

    // Configuración conservadora para Render free tier
    maxUsers: 30, // Máximo 30 usuarios concurrentes como solicitaste
    duration: '2m', // Duración del test principal
    rampUpDuration: '30s', // Tiempo para llegar al máximo de usuarios
    cooldownDuration: '15s', // Tiempo de enfriamiento

    // Timeouts generosos para Render
    requestTimeout: 60000, // 60 segundos timeout por request
    initialWarmupDelay: 60000, // 60 segundos para el cold start inicial
};

export const LOCAL_CONFIG: PerformanceConfig = {
    baseUrl: 'http://localhost:3000',
    warmupUrl: 'http://localhost:3000/api/health',
    maxUsers: 50,
    duration: '1m',
    rampUpDuration: '15s',
    cooldownDuration: '10s',
    requestTimeout: 10000, // Reducido a 10 segundos para local
    initialWarmupDelay: 2000, // Reducido a 2 segundos para local
};

export const getConfig = (): PerformanceConfig => {
    const isProduction = process.env.NODE_ENV === 'production' ||
        process.env.PERFORMANCE_TARGET === 'render';

    return isProduction ? RENDER_CONFIG : LOCAL_CONFIG;
};

export const TEST_ENDPOINTS = {
    // Endpoints públicos (sin autenticación)
    health: '/', // Endpoint raíz que devuelve "Running OK"
    products: '/api/products',
    categories: '/api/categories', // Corregido: era /api/products/categories

    // Endpoints que requieren autenticación
    auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
    },

    // Endpoints de carrito (requieren auth)
    cart: {
        get: '/api/cart',
        add: '/api/cart/add',
        update: '/api/cart/update',
    },

    // Endpoints críticos para e-commerce
    orders: {
        create: '/api/orders',
        list: '/api/orders',
    }
};

export const TEST_DATA = {
    // Usuario de prueba para autenticación
    testUser: {
        email: 'test-performance@example.com',
        password: 'TestPassword123!',
        name: 'Performance Test User'
    },

    // Producto de prueba para agregar al carrito
    testProduct: {
        productId: '507f1f77bcf86cd799439011', // ID de ejemplo
        quantity: 1
    }
};
