/* ------------------------------------------------------------------
   BlurImage – <Image> wrapper that works with shadcn/ui
   ------------------------------------------------------------------ */
   "use client";

   import Image, { ImageProps } from "next/image";
   import { cn } from "@/lib/utils";
   
   export interface BlurImageProps
     extends Omit<ImageProps, "placeholder" | "blurDataURL"> {
     /** Optional base-64 placeholder */
     blurDataURL?: string;
   }
   
   export function BlurImage({
     blurDataURL,
     className,
     ...img
   }: BlurImageProps) {
     return (
       <Image
         {...img}
         placeholder={blurDataURL ? "blur" : "empty"}
         blurDataURL={blurDataURL}
         className={cn("h-full w-full object-cover", className)}
         sizes={img.sizes ?? "(max-width: 768px) 100vw, 50vw"}
       />
     );
   }
   