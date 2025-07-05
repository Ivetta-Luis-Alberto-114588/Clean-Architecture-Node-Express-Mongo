// test-telegram-webhook-simulation.js
// Script para simular el comportamiento del webhook con las notificaciones de Telegram

require('dotenv').config();

async function testTelegramNotifications() {
    console.log('=== TEST DE NOTIFICACIONES DE TELEGRAM (SIMULACIÓN WEBHOOK) ===\n');
    
    try {
        // Importar los módulos compilados
        const { NotificationServiceImpl } = require('./dist/infrastructure/services/notification.service');
        const { notificationConfig } = require('./dist/configs/notification.config');
        
        console.log('1. CREANDO SERVICIO DE NOTIFICACIONES...');
        const notificationService = new NotificationServiceImpl(notificationConfig);
        
        console.log('\n2. ENVIANDO NOTIFICACIÓN DE ORDEN (SIMULANDO WEBHOOK)...');
        
        const testOrderData = {
            orderId: '68699397365b49d07dcebaec', // Sale ID del reporte
            customerName: 'Usuario de Prueba',
            total: 2500.75,
            items: [
                {
                    name: 'Producto A',
                    quantity: 2,
                    price: 1250.00
                },
                {
                    name: 'Producto B', 
                    quantity: 1,
                    price: 1250.75
                }
            ]
        };
        
        console.log('Datos de la orden:', JSON.stringify(testOrderData, null, 2));
        
        await notificationService.sendOrderNotification(testOrderData);
        
        console.log('\n✅ TEST COMPLETADO - Verifica si llegó el mensaje de Telegram');
        
    } catch (error) {
        console.error('\n❌ ERROR EN EL TEST:', error.message);
        console.error('Stack:', error.stack);
    }
}

testTelegramNotifications();
