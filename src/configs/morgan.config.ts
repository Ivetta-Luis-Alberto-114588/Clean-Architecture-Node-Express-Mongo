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

    // Middleware SEGURO para capturar el body de la request
    public captureRequestBody = (req: Request, res: Response, next: Function) => {
        // Solo capturar si no está ya disponible y es necesario
        if (!req.body && req.method !== 'GET' && req.method !== 'HEAD') {
            let body = '';
            let chunks: Buffer[] = [];

            // Interceptar solo si no hay body ya parseado
            const originalOn = req.on.bind(req);
            const originalEmit = req.emit.bind(req);

            req.on = function(event: string, listener: any) {
                if (event === 'data' && typeof listener === 'function') {
                    const originalListener = listener;
                    const wrappedListener = (chunk: any) => {
                        if (chunk) {
                            chunks.push(Buffer.from(chunk));
                            body += chunk.toString();
                        }
                        return originalListener.call(this, chunk);
                    };
                    return originalOn.call(this, event, wrappedListener);
                } else if (event === 'end' && typeof listener === 'function') {
                    const originalListener = listener;
                    const wrappedListener = () => {
                        try {
                            if (body && !req.body) {
                                (req as any).rawBody = body;
                                try {
                                    (req as any).morganBody = JSON.parse(body);
                                } catch {
                                    (req as any).morganBody = body;
                                }
                            }
                        } catch (error) {
                            // Silently fail for body parsing
                        }
                        return originalListener.call(this);
                    };
                    return originalOn.call(this, event, wrappedListener);
                }
                return originalOn.call(this, event, listener);
            };
        }

        next();
    };

    // Middleware SEGURO para capturar el body de la response
    public captureResponseBody = (req: Request, res: Response, next: Function) => {
        try {
            const originalSend = res.send.bind(res);
            const originalJson = res.json.bind(res);

            // Interceptar res.send() de forma segura
            res.send = function (body: any) {
                try {
                    (res as any).responseBody = body;
                } catch (error) {
                    // Silently fail for response body capture
                }
                return originalSend.call(this, body);
            };

            // Interceptar res.json() de forma segura
            res.json = function (body: any) {
                try {
                    (res as any).responseBody = JSON.stringify(body);
                } catch (error) {
                    // Silently fail for response body capture
                }
                return originalJson.call(this, body);
            };
        } catch (error) {
            // Silently fail for response interception
        }

        next();
    };

    // Morgan token personalizado para request ID
    public setupCustomTokens() {
        // Token para request ID
        morgan.token('requestId', (req: Request) => {
            return (req as any).requestId || (req as any).id || 'unknown';
        });

        // Token SEGURO para request body
        morgan.token('requestBody', (req: Request) => {
            try {
                // Priorizar el body ya parseado por Express
                const body = req.body || (req as any).morganBody || (req as any).parsedBody;

                if (!body || Object.keys(body).length === 0) return '-';

                const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
                // Truncar cuerpos muy largos
                return bodyStr.length > 500 ? bodyStr.substring(0, 500) + '...[truncated]' : bodyStr;
            } catch (error) {
                return '-';
            }
        });

        // Token SEGURO para response body
        morgan.token('responseBody', (req: Request, res: Response) => {
            try {
                const body = (res as any).responseBody;
                if (!body) return '-';

                // Truncar respuestas muy largas
                const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
                return bodyStr.length > 1000 ? bodyStr.substring(0, 1000) + '...' : bodyStr;
            } catch (error) {
                return '-';
            }
        });

        // Token SEGURO para request headers
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

        // Token SEGURO para response headers
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

    // Crear el middleware de Morgan SEGURO
    public createMiddleware() {
        this.setupCustomTokens();

        const format = this.environment === 'production'
            ? this.getCompactFormat()
            : this.getDetailedFormat();

        return morgan(format, {
            stream: {
                write: (message: string) => {
                    try {
                        // Remover el \n final que agrega Morgan
                        const cleanMessage = message.replace(/\n$/, '');

                        if (this.environment === 'production') {
                            this.logger.info(cleanMessage);
                        } else {
                            // En desarrollo, usar console.log para mejor formateo
                            console.log(cleanMessage);
                        }
                    } catch (error) {
                        // Silently fail for logging
                        console.error('[MORGAN-ERROR] Failed to log:', error);
                    }
                }
            },
            skip: (req: Request, res: Response) => {
                try {
                    // Saltar logs para rutas de health check en producción
                    if (this.environment === 'production' && (req.url === '/api/health' || req.url === '/')) {
                        return true;
                    }
                    return false;
                } catch (error) {
                    return false;
                }
            },
            // Importante: desactivar la captura automática de body que puede causar conflictos
            immediate: false
        });
    }

    // Middleware completo SEGURO que incluye captura de request/response body
    public getCompleteMiddleware() {
        return [
            this.captureRequestBody,
            this.captureResponseBody,
            this.createMiddleware()
        ];
    }

    // Middleware SIMPLE para producción (sin interceptación de body)
    public getSimpleMiddleware() {
        this.setupCustomTokens();

        const format = ':requestId :method :url :status :response-time ms - :res[content-length]';

        return morgan(format, {
            stream: {
                write: (message: string) => {
                    try {
                        const cleanMessage = message.replace(/\n$/, '');
                        this.logger.info(cleanMessage);
                    } catch (error) {
                        console.error('[MORGAN-ERROR] Failed to log:', error);
                    }
                }
            },
            skip: (req: Request, res: Response) => {
                return req.url === '/api/health' || req.url === '/';
            }
        });
    }
}
