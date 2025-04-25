import { createClient } from '@/utils/supabase/client';
import type {
  ProjectShowcase,
  Tags,
  ProjectShowcaseRecord,
  ProjectTagsLinksRecord,
  TagsRecord,
} from '@/features/projects/types/project_types';

/**
 * Fetch all project showcase entries with related tags
 */
export async function getAllProjectShowcases(): Promise<ProjectShowcase[]> {
  const supabase = await createClient();

  // 1. Fetch all projects
  const { data: projects, error: projectError } = await supabase
    .from('project_showcase')
    .select('*')
    .overrideTypes<ProjectShowcaseRecord[], { merge: false }>();

  if (projectError) throw new Error(`Failed to fetch projects: ${projectError.message}`);
  if (!projects?.length) return [];

  // 2. Fetch linking table entries
  const { data: tagLinks, error: linkError } = await supabase
    .from('project_tags_links')
    .select('*')
    .overrideTypes<ProjectTagsLinksRecord[], { merge: false }>();

  if (linkError) throw new Error(`Failed to fetch tag links: ${linkError.message}`);
  if (!tagLinks?.length) {
    return projects.map(project => ({
      ...transformProject(project),
      tags: [],
    }));
  }
  // 3. Fetch all tags based on linked tag_ids
  const tagIds = Array.from(new Set(tagLinks.map(link => link.tag_id)));

  const { data: tags, error: tagError } = await supabase
    .from('tags')
    .select('*')
    .in('tag_id', tagIds)
    .overrideTypes<TagsRecord[], { merge: false }>();


  if (tagError) throw new Error(`Failed to fetch tags: ${tagError.message}`);

  // 4. Map tags to projects
  const projectToTagsMap: Record<string, Tags[]> = {};

  tagLinks.forEach(link => {
    const tag = tags?.find(t => t.tag_id === link.tag_id);
    if (!tag) return;

    if (!projectToTagsMap[link.project_id]) {
      projectToTagsMap[link.project_id] = [];
    }

    projectToTagsMap[link.project_id].push({
      tag_id: tag.tag_id,
      tag: tag.tag,
    });
  });

  // 5. Combine and return formatted projects
  return projects.map(project => ({
    ...transformProject(project),
    tags: projectToTagsMap[project.project_id] ?? [],
  }));
}

/**
 * Converts raw Supabase project row to ProjectShowcase
 */
function transformProject(project: ProjectShowcaseRecord): Omit<ProjectShowcase, 'tags'> {
  return {
    project_id: project.project_id,
    title: project.title,
    description: project.description,
    imageUrl: project.image_url,
    year: project.year,
    details: project.details,
    contactInfo: project.contact_info,
    outcomes: project.outcomes ?? [],
    imageCarousel: project.image_carousel ?? [],
    relatedProjects: [], // intentionally left blank
    projectLink: project.project_link,
  };
}
