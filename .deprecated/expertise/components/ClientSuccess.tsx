"use client";
import { ProjectCarousel } from "@/features/projects/components/ProjectCarousel";
import { useQuery } from "@tanstack/react-query";

export default function ClientSuccess() {
	return (
		<div className="mb-20">
			<h2 className="text-3xl font-semibold mb-8">Your Success Is Our Priority</h2>
			<div className="bg-linear-to-r from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-lg shadow-md">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div>
						<h3 className="text-2xl font-semibold mb-4 text-[#f6733c]">Proven Results</h3>
						<p className="text-gray-700 dark:text-gray-300 mb-6">
							Our expertise has helped clients across Alberta achieve remarkable results in their
							electrical distribution projects:
						</p>
						<ul className="space-y-3">
							{[
								"10+ major projects completed on time and within budget in the last 2 years",
								"1000+ total projects completed on time and within budget in the last 4 years",
								"10+ years of experience in the electrical distribution industry",
							].map((item, idx) => (
								<li key={idx} className="flex items-start">
									<svg
										className="w-5 h-5 mr-2 text-[#f6733c] mt-1"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
									<span className="text-gray-700 dark:text-gray-300">
										<strong>{item.split(" ")[0]}</strong> {item.slice(item.indexOf(" ") + 1)}
									</span>
								</li>
							))}
						</ul>
					</div>
					<div>
						{/* TODO: Add client testimonial */}
						{/* <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xs">
                <h4 className="text-lg font-semibold mb-3">Client Testimonial</h4>
                <blockquote className="italic text-gray-600 dark:text-gray-400 mb-4">
                  "Their expertise in distribution system design transformed our aging infrastructure into a modern, efficient network. The team's technical knowledge and commitment to excellence made all the difference in our project's success."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full mr-3" />
                  <div>
                    <p className="font-medium">Dan Busilian</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Director of Operations, Western Utilities</p>
                  </div>
                </div>
              </div> */}
					</div>
				</div>
			</div>
		</div>
	);
}
