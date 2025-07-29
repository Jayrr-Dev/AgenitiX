"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import * as React from "react";

import type { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];

type CarouselProps = {
	opts?: CarouselOptions;
	orientation?: "horizontal" | "vertical";
	setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
	carouselRef: ReturnType<typeof useEmblaCarousel>[0];
	api: ReturnType<typeof useEmblaCarousel>[1];
	scrollPrev: () => void;
	scrollNext: () => void;
	canScrollPrev: boolean;
	canScrollNext: boolean;
	selectedIndex: number;
	totalSlides: number;
	scrollTo: (index: number) => void;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
	const context = React.useContext(CarouselContext);
	if (!context) {
		throw new Error("useCarousel must be used within a <Carousel />");
	}
	return context;
}

const Carousel = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(({ orientation = "horizontal", opts, setApi, className, children, ...props }, ref) => {
	const [carouselRef, api] = useEmblaCarousel(
		{ ...opts, axis: orientation === "horizontal" ? "x" : "y" },
		[Autoplay({ delay: 10000 })]
	);
	const [canScrollPrev, setCanScrollPrev] = React.useState(false);
	const [canScrollNext, setCanScrollNext] = React.useState(false);
	const [selectedIndex, setSelectedIndex] = React.useState(0);
	const [totalSlides, setTotalSlides] = React.useState(0);

	const onSelect = React.useCallback((api: CarouselApi) => {
		if (!api) {
			return;
		}
		setCanScrollPrev(api.canScrollPrev());
		setCanScrollNext(api.canScrollNext());
		setSelectedIndex(api.selectedScrollSnap());
		setTotalSlides(api.scrollSnapList().length);
	}, []);

	const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
	const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);
	const scrollTo = React.useCallback((index: number) => api?.scrollTo(index), [api]);

	React.useEffect(() => {
		if (!(api && setApi)) {
			return;
		}
		setApi(api);
	}, [api, setApi]);

	React.useEffect(() => {
		if (!api) {
			return;
		}
		onSelect(api);
		api.on("reInit", onSelect);
		api.on("select", onSelect);
		return () => {
			api?.off("select", onSelect);
		};
	}, [api, onSelect]);

	return (
		<CarouselContext.Provider
			value={{
				carouselRef,
				api,
				opts,
				orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
				scrollPrev,
				scrollNext,
				canScrollPrev,
				canScrollNext,
				selectedIndex,
				totalSlides,
				scrollTo,
			}}
		>
			<section
				ref={ref}
				className={cn("relative", className)}
				aria-roledescription="carousel"
				{...props}
			>
				{children}
			</section>
		</CarouselContext.Provider>
	);
});
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		const { carouselRef, orientation } = useCarousel();
		return (
			<div ref={carouselRef} className="overflow-hidden rounded-lg">
				<div
					ref={ref}
					className={cn(
						"flex",
						orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
						className
					)}
					{...props}
				/>
			</div>
		);
	}
);
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		const { orientation } = useCarousel();
		return (
			<div
				ref={ref}
				role="group"
				aria-roledescription="slide"
				className={cn(
					"min-w-0 shrink-0 grow-0 basis-full",
					orientation === "horizontal" ? "pl-0" : "pt-4",
					className
				)}
				{...props}
			/>
		);
	}
);
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
	({ className, ...props }, ref) => {
		const { orientation, scrollPrev, canScrollPrev } = useCarousel();
		return (
			<button
				ref={ref}
				className={cn(
					"absolute h-8 w-8 rounded-full border border-border/50 bg-background/80 p-0 shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:shadow-md disabled:pointer-events-none disabled:opacity-50 dark:border-border",
					orientation === "horizontal"
						? "left-4 top-1/2 -translate-y-1/2"
						: "left-1/2 top-4 -translate-x-1/2 rotate-90",
					className
				)}
				disabled={!canScrollPrev}
				onClick={scrollPrev}
				type="button"
				aria-label="Previous slide"
				{...props}
			>
				{/* <ArrowLeft className="h-4 w-4" /> */}
				<span className="sr-only">Previous slide</span>
			</button>
		);
	}
);
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
	({ className, ...props }, ref) => {
		const { orientation, scrollNext, canScrollNext } = useCarousel();
		return (
			<button
				ref={ref}
				className={cn(
					"absolute h-8 w-8 rounded-full border border-border/50 bg-background/80 p-0 shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:shadow-md disabled:pointer-events-none disabled:opacity-50 dark:border-border",
					orientation === "horizontal"
						? "right-4 top-1/2 -translate-y-1/2"
						: "bottom-4 left-1/2 -translate-x-1/2 rotate-90",
					className
				)}
				disabled={!canScrollNext}
				onClick={scrollNext}
				type="button"
				aria-label="Next slide"
				{...props}
			>
				{/* <ArrowRight className="h-4 w-4" /> */}
				<span className="sr-only">Next slide</span>
			</button>
		);
	}
);
CarouselNext.displayName = "CarouselNext";

const CarouselDots = ({ className }: { className?: string }) => {
	const { selectedIndex, totalSlides, scrollTo } = useCarousel();
	return (
		<div className={cn("-translate-x-1/2 absolute bottom-4 left-1/2 z-10 flex gap-2", className)}>
			{Array.from({ length: totalSlides }).map((_, index) => (
				<button
					type="button"
					key={`carousel-dot-${index}-${Date.now()}`}
					onClick={() => scrollTo(index)}
					className={cn(
						"h-2 w-2 rounded-full transition-colors",
						index === selectedIndex ? "bg-primary" : "bg-muted"
					)}
				/>
			))}
		</div>
	);
};
CarouselDots.displayName = "CarouselDots";

const CarouselContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		return <div ref={ref} className={cn("relative", className)} {...props} />;
	}
);
CarouselContainer.displayName = "CarouselContainer";

export {
	type CarouselApi,
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselPrevious,
	CarouselNext,
	CarouselDots,
	CarouselContainer,
};
