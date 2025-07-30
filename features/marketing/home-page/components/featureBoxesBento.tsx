"use client";
import { cn } from "@/lib/utils";
import { IconBrandYoutubeFilled } from "@tabler/icons-react";
import createGlobe from "cobe";
import { motion } from "motion/react";
import Image from "next/image";
import type React from "react";
import { useEffect, useRef } from "react";
import type { typeFeatureBoxesBento } from "../types";

export default function FeatureBoxesBento({ features }: { features: typeFeatureBoxesBento[] }) {
	const getSkeleton = (type: typeFeatureBoxesBento["skeleton"]) => {
		switch (type) {
			case "SkeletonOne":
				return <SkeletonOne />;
			case "SkeletonTwo":
				return <SkeletonTwo />;
			case "SkeletonThree":
				return <SkeletonThree />;
			case "SkeletonFour":
				return <SkeletonFour />;
			default:
				return null;
		}
	};
	return (
		<div className="relative z-20 mx-auto max-w-7xl py-10 lg:py-40">
			<div className="px-8">
				<h4 className="mx-auto max-w-5xl text-center font-medium text-3xl text-black tracking-tight lg:text-5xl lg:leading-tight dark:text-white">
					Packed with thousands of features
				</h4>

				<p className="mx-auto my-4 max-w-2xl text-center font-normal text-neutral-500 text-sm lg:text-base dark:text-neutral-300">
					From Image generation to video generation, Everything AI has APIs for literally
					everything. It can even create this website copy for you.
				</p>
			</div>

			<div className="relative ">
				<div className="mt-12 grid grid-cols-1 rounded-md lg:grid-cols-6 xl:border dark:border-neutral-800">
					{features.map((feature) => (
						<FeatureCard key={feature.title} className={feature.className}>
							<FeatureTitle>{feature.title}</FeatureTitle>
							<FeatureDescription>{feature.description}</FeatureDescription>
							<div className="h-full w-full">{getSkeleton(feature.skeleton)}</div>
						</FeatureCard>
					))}
				</div>
			</div>
		</div>
	);
}

const FeatureCard = ({
	children,
	className,
}: {
	children?: React.ReactNode;
	className?: string;
}) => {
	return <div className={cn("relative overflow-hidden p-4 sm:p-8", className)}>{children}</div>;
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
	return (
		<p className=" mx-auto max-w-5xl text-left text-black text-xl tracking-tight md:text-2xl md:leading-snug dark:text-white">
			{children}
		</p>
	);
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
	return (
		<p
			className={cn(
				"mx-auto max-w-4xl text-left text-sm md:text-base",
				"text-center font-normal text-neutral-500 dark:text-neutral-300",
				"mx-0 my-2 max-w-sm text-left md:text-sm"
			)}
		>
			{children}
		</p>
	);
};

export const SkeletonOne = () => {
	return (
		<div className="relative flex h-full gap-10 px-2 py-8">
			<div className="group mx-auto h-full w-full bg-white p-5 shadow-2xl dark:bg-neutral-900">
				<div className="flex h-full w-full flex-1 flex-col space-y-2 ">
					{/* TODO */}
					<img
						src="/feat-hq.png"
						alt="High quality features demonstration"
						className="absolute inset-0 h-full w-full object-cover object-center"
					/>
				</div>
			</div>

			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-60 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black" />
			<div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-60 w-full bg-gradient-to-b from-white via-transparent to-transparent dark:from-black" />
		</div>
	);
};

export const SkeletonThree = () => {
	return (
		<a
			href="https://www.youtube.com/watch?v=RPa3_AD1_Vs"
			target="__blank"
			className="group/image relative flex h-full gap-10"
		>
			<div className="group mx-auto h-full w-full bg-transparent dark:bg-transparent">
				<div className="relative flex h-full w-full flex-1 flex-col space-y-2">
					{/* TODO */}
					<IconBrandYoutubeFilled className="absolute inset-0 z-10 m-auto h-20 w-20 text-red-500 " />
					<img
						src="/logo-mark.png"
						alt="Logo mark representing our brand"
						className="w-8 h-8 mr-2"
					/>
					<img
						src="/feat-hq.png"
						alt="Advanced monitoring dashboard interface"
						className="w-full h-full object-cover rounded-lg"
					/>
				</div>
			</div>
		</a>
	);
};

export const SkeletonTwo = () => {
	const images = [
		{
			src: "https://images.unsplash.com/photo-1517322048670-4fba75cbbb62?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
			alt: "bali images",
		},
		{
			src: "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=3425&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
			alt: "bali images",
		},
		{
			src: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
			alt: "bali images",
		},
		{
			src: "https://images.unsplash.com/photo-1554931670-4ebfabf6e7a9?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
			alt: "bali images",
		},
		{
			src: "https://images.unsplash.com/photo-1546484475-7f7bd55792da?q=80&w=2581&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
			alt: "bali images",
		},
	];

	const imageVariants = {
		whileHover: { scale: 1.1, rotate: 0, zIndex: 100 },
		whileTap: { scale: 1.1, rotate: 0, zIndex: 100 },
	};

	// 👇 Safe deterministic angle using index
	const getRotation = (i: number) => ((i * 13) % 21) - 10;

	return (
		<div className="relative flex h-full flex-col items-start gap-10 overflow-hidden p-8">
			<div className="-ml-20 flex flex-row">
				{images.map((image, idx) => (
					<motion.div
						variants={imageVariants}
						key={`images-first-${image.src}-${idx}`}
						style={{ rotate: getRotation(idx) }}
						whileHover="whileHover"
						className="relative h-32 w-32 overflow-hidden rounded-lg"
					>
						<Image src={image.src} alt={image.alt} fill={true} className="object-cover" />
					</motion.div>
				))}
			</div>
			<div className="flex flex-row">
				{images.map((image, idx) => (
					<motion.div
						variants={imageVariants}
						key={`images-second-${image.src}-${idx}`}
						style={{ rotate: getRotation(idx + 10) }} // ✅ different index offset
						whileHover="whileHover"
						className="relative h-32 w-32 overflow-hidden rounded-lg"
					>
						<Image src={image.src} alt={image.alt} fill={true} className="object-cover" />
					</motion.div>
				))}
			</div>

			<div className="pointer-events-none absolute inset-y-0 left-0 z-[100] h-full w-20 bg-gradient-to-r from-white to-transparent dark:from-black" />
			<div className="pointer-events-none absolute inset-y-0 right-0 z-[100] h-full w-20 bg-gradient-to-l from-white to-transparent dark:from-black" />
		</div>
	);
};

export const SkeletonFour = () => {
	return (
		<div className="relative mt-10 flex h-60 flex-col items-center bg-transparent md:h-60 dark:bg-transparent">
			<Globe className="-right-10 md:-right-10 -bottom-80 md:-bottom-72 absolute" />
		</div>
	);
};

export const Globe = ({ className }: { className?: string }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		let phi = 0;

		if (!canvasRef.current) {
			return;
		}

		const globe = createGlobe(canvasRef.current, {
			devicePixelRatio: 2,
			width: 600 * 2,
			height: 600 * 2,
			phi: 0,
			theta: 0,
			dark: 1,
			diffuse: 1.2,
			mapSamples: 16000,
			mapBrightness: 6,
			baseColor: [0.3, 0.3, 0.3],
			markerColor: [0.1, 0.8, 1],
			glowColor: [1, 1, 1],
			markers: [
				// longitude latitude
				{ location: [37.7595, -122.4367], size: 0.03 },
				{ location: [40.7128, -74.006], size: 0.1 },
			],
			onRender: (state) => {
				// Called on every animation frame.
				// `state` will be an empty object, return updated params.
				state.phi = phi;
				phi += 0.01;
			},
		});

		return () => {
			globe.destroy();
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
			className={className}
		/>
	);
};
