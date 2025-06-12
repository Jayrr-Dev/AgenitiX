"use client";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

import FAQ from "@/features/home-page/components/FAQ";
import FeatureBoxesBento from "@/features/home-page/components/FeatureBoxesBento";
import FeatureBoxesIconed from "@/features/home-page/components/FeatureBoxesIconed";
import FeaturesBoxesPlain from "@/features/home-page/components/FeatureBoxesPlain";
import Hero from "@/features/home-page/components/HeroSection";
import { Revealer } from "@/features/home-page/components/HoverRevealer";
import { InfiniteLogoTicker } from "@/features/home-page/components/LogoTicker";
import { TabletScroller } from "@/features/home-page/components/TabletScroller";
import { AnimatedTestimonialsDemo } from "@/features/home-page/components/TestimonialsSlides";
import { Testimonials } from "@/features/home-page/components/TestimonialsTicker";
import {
  faq,
  featureBoxesBento,
  featureBoxesIconed,
  featureBoxesPlain,
} from "@/features/home-page/data";
import { useAnubisProtection } from "@/hooks/useAnubisProtection";

export default function Home() {
  // ENABLE ANUBIS PROTECTION FOR HOME PAGE
  useAnubisProtection({
    autoProtect: true,
    description: "Home page protection against bots and scrapers",
  });

  return (
    <main className="grid grid-cols-12">
      {/* Hero */}
      <div id="hero" className="w-full h-full col-span-12">
        <Hero />
      </div>

      {/* Trust Us */}
      <div
        id="trust-us"
        className="w-full h-full col-span-8 col-start-3 pt-20 pb-40"
      >
        <InfiniteLogoTicker />
      </div>
      <div className="flex flex-col w-full h-full col-span-12 pb-40">
        <TabletScroller />
      </div>

      {/* Container Scroll */}
      <div
        id="container-scroll"
        className="w-full h-full col-span-8 col-start-3 "
      >
        {/* Features Bento */}
        <div id="features-bento" className=" col-span-8 col-start-3 ">
          <FeatureBoxesBento features={featureBoxesBento} />
        </div>

        {/* Infinite Moving Cards */}
        <div
          id="infinite-moving-cards"
          className="w-full h-full col-span-8 col-start-3 "
        >
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
      <div
        id="features-section"
        className="w-full h-full col-span-8 col-start-3 "
      >
        <FeaturesBoxesPlain features={featureBoxesPlain} />
      </div>

      {/* Animated Testimonials */}
      <div
        id="animated-testimonials"
        className="w-full h-full col-span-8 col-start-3 "
      >
        <AnimatedTestimonialsDemo />
      </div>

      {/* Features Section 2 */}
      <div
        id="features-section-2"
        className="w-full h-full col-span-8 col-start-3 "
      >
        <FeatureBoxesIconed features={featureBoxesIconed} />
      </div>

      {/* Canvas Reveal Effect */}
      <div
        id="canvas-reveal-effect"
        className="w-full h-full col-span-8 col-start-3 "
      >
        <Revealer />
      </div>

      {/* FAQ */}
      <div id="faq" className="w-full h-full col-span-8 col-start-3 ">
        <FAQ faq={faq} />
      </div>
      {/* Footer */}
    </main>
  );
}
