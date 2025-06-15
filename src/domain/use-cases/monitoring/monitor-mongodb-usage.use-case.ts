import { CustomError } from "../../errors/custom.error";
import { MongoDBUsageEntity, MongoDBCollectionInfo, MongoDBStorageInfo } from "../../entities/monitoring/mongodb-usage.entity";
import mongoose from 'mongoose';

export class MonitorMongoDBUsageUseCase {  async execute(): Promise<MongoDBUsageEntity> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw CustomError.internalServerError('No hay conexión activa a MongoDB');
      }

      // 1. Obtener estadísticas generales de la base de datos
      const dbStats = await db.admin().command({ dbStats: 1, scale: 1 });
      
      // 2. Obtener información de todas las colecciones
      const collections = await this.getCollectionsInfo(db);
      
      // 3. Obtener estado de conexiones actuales (alternativo para tier gratuito)
      let currentConnections = 0;
      try {
        const serverStatus = await db.admin().command({ serverStatus: 1 });
        currentConnections = serverStatus.connections?.current || 0;
      } catch (error) {
        // En tier gratuito, estimamos las conexiones usando el pool de mongoose
        currentConnections = mongoose.connection.readyState === 1 ? 1 : 0;
      }
      
      // 4. Calcular uso y porcentajes
      const maxStorageBytes = 512 * 1024 * 1024; // 512MB en bytes
      const storageUsedBytes = dbStats.dataSize + dbStats.indexSize;
      const storageUsedMB = storageUsedBytes / (1024 * 1024);
      const storagePercentage = (storageUsedBytes / maxStorageBytes) * 100;

      const storageUsed: MongoDBStorageInfo = {
        bytes: storageUsedBytes,
        mb: Math.round(storageUsedMB * 100) / 100,
        percentage: Math.round(storagePercentage * 100) / 100
      };

      // 5. Generar recomendaciones
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
  }

  private async getCollectionsInfo(db: any): Promise<MongoDBCollectionInfo[]> {
    try {
      const collections = await db.listCollections().toArray();
      const collectionsInfo: MongoDBCollectionInfo[] = [];

      for (const collection of collections) {
        try {
          const stats = await db.collection(collection.name).stats();
          collectionsInfo.push({
            name: collection.name,
            documentCount: stats.count || 0,
            storageSize: stats.size || 0,
            indexSize: stats.totalIndexSize || 0
          });
        } catch (error) {
          // Algunas colecciones pueden no tener stats disponibles
          collectionsInfo.push({
            name: collection.name,
            documentCount: 0,
            storageSize: 0,
            indexSize: 0
          });
        }
      }

      return collectionsInfo.sort((a, b) => b.storageSize - a.storageSize);
    } catch (error) {
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
