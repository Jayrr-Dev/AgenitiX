/**
 * USE IN VIEW HOOK - Intersection Observer for infinite scrolling
 *
 * • Detects when element enters viewport
 * • Configurable threshold and root margin
 * • Returns ref and visibility state
 * • Perfect for infinite scrolling and lazy loading
 *
 * Keywords: intersection-observer, infinite-scroll, lazy-loading, performance
 */

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
	threshold?: number;
	rootMargin?: string;
}

export function useInView(options: UseInViewOptions = {}) {
	const ref = useRef<HTMLDivElement>(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				setInView(entry.isIntersecting);
			},
			{
				threshold: options.threshold || 0,
				rootMargin: options.rootMargin || "0px",
			}
		);

		observer.observe(element);

		return () => {
			observer.unobserve(element);
		};
	}, [options.threshold, options.rootMargin]);

	return { ref, inView };
}
