const axios = require('axios');

async function testPizzaProvenzal() {
    try {
        console.log('🔍 Testing: "¿tenes algun producto pizza con provenzal?"');

        const response = await axios.post('http://localhost:3000/api/mcp/anthropic', {
            model: 'claude-3-5-haiku-20241022',
            messages: [{
                role: 'user',
                content: '¿tenes algun producto pizza con provenzal?'
            }],
            max_tokens: 1500
        });

        console.log('📋 Guardrails info:');
        console.log(JSON.stringify(response.data._guardrails, null, 2));

        console.log('\n📄 Response text (first 200 chars):');
        console.log(response.data.content[0]?.text?.substring(0, 200));

        // Verificar si contiene "pizza con provenzal" en la respuesta
        const hasProduct = response.data.content[0]?.text?.toLowerCase().includes('pizza con provenzal');
        console.log('\n🍕 Contains "pizza con provenzal":', hasProduct);

    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
}

testPizzaProvenzal();
