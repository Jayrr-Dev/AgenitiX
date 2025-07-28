// ANUBIS BROWSER CLIENT - FOR SCRIPT TAG INTEGRATION
// This creates a client-side bot protection system that can be loaded via <script> tag

export interface AnubisBrowserConfig {
	apiEndpoint: string; // Backend API endpoint
	difficulty?: number; // Challenge difficulty
	autoChallenge?: boolean; // Automatically start challenges
	onChallenge?: (challenge: any) => void;
	onVerified?: (token: string) => void;
	onBlocked?: (reason: string) => void;
	debug?: boolean;
}

export interface BrowserChallenge {
	challenge: string;
	difficulty: number;
	timestamp: number;
	clientFingerprint: string;
}

export interface ChallengeResponse {
	nonce: number;
	hash: string;
	challenge: string;
	timestamp: number;
}

export class AnubisBrowser {
	private config: AnubisBrowserConfig;
	private currentChallenge: BrowserChallenge | null = null;
	private isWorking = false;
	private worker: Worker | null = null;

	constructor(config: AnubisBrowserConfig) {
		this.config = {
			difficulty: 4,
			autoChallenge: true,
			debug: false,
			...config,
		};

		this.log("Anubis Browser Client initialized");

		// Auto-start if enabled
		if (this.config.autoChallenge) {
			this.start();
		}
	}

	// START ANUBIS PROTECTION
	async start(): Promise<void> {
		try {
			this.log("Starting Anubis protection...");

			// Check if already verified
			const existingToken = this.getStoredToken();
			if (existingToken && this.isTokenValid(existingToken)) {
				this.log("Valid token found, protection active");
				this.config.onVerified?.(existingToken);
				return;
			}

			// Collect browser fingerprint
			const fingerprint = await this.collectFingerprint();

			// Request challenge from server
			const challenge = await this.requestChallenge(fingerprint);

			if (challenge) {
				this.currentChallenge = challenge;
				await this.solveChallenge(challenge);
			}
		} catch (error) {
			this.log("Error starting Anubis:", error);
			this.config.onBlocked?.("Failed to initialize protection");
		}
	}

	// REQUEST CHALLENGE FROM SERVER
	private async requestChallenge(fingerprint: any): Promise<BrowserChallenge | null> {
		try {
			const response = await fetch(`${this.config.apiEndpoint}/challenge`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fingerprint,
					difficulty: this.config.difficulty,
					timestamp: Date.now(),
				}),
			});

			if (!response.ok) {
				throw new Error(`Challenge request failed: ${response.status}`);
			}

			const challenge = await response.json();
			this.log("Challenge received:", challenge);
			this.config.onChallenge?.(challenge);

			return challenge;
		} catch (error) {
			this.log("Error requesting challenge:", error);
			return null;
		}
	}

	// SOLVE PROOF-OF-WORK CHALLENGE
	private async solveChallenge(challenge: BrowserChallenge): Promise<void> {
		if (this.isWorking) {
			return;
		}

		this.isWorking = true;
		this.log(`Solving challenge with difficulty ${challenge.difficulty}...`);

		try {
			// Use Web Worker for non-blocking computation
			const solution = await this.solveWithWorker(challenge);

			if (solution) {
				await this.submitSolution(solution);
			}
		} catch (error) {
			this.log("Error solving challenge:", error);
			this.config.onBlocked?.("Challenge solving failed");
		} finally {
			this.isWorking = false;
		}
	}

	// SOLVE CHALLENGE USING WEB WORKER
	private async solveWithWorker(challenge: BrowserChallenge): Promise<ChallengeResponse | null> {
		return new Promise((resolve, reject) => {
			// Create inline worker for proof-of-work
			const workerCode = `
        // SHA-256 implementation for Web Worker
        async function sha256(message) {
          const msgBuffer = new TextEncoder().encode(message);
          const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Proof-of-work solver
        async function solveProofOfWork(challenge, difficulty) {
          const target = '0'.repeat(difficulty);
          let nonce = 0;
          
          while (true) {
            const input = challenge + nonce;
            const hash = await sha256(input);
            
            if (hash.startsWith(target)) {
              return { nonce, hash };
            }
            
            nonce++;
            
            // Report progress every 10000 attempts
            if (nonce % 10000 === 0) {
              self.postMessage({ type: 'progress', nonce });
            }
          }
        }

        self.onmessage = async function(e) {
          const { challenge, difficulty } = e.data;
          try {
            const result = await solveProofOfWork(challenge, difficulty);
            self.postMessage({ type: 'solution', ...result });
          } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
          }
        };
      `;

			const blob = new Blob([workerCode], { type: "application/javascript" });
			this.worker = new Worker(URL.createObjectURL(blob));

			this.worker.onmessage = (e) => {
				const { type, nonce, hash, error } = e.data;

				if (type === "solution") {
					this.log(`Challenge solved! Nonce: ${nonce}, Hash: ${hash}`);

					const solution: ChallengeResponse = {
						nonce,
						hash,
						challenge: challenge.challenge,
						timestamp: challenge.timestamp,
					};

					resolve(solution);
				} else if (type === "error") {
					reject(new Error(error));
				} else if (type === "progress") {
					this.log(`Solving... attempts: ${nonce}`);
				}
			};

			this.worker.onerror = (error) => {
				reject(error);
			};

			// Start solving
			this.worker.postMessage({
				challenge: challenge.challenge,
				difficulty: challenge.difficulty,
			});

			// Timeout after 2 minutes
			setTimeout(() => {
				if (this.worker) {
					this.worker.terminate();
					this.worker = null;
					reject(new Error("Challenge solving timeout"));
				}
			}, 120000);
		});
	}

	// SUBMIT SOLUTION TO SERVER
	private async submitSolution(solution: ChallengeResponse): Promise<void> {
		try {
			const response = await fetch(`${this.config.apiEndpoint}/verify`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(solution),
			});

			if (!response.ok) {
				throw new Error(`Solution submission failed: ${response.status}`);
			}

			const result = await response.json();

			if (result.success && result.token) {
				this.log("Challenge verified successfully!");
				this.storeToken(result.token);
				this.config.onVerified?.(result.token);
			} else {
				throw new Error("Invalid solution");
			}
		} catch (error) {
			this.log("Error submitting solution:", error);
			this.config.onBlocked?.("Solution verification failed");
		}
	}

	// COLLECT BROWSER FINGERPRINT
	private async collectFingerprint(): Promise<any> {
		const fingerprint = {
			userAgent: navigator.userAgent,
			language: navigator.language,
			languages: navigator.languages,
			platform: navigator.platform,
			cookieEnabled: navigator.cookieEnabled,
			doNotTrack: navigator.doNotTrack,
			screenResolution: `${screen.width}x${screen.height}`,
			colorDepth: screen.colorDepth,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			timestamp: Date.now(),
			// Canvas fingerprint (basic)
			canvas: this.getCanvasFingerprint(),
			// WebGL fingerprint (basic)
			webgl: this.getWebGLFingerprint(),
		};

		this.log("Browser fingerprint collected:", fingerprint);
		return fingerprint;
	}

	// BASIC CANVAS FINGERPRINT
	private getCanvasFingerprint(): string {
		try {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				return "no-canvas";
			}

			ctx.textBaseline = "top";
			ctx.font = "14px Arial";
			ctx.fillText("Anubis fingerprint", 2, 2);

			return canvas.toDataURL().slice(-50);
		} catch {
			return "canvas-error";
		}
	}

	// BASIC WEBGL FINGERPRINT
	private getWebGLFingerprint(): string {
		try {
			const canvas = document.createElement("canvas");
			const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
			if (!gl) {
				return "no-webgl";
			}

			const webglContext = gl as WebGLRenderingContext;
			const renderer = webglContext.getParameter(webglContext.RENDERER);
			const vendor = webglContext.getParameter(webglContext.VENDOR);

			return `${vendor}-${renderer}`.slice(0, 50);
		} catch {
			return "webgl-error";
		}
	}

	// TOKEN STORAGE
	private storeToken(token: string): void {
		try {
			localStorage.setItem("anubis-token", token);
			// Also set as cookie for server-side access
			document.cookie = `anubis-auth=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
		} catch (error) {
			this.log("Error storing token:", error);
		}
	}

	private getStoredToken(): string | null {
		try {
			return localStorage.getItem("anubis-token");
		} catch {
			return null;
		}
	}

	private isTokenValid(token: string): boolean {
		try {
			// Basic JWT expiration check (decode payload)
			const parts = token.split(".");
			if (parts.length !== 3) {
				return false;
			}

			const payload = JSON.parse(atob(parts[1]));
			return payload.exp > Math.floor(Date.now() / 1000);
		} catch {
			return false;
		}
	}

	// LOGGING
	private log(..._args: any[]): void {
		if (this.config.debug) {
		}
	}

	// PUBLIC METHODS
	public isProtected(): boolean {
		const token = this.getStoredToken();
		return token ? this.isTokenValid(token) : false;
	}

	public async refresh(): Promise<void> {
		localStorage.removeItem("anubis-token");
		await this.start();
	}

	public stop(): void {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
		this.isWorking = false;
	}
}

// GLOBAL BROWSER API
declare global {
	interface Window {
		Anubis: typeof AnubisBrowser;
		anubis?: AnubisBrowser;
	}
}

// Export for browser
if (typeof window !== "undefined") {
	window.Anubis = AnubisBrowser;
}

export default AnubisBrowser;
