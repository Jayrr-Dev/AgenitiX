import { testimonialsSlides } from "@/features/marketing/home-page/data";
import dynamic from "next/dynamic";

const AnimatedTestimonials = dynamic(
	() => import("@/components/ui/animated-testimonials").then((mod) => mod.AnimatedTestimonials),
	{
		loading: () => <div>Loading...</div>,
	}
);

export function AnimatedTestimonialsDemo() {
	return <AnimatedTestimonials testimonials={testimonialsSlides} />;
}
