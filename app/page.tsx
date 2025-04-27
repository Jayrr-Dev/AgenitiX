import Hero from "@/features/marketing/components/hero";
import Main from "@/features/marketing/components/main";
import { BrandWordmark } from "@/branding/brand-wordmark";
export default async function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen">
      {/* <Hero /> */}
      {/* <Main /> */}
      <BrandWordmark/>
    </main>
  );
}
