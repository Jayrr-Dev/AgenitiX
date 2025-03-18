import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ExpertisePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Expertise</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Delivering innovative electrical distribution solutions with precision engineering and industry-leading expertise.
        </p>
      </div>

      {/* Core Expertise Areas */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Core Expertise Areas</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Expertise 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
            <div className="relative h-56">
              <Image 
                src="https://placehold.co/435x224.png" 
                alt="Distribution System Design" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-3">Distribution System Design</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Comprehensive design of electrical distribution networks for urban, suburban, and rural environments with focus on reliability and efficiency.
              </p>
              <ul className="mb-4 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Network modeling and analysis</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Load flow studies</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Protection coordination</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Expertise 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
            <div className="relative h-56">
              <Image 
                src="https://placehold.co/435x224.png" 
                alt="Substation Engineering" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-3">Substation Engineering</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                End-to-end substation design, modernization, and retrofitting services for utilities and industrial clients.
              </p>
              <ul className="mb-4 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Primary and secondary equipment design</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Control system integration</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">SCADA implementation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Expertise 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
            <div className="relative h-56">
              <Image 
                src="https://placehold.co/435x224.png" 
                alt="Renewable Integration" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-3">Renewable Integration</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Specialized solutions for integrating renewable energy sources into existing distribution networks.
              </p>
              <ul className="mb-4 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Grid impact studies</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Power quality analysis</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Energy storage solutions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Client Success Stories */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Your Success Is Our Priority</h2>
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-lg shadow-md">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-[#f6733c]">Proven Results</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Our expertise has helped clients across Canada achieve remarkable results in their electrical distribution projects:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[#f6733c] mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>30% average reduction</strong> in system losses through optimized distribution design
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[#f6733c] mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>99.98% reliability rating</strong> for our substation designs and implementations
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[#f6733c] mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>40+ major projects</strong> completed on time and within budget in the last 5 years
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h4 className="text-lg font-semibold mb-3">Client Testimonial</h4>
                <blockquote className="italic text-gray-600 dark:text-gray-400 mb-4">
                  "Their expertise in distribution system design transformed our aging infrastructure into a modern, efficient network. The team's technical knowledge and commitment to excellence made all the difference in our project's success."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Director of Operations, Western Utilities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specialized Services */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Specialized Services</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Power System Studies</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Comprehensive analysis of electrical systems including load flow, short circuit, arc flash, and harmonic studies to ensure safety and reliability.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Protection & Control</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Design and implementation of advanced protection schemes and control systems for distribution networks and substations.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Grid Modernization</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Implementation of smart grid technologies, automation systems, and advanced metering infrastructure to enhance grid reliability and efficiency.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Reliability Engineering</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Assessment and improvement of system reliability through contingency analysis, failure mode studies, and resilience planning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Approach */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Our Engineering Approach</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">1</span>
            </div>
            <h3 className="font-semibold mb-2">Assessment</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Thorough analysis of requirements and existing infrastructure
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">2</span>
            </div>
            <h3 className="font-semibold mb-2">Design</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Innovative solutions tailored to specific project requirements
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">3</span>
            </div>
            <h3 className="font-semibold mb-2">Implementation</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Precise execution with quality control and safety standards
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">4</span>
            </div>
            <h3 className="font-semibold mb-2">Validation</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Comprehensive testing and verification of system performance
            </p>
          </div>
        </div>
      </div>

      {/* Industry Standards */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Industry Standards & Compliance</h2>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Our engineering solutions adhere to the highest industry standards and regulatory requirements, including:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">IEEE Standards</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                IEEE 1547, IEEE C37.20, IEEE 519
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Canadian Electrical Code</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                CSA C22.1, CSA C22.2, CSA C22.3
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Provincial Regulations</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Alberta STANDATA, BC Electrical Code
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-50 dark:bg-blue-900 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to discuss your distribution project?</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Our team of experienced electrical engineers is ready to help you bring your distribution project to life. Contact us today to discuss your requirements.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <Button size="lg" className="bg-[#f6733c] hover:bg-[#e45f2d]">
              Contact Our Engineers
            </Button>
          </Link>
          <Link href="/projects">
            <Button size="lg" variant="outline" className="border-[#f6733c] text-[#f6733c] hover:bg-[#f6733c] hover:text-white">
              View Our Projects
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
