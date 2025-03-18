"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import GeneralApplication from "@/components/general-application";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react";

interface GeneralApplicationProps {
  onSubmitSuccess: () => void;
}

export default function CareersPage() {

  //current openings
  const currentOpenings = [
    {
      id: "1",
      title: "Senior Electrical Engineer",
      location: "Edmonton, AB",
      description: "Lead electrical design for utility and infrastructure projects, mentor junior engineers, and collaborate with multidisciplinary teams."
    },
    {
      id: "2",
      title: "Project Manager",
      location: "Calgary, AB",
      description: "Oversee engineering projects from inception to completion, manage client relationships, and ensure timely delivery within budget."
    },
    {
      id: "3",
      title: "Civil Engineer (EIT)",
      location: "Edmonton, AB",
      description: "Support civil engineering design for infrastructure projects, perform calculations, and assist with field inspections."
    }
  ];  

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };
    
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px] mb-16 rounded-lg overflow-hidden">
        <video
          src="https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOox6N8iRQTaxACzFgUNuTPJ7VWMRB9s0cS8dnvE"
          autoPlay
          muted
          loop
          className="object-cover h-full w-full absolute inset-0"
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-white p-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl max-w-2xl">
            Build your career with a company that values innovation, excellence, and professional growth
          </p>
        </div>
      </div>

      {/* Why Work With Us */}
      <div className="mb-16">
        <h2 className="text-3xl font-semibold mb-8 text-center">Why Work With Us</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Professional Growth</h3>
            <p className="text-gray-700 dark:text-gray-300">
              We invest in our employees' development through mentorship, training programs, and opportunities to work on challenging projects.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Collaborative Culture</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Our team-oriented environment encourages knowledge sharing, innovation, and cross-disciplinary collaboration.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Competitive Benefits</h3>
            <p className="text-gray-700 dark:text-gray-300">
              We offer competitive salaries, comprehensive health benefits, retirement plans, and work-life balance initiatives.
            </p>
          </div>
        </div>
      </div>

      {/* Current Openings */}
      <div className="mb-16">
        <h2 className="text-3xl font-semibold mb-8 text-center">Current Openings</h2>
        <div className="space-y-6">
          {currentOpenings.map((opening, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{opening.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{opening.location} | Full-time</p>
                </div>
                <Link href={`/careers/${opening.id}`} className="self-start md:self-center mt-4 md:mt-0">
                  <Button variant="default">
                    Apply Now
                  </Button> 
                </Link>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Employee Testimonials */}
      <div className="mb-16">
        <h2 className="text-3xl font-semibold mb-8 text-center">What Our Team Says</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                <Image
                  src="https://placehold.co/48x48.png"
                  alt="Employee portrait"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold">Sarah Johnson</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Senior Mechanical Engineer, 5 years</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 italic">
              "Working at Utilitek has been the highlight of my career. The challenging projects and supportive team environment have helped me grow both professionally and personally."
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                <Image
                  src="https://placehold.co/48x48.png"
                  alt="Employee portrait"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold">Michael Chen</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Project Manager, 3 years</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 italic">
              "The collaborative culture at Utilitek encourages innovation and excellence. I've had the opportunity to work on impactful projects while maintaining a healthy work-life balance."
            </p>
          </div>
        </div>
      </div>

      {/* Application Process */}
      <div className="mb-16">
        <h2 className="text-3xl font-semibold mb-8 text-center">Our Application Process</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">1</span>
            </div>
            <h3 className="font-semibold mb-2">Application</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Submit your resume and cover letter through our online portal
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">2</span>
            </div>
            <h3 className="font-semibold mb-2">Initial Screening</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Our HR team reviews applications and conducts phone interviews
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">3</span>
            </div>
            <h3 className="font-semibold mb-2">Technical Interview</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Meet with the team for a technical assessment and cultural fit
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">4</span>
            </div>
            <h3 className="font-semibold mb-2">Offer</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Successful candidates receive an offer to join our team
            </p>
          </div>
        </div>
      </div>

      {/* General Application */}
      <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Don't see a position that fits your skills?</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          We're always looking for talented individuals to join our team. Submit your resume for future opportunities.
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">Submit General Application</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>General Application</DialogTitle>
              <DialogDescription>
                Submit your information for consideration for future opportunities.
              </DialogDescription>
            </DialogHeader>
            <GeneralApplication onSubmitSuccess={handleDialogClose} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
