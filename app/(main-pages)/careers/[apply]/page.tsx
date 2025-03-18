"use client";
import { useState, FormEvent, ChangeEvent, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Turnstile from "@/components/turnstile";
export default function CareerApplicationPage({ params }: { params: Promise<{ apply: string }> }) {
  const [token, setToken] = useState<string | null>(null);
  const handleVerify = (token: string) => {
    setToken(token);
  };
  // Mock job data - in a real app, this would come from an API or database
  const jobs = [
    {
      id: "1",
      title: "Senior Electrical Engineer",
      location: "Edmonton, Alberta",
      type: "Full-time",
      description: "We are seeking an experienced Electrical Distribution Engineer to join our team in Edmonton. The ideal candidate will have expertise in designing and optimizing electrical distribution systems for urban and rural areas.",
      requirements: [
        "Bachelor's degree in Electrical Engineering",
        "5+ years of experience in electrical distribution design",
        "Professional Engineer (P.Eng) designation",
        "Experience with AutoCAD and power system modeling software",
        "Strong understanding of Canadian Electrical Code"
      ],
      responsibilities: [
        "Design electrical distribution systems for utility clients",
        "Perform load flow analysis and short circuit studies",
        "Develop technical specifications for equipment procurement",
        "Coordinate with clients, contractors, and regulatory authorities",
        "Provide technical guidance to junior engineers and technologists"
      ],
    },
    {
      id: "2",
      title: "Project Manager",
      location: "Calgary, Alberta",
      type: "Full-time",
      description: "We are seeking a Project Manager to oversee our engineering projects from inception to completion. The ideal candidate will have a strong background in managing utility and infrastructure projects with excellent client communication skills.",
      requirements: [
        "Bachelor's degree in Engineering, Construction Management, or related field",
        "PMP certification preferred",
        "7+ years of experience managing engineering or construction projects",
        "Strong understanding of project management methodologies",
        "Experience with project management software and MS Office suite",
        "Excellent communication and leadership skills" 
      ],
      responsibilities: [
        "Lead project planning, execution, monitoring, and closure",
        "Develop and maintain project schedules, budgets, and resource allocations",
        "Coordinate with clients, contractors, and internal engineering teams",
        "Identify and mitigate project risks and issues",   
        "Ensure projects meet quality standards and are delivered on time and within budget",
        "Prepare and present project status reports to stakeholders"
      ],
    },
    {
      id: "3",
      title: "Civil Engineer (EIT)",
      location: "Edmonton, Alberta",
      type: "Full-time",
      description: "We are seeking a Civil Engineer with a passion for infrastructure development. The ideal candidate will have a strong background in civil engineering design and construction management.",
      requirements: [
        "Bachelor's degree in Civil Engineering",
        "EIT certification preferred",
        "3+ years of experience in civil engineering design and construction management",
        "Strong understanding of civil engineering principles and practices",
        "Experience with civil engineering software and MS Office suite",
        "Excellent communication and teamwork skills"
      ],
      responsibilities: [   
        "Design and analyze civil engineering structures",
        "Prepare construction drawings and specifications",
        "Conduct site assessments and soil investigations",
        "Coordinate with clients, contractors, and regulatory authorities",
        "Provide technical support to project teams and clients"
      ],    
    },
    // Other job listings...
  ];

  // Unwrap params using React.use() to fix the console error
  const unwrappedParams = use(params);
  
  // Find the job with the matching ID
  const jobId = unwrappedParams.apply;
  const job = jobs.find(job => job.id === jobId) || jobs[0];
  
  // Form state
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
          <Image 
            src="https://placehold.co/1368x256.png" 
            alt="Career opportunity" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
            <div className="text-white p-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{job.title}</h1>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                  {job.location}
                </span>
                <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                  {job.type}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Job details sections remain the same */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Job Description</h2>
            <p className="text-gray-700 dark:text-gray-300">{job.description}</p>
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