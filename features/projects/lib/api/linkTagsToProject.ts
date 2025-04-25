// lib/api/linkCategoriesToProject.ts

import { createClient } from "@/utils/supabase/client";

  export async function linkTagsToProject(projectId: string, tagIds: string[]) {
  const payload = tagIds.map((tagId) => ({
    project_id: projectId,
    tag_id: tagId,
  }));

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_tags")
    .upsert(payload, { onConflict: "project_id,tag_id" });

  if (error) {
    throw new Error(`Failed to link categories: ${error.message}`);
  }
}
