import { Button } from "@/components/ui/button";
import Link from "next/link";
  
export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          At Utilitek Solutions, we take your privacy seriously. This policy outlines how we collect, use, and protect your information.
        </p>
      </div>

      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-16">
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We collect information that you provide directly to us when you:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Contact us through our website</li>
              <li>Request a consultation or quote</li>
              <li>Sign up for our newsletter</li>
              <li>Participate in surveys or feedback forms</li>
              <li>Enter into a contract for our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Respond to your inquiries and fulfill your requests</li>
              <li>Send you technical notices, updates, and administrative messages</li>
              <li>Communicate with you about products, services, and events</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except as described below:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-4">
              <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
              <li>If we believe disclosure is necessary to comply with any applicable law, regulation, legal process, or governmental request</li>
              <li>In connection with a merger, sale of company assets, financing, or acquisition of all or a portion of our business</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our systems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>The right to access personal information we hold about you</li>
              <li>The right to request correction or deletion of your personal information</li>
              <li>The right to restrict or object to our processing of your personal information</li>
              <li>The right to data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the effective date at the top of this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about this privacy policy or our practices, please contact us at:
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
      <div className="bg-blue-50 dark:bg-blue-900 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Have questions about our privacy practices?</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Our team is committed to transparency and protecting your information. Contact us if you need more information.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
