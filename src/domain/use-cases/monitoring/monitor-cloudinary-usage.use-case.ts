import { v2 as cloudinary } from 'cloudinary';
import { CustomError } from "../../errors/custom.error";
import { CloudinaryUsageEntity, CloudinaryResourceInfo, CloudinaryLimits } from "../../entities/monitoring/cloudinary-usage.entity";
import { envs } from '../../../configs/envs';

export class MonitorCloudinaryUsageUseCase {
    async execute(): Promise<CloudinaryUsageEntity> {
        try {
            // Configurar Cloudinary si no está configurado
            cloudinary.config({
                cloud_name: envs.CLOUDINARY_CLOUD_NAME,
                api_key: envs.CLOUDINARY_API_KEY,
                api_secret: envs.CLOUDINARY_API_SECRET
            });

            // Obtener información de recursos
            const [resourcesInfo, foldersInfo, usageInfo] = await Promise.all([
                this.getResourcesInfo(),
                this.getFoldersInfo(),
                this.getUsageInfo()
            ]);

            // Determinar límites según el plan (Free tier típico)
            const limits = this.getLimitsForPlan('Free');

            // Generar recomendaciones
            const recommendations = this.generateRecommendations(
                resourcesInfo,
                usageInfo,
                limits
            );

            return new CloudinaryUsageEntity(
                envs.CLOUDINARY_CLOUD_NAME,
                'Free', // En tier gratuito típicamente
                resourcesInfo,
                usageInfo,
                foldersInfo,
                limits,
                recommendations,
                new Date()
            );

        } catch (error) {
            console.error('Error monitoring Cloudinary usage:', error);

            // Si hay error de API, devolver información básica estimada
            if (error instanceof Error && error.message.includes('Invalid API')) {
                return this.getFallbackData();
            }

            throw CustomError.internalServerError('Error al obtener métricas de Cloudinary');
        }
    }

    private async getResourcesInfo(): Promise<CloudinaryResourceInfo> {
        try {
            // Intentar obtener recursos por tipo
            const [images, videos, others] = await Promise.all([
                cloudinary.search.expression('resource_type:image').max_results(1).execute(),
                cloudinary.search.expression('resource_type:video').max_results(1).execute(),
                cloudinary.search.expression('resource_type:raw').max_results(1).execute()
            ]);

            // Estimación del tamaño total (Cloudinary Free tier típicamente limita esto)
            let totalSize = 0;
            let totalImages = images.total_count || 0;
            let totalVideos = videos.total_count || 0;
            let totalOthers = others.total_count || 0;

            // Intentar obtener una muestra para estimar tamaño promedio
            try {
                const sampleResources = await cloudinary.search
                    .max_results(10)
                    .execute();

                if (sampleResources.resources && sampleResources.resources.length > 0) {
                    const avgSize = sampleResources.resources.reduce((sum: number, resource: any) =>
                        sum + (resource.bytes || 0), 0) / sampleResources.resources.length;

                    totalSize = Math.round(avgSize * (totalImages + totalVideos + totalOthers));
                }
            } catch (sampleError) {
                // Si no se puede obtener muestra, estimar basado en promedios típicos
                totalSize = (totalImages * 500000) + (totalVideos * 5000000) + (totalOthers * 100000); // Estimación conservadora
            }

            return {
                totalImages,
                totalVideos,
                totalOtherFiles: totalOthers,
                totalSize,
                sizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
                sizeGB: Math.round((totalSize / (1024 * 1024 * 1024)) * 100) / 100
            };

        } catch (error) {
            console.error('Error getting resources info:', error);
            // Valores por defecto si no se puede acceder
            return {
                totalImages: 0,
                totalVideos: 0,
                totalOtherFiles: 0,
                totalSize: 0,
                sizeMB: 0,
                sizeGB: 0
            };
        }
    }

    private async getFoldersInfo(): Promise<{ name: string; resourceCount: number }[]> {
        try {
            // Obtener información de carpetas populares
            const folders = ['products', 'users', 'categories', 'temp'];
            const folderInfoPromises = folders.map(async (folder) => {
                try {
                    const result = await cloudinary.search
                        .expression(`folder:${folder}`)
                        .max_results(1)
                        .execute();

                    return {
                        name: folder,
                        resourceCount: result.total_count || 0
                    };
                } catch {
                    return {
                        name: folder,
                        resourceCount: 0
                    };
                }
            });

            const folderResults = await Promise.all(folderInfoPromises);
            return folderResults.filter(folder => folder.resourceCount > 0);

        } catch (error) {
            console.error('Error getting folders info:', error);
            return [];
        }
    }

    private async getUsageInfo(): Promise<{
        transformations: number;
        bandwidth: number;
        bandwidthMB: number;
        bandwidthGB: number;
        requests: number;
    }> {
        try {
            // Nota: La API de Cloudinary Free tier tiene limitaciones para obtener métricas detalladas
            // En producción, esto requeriría un plan pago para acceso completo a Analytics API

            // Estimación basada en el número de recursos y uso típico
            const resourcesResult = await cloudinary.search.max_results(1).execute();
            const totalResources = resourcesResult.total_count || 0;

            // Estimaciones conservadoras para tier gratuito
            const estimatedTransformations = Math.min(totalResources * 2, 1000); // Max 2 transformaciones por recurso
            const estimatedBandwidth = totalResources * 500000; // ~500KB promedio por recurso
            const estimatedRequests = totalResources * 3; // ~3 requests por recurso (upload, transform, deliver)

            return {
                transformations: estimatedTransformations,
                bandwidth: estimatedBandwidth,
                bandwidthMB: Math.round((estimatedBandwidth / (1024 * 1024)) * 100) / 100,
                bandwidthGB: Math.round((estimatedBandwidth / (1024 * 1024 * 1024)) * 100) / 100,
                requests: estimatedRequests
            };

        } catch (error) {
            console.error('Error getting usage info:', error);
            return {
                transformations: 0,
                bandwidth: 0,
                bandwidthMB: 0,
                bandwidthGB: 0,
                requests: 0
            };
        }
    }

    private getLimitsForPlan(plan: string): CloudinaryLimits {
        // Límites típicos del tier gratuito de Cloudinary
        switch (plan.toLowerCase()) {
            case 'free':
                return {
                    plan: 'Free',
                    maxStorage: 25, // GB
                    maxTransformations: 25000, // por mes
                    maxBandwidth: 25, // GB por mes
                    maxRequests: 1000000 // por mes
                };
            case 'plus':
                return {
                    plan: 'Plus',
                    maxStorage: 100,
                    maxTransformations: 100000,
                    maxBandwidth: 100,
                    maxRequests: 5000000
                };
            default:
                return {
                    plan: 'Free',
                    maxStorage: 25,
                    maxTransformations: 25000,
                    maxBandwidth: 25,
                    maxRequests: 1000000
                };
        }
    }

    private generateRecommendations(
        resources: CloudinaryResourceInfo,
        usage: any,
        limits: CloudinaryLimits
    ): string[] {
        const recommendations: string[] = [];

        const storagePercentage = (resources.sizeGB / limits.maxStorage) * 100;
        const bandwidthPercentage = (usage.bandwidthGB / limits.maxBandwidth) * 100;
        const transformationsPercentage = (usage.transformations / limits.maxTransformations) * 100;

        // Recomendaciones para almacenamiento
        if (storagePercentage > 90) {
            recommendations.push('🚨 Almacenamiento crítico: eliminar imágenes no utilizadas');
        } else if (storagePercentage > 75) {
            recommendations.push('⚠️ Almacenamiento alto: revisar imágenes innecesarias');
        } else if (storagePercentage > 50) {
            recommendations.push('💡 Considerar optimizar imágenes para reducir tamaño');
        } else {
            recommendations.push('✅ Almacenamiento dentro de límites normales');
        }

        // Recomendaciones para bandwidth
        if (bandwidthPercentage > 90) {
            recommendations.push('🚨 Bandwidth crítico: optimizar entrega de imágenes');
        } else if (bandwidthPercentage > 75) {
            recommendations.push('⚠️ Bandwidth alto: implementar lazy loading');
        } else {
            recommendations.push('✅ Bandwidth dentro de límites normales');
        }

        // Recomendaciones para transformaciones
        if (transformationsPercentage > 90) {
            recommendations.push('🚨 Transformaciones críticas: cachear transformaciones frecuentes');
        } else if (transformationsPercentage > 75) {
            recommendations.push('⚠️ Transformaciones altas: revisar transformaciones innecesarias');
        } else {
            recommendations.push('✅ Transformaciones dentro de límites normales');
        }

        // Recomendaciones generales
        if (resources.totalImages > 100) {
            recommendations.push('📊 Considerar implementar CDN para mejorar rendimiento');
        }

        if (resources.totalImages > 500) {
            recommendations.push('🔄 Considerar migrar a plan pago para mejores características');
        }

        return recommendations;
    }

    private getFallbackData(): CloudinaryUsageEntity {
        // Datos básicos cuando no se puede acceder a la API
        const resources: CloudinaryResourceInfo = {
            totalImages: 0,
            totalVideos: 0,
            totalOtherFiles: 0,
            totalSize: 0,
            sizeMB: 0,
            sizeGB: 0
        };

        const usage = {
            transformations: 0,
            bandwidth: 0,
            bandwidthMB: 0,
            bandwidthGB: 0,
            requests: 0
        };

        const limits = this.getLimitsForPlan('Free');
        const recommendations = ['⚠️ No se pudo conectar con Cloudinary API'];

        return new CloudinaryUsageEntity(
            envs.CLOUDINARY_CLOUD_NAME || 'unknown',
            'Free',
            resources,
            usage,
            [],
            limits,
            recommendations,
            new Date()
        );
    }
}
