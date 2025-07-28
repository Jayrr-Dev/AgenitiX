"use client";
// import LoadingCarousel from "./loading-carousel";
// const VideoCarousel = dynamic(() => import("./video-carousel").then(mod => mod.videoCarousel), { ssr: false, loading: () => <LoadingCarousel/> });
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FlipWords } from "@/components/ui/flip-words";
import { imagesMarquee } from "@/features/marketing/home-page/data";
import type { typeMarqueeImages, typeSlides } from "@/features/marketing/home-page/types";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

interface ImageItem {
	key: string;
	url: string;
}

export function HeroCarousel() {
	const [scrollY, setScrollY] = useState(0);
	const [activeIndex, setActiveIndex] = useState(0);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
	const { theme } = useTheme();
	const _isDark = theme === "dark";
	const images: ImageItem[] = imagesMarquee.map((image: typeMarqueeImages) => ({
		key: image.key,
		url: image.url,
	}));
	const words = ["better", "cute", "beautiful", "modern"];

	// Slide content with unique messages and CTAs
	const slides: typeSlides[] = [
		{
			type: "component",
			src: "",
			component: (
				<ThreeDMarquee
					images={images.map((img) => img.url)}
					className="bg-linear-to-r from-red-500 to-blue-500 blur-xs brightness-[0.5]"
				/>
			),
			heading: "Visual Flow Automation Platform",
			title: (
				<div className="flex flex-row gap-2 uppercase">
					<span className="text-white/95">
						<span className="text-white/95">Automation made </span>
						<FlipWords words={words} />
					</span>
				</div>
			),
			message:
				"Create powerful automation workflows with our intuitive visual editor. Connect your email accounts, build AI-powered workflows, and streamline your business processes.",
			ctaText: "Start Building",
			ctaLink: "/sign-up",
		},
	];

	// Track embla carousel's active index
	useEffect(() => {
		if (!emblaApi) {
			return;
		}

		const onSelect = () => {
			setActiveIndex(emblaApi.selectedScrollSnap());
		};

		emblaApi.on("select", onSelect);
		// Initial call to set the active index on mount
		onSelect();

		return () => {
			emblaApi.off("select", onSelect);
		};
	}, [emblaApi]);

	// Auto-scroll carousel
	useEffect(() => {
		if (!emblaApi) {
			return;
		}

		const interval = setInterval(() => {
			emblaApi.scrollNext();
		}, 20000); // Change slide every x seconds

		return () => clearInterval(interval);
	}, [emblaApi]);

	// Update scrollY value on scroll for parallax effect with throttling
	useEffect(() => {
		let ticking = false;

		const handleScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					setScrollY(window.scrollY);
					ticking = false;
				});
				ticking = true;
			}
		};

		// Add passive listener for better performance
		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	// ANIMATION VARIANTS
	// Animation variants for the message card with slide-in effect from left
	const cardVariants = {
		hidden: { opacity: 0, x: -1000 },
		visible: {
			opacity: 1,
			x: 0,
			transition: { duration: 1, ease: "easeOut" },
		},
		exit: {
			opacity: 0,
			x: 100,
			transition: { duration: 0.5, ease: "easeIn" },
		},
	};

	// Animation variants for the button
	const buttonVariants = {
		hidden: { opacity: 0, scale: 0.9 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: { delay: 0.3, duration: 0.5, ease: "easeOut" },
		},
		exit: {
			opacity: 0,
			scale: 0.9,
			transition: { duration: 0.2, ease: "easeIn" },
		},
	};

	return (
		<div className="xdebug-blue relative w-full overflow-hidden">
			<div ref={emblaRef} className=" relative z-10 w-full overflow-hidden">
				{/* Navigation buttons */}

				<div className="xdebug-green flex lg:mx-20">
					{slides.map((slide, index) => (
						<div
							key={index}
							className="relative min-w-0 flex-[0_0_100%]"
							style={{ overflow: "hidden" }}
						>
							<Card className="rounded-none">
								<CardContent className="m-0 flex items-center justify-center overflow-hidden p-0 ">
									{slide.type === "video" ? (
										// VIDEO CAROUSEL
										<video
											ref={videoRef}
											src={slide.src}
											autoPlay={true}
											muted={true}
											playsInline={true}
											loop={true}
											className="w-full object-cover brightness-[0.7]"
											style={{ height: "calc(100vh - 96px)" }}
										/>
									) : slide.type === "image" ? (
										// IMAGE CAROUSEL
										<img
											src={slide.src}
											alt={`hero-carousel-${index + 1}`}
											loading="lazy"
											className="h-full w-full object-cover transition-transform duration-300"
											style={{
												height: "calc(100vh - 96px)",
												transform: `translateY(${scrollY * 0.1}px)`,
											}}
										/>
									) : slide.type === "component" ? (
										// COMPONENT CAROUSEL
										<div className="h-full w-full">{slide.component}</div>
									) : null}

									{/* Animated Message Card with CTA */}
									<AnimatePresence mode="wait">
										{activeIndex === index && (
											<div className="xdebug-green absolute inset-0 flex items-center">
												<motion.div
													initial="hidden"
													animate="visible"
													exit="exit"
													variants={cardVariants}
													key={`card-${index}`}
													className="w-full max-w-7xl "
												>
													<motion.div variants={buttonVariants}>
														{/* Message Card */}
														<Card className="xdebug-red mb-52 border-none bg-transparent md:pl-16 lg:pl-32">
															<CardContent className="flex w-3/5 flex-col gap-8">
																{/* Subheading */}
																<h2 className="font-extralight text-white/95 text-xl drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] ">
																	{slide.heading.toUpperCase()}
																</h2>
																{/* Heading */}
																<h2 className="font-bold font-sans text-4xl text-white/95 drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] lg:text-5xl ">
																	{slide.title}
																</h2>
																{/* Message */}
																<p className="hidden font-brand font-extralight text-lg text-white/95 drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] lg:block ">
																	{slide.message}
																</p>
																<div className="flex w-full flex-col gap-4 sm:flex-row">
																	<Button
																		size="lg"
																		className="group/cta flex-1 border-2 border-transparent bg-white font-semibold text-gray-900 hover:bg-gray-100"
																		onClick={() => (window.location.href = slide.ctaLink)}
																	>
																		<div className="flex flex-row items-center gap-2">
																			{slide.ctaText}
																			<svg
																				className="opacity-0 transition-opacity duration-300 group-hover/cta:block group-hover/cta:opacity-100"
																				xmlns="http://www.w3.org/2000/svg"
																				width="24"
																				height="24"
																				viewBox="0 0 24 24"
																			>
																				<path
																					fill="currentColor"
																					d="M5.536 21.886a1 1 0 0 0 1.033-.064l13-9a1 1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886"
																				/>
																			</svg>
																		</div>
																	</Button>
																	<Button
																		size="lg"
																		variant="outline"
																		className="flex-1 border-2 border-white/30 bg-white/10 font-semibold text-white backdrop-blur-sm hover:bg-white/20"
																		onClick={() => (window.location.href = "/sign-in")}
																	>
																		Sign In
																	</Button>
																</div>
															</CardContent>
														</Card>
													</motion.div>
												</motion.div>
											</div>
										)}
									</AnimatePresence>
								</CardContent>
							</Card>
						</div>
					))}
				</div>

				<button
					className="-translate-y-1/2 absolute top-1/2 left-0 z-10 h-full w-1/5 rounded-none bg-linear-to-l from-transparent to-black/50 opacity-0 transition-opacity duration-500 hover:opacity-100"
					onClick={() => emblaApi?.scrollPrev()}
				/>
				<button
					className="-translate-y-1/2 absolute top-1/2 right-0 z-10 h-full w-1/5 rounded-none bg-linear-to-r from-transparent to-black/50 opacity-0 transition-opacity duration-500 hover:opacity-100"
					onClick={() => emblaApi?.scrollNext()}
				/>

				{/* Carousel Dots */}
				<div className="absolute right-0 bottom-4 left-0 z-50 flex justify-center gap-2">
					{slides.map((_, index) => (
						<button
							key={`dot-${index}`}
							className={`h-3 w-3 rounded-full transition-all ${
								activeIndex === index ? "scale-100 bg-primary" : "scale-90 bg-primary/30"
							}`}
							onClick={() => emblaApi?.scrollTo(index)}
						/>
					))}
				</div>
				{/* Decorative Shape Divider */}
				<div className="custom-shape-divider-bottom-1741703122 absolute right-0 bottom-0 left-0 z-20">
					<svg
						data-name="Layer 1"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 1200 120"
						preserveAspectRatio="none"
						fill="background"
					>
						<path d="M598.97 114.72L0 0 0 120 1200 120 1200 0 598.97 114.72z" />
					</svg>
				</div>

				<div className="custom-shape-divider-top-1745800192 absolute right-0 bottom-0 left-0 z-20" />
			</div>
		</div>
	);
}
