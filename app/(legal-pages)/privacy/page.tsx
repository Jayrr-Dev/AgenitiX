import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PrivacyPage() {
	return (
		<div className="container mx-auto px-4 py-12">
			<div className="mb-16 text-center">
				<h1 className="mb-4 font-bold text-4xl">Privacy Policy</h1>
				<p className="mx-auto max-w-2xl text-gray-600 text-xl dark:text-gray-400">
					At Utilitek Solutions, we take your privacy seriously. This policy outlines how we
					collect, use, and protect your information.
				</p>
			</div>
			<div className="mx-auto mb-16 max-w-4xl rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
				<div className="space-y-8">
					<section>
						<h2 className="mb-4 font-semibold text-2xl">Information We Collect</h2>
						<p className="mb-4 text-gray-700 dark:text-gray-300">
							We collect information that you provide directly to us when you:
						</p>
						<ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
							<li>Contact us through our website</li>
							<li>Request a consultation or quote</li>
							<li>Sign up for our newsletter</li>
							<li>Participate in surveys or feedback forms</li>
							<li>Enter into a contract for our services</li>
						</ul>
					</section>

					<section>
						<h2 className="mb-4 font-semibold text-2xl">How We Use Your Information</h2>
						<p className="mb-4 text-gray-700 dark:text-gray-300">
							We use the information we collect to:
						</p>
						<ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
							<li>Provide, maintain, and improve our services</li>
							<li>Respond to your inquiries and fulfill your requests</li>
							<li>Send you technical notices, updates, and administrative messages</li>
							<li>Communicate with you about products, services, and events</li>
							<li>
								Monitor and analyze trends, usage, and activities in connection with our services
							</li>
						</ul>
					</section>

					<section>
						<h2 className="mb-4 font-semibold text-2xl">Information Sharing</h2>
						<p className="text-gray-700 dark:text-gray-300">
							We do not sell, trade, or otherwise transfer your personally identifiable information
							to outside parties except as described below:
						</p>
						<ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
							<li>
								With vendors, consultants, and other service providers who need access to such
								information to carry out work on our behalf
							</li>
							<li>
								If we believe disclosure is necessary to comply with any applicable law, regulation,
								legal process, or governmental request
							</li>
							<li>
								In connection with a merger, sale of company assets, financing, or acquisition of
								all or a portion of our business
							</li>
						</ul>
					</section>

					<section>
						<h2 className="mb-4 font-semibold text-2xl">Data Security</h2>
						<p className="text-gray-700 dark:text-gray-300">
							We take reasonable measures to help protect information about you from loss, theft,
							misuse, unauthorized access, disclosure, alteration, and destruction. However, no
							security system is impenetrable, and we cannot guarantee the security of our systems.
						</p>
					</section>

					<section>
						<h2 className="mb-4 font-semibold text-2xl">Your Rights</h2>
						<p className="mb-4 text-gray-700 dark:text-gray-300">
							Depending on your location, you may have certain rights regarding your personal
							information, including:
						</p>
						<ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
							<li>The right to access personal information we hold about you</li>
							<li>The right to request correction or deletion of your personal information</li>
							<li>
								The right to restrict or object to our processing of your personal information
							</li>
							<li>The right to data portability</li>
						</ul>
					</section>

					<section>
						<h2 className="mb-4 font-semibold text-2xl">Changes to This Policy</h2>
						<p className="text-gray-700 dark:text-gray-300">
							We may update this privacy policy from time to time. We will notify you of any changes
							by posting the new privacy policy on this page and updating the effective date at the
							top of this policy.
						</p>
					</section>

					<section>
						<h2 className="mb-4 font-semibold text-2xl">Contact Us</h2>
						<p className="text-gray-700 dark:text-gray-300">
							If you have any questions about this privacy policy or our practices, please contact
							us at:
						</p>
						<div className="mt-4 text-gray-700 dark:text-gray-300">
							<p>Utilitek Solutions</p>
							<p>Email: privacy@utilitek.ca</p>
							<p>Phone: (403) 555-1234</p>
						</div>
					</section>
				</div>
			</div>
			{/* CTA Section */}
			<div className="rounded-lg bg-blue-50 p-8 text-center dark:bg-blue-900">
				<h2 className="mb-4 font-semibold text-2xl">Have questions about our privacy practices?</h2>
				<p className="mx-auto mb-6 max-w-2xl text-gray-700 dark:text-gray-300">
					Our team is committed to transparency and protecting your information. Contact us if you
					need more information.
				</p>
				<div className="flex flex-col justify-center gap-4 sm:flex-row">
					<Link href="/contact">
						<Button size="lg" className="bg-[#f6733c] hover:bg-[#e45f2d]">
							Contact Us
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
