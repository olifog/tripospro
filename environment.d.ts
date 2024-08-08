declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      RAVEN_CLIENT_ID: string;
      RAVEN_CLIENT_SECRET: string;
    }
  }
}

export {}