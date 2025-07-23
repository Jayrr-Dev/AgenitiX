import type { PageProps } from "@/types/page";
// app/(main-pages)/projects/[slug]/page.tsx
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { use } from "react";
import ClientProjectPage from "./ClientProjectPage";
export const revalidate = 60;

type Params = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function ProjectPage({ params }: Params) {
	const { slug } = await params;
	return (
		<HydrationBoundary>
			<ClientProjectPage />
		</HydrationBoundary>
	);
}
