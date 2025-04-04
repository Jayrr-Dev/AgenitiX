
import { HeroCarousel } from "./hero-carousel";
import Image from "next/image";

export default function Header() {
  return (
    <>
      <HeroCarousel />
      <div className="flex flex-col gap-2 items-center">
      <div className="flex gap-8 justify-center items-center h-24">
        <a
          href="https://apega.ca"
          target="_blank"
          rel="noreferrer"
        >
          <Image src="/apega-logo.png" alt="apega-logo" width={80} height={80} />
        </a>
        <span className="border-l rotate-45 h-6" />
        <a href="https://epcor.com/" target="_blank" rel="noreferrer">
          <Image src="/epcor-logo.png" alt="epcor-logo" width={150} height={150} />
        </a>
        <span className="border-l rotate-45 h-6" />
        {/* <a href="https://fortisbc.com/" target="_blank" rel="noreferrer">
          <FortisLogo width={150} height={150} />
        </a> */}
      </div>
      <div className="text-center text-lg text-gray-800 dark:text-gray-200">Trusted by Utilities Across Canada</div>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
    </div>
    </>
  );
}
