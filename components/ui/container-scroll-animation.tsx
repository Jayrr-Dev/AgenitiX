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
		<div className="relative flex items-center justify-center " ref={containerRef}>
			<div
				className="relative w-full"
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
	const [scope, _animate] = useAnimate();
	const [animation, setAnimation] = useState<Animation | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Convert speed to duration
	const getDuration = () => {
		return speed === "fast" ? 20000 : speed === "normal" ? 40000 : 80000;
	};

	// Start animation once in view
	useEffect(() => {
		if (!isInView || animation) {
			return;
		}

		const element = wrapperRef.current;
		if (!element) return;

		// Create keyframe animation
		const keyframes = [
			{ transform: "translateY(0%)" },
			{ transform: "translateY(-50%)" },
		];

		const options = {
			duration: getDuration(),
			iterations: Number.POSITIVE_INFINITY,
			easing: "linear",
		};

		animation = element.animate(keyframes, options);

		return () => {
			if (animation) {
				animation.cancel();
			}
		};
	}, [isInView, getDuration]);

	// Pause/resume on hover
	useEffect(() => {
		const node = wrapperRef.current;
		if (!(node && pauseOnHover && animation)) {
			return;
		}

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
		<motion.div style={{ translateY: translate }} className="mx-auto max-w-5xl text-center">
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
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="relative"
		>
			{children}
		</motion.div>
	);
};
