import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">About Utilitek Solutions</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Powering Innovation in Electrical Distribution</p>
      </div>

      {/* Hero Section with Parallax Effect */}
      <div className="relative h-[500px] mb-20 overflow-hidden rounded-xl">
        <div className="absolute inset-0">
        <video
          src="https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxH05YgpZDmQiWokPRKAqj60Eh4sDU81tNyJpf"
          autoPlay
          muted
          loop
          className="object-cover h-full w-full absolute inset-0"
        />
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-black/70 to-transparent flex items-center">
          <div className="text-white max-w-xl p-12">
            <h2 className="text-4xl font-bold mb-4">Transforming Distribution Design</h2>
            <p className="text-xl mb-6">
              Since 2014, we've been engineering the future of electrical distribution systems across Alberta.
            </p>
            <Link href="/contact">
              <Button size="lg" className="bg-[#f6733c] hover:bg-[#e45f2d]">
                Connect With Our Engineers
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
        <div>
          <h2 className="text-3xl font-semibold mb-6">Our Story</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Founded in 2014 by Sam a former manager in Capital Engineering. Utilitek Solutions Inc. emerged from a passion for engineering and a vision to provide the best electrical distribution engineering services in Canada. 
            What began as a small team of passionate engineers has grown into one of Edmonton's most reliable and reputable consulting firms for utility infrastructure.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Our specialized focus on distribution systems and engineering design has allowed us to develop unparalleled expertise in grid modernization, 
            system integration, overhead design and underground design that are reshaping Canada's energy landscape.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Today, our specialized teams of engineers and technical experts brings decades of combined experience, 
            having successfully delivered over 1000 distribution projects in the Edmonton area and across Alberta.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
        
          <div className="relative h-[250px]">
            <Image
              src="https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxciIfXXyC1qNbBviJKaG6rtSPTL0zY8eFWxmn"
              alt="Distribution system design"
              width={322}
              height={250}
              className="object-cover rounded-lg"
            />
          </div>
            <div className="relative h-[250px]">
              <Image
              src="https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxYEk7l8SPc2WTjCtBSanVlQZJRuyDso4mv96p"
              alt="Engineering team meeting"
              width={322}
              height={250}
              className="object-cover rounded-lg"
            />
          </div>
          <div className="relative h-[250px]">
            <Image
              src="https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxvcyRXxZV7rebhwyJS6CM3imHpQXk8AoYz0It"
              alt="Field engineering work"
              width={322}
              height={250}
              className="object-cover rounded-lg"
            />
          </div>
          <div className="relative h-[250px]">
            <Image
              src="https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxzpmR54G6HPwEbQftyznjY5hcBd8GoNkeKMav"
              alt="Engineer at substation"
              width={322}
              height={250}
              className="object-cover rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8 text-center">Our Core Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Technical Excellence</h3>
            <p className="text-gray-700 dark:text-gray-300">
              We maintain the highest standards of engineering precision and innovation in every project we undertake.
            </p>
          </div>
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Sustainable Innovation</h3>
            <p className="text-gray-700 dark:text-gray-300">
              We pioneer distribution solutions that balance reliability, efficiency, and environmental responsibility.
            </p>
          </div>
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Client Partnership</h3>
            <p className="text-gray-700 dark:text-gray-300">
              We build lasting relationships through transparent communication and exceeding expectations on every project.
            </p>
          </div>
        </div>
      </div>

      {/* Expertise Showcase */}
      <div className="bg-gray-50 dark:bg-gray-800 p-10 rounded-xl mb-20">
        <h2 className="text-3xl font-semibold mb-8 text-center">Our Distribution Expertise</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex gap-6">
            <div className="shrink-0">
              <div className="w-14 h-14 bg-[#f6733c]/20 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-[#f6733c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Distribution Systems and Modernization</h3>
              <p className="text-gray-700 dark:text-gray-300">
              Design and optimization of electrical distribution networks for urban and rural areas.
              </p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="shrink-0">
              <div className="w-14 h-14 bg-[#f6733c]/20 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-[#f6733c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Urban Infrastructure Design</h3>
              <p className="text-gray-700 dark:text-gray-300">
              Design and implementation of smart city solutions, including street lighting, traffic control, and public safety systems.

</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="shrink-0">
              <div className="w-14 h-14 bg-[#f6733c]/20 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-[#f6733c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Power Systems Expertise</h3>
              <p className="text-gray-700 dark:text-gray-300">
              Design and implementation of power systems for a wide range of applications, from small residential systems to large industrial complexes.
              </p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="shrink-0">
              <div className="w-14 h-14 bg-[#f6733c]/20 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-[#f6733c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Safety, Standards & Compliance</h3>
              <p className="text-gray-700 dark:text-gray-300">
              Implementation of safety protocols and compliance standards for all projects.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      {/* TODO: Add team section */}
      {/* <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8 text-center">Our Leadership Team</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
            <div className="relative h-[300px]">
              <Image
                src="https://placehold.co/435x300.png"
                alt="Dan Busilian - Principal Engineer"
                width={435}
                height={300}
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-1">Dan Busilian, P.Eng</h3>
              <p className="text-[#f6733c] mb-3">Principal Engineer, Distribution Systems</p>
              <p className="text-gray-700 dark:text-gray-300">
                15+ years specializing in substation design and protection systems for major utilities across Western Canada.
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
            <div className="relative h-[300px]">
              <Image
                src="https://placehold.co/435x300.png"
                alt="Michael Chen - Technical Director"
                width={435}
                height={300}
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-1">Michael Chen, P.Eng</h3>
              <p className="text-[#f6733c] mb-3">Technical Director, Smart Grid Solutions</p>
              <p className="text-gray-700 dark:text-gray-300">
                Former utility engineer who pioneered several smart grid implementations across Alberta's distribution network.
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
            <div className="relative h-[300px]">
              <Image
                src="https://placehold.co/435x300.png"
                alt="David Rodriguez - Innovation Lead"
                width={435}
                height={300}
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-1">David Rodriguez, P.Eng</h3>
              <p className="text-[#f6733c] mb-3">Innovation Lead, Renewable Integration</p>
              <p className="text-gray-700 dark:text-gray-300">
                Specializes in designing distribution systems that efficiently integrate renewable energy sources.
              </p>
            </div>
          </div>
        </div>
      </div> */}

      {/* CTA Section */}
      <div className="bg-blue-50 dark:bg-blue-900 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to transform your distribution infrastructure?</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Our team of specialized electrical engineers is ready to help you design, upgrade, or optimize your distribution systems.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <Button size="lg" className="bg-[#f6733c] hover:bg-[#e45f2d]">
              Schedule a Consultation
            </Button>
          </Link>
          <Link href="/projects">
            <Button size="lg" variant="outline" className="border-[#f6733c] text-[#f6733c] hover:bg-[#f6733c] hover:text-white">
              View Our Distribution Projects
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
