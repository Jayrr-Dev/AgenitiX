import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SitemapPage() {
	return (
		<div className="container mx-auto px-4 py-12">
			<div className="mb-12 text-center">
				<h1 className="mb-4 font-bold text-4xl">Sitemap</h1>
				<p className="mx-auto max-w-2xl text-gray-600 text-xl dark:text-gray-400">
					Find all the pages on our website organized in one place.
				</p>
			</div>
			<div className="mb-16 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					<div>
						<h2 className="mb-4 font-semibold text-2xl text-[#f6733c]">Main Pages</h2>
						<ul className="space-y-2 text-gray-700 dark:text-gray-300">
							<li>
								<Link href="/" className="transition-colors hover:text-[#f6733c]">
									Home
								</Link>
							</li>
							<li>
								<Link href="/about" className="transition-colors hover:text-[#f6733c]">
									About Us
								</Link>
							</li>
							<li>
								<Link href="/expertise" className="transition-colors hover:text-[#f6733c]">
									Expertise
								</Link>
							</li>
							<li>
								<Link href="/projects" className="transition-colors hover:text-[#f6733c]">
									Projects
								</Link>
							</li>
							<li>
								<Link href="/careers" className="transition-colors hover:text-[#f6733c]">
									Careers
								</Link>
							</li>
							<li>
								<Link href="/contact" className="transition-colors hover:text-[#f6733c]">
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
                  Design Lead Engineer
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
						<h2 className="mb-4 font-semibold text-2xl text-[#f6733c]">Legal</h2>
						<ul className="space-y-2 text-gray-700 dark:text-gray-300">
							<li>
								<Link href="/terms" className="transition-colors hover:text-[#f6733c]">
									Terms of Service
								</Link>
							</li>
							<li>
								<Link href="/privacy" className="transition-colors hover:text-[#f6733c]">
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link href="/sitemap" className="transition-colors hover:text-[#f6733c]">
									Sitemap
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h2 className="mb-4 font-semibold text-2xl text-[#f6733c]">Resources</h2>
						<ul className="space-y-2 text-gray-700 dark:text-gray-300">
							<li>
								<Link href="/blog" className="transition-colors hover:text-[#f6733c]">
									Blog
								</Link>
							</li>
							<li>
								<Link href="/faq" className="transition-colors hover:text-[#f6733c]">
									FAQ
								</Link>
							</li>
						</ul>
					</div>
				</div>
			</div>
			{/* CTA Section */}
			<div className="rounded-lg bg-blue-50 p-8 text-center dark:bg-blue-900">
				<h2 className="mb-4 font-semibold text-2xl">Can't find what you're looking for?</h2>
				<p className="mx-auto mb-6 max-w-2xl text-gray-700 dark:text-gray-300">
					Our team is here to help you navigate our services and find the information you need.
				</p>
				<div className="flex flex-col justify-center gap-4 sm:flex-row">
					<Link href="/contact" legacyBehavior={true}>
						<Button size="lg" className="bg-[#f6733c] hover:bg-[#e45f2d]">
							Contact Us
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
