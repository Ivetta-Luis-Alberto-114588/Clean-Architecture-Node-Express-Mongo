/**
 * Ejemplo de test de performance personalizado
 * 
 * Usa este archivo como plantilla para crear tests adicionales
 * específicos para tu aplicación
 */

import { warmupServer, makeRequest, getAuthToken, measureResponseTime } from './performance-utils';
import { getConfig, TEST_ENDPOINTS } from './performance-config';

const config = getConfig();

describe.skip('Custom Performance Tests - Template', () => {
  let authToken: string;
  
  beforeAll(async () => {
    console.log('🎯 Iniciando tests personalizados...');
    
    // Warmup del servidor
    await warmupServer();
    
    // Obtener autenticación si es necesaria
    try {
      authToken = await getAuthToken();
    } catch (error) {
      console.warn('⚠️ Sin autenticación para tests personalizados');
    }
  }, 120000);

  describe('Custom Endpoint Tests', () => {
    test('Endpoint específico de tu negocio', async () => {
      // Ejemplo: Test para endpoint de búsqueda de productos
      const searchTerm = 'laptop';
      const endpoint = `/api/products/search?q=${searchTerm}`;
      
      console.log(`🔍 Testing product search for: ${searchTerm}`);
      
      const { result, duration } = await measureResponseTime(async () => {
        return makeRequest('GET', endpoint);
      });
      
      console.log(`⏱️ Search took: ${duration}ms`);
      console.log(`📊 Results count: ${result.data?.total || 0}`);
      
      // Assertions
      expect(result.status).toBe(200);
      expect(duration).toBeLessThan(8000); // 8 segundos para búsqueda
      expect(result.data).toBeDefined();
      
    }, 30000);

    test('Endpoint con parámetros complejos', async () => {
      // Ejemplo: Test para filtros avanzados de productos
      const filters = {
        category: 'electronics',
        minPrice: 100,
        maxPrice: 1000,
        sortBy: 'price',
        order: 'asc'
      };
      
      const queryString = new URLSearchParams(filters as any).toString();
      const endpoint = `/api/products?${queryString}`;
      
      console.log(`🎛️ Testing complex product filters...`);
      
      const { result, duration } = await measureResponseTime(async () => {
        return makeRequest('GET', endpoint);
      });
      
      console.log(`⏱️ Complex filter took: ${duration}ms`);
      
      expect(result.status).toBe(200);
      expect(duration).toBeLessThan(10000); // 10 segundos para filtros complejos
      
    }, 30000);

    test('Endpoint que requiere autenticación', async () => {
      if (!authToken) {
        console.log('⏭️ Saltando test - no hay autenticación');
        return;
      }
      
      // Ejemplo: Test para historial de pedidos del usuario
      console.log('📋 Testing user order history...');
      
      const { result, duration } = await measureResponseTime(async () => {
        return makeRequest('GET', '/api/orders/my-orders', undefined, {
          'Authorization': `Bearer ${authToken}`
        });
      });
      
      console.log(`⏱️ Order history took: ${duration}ms`);
      
      expect(result.status).toBe(200);
      expect(duration).toBeLessThan(6000); // 6 segundos para historial
      
    }, 30000);
  });

  describe('Business Logic Performance', () => {
    test('Checkout process simulation', async () => {
      if (!authToken) {
        console.log('⏭️ Saltando test checkout - no hay autenticación');
        return;
      }
      
      console.log('🛒 Simulating checkout process...');
      
      const checkoutSteps = [
        // 1. Obtener carrito
        async () => makeRequest('GET', '/api/cart', undefined, {
          'Authorization': `Bearer ${authToken}`
        }),
        
        // 2. Calcular envío (ejemplo)
        async () => makeRequest('POST', '/api/shipping/calculate', {
          items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
          address: { city: 'Buenos Aires', neighborhood: 'Palermo' }
        }, {
          'Authorization': `Bearer ${authToken}`
        }),
        
        // 3. Aplicar cupón (ejemplo)
        async () => makeRequest('POST', '/api/cart/apply-coupon', {
          couponCode: 'TEST10'
        }, {
          'Authorization': `Bearer ${authToken}`
        })      ];
      
      interface CheckoutStepResult {
        step: number;
        status: number;
        duration: number;
      }
      
      const results: CheckoutStepResult[] = [];
      let totalTime = 0;
      
      for (let i = 0; i < checkoutSteps.length; i++) {
        const { result, duration } = await measureResponseTime(checkoutSteps[i]);
        
        results.push({ step: i + 1, status: result.status, duration });
        totalTime += duration;
        
        console.log(`   Step ${i + 1}: ${result.status} - ${duration}ms`);
        
        // Pausa entre pasos
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`🏁 Checkout simulation completed in: ${totalTime}ms`);
      
      // El proceso completo no debería tomar más de 30 segundos
      expect(totalTime).toBeLessThan(30000);
      
      // Al menos algunos pasos deberían ser exitosos
      const successfulSteps = results.filter(r => r.status >= 200 && r.status < 400);
      expect(successfulSteps.length).toBeGreaterThan(0);
      
    }, 60000);    test('Search performance with different queries', async () => {
      const searchQueries = [
        'laptop',
        'smartphone',
        'headphones',
        'wireless',
        'gaming'
      ];
      
      console.log('🔍 Testing search performance with multiple queries...');
      
      interface SearchResult {
        query: string;
        status: number;
        duration: number;
        resultCount: number;
      }
      
      const searchResults: SearchResult[] = [];
      
      for (const query of searchQueries) {
        const { result, duration } = await measureResponseTime(async () => {
          return makeRequest('GET', `/api/products/search?q=${query}`);
        });
        
        searchResults.push({
          query,
          status: result.status,
          duration,
          resultCount: result.data?.total || 0
        });
        
        console.log(`   "${query}": ${result.status} - ${duration}ms - ${result.data?.total || 0} results`);
        
        // Pausa entre búsquedas
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Calcular estadísticas
      const avgDuration = searchResults.reduce((sum, r) => sum + r.duration, 0) / searchResults.length;
      const maxDuration = Math.max(...searchResults.map(r => r.duration));
      
      console.log(`📊 Search Statistics:`);
      console.log(`   Average duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`   Max duration: ${maxDuration}ms`);
      
      // Todas las búsquedas deberían completarse en tiempo razonable
      expect(avgDuration).toBeLessThan(8000); // 8 segundos promedio
      expect(maxDuration).toBeLessThan(15000); // 15 segundos máximo
      
      // Al menos algunas búsquedas deberían ser exitosas
      const successfulSearches = searchResults.filter(r => r.status === 200);
      expect(successfulSearches.length).toBeGreaterThan(searchQueries.length * 0.5);
      
    }, 90000);
  });

  describe('Database Performance Indicators', () => {    test('Large dataset pagination', async () => {
      console.log('📄 Testing pagination performance with large datasets...');
      
      const pages = [1, 2, 3, 10, 50]; // Diferentes páginas para testear
      const pageSize = 20;
      
      interface PaginationResult {
        page: number;
        status: number;
        duration: number;
        itemCount: number;
      }
      
      const paginationResults: PaginationResult[] = [];
      
      for (const page of pages) {
        const { result, duration } = await measureResponseTime(async () => {
          return makeRequest('GET', `/api/products?page=${page}&limit=${pageSize}`);
        });
        
        paginationResults.push({
          page,
          status: result.status,
          duration,
          itemCount: result.data?.items?.length || 0
        });
        
        console.log(`   Page ${page}: ${result.status} - ${duration}ms - ${result.data?.items?.length || 0} items`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // La paginación debería ser consistente en performance
      const durations = paginationResults.filter(r => r.status === 200).map(r => r.duration);
      
      if (durations.length > 1) {
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxVariation = Math.max(...durations) - Math.min(...durations);
        
        console.log(`📊 Pagination Performance:`);
        console.log(`   Average: ${avgDuration.toFixed(2)}ms`);
        console.log(`   Variation: ${maxVariation}ms`);
        
        // La variación en paginación no debería ser extrema
        expect(maxVariation).toBeLessThan(avgDuration * 2); // No más del 200% de variación
      }
      
    }, 60000);
  });
});

// Exportar funciones útiles para otros tests
export {
  // Re-exportar utilidades para otros tests personalizados
  warmupServer,
  makeRequest,
  getAuthToken,
  measureResponseTime
};
