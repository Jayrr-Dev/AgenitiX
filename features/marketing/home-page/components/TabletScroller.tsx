import dynamic from "next/dynamic";
import { Loading } from "@/components/Loading";
//add loading
const ContainerScroll = dynamic(
	() => import("@/components/ui/container-scroll-animation").then((mod) => mod.ContainerScroll),
	{
		loading: () => <Loading showText={false} size="w-6 h-6" className="p-4" />,
	}
);
import Image from "next/image";
import { useTheme } from "next-themes";

export const TabletScroller = () => {
	const { theme, setTheme } = useTheme();
	return (
		<ContainerScroll
			titleComponent=<h1 className={`${theme === 'dark' ? 'text-white font-semibold text-4xl text-black dark:text-white' : 'text-black font-semibold text-4xl text-black dark:text-white'}font-semibold text-4xl text-black dark:text-white`}>
				Packed with thousands of features <br />
				<span className={`${theme === 'dark' ? 'text-white mt-1 font-bold text-4xl leading-none md:text-[6rem] text-black dark:text-white' : 'text-black'}mt-1 font-bold text-4xl leading-none md:text-[6rem] text-black dark:text-white`}>
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
