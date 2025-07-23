// app/build/[flowId]/page.tsx
import { dummyFlows } from "@/features/business-logic-modern/dashboard/data";
import FlowEditor from "@/features/business-logic-modern/infrastructure/flow-engine/FlowEditor";
import { notFound } from "next/navigation";

// TYPES
type PageProps = {
	params: Promise<{
		flowId: string;
	}>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Server component that looks up a Flow by ID from dummy data.
 * @param params - Contains the flowId from the URL
 * @param searchParams - Contains any query parameters
 */
export default async function FlowPage({ params, searchParams }: PageProps) {
	const [{ flowId }, search] = await Promise.all([params, searchParams]);

	// find in our dummy array
	const flow = dummyFlows.find((f) => f.id === flowId);
	if (!flow) notFound();

	return (
		<div
			className="h-[100vh] w-[100vw]"
			style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
		>
			<FlowEditor />
		</div>
	);
}
