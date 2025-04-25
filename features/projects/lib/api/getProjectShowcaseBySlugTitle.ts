// lib/api/getProjectShowcaseBySlugTitle.ts
import { createClient } from '@/utils/supabase/client';
import type { ProjectShowcaseRecord } from '@/features/projects/types/project_types';
import slugify from 'slugify';

export async function getProjectShowcaseBySlugTitle(slug: string): Promise<ProjectShowcaseRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_showcase')
    .select('*');

  if (error || !data) return null;

  const matched = data.find(project =>
    slugify(project.title, { lower: true, strict: true }) === slug
  );

  return matched ?? null;
}
