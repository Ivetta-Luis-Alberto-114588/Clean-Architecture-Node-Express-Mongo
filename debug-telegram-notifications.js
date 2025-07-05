// debug-telegram-notifications.js
// Script para diagnosticar problemas con notificaciones de Telegram

const { config } = require('dotenv');
config();

console.log('=== DIAGNÓSTICO DE NOTIFICACIONES DE TELEGRAM ===\n');

// 1. Variables de entorno
console.log('1. VARIABLES DE ENTORNO:');
console.log('   TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ CONFIGURADO (****' + process.env.TELEGRAM_BOT_TOKEN.slice(-4) + ')' : '❌ NO CONFIGURADO');
console.log('   TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? '✅ CONFIGURADO (' + process.env.TELEGRAM_CHAT_ID + ')' : '❌ NO CONFIGURADO');
console.log('   NOTIFICATION_CHANNELS:', process.env.NOTIFICATION_CHANNELS ? '✅ CONFIGURADO (' + process.env.NOTIFICATION_CHANNELS + ')' : '⚠️  NO CONFIGURADO (usa default: [email])');

// 2. Configuración de notificaciones
console.log('\n2. CONFIGURACIÓN DE NOTIFICACIONES:');
const { notificationConfig } = require('./src/configs/notification.config');
console.log('   Canales activos:', notificationConfig.activeChannels);
console.log('   Telegram habilitado:', notificationConfig.activeChannels.includes('telegram') ? '✅ SÍ' : '❌ NO');
console.log('   Email habilitado:', notificationConfig.activeChannels.includes('email') ? '✅ SÍ' : '❌ NO');

if (notificationConfig.telegram) {
    console.log('   Bot Token configurado:', notificationConfig.telegram.botToken ? '✅ SÍ' : '❌ NO');
    console.log('   Chat ID configurado:', notificationConfig.telegram.chatId ? '✅ SÍ' : '❌ NO');
}

// 3. Test de servicio de Telegram
console.log('\n3. TEST DE SERVICIO DE TELEGRAM:');
try {
    const { TelegramAdapter } = require('./src/infrastructure/adapters/telegram.adapter');
    const { WinstonLoggerAdapter } = require('./src/infrastructure/adapters/winston-logger.adapter');

    const logger = new WinstonLoggerAdapter();
    const telegramAdapter = new TelegramAdapter({
        botToken: notificationConfig.telegram?.botToken || '',
        defaultChatId: notificationConfig.telegram?.chatId || ''
    }, logger);

    const isConfigured = telegramAdapter.isConfigured();
    console.log('   TelegramAdapter configurado:', isConfigured ? '✅ SÍ' : '❌ NO');

    if (isConfigured) {
        console.log('   ✅ El adaptador de Telegram está listo para enviar mensajes');
    } else {
        console.log('   ❌ El adaptador de Telegram NO puede enviar mensajes');
        console.log('   💡 Verifica que TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID estén configurados');
    }
} catch (error) {
    console.log('   ❌ ERROR creando TelegramAdapter:', error.message);
}

// 4. Test de servicio de notificaciones
console.log('\n4. TEST DE SERVICIO DE NOTIFICACIONES:');
try {
    const { NotificationServiceImpl } = require('./src/infrastructure/services/notification.service');
    const notificationService = new NotificationServiceImpl(notificationConfig);

    console.log('   ✅ NotificationServiceImpl creado exitosamente');
    console.log('   💡 Este es el servicio que usa el webhook de MercadoPago');
} catch (error) {
    console.log('   ❌ ERROR creando NotificationServiceImpl:', error.message);
}

// 5. Recomendaciones
console.log('\n5. RECOMENDACIONES PARA SOLUCIONAR EL PROBLEMA:');

if (!notificationConfig.activeChannels.includes('telegram')) {
    console.log('   🔧 PROBLEMA PRINCIPAL: Telegram no está en activeChannels');
    console.log('   🛠️  SOLUCIÓN: Agregar NOTIFICATION_CHANNELS=email,telegram al .env');
}

if (!notificationConfig.telegram?.botToken) {
    console.log('   🔧 PROBLEMA: TELEGRAM_BOT_TOKEN no configurado');
    console.log('   🛠️  SOLUCIÓN: Agregar TELEGRAM_BOT_TOKEN=tu_bot_token al .env');
}

if (!notificationConfig.telegram?.chatId) {
    console.log('   🔧 PROBLEMA: TELEGRAM_CHAT_ID no configurado');
    console.log('   🛠️  SOLUCIÓN: Agregar TELEGRAM_CHAT_ID=tu_chat_id al .env');
}

console.log('\n=== FIN DEL DIAGNÓSTICO ===');
