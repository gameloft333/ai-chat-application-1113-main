// 添加初始化保护逻辑
if (typeof window !== 'undefined' && !getApps().length) {
    try {
      initializeApp(firebaseConfig);
      if (!PRODUCTION) {
        connectAuthEmulator(auth, "http://localhost:9099");
      }
    } catch (error) {
      console.error('Firebase 初始化失败:', error);
    }
  }