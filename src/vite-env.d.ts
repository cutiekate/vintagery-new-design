/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public site address for absolute links; set from the Vercel production domain at build. */
  readonly VITE_SITE_URL?: string;
}
