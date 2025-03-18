"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useState, ChangeEvent, FormEvent } from "react";
import ScheduleConsultation from "@/components/schedule-consultation";

// Define interfaces for type safety
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
}

interface FormStatus {
  isSubmitting: boolean;
  isSubmitted: boolean;
  isError: boolean;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    consent: false
  });
  
  const [formStatus, setFormStatus] = useState<FormStatus>({
    isSubmitting: false,
    isSubmitted: false,
    isError: false,
    message: ""
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate the form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message || !formData.consent) {
      setFormStatus({
        isSubmitting: false,
        isSubmitted: false,
        isError: true,
        message: "Please fill in all required fields."
      });
      return;
    }
    
    setFormStatus({
      isSubmitting: true,
      isSubmitted: false,
      isError: false,
      message: ""
    });
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Success
        setFormStatus({
          isSubmitting: false,
          isSubmitted: true,
          isError: false,
          message: result.message
        });
        
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
          consent: false
        });
      } else {
        // API error
        setFormStatus({
          isSubmitting: false,
          isSubmitted: false,
          isError: true,
          message: result.message || "Something went wrong. Please try again."
        });
      }
    } catch (error) {
      // Network error
      setFormStatus({
        isSubmitting: false,
        isSubmitted: false,
        isError: true,
        message: "Failed to submit form. Please check your connection and try again."
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Have a question or need assistance with your project? Our team is here to help.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        {/* Contact Form */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
          
          {formStatus.isSubmitted ? (
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-md mb-6">
              <p className="text-green-800 dark:text-green-200">{formStatus.message}</p>
              <Button 
                className="mt-4 bg-[#f6733c] hover:bg-[#e45f2d]"
                onClick={() => setFormStatus(prev => ({ ...prev, isSubmitted: false }))}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {formStatus.isError && (
                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
                  <p className="text-red-800 dark:text-red-200">{formStatus.message}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name*
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name*
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address*
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject*
                </label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Project Consultation">Project Consultation</option>
                  <option value="Request a Quote">Request a Quote</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message*
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                ></textarea>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="consent" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  I consent to having this website store my submitted information so they can respond to my inquiry.*
                </label>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#f6733c] hover:bg-[#e45f2d]"
                disabled={formStatus.isSubmitting}
              >
                {formStatus.isSubmitting ? "Sending..." : "Submit Message"}
              </Button>
            </form>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Address</h3>
                  <p className="text-gray-600 dark:text-gray-400">17815 106 Ave NW<br />Edmonton, AB T5S 2H1<br />Canada</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Phone</h3>
                  <p className="text-gray-600 dark:text-gray-400">(780) 555-0123</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400">admin@utilitek.ca</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Business Hours</h3>
                  <p className="text-gray-600 dark:text-gray-400">Monday - Friday: 8:00 AM - 5:00 PM MST<br />Saturday & Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-[300px] rounded-lg overflow-hidden">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4740.865762019465!2d-113.6282313971037!3d53.55003963821127!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x53a020de2b7f18eb%3A0x9daaf7881e0edc24!2s17815%20106%20Ave%20NW%2C%20Edmonton%2C%20AB%20T5S%202H1!5e0!3m2!1sen!2sca!4v1742248049622!5m2!1sen!2sca" 
              width="600" 
              height="450" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full"
            />  
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              <Button 
                variant="outline" 
                className="bg-white hover:bg-gray-100 text-gray-800"
                onClick={() => window.open("https://www.google.com/maps/place/17815+106+Ave+NW,+Edmonton,+AB+T5S+2H1,+Canada/@53.5500396,-113.6282314,17z/data=!3m1!4b1!4m6!3m5!1s0x53a020de2b7f18eb:0x9daaf7881e0edc24!8m2!3d53.5500396!4d-113.6282314!16s%2Fg%2F11c1z0_0_9", "_blank")}
              >
                View Larger Map
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-semibold mb-8 text-center">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-3">What services does Utilitek Solutions offer?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              We provide comprehensive engineering consulting services for utility and infrastructure projects, including electrical, mechanical, and civil engineering solutions.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-3">Do you work on projects outside of Alberta?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Yes, while our headquarters is in Edmonton, we work on projects throughout Canada and have experience with regulatory requirements in multiple provinces.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-3">How do I request a quote for my project?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              You can request a quote by filling out our contact form, calling our office, or sending an email with your project details. We aim to respond to all inquiries within 24-48 business hours.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-3">What information should I provide for a consultation?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              To help us understand your needs, please provide project scope, timeline, location, and any specific requirements or challenges. The more details you can share, the better we can assist you.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-50 dark:bg-blue-900 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to discuss your project?</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Our team of experienced engineers is ready to help you bring your vision to life. Contact us today to schedule a consultation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ScheduleConsultation />
          <Link href="/projects">
            <Button size="lg" variant="outline" className="border-[#f6733c] text-[#f6733c] hover:bg-[#f6733c] hover:text-white">
              View Our Projects
            </Button>
          </Link>
        </div>  
      </div>
    </div>
  );
}