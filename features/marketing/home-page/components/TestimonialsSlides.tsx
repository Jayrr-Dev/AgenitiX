import { testimonialsSlides } from "@/features/marketing/home-page/data";
import dynamic from "next/dynamic";
import { Loading } from "@/components/Loading";

const AnimatedTestimonials = dynamic(
	() => import("@/components/ui/animated-testimonials").then((mod) => mod.AnimatedTestimonials),
	{
		loading: () => <Loading showText={false} size="w-6 h-6" className="p-4" />,
	}
);

export function AnimatedTestimonialsDemo() {
	return <AnimatedTestimonials testimonials={testimonialsSlides} />;
}
