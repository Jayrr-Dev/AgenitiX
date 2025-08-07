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
		console.log(`🔍 Resolving credential: ${credentialId} from provider: ${providerId}`);
		const result = await resolver(credentialId);
		console.log(`🔍 Credential resolution result:`, {
			credentialId,
			providerId,
			hasValue: !!result,
			valueLength: typeof result === 'string' ? result.length : 'N/A'
		});
		return result as T;
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
			const value = process.env[key] || "";
			console.log(`🔍 Environment variable lookup: ${key} = ${value ? 'SET' : 'NOT_SET'}`);
			return Promise.resolve(value);
		}
		console.log(`🔍 Environment variable lookup: ${key} = PROCESS_NOT_AVAILABLE`);
		return Promise.resolve("");
	});
};
