"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    name: string;
    key: string;
    customId: string | null;
    url: string;
    size: number;
    uploadedAt: string;
    review: string;
    "profile-name": string;
    "profile-designation": string;
    location: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);

  // Detect visibility
  const { ref: inViewRef, inView: isInView } = useInView();

  // Combine refs
  const combinedRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    inViewRef(node);
  };

  const [start, setStart] = useState(false);

  const addAnimation = useCallback(() => {
    if (!scrollerRef.current) {
      return;
    }

    setStart(true);

    // Apply direction and speed
    const scrollerContent = scrollerRef.current;
    if (scrollerContent) {
      scrollerContent.style.transform = `translateX(-${scrollerContent.scrollWidth / 2}px)`;
    }
  }, []);

  useEffect(() => {
    if (isInView && !start) {
      addAnimation();
    }
  }, [isInView, start, addAnimation]);

  const _setAnimationProps = () => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse"
    );

    const duration =
      speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s";

    containerRef.current.style.setProperty("--animation-duration", duration);
  };
  return (
    <div
      ref={combinedRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item) => (
          <li
            key={item.key}
            className="relative w-[350px] max-w-full shrink-0 rounded-2xl border border-zinc-200 border-b-0 bg-[linear-gradient(180deg,#fafafa,#f5f5f5)] px-8 py-6 md:w-[450px] dark:border-zinc-700 dark:bg-[linear-gradient(180deg,#27272a,#18181b)]"
          >
            <div className="relative flex h-full w-full flex-row items-start justify-center">
              <Image
                src={item.url}
                width={96}
                height={96}
                alt={item.key}
                className="mr-8 rounded-2xl"
              />
              <blockquote>
                <div
                  aria-hidden="true"
                  className="user-select-none -top-0.5 -left-0.5 -z-1 pointer-events-none absolute h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
                />
                <span className="relative z-20 font-normal text-neutral-800 text-sm leading-[1.6] dark:text-gray-100">
                  {item.review}
                </span>
                <div className="relative z-20 mt-6 flex flex-row items-center">
                  <span className="flex flex-col gap-1">
                    <span className="font-normal text-neutral-500 text-sm leading-[1.6] dark:text-gray-400">
                      {item["profile-name"]}
                    </span>
                    <span className="font-normal text-neutral-500 text-sm leading-[1.6] dark:text-gray-400">
                      {item["profile-designation"]}
                    </span>
                  </span>
                </div>
              </blockquote>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
