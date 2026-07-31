// Thin HTTP layer - knows how to talk to the backend, nothing else.
// services/ build on top of this; components never call this directly.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://jobalert-bot-avlq.onrender.com";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function searchJobs(filters) {
  const params = new URLSearchParams();
  if (filters.company) params.set("company", filters.company);
  if (filters.role) params.set("role", filters.role);
  if (filters.location) params.set("location", filters.location);

  const res = await fetch(`${API_BASE}/api/jobs/search?${params.toString()}`);
  return handleResponse(res);
}

export async function extractJobPost(text) {
  const res = await fetch(`${API_BASE}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return handleResponse(res);
}
