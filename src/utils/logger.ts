import { LogLevel, getLoggerConfig } from '../config/logger-config';

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const config = getLoggerConfig();
    const parts: string[] = [];

    if (config.showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    if (config.showLevel) {
      parts.push(`[${level}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  private shouldLog(level: LogLevel): boolean {
    const config = getLoggerConfig();
    if (!config.enabled) return false;

    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(config.level);
    const targetLevelIndex = levels.indexOf(level);

    return targetLevelIndex >= currentLevelIndex;
  }

  debug(message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message), data);
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message), data);
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message), data);
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message), error);
    }
  }
}

// Export a singleton instance
export const logger = new Logger(); 