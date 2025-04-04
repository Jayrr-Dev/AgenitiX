"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarDays, Clock, User, Mail, Phone, MessageSquare, CheckCircle2, AlertCircle, Building2, Briefcase, Lightbulb } from "lucide-react";
import Turnstile from "@/components/turnstile"; 
// Define available time slots
const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", 
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
];

// Format date as "YYYY-MM-DD"
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get tomorrow's date as the minimum selectable date
const getTomorrow = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateForInput(tomorrow);
};

// Get date 3 months from now as the maximum selectable date
const getMaxDate = (): string => {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  return formatDateForInput(maxDate);
};

// Format date in a more readable format for the success screen
const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
};

export default function ScheduleConsultation() {
  const [token, setToken] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    topic: "",
    message: ""
  });
  
  // Store submission details for the success screen
  const [submissionDetails, setSubmissionDetails] = useState({
    name: "",
    date: "",
    time: "",
    topic: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVerify = (token: string) => {
    setToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Validate Turnstile token
      if (!token) {
        throw new Error('Please complete the CAPTCHA verification');
      }

      // Prepare the data to send to the API
      const consultationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        role: formData.role,
        date: selectedDate,
        time: selectedTime,
        topic: formData.topic,
        message: formData.message,
        token: token // Include the Turnstile token
      };
      
      // Send the data to our API endpoint
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consultationData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to schedule consultation');
      }
      
      // Store details for success screen
      setSubmissionDetails({
        name: formData.name,
        date: selectedDate,
        time: selectedTime,
        topic: formData.topic
      });
      
      // Show success screen
      setIsSubmitted(true);
      
      // Reset form (will be used if user opens a new consultation request)
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        role: "",
        topic: "",
        message: ""
      });
      setSelectedDate("");
      setSelectedTime("");
      setToken(null);
    } catch (error) {
      console.error("Error submitting consultation request:", error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDialogClose = () => {
    // When dialog closes, reset the submission state and error
    if (isSubmitted) {
      setIsSubmitted(false);
    }
    setErrorMessage("");
    setToken(null); // Reset Turnstile token when dialog closes
  };
  
  // Success screen component
  const SuccessScreen = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-6">
        <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Consultation Request Sent!</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        Thank you {submissionDetails.name}, your consultation request has been received.
      </p>
      
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg w-full max-w-md mb-6">
        <h4 className="font-medium mb-4 text-left">Request Details:</h4>
        <div className="space-y-2 text-left">
          <p><span className="font-medium">Date:</span> {formatDateForDisplay(submissionDetails.date)}</p>
          <p><span className="font-medium">Time:</span> {submissionDetails.time}</p>
          <p><span className="font-medium">Topic:</span> {submissionDetails.topic}</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-6">
        Our team will confirm your appointment shortly via email.
      </p>
      
      <Button 
        onClick={() => setIsOpen(false)} 
        className="bg-[#f6733c] hover:bg-[#e45f2d]"
      >
        Close
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) handleDialogClose();
    }}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-[#f6733c] hover:bg-[#e45f2d]">
          Schedule a Consultation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {isSubmitted ? (
          <SuccessScreen />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Schedule a Consultation</DialogTitle>
              <DialogDescription>
                Select a date and time that works for you. Our team will confirm your appointment.
              </DialogDescription>
            </DialogHeader>
            
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md mb-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-800 dark:text-red-200 text-sm">{errorMessage}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Preferred Date
                  </Label>
                  <Input 
                    id="date"
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getTomorrow()}
                    max={getMaxDate()}
                    required
                    className="w-full"
                  />
                </div>
                
                {/* Time Selection */}
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Preferred Time
                  </Label>
                  <select
                    id="time"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  >
                    <option value="">Select a time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Your Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    required
                  />
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(XXX) XXX-XXXX"
                    required
                  />
                </div>
                
                {/* Company */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Company
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Your Company Name"
                  />
                </div>
                
                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Your Role
                  </Label>
                  <Input
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="Job Title / Position"
                  />
                </div>
                
                {/* Topic */}
                <div className="space-y-2">
                    <Label htmlFor="topic" className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" /> Consultation Topic
                  </Label>
                  <select
                    id="topic"
                    name="topic"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.topic}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="Distribution System Design">Distribution System Design</option>
                    <option value="Substation Engineering">Substation Engineering</option>
                    <option value="Renewable Integration">Renewable Integration</option>
                    <option value="Smart Grid Solutions">Smart Grid Solutions</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>
              </div>
              
              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Additional Information
                </Label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please provide any specific details about your project or questions you'd like us to address during the consultation."
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Turnstile siteKey="0x4AAAAAABBaVePB9txPEfir" onVerify={handleVerify} />

              <DialogFooter>
                <Button type="submit" className="bg-[#f6733c] hover:bg-[#e45f2d]" disabled={isSubmitting || !token || !formData.name || !formData.email || !formData.phone || !formData.company || !formData.role || !formData.topic || !formData.message}>
                  {isSubmitting ? "Submitting..." : "Schedule Consultation"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}