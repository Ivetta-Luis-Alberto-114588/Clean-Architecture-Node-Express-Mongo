import { Request, Response, NextFunction } from 'express';
import { WebhookLogModel } from '../../data/mongodb/models/webhook/webhook-log.model';
import { loggerService } from '../../configs/logger';

interface ExtendedRequest extends Request {
  webhookLogId?: string;
  rawBody?: string;
}

export class WebhookLoggerMiddleware {
  
  static captureRawWebhook = async (req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Capturar IP real (considerando proxies)
      const ipAddress = req.ip || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress || 
                       (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                       'unknown';

      // Preparar datos crudos
      const rawData = JSON.stringify({
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        query: req.query,
        body: req.body,
        timestamp: new Date().toISOString(),
        ip: ipAddress
      }, null, 2);

      // Determinar tipo de evento
      let eventType = 'unknown';
      if (req.query.topic) {
        eventType = req.query.topic as string;
      } else if (req.body.type) {
        eventType = req.body.type as string;
      } else if (req.originalUrl.includes('webhook')) {
        eventType = 'webhook';
      }

      // Guardar en base de datos
      const webhookLog = await WebhookLogModel.create({
        source: 'mercadopago',
        eventType,
        httpMethod: req.method,
        url: req.originalUrl,
        headers: req.headers,
        queryParams: req.query,
        body: req.body,
        ipAddress,
        userAgent: req.headers['user-agent'] || 'unknown',
        rawData,
        processed: false
      });

      // Adjuntar ID del log al request para uso posterior
      req.webhookLogId = webhookLog._id.toString();

      loggerService.info(`🔍 Webhook capturado y guardado:`, {
        logId: webhookLog._id,
        source: 'mercadopago',
        eventType,
        method: req.method,
        url: req.originalUrl,
        ip: ipAddress
      });

      next();

    } catch (error) {
      loggerService.error('❌ Error capturando webhook crudo:', error);
      // No bloquear el procesamiento del webhook
      next();
    }
  };

  static updateProcessingResult = async (
    req: ExtendedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void> => {
    // Este middleware se ejecuta después del procesamiento
    const originalSend = res.send;
    
    res.send = function(body: any) {
      // Actualizar el resultado del procesamiento
      if (req.webhookLogId) {
        WebhookLogModel.findByIdAndUpdate(
          req.webhookLogId,
          {
            processed: true,
            processingResult: {
              success: res.statusCode >= 200 && res.statusCode < 300,
              error: res.statusCode >= 400 ? body : undefined
            }
          }
        ).catch(error => {
          loggerService.error('Error actualizando resultado de webhook:', error);
        });
      }
      
      return originalSend.call(this, body);
    };

    next();
  };
}
