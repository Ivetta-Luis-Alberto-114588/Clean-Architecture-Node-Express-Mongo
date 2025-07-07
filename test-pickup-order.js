// test-pickup-order.js
// Script temporal para probar órdenes PICKUP sin dirección

const axios = require('axios');

async function testPickupOrder() {
    const baseURL = 'http://localhost:3001/api';

    // Datos de la orden PICKUP (sin campos de dirección)
    const pickupOrder = {
        items: [
            {
                productId: "6807f8ab022d7fe5f9d96200", // Un ID de producto válido
                quantity: 1,
                unitPrice: 7.25
            }
        ],
        deliveryMethodCode: "PICKUP", // Usar código en lugar de ID
        paymentMethodId: "686b18ba9808aab4814098b7", // ID de método de pago válido (efectivo)
        notes: "Pedido de prueba - Método: Retiro en Local",
        // NO incluir campos de shipping como antes fallaba:
        // customerName: "Cliente Prueba",
        // customerEmail: "test@example.com"
    };

    try {
        console.log('🧪 Probando orden PICKUP sin campos de dirección...');
        console.log('📦 Datos de la orden:', JSON.stringify(pickupOrder, null, 2));

        const response = await axios.post(`${baseURL}/sales`, pickupOrder, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Éxito! Orden creada:', response.data);
        console.log('✅ Status:', response.status);

    } catch (error) {
        console.log('❌ Error al crear orden:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }

        // Si el error es que faltan datos del cliente para invitados, intentemos con esos datos
        if (error.response?.data?.error?.includes('cliente') || error.response?.data?.error?.includes('invitado')) {
            console.log('\n🔄 Reintentando con datos de cliente invitado...');

            const pickupOrderWithCustomer = {
                ...pickupOrder,
                customerName: "Cliente Prueba",
                customerEmail: "test@example.com"
            };

            try {
                const retryResponse = await axios.post(`${baseURL}/sales`, pickupOrderWithCustomer, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                console.log('✅ Éxito con datos de cliente! Orden creada:', retryResponse.data);
                console.log('✅ Status:', retryResponse.status);

            } catch (retryError) {
                console.log('❌ Error en reintento:');
                if (retryError.response) {
                    console.log('Status:', retryError.response.status);
                    console.log('Error:', retryError.response.data);
                } else {
                    console.log('Error:', retryError.message);
                }
            }
        }
    }
}

// Ejecutar si el servidor está corriendo
testPickupOrder();
