import { createClient } from "@/utils/supabase/client";

/**
 * Link multiple related projects to a project in the normalized schema
 * 
 * @param projectId - The project to link from
 * @param relatedProjectIds - List of project IDs to link as related
 */
export async function linkRelatedProjects(
  projectId: string,
  relatedProjectIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!projectId || relatedProjectIds.length === 0) {
    return { success: false, error: "Invalid input" };
  }

  const supabase = await createClient();

  const insertPayload = relatedProjectIds.map((relatedId) => ({
    project_id: projectId,
    related_project_id: relatedId,
  }));

  const { error } = await supabase
    .from("project_related_links")
    .upsert(insertPayload, {
      onConflict: "project_id,related_project_id", // avoids duplicates
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
