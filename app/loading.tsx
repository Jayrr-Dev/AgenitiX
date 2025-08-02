import { Loading } from "@/components/Loading";

// UNIFIED APP-LEVEL LOADING COMPONENT
export default function AppLoading() {
	return (
		<Loading 
			className="min-h-screen"
			size="w-12 h-12"
			text="Loading..."
			textSize="text-base"
		/>
	);
}
