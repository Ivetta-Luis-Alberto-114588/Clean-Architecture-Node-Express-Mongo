const axios = require('axios');

const testCases = [
    // Casos problemáticos anteriores
    '¿Cuál es el precio la empanada?',         // SIN "de"
    '¿Cuál es el precio de las empanadas?',    // CON "de"

    // Variaciones naturales
    '¿Cuánto cuesta la pizza?',
    'quiero información sobre el lomito',
    'busco hamburguesas',
    'necesito datos de la picada',

    // Casos que deben ir a get_products (listado general)
    'muéstrame todos los productos',
    '¿qué productos tienen?',
    'lista completa de comida',

    // Casos edge
    'precio pizza margarita',
    'cuánto vale el combo',
];

async function testIntelligentSystem() {
    console.log('🧠 PROBANDO SISTEMA DE DETECCIÓN INTELIGENTE');
    console.log('='.repeat(60));

    for (let i = 0; i < testCases.length; i++) {
        const query = testCases[i];

        try {
            console.log(`\n🔍 Test ${i + 1}: "${query}"`);

            const response = await axios.post('http://localhost:3000/api/mcp/anthropic', {
                model: 'claude-3-5-haiku-20241022',
                messages: [{ role: 'user', content: query }],
                max_tokens: 1500
            });

            const toolUsed = response.data._guardrails?.toolsUsed?.[0] || 'NONE';
            const resultCount = response.data.content[0]?.text?.match(/(\d+) productos en total/)?.[1] || 'N/A';

            console.log(`   🎯 Herramienta: ${toolUsed}`);
            console.log(`   📊 Productos: ${resultCount}`);
            console.log(`   ✅ Estado: ${toolUsed.includes('search') ? 'ESPECÍFICA' : 'GENERAL'}`);

        } catch (error) {
            console.log(`   ❌ Error: ${error.response?.status || error.message}`);
        }

        // Pausa para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎉 Pruebas completadas');
}

testIntelligentSystem();
