import { createRateLimiter, rateLimitPresets } from "@/utils/rate-limiter";
import ical, { ICalAttendeeRole, ICalAttendeeStatus } from "ical-generator";
import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
// Define the consultation request data interface
interface ConsultationRequest {
	name: string;
	email: string;
	phone: string;
	company: string;
	role: string;
	date: string;
	time: string;
	topic: string;
	message?: string;
	token: string; // Turnstile token
}

// Create a rate limiter for the schedule consultation form
const rateLimiter = createRateLimiter(rateLimitPresets.moderate);

// Convert 12-hour time format (e.g., "9:00 AM") to 24-hour format (e.g., "09:00:00")
function convertTo24Hour(time12h: string): string {
	const [time, modifier] = time12h.split(" ");
	let [hours, minutes] = time.split(":");

	if (hours === "12") {
		hours = modifier === "AM" ? "00" : "12";
	} else {
		hours = modifier === "PM" ? String(Number.parseInt(hours, 10) + 12) : hours;
	}

	// Ensure hours are two digits
	hours = hours.padStart(2, "0");

	return `${hours}:${minutes}:00`;
}

// Create event start and end dates (assuming 1-hour consultations)
function createEventTimes(date: string, time: string) {
	// Convert time to 24-hour format
	const time24h = convertTo24Hour(time);

	// Create start date object
	const startDate = new Date(`${date}T${time24h}`);

	// Create end date (1 hour after start)
	const endDate = new Date(startDate);
	endDate.setHours(endDate.getHours() + 1);

	return { startDate, endDate };
}
export async function POST(request: NextRequest) {
	try {
		// Apply rate limiting
		const rateLimiterResponse = rateLimiter(request);
		if (rateLimiterResponse) {
			return rateLimiterResponse;
		}

		// Parse the request body
		const consultationData: ConsultationRequest = await request.json();

		// Validate the required fields
		if (
			!(
				consultationData.name &&
				consultationData.email &&
				consultationData.phone &&
				consultationData.company &&
				consultationData.role &&
				consultationData.date &&
				consultationData.time &&
				consultationData.topic
			)
		) {
			return NextResponse.json(
				{ success: false, message: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Validate Turnstile token
		if (!consultationData.token) {
			return NextResponse.json(
				{ success: false, message: "CAPTCHA verification failed" },
				{ status: 400 }
			);
		}

		// Verify Turnstile token with Cloudflare
		const turnstileResponse = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					secret: process.env.TURNSTILE_SECRET_KEY || "",
					response: consultationData.token,
					remoteip:
						request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
				}).toString(),
			}
		);

		const turnstileData = await turnstileResponse.json();

		if (!turnstileData.success) {
			console.error("Turnstile verification failed:", turnstileData);
			return NextResponse.json(
				{ success: false, message: "CAPTCHA verification failed" },
				{ status: 400 }
			);
		}

		// For development/testing purposes, log the data
		// console.log('Consultation request:', consultationData);

		// Get event start and end times
		const { startDate, endDate } = createEventTimes(consultationData.date, consultationData.time);

		// Create iCalendar event
		const calendar = ical({
			name: "Utilitek Consultation",
			timezone: "America/Edmonton",
		});

		calendar.createEvent({
			start: startDate,
			end: endDate,
			summary: `Consultation: ${consultationData.topic}`,
			description: `
Consultation with ${consultationData.name}
Email: ${consultationData.email}
Phone: ${consultationData.phone}
Company: ${consultationData.company}
Role: ${consultationData.role}

Topic: ${consultationData.topic}

Additional Information:
${consultationData.message || "None provided"}
      `,
			location: "Utilitek Solutions Office",
			organizer: {
				name: "Utilitek Consultations",
				email: process.env.EMAIL_FROM || "consultations@utiliteksolutions.ca",
			},
			attendees: [
				{
					name: consultationData.name,
					email: consultationData.email,
					rsvp: true,
					role: ICalAttendeeRole.OPT,
					status: ICalAttendeeStatus.NEEDSACTION,
				},
				{
					name: "Utilitek Consultation Team",
					email: "svsoriano@utiliteksolutions.ca",
					role: ICalAttendeeRole.REQ,
					status: ICalAttendeeStatus.ACCEPTED,
				},
			],
		});

		// Generate the .ics content
		const icsContent = calendar.toString();

		// Configure email transport
		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: Number.parseInt(process.env.EMAIL_PORT as string),
			secure: process.env.EMAIL_SECURE === "true",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		});

		// Format email to company
		const companyEmailContent = `
      New Consultation Request
      
      Name: ${consultationData.name}
      Email: ${consultationData.email}
      Phone: ${consultationData.phone}
      Company: ${consultationData.company}
      Role: ${consultationData.role}
      
      Requested Date: ${consultationData.date}
      Requested Time: ${consultationData.time}
      Topic: ${consultationData.topic}
      
      Additional Information:
      ${consultationData.message || "None provided"}
    `;

		// Format confirmation email to client
		const clientEmailContent = `
      Dear ${consultationData.name},
      
      Thank you for scheduling a consultation with Utilitek Solutions.
      
      Your consultation details:
      Date: ${consultationData.date}
      Time: ${consultationData.time}
      Topic: ${consultationData.topic}
      
      We've attached a calendar invitation that you can add to your calendar. Our team will review your request and confirm your appointment shortly. If we need to reschedule for any reason, we will contact you at the provided phone number or email address.
      
      Best regards,
      The Utilitek Solutions Team
    `;

		// Send email to company with calendar attachment
		await transporter.sendMail({
			from: process.env.EMAIL_FROM || "noreply@utiliteksolutions.ca",
			to: "svsoriano@utiliteksolutions.ca", // Change to your consultation booking email
			subject: `Consultation Request: ${consultationData.topic}`,
			text: companyEmailContent,
			attachments: [
				{
					filename: "consultation.ics",
					content: icsContent,
					contentType: "text/calendar",
				},
			],
		});

		// Send confirmation email to client with calendar attachment
		await transporter.sendMail({
			from: process.env.EMAIL_FROM || "noreply@utiliteksolutions.ca",
			to: consultationData.email,
			subject: "Your Utilitek Solutions Consultation Request",
			text: clientEmailContent,
			attachments: [
				{
					filename: "consultation.ics",
					content: icsContent,
					contentType: "text/calendar",
				},
			],
		});

		return NextResponse.json({
			success: true,
			message:
				"Your consultation request has been submitted! We will confirm your appointment shortly.",
		});
	} catch (error) {
		console.error("Error processing consultation request:", error);
		return NextResponse.json(
			{ success: false, message: "Failed to submit consultation request. Please try again later." },
			{ status: 500 }
		);
	}
}
