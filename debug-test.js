const axios = require('axios');

async function debugTest() {
    try {
        console.log('🔍 Testing: "¿Cuál es el precio la empanada?"');

        const response = await axios.post('http://localhost:3000/api/mcp/anthropic', {
            model: 'claude-3-5-haiku-20241022',
            messages: [{
                role: 'user',
                content: '¿Cuál es el precio la empanada?'
            }],
            max_tokens: 1500
        });

        console.log('📋 Guardrails info:');
        console.log(JSON.stringify(response.data._guardrails, null, 2));

        console.log('\n📄 First 200 chars of response:');
        console.log(response.data.content[0]?.text?.substring(0, 200));

    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
}

debugTest();
