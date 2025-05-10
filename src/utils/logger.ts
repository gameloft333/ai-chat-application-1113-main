import { LogLevel, getLoggerConfig } from '../config/logger-config';

const VITE_SHOW_DEBUG_LOGS = import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true';

interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void; // Alias for log when VITE_SHOW_DEBUG_LOGS is true
  info: (...args: any[]) => void; // Added info method
}

const logger: Logger = {
  log: (...args: any[]) => {
    if (VITE_SHOW_DEBUG_LOGS) {
      console.log('[LOG]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (VITE_SHOW_DEBUG_LOGS) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    // Errors should probably always be shown, or based on a different flag for critical errors.
    // For now, respecting VITE_SHOW_DEBUG_LOGS for all console output as per request.
    if (VITE_SHOW_DEBUG_LOGS) {
      console.error('[ERROR]', ...args);
    }
  },
  debug: (...args: any[]) => {
    if (VITE_SHOW_DEBUG_LOGS) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => { // Added info implementation
    if (VITE_SHOW_DEBUG_LOGS) {
      console.info('[INFO]', ...args);
    }
  },
};

export default logger; 