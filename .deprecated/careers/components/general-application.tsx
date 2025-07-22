"use client";
import { Button } from "@/components/ui/button";
import { type ChangeEvent, type FormEvent, useState } from "react";

interface GeneralApplicationProps {
	onSubmitSuccess: () => void;
}

export default function GeneralApplication({ onSubmitSuccess }: GeneralApplicationProps) {
	// Form state
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		position: "",
		coverLetter: "",
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
			[name]: value,
		});
	};

	// Handle file upload
	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			// Check file type
			const validTypes = [
				"application/pdf",
				"application/msword",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			];
			if (!validTypes.includes(files[0].type)) {
				alert("Please upload only PDF, DOC, or DOCX files.");
				e.target.value = "";
				setResumeFile(null);
				return;
			}

			// Check file size (max 5MB)
			if (files[0].size > 5 * 1024 * 1024) {
				alert("File size exceeds 5MB limit.");
				e.target.value = "";
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
			alert("Please upload your resume/CV");
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

			// Add resume file
			submission.append("resume", resumeFile);
			submission.append("applicationType", "general");

			// Send the form data to the API
			const response = await fetch("/api/careers", {
				method: "POST",
				body: submission,
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
					position: "",
					coverLetter: "",
				});
				setResumeFile(null);

				// Reset file input
				const fileInput = document.getElementById("resume") as HTMLInputElement;
				if (fileInput) fileInput.value = "";
			}
		} catch (error) {
			console.error("Error submitting application:", error);
			setSubmitResult({
				success: false,
				message: "An unexpected error occurred. Please try again later.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
			<div className="p-6 md:p-8">
				<h2 className="text-2xl font-semibold mb-6">General Application</h2>

				{submitResult && (
					<div
						className={`p-4 mb-6 rounded-md ${submitResult.success ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}
					>
						{submitResult.message}
					</div>
				)}

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="grid md:grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="firstName"
								className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
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
							<label
								htmlFor="lastName"
								className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
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
					<div className="grid md:grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
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
							<label
								htmlFor="phone"
								className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
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
					</div>
					<div>
						<label
							htmlFor="position"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
						>
							Position of Interest
						</label>
						<input
							type="text"
							id="position"
							name="position"
							value={formData.position}
							onChange={handleChange}
							className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
							required
						/>
					</div>
					<div>
						<label
							htmlFor="resume"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
						>
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
						<label
							htmlFor="coverLetter"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
						>
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
					<Button
						type="submit"
						className="w-full bg-[#f6733c] hover:bg-[#e45f2d]"
						disabled={isSubmitting}
					>
						{isSubmitting ? "Submitting..." : "Submit Application"}
					</Button>
				</form>
			</div>
		</div>
	);
}
