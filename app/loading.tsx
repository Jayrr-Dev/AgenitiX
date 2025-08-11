import { Loading } from "@components/Loading";

// UNIFIED APP-LEVEL LOADING COMPONENT
export default function AppLoading() {
	return (
		<Loading 
			className="flex flex-col gap-2 items-center justify-center w-full h-full p-4"
			text="Loading..."
		/>
	)
}
