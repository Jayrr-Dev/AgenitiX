import type { ProjectShowcase } from "@/features/projects/types/project_types";
import { useQuery } from "@tanstack/react-query";

export function useProjectShowcase(projectId: string) {
	return {
		data: null,
		isLoading: false,
		isError: false,
	};
}
