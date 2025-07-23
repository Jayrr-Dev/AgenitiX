import type { AnubisChallenge, AnubisChallengeResponse, AnubisJWTPayload } from "../types/anubis";

// CRYPTO UTILITIES FOR ANUBIS
export class AnubisCrypto {
	// GENERATE SHA256 HASH
	static async sha256(input: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(input);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	}

	// GENERATE CHALLENGE STRING
	static generateChallenge(request: {
		userAgent?: string;
		acceptLanguage?: string;
		ip?: string;
	}): string {
		const weekStart = this.getWeekStart();
		const components = [
			request.acceptLanguage || "en-US",
			request.ip || "127.0.0.1",
			request.userAgent || "Unknown",
			weekStart.toISOString(),
			"anubis-challenge",
		];

		return components.join("|");
	}

	// GET WEEK START (SUNDAY)
	private static getWeekStart(): Date {
		const now = new Date();
		const dayOfWeek = now.getDay();
		const weekStart = new Date(now);
		weekStart.setDate(now.getDate() - dayOfWeek);
		weekStart.setHours(0, 0, 0, 0);
		return weekStart;
	}

	// VALIDATE PROOF OF WORK
	static async validateProofOfWork(
		response: AnubisChallengeResponse,
		difficulty: number
	): Promise<boolean> {
		try {
			const { nonce, challenge, hash: providedHash } = response;

			// RECREATE HASH
			const input = `${challenge}${nonce}`;
			const computedHash = await this.sha256(input);

			// VERIFY HASH MATCHES
			if (computedHash !== providedHash) {
				return false;
			}

			// VERIFY DIFFICULTY (LEADING ZEROS)
			const requiredPrefix = "0".repeat(difficulty);
			return computedHash.startsWith(requiredPrefix);
		} catch (error) {
			console.error("Proof of work validation error:", error);
			return false;
		}
	}

	// GENERATE CLIENT FINGERPRINT
	static generateFingerprint(request: {
		userAgent?: string;
		acceptLanguage?: string;
		ip?: string;
	}): string {
		const components = [request.userAgent || "", request.acceptLanguage || "", request.ip || ""];

		return Buffer.from(components.join("|")).toString("base64");
	}

	// CREATE ANUBIS CHALLENGE
	static createChallenge(
		request: {
			userAgent?: string;
			acceptLanguage?: string;
			ip?: string;
		},
		difficulty: number
	): AnubisChallenge {
		return {
			challenge: this.generateChallenge(request),
			difficulty,
			timestamp: Date.now(),
			clientFingerprint: this.generateFingerprint(request),
		};
	}
}

// JWT UTILITIES
export class AnubisJWT {
	// SIMPLE JWT IMPLEMENTATION (FOR DEMONSTRATION)
	static async sign(payload: AnubisJWTPayload, secret: string): Promise<string> {
		const header = { alg: "HS256", typ: "JWT" };

		const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
		const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

		const signature = await this.createSignature(`${encodedHeader}.${encodedPayload}`, secret);

		return `${encodedHeader}.${encodedPayload}.${signature}`;
	}

	// VERIFY JWT TOKEN
	static async verify(token: string, secret: string): Promise<AnubisJWTPayload | null> {
		try {
			const [encodedHeader, encodedPayload, signature] = token.split(".");

			if (!encodedHeader || !encodedPayload || !signature) {
				return null;
			}

			// VERIFY SIGNATURE
			const expectedSignature = await this.createSignature(
				`${encodedHeader}.${encodedPayload}`,
				secret
			);

			if (signature !== expectedSignature) {
				return null;
			}

			// DECODE PAYLOAD
			const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as AnubisJWTPayload;

			// CHECK EXPIRATION
			if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
				return null;
			}

			return payload;
		} catch (error) {
			console.error("JWT verification error:", error);
			return null;
		}
	}

	// CREATE HMAC SIGNATURE
	private static async createSignature(data: string, secret: string): Promise<string> {
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"]
		);

		const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
		return this.base64UrlEncode(new Uint8Array(signature));
	}

	// BASE64 URL ENCODING
	private static base64UrlEncode(data: string | Uint8Array): string {
		const base64 =
			typeof data === "string"
				? Buffer.from(data).toString("base64")
				: Buffer.from(data).toString("base64");

		return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
	}

	// BASE64 URL DECODING
	private static base64UrlDecode(data: string): string {
		const base64 = data.replace(/-/g, "+").replace(/_/g, "/");

		const padding = base64.length % 4;
		const paddedBase64 = padding ? base64 + "=".repeat(4 - padding) : base64;

		return Buffer.from(paddedBase64, "base64").toString();
	}
}
