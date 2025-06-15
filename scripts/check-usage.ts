import 'dotenv/config';
import { MongoDatabase } from '../src/data/mongodb/mongo-database';
import { MonitorMongoDBUsageUseCase } from '../src/domain/use-cases/monitoring/monitor-mongodb-usage.use-case';
import { MonitorRenderUsageUseCase } from '../src/domain/use-cases/monitoring/monitor-render-usage.use-case';
import { envs } from '../src/configs/envs';

async function checkUsage() {
    console.log('🔍 Verificando uso de servicios...\n');

    try {
        // Conectar a MongoDB
        await MongoDatabase.connect({
            p_mongoUrl: envs.MONGO_URL,
            p_dbName: envs.MONGO_DB_NAME
        });

        // Obtener reportes
        const [mongoReport, renderReport] = await Promise.all([
            new MonitorMongoDBUsageUseCase().execute(),
            new MonitorRenderUsageUseCase().execute()
        ]);

        // Mostrar MongoDB
        console.log('📊 MONGODB ATLAS (Free Tier)');
        console.log('═'.repeat(50));
        console.log(`💾 Almacenamiento: ${mongoReport.storageUsed.mb}MB / 512MB (${mongoReport.storageUsed.percentage}%)`);
        console.log(`🔌 Conexiones actuales: ${mongoReport.currentConnections} / 500`);
        console.log(`📂 Colecciones: ${mongoReport.collections.length}`);
        console.log(`📅 Estado: ${mongoReport.getStatus().toUpperCase()}`);

        // Mostrar top 3 colecciones más grandes
        const topCollections = mongoReport.collections.slice(0, 3);
        if (topCollections.length > 0) {
            console.log('\n📂 Colecciones más grandes:');
            topCollections.forEach((col, index) => {
                const sizeMB = (col.storageSize / (1024 * 1024)).toFixed(1);
                console.log(`   ${index + 1}. ${col.name}: ${sizeMB}MB (${col.documentCount} docs)`);
            });
        }

        if (mongoReport.recommendations.length > 0) {
            console.log('\n💡 Recomendaciones MongoDB:');
            mongoReport.recommendations.forEach(rec => console.log(`   ${rec}`));
        }

        // Mostrar Render
        console.log('\n\n🚀 RENDER.COM (Free Tier)');
        console.log('═'.repeat(50));
        console.log(`⏰ Horas usadas: ${renderReport.currentMonth.hoursUsed}h / 750h (${renderReport.currentMonth.percentage}%)`);
        console.log(`⏳ Horas restantes: ${renderReport.currentMonth.hoursRemaining}h`);
        console.log(`📈 Uptime actual: ${renderReport.currentInstance.uptime}`);
        console.log(`💾 Memoria: ${renderReport.currentInstance.memoryUsage.used}MB / ${renderReport.currentInstance.memoryUsage.total}MB (${renderReport.currentInstance.memoryUsage.percentage}%)`);
        console.log(`🖥️ CPU: ${renderReport.currentInstance.cpuUsage}%`);
        console.log(`📅 Estado: ${renderReport.getStatus().toUpperCase()}`);

        if (renderReport.currentMonth.estimatedDepleteDate) {
            console.log(`⚠️ Fecha estimada de agotamiento: ${renderReport.currentMonth.estimatedDepleteDate}`);
        }

        if (renderReport.recommendations.length > 0) {
            console.log('\n💡 Recomendaciones Render:');
            renderReport.recommendations.forEach(rec => console.log(`   ${rec}`));
        }

        // Alertas críticas
        const criticalAlerts = [];
        if (mongoReport.isCritical()) {
            criticalAlerts.push(`MongoDB: ${mongoReport.getStatus()}`);
        }
        if (renderReport.isCritical()) {
            criticalAlerts.push(`Render: ${renderReport.getStatus()}`);
        }

        if (criticalAlerts.length > 0) {
            console.log('\n🚨 ALERTAS CRÍTICAS:');
            criticalAlerts.forEach(alert => console.log(`   ⚠️  ${alert}`));
        } else {
            console.log('\n✅ Todos los servicios están en rangos normales.');
        }

        // Resumen ejecutivo
        console.log('\n📋 RESUMEN EJECUTIVO:');
        console.log('─'.repeat(30));
        console.log(`🗄️ MongoDB: ${mongoReport.getStatus().toUpperCase()}`);
        console.log(`☁️ Render: ${renderReport.getStatus().toUpperCase()}`);

        const overallStatus = (mongoReport.getStatus() === 'critical' || renderReport.getStatus() === 'critical')
            ? 'CRÍTICO'
            : (mongoReport.getStatus() === 'warning' || renderReport.getStatus() === 'warning')
                ? 'ADVERTENCIA'
                : 'SALUDABLE';

        console.log(`🎯 Estado General: ${overallStatus}`);

    } catch (error) {
        console.error('❌ Error verificando uso:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    checkUsage();
}

export { checkUsage };
