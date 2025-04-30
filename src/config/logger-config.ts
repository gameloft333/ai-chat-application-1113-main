import { DEBUG_MODE } from './app-config';

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Logger configuration
export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  showTimestamp: boolean;
  showLevel: boolean;
}

// Get environment variables with fallbacks
const getEnvVar = (key: string, defaultValue: string): string => {
  const env = (import.meta as any).env;
  return env?.[key] || defaultValue;
};

// Default configuration
const defaultConfig: LoggerConfig = {
  enabled: getEnvVar('VITE_LOG_ENABLED', DEBUG_MODE.toString()) === 'true',
  level: (getEnvVar('VITE_LOG_LEVEL', DEBUG_MODE ? 'DEBUG' : 'INFO') as LogLevel),
  showTimestamp: getEnvVar('VITE_LOG_SHOW_TIMESTAMP', 'true') === 'true',
  showLevel: getEnvVar('VITE_LOG_SHOW_LEVEL', 'true') === 'true',
};

// Current configuration
let currentConfig: LoggerConfig = { ...defaultConfig };

// Update configuration
export const updateLoggerConfig = (config: Partial<LoggerConfig>) => {
  currentConfig = { ...currentConfig, ...config };
};

// Get current configuration
export const getLoggerConfig = (): LoggerConfig => {
  return { ...currentConfig };
};

// Reset to default configuration
export const resetLoggerConfig = () => {
  currentConfig = { ...defaultConfig };
}; 