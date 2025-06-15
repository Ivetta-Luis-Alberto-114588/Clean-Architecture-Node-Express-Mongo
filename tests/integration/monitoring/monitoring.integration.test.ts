import { MonitorMongoDBUsageUseCase } from '../../../src/domain/use-cases/monitoring/monitor-mongodb-usage.use-case';
import { MonitorRenderUsageUseCase } from '../../../src/domain/use-cases/monitoring/monitor-render-usage.use-case';
import { MongoDatabase } from '../../../src/data/mongodb/mongo-database';
import { envs } from '../../../src/configs/envs';

describe('Monitoring Integration Tests', () => {
  beforeAll(async () => {
    await MongoDatabase.connect({
      p_mongoUrl: envs.MONGO_URL,
      p_dbName: envs.MONGO_DB_NAME
    });
  });

  describe('MonitorMongoDBUsageUseCase', () => {
    it('should return MongoDB usage report', async () => {
      const useCase = new MonitorMongoDBUsageUseCase();
      
      const result = await useCase.execute();
      
      expect(result).toBeDefined();
      expect(result.cluster).toBeDefined();
      expect(result.storageUsed).toBeDefined();
      expect(result.storageUsed.bytes).toBeGreaterThanOrEqual(0);
      expect(result.storageUsed.mb).toBeGreaterThanOrEqual(0);
      expect(result.storageUsed.percentage).toBeGreaterThanOrEqual(0);
      expect(result.limits).toBeDefined();
      expect(result.limits.maxStorage).toBe(512);
      expect(result.limits.maxConnections).toBe(500);
      expect(result.currentConnections).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.collections)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should provide recommendations based on usage', async () => {
      const useCase = new MonitorMongoDBUsageUseCase();
      
      const result = await useCase.execute();
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toMatch(/💡|⚠️|✅|🗂️|🔌/);
    });

    it('should calculate storage percentage correctly', async () => {
      const useCase = new MonitorMongoDBUsageUseCase();
      
      const result = await useCase.execute();
      
      const expectedPercentage = (result.storageUsed.bytes / (512 * 1024 * 1024)) * 100;
      expect(Math.abs(result.storageUsed.percentage - expectedPercentage)).toBeLessThan(0.1);
    });
  });

  describe('MonitorRenderUsageUseCase', () => {
    it('should return Render usage report', async () => {
      const useCase = new MonitorRenderUsageUseCase();
      
      const result = await useCase.execute();
      
      expect(result).toBeDefined();
      expect(result.service).toBe('Render.com');
      expect(result.plan).toBe('Free Tier');
      expect(result.limits).toBeDefined();
      expect(result.limits.monthlyHours).toBe(750);
      expect(result.limits.sleepAfterMinutes).toBe(15);
      expect(result.currentMonth).toBeDefined();
      expect(result.currentMonth.hoursUsed).toBeGreaterThanOrEqual(0);
      expect(result.currentMonth.hoursRemaining).toBeGreaterThanOrEqual(0);
      expect(result.currentMonth.percentage).toBeGreaterThanOrEqual(0);
      expect(result.currentInstance).toBeDefined();
      expect(result.currentInstance.uptime).toBeDefined();
      expect(result.currentInstance.memoryUsage).toBeDefined();
      expect(result.currentInstance.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should format uptime correctly', async () => {
      const useCase = new MonitorRenderUsageUseCase();
      
      const result = await useCase.execute();
      
      expect(result.currentInstance.uptime).toMatch(/^\d+[dhm]/);
    });

    it('should calculate memory usage percentage correctly', async () => {
      const useCase = new MonitorRenderUsageUseCase();
      
      const result = await useCase.execute();
      
      const memUsage = result.currentInstance.memoryUsage;
      const expectedPercentage = Math.round((memUsage.used / memUsage.total) * 100);
      expect(memUsage.percentage).toBe(expectedPercentage);
    });
  });

  describe('Entity Status Methods', () => {
    it('should correctly identify critical MongoDB status', async () => {
      const useCase = new MonitorMongoDBUsageUseCase();
      const result = await useCase.execute();
      
      const status = result.getStatus();
      expect(['healthy', 'warning', 'critical']).toContain(status);
      
      if (result.storageUsed.percentage > 85) {
        expect(result.isCritical()).toBe(true);
        expect(status).toBe('critical');
      }
    });

    it('should correctly identify warning MongoDB status', async () => {
      const useCase = new MonitorMongoDBUsageUseCase();
      const result = await useCase.execute();
      
      if (result.storageUsed.percentage > 70 && result.storageUsed.percentage <= 85) {
        expect(result.isWarning()).toBe(true);
        expect(result.getStatus()).toBe('warning');
      }
    });

    it('should correctly identify critical Render status', async () => {
      const useCase = new MonitorRenderUsageUseCase();
      const result = await useCase.execute();
      
      const status = result.getStatus();
      expect(['healthy', 'warning', 'critical']).toContain(status);
      
      if (result.currentMonth.percentage > 90) {
        expect(result.isCritical()).toBe(true);
        expect(status).toBe('critical');
      }
    });
  });
});
