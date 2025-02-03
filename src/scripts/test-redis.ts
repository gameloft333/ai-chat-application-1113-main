import Redis from 'ioredis';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.development' });

async function testRedisConnection() {
  try {
    const redis = new Redis(process.env.REDIS_URL);
    
    // 测试设置值
    await redis.set('test_key', 'Hello Redis!');
    console.log('设置测试键值对成功');
    
    // 测试获取值
    const value = await redis.get('test_key');
    console.log('获取测试值:', value);
    
    // 测试删除值
    await redis.del('test_key');
    console.log('删除测试键值对成功');
    
    // 关闭连接
    await redis.quit();
    console.log('Redis 连接测试成功！');
  } catch (error) {
    console.error('Redis 连接测试失败:', error);
  }
}

testRedisConnection(); 