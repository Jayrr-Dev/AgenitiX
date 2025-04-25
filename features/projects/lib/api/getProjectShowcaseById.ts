import { createClient } from "@/utils/supabase/client";
import { ProjectShowcase, ProjectTagsLinks, Tags } from "@/features/projects/types/project_types";
export async function getProjectShowcaseById(id: string): Promise<ProjectShowcase | null> {
  const supabase = await createClient();

  // fetch project
  const { data: project, error } = await supabase
    .from("project_showcase")
    .select("*")
    .eq("project_id", id)
    .single();

  if (error || !project) return null;

  const { data: tagLinks } = await supabase
    .from("project_tags_links")
    .select("tag_id")
        .eq("project_id", id);
 
  const {data: tags} = await supabase.from("tags")
    .select("*")
    .in("tag_id", tagLinks?.map(link => link.tag_id) ?? []);

  // fetch related projects (same as before)
  const { data: relatedLinks } = await supabase
    .from("project_related_links")
    .select("related_project_id")
    .eq("project_id", id);

  const relatedIds = relatedLinks?.map(r => r.related_project_id) ?? [];

  const { data: relatedProjectsData } = await supabase
    .from("project_showcase")
    .select("project_id, title, tags, image_url")
    .in("project_id", relatedIds);

  const relatedProjects = relatedProjectsData?.map((r) => ({
    project_id: r.project_id,
    title: r.title,
    tags: r.tags,
    imageUrl: r.image_url,
  })) ?? [];
  console.log(relatedProjects);
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
    tags: tags ?? [],
    relatedProjects: relatedProjects,
    projectLink: project.project_link,
  };
}
