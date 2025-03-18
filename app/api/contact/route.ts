import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createRateLimiter, rateLimitPresets } from '@/utils/rate-limiter';

// Define the form data interface
interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  consent: boolean;
  token: string; // Turnstile token
}

// Create a rate limiter for the contact form
const rateLimiter = createRateLimiter(rateLimitPresets.moderate);

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimiterResponse = rateLimiter(request);
    if (rateLimiterResponse) {
      return rateLimiterResponse;
    }
    
    // Parse the request body
    const formData: ContactFormData = await request.json();
    
    // Validate the required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message || !formData.consent) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Validate Turnstile token
    if (!formData.token) {
      return NextResponse.json(
        { success: false, message: 'CAPTCHA verification failed' },
        { status: 400 }
      );
    }
    
    // Verify Turnstile token with Cloudflare
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: formData.token,
      }),
    });
    
    const turnstileData = await turnstileResponse.json();
    
    if (!turnstileData.success) {
      return NextResponse.json(
        { success: false, message: 'CAPTCHA verification failed' },
        { status: 400 }
      );
    }
    
    // Configure email transport
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST as string,
      port: parseInt(process.env.EMAIL_PORT as string),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER as string,
        pass: process.env.EMAIL_PASSWORD as string,
      },
    });
    
    // Format email content
    const emailContent = `
      New Contact Form Submission
      
      Name: ${formData.firstName} ${formData.lastName}
      Email: ${formData.email}
      Phone: ${formData.phone || 'Not provided'}
      Subject: ${formData.subject}
      
      Message:
      ${formData.message}
    `;
    
    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM as string,
      to: 'svsoriano@utiliteksolutions.ca', // Your recipient email
      subject: `Contact Form: ${formData.subject}`,
      text: emailContent,
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Your message has been sent successfully!' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message. Please try again later.' }, 
      { status: 500 }
    );
  }
}