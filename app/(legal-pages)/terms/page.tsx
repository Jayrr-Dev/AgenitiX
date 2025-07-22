import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TermsPage() {
	return (
		<div className="container mx-auto px-4 py-12">
			<div className="text-center mb-12">
				<h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
				<p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
					Please read these terms carefully before using our services.
				</p>
			</div>
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-16">
				<div className="prose dark:prose-invert max-w-none">
					<section>
						<h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							Welcome to Utilitek Solutions. These Terms of Service govern your use of our website
							and services. By accessing or using our services, you agree to be bound by these
							terms.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">2. Services</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							Utilitek Solutions provides electrical engineering consulting services, including but
							not limited to distribution system design, substation engineering, and renewable
							energy integration. The specific services to be provided will be outlined in a
							separate agreement or statement of work.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">3. Professional Standards</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							All services provided by Utilitek Solutions will be performed in accordance with the
							standard of care and skill ordinarily used by members of the engineering profession
							practicing under similar conditions at the same time and in the same locality.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">4. Client Responsibilities</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							Clients are responsible for providing timely and accurate information necessary for
							the completion of services. Delays in providing required information may result in
							project delays for which Utilitek Solutions cannot be held responsible.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							All reports, drawings, specifications, and other documents prepared by Utilitek
							Solutions in connection with the services are instruments of service and remain the
							property of Utilitek Solutions. The client shall have a license to use such documents
							for the specific project for which they were prepared.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">6. Payment Terms</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							Payment terms will be specified in the service agreement. Unless otherwise stated,
							invoices are due within 30 days of issuance. Late payments may be subject to interest
							charges.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							To the fullest extent permitted by law, the total liability of Utilitek Solutions to
							the client for any and all injuries, claims, losses, expenses, or damages arising out
							of or in any way related to the services shall not exceed the total compensation
							received by Utilitek Solutions under the relevant service agreement.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							Either party may terminate the service agreement with written notice if the other
							party substantially fails to fulfill its obligations under the agreement. In the event
							of termination, the client shall pay for all services rendered up to the termination
							date.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							These terms and any service agreements shall be governed by and construed in
							accordance with the laws of Alberta, Canada, without giving effect to any choice of
							law or conflict of law provisions.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							Utilitek Solutions reserves the right to modify these terms at any time. We will
							provide notice of significant changes by posting an updated version on our website.
							Your continued use of our services after such modifications constitutes your
							acceptance of the revised terms.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">11. Confidentiality</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							Utilitek Solutions agrees to maintain the confidentiality of all proprietary or
							confidential information provided by the client. Similarly, clients agree to maintain
							the confidentiality of any proprietary methodologies, technologies, or business
							practices of Utilitek Solutions.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">12. Force Majeure</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							Neither party shall be liable for any failure or delay in performance due to
							circumstances beyond their reasonable control, including but not limited to acts of
							God, natural disasters, pandemic, war, terrorism, riots, embargoes, or strikes.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">13. Insurance</h2>
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							Utilitek Solutions maintains professional liability insurance appropriate to the
							services provided. Certificates of insurance can be provided upon request.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
						<p className="text-gray-700 dark:text-gray-300">
							If you have any questions about these Terms of Service, please contact us at:
						</p>
						<div className="mt-4 text-gray-700 dark:text-gray-300">
							<p>Utilitek Solutions</p>
							<p>Email: legal@utilitek.ca</p>
							<p>Phone: (403) 555-1234</p>
							<p>Address: 123 Energy Way, Calgary, AB T2P 1X8</p>
						</div>
					</section>
				</div>
			</div>
			{/* CTA Section */}
			<div className="bg-blue-50 dark:bg-blue-900 p-8 rounded-lg text-center">
				<h2 className="text-2xl font-semibold mb-4">Have questions about our terms?</h2>
				<p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
					Our team is here to help clarify any aspects of our terms of service. Contact us for more
					information.
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<Link href="/contact" legacyBehavior>
						<Button size="lg" className="bg-[#f6733c] hover:bg-[#e45f2d]">
							Contact Us
						</Button>
					</Link>
					<Link href="/privacy" legacyBehavior>
						<Button
							size="lg"
							variant="outline"
							className="border-[#f6733c] text-[#f6733c] hover:bg-[#f6733c] hover:text-white"
						>
							View Privacy Policy
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
