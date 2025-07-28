import dynamic from "next/dynamic";
//add loading
const ContainerScroll = dynamic(
	() => import("@/components/ui/container-scroll-animation").then((mod) => mod.ContainerScroll),
	{
		loading: () => <div>Loading...</div>,
	}
);
import Image from "next/image";

export const TabletScroller = () => {
	return (
		<ContainerScroll
			titleComponent=<h1 className="font-semibold text-4xl text-black dark:text-white">
				Impactful and Modern <br />
				<span className="mt-1 font-bold text-4xl leading-none md:text-[6rem]">
					Digital Solutions
				</span>
			</h1>
		>
			<Image
				src={"https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyl8dd352HKfpMqcECx0SmFrysdTIjOYlVthJ8"}
				alt="hero"
				height={4638}
				width={1024}
				className=""
				draggable={false}
			/>
		</ContainerScroll>
	);
};
