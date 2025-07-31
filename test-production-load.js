/**
 * Script de test de carga para producción
 * URL: backend-ecomerce.tiendaonline.digital
 * 
 * Este script realiza tests de carga básicos contra tu servidor en producción
 */

const autocannon = require('autocannon');
const axios = require('axios');

const BASE_URL = 'https://backend-ecomerce.tiendaonline.digital';

// Configuración del test
const TEST_CONFIG = {
    maxUsers: 100,
    duration: 60, // 1 minuto
    timeout: 30000, // 30 segundos timeout
    warmupTime: 10000 // 10 segundos de warmup
};

// Función para hacer warmup del servidor
async function warmupServer() {
    console.log('🔥 Realizando warmup del servidor...');
    console.log(`🎯 Target: ${BASE_URL}`);

    try {
        const start = Date.now();
        const response = await axios.get(BASE_URL, {
            timeout: 60000,
            headers: {
                'User-Agent': 'Production-Load-Test-Warmup'
            }
        });
        const elapsed = Date.now() - start;

        console.log(`✅ Servidor respondió en ${elapsed}ms`);
        console.log(`📊 Status: ${response.status}`);

        // Esperar un poco más para asegurar que esté completamente "caliente"
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.warmupTime));

        return true;
    } catch (error) {
        console.error('❌ Error en warmup:', error.message);
        return false;
    }
}

// Test de endpoints públicos
async function testPublicEndpoints() {
    console.log('\n🔍 Iniciando tests de endpoints públicos...');

    const endpoints = [
        { name: 'Health Check', path: '/' },
        { name: 'Products', path: '/api/products' },
        { name: 'Categories', path: '/api/categories' },
        { name: 'Cities', path: '/api/cities' }
    ];

    for (const endpoint of endpoints) {
        console.log(`\n📈 Testing ${endpoint.name}: ${BASE_URL}${endpoint.path}`);

        try {
            const result = await autocannon({
                url: `${BASE_URL}${endpoint.path}`,
                connections: Math.min(TEST_CONFIG.maxUsers, 20), // Máximo 20 conexiones concurrentes
                duration: TEST_CONFIG.duration,
                headers: {
                    'User-Agent': 'Production-Load-Test'
                },
                timeout: TEST_CONFIG.timeout
            });

            // Mostrar resultados
            console.log(`📊 Resultados para ${endpoint.name}:`);
            console.log(`   🚀 Requests/sec: ${result.requests.average.toFixed(2)}`);
            console.log(`   ⏱️  Latency promedio: ${result.latency.average.toFixed(2)}ms`);
            console.log(`   🔺 Latency máxima: ${result.latency.max}ms`);
            console.log(`   📦 Total requests: ${result.requests.total}`);
            console.log(`   ❌ Errores: ${result.errors}`);
            console.log(`   ⏰ Timeouts: ${result.timeouts}`);
            console.log(`   📈 Non-2xx responses: ${result.non2xx}`);

            // Verificaciones básicas
            if (result.errors > 0) {
                console.log(`⚠️  ADVERTENCIA: ${result.errors} errores detectados`);
            }
            if (result.timeouts > 0) {
                console.log(`⚠️  ADVERTENCIA: ${result.timeouts} timeouts detectados`);
            }
            if (result.non2xx > result.requests.total * 0.1) { // Más del 10% de errores
                console.log(`🚨 ALERTA: Alta tasa de errores (${((result.non2xx / result.requests.total) * 100).toFixed(2)}%)`);
            }

        } catch (error) {
            console.error(`❌ Error testing ${endpoint.name}:`, error.message);
        }

        // Pausa entre tests para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

// Test de carga incremental
async function testIncrementalLoad() {
    console.log('\n🔄 Iniciando test de carga incremental...');

    const loadLevels = [5, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    for (const connections of loadLevels) {
        console.log(`\n📊 Testing con ${connections} conexiones concurrentes...`);

        try {
            const result = await autocannon({
                url: `${BASE_URL}/api/products`,
                connections: connections,
                duration: 30, // 30 segundos por nivel
                headers: {
                    'User-Agent': 'Production-Incremental-Load-Test'
                },
                timeout: TEST_CONFIG.timeout
            });

            console.log(`   📈 ${connections} conexiones -> ${result.requests.average.toFixed(2)} req/sec | ${result.latency.average.toFixed(2)}ms latencia`);

            // Si hay muchos errores, detener el test
            if (result.errors > result.requests.total * 0.2) { // Más del 20% de errores
                console.log(`🛑 Deteniendo test incremental - demasiados errores en ${connections} conexiones`);
                break;
            }

        } catch (error) {
            console.error(`❌ Error en test incremental con ${connections} conexiones:`, error.message);
            break;
        }

        // Pausa entre niveles
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

// Función principal
async function runLoadTest() {
    console.log('🎯 INICIANDO TESTS DE CARGA PARA PRODUCCIÓN');
    console.log('=' * 50);
    console.log(`🌐 URL: ${BASE_URL}`);
    console.log(`👥 Usuarios máximos: ${TEST_CONFIG.maxUsers}`);
    console.log(`⏱️  Duración por test: ${TEST_CONFIG.duration} segundos`);
    console.log('=' * 50);

    const startTime = Date.now();

    try {
        // 1. Warmup
        const warmupSuccess = await warmupServer();
        if (!warmupSuccess) {
            throw new Error('Warmup falló - servidor no responde');
        }

        // 2. Tests de endpoints públicos
        await testPublicEndpoints();

        // 3. Test de carga incremental
        await testIncrementalLoad();

        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
        console.log(`\n✅ Tests completados en ${totalTime} minutos`);

    } catch (error) {
        console.error('\n❌ Error durante los tests:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runLoadTest()
        .then(() => {
            console.log('\n🎉 Tests de carga finalizados exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { runLoadTest, warmupServer, testPublicEndpoints };
