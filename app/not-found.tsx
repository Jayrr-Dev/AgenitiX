/**
 * Route: app/not-found.tsx
 * NOT FOUND PAGE - 404 error page for Next.js 15
 *
 * • Handles 404 errors when pages are not found
 * • Provides user-friendly error message and navigation
 * • Maintains consistent styling with the rest of the app
 *
 * Keywords: 404-error, not-found, error-handling, nextjs-15
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-2 px-4 text-center">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
          404
        </h1>
        <h2 className="text-lg font-medium leading-tight tracking-tighter md:text-2xl">
          Page Not Found
        </h2>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/explore">Explore</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 