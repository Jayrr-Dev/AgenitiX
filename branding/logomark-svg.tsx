import { useTheme } from "next-themes";
import React from "react";

export const LogomarkLight = ( {className}: {className?: string} ) => {
  const { theme } = useTheme();
  const fill = theme === "light" ?  "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="62.727 109.716 349.392 254.286" width="50" height="50" className={className}>
      <path 
        style={{ 
          stroke: fill, 
          paintOrder: "fill", 
          strokeWidth: "0px", 
          fill: fill
        }} 
        d="M 322.518 245.369 L 412.119 109.716 L 359.56 110.718 L 297.491 202.821 L 242.038 115.523 C 238.257 110.161 234.15 110.217 234.15 110.217 C 227.325 109.895 196.877 110.217 196.877 110.217 L 62.727 364.002 L 114.285 364.002 L 139.312 315.448 L 194.875 315.448 L 220.903 273.901 L 161.337 273.4 L 218.401 162.777 L 268.458 243.367 L 190.37 363.502 L 241.95 363.502 L 294.487 283.412 L 346.545 363.502 L 397.602 363.502 L 322.518 245.369 Z" 
        transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)"
      />
    </svg>
  );
};

