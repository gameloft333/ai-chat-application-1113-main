/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  readonly VITE_SHOW_DEBUG_LOGS: string
  readonly VITE_APP_URL: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  // Add other environment variables here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
