import { useQuery } from '@tanstack/react-query';
import { getProjectShowcaseById } from '@/features/projects/lib/api/getProjectShowcaseById';
import type { ProjectShowcase } from '@/features/projects/types/project_types';

export function useProjectShowcase(projectId: string) {
  return useQuery<ProjectShowcase | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectShowcaseById(projectId),
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
}
