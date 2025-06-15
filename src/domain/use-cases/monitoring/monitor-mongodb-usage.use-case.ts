import { CustomError } from "../../errors/custom.error";
import { MongoDBUsageEntity, MongoDBCollectionInfo, MongoDBStorageInfo } from "../../entities/monitoring/mongodb-usage.entity";
import mongoose from 'mongoose';

export class MonitorMongoDBUsageUseCase {
    async execute(): Promise<MongoDBUsageEntity> {
        try {
            const db = mongoose.connection.db;
            if (!db) {
                throw CustomError.internalServerError('No hay conexión activa a MongoDB');
            }            // 1. Obtener información de todas las colecciones primero
            const collections = await this.getCollectionsInfo(db);

            // 2. Calcular storage usado basado en las colecciones (más confiable que dbStats)
            const totalDataSize = collections.reduce((sum, col) => sum + col.storageSize, 0);
            const totalIndexSize = collections.reduce((sum, col) => sum + col.indexSize, 0);
            const storageUsedBytes = totalDataSize + totalIndexSize;

            // 3. Intentar obtener dbStats como backup, pero usar nuestro cálculo si es más confiable
            let dbStatsDataSize = 0;
            let dbStatsIndexSize = 0;
            try {
                const dbStats = await db.admin().command({ dbStats: 1, scale: 1 });
                dbStatsDataSize = dbStats.dataSize || 0;
                dbStatsIndexSize = dbStats.indexSize || 0;
            } catch (error) {
                console.log('dbStats no disponible, usando cálculo basado en colecciones');
            }

            // Usar el valor más alto entre nuestro cálculo y dbStats
            const finalStorageBytes = Math.max(storageUsedBytes, dbStatsDataSize + dbStatsIndexSize);

            // 4. Obtener estado de conexiones actuales
            let currentConnections = 0;
            try {
                const serverStatus = await db.admin().command({ serverStatus: 1 });
                currentConnections = serverStatus.connections?.current || 0;
            } catch (error) {
                // En tier gratuito, estimamos las conexiones usando el pool de mongoose
                currentConnections = mongoose.connection.readyState === 1 ? 1 : 0;
            }

            // 5. Calcular uso y porcentajes
            const maxStorageBytes = 512 * 1024 * 1024; // 512MB en bytes
            const storageUsedMB = finalStorageBytes / (1024 * 1024);
            const storagePercentage = (finalStorageBytes / maxStorageBytes) * 100;

            const storageUsed: MongoDBStorageInfo = {
                bytes: finalStorageBytes,
                mb: Math.round(storageUsedMB * 100) / 100,
                percentage: Math.round(storagePercentage * 100) / 100
            };            // 6. Generar recomendaciones
            const recommendations = this.generateRecommendations(
                storagePercentage,
                collections,
                currentConnections
            );

            return MongoDBUsageEntity.create({
                cluster: db.databaseName,
                storageUsed,
                limits: {
                    maxStorage: 512, // MB
                    maxConnections: 500
                },
                currentConnections,
                collections,
                recommendations
            });

        } catch (error) {
            throw CustomError.internalServerError(`Error obteniendo estadísticas de MongoDB: ${error}`);
        }
    } private async getCollectionsInfo(db: any): Promise<MongoDBCollectionInfo[]> {
        try {
            const collections = await db.listCollections().toArray();
            const collectionsInfo: MongoDBCollectionInfo[] = [];

            for (const collection of collections) {
                try {
                    // Obtener conteo de documentos directamente
                    const documentCount = await db.collection(collection.name).countDocuments();

                    // Intentar obtener stats, pero usar valores por defecto si falla
                    let storageSize = 0;
                    let indexSize = 0;

                    try {
                        const stats = await db.collection(collection.name).stats();
                        storageSize = stats.size || 0;
                        indexSize = stats.totalIndexSize || 0;
                    } catch (statsError) {
                        // Si stats() falla, usamos estimaciones
                        // Estimación aproximada: 1KB promedio por documento
                        storageSize = documentCount * 1024;
                        indexSize = 0;
                    }

                    collectionsInfo.push({
                        name: collection.name,
                        documentCount,
                        storageSize,
                        indexSize
                    });
                } catch (error) {
                    // Si falla todo, al menos intentamos un conteo básico
                    try {
                        const documentCount = await db.collection(collection.name).estimatedDocumentCount();
                        collectionsInfo.push({
                            name: collection.name,
                            documentCount,
                            storageSize: documentCount * 1024, // Estimación
                            indexSize: 0
                        });
                    } catch (fallbackError) {
                        // Como último recurso, agregar con 0s
                        collectionsInfo.push({
                            name: collection.name,
                            documentCount: 0,
                            storageSize: 0,
                            indexSize: 0
                        });
                    }
                }
            }

            return collectionsInfo.sort((a, b) => b.storageSize - a.storageSize);
        } catch (error) {
            console.error('Error obteniendo información de colecciones:', error);
            return [];
        }
    }

    private generateRecommendations(
        storagePercentage: number,
        collections: MongoDBCollectionInfo[],
        currentConnections: number
    ): string[] {
        const recommendations: string[] = [];

        // Recomendaciones de almacenamiento
        if (storagePercentage > 80) {
            recommendations.push('⚠️ CRÍTICO: Almacenamiento al ' + storagePercentage.toFixed(1) + '%. Considere limpiar datos o migrar a tier pago.');
        } else if (storagePercentage > 60) {
            recommendations.push('⚠️ ADVERTENCIA: Almacenamiento al ' + storagePercentage.toFixed(1) + '%. Monitoree el crecimiento.');
        }

        // Recomendaciones por colección
        const largestCollections = collections
            .filter(c => c.storageSize > 10 * 1024 * 1024) // >10MB
            .slice(0, 3);

        if (largestCollections.length > 0) {
            recommendations.push(
                `🗂️ Colecciones más grandes: ${largestCollections.map(c =>
                    `${c.name} (${(c.storageSize / (1024 * 1024)).toFixed(1)}MB)`
                ).join(', ')}`
            );
        }

        // Recomendaciones de conexiones
        if (currentConnections > 400) {
            recommendations.push('🔌 ADVERTENCIA: Muchas conexiones activas (' + currentConnections + '/500). Optimice el pool de conexiones.');
        }

        // Recomendaciones generales
        if (storagePercentage > 50) {
            recommendations.push('💡 Considere implementar TTL (Time To Live) en documentos temporales.');
            recommendations.push('💡 Revise índices innecesarios que consumen espacio.');
            recommendations.push('💡 Implemente archivado de datos históricos.');
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ MongoDB está funcionando dentro de los límites normales.');
        }

        return recommendations;
    }
}
