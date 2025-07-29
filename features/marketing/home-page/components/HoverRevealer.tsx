import dynamic from "next/dynamic";

const CanvasRevealEffectDemo = dynamic(
	() => import("./canvasRevealEffect").then((mod) => mod.CanvasRevealEffectDemo),
	{
		loading: () => <div>Loading...</div>,
	}
);

export const Revealer = () => {
	return <CanvasRevealEffectDemo />;
};
