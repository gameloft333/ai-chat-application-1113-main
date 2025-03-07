import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aichat.app',
  appName: 'AI Chat',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true
  },
  ios: {
    scheme: 'AI Chat',
    backgroundColor: '#ffffff'
  }
};

export default config;