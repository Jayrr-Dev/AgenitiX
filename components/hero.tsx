import NextLogo from "./next-logo";
import SupabaseLogo from "./supabase-logo";
import { HeroCarousel } from "./hero-carousel";
import Image from "next/image";
export default function Header() {
  return (
    <>
      
      <HeroCarousel />
      <div className="flex flex-col gap-16 items-center">
      <div className="flex gap-8 justify-center items-center">
        <a
          href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
          target="_blank"
          rel="noreferrer"
        >
          <Image src="/apega-logo.svg.png" alt="apega-logo" width={80} height={80} />
        </a>
        <span className="border-l rotate-45 h-6" />
        <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
          <Image src="/epcor-logo.png" alt="epcor-logo" width={150} height={150} />
        </a>
      </div>
      <h1 className="sr-only">Supabase and Next.js Starter Template</h1>
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        The fastest way to build apps with{" "}
        <a
          href="https://apega.ca"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          <Image src="/apega-logo.svg.png" alt="apega-logo" width={100} height={100} />
        </a>{" "}
        and{" "}
        <a
          href="https://epcor.com/"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
                   <Image src="/epcor-logo.png" alt="epcor-logo" width={200} height={200} />

        </a>
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
    </>
  );
}
