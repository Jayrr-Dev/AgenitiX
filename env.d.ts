
declare namespace NodeJS {
    interface ProcessEnv {
      EMAIL_HOST: string;
      EMAIL_PORT: string;
      EMAIL_SECURE: 'true' | 'false';
      EMAIL_USER: string;
      EMAIL_PASSWORD: string;
      EMAIL_FROM: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }