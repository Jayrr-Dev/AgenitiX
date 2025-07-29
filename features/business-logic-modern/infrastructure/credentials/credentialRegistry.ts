/**
 * CREDENTIAL PROVIDER REGISTRY - pluggable secret fetchers.
 */

export type CredentialResolver<T = unknown> = (credentialId: string) => Promise<T>;

const providers: Record<string, CredentialResolver> = {};

export const registerCredentialProvider = <T = unknown>(
	providerId: string,
	resolver: CredentialResolver<T>
) => {
	providers[providerId] = resolver;
};

export const resolveCredential = async <T = unknown>(
	providerId: string,
	credentialId: string
): Promise<T | null> => {
	const resolver = providers[providerId];
	if (!resolver) {
		console.warn(`No credential provider registered for: ${providerId}`);
		return null;
	}

	try {
		return await resolver(credentialId);
	} catch (error) {
		console.error(
			`Failed to resolve credential ${credentialId} from provider ${providerId}:`,
			error
		);
		return null;
	}
};

// Environment variable provider
export const registerEnvironmentProvider = () => {
	registerCredentialProvider<string>("env", (key: string) => {
		// process.env is undefined in browsers; this provider is meant for server / Vercel edge.
		if (typeof process !== "undefined" && process.env) {
			return Promise.resolve(process.env[key] as string);
		}
		return Promise.resolve(null);
	});
};
