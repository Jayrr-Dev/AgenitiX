"use client";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = "force-dynamic";

import { useAuthContext } from "@/components/auth/AuthProvider";
import FAQ from "@/features/marketing/home-page/components/FAQ";
import FeatureBoxesBento from "@/features/marketing/home-page/components/FeatureBoxesBento";
import FeatureBoxesIconed from "@/features/marketing/home-page/components/FeatureBoxesIconed";
import { TabletScroller } from "@/features/marketing/home-page/components/TabletScroller";
import FeatureBoxesPlain from "@/features/marketing/home-page/components/featureBoxesPlain";
import Hero from "@/features/marketing/home-page/components/heroSection";
import { Revealer } from "@/features/marketing/home-page/components/hoverRevealer";
import { InfiniteLogoTicker } from "@/features/marketing/home-page/components/logoTicker";
import { AnimatedTestimonialsDemo } from "@/features/marketing/home-page/components/testimonialsSlides";
import { Testimonials } from "@/features/marketing/home-page/components/testimonialsTicker";
import {
	faq,
	featureBoxesBento,
	featureBoxesIconed,
	featureBoxesPlain,
} from "@/features/marketing/home-page/data";
import { useAnubisProtection } from "@/hooks/useAnubisProtection";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
	const { isAuthenticated, isLoading } = useAuthContext();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	// ENABLE ANUBIS PROTECTION FOR HOME PAGE
	useAnubisProtection({
		autoProtect: true,
		description: "Home page protection against bots and scrapers",
	});

	// Ensure component is mounted to avoid hydration issues
	useEffect(() => {
		setMounted(true);
	}, []);

	// Redirect authenticated users to dashboard
	useEffect(() => {
		if (mounted && !isLoading && isAuthenticated) {
			router.push("/dashboard");
		}
	}, [mounted, isAuthenticated, isLoading, router]);

	// Show loading while checking auth or not mounted yet
	if (!mounted || isLoading) {
		return (
			<main className="grid grid-cols-12">
				<div className="col-span-12 flex min-h-screen items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
						<p className="text-gray-600">Loading...</p>
					</div>
				</div>
			</main>
		);
	}

	// Don't render marketing page if authenticated (will redirect)
	if (isAuthenticated) {
		return (
			<main className="grid grid-cols-12">
				<div className="col-span-12 flex min-h-screen items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
						<p className="text-gray-600">Redirecting...</p>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="grid grid-cols-12">
			{/* Hero */}
			<div id="hero" className="col-span-12 h-full w-full">
				<Hero />
			</div>

			{/* Trust Us */}
			<div id="trust-us" className="col-span-8 col-start-3 h-full w-full pt-20 pb-40">
				<InfiniteLogoTicker />
			</div>
			<div className="col-span-12 flex h-full w-full flex-col pb-40">
				<TabletScroller />
			</div>

			{/* Container Scroll */}
			<div id="container-scroll" className="col-span-8 col-start-3 h-full w-full ">
				{/* Features Bento */}
				<div id="features-bento" className=" col-span-8 col-start-3 ">
					<FeatureBoxesBento features={featureBoxesBento} />
				</div>

				{/* Infinite Moving Cards */}
				<div id="infinite-moving-cards" className="col-span-8 col-start-3 h-full w-full ">
					<Testimonials />
				</div>
			</div>

			{/* Apple Carousel */}
			{/* <div id="apple-carousel" className="w-full h-full col-span-8 col-start-3 ">
        <Card className="w-full h-full ">
          <CardContent className="w-full h-full border border-transparent bg-fill-border hover:animate-fill-transparency rounded-sm">
            <AppleCardsCarouselDemo />
          </CardContent>

        </Card>
      </div> */}

			{/* Laser Path Delay */}
			{/* <div id="laser-path-delay" className="w-full h-full col-span-8 col-start-3 ">
        <LaserPathDelay />
      </div> */}
			{/* <Main /> */}
			{/* <BrandWordmark/> */}
			{/* Features Section */}
			<div id="features-section" className="col-span-8 col-start-3 h-full w-full ">
				<FeatureBoxesPlain features={featureBoxesPlain} />
			</div>

			{/* Animated Testimonials */}
			<div id="animated-testimonials" className="col-span-8 col-start-3 h-full w-full ">
				<AnimatedTestimonialsDemo />
			</div>

			{/* Features Section 2 */}
			<div id="features-section-2" className="col-span-8 col-start-3 h-full w-full ">
				<FeatureBoxesIconed features={featureBoxesIconed} />
			</div>

			{/* Canvas Reveal Effect */}
			<div id="canvas-reveal-effect" className="col-span-8 col-start-3 h-full w-full ">
				<Revealer />
			</div>

			{/* FAQ */}
			<div id="faq" className="col-span-8 col-start-3 h-full w-full ">
				<FAQ faq={faq} />
			</div>
			{/* Footer */}
		</main>
	);
}
