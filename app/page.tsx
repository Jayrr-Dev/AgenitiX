import Hero from "@/features/marketing/components/hero";
import Main from "@/features/marketing/components/main";
import { BrandWordmark } from "@/branding/brand-wordmark";
import { AppleCardsCarouselDemo } from "@/features/marketing/components/apple-carousel";
import { Card, CardContent } from "@/components/ui/card";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { testimonials } from "@/features/marketing/data/data";
import { GoogleGeminiEffectDemo } from "@/features/marketing/components/google-effect";
import FeaturesSectionDemo from "@/components/features-section-demo-1";
import FeaturesSectionDemo2 from "@/components/features-section-demo-2";
import FeaturesSectionDemo3 from "@/components/features-section-demo-3";
import { TrustUs } from "@/features/marketing/components/trust-us";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AnimatedTestimonialsDemo } from "@/features/marketing/components/AnimatedTestimonials";
import { CanvasRevealEffectDemo } from "@/features/marketing/components/CanvasRevealEffect";
import FAQ07 from "@/components/faq-07";
export default async function Home() {
  await import("@/features/marketing/components/google-effect");
  await import("@/components/features-section-demo-1");
  await import("@/components/features-section-demo-2");
  await import("@/components/features-section-demo-3");
  await import("@/components/ui/infinite-moving-cards");
  await import("@/components/ui/card");
  return (
    <main className="grid grid-cols-12">
      {/* Hero */}
      <div id="hero" className="w-full h-full col-span-12">
        <Hero />
      </div>

      {/* Trust Us */}
      <div id="trust-us" className="w-full h-full col-span-8 col-start-3">
        <TrustUs />
      </div>

      {/* Container Scroll */}
      <div id="container-scroll" className="w-full h-full col-span-8 col-start-3 ">
      <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
            Impactful and Modern <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
               Digital Solutions
              </span>
            </h1> 
          </>
        }
      >
        <img
          src={`/n8n-fullpage.png`}
          alt="hero"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>      
      </div>
      </div>
      {/* Canvas Reveal Effect */}
      <div id="canvas-reveal-effect" className="w-full h-full col-span-8 col-start-3 ">
        <CanvasRevealEffectDemo />
      </div>
      {/* Apple Carousel */}
      {/* <div id="apple-carousel" className="w-full h-full col-span-8 col-start-3 ">
        <Card className="w-full h-full ">
          <CardContent className="w-full h-full border border-transparent bg-fill-border hover:animate-fill-transparency rounded-sm">
            <AppleCardsCarouselDemo />
          </CardContent>
          
        </Card>
      </div> */}
      {/* Infinite Moving Cards */}
      <div id="infinite-moving-cards" className="w-full h-full col-span-8 col-start-3 ">
        <InfiniteMovingCards items={testimonials} direction="right" speed="slow" />
      </div>
      {/* Google Gemini Effect */}
      <div id="google-gemini-effect" className="w-full h-full col-span-8 col-start-3 ">
        <GoogleGeminiEffectDemo />
      </div>
      {/* <Main /> */}
      {/* <BrandWordmark/> */}
      {/* Features Section */}
      <div id="features-section" className="w-full h-full col-span-8 col-start-3 ">
        <FeaturesSectionDemo />
      </div>

      {/* Animated Testimonials */}
      <div id="animated-testimonials" className="w-full h-full col-span-8 col-start-3 ">
        <AnimatedTestimonialsDemo />
      </div>

      {/* Features Section 2 */}
      <div id="features-section-2" className="w-full h-full col-span-8 col-start-3 ">
        <FeaturesSectionDemo2 />
      </div>
      {/* Features Section 3 */}
      <div id="features-section-3" className="w-full h-full col-span-8 col-start-3 ">
        <FeaturesSectionDemo3 />
      </div>
      {/* FAQ */}
      <div id="faq" className="w-full h-full col-span-8 col-start-3 ">
        <FAQ07 />
      </div>
      {/* Footer */}
    </main>
  );
}
