import slugifyLib from "slugify";

/**
 * Generates a canonical project slug combining a slugified title and its ID.
 * @param title Project title
 * @returns e.g. "cool-project-title"
 */
export function generateProjectSlug(title: string): string {
	return slugifyLib(title, { lower: true, strict: true });
}

/**
 * Extracts the project ID from a slug (e.g., "title--id")
 * @param slug
 * @returns the ID portion of the slug
 */
export function extractProjectId(slug: string): string {
	return slug.split("---").pop() || "";
}
