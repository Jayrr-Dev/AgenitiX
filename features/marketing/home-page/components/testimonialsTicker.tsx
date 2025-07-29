import { testimonials } from "@/features/marketing/home-page/data";

export const Testimonials = () => {
	return (
		<div className="w-full">
			{testimonials.map((testimonial, index) => (
				<div key={index} className="testimonial">
					{testimonial.review}
				</div>
			))}
		</div>
	);
};