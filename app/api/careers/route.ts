import { createRateLimiter, rateLimitPresets } from "@/utils/rate-limiter";
import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Define the application data interface
interface JobApplicationData {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	coverLetter?: string;
	jobId: string;
	jobTitle: string;
}

// Define rate limit configuration
// Create a rate limiter for the contact form
const rateLimiter = createRateLimiter(rateLimitPresets.moderate);

export async function POST(request: NextRequest) {
	// Apply rate limiting
	const rateLimiterResponse = rateLimiter(request);
	if (rateLimiterResponse) {
		return rateLimiterResponse;
	}

	try {
		// Parse the multipart form data
		const formData = await request.formData();

		// Extract form fields
		const applicationData: JobApplicationData = {
			firstName: formData.get("firstName") as string,
			lastName: formData.get("lastName") as string,
			email: formData.get("email") as string,
			phone: formData.get("phone") as string,
			coverLetter: (formData.get("coverLetter") as string) || "",
			jobId: formData.get("jobId") as string,
			jobTitle: formData.get("jobTitle") as string,
		};

		// Get resume file
		const resumeFile = formData.get("resume") as File | null;

		// Get Turnstile token
		const token = formData.get("token") as string;

		// Validate the required fields
		if (
			!applicationData.firstName ||
			!applicationData.lastName ||
			!applicationData.email ||
			!applicationData.phone ||
			!applicationData.jobId ||
			!applicationData.jobTitle
		) {
			return NextResponse.json(
				{ success: false, message: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Validate resume file
		if (!resumeFile) {
			return NextResponse.json(
				{ success: false, message: "Resume file is required" },
				{ status: 400 }
			);
		}
		// console.log(token);
		// Validate Turnstile token
		if (!token) {
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
					response: token,
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

		// Check file type
		const validFileTypes = [
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		];
		if (!validFileTypes.includes(resumeFile.type)) {
			return NextResponse.json(
				{
					success: false,
					message: "Invalid file type. Only PDF, DOC, and DOCX files are allowed.",
				},
				{ status: 400 }
			);
		}

		// Check file size (max 5MB)
		if (resumeFile.size > 5 * 1024 * 1024) {
			return NextResponse.json(
				{ success: false, message: "File size exceeds 5MB limit." },
				{ status: 400 }
			);
		}

		// Configure email transport
		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST as string,
			port: Number.parseInt(process.env.EMAIL_PORT as string),
			secure: process.env.EMAIL_SECURE === "true",
			auth: {
				user: process.env.EMAIL_USER as string,
				pass: process.env.EMAIL_PASSWORD as string,
			},
		});

		// Format email content
		const emailContent = `
      New Job Application: ${applicationData.jobTitle}
      
      Applicant Information:
      Name: ${applicationData.firstName} ${applicationData.lastName}
      Email: ${applicationData.email}
      Phone: ${applicationData.phone}
      Job ID: ${applicationData.jobId}
      Job Title: ${applicationData.jobTitle}
      
      Cover Letter:
      ${applicationData.coverLetter || "Not provided"}
    `;

		// Convert file to buffer
		const buffer = Buffer.from(await resumeFile.arrayBuffer());

		// Determine file extension
		const fileExtension =
			resumeFile.type === "application/pdf"
				? "pdf"
				: resumeFile.type === "application/msword"
					? "doc"
					: "docx";

		// Configure email options
		const mailOptions = {
			from: process.env.EMAIL_FROM as string,
			to: process.env.CAREERS_EMAIL || "careers@company.com",
			subject: `Job Application: ${applicationData.jobTitle} - ${applicationData.firstName} ${applicationData.lastName}`,
			text: emailContent,
			attachments: [
				{
					filename: `${applicationData.firstName}_${applicationData.lastName}_Resume.${fileExtension}`,
					content: buffer,
					contentType: resumeFile.type,
				},
			],
		};

		// Send email
		await transporter.sendMail(mailOptions);

		// Store application in database (implementation would go here)
		// This could involve saving the application data to your database
		// and storing the resume file in cloud storage

		return NextResponse.json({
			success: true,
			message: "Your application has been submitted successfully!",
		});
	} catch (error) {
		console.error("Error processing application:", error);
		return NextResponse.json(
			{ success: false, message: "Failed to submit application. Please try again later." },
			{ status: 500 }
		);
	}
}
