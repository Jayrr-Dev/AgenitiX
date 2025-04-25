import { createClient } from "@/utils/supabase/client";

/**
 * Removes all related project links for a given project.
 *
 * @param projectId - The project ID to unlink everything from
 */
export async function unlinkAllRelatedProjects(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  if (!projectId) {
    return { success: false, error: "Project ID is required" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("project_related_links")
    .delete()
    .eq("project_id", projectId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
