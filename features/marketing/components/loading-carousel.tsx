import { useState } from "react";


export default function LoadingCarousel() {
    const [scrollY, setScrollY] = useState(0);
    return (
        <div className="w-full h-full">
                <div className="w-full h-full bg-gray-200 animate-pulse"></div>
        </div>
    );
}
