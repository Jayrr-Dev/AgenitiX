import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SitemapPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Sitemap</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Find all the pages on our website organized in one place.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#f6733c]">Main Pages</h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <Link href="/" className="hover:text-[#f6733c] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#f6733c] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/expertise" className="hover:text-[#f6733c] transition-colors">
                  Expertise
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-[#f6733c] transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-[#f6733c] transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#f6733c] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
{/* 
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#f6733c]">Expertise</h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <Link href="/expertise/distribution" className="hover:text-[#f6733c] transition-colors">
                  Distribution System Design
                </Link>
              </li>
              <li>
                <Link href="/expertise/substation" className="hover:text-[#f6733c] transition-colors">
                  Substation Engineering
                </Link>
              </li>
              <li>
                <Link href="/expertise/renewable" className="hover:text-[#f6733c] transition-colors">
                  Renewable Energy Integration
                </Link>
              </li>
              <li>
                <Link href="/expertise/smart-grid" className="hover:text-[#f6733c] transition-colors">
                  Smart Grid Solutions
                </Link>
              </li>
            </ul>
          </div> */}

          {/* <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#f6733c]">Careers</h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <Link href="/careers" className="hover:text-[#f6733c] transition-colors">
                  Careers Overview
                </Link>
              </li>
              <li>
                <Link href="/careers/1" className="hover:text-[#f6733c] transition-colors">
                  Senior Electrical Engineer
                </Link>
              </li>
              <li>
                <Link href="/careers/2" className="hover:text-[#f6733c] transition-colors">
                  Project Manager
                </Link>
              </li>
              <li>
                <Link href="/careers/3" className="hover:text-[#f6733c] transition-colors">
                  Civil Engineer (EIT)
                </Link>
              </li>
            </ul>
          </div> */}

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#f6733c]">Legal</h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <Link href="/terms" className="hover:text-[#f6733c] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#f6733c] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="hover:text-[#f6733c] transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#f6733c]">Resources</h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <Link href="/blog" className="hover:text-[#f6733c] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#f6733c] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-50 dark:bg-blue-900 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Can't find what you're looking for?</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Our team is here to help you navigate our services and find the information you need.
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
