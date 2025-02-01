export const logger = {
  error: (message: string, error: any) => {
    console.error(`[${new Date().toISOString()}] ${message}:`, error);
  },
  info: (message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] ${message}:`, data);
  }
}; 