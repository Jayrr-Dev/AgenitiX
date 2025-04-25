import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
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
          <Button
            size="lg"
            variant="outline"
            className="border-[#f6733c] text-[#f6733c] hover:bg-[#f6733c] hover:text-white"
          >
            View Our Projects
          </Button>
        </Link>
      </div>
    </div>
  );
}
