/**
 * CREDENTIAL PROVIDER REGISTRY - pluggable secret fetchers.
 */

export type CredentialResolver<T = any> = (credentialId: string) => Promise<T>;

const providers: Record<string, CredentialResolver> = {};

export const registerCredentialProvider = (id: string, resolver: CredentialResolver) => {
	providers[id] = resolver;
};

export const resolveCredential = async <T = any>(
	providerId: string,
	credentialId: string
): Promise<T | null> => {
	const fn = providers[providerId];
	if (!fn) {
		return null;
	}
	try {
		return (await fn(credentialId)) as T;
	} catch {
		return null;
	}
};

// ---------------------------------------------------------------------------
// DEFAULT "env" provider – resolves secrets from process.env for quick testing
// ---------------------------------------------------------------------------

registerCredentialProvider("env", (key: string) => {
	// process.env is undefined in browsers; this provider is meant for server / Vercel edge.
	if (typeof process !== "undefined" && process.env) {
		return process.env[key] as any;
	}
	return null;
});
