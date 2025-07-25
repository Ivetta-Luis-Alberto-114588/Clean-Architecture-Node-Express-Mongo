const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Función para enviar una consulta de chat MCP
async function sendMCPQuery(message) {
    try {
        console.log(`🤖 Enviando consulta: "${message}"`);
        console.log('='.repeat(50));

        const response = await axios.post(`${BASE_URL}/api/mcp/chat`, {
            message: message
        });

        if (response.data.success) {
            console.log('✅ Respuesta exitosa:');
            console.log(response.data.message);
        } else {
            console.log('❌ Error en la respuesta:');
            console.log(response.data.error);
        }

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Error en la petición:', error.response?.data || error.message);
        console.log('\n' + '='.repeat(80) + '\n');
    }
}

// Función principal para probar diferentes consultas
async function testIntelligentDetection() {
    console.log('🔍 PROBANDO SISTEMA DE DETECCIÓN INTELIGENTE DE HERRAMIENTAS MCP');
    console.log('='.repeat(80));

    // Esperar un momento para que el servidor esté listo
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Prueba 1: Empanadas (debería usar search_products)
    await sendMCPQuery('¿Cuál es el precio de las empanadas?');

    // Prueba 2: Consulta general de productos (debería usar get_products)
    await sendMCPQuery('muéstrame todos los productos disponibles');

    // Prueba 3: Consulta general de clientes (debería usar get_customers)
    await sendMCPQuery('muéstrame todos los clientes');

    // Prueba 4: Búsqueda específica de cliente por nombre (debería usar search_customers)  
    await sendMCPQuery('buscar cliente llamado Juan');

    // Prueba 5: Consulta general de pedidos (debería usar get_orders)
    await sendMCPQuery('muéstrame todos los pedidos');

    // Prueba 6: Pedidos con filtro de estado (debería usar get_orders con parámetros)
    await sendMCPQuery('pedidos pendientes');

    console.log('✨ Pruebas completadas');
}

// Ejecutar las pruebas
testIntelligentDetection().catch(console.error);
