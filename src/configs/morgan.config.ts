// src/configs/morgan.config.ts
import morgan from 'morgan';
import { Request, Response } from 'express';
import { ILogger } from '../domain/interfaces/logger.interface';

export interface MorganConfig {
  logger: ILogger;
  environment: string;
}

export class MorganLogger {
  private logger: ILogger;
  private environment: string;

  constructor(config: MorganConfig) {
    this.logger = config.logger;
    this.environment = config.environment;
  }

  // Middleware para capturar el body de la request
  public captureRequestBody = (req: Request, res: Response, next: Function) => {
    // Solo capturar si no está ya disponible
    if (!req.body && req.method !== 'GET') {
      let body = '';
      
      const originalEnd = req.on;
      req.on = function(event: string, listener: any) {
        if (event === 'data') {
          const originalListener = listener;
          listener = (chunk: any) => {
            body += chunk.toString();
            originalListener(chunk);
          };
        } else if (event === 'end') {
          const originalListener = listener;
          listener = () => {
            try {
              (req as any).rawBody = body;
              if (body) {
                (req as any).morganBody = JSON.parse(body);
              }
            } catch (error) {
              (req as any).morganBody = body;
            }
            originalListener();
          };
        }
        return originalEnd.call(this, event, listener);
      };
    }

    next();
  };

  // Middleware para capturar el body de la response
  public captureResponseBody = (req: Request, res: Response, next: Function) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Interceptar res.send()
    res.send = function(body: any) {
      (res as any).responseBody = body;
      return originalSend.call(this, body);
    };

    // Interceptar res.json()
    res.json = function(body: any) {
      (res as any).responseBody = JSON.stringify(body);
      return originalJson.call(this, body);
    };

    next();
  };

  // Morgan token personalizado para request ID
  public setupCustomTokens() {
    // Token para request ID
    morgan.token('requestId', (req: Request) => {
      return (req as any).requestId || 'unknown';
    });

    // Token para request body
    morgan.token('requestBody', (req: Request) => {
      // Priorizar el body ya parseado por Express
      const body = req.body || (req as any).morganBody || (req as any).parsedBody;
      
      if (!body || Object.keys(body).length === 0) return '-';
      
      try {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        // Truncar cuerpos muy largos
        return bodyStr.length > 500 ? bodyStr.substring(0, 500) + '...[truncated]' : bodyStr;
      } catch (error) {
        return String(body);
      }
    });

    // Token para response body
    morgan.token('responseBody', (req: Request, res: Response) => {
      const body = (res as any).responseBody;
      if (!body) return '-';
      
      try {
        // Truncar respuestas muy largas
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        return bodyStr.length > 1000 ? bodyStr.substring(0, 1000) + '...' : bodyStr;
      } catch (error) {
        return String(body);
      }
    });

    // Token para request headers
    morgan.token('requestHeaders', (req: Request) => {
      try {
        const filteredHeaders = { ...req.headers };
        // Filtrar headers sensibles
        delete filteredHeaders.authorization;
        delete filteredHeaders.cookie;
        delete filteredHeaders['x-api-key'];
        
        return JSON.stringify(filteredHeaders);
      } catch (error) {
        return 'error-parsing-headers';
      }
    });

    // Token para response headers
    morgan.token('responseHeaders', (req: Request, res: Response) => {
      try {
        return JSON.stringify(res.getHeaders());
      } catch (error) {
        return 'error-parsing-headers';
      }
    });

    // Token para duración en ms
    morgan.token('responseTime', morgan['response-time']);
  }

  // Configuración para entorno de desarrollo/test
  public getDetailedFormat(): string {
    return [
      '\n🌐 === HTTP REQUEST/RESPONSE ===',
      '📍 Request ID: :requestId',
      '🔄 :method :url',
      '📊 Status: :status',
      '⏱️  Duration: :response-time ms',
      '📥 Request Headers: :requestHeaders',
      '📤 Response Headers: :responseHeaders', 
      '📋 Request Body: :requestBody',
      '📄 Response Body: :responseBody',
      '🏁 === END HTTP LOG ===\n'
    ].join('\n');
  }

  // Configuración para producción (más compacta)
  public getCompactFormat(): string {
    return ':requestId :method :url :status :response-time ms - :res[content-length]';
  }

  // Crear el middleware de Morgan
  public createMiddleware() {
    this.setupCustomTokens();

    const format = this.environment === 'production' 
      ? this.getCompactFormat() 
      : this.getDetailedFormat();

    return morgan(format, {
      stream: {
        write: (message: string) => {
          // Remover el \n final que agrega Morgan
          const cleanMessage = message.replace(/\n$/, '');
          
          if (this.environment === 'production') {
            this.logger.info(cleanMessage);
          } else {
            // En desarrollo, usar console.log para mejor formateo
            console.log(cleanMessage);
          }
        }
      },
      skip: (req: Request, res: Response) => {
        // Saltar logs para rutas de health check en producción
        if (this.environment === 'production' && req.url === '/api/health') {
          return true;
        }
        return false;
      }
    });
  }

  // Middleware completo que incluye captura de request/response body
  public getCompleteMiddleware() {
    return [
      this.captureRequestBody,
      this.captureResponseBody,
      this.createMiddleware()
    ];
  }
}
