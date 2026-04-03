/**
 * Returns the API base URL prefix used by client-side fetch hooks.
 *
 * - In Next.js (default): empty string → relative URLs like /api/neighborhood
 * - Standalone Express dev server: set NEXT_PUBLIC_API_BASE=http://localhost:3001
 */
export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE ?? "";
}
