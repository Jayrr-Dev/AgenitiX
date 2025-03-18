
declare namespace NodeJS {
    interface ProcessEnv {
      EMAIL_HOST: string;
      EMAIL_PORT: string;
      EMAIL_SECURE: 'true' | 'false';
      EMAIL_USER: string;
      EMAIL_PASSWORD: string;
      EMAIL_FROM: string;
      NODE_ENV: 'development' | 'production' | 'test';
      CLOUDFLARE_SECRET_KEY: string;
    }
  }

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}