const axios = require('axios');

async function testEmpanadas() {
    try {
        console.log('🧪 Probando: ¿Cuál es el precio la empanada?');
        console.log('🔗 Endpoint: /api/mcp/anthropic');

        const response = await axios.post('http://localhost:3000/api/mcp/anthropic', {
            model: 'claude-3-5-haiku-20241022',
            messages: [
                {
                    role: 'user',
                    content: '¿Cuál es el precio la empanada?'
                }
            ],
            max_tokens: 1500
        });

        console.log('✅ Resultado:');
        console.log('📋 Status:', response.status);
        console.log('📄 Respuesta completa:');
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.statusText);
        console.log('📄 Error details:', error.response?.data || error.message);
    }
}

testEmpanadas();
