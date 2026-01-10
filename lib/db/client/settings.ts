/**
 * Client-side API wrapper for settings operations
 */

export async function getSetting(key: string): Promise<string | null> {
  const res = await fetch(`/api/settings?key=${encodeURIComponent(key)}`);
  // Return null if unauthorized (user logged out) to avoid errors during logout
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch setting");
  const { data } = await res.json();
  return data;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  // Silently fail if unauthorized (user logged out)
  if (res.status === 401) return;
  if (!res.ok) throw new Error("Failed to save setting");
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const res = await fetch("/api/settings");
  // Return empty object if unauthorized (user logged out)
  if (res.status === 401) return {};
  if (!res.ok) throw new Error("Failed to fetch settings");
  const { data } = await res.json();
  return data;
}
