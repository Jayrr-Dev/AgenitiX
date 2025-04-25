"use client";
import { useState, FormEvent, ChangeEvent, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Turnstile from "@/components/turnstile";
import { getJobOpeningById, JobOpening } from "@/features/careers/lib/api/jobOpenings";
import { useQuery } from "@tanstack/react-query";

export default function CareerApplicationPage({ params }: { params: Promise<{ apply: string }> }) {
  const { apply } = use(params);
  const {data: job, isLoading, error} = useQuery({
    queryKey: ["job", apply], 
    queryFn: () => getJobOpeningById(apply)
  })
  const [token, setToken] = useState<string | null>(null);
  const handleVerify = (token: string) => {
    setToken(token);
  };


  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    coverLetter: ""
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  // Handle text input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle file upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Check file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(files[0].type)) {
        alert('Please upload only PDF, DOC, or DOCX files.');
        e.target.value = '';
        setResumeFile(null);
        return;
      }
      
      // Check file size (max 5MB)
      if (files[0].size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        e.target.value = '';
        setResumeFile(null);
        return;
      }
      
      setResumeFile(files[0]);
    } else {
      setResumeFile(null);
    }
  };
  
  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      alert('Please upload your resume/CV');
      return;
    }
    if (!token) {
      alert('Please verify the captcha');
      return;
    }
    if (!job) {
      alert('Job details not loaded');
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);
    
    try {
      // Create FormData object
      const submission = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        submission.append(key, value);
      });
      
      // Add job information
      submission.append('jobId', job.id);
      submission.append('jobTitle', job.title);
      
      // Add resume file
      submission.append('resume', resumeFile);
      
      // Add token to submission
      submission.append('token', token);
      
      // Send the form data to the API
      const response = await fetch('/api/careers', {
        method: 'POST',
        body: submission
      });
      

      const result = await response.json();
      
      setSubmitResult(result);
      
      // Reset form if successful
      if (result.success) {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          coverLetter: ""
        });
        setResumeFile(null);
        setToken(null);
        
        // Reset file input
        const fileInput = document.getElementById('resume') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitResult({
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center h-screen">
        <div className="text-center">Loading job details...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/careers" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Careers
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="relative h-64">
          {job.image && (
            <Image 
              src={job.image} 
              alt="Career opportunity" 
              fill 
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
            <div className="text-white p-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{job.title}</h1>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                  {job.location}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Job details sections remain the same */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Job Description</h2>
            <p className="text-gray-700 dark:text-gray-300">{job.fullDescription}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Requirements</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              {job.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              {job.responsibilities.map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
          </div>

          {/* Updated application form */}
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Apply for this Position</h2>
            
            {submitResult && (
              <div className={`p-4 mb-6 rounded-md ${submitResult.success ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                {submitResult.message}
              </div>
            )}
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  required
                />
              </div>
              <div>
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resume/CV
                </label>
                <input
                  type="file"
                  id="resume"
                  name="resume"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  required
                />
                {resumeFile && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Selected file: {resumeFile.name} ({Math.round(resumeFile.size / 1024)} KB)
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Accepted formats: PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>
              <div>
                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cover Letter (Optional)
                </label>
                <textarea
                  id="coverLetter"
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                ></textarea>
              </div>
              <Turnstile siteKey="0x4AAAAAABBaVePB9txPEfir" onVerify={handleVerify} />
              <Button 
                type="submit" 
                className="w-full bg-[#f6733c] hover:bg-[#e45f2d]"
                disabled={isSubmitting || !token}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}