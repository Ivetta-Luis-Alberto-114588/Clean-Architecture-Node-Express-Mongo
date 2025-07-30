/**
 * Test rápido de conectividad y performance básica
 * Para: backend-ecomerce.tiendaonline.digital
 */

const axios = require('axios');

const BASE_URL = 'https://backend-ecomerce.tiendaonline.digital';

async function quickHealthCheck() {
    console.log('🔍 VERIFICACIÓN RÁPIDA DE SERVIDOR');
    console.log('=' * 40);
    console.log(`🎯 URL: ${BASE_URL}`);

    const endpoints = [
        { name: 'Health Check', path: '/' },
        { name: 'Products API', path: '/api/products' },
        { name: 'Categories API', path: '/api/categories' },
        { name: 'Cities API', path: '/api/cities' }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n📡 Testing ${endpoint.name}...`);
            const start = Date.now();

            const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Quick-Health-Check'
                }
            });

            const elapsed = Date.now() - start;

            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   ⏱️  Tiempo: ${elapsed}ms`);
            console.log(`   📦 Tamaño: ${JSON.stringify(response.data).length} chars`);

            // Verificar estructura de respuesta para APIs
            if (endpoint.path.startsWith('/api/')) {
                if (Array.isArray(response.data)) {
                    console.log(`   📊 Items: ${response.data.length}`);
                } else if (response.data && typeof response.data === 'object') {
                    console.log(`   🔑 Keys: ${Object.keys(response.data).join(', ')}`);
                }
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`   📊 Status: ${error.response.status}`);
                console.log(`   💬 Message: ${error.response.data?.message || 'No message'}`);
            }
        }
    }

    console.log('\n✅ Verificación completada');
}

// Test de carga simple con 10 requests paralelas
async function simpleLoadTest() {
    console.log('\n🚀 TEST DE CARGA SIMPLE (10 requests paralelas)');
    console.log('=' * 50);

    const testUrl = `${BASE_URL}/api/products`;
    const numRequests = 10;

    console.log(`📡 Enviando ${numRequests} requests paralelas a: ${testUrl}`);

    const start = Date.now();
    const promises = [];

    for (let i = 0; i < numRequests; i++) {
        promises.push(
            axios.get(testUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': `Simple-Load-Test-${i}`
                }
            }).then(response => ({
                success: true,
                status: response.status,
                time: Date.now() - start
            })).catch(error => ({
                success: false,
                error: error.message,
                status: error.response?.status || 'timeout'
            }))
        );
    }

    try {
        const results = await Promise.all(promises);
        const totalTime = Date.now() - start;

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`\n📊 RESULTADOS:`);
        console.log(`   ✅ Exitosas: ${successful}/${numRequests}`);
        console.log(`   ❌ Fallidas: ${failed}/${numRequests}`);
        console.log(`   ⏱️  Tiempo total: ${totalTime}ms`);
        console.log(`   📈 Promedio por request: ${(totalTime / numRequests).toFixed(2)}ms`);
        console.log(`   🚀 Requests/sec: ${(numRequests / (totalTime / 1000)).toFixed(2)}`);

        if (failed > 0) {
            console.log(`\n⚠️  ERRORES DETECTADOS:`);
            results.filter(r => !r.success).forEach((result, i) => {
                console.log(`   ${i + 1}. ${result.error} (Status: ${result.status})`);
            });
        }

    } catch (error) {
        console.error(`💥 Error en test de carga: ${error.message}`);
    }
}

async function main() {
    try {
        await quickHealthCheck();
        await simpleLoadTest();

        console.log('\n🎉 Todos los tests completados');

    } catch (error) {
        console.error(`💥 Error general: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { quickHealthCheck, simpleLoadTest };
