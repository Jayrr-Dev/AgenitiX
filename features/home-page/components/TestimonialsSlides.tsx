import dynamic from "next/dynamic";
import { testimonials } from "@/features/home-page/data";
  
const AnimatedTestimonials = dynamic(() => import("@/components/ui/animated-testimonials").then(mod => mod.AnimatedTestimonials) , {
  loading: () => <div>Loading...</div>
});

export function AnimatedTestimonialsDemo() {
  
  return <AnimatedTestimonials testimonials={testimonials} />;
}
