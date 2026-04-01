/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_API: string;
  /** ทางเลือก: origin อย่างเดียว ระบบจะต่อ /api ให้ */
  readonly VITE_API_URL: string;
  readonly VITE_WS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
