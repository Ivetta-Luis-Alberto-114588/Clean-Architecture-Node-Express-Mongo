import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../configs/logger';
import { envs } from '../../configs/envs';

// Extender la interfaz Request para incluir el ID de solicitud
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

// Definimos una interfaz para nuestros datos de log que permita propiedades dinámicas
interface LogData extends Record<string, any> {
  method: string;
  url: string;
  ip: string | undefined;
  userAgent: string;
}

export class LoggerMiddleware {
  static getLoggerMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Generar un ID único para la solicitud
      const requestId = uuidv4();
      req.id = requestId;

      // Registrar el tiempo de inicio
      req.startTime = Date.now();

      // Crear un logger específico para esta solicitud
      const requestLogger = logger.child({ requestId });

      // Preparar metadatos comunes
      const baseLogData: LogData = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent') || 'unknown'
      };

      // En modo de test, registramos absolutamente todos los detalles
      if (envs.NODE_ENV === 'test') {
        // Capturar todo lo que podamos sobre la solicitud
        baseLogData.query = req.query;
        baseLogData.params = req.params;
        baseLogData.headers = req.headers;
        baseLogData.cookies = req.cookies;
        baseLogData.originalUrl = req.originalUrl;
        baseLogData.path = req.path;
        baseLogData.protocol = req.protocol;
        baseLogData.route = req.route;

        // Si hay un cuerpo en la solicitud
        if (req.body && Object.keys(req.body).length > 0) {
          // Crear una copia profunda del cuerpo para no modificar el original
          const safeBody = JSON.parse(JSON.stringify(req.body));

          // Redactar campos sensibles
          ['password', 'passwordConfirmation', 'token', 'secret', 'credit_card', 'cardNumber'].forEach(field => {
            if (safeBody[field]) safeBody[field] = '[REDACTADO]';
          });

          baseLogData.body = safeBody;
        }

        // Mensaje de log detallado con prefijo TEST
        requestLogger.debug(`[TEST] Solicitud detallada: ${req.method} ${req.url}`, baseLogData);
      } else {
        // Comportamiento normal para entornos no-test
        if (envs.NODE_ENV !== 'production') {
          if (req.query && Object.keys(req.query).length > 0) {
            baseLogData.query = req.query;
          }

          const shouldLogBody = req.method !== 'GET' && req.body && Object.keys(req.body).length > 0;
          if (shouldLogBody) {
            const body = { ...req.body };
            ['password', 'token', 'secret', 'credit_card'].forEach(field => {
              if (body[field]) body[field] = '[REDACTADO]';
            });
            baseLogData.body = body;
          }
        }

        // Mensaje de log normal
        requestLogger.http(`Solicitud recibida: ${req.method} ${req.url}`, baseLogData);
      }

      // Interceptar métodos de respuesta para registrar detalles
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;

      // Solo en modo test, capturar el cuerpo de respuesta
      if (envs.NODE_ENV === 'test') {
        res.send = function (body: any): Response {
          if (typeof body === 'string' || Buffer.isBuffer(body)) {
            res.locals.responseBody = body.toString().substring(0, 1000); // Limitar tamaño
          }
          return originalSend.apply(this, arguments as any);
        };

        res.json = function (body: any): Response {
          res.locals.responseBody = body;
          return originalJson.apply(this, arguments as any);
        };
      }

      // Capturar el evento de finalización para registrar la respuesta
      res.on('finish', () => {
        const responseTime = Date.now() - (req.startTime || Date.now());

        // Determinar nivel de log basado en código de estado
        let logLevel: 'error' | 'warn' | 'info' | 'debug' | 'http' = 'http';
        if (res.statusCode >= 500) {
          logLevel = 'error';
        } else if (res.statusCode >= 400) {
          logLevel = 'warn';
        } else if (res.statusCode >= 300) {
          logLevel = 'info';
        }

        // En modo test, usar siempre debug y añadir toda la información posible
        if (envs.NODE_ENV === 'test') {
          const responseData: Record<string, any> = {
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            headers: res.getHeaders(),
            timestamp: new Date().toISOString()
          };

          // Incluir el cuerpo de la respuesta si lo capturamos
          if (res.locals.responseBody) {
            responseData.body = res.locals.responseBody;
          }

          requestLogger.debug(`[TEST] Respuesta detallada: ${req.method} ${req.url} ${res.statusCode}`, responseData);
        } else {
          // Log normal para entornos no-test
          requestLogger[logLevel](`Respuesta enviada: ${req.method} ${req.url} ${res.statusCode}`, {
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`
          });
        }
      });

      next();
    };
  }

  // Middleware mejorado para logging de errores
  static getErrorLoggerMiddleware() {
    return (err: any, req: Request, res: Response, next: NextFunction) => {
      const requestId = req.id || 'unknown';

      // Información básica de error
      const errorData: Record<string, any> = {
        requestId,
        error: {
          message: err.message,
          name: err.name,
          statusCode: err.statusCode || 500,
          stack: err.stack
        }
      };

      // En modo test, añadir todos los detalles posibles
      if (envs.NODE_ENV === 'test') {
        errorData.request = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          query: req.query,
          params: req.params,
          body: req.body,
          ip: req.ip,
          originalUrl: req.originalUrl
        };

        // CAMBIO AQUÍ: Usar logger.error en lugar de logger.debug
        logger.error(`[TEST] Error detallado en solicitud: ${req.method} ${req.url}`, errorData);
      } else {
        logger.error(`Error en solicitud: ${req.method} ${req.url}`, errorData);
      }

      next(err);
    };
  }
}