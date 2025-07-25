const axios = require('axios');

async function testIntelligentSystem() {
    try {
        console.log('🧠 Probando Sistema Inteligente con LangChain + Claude');
        console.log('🧪 Consulta: ¿Cuál es el precio de las empanadas?');
        console.log('🔗 Endpoint: /api/intelligent/chat');

        const response = await axios.post('http://localhost:3000/api/intelligent/chat', {
            message: '¿Cuál es el precio de las empanadas?'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
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

async function testIntelligentAnthropic() {
    try {
        console.log('\n🔄 Probando Endpoint Compatible con Anthropic');
        console.log('🧪 Consulta: ¿Tienes pizza con provenzal?');
        console.log('🔗 Endpoint: /api/intelligent/anthropic');

        const response = await axios.post('http://localhost:3000/api/intelligent/anthropic', {
            messages: [
                {
                    role: 'user',
                    content: '¿Tienes pizza con provenzal?'
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
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

async function testHealthAndInfo() {
    try {
        console.log('\n❤️ Probando Health Check');
        const healthResponse = await axios.get('http://localhost:3000/api/intelligent/health');
        console.log('✅ Health:', healthResponse.data);

        console.log('\n📊 Probando Info');
        const infoResponse = await axios.get('http://localhost:3000/api/intelligent/info');
        console.log('✅ Info:', infoResponse.data.system, '-', infoResponse.data.version);
        console.log('🔧 Features:', infoResponse.data.features.length, 'disponibles');

    } catch (error) {
        console.log('❌ Error en health/info:', error.message);
    }
}

async function runAllTests() {
    console.log('🚀 === TESTING SISTEMA INTELIGENTE ===\n');

    // 1. Health y Info primero
    await testHealthAndInfo();

    // 2. Chat principal
    await testIntelligentSystem();

    // 3. Endpoint compatible
    await testIntelligentAnthropic();

    console.log('\n🏁 === TESTING COMPLETADO ===');
}

// Ejecutar todos los tests
runAllTests();
