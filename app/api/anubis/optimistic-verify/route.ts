import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

// OPTIMISTIC VERIFICATION ENDPOINT
export async function POST(request: NextRequest) {
	try {
		const { sessionId, solution, challenge } = await request.json();

		// VALIDATE INPUT
		if (!(sessionId && solution && challenge)) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		// GET SESSION COOKIE
		const cookieStore = await cookies();
		const sessionCookie = cookieStore.get("anubis-session");

		if (!sessionCookie?.value) {
			return NextResponse.json({ error: "No active session" }, { status: 401 });
		}

		// PARSE SESSION DATA
		let sessionData;
		try {
			sessionData = JSON.parse(sessionCookie.value);
		} catch (_error) {
			return NextResponse.json({ error: "Invalid session data" }, { status: 401 });
		}

		// VERIFY SESSION ID MATCHES
		if (sessionData.sessionId !== sessionId) {
			return NextResponse.json({ error: "Session ID mismatch" }, { status: 401 });
		}

		// CHECK IF SESSION IS STILL VALID (WITHIN GRACE PERIOD)
		const now = Date.now();
		const sessionAge = now - sessionData.startTime;
		const gracePeriod = 30000; // 30 seconds

		if (sessionAge > gracePeriod) {
			return NextResponse.json({ error: "Session expired" }, { status: 410 });
		}

		// VERIFY CHALLENGE SOLUTION
		const isValidSolution = await verifySolution(solution, challenge);

		if (!isValidSolution) {
			return NextResponse.json({ error: "Invalid solution" }, { status: 403 });
		}

		// VERIFICATION SUCCESSFUL - UPDATE SESSION
		const updatedSessionData = {
			...sessionData,
			verified: true,
			verifiedAt: now,
		};

		// CREATE AUTH COOKIE FOR FUTURE REQUESTS
		const authData = {
			verified: true,
			timestamp: now,
			sessionId: sessionId,
			userAgent: request.headers.get("user-agent") || "unknown",
		};

		const response = NextResponse.json({
			success: true,
			verified: true,
			sessionId: sessionId,
		});

		// SET UPDATED SESSION COOKIE
		response.cookies.set("anubis-session", JSON.stringify(updatedSessionData), {
			maxAge: 3600, // 1 hour
			httpOnly: true,
			secure: true,
			sameSite: "strict",
		});

		// SET AUTH COOKIE FOR LONG-TERM ACCESS
		response.cookies.set("anubis-auth", JSON.stringify(authData), {
			maxAge: 3600, // 1 hour
			httpOnly: true,
			secure: true,
			sameSite: "strict",
		});

		// CLEAR FAILURE COUNTER
		response.cookies.set("anubis-failures", "0", {
			maxAge: 3600,
			httpOnly: true,
			secure: true,
			sameSite: "strict",
		});

		return response;
	} catch (error) {
		console.error("Optimistic verification error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// VERIFY CHALLENGE SOLUTION
async function verifySolution(solution: any, challenge: any): Promise<boolean> {
	try {
		const { nonce, hash, challenge: solutionChallenge } = solution;
		const { challenge: originalChallenge, difficulty } = challenge;

		// VERIFY CHALLENGE MATCHES
		if (solutionChallenge !== originalChallenge) {
			return false;
		}

		// VERIFY HASH
		const input = originalChallenge + nonce;
		const computedHash = await sha256(input);

		if (computedHash !== hash) {
			return false;
		}

		// VERIFY DIFFICULTY
		const target = "0".repeat(difficulty);
		if (!hash.startsWith(target)) {
			return false;
		}

		return true;
	} catch (error) {
		console.error("Solution verification error:", error);
		return false;
	}
}

// SHA256 HASH FUNCTION
async function sha256(message: string): Promise<string> {
	const msgBuffer = new TextEncoder().encode(message);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// HANDLE GET REQUESTS (NOT ALLOWED)
export async function GET() {
	return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
