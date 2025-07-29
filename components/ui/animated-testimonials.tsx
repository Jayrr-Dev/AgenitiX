"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Testimonial = {
	quote: string;
	name: string;
	designation: string;
	src: string;
};

export const AnimatedTestimonials = ({
	testimonials,
	autoplay = false,
}: {
	testimonials: Testimonial[];
	autoplay?: boolean;
}) => {
	const [active, setActive] = useState(0);

	// 👇 Memoized deterministic rotations per testimonial
	const rotationMap = useMemo(() => {
		return testimonials.map((_, i) => {
			const seed = testimonials[i].src.length; // or use index or hash
			return ((seed * 13) % 21) - 10;
		});
	}, [testimonials]);

	const handleNext = useCallback(() => {
		setActive((prev) => (prev + 1) % testimonials.length);
	}, [testimonials.length]);

	const handlePrev = () => {
		setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
	};

	useEffect(() => {
		if (autoplay) {
			const interval = setInterval(handleNext, 5000);
			return () => clearInterval(interval);
		}
	}, [autoplay, handleNext]);

	return (
		<div className="mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
			<div className="relative grid grid-cols-1 gap-20 md:grid-cols-2">
				<div>
					<div className="relative h-80 w-full">
						<AnimatePresence>
							{testimonials.map((testimonial, index) => {
								const rotateY = rotationMap[index];

								return (
									<motion.div
										key={testimonial.src}
										initial={{
											opacity: 0,
											scale: 0.9,
											z: -100,
											rotate: rotateY,
										}}
										animate={{
											opacity: index === active ? 1 : 0.7,
											scale: index === active ? 1 : 0.95,
											z: index === active ? 0 : -100,
											rotate: index === active ? 0 : rotateY,
											zIndex: index === active ? 40 : testimonials.length + 2 - index,
											y: index === active ? [0, -80, 0] : 0,
										}}
										exit={{
											opacity: 0,
											scale: 0.9,
											z: 100,
											rotate: rotateY,
										}}
										transition={{
											duration: 0.4,
											ease: "easeInOut",
										}}
										className="absolute inset-0 origin-bottom"
									>
										<img
											src={testimonial.src}
											alt={testimonial.name}
											width={500}
											height={500}
											draggable={false}
											className="h-full w-full rounded-3xl object-cover object-center"
										/>
									</motion.div>
								);
							})}
						</AnimatePresence>
					</div>
				</div>

				<div className="flex flex-col justify-between py-4">
					<motion.div
						key={active}
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -20, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
					>
						<h3 className="font-bold text-2xl text-black dark:text-white">
							{testimonials[active].name}
						</h3>
						<p className="text-gray-500 text-sm dark:text-neutral-500">
							{testimonials[active].designation}
						</p>
						<motion.p className="mt-8 text-gray-500 text-lg dark:text-neutral-300">
							{testimonials[active].quote.split(" ").map((word, index) => (
								<motion.span
									key={`${word}-${index}-${active}`}
									initial={{ filter: "blur(10px)", opacity: 0, y: 5 }}
									animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
									transition={{
										duration: 0.2,
										ease: "easeInOut",
										delay: 0.02 * index,
									}}
									className="inline-block"
								>
									{word}&nbsp;
								</motion.span>
							))}
						</motion.p>
					</motion.div>

					<div className="flex gap-4 pt-12 md:pt-0">
						<button
							type="button"
							onClick={handlePrev}
							className="group/button flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
						>
							<IconArrowLeft className="h-5 w-5 text-black transition-transform duration-300 group-hover/button:rotate-12 dark:text-neutral-400" />
						</button>
						<button
							type="button"
							onClick={handleNext}
							className="group/button flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
						>
							<IconArrowRight className="group-hover/button:-rotate-12 h-5 w-5 text-black transition-transform duration-300 dark:text-neutral-400" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
