import winston from 'winston';
import 'winston-daily-rotate-file';
import { envs } from './envs';
import path from 'path';
import fs from 'fs';

// Creamos una clase para manejar todo lo relacionado con el logger
class Logger {
  private logger: winston.Logger;
  
  constructor() {
    // Asegurarnos de que el directorio de logs existe
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // En modo test, siempre usamos el nivel más detallado (debug)
    const level = envs.NODE_ENV === 'test' ? 'debug' : this.getLogLevel();
    
    // Formato base para logs en archivo (JSON completo)
    const baseFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    );
    
    // Formato para consola (más legible)
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length && !meta.requestId
          ? `\n${JSON.stringify(meta, null, 2)}` 
          : meta.requestId 
            ? ` [${meta.requestId}]` 
            : '';
        return `${timestamp} ${level}:${metaString} ${message}`;
      })
    );
    
    // Configurar transportes
    const transports: winston.transport[] = [];
    
    // Consola siempre activa, en modo test con nivel debug
    transports.push(
      new winston.transports.Console({
        level: envs.NODE_ENV === 'test' ? 'debug' : level,
        format: consoleFormat
      })
    );
    
    // En modo test, siempre guardamos todo en archivos
    // Logs de error específicos (en cualquier entorno)
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: path.join(logsDir, `error-${envs.NODE_ENV}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: baseFormat
      })
    );
    
    // Logs combinados (todos los niveles)
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: path.join(logsDir, `combined-${envs.NODE_ENV}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        level: envs.NODE_ENV === 'test' ? 'debug' : level, // En test, capturamos todo
        maxSize: '20m',
        maxFiles: '14d',
        format: baseFormat
      })
    );
    
    // En modo test, también creamos un archivo específico de debug
    if (envs.NODE_ENV === 'test') {
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: path.join(logsDir, `debug-test-%DATE%.log`),
          datePattern: 'YYYY-MM-DD',
          level: 'debug',
          maxSize: '20m',
          maxFiles: '14d',
          format: baseFormat
        })
      );
    }
    
    // Crear el logger
    this.logger = winston.createLogger({
      level: envs.NODE_ENV === 'test' ? 'debug' : level,
      defaultMeta: { 
        service: 'tu-api',
        environment: envs.NODE_ENV 
      },
      transports,
      // Nunca silenciamos en modo test
      silent: false
    });
    
    // Mensaje de inicialización
    this.logger.info(`Logger inicializado en modo: ${envs.NODE_ENV}, nivel: ${envs.NODE_ENV === 'test' ? 'debug' : level}`);
    
    // En modo test, añadimos información adicional
    if (envs.NODE_ENV === 'test') {
      this.logger.debug('Modo TEST activo: registrando logs detallados para depuración');
    }
  }
  
  // Determinar nivel de log basado en entorno (para no-test)
  private getLogLevel(): string {
    // Prioridad 1: Sobrescritura manual con variable de entorno
    const level = process.env.LOG_LEVEL;
    if (level) return level;
    
    // Prioridad 2: Basado en entorno
    switch (envs.NODE_ENV) {
      case 'production':
        return 'info';
      case 'development':
        return 'debug';
      default:
        return 'info';
    }
  }
  
  // Métodos para cada nivel de log
  error(message: string, meta: Record<string, any> = {}): void {
    this.logger.error(message, meta);
  }
  
  warn(message: string, meta: Record<string, any> = {}): void {
    this.logger.warn(message, meta);
  }
  
  info(message: string, meta: Record<string, any> = {}): void {
    this.logger.info(message, meta);
  }
  
  http(message: string, meta: Record<string, any> = {}): void {
    this.logger.http(message, meta);
  }
  
  debug(message: string, meta: Record<string, any> = {}): void {
    this.logger.debug(message, meta);
  }
  
  // Para crear un logger con metadatos adicionales
  child(meta: Record<string, any>): winston.Logger {
    return this.logger.child(meta);
  }
}

// Exportamos una instancia única global
export default new Logger();