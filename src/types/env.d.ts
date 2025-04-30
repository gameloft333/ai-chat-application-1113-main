/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEBSOCKET_PATH: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_SOCKET_RECONNECTION_DELAY: string
  readonly VITE_SOCKET_TIMEOUT: string
  readonly VITE_MARQUEE_ANIMATION_DURATION: string
  readonly VITE_MARQUEE_ENABLED: string
  readonly VITE_MARQUEE_SHADOW_COLOR: string
  readonly VITE_MARQUEE_WEBSOCKET_URL: string
  readonly NODE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 