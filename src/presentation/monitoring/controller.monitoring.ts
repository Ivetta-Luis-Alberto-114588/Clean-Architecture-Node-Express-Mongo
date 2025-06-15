import { Request, Response } from 'express';
import { MonitorMongoDBUsageUseCase } from '../../domain/use-cases/monitoring/monitor-mongodb-usage.use-case';
import { MonitorRenderUsageUseCase } from '../../domain/use-cases/monitoring/monitor-render-usage.use-case';
import { CustomError } from '../../domain/errors/custom.error';

export class MonitoringController {
  getMongoDBUsage = async (req: Request, res: Response) => {
    try {
      const mongoUsage = await new MonitorMongoDBUsageUseCase().execute();
      res.json({
        service: 'MongoDB Atlas',
        timestamp: new Date().toISOString(),
        data: mongoUsage
      });
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

  getCompleteUsageReport = async (req: Request, res: Response) => {
    try {
      const [mongoUsage, renderUsage] = await Promise.all([
        new MonitorMongoDBUsageUseCase().execute(),
        new MonitorRenderUsageUseCase().execute()
      ]);

      const report = {
        timestamp: new Date().toISOString(),
        services: {
          mongodb: mongoUsage,
          render: renderUsage
        },
        summary: {
          criticalAlerts: [
            ...(mongoUsage.isCritical() ? ['MongoDB: ' + mongoUsage.getStatus()] : []),
            ...(renderUsage.isCritical() ? ['Render: ' + renderUsage.getStatus()] : [])
          ],
          overallStatus: this.getOverallStatus(mongoUsage.getStatus(), renderUsage.getStatus())
        }
      };

      res.json(report);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getAlerts = async (req: Request, res: Response) => {
    try {
      const [mongoUsage, renderUsage] = await Promise.all([
        new MonitorMongoDBUsageUseCase().execute(),
        new MonitorRenderUsageUseCase().execute()
      ]);

      const alerts = [];

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

      res.json({ 
        alerts, 
        timestamp: new Date().toISOString(),
        totalAlerts: alerts.length,
        criticalCount: alerts.filter(a => a.level === 'critical').length,
        warningCount: alerts.filter(a => a.level === 'warning').length
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
  getHealthCheck = async (req: Request, res: Response) => {
    try {
      const [mongoUsage, renderUsage] = await Promise.all([
        new MonitorMongoDBUsageUseCase().execute(),
        new MonitorRenderUsageUseCase().execute()
      ]);

      const mongoStatus = mongoUsage.getStatus();
      const renderStatus = renderUsage.getStatus();
      const overallStatus = this.getOverallStatus(mongoStatus, renderStatus);

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
          }
        },
        uptime: process.uptime()
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private getOverallStatus(mongoStatus: string, renderStatus: string): string {
    if (mongoStatus === 'critical' || renderStatus === 'critical') return 'critical';
    if (mongoStatus === 'warning' || renderStatus === 'warning') return 'warning';
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
