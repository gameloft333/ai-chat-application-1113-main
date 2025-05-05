import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
  console.log('Firebase 配置初始化开始');
}

const firebaseConfig = {
// ... existing code ...
};

if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
  console.log('环境变量检查:', {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
    storageBucket: !!firebaseConfig.storageBucket,
    messagingSenderId: !!firebaseConfig.messagingSenderId,
    appId: !!firebaseConfig.appId,
    measurementId: !!firebaseConfig.measurementId
  });
}

// Validate required config values
// ... existing code ...

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
    console.log('Firebase 初始化成功');
  }
} catch (error) {
  console.error('Firebase 初始化失败:', error);
// ... existing code ...
} 