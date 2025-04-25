import { createClient } from "@/utils/supabase/client";

/**
 * Unlink one or more related projects from a given project.
 *
 * @param projectId - The main project to unlink from
 * @param relatedProjectIds - Array of related project IDs to remove
 */
export async function unlinkRelatedProjects(
  projectId: string,
  relatedProjectIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!projectId || relatedProjectIds.length === 0) {
    return { success: false, error: "Invalid input" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("project_related_links")
    .delete()
    .match({ project_id: projectId })
    .in("related_project_id", relatedProjectIds);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
