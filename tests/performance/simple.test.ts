/**
 * Test simple de performance para verificar configuración
 */

import autocannon from 'autocannon';
import { warmupServer, healthCheck } from './performance-utils';
import { getConfig, TEST_ENDPOINTS } from './performance-config';

const config = getConfig();

describe('Simple Performance Test', () => {
  
  beforeAll(async () => {
    console.log('🚀 Iniciando test simple de performance...');
    console.log(`🎯 Target: ${config.baseUrl}`);
    
    // Warmup del servidor
    await warmupServer();
    
    // Verificar salud
    const isHealthy = await healthCheck();
    console.log(`🩺 Server health: ${isHealthy ? 'OK' : 'NOT OK'}`);
    
  }, 180000); // 3 minutos timeout

  test('Simple load test on products endpoint', async () => {
    console.log('🎯 Running simple load test on products...');
    
    const result = await autocannon({
      url: `${config.baseUrl}${TEST_ENDPOINTS.products}`,
      connections: 5, // Solo 5 conexiones para empezar
      duration: 10, // Solo 10 segundos
      headers: {
        'User-Agent': 'Simple-Performance-Test'
      },
      timeout: config.requestTimeout
    });

    console.log('📊 Simple Load Test Results:');
    console.log(`   Total requests: ${result.requests.total}`);
    console.log(`   Requests/sec: ${result.requests.average}`);
    console.log(`   Latency avg: ${result.latency.average}ms`);
    console.log(`   Latency max: ${result.latency.max}ms`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Timeouts: ${result.timeouts}`);
    console.log(`   2xx responses: ${result['2xx']}`);
    console.log(`   Non-2xx responses: ${result.non2xx}`);

    // Assertions básicas
    expect(result.requests.total).toBeGreaterThan(0);
    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result['2xx']).toBeGreaterThan(0);
    
  }, 60000); // 1 minuto timeout

  test('Root endpoint performance', async () => {
    console.log('🏠 Testing root endpoint performance...');
    
    const result = await autocannon({
      url: `${config.baseUrl}${TEST_ENDPOINTS.health}`, // Endpoint raíz
      connections: 3,
      duration: 5, // Solo 5 segundos
      headers: {
        'User-Agent': 'Root-Performance-Test'
      },
      timeout: config.requestTimeout
    });

    console.log('📊 Root Endpoint Results:');
    console.log(`   Requests/sec: ${result.requests.average}`);
    console.log(`   Latency avg: ${result.latency.average}ms`);
    console.log(`   Errors: ${result.errors}`);

    expect(result.errors).toBe(0);
    expect(result.requests.total).toBeGreaterThan(0);
    
  }, 30000);
});
