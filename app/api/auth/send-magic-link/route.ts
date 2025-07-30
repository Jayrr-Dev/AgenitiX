import { isValidEmail, sendMagicLinkEmail } from "@/lib/email-service";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, name, magicToken, type } = body;

		// Validate input
		if (!(email && name && magicToken && type)) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		if (!isValidEmail(email)) {
			return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
		}

		if (!["verification", "login"].includes(type)) {
			return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
		}

		// Send magic link email
		const result = await sendMagicLinkEmail({
			to: email,
			name,
			magicToken,
			type,
		});

		if (!result.success) {
			return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
		}

		// Log success in development
		if (process.env.NODE_ENV === "development") {
			console.log("\n✅ MAGIC LINK SENT SUCCESSFULLY:");
			console.log(`📧 To: ${email}`);
			console.log(`📝 Type: ${type}`);
			if (result.magicLinkUrl) {
				console.log(`🔗 URL: ${result.magicLinkUrl}`);
			}
			console.log("");
		}

		return NextResponse.json({
			success: true,
			messageId: result.messageId,
			...(result.magicLinkUrl && { magicLinkUrl: result.magicLinkUrl }), // Include magic link URL in development
		});
	} catch (error) {
		console.error("Magic link API error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
