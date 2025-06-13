// src/domain/interfaces/logger.interface.ts

export interface ILogger {
    /**
     * Log an informational message
     */
    info(message: string, meta?: Record<string, any>): void;

    /**
     * Log an error message
     */
    error(message: string, meta?: Record<string, any>): void;

    /**
     * Log a warning message
     */
    warn(message: string, meta?: Record<string, any>): void;

    /**
     * Log a debug message
     */
    debug(message: string, meta?: Record<string, any>): void;

    /**
     * Log an HTTP message
     */
    http(message: string, meta?: Record<string, any>): void;
}
