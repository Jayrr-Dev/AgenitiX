import { useQuery } from '@tanstack/react-query'
import type { ProjectShowcase } from '@/features/projects/types/project_types';

export function useProjectShowcase(projectId: string) {
  

  return {
    data: null,
    isLoading: false,
    isError: false,
  }
}

  
