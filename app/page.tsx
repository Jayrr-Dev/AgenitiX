"use client";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = "force-dynamic";

import { useAuth } from "@/components/auth/AuthProvider";
import { Loading } from "@/components/Loading";
import FeatureBoxesPlain from "@/features/marketing/home-page/components/FeatureBoxesPlain";
import Hero from "@/features/marketing/home-page/components/HeroSection";
import { Revealer } from "@/features/marketing/home-page/components/HoverRevealer";
import { InfiniteLogoTicker } from "@/features/marketing/home-page/components/LogoTicker";
import { TabletScroller } from "@/features/marketing/home-page/components/TabletScroller";
import { AnimatedTestimonialsDemo } from "@/features/marketing/home-page/components/TestimonialsSlides";
import { Testimonials } from "@/features/marketing/home-page/components/TestimonialsTicker";
import FAQ from "@/features/marketing/home-page/components/faq";
import FeatureBoxesBento from "@/features/marketing/home-page/components/featureBoxesBento";
import FeatureBoxesIconed from "@/features/marketing/home-page/components/featureBoxesIconed";
import {
	faq,
	featureBoxesBento,
	featureBoxesIconed,
	featureBoxesPlain,
} from "@/features/marketing/home-page/data";
import { heroSlides, featureCards, featuresGridData } from "@/features/marketing/home-page/data/modern-ui-data";
import { ThreeDCardGrid } from "@/components/ui/3d-card-grid";
import { HeroSlider } from "@/components/ui/hero-slider";
import { FeaturesGrid } from "@/components/ui/features-grid";
import { SpotlightHover } from "@/components/ui/spotlight-hover";
import { useAnubisProtection } from "@/hooks/useAnubisProtection";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Footer from "@/components/nav-bar/main-footer";
import { useTheme } from "next-themes";

export default function Home() {
	  const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);
	const { theme } = useTheme();

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
					<Loading size="w-8 h-8" text="Loading..." />
				</div>
			</main>
		);
	}

	// Don't render marketing page if authenticated (will redirect)
	if (isAuthenticated) {
		return (
			<main className="grid grid-cols-12">
				<div className="col-span-12 flex min-h-screen items-center justify-center">
					<Loading size="w-8 h-8" text="Redirecting..." />
				</div>
			</main>
		);
	}

	return (
		<main className="grid grid-cols-12">
			{/* Hero */}
			<div id="hero" className="col-span-12 h-full w-full">
				<Hero />
				{/* Additional Hero Slider */}
				<div className="col-span-10 col-start-2 mt-8 mb-16">
					<HeroSlider slides={heroSlides} className="w-full" />
				</div>
			</div>

			{/* Trust Us */}
			<div id="trust-us" className="col-span-8 col-start-3 h-full w-full pt-20 pb-20">
				<InfiniteLogoTicker />
			</div>
			
			{/* 3D Feature Cards */}
			<div className="col-span-10 col-start-2 mb-20">
				<div className="text-center mb-10">
					<h2 className="text-3xl font-bold text-white mb-4">Powerful Features</h2>
					<p className="text-neutral-400 max-w-2xl mx-auto">Discover how our platform can transform your workflow with these powerful features</p>
				</div>
				<ThreeDCardGrid items={featureCards} />
			</div>
			
			<div className="col-span-12 flex h-full w-full flex-col pb-20">
				<TabletScroller />
			</div>

			{/* Modern Features Section */}
			<div className="col-span-10 col-start-2 mb-40">
				<SpotlightHover className="rounded-xl p-1">
					<div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-neutral-800">
						<div className="text-center mb-10">
							<h2 className="text-3xl font-bold text-white dark:text-white mb-4">Everything You Need</h2>
							<p className="text-white dark:text-neutral-400 max-w-2xl mx-auto">Our platform provides all the tools you need to automate your workflow</p>
						</div>
						<FeaturesGrid features={featuresGridData} spotlightColor="rgba(120, 119, 198, 0.15)" />
					</div>
				</SpotlightHover>
			</div>

			{/* Container Scroll */}
			<div id="container-scroll" className="col-span-8 col-start-3 h-full w-full ">
				{/* Features Bento */}
				<div id="features-bento" className="col-span-8 col-start-3">
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
				<div className="mb-12 text-center">
					<h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
						Powerful Features for Modern Developers
					</h2>
					<p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
						Discover the tools and capabilities that make AgenitiX the preferred choice for developers worldwide.
					</p>
				</div>
				<FeatureBoxesPlain features={featureBoxesPlain} />
			</div>

			{/* Animated Testimonials */}
			<div id="animated-testimonials" className="col-span-8 col-start-3 h-full w-full ">
				<div className="mb-12 text-center">
					<h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
						What Our Users Are Saying
					</h2>
					<p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
						Hear from developers who have transformed their workflow with our platform.
					</p>
				</div>
				<AnimatedTestimonialsDemo />
			</div>

			{/* Features Section 2 */}
			<div id="features-section-2" className="col-span-8 col-start-3 h-full w-full ">
				<div className="mb-12 text-center">
					<h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
						Integrated Development Experience
					</h2>
					<p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
						Seamlessly connect your workflow with our comprehensive suite of developer tools.
					</p>
				</div>
				<FeatureBoxesIconed features={featureBoxesIconed} />
			</div>

			{/* Canvas Reveal Effect */}
			<div id="canvas-reveal-effect" className="col-span-8 col-start-3 h-full w-full ">
				<div className="mb-12 text-center">
					<h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
						Explore the Possibilities
					</h2>
					<p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
						Interact with our dynamic visualization to see how AgenitiX can enhance your development process.
					</p>
				</div>
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
