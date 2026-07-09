export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DB_URI: string;
            ENVIRONMENT: "test" | "dev" | "prod";
            COGNITO_USER_POOL_ID: string;
            COGNITO_CLIENT_ID: string;
        }
    }
}
