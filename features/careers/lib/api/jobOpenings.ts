/**
 * careers/lib/api/jobOpenings.ts
 *
 * Strongly-typed helpers for the `public.job_openings` table.
 * -----------------------------------------------------------
 *
 *  • getAllJobOpenings()      – list every job (newest first)
 *  • getJobOpeningById(id)    – single job with the given UUID
 *
 * Both functions wrap raw Supabase rows in a camel-cased, frontend-friendly
 * `JobOpening` object and coerce any NULL array columns to empty arrays
 * so you never have to sprinkle `?? []` in the UI layer.
 */

import { createClient } from '@/utils/supabase/client';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

/** Exact shape of the row returned by Supabase (snake_case) */
export interface JobOpeningRecord {
  id: string;
  title: string;
  location: string;
  description: string;
  full_description: string | null;
  requirements: string[] | null;
  responsibilities: string[] | null;
  skill_assets: string[] | null;
  salary: string | null;
  image: string | null;
  created_at: string; // ISO-8601 timestamp
}

/** UI-friendly shape (camelCase & non-null arrays) */
export interface JobOpening {
  id: string;
  title: string;
  location: string;
  description: string;
  fullDescription: string | null;
  requirements: string[];
  responsibilities: string[];
  skillAssets: string[];
  salary: string | null;
  createdAt: string;
  image: string | null;
}

// ────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────

/**
 * Fetch **all** job postings (ordered by newest first).
 */
export async function getAllJobOpenings(): Promise<JobOpening[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_openings')
    .select('*')
    .order('created_at', { ascending: false })
    .overrideTypes<JobOpeningRecord[], { merge: false }>();

  if (error) throw new Error(`Failed to fetch job openings: ${error.message}`);
  if (!data?.length) return [];

  return data.map(transformJob);
}

/**
 * Fetch **one** job posting by UUID.
 * Returns `null` if not found or on error.
 */
export async function getJobOpeningById(id: string): Promise<JobOpening | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_openings')
    .select('*')
    .eq('id', id)
    .single()
    .overrideTypes<JobOpeningRecord, { merge: false }>();
  if (error) return null;
  if (!data) return null;
  return transformJob(data as JobOpeningRecord);
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/**
 * Convert a raw `JobOpeningRecord` to a camel-cased `JobOpening`.
 * Ensures array fields are never `null`, simplifying rendering logic.
 */
function transformJob(record: JobOpeningRecord): JobOpening {
  return {
    id: record.id,
    title: record.title,
    location: record.location,
    description: record.description,
    fullDescription: record.full_description,
    requirements: record.requirements ?? [],
    responsibilities: record.responsibilities ?? [],
    skillAssets: record.skill_assets ?? [],
    salary: record.salary,
    createdAt: record.created_at,
    image: record.image,
  };
}
