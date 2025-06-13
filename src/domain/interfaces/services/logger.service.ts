// src/domain/interfaces/services/logger.service.ts
export interface LoggerService {
    info(message: string, meta?: any): void;
    error(message: string, error?: Error, meta?: any): void;
    warn(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    http(message: string, meta?: any): void;
}
