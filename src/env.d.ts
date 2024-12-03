/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_TELEGRAM_BOT_TOKEN: string
  readonly VITE_TELEGRAM_PAYMENT_PROVIDER_TOKEN: string
  readonly VITE_TON_TEST_WALLET_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
