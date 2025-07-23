"use client";

import { cn } from "@/lib/utils";
import {
	type MotionValue,
	motion,
	useAnimate,
	useInView,
	useScroll,
	useTransform,
} from "framer-motion";
import React, { useRef, useEffect, useState } from "react";

/* ================================
   Main Scroll Container Component
================================== */
export const ContainerScroll = ({
	titleComponent,
	children,
}: {
	titleComponent: string | React.ReactNode;
	children: React.ReactNode;
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
	});
	const [isMobile, setIsMobile] = React.useState(false);

	React.useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => {
			window.removeEventListener("resize", checkMobile);
		};
	}, []);

	const scaleDimensions = () => {
		return isMobile ? [0.7, 0.9] : [1.05, 1];
	};

	const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
	const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
	const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

	const sectionRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(sectionRef, { once: true, margin: "-20%" });

	return (
		<div className="flex items-center justify-center relative " ref={containerRef}>
			<div
				className="w-full relative"
				style={{
					perspective: "1000px",
				}}
			>
				<Header translate={translate} titleComponent={titleComponent} />
				<Card rotate={rotate} translate={translate} scale={scale}>
					<InfiniteScrollContent
						isInView={isInView}
						sectionRef={sectionRef as React.RefObject<HTMLDivElement>}
						speed="normal"
					>
						{children}
					</InfiniteScrollContent>
				</Card>
			</div>
		</div>
	);
};

/* ================================
   Infinite Scroll Duplicated Loop
================================== */
export const InfiniteScrollContent = ({
	isInView,
	sectionRef,
	children,
	speed = "fast",
	pauseOnHover = true,
	className = "",
}: {
	isInView: boolean;
	sectionRef: React.RefObject<HTMLDivElement>;
	children: React.ReactNode;
	speed?: "fast" | "normal" | "slow";
	pauseOnHover?: boolean;
	className?: string;
}) => {
	// ANIMATION STATE AND REFS
	const [scope, animate] = useAnimate();
	const [animation, setAnimation] = useState<Animation | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Convert speed to duration
	const getDuration = () => {
		return speed === "fast" ? 20000 : speed === "normal" ? 40000 : 80000;
	};

	// Start animation once in view
	useEffect(() => {
		if (!isInView || animation) return;

		const animateScroll = async () => {
			// Wait until children are rendered
			await new Promise((res) => setTimeout(res, 0));

			const scroller = scope.current?.querySelector(".scroller-inner") as HTMLElement;
			if (!scroller) return;

			// Duplicate content for infinite scroll
			scroller.innerHTML += scroller.innerHTML;

			// Manual animation using Web Animations API via useAnimate
			const anim = scroller.animate(
				[{ transform: "translateY(0%)" }, { transform: "translateY(-50%)" }],
				{
					duration: getDuration(),
					iterations: Number.POSITIVE_INFINITY,
					easing: "linear",
				}
			);

			setAnimation(anim);
		};

		animateScroll();
	}, [isInView, scope, animation]);

	// Pause/resume on hover
	useEffect(() => {
		const node = wrapperRef.current;
		if (!node || !pauseOnHover || !animation) return;

		const handleEnter = () => animation.pause();
		const handleLeave = () => animation.play();

		node.addEventListener("mouseenter", handleEnter);
		node.addEventListener("mouseleave", handleLeave);

		return () => {
			node.removeEventListener("mouseenter", handleEnter);
			node.removeEventListener("mouseleave", handleLeave);
		};
	}, [animation, pauseOnHover]);

	return (
		<div ref={sectionRef} className={cn("relative h-full overflow-hidden", className)}>
			<div ref={wrapperRef} className="absolute top-0 left-0 w-full">
				<div ref={scope}>
					<div className="scroller-inner flex flex-col">{children}</div>
				</div>
			</div>
		</div>
	);
};
/* ===========================
   Header Component
============================= */
export const Header = ({
	translate,
	titleComponent,
}: {
	translate: MotionValue<number>;
	titleComponent: string | React.ReactNode;
}) => {
	return (
		<motion.div style={{ translateY: translate }} className="max-w-5xl mx-auto text-center">
			{titleComponent}
		</motion.div>
	);
};

/* ===========================
   Card Wrapper Component
============================= */
export const Card = ({
	rotate,
	scale,
	translate,
	children,
}: {
	rotate: MotionValue<number>;
	scale: MotionValue<number>;
	translate: MotionValue<number>;
	children: React.ReactNode;
}) => {
	return (
		<motion.div
			style={{
				rotateX: rotate,
				scale,
				boxShadow:
					"0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
			}}
			className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full  border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl md:mt-0"
		>
			<div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:p-4">
				{children}
			</div>
		</motion.div>
	);
	return (
		<motion.div
			style={{
				rotateX: rotate,
				scale,
				boxShadow:
					"0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
			}}
			className="max-w-5xl -mt-12 mx-auto h-120 md:h-160 w-full  border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl md:mt-0"
		>
			<div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:p-4">
				{children}
			</div>
		</motion.div>
	);
};
