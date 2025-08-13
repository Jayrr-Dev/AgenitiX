import { Loading } from "@/components/Loading";
import { testimonials } from "@/features/marketing/home-page/data";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
const InfiniteMovingCards = dynamic(
  () =>
    import("@/components/ui/infinite-moving-cards").then(
      (mod) => mod.InfiniteMovingCards
    ),
  {
    loading: () => <Loading showText={false} size="w-6 h-6" className="p-4" />,
  }
);

export const Testimonials = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { theme, setTheme } = useTheme();
  // Theme logging removed for production

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full w-full">
      <div className="px-8">
        <h4
          className={`${theme === "dark" ? "text-white mx-auto max-w-5xl text-center font-medium text-3xl tracking-tight lg:text-5xl lg:leading-tight dark:text-white" : "text-black mx-auto max-w-5xl text-center font-medium text-3xl tracking-tight lg:text-5xl lg:leading-tight dark:text-white"}`}
        >
          What Our Clients Are Saying
        </h4>

        <p
          className={`${theme === "dark" ? "text-white mx-auto my-4 max-w-2xl text-center font-normal text-neutral-500 text-sm lg:text-base dark:text-neutral-300" : "text-black mx-auto my-4 max-w-2xl text-center font-normal text-neutral-500 text-sm lg:text-base dark:text-neutral-300"}`}
        >
          Join the community of forward-thinking businesses and creators who
          rely on our AI solutions to transform their workflows and unlock new
          possibilities.
        </p>
      </div>
      <div
        className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <InfiniteMovingCards
          items={testimonials}
          direction="right"
          speed="slow"
          pauseOnHover={true}
        />
      </div>
    </div>
  );
};
