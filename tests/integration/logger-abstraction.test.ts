// tests/integration/logger-abstraction.test.ts
import { loggerService } from '../../src/configs/logger';
import { WinstonLoggerAdapter } from '../../src/infrastructure/adapters/winston-logger.adapter';
import { ILogger } from '../../src/domain/interfaces/logger.interface';

describe('Logger Abstraction Integration Test', () => {
  test('should export loggerService as ILogger instance', () => {
    expect(loggerService).toBeDefined();
    expect(loggerService).toBeInstanceOf(WinstonLoggerAdapter);
    
    // Verificar que implementa la interface ILogger
    expect(typeof loggerService.info).toBe('function');
    expect(typeof loggerService.error).toBe('function');
    expect(typeof loggerService.warn).toBe('function');
    expect(typeof loggerService.debug).toBe('function');
    expect(typeof loggerService.http).toBe('function');
  });

  test('should log messages without throwing errors', () => {
    expect(() => {
      loggerService.info('Test info message', { test: true });
      loggerService.warn('Test warn message', { test: true });
      loggerService.error('Test error message', { test: true });
      loggerService.debug('Test debug message', { test: true });
      loggerService.http('Test http message', { test: true });
    }).not.toThrow();
  });

  test('should handle error objects properly', () => {
    const testError = new Error('Test error');
    
    expect(() => {
      loggerService.error('Test error with Error object', { error: testError });
    }).not.toThrow();
  });
});
