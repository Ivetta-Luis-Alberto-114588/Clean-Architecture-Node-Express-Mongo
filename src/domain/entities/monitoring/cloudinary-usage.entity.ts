export interface CloudinaryResourceInfo {
    totalImages: number;
    totalVideos: number;
    totalOtherFiles: number;
    totalSize: number; // in bytes
    sizeMB: number;
    sizeGB: number;
}

export interface CloudinaryUsageDetails {
    currentMonth: {
        transformations: number;
        bandwidth: number; // bytes
        bandwidthMB: number;
        bandwidthGB: number;
        requests: number;
    };
    resources: CloudinaryResourceInfo;
    folders: {
        name: string;
        resourceCount: number;
    }[];
}

export interface CloudinaryLimits {
    plan: string;
    maxStorage: number; // GB
    maxTransformations: number;
    maxBandwidth: number; // GB
    maxRequests: number;
}

export class CloudinaryUsageEntity {
    constructor(
        public readonly cloudName: string,
        public readonly plan: string,
        public readonly resources: CloudinaryResourceInfo,
        public readonly currentMonth: {
            transformations: number;
            bandwidth: number;
            bandwidthMB: number;
            bandwidthGB: number;
            requests: number;
        },
        public readonly folders: {
            name: string;
            resourceCount: number;
        }[],
        public readonly limits: CloudinaryLimits,
        public readonly recommendations: string[],
        public readonly timestamp: Date
    ) { }

    // Métodos para determinar el estado
    getStatus(): string {
        if (this.isCritical()) return 'critical';
        if (this.isWarning()) return 'warning';
        return 'healthy';
    }

    isCritical(): boolean {
        const storagePercentage = this.getStoragePercentage();
        const bandwidthPercentage = this.getBandwidthPercentage();
        const transformationsPercentage = this.getTransformationsPercentage();

        return storagePercentage > 90 ||
            bandwidthPercentage > 90 ||
            transformationsPercentage > 90;
    }

    isWarning(): boolean {
        const storagePercentage = this.getStoragePercentage();
        const bandwidthPercentage = this.getBandwidthPercentage();
        const transformationsPercentage = this.getTransformationsPercentage();

        return storagePercentage > 75 ||
            bandwidthPercentage > 75 ||
            transformationsPercentage > 75;
    }

    getStoragePercentage(): number {
        if (this.limits.maxStorage === 0) return 0;
        return Math.round((this.resources.sizeGB / this.limits.maxStorage) * 100 * 100) / 100;
    }

    getBandwidthPercentage(): number {
        if (this.limits.maxBandwidth === 0) return 0;
        return Math.round((this.currentMonth.bandwidthGB / this.limits.maxBandwidth) * 100 * 100) / 100;
    }

    getTransformationsPercentage(): number {
        if (this.limits.maxTransformations === 0) return 0;
        return Math.round((this.currentMonth.transformations / this.limits.maxTransformations) * 100 * 100) / 100;
    }

    // Obtener la carpeta con más recursos
    getTopFolder(): { name: string; resourceCount: number } | null {
        if (this.folders.length === 0) return null;
        return this.folders.reduce((max, folder) =>
            folder.resourceCount > max.resourceCount ? folder : max
        );
    }

    // Obtener proyecciones de uso
    getUsageProjections(): {
        storage: { currentGB: number; projectedMonthlyGB: number; status: string };
        bandwidth: { currentGB: number; projectedMonthlyGB: number; status: string };
        transformations: { current: number; projectedMonthly: number; status: string };
    } {
        const now = new Date();
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const remainingDays = daysInMonth - dayOfMonth;

        // Proyecciones basadas en uso diario promedio
        const dailyBandwidth = this.currentMonth.bandwidthGB / dayOfMonth;
        const dailyTransformations = this.currentMonth.transformations / dayOfMonth;

        const projectedBandwidth = this.currentMonth.bandwidthGB + (dailyBandwidth * remainingDays);
        const projectedTransformations = this.currentMonth.transformations + (dailyTransformations * remainingDays);

        return {
            storage: {
                currentGB: this.resources.sizeGB,
                projectedMonthlyGB: this.resources.sizeGB, // Storage doesn't decrease
                status: this.resources.sizeGB < (this.limits.maxStorage * 0.8) ? 'OK' : 'Cuidado'
            },
            bandwidth: {
                currentGB: this.currentMonth.bandwidthGB,
                projectedMonthlyGB: Math.round(projectedBandwidth * 100) / 100,
                status: projectedBandwidth < (this.limits.maxBandwidth * 0.8) ? 'OK' : 'Cuidado'
            },
            transformations: {
                current: this.currentMonth.transformations,
                projectedMonthly: Math.round(projectedTransformations),
                status: projectedTransformations < (this.limits.maxTransformations * 0.8) ? 'OK' : 'Cuidado'
            }
        };
    }
}
