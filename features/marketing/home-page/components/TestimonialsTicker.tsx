import { testimonials } from "@/features/marketing/home-page/data";
import dynamic from "next/dynamic";
import { Loading } from "@/components/Loading";
const InfiniteMovingCards = dynamic(
	() => import("@/components/ui/infinite-moving-cards").then((mod) => mod.InfiniteMovingCards),
	{
		loading: () => <Loading showText={false} size="w-6 h-6" className="p-4" />,
	}
);

export const Testimonials = () => {
	return (
		<div className="h-full w-full">
			<div className="px-8">
				<h4 className="mx-auto max-w-5xl text-center font-medium text-3xl text-black tracking-tight lg:text-5xl lg:leading-tight dark:text-white">
					What Our Clients Are Saying
				</h4>

				<p className="mx-auto my-4 max-w-2xl text-center font-normal text-neutral-500 text-sm lg:text-base dark:text-neutral-300">
					Join the community of forward-thinking businesses and creators who rely on our AI
					solutions to transform their workflows and unlock new possibilities.
				</p>
			</div>
			<InfiniteMovingCards items={testimonials} direction="right" speed="slow" />
		</div>
	);
};
