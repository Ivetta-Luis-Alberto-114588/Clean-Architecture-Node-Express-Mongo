// src/infrastructure/adapters/winston-logger.adapter.ts

import { ILogger } from '../../domain/interfaces/logger.interface';
import winstonLogger from '../../configs/logger';

export class WinstonLoggerAdapter implements ILogger {

    info(message: string, meta: Record<string, any> = {}): void {
        winstonLogger.info(message, meta);
    }

    error(message: string, meta: Record<string, any> = {}): void {
        winstonLogger.error(message, meta);
    }

    warn(message: string, meta: Record<string, any> = {}): void {
        winstonLogger.warn(message, meta);
    }

    debug(message: string, meta: Record<string, any> = {}): void {
        winstonLogger.debug(message, meta);
    }

    http(message: string, meta: Record<string, any> = {}): void {
        winstonLogger.http(message, meta);
    }
}

// Instancia singleton para uso directo
export const loggerAdapter = new WinstonLoggerAdapter();
