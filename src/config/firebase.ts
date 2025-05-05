import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// import { getAnalytics } from 'firebase/analytics';

if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
  console.log('Firebase 配置初始化开始');
  console.log('环境变量检查:', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '已设置' : '未设置',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '已设置' : '未设置',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '已设置' : '未设置'
  });
}

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
let db;
let auth;

try {
  // 防止重复初始化
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  
  // 获取 Analytics 实例
  // export const analytics = getAnalytics(app);
  
  // 获取 Firestore 实例
  db = getFirestore(app);
  
  // 获取 Auth 实例
  auth = getAuth(app);
  
  if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
    console.log('Firebase 初始化成功');
  }
} catch (error) {
  console.error('Firebase 初始化失败:', error);
  throw error;
}

export { app as default, db, auth }; 