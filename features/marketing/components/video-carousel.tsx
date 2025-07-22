import { RefObject, useEffect, useRef } from "react";

type VideoCarouselProps = {
	src: string;
};

export function videoCarousel(props: VideoCarouselProps) {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		// Handle video loading and autoplay
		if (videoRef.current) {
			// Preload video data
			videoRef.current.preload = "auto";

			// Force play when component mounts
			const playVideo = async () => {
				try {
					if (videoRef.current) {
						await videoRef.current.play();
					}
				} catch (error) {
					console.log("Autoplay prevented:", error);
				}
			};

			playVideo();
		}
	}, []);

	return (
		<video
			ref={videoRef}
			src={props.src}
			autoPlay
			muted
			playsInline
			loop
			className="w-full h-full object-cover"
			style={{ height: "calc(90vh - 112px)" }}
		/>
	);
}
