import dynamic from "next/dynamic"; 
import { testimonials } from "@/features/marketing/data/data";
const InfiniteMovingCards = dynamic(() => import("@/components/ui/infinite-moving-cards").then(mod => mod.InfiniteMovingCards) , {
  loading: () => <div>Loading...</div>
});

export const Testimonials = () => {

  return (
    <div className="w-full h-full">
        <div className="px-8">
        <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black dark:text-white">
            What Our Clients Are Saying
        </h4>

        <p className="text-sm lg:text-base max-w-2xl my-4 mx-auto text-neutral-500 text-center font-normal dark:text-neutral-300">
          Join the community of forward-thinking businesses and creators who rely on our AI solutions to transform their workflows and unlock new possibilities.
        </p>
      </div>
      <InfiniteMovingCards items={testimonials} direction="right" speed="slow" />
    </div>
  );
};

