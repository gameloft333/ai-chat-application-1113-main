/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  // Add other environment variables here...
  readonly VITE_SHOW_DEBUG_LOGS?: string // Add this line for the debug logs flag
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
