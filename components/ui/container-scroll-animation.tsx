"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  useScroll,
  useTransform,
  motion,
  useAnimation,
  useInView,
  MotionValue,
} from "framer-motion";

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
  const sectionRef = useRef<HTMLDivElement>(null);

  // Framer's scroll tracking hook
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Detect if section is in view
  const isInView = useInView(sectionRef, { once: true, margin: "-20%" });

  // Mobile check
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleDimensions = () => (isMobile ? [0.7, 0.9] : [1.05, 1]);

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      ref={containerRef}
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20"
    >
      <div className="py-10 md:py-40 w-full relative" style={{ perspective: "1000px" }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale} translate={translate}>
          <InfiniteScrollContent isInView={isInView} sectionRef={sectionRef as React.RefObject<HTMLDivElement>}>
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
const InfiniteScrollContent = ({
  isInView,
  sectionRef,
  children,
}: {
  isInView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}) => {
  return (
    <div ref={sectionRef} className="relative h-full overflow-hidden">
      {isInView && (
        <motion.div
          className="absolute top-0 left-0 w-full"
          initial={{ y: 0 }}
          animate={{
            y: ["0%", "-50%"],
          }}
          transition={{
            duration: 12,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          <div className="flex flex-col">
            {children}
            {children /* duplicated for seamless scroll */}
          </div>
        </motion.div>
      )}
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
    <motion.div
      style={{ translateY: translate }}
      className="max-w-5xl mx-auto text-center"
    >
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
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:p-4">
        {children}
      </div>
    </motion.div>
  );
};
