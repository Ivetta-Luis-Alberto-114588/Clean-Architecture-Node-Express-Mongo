const axios = require('axios');

// Simulación de un webhook real de MercadoPago
// Este script simula exactamente lo que MercadoPago envía cuando procesa un pago

const BASE_URL = 'http://localhost:3000';

async function simulateRealWebhook() {
    console.log('=== SIMULACIÓN DE WEBHOOK REAL DE MERCADOPAGO ===');

    try {
        // 1. Primero simulamos el webhook inicial de MercadoPago
        console.log('1. ENVIANDO WEBHOOK DE MERCADOPAGO...');

        const webhookPayload = {
            id: 12345678,
            live_mode: false,
            type: "payment",
            date_created: new Date().toISOString(),
            application_id: 2959476481170235,
            user_id: 79800495,
            version: 1,
            api_version: "v1",
            action: "payment.updated",
            data: {
                id: "12345678"
            }
        };

        console.log('Payload del webhook:', JSON.stringify(webhookPayload, null, 2));

        const webhookResponse = await axios.post(`${BASE_URL}/api/payments/webhook`, webhookPayload, {
            headers: {
                'Content-Type': 'application/json',
                'x-signature': 'ts=1234567890,v1=test_signature', // Firma simulada
                'User-Agent': 'MercadoPago-Webhook'
            },
            timeout: 30000
        });

        console.log('✅ Webhook Response Status:', webhookResponse.status);
        console.log('✅ Webhook Response:', webhookResponse.data);

        // 2. Simular varios webhooks para diferentes estados
        const paymentStates = [
            { status: 'approved', status_detail: 'accredited' },
            { status: 'pending', status_detail: 'pending_waiting_payment' },
            { status: 'approved', status_detail: 'accredited' }
        ];

        for (let i = 0; i < paymentStates.length; i++) {
            console.log(`\n2.${i + 1}. SIMULANDO WEBHOOK CON ESTADO: ${paymentStates[i].status}...`);

            const stateWebhook = {
                ...webhookPayload,
                id: 12345678 + i,
                data: {
                    id: `${12345678 + i}`
                }
            };

            try {
                const stateResponse = await axios.post(`${BASE_URL}/api/payments/webhook`, stateWebhook, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-signature': `ts=123456789${i},v1=test_signature_${i}`,
                        'User-Agent': 'MercadoPago-Webhook'
                    },
                    timeout: 30000
                });

                console.log(`✅ Estado ${paymentStates[i].status} - Response:`, stateResponse.status);
            } catch (error) {
                console.log(`❌ Error en webhook ${paymentStates[i].status}:`, error.message);
            }

            // Esperar un poco entre webhooks
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (error) {
        console.error('❌ ERROR EN SIMULACIÓN DE WEBHOOK:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

async function testMercadoPagoConnection() {
    console.log('\n=== VERIFICANDO CONEXIÓN CON BACKEND ===');

    try {
        const healthResponse = await axios.get(`${BASE_URL}/api/health`, {
            timeout: 10000
        });
        console.log('✅ Backend está funcionando:', healthResponse.status);
        return true;
    } catch (error) {
        console.error('❌ Backend no está disponible:', error.message);
        return false;
    }
}

async function main() {
    console.log('Iniciando simulación de webhook real...\n');

    // Verificar si el backend está funcionando
    const backendOk = await testMercadoPagoConnection();

    if (!backendOk) {
        console.log('❌ No se puede continuar sin el backend funcionando');
        console.log('💡 Asegúrate de que el backend esté corriendo en: npm run dev');
        return;
    }

    // Esperar un momento antes de empezar
    console.log('Esperando 3 segundos antes de enviar webhooks...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    await simulateRealWebhook();

    console.log('\n=== SIMULACIÓN COMPLETADA ===');
    console.log('💡 Revisa los logs del backend para verificar si se enviaron las notificaciones de Telegram');
    console.log('💡 También verifica si recibiste notificaciones por email y Telegram');
}

// Ejecutar el script
main().catch(console.error);
