declare namespace NodeJS {
	interface ProcessEnv {
		EMAIL_HOST: string;
		EMAIL_PORT: string;
		EMAIL_SECURE: "true" | "false";
		EMAIL_USER: string;
		EMAIL_PASSWORD: string;
		EMAIL_FROM: string;
		NODE_ENV: "development" | "production" | "test";
		CLOUDFLARE_SECRET_KEY: string;
		// ANUBIS CONFIGURATION
		ANUBIS_ENABLED: "true" | "false";
		ANUBIS_DIFFICULTY: string;
		ANUBIS_JWT_SECRET: string;
		ANUBIS_COOKIE_DOMAIN?: string;
		ANUBIS_BYPASS_DEVELOPMENT?: "true" | "false";
	}
}

declare global {
	interface Window {
		turnstile?: {
			render: (container: HTMLElement, options: TurnstileOptions) => string;
			reset: (widgetId: string) => void;
			remove: (widgetId: string) => void;
		};
	}
}

interface TurnstileOptions {
	sitekey: string;
	theme?: "light" | "dark";
	size?: "normal" | "compact";
	callback?: (token: string) => void;
	"expired-callback"?: () => void;
	"error-callback"?: () => void;
}
