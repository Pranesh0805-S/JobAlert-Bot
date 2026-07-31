import { extractJobPost } from "../api/jobsApi.js";
import { MIN_PASTE_LENGTH } from "../utils/constants.js";

// This calls the exact same /api/extract endpoint the backend exposes,
// which internally reuses the same extractJobPost()/findDuplicatePost()
// functions the WhatsApp webhook uses. No parsing logic is duplicated
// here on the frontend - this file just validates input and shapes the result.
export async function parseWhatsAppMessage(rawText) {
  const text = rawText?.trim() || "";
  if (text.length < MIN_PASTE_LENGTH) {
    throw new Error(`Paste the full message (at least ${MIN_PASTE_LENGTH} characters).`);
  }
  return extractJobPost(text);
}
