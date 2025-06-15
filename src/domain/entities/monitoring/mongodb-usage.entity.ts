export interface MongoDBCollectionInfo {
    name: string;
    documentCount: number;
    storageSize: number;
    indexSize: number;
}

export interface MongoDBStorageInfo {
    bytes: number;
    mb: number;
    percentage: number;
}

export interface MongoDBLimits {
    maxStorage: number; // 512MB for free tier
    maxConnections: number; // 500 for free tier
}

export class MongoDBUsageEntity {
    constructor(
        public cluster: string,
        public storageUsed: MongoDBStorageInfo,
        public limits: MongoDBLimits,
        public currentConnections: number,
        public collections: MongoDBCollectionInfo[],
        public recommendations: string[],
        public timestamp: Date
    ) { }

    static create(data: {
        cluster: string;
        storageUsed: MongoDBStorageInfo;
        limits: MongoDBLimits;
        currentConnections: number;
        collections: MongoDBCollectionInfo[];
        recommendations: string[];
    }): MongoDBUsageEntity {
        return new MongoDBUsageEntity(
            data.cluster,
            data.storageUsed,
            data.limits,
            data.currentConnections,
            data.collections,
            data.recommendations,
            new Date()
        );
    }

    isCritical(): boolean {
        return this.storageUsed.percentage > 85 || this.currentConnections > 450;
    }

    isWarning(): boolean {
        return this.storageUsed.percentage > 70 || this.currentConnections > 350;
    }

    getStatus(): 'healthy' | 'warning' | 'critical' {
        if (this.isCritical()) return 'critical';
        if (this.isWarning()) return 'warning';
        return 'healthy';
    }
}
