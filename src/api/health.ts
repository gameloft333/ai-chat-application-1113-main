import logger from '../utils/logger';

export const checkHealth = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);
    return response.ok;
  } catch (error) {
    logger.error('健康检查失败', error);
    return false;
  }
}; 