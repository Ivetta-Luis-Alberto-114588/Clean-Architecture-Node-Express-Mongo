const axios = require('axios');

async function testLomito() {
    try {
        console.log('🔍 Testing: "¿cuánto cuesta el lomito?"');

        const response = await axios.post('http://localhost:3000/api/mcp/anthropic', {
            model: 'claude-3-5-haiku-20241022',
            messages: [{
                role: 'user',
                content: '¿cuánto cuesta el lomito?'
            }],
            max_tokens: 1500
        });

        console.log('📋 Guardrails info:');
        console.log(JSON.stringify(response.data._guardrails, null, 2));

        console.log('\n📄 Response text (first 200 chars):');
        console.log(response.data.content[0]?.text?.substring(0, 200));

        // Vamos a analizar por qué no detecta "lomito"
        console.log('\n🔍 Manual analysis:');
        console.log('- Message contains "lomito":', response.data.content[0]?.text?.toLowerCase().includes('lomito'));
        console.log('- Message contains search intent words:', ['precio', 'cuesta', 'cuanto'].some(word =>
            '¿cuánto cuesta el lomito?'.toLowerCase().includes(word)));

    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
}

testLomito();
