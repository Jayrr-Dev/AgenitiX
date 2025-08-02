import dynamic from "next/dynamic";
import { Loading } from "@/components/Loading";

const CanvasRevealEffectDemo = dynamic(
	() => import("./CanvasRevealEffect").then((mod) => mod.CanvasRevealEffectDemo),
	{
		loading: () => <Loading showText={false} size="w-6 h-6" className="p-4" />,
	}
);

export const Revealer = () => {
	return <CanvasRevealEffectDemo />;
};
