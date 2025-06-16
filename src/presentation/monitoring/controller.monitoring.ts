import { Request, Response } from 'express';
import { MonitorMongoDBUsageUseCase } from '../../domain/use-cases/monitoring/monitor-mongodb-usage.use-case';
import { MonitorRenderUsageUseCase } from '../../domain/use-cases/monitoring/monitor-render-usage.use-case';
import { MonitorCloudinaryUsageUseCase } from '../../domain/use-cases/monitoring/monitor-cloudinary-usage.use-case';
import { CustomError } from '../../domain/errors/custom.error';

export class MonitoringController {    getMongoDBUsage = async (req: Request, res: Response) => {
        try {
            const mongoUsage = await new MonitorMongoDBUsageUseCase().execute();
            
            // Formatear la respuesta con medidas humanamente legibles
            const formattedResponse = {
                service: 'MongoDB Atlas',
                timestamp: new Date().toISOString(),
                data: {
                    cluster: mongoUsage.cluster,
                    storage: {
                        used: {
                            mb: mongoUsage.storageUsed.mb,
                            gb: Math.round((mongoUsage.storageUsed.mb / 1024) * 100) / 100,
                            percentage: mongoUsage.storageUsed.percentage
                        },
                        limits: {
                            maxStorage: mongoUsage.limits.maxStorage,
                            maxStorageGB: Math.round((mongoUsage.limits.maxStorage / 1024) * 100) / 100,
                            maxConnections: mongoUsage.limits.maxConnections
                        },
                        remaining: {
                            mb: mongoUsage.limits.maxStorage - mongoUsage.storageUsed.mb,
                            gb: Math.round(((mongoUsage.limits.maxStorage - mongoUsage.storageUsed.mb) / 1024) * 100) / 100
                        }
                    },
                    connections: {
                        current: mongoUsage.currentConnections,
                        percentage: Math.round((mongoUsage.currentConnections / mongoUsage.limits.maxConnections) * 100 * 100) / 100,
                        limit: mongoUsage.limits.maxConnections,
                        available: mongoUsage.limits.maxConnections - mongoUsage.currentConnections
                    },
                    collections: mongoUsage.collections.map(collection => ({
                        name: collection.name,
                        documentCount: collection.documentCount,
                        storage: {
                            sizeMB: Math.round((collection.storageSize / (1024 * 1024)) * 100) / 100,
                            indexMB: Math.round((collection.indexSize / (1024 * 1024)) * 100) / 100,
                            totalMB: Math.round(((collection.storageSize + collection.indexSize) / (1024 * 1024)) * 100) / 100
                        }
                    })),
                    status: mongoUsage.getStatus(),
                    recommendations: mongoUsage.recommendations,
                    timestamp: mongoUsage.timestamp.toISOString()
                }
            };

            res.json(formattedResponse);
        } catch (error) {
            this.handleError(error, res);
        }
    };

    getRenderUsage = async (req: Request, res: Response) => {
        try {
            const renderUsage = await new MonitorRenderUsageUseCase().execute();
            res.json({
                service: 'Render.com',
                timestamp: new Date().toISOString(),
                data: renderUsage
            });
        } catch (error) {
            this.handleError(error, res);
        }
    };

    getCloudinaryUsage = async (req: Request, res: Response) => {
        try {
            const cloudinaryUsage = await new MonitorCloudinaryUsageUseCase().execute();
            res.json({
                service: 'Cloudinary',
                timestamp: new Date().toISOString(),
                data: cloudinaryUsage
            });
        } catch (error) {
            this.handleError(error, res);
        }
    };    getCompleteUsageReport = async (req: Request, res: Response) => {
        try {
            const [mongoUsage, renderUsage, cloudinaryUsage] = await Promise.all([
                new MonitorMongoDBUsageUseCase().execute(),
                new MonitorRenderUsageUseCase().execute(),
                new MonitorCloudinaryUsageUseCase().execute()
            ]);            const report = {
                timestamp: new Date().toISOString(),
                services: {                    mongodb: {
                        status: mongoUsage.getStatus(),
                        storage: {
                            used: mongoUsage.storageUsed.mb,
                            usedGB: Math.round((mongoUsage.storageUsed.mb / 1024) * 100) / 100,
                            percentage: mongoUsage.storageUsed.percentage,
                            limit: mongoUsage.limits.maxStorage,
                            limitGB: Math.round((mongoUsage.limits.maxStorage / 1024) * 100) / 100,
                            remaining: mongoUsage.limits.maxStorage - mongoUsage.storageUsed.mb,
                            remainingGB: Math.round(((mongoUsage.limits.maxStorage - mongoUsage.storageUsed.mb) / 1024) * 100) / 100
                        },
                        connections: {
                            current: mongoUsage.currentConnections,
                            percentage: Math.round((mongoUsage.currentConnections / mongoUsage.limits.maxConnections) * 100 * 100) / 100,
                            limit: mongoUsage.limits.maxConnections
                        },
                        recommendations: mongoUsage.recommendations,
                        alerts: mongoUsage.isCritical() ? ['critical'] : mongoUsage.isWarning() ? ['warning'] : []
                    },
                    render: {
                        status: renderUsage.getStatus(),
                        monthlyHours: {
                            used: renderUsage.currentMonth.hoursUsed,
                            percentage: renderUsage.currentMonth.percentage,
                            remaining: renderUsage.currentMonth.hoursRemaining,
                            limit: 750
                        },
                        memory: {
                            used: Math.round(renderUsage.currentInstance.memoryUsage.used / 1024 * 100) / 100, // MB
                            free: Math.round(renderUsage.currentInstance.memoryUsage.free / 1024 * 100) / 100, // MB
                            total: Math.round(renderUsage.currentInstance.memoryUsage.total / 1024 * 100) / 100, // MB
                            percentage: renderUsage.currentInstance.memoryUsage.percentage
                        },
                        trafficProjections: renderUsage.currentMonth.trafficProjections,
                        recommendations: renderUsage.recommendations,
                        alerts: renderUsage.isCritical() ? ['critical'] : renderUsage.isWarning() ? ['warning'] : []
                    },
                    cloudinary: {
                        status: cloudinaryUsage.getStatus(),
                        storage: {
                            used: cloudinaryUsage.resources.sizeMB,
                            usedGB: cloudinaryUsage.resources.sizeGB,
                            percentage: cloudinaryUsage.getStoragePercentage(),
                            limit: cloudinaryUsage.limits.maxStorage,
                            remaining: cloudinaryUsage.limits.maxStorage - cloudinaryUsage.resources.sizeGB
                        },
                        bandwidth: {
                            used: cloudinaryUsage.currentMonth.bandwidthMB,
                            usedGB: cloudinaryUsage.currentMonth.bandwidthGB,
                            percentage: cloudinaryUsage.getBandwidthPercentage(),
                            limit: cloudinaryUsage.limits.maxBandwidth,
                            remaining: cloudinaryUsage.limits.maxBandwidth - cloudinaryUsage.currentMonth.bandwidthGB
                        },
                        transformations: {
                            used: cloudinaryUsage.currentMonth.transformations,
                            percentage: cloudinaryUsage.getTransformationsPercentage(),
                            limit: cloudinaryUsage.limits.maxTransformations,
                            remaining: cloudinaryUsage.limits.maxTransformations - cloudinaryUsage.currentMonth.transformations
                        },
                        resources: {
                            totalImages: cloudinaryUsage.resources.totalImages,
                            totalVideos: cloudinaryUsage.resources.totalVideos,
                            totalOthers: cloudinaryUsage.resources.totalOtherFiles,
                            totalFiles: cloudinaryUsage.resources.totalImages + cloudinaryUsage.resources.totalVideos + cloudinaryUsage.resources.totalOtherFiles
                        },
                        projections: cloudinaryUsage.getUsageProjections(),
                        recommendations: cloudinaryUsage.recommendations,
                        alerts: cloudinaryUsage.isCritical() ? ['critical'] : cloudinaryUsage.isWarning() ? ['warning'] : []
                    }
                },summary: {
                    criticalAlerts: [
                        ...(mongoUsage.isCritical() ? ['MongoDB: ' + mongoUsage.getStatus()] : []),
                        ...(renderUsage.isCritical() ? ['Render: ' + renderUsage.getStatus()] : []),
                        ...(cloudinaryUsage.isCritical() ? ['Cloudinary: ' + cloudinaryUsage.getStatus()] : [])
                    ],
                    overallStatus: this.getOverallStatus(mongoUsage.getStatus(), renderUsage.getStatus(), cloudinaryUsage.getStatus()),
                    totalServices: 3,
                    healthyServices: [mongoUsage, renderUsage, cloudinaryUsage].filter(service => service.getStatus() === 'healthy').length,
                    degradedServices: [mongoUsage, renderUsage, cloudinaryUsage].filter(service => service.getStatus() === 'warning').length,
                    unhealthyServices: [mongoUsage, renderUsage, cloudinaryUsage].filter(service => service.getStatus() === 'critical').length
                }
            };

            res.json(report);
        } catch (error) {
            this.handleError(error, res);
        }
    };    getAlerts = async (req: Request, res: Response) => {
        try {
            const [mongoUsage, renderUsage, cloudinaryUsage] = await Promise.all([
                new MonitorMongoDBUsageUseCase().execute(),
                new MonitorRenderUsageUseCase().execute(),
                new MonitorCloudinaryUsageUseCase().execute()
            ]);

            const alerts = [];

            // Alertas críticas y de warning
            if (mongoUsage.isCritical()) {
                alerts.push({
                    service: 'MongoDB',
                    level: 'critical',
                    message: `Almacenamiento al ${mongoUsage.storageUsed.percentage}%`,
                    action: 'Limpiar datos o migrar a tier pago',
                    details: mongoUsage.storageUsed
                });
            } else if (mongoUsage.isWarning()) {
                alerts.push({
                    service: 'MongoDB',
                    level: 'warning',
                    message: `Almacenamiento al ${mongoUsage.storageUsed.percentage}%`,
                    action: 'Monitorear el crecimiento',
                    details: mongoUsage.storageUsed
                });
            }

            if (renderUsage.isCritical()) {
                alerts.push({
                    service: 'Render',
                    level: 'critical',
                    message: `Horas usadas: ${renderUsage.currentMonth.percentage}%`,
                    action: 'Migrar a plan pago inmediatamente',
                    details: renderUsage.currentMonth
                });
            } else if (renderUsage.isWarning()) {
                alerts.push({
                    service: 'Render',
                    level: 'warning',
                    message: `Horas usadas: ${renderUsage.currentMonth.percentage}%`,
                    action: 'Monitorear el uso',
                    details: renderUsage.currentMonth
                });
            }

            // Alertas para Cloudinary
            if (cloudinaryUsage.isCritical()) {
                const storagePerc = cloudinaryUsage.getStoragePercentage();
                const bandwidthPerc = cloudinaryUsage.getBandwidthPercentage();
                const transformationsPerc = cloudinaryUsage.getTransformationsPercentage();
                
                if (storagePerc > 90) {
                    alerts.push({
                        service: 'Cloudinary',
                        level: 'critical',
                        message: `Almacenamiento crítico: ${storagePerc}%`,
                        action: 'Eliminar imágenes no utilizadas inmediatamente',
                        details: {
                            storage: cloudinaryUsage.resources,
                            threshold: '90%'
                        }
                    });
                }
                
                if (bandwidthPerc > 90) {
                    alerts.push({
                        service: 'Cloudinary',
                        level: 'critical',
                        message: `Bandwidth crítico: ${bandwidthPerc}%`,
                        action: 'Optimizar entrega de imágenes',
                        details: cloudinaryUsage.currentMonth
                    });
                }
                
                if (transformationsPerc > 90) {
                    alerts.push({
                        service: 'Cloudinary',
                        level: 'critical',
                        message: `Transformaciones críticas: ${transformationsPerc}%`,
                        action: 'Reducir transformaciones o migrar a plan pago',
                        details: {
                            transformations: cloudinaryUsage.currentMonth.transformations,
                            limit: cloudinaryUsage.limits.maxTransformations
                        }
                    });
                }
            } else if (cloudinaryUsage.isWarning()) {
                const storagePerc = cloudinaryUsage.getStoragePercentage();
                const bandwidthPerc = cloudinaryUsage.getBandwidthPercentage();
                const transformationsPerc = cloudinaryUsage.getTransformationsPercentage();
                
                if (storagePerc > 75) {
                    alerts.push({
                        service: 'Cloudinary',
                        level: 'warning',
                        message: `Almacenamiento alto: ${storagePerc}%`,
                        action: 'Revisar imágenes innecesarias',
                        details: cloudinaryUsage.resources
                    });
                }
                
                if (bandwidthPerc > 75) {
                    alerts.push({
                        service: 'Cloudinary',
                        level: 'warning',
                        message: `Bandwidth alto: ${bandwidthPerc}%`,
                        action: 'Implementar lazy loading',
                        details: cloudinaryUsage.currentMonth
                    });
                }
                
                if (transformationsPerc > 75) {
                    alerts.push({
                        service: 'Cloudinary',
                        level: 'warning',
                        message: `Transformaciones altas: ${transformationsPerc}%`,
                        action: 'Revisar transformaciones innecesarias',
                        details: {
                            transformations: cloudinaryUsage.currentMonth.transformations,
                            limit: cloudinaryUsage.limits.maxTransformations
                        }
                    });
                }
            }

            // Alertas informativas adicionales cuando todo está normal
            if (alerts.length === 0) {
                // Alertas informativas para MongoDB
                if (mongoUsage.storageUsed.percentage > 50) {
                    alerts.push({
                        service: 'MongoDB',
                        level: 'info',
                        message: `Almacenamiento al ${mongoUsage.storageUsed.percentage}%`,
                        action: 'Considerar limpiar datos innecesarios',
                        details: {
                            ...mongoUsage.storageUsed,
                            nextThreshold: 'Warning at 70%'
                        }
                    });
                }

                // Alertas informativas para Render
                if (renderUsage.currentMonth.percentage > 50) {
                    alerts.push({
                        service: 'Render',
                        level: 'info',
                        message: `Horas usadas: ${renderUsage.currentMonth.percentage}%`,
                        action: 'Monitorear uso mensual',
                        details: {
                            ...renderUsage.currentMonth,
                            nextThreshold: 'Warning at 75%'
                        }
                    });
                }

                // Alertas informativas para Cloudinary
                const cloudinaryStoragePerc = cloudinaryUsage.getStoragePercentage();
                const cloudinaryBandwidthPerc = cloudinaryUsage.getBandwidthPercentage();
                if (cloudinaryStoragePerc > 50 || cloudinaryBandwidthPerc > 50) {
                    alerts.push({
                        service: 'Cloudinary',
                        level: 'info',
                        message: `Almacenamiento: ${cloudinaryStoragePerc}%, Bandwidth: ${cloudinaryBandwidthPerc}%`,
                        action: 'Monitorear uso de imágenes',
                        details: {
                            storage: cloudinaryUsage.resources,
                            bandwidth: cloudinaryUsage.currentMonth,
                            nextThreshold: 'Warning at 75%'
                        }
                    });
                }

                // Si sigue sin alertas, agregar alertas de estado saludable
                if (alerts.length === 0) {
                    alerts.push({
                        service: 'MongoDB',
                        level: 'info',
                        message: `Sistema saludable - Almacenamiento: ${mongoUsage.storageUsed.percentage}%`,
                        action: 'Continuar monitoreo regular',
                        details: {
                            status: 'healthy',
                            storage: mongoUsage.storageUsed,
                            connections: mongoUsage.currentConnections
                        }
                    });

                    alerts.push({
                        service: 'Render',
                        level: 'info',
                        message: `Sistema saludable - Horas: ${renderUsage.currentMonth.percentage}%, Memoria: ${renderUsage.currentInstance.memoryUsage.percentage}%`,
                        action: 'Continuar monitoreo regular',
                        details: {
                            status: 'healthy',
                            monthly: renderUsage.currentMonth,
                            memory: renderUsage.currentInstance.memoryUsage
                        }
                    });

                    alerts.push({
                        service: 'Cloudinary',
                        level: 'info',
                        message: `Sistema saludable - Almacenamiento: ${cloudinaryUsage.getStoragePercentage()}%, Bandwidth: ${cloudinaryUsage.getBandwidthPercentage()}%`,
                        action: 'Continuar monitoreo regular',
                        details: {
                            status: 'healthy',
                            resources: cloudinaryUsage.resources,
                            usage: cloudinaryUsage.currentMonth,
                            projections: cloudinaryUsage.getUsageProjections()
                        }
                    });
                }
            }

            res.json({
                alerts,
                timestamp: new Date().toISOString(),
                totalAlerts: alerts.length,
                criticalCount: alerts.filter(a => a.level === 'critical').length,
                warningCount: alerts.filter(a => a.level === 'warning').length,
                infoCount: alerts.filter(a => a.level === 'info').length,                systemStatus: {
                    mongodb: mongoUsage.getStatus(),
                    render: renderUsage.getStatus(),
                    cloudinary: cloudinaryUsage.getStatus(),
                    overall: this.getOverallStatus(mongoUsage.getStatus(), renderUsage.getStatus(), cloudinaryUsage.getStatus())
                }
            });
        } catch (error) {
            this.handleError(error, res);
        }    };    getHealthCheck = async (req: Request, res: Response) => {
        try {
            const [mongoUsage, renderUsage, cloudinaryUsage] = await Promise.all([
                new MonitorMongoDBUsageUseCase().execute(),
                new MonitorRenderUsageUseCase().execute(),
                new MonitorCloudinaryUsageUseCase().execute()
            ]);

            const mongoStatus = mongoUsage.getStatus();
            const renderStatus = renderUsage.getStatus();
            const cloudinaryStatus = cloudinaryUsage.getStatus();
            const overallStatus = this.getOverallStatus(mongoStatus, renderStatus, cloudinaryStatus);

            res.json({
                status: overallStatus,
                timestamp: new Date().toISOString(),
                services: {
                    mongodb: {
                        status: mongoStatus,
                        storageUsage: mongoUsage.storageUsed.percentage,
                        connections: mongoUsage.currentConnections,
                        recommendations: mongoUsage.recommendations
                    },
                    render: {
                        status: renderStatus,
                        hoursUsage: renderUsage.currentMonth.percentage,
                        memoryUsage: renderUsage.currentInstance.memoryUsage.percentage,
                        recommendations: renderUsage.recommendations
                    },
                    cloudinary: {
                        status: cloudinaryStatus,
                        storageUsage: cloudinaryUsage.getStoragePercentage(),
                        bandwidthUsage: cloudinaryUsage.getBandwidthPercentage(),
                        transformationsUsage: cloudinaryUsage.getTransformationsPercentage(),
                        totalImages: cloudinaryUsage.resources.totalImages,
                        recommendations: cloudinaryUsage.recommendations
                    }
                },
                uptime: process.uptime()
            });
        } catch (error) {
            this.handleError(error, res);
        }
    };    private getOverallStatus(mongoStatus: string, renderStatus: string, cloudinaryStatus?: string): string {
        const statuses = [mongoStatus, renderStatus];
        if (cloudinaryStatus) statuses.push(cloudinaryStatus);
        
        if (statuses.includes('critical')) return 'critical';
        if (statuses.includes('warning')) return 'warning';
        return 'healthy';
    }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.error('Unhandled error in MonitoringController:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    };
}
