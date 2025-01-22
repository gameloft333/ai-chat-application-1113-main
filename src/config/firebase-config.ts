import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 添加调试日志
console.log('Firebase 配置初始化开始');
console.log('环境变量检查:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '已设置' : '未设置',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '已设置' : '未设置',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '已设置' : '未设置'
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase 初始化成功');
} catch (error) {
  console.error('Firebase 初始化失败:', error);
  throw error;
}

export { app, auth, db };

// Analytics 单独导出初始化函数
export const initializeAnalytics = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    const supported = await isSupported();
    
    if (supported) {
      const analytics = getAnalytics(app);
      console.log('Firebase Analytics 初始化成功');
      return analytics;
    } else {
      console.log('当前环境不支持 Firebase Analytics');
      return null;
    }
  } catch (error) {
    console.error('Firebase Analytics 初始化失败:', error);
    return null;
  }
};