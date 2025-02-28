/// <reference types="vite/client" />

// 需要确保生产环境禁用 React Fast Refresh
if (import.meta.env.PROD) {
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => () => {};
}
