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
            console.log(`🔧 Herramienta usada: ${response.data.tool_used}`);
            console.log(`📋 Parámetros: ${JSON.stringify(response.data.tool_params)}`);
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

// Función principal para probar búsqueda de clientes
async function testCustomerSearch() {
    console.log('🔍 PROBANDO BÚSQUEDA ESPECÍFICA DE CLIENTES - CORRECCIÓN');
    console.log('='.repeat(80));

    // Prueba de búsqueda de cliente específico (corregida)
    await sendMCPQuery('buscar cliente llamado Juan');

    console.log('✨ Prueba completada');
}

// Ejecutar la prueba
testCustomerSearch().catch(console.error);
