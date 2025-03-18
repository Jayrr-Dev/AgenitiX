import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Define the form data interface
interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  consent: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const formData: ContactFormData = await request.json();
    
    // Validate the required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' }, 
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
      to: 'admin@company.com', // Your recipient email
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