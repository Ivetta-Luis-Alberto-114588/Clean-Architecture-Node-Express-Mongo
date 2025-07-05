// debug-telegram-simple.js
// Script simple para verificar configuración de Telegram

require('dotenv').config();

console.log('=== VERIFICACIÓN RÁPIDA DE TELEGRAM ===\n');

console.log('Variables de entorno:');
console.log('- TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'CONFIGURADO' : 'NO CONFIGURADO');
console.log('- TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID || 'NO CONFIGURADO');
console.log('- NOTIFICATION_CHANNELS:', process.env.NOTIFICATION_CHANNELS || 'NO CONFIGURADO');

console.log('\n=== CONCLUSIÓN ===');
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID && process.env.NOTIFICATION_CHANNELS?.includes('telegram')) {
    console.log('✅ Todas las variables están configuradas correctamente');
    console.log('🔍 El problema debe estar en el código, no en la configuración');
} else {
    console.log('❌ Faltan variables de configuración');
}
