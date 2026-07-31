import { searchJobs } from "../api/jobsApi.js";

// Wraps the API call with any request shaping / future business rules
// (e.g. debounce, caching, analytics) without components needing to know.
export async function runJobSearch({ company, role, location }) {
  const trimmed = {
    company: company?.trim(),
    role: role?.trim(),
    location: location?.trim(),
  };
  const hasAnyFilter = Object.values(trimmed).some(Boolean);
  if (!hasAnyFilter) {
    throw new Error("Enter at least one search field.");
  }
  const { results } = await searchJobs(trimmed);
  return results;
}
