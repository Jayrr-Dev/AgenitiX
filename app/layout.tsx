import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col items-center">

              {/* Navbar */}
              <Navbar />


              {/* Main Content */}
              <div className="w-full">
                {children}
              </div>

              {/* Footer */}
              <footer className="w-full border-t bg-gray-50 dark:bg-gray-900">
  <div className="container mx-auto px-6 py-12">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">About Us</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Utilitek Solutions provides innovative engineering solutions for utility and infrastructure projects across Canada.
        </p>
        <div className="pt-2">
          <img src="/api/placeholder/120/40" alt="Utilitek Logo" className="h-10" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Quick Links</h3>
        <ul className="space-y-2 text-sm">
          <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-[#f6733c] transition-colors duration-200">About Us</Link></li>
          <li><Link href="/expertise" className="text-gray-600 dark:text-gray-400 hover:text-[#f6733c] transition-colors duration-200">Expertise</Link></li>
          <li><Link href="/projects" className="text-gray-600 dark:text-gray-400 hover:text-[#f6733c] transition-colors duration-200">Projects</Link></li>
          <li><Link href="/careers" className="text-gray-600 dark:text-gray-400 hover:text-[#f6733c] transition-colors duration-200">Careers</Link></li>
          <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-[#f6733c] transition-colors duration-200">Contact Us</Link></li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Contact</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-[#f6733c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            123 Engineering Drive, Edmonton, AB T5J 2R4
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-[#f6733c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            (780) 555-0123
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-[#f6733c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            info@utilitek.ca
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-[#f6733c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Mon-Fri: 8:00 AM - 5:00 PM MST
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Connect</h3>
        <div className="flex space-x-4 items-center mb-4">
          <a href="#" className="text-gray-600 hover:text-[#f6733c] transition-colors duration-200">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/></svg>
          </a>
          <a href="#" className="text-gray-600 hover:text-[#f6733c] transition-colors duration-200">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" className="text-gray-600 hover:text-[#f6733c] transition-colors duration-200">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
        </div>
        <div>
          <ThemeSwitcher />
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Newsletter</h4>
          <div className="flex">
            <input 
              type="email" 
              placeholder="Your email" 
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-[#f6733c] w-full"
            />
            <button className="bg-[#f6733c] hover:bg-[#e45f2d] text-white px-4 py-2 rounded-r-md transition-colors duration-200">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
      <p>© 2024 Utilitek Solutions. All rights reserved.</p>
      <div className="flex space-x-6 mt-4 md:mt-0">
        <Link href="/privacy" className="hover:text-[#f6733c] transition-colors duration-200">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-[#f6733c] transition-colors duration-200">Terms of Service</Link>
        <Link href="/sitemap" className="hover:text-[#f6733c] transition-colors duration-200">Sitemap</Link>
      </div>
    </div>
  </div>
</footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
