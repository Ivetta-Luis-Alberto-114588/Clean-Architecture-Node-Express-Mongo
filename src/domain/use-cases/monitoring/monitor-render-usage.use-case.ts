import { CustomError } from "../../errors/custom.error";
import { RenderUsageEntity, RenderMonthlyUsage, RenderInstanceInfo } from "../../entities/monitoring/render-usage.entity";
import os from 'os';
import process from 'process';

export class MonitorRenderUsageUseCase {
    async execute(): Promise<RenderUsageEntity> {
        try {
            // Calcular uso del mes actual (aproximado)
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const daysPassed = now.getDate();

            // Estimar horas usadas basado en uptime y patrón de uso
            const uptimeSeconds = process.uptime();
            const uptimeHours = uptimeSeconds / 3600;

            // Estimación conservadora: asumimos que la app está activa 8 horas por día promedio
            const estimatedDailyHours = 8;
            const estimatedHoursUsed = Math.min(daysPassed * estimatedDailyHours, 750);

            const hoursRemaining = 750 - estimatedHoursUsed;
            const usagePercentage = (estimatedHoursUsed / 750) * 100;

            const currentMonth: RenderMonthlyUsage = {
                hoursUsed: Math.round(estimatedHoursUsed * 100) / 100,
                hoursRemaining: Math.round(hoursRemaining * 100) / 100,
                percentage: Math.round(usagePercentage * 100) / 100,
                estimatedDepleteDate: this.calculateDepleteDate(hoursRemaining, daysInMonth - daysPassed)
            };

            // Información del sistema
            const memInfo = this.getMemoryInfo();
            const cpuUsage = this.getCPUUsage();

            const currentInstance: RenderInstanceInfo = {
                uptime: this.formatUptime(uptimeSeconds),
                memoryUsage: memInfo,
                cpuUsage: Math.round(cpuUsage * 100) / 100,
                environment: process.env.NODE_ENV || 'unknown'
            };

            // Generar recomendaciones
            const recommendations = this.generateRecommendations(
                usagePercentage,
                hoursRemaining,
                daysPassed,
                daysInMonth,
                memInfo.percentage
            );

            return RenderUsageEntity.create({
                service: 'Render.com',
                plan: 'Free Tier',
                limits: {
                    monthlyHours: 750,
                    sleepAfterMinutes: 15,
                    coldStartTime: '30-60 seconds'
                },
                currentMonth,
                currentInstance,
                recommendations
            });

        } catch (error) {
            throw CustomError.internalServerError(`Error obteniendo estadísticas de Render: ${error}`);
        }
    }

    private getMemoryInfo() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        return {
            used: Math.round(usedMemory / (1024 * 1024)), // MB
            free: Math.round(freeMemory / (1024 * 1024)), // MB
            total: Math.round(totalMemory / (1024 * 1024)), // MB
            percentage: Math.round((usedMemory / totalMemory) * 100)
        };
    }

    private getCPUUsage(): number {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type as keyof typeof cpu.times];
            }
            totalIdle += cpu.times.idle;
        });

        return 100 - Math.round((totalIdle / totalTick) * 100);
    }

    private formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    private calculateDepleteDate(hoursRemaining: number, daysRemaining: number): string | undefined {
        if (hoursRemaining <= 0) return 'Already depleted';

        const avgHoursPerDay = hoursRemaining / Math.max(daysRemaining, 1);
        if (avgHoursPerDay > 24) return undefined; // No se agotará este mes

        const daysUntilDepletion = hoursRemaining / 8; // Asumiendo 8h/día promedio
        const depleteDate = new Date();
        depleteDate.setDate(depleteDate.getDate() + daysUntilDepletion);

        return depleteDate.toISOString().split('T')[0];
    }

    private generateRecommendations(
        usagePercentage: number,
        hoursRemaining: number,
        daysPassed: number,
        daysInMonth: number,
        memoryPercentage: number
    ): string[] {
        const recommendations: string[] = [];

        // Recomendaciones de uso de horas
        if (usagePercentage > 90) {
            recommendations.push('🚨 CRÍTICO: Límite de horas casi agotado. Considere migrar a plan pago inmediatamente.');
        } else if (usagePercentage > 75) {
            recommendations.push('⚠️ ADVERTENCIA: Alto uso de horas mensuales. Monitoree de cerca.');
        }

        const daysRemaining = daysInMonth - daysPassed;
        const avgHoursPerDay = usagePercentage > 0 ? (usagePercentage / 100 * 750) / daysPassed : 0;
        const projectedUsage = avgHoursPerDay * daysInMonth;

        if (projectedUsage > 750) {
            recommendations.push(`📈 Proyección: ${Math.round(projectedUsage)}h este mes (excede límite). Optimice el uso.`);
        }

        // Recomendaciones de memoria
        if (memoryPercentage > 85) {
            recommendations.push('💾 ADVERTENCIA: Alto uso de memoria (' + memoryPercentage + '%). Revise memory leaks.');
        }

        // Recomendaciones específicas
        if (hoursRemaining < 50) {
            recommendations.push('💡 Considere implementar health checks más espaciados para reducir uso.');
            recommendations.push('💡 Revise si hay procesos que mantienen la app activa innecesariamente.');
        }

        if (usagePercentage < 50) {
            recommendations.push('✅ Uso de Render dentro de límites normales.');
        }

        recommendations.push('💡 Configure notificaciones cuando queden menos de 100 horas.');
        recommendations.push('💡 Implemente métricas de uso para monitoreo continuo.');

        return recommendations;
    }
}
