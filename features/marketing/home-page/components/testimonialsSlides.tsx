import { testimonialsSlides } from "@/features/marketing/home-page/data";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export const AnimatedTestimonialsDemo = () => {
	return (
		<div className="w-full">
			<AnimatedTestimonials testimonials={testimonialsSlides} />
		</div>
	);
};