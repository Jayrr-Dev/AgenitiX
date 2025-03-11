import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Projects</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Delivering innovative electrical distribution solutions across Canada with expertise and precision.
        </p>
      </div>

      {/* Featured Projects */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Featured Projects</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Project 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md transition-transform hover:scale-[1.02]">
            <div className="relative h-64">
              <Image 
                src="/api/placeholder/800/600" 
                alt="Edmonton Substation Upgrade" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium mb-3">
                Substation
              </span>
              <h3 className="text-xl font-semibold mb-2">Edmonton Substation Upgrade</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Modernization of a critical 138kV substation serving Edmonton's growing eastern district.
              </p>
              <Link href="/projects/edmonton-substation">
                <Button variant="outline" className="w-full">View Project</Button>
              </Link>
            </div>
          </div>

          {/* Project 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md transition-transform hover:scale-[1.02]">
            <div className="relative h-64">
              <Image 
                src="/api/placeholder/800/600" 
                alt="Calgary Distribution Network" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium mb-3">
                Distribution
              </span>
              <h3 className="text-xl font-semibold mb-2">Calgary Distribution Network</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Design and implementation of a resilient distribution network for Calgary's new industrial park.
              </p>
              <Link href="/projects/calgary-distribution">
                <Button variant="outline" className="w-full">View Project</Button>
              </Link>
            </div>
          </div>

          {/* Project 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md transition-transform hover:scale-[1.02]">
            <div className="relative h-64">
              <Image 
                src="/api/placeholder/800/600" 
                alt="Fort McMurray Microgrid" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium mb-3">
                Microgrid
              </span>
              <h3 className="text-xl font-semibold mb-2">Fort McMurray Microgrid</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Innovative microgrid solution providing reliable power to remote industrial facilities.
              </p>
              <Link href="/projects/fort-mcmurray-microgrid">
                <Button variant="outline" className="w-full">View Project</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Project Categories */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Our Expertise</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Distribution Systems</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Design and optimization of electrical distribution networks for urban and rural areas.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Substation Engineering</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Comprehensive substation design, upgrades, and modernization projects.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Renewable Integration</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Seamless integration of renewable energy sources into existing distribution networks.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Protection & Control</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Advanced protection and control systems for reliable and secure power distribution.
            </p>
          </div>
        </div>
      </div>

      {/* Project Gallery */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Project Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="relative h-48 md:h-64 rounded-lg overflow-hidden">
              <Image 
                src={`/api/placeholder/400/300?text=Project+${item}`} 
                alt={`Project image ${item}`} 
                fill 
                className="object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Client Testimonials */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Client Testimonials</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-4"></div>
              <div>
                <h3 className="font-semibold">Sarah Johnson</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Project Manager, Alberta Energy</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 italic">
              "Utilitek Solutions delivered our distribution upgrade project on time and under budget. Their expertise in electrical distribution systems is unmatched, and their team was responsive throughout the entire process."
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-4"></div>
              <div>
                <h3 className="font-semibold">Michael Chen</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Director of Operations, Calgary Municipal</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 italic">
              "We've worked with Utilitek on multiple substation projects, and they consistently exceed our expectations. Their innovative approach to solving complex engineering challenges has saved us both time and resources."
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-50 dark:bg-blue-900 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to start your project?</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Our team of experienced electrical engineers is ready to help you bring your distribution project to life. Contact us today to discuss your requirements.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <Button size="lg" className="bg-[#f6733c] hover:bg-[#e45f2d]">
              Contact Us
            </Button>
          </Link>
          <Link href="/expertise">
            <Button size="lg" variant="outline" className="border-[#f6733c] text-[#f6733c] hover:bg-[#f6733c] hover:text-white">
              Learn More About Our Services
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
