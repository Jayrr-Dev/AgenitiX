import Hero from "@/features/marketing/components/hero";
import Main from "@/features/marketing/components/main";
import { BrandWordmark } from "@/branding/brand-wordmark";
import { AppleCardsCarouselDemo } from "@/features/marketing/components/apple-carousel";
import { Card, CardContent } from "@/components/ui/card";
export default async function Home() {
  return (
    <main className="grid grid-cols-12">
      <div className="w-full h-full col-span-12">
        <Hero />
      </div>
      <div id="apple-carousel" className="w-full h-full col-span-8 col-start-3 ">
        <Card className="w-full h-full ">
          <CardContent className="w-full h-full border border-transparent bg-fill-border hover:animate-fill-transparency rounded-sm">
            <AppleCardsCarouselDemo />
          </CardContent>
          
        </Card>
      </div>
      {/* <Main /> */}
      {/* <BrandWordmark/> */}
    </main>
  );
}
