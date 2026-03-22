import { ROLES as DEFAULT_ROLES, Role } from "./roles";

const API = process.env.NEXT_PUBLIC_API_URL || "https://aicm3pweed.us-east-1.awsapprunner.com";

export async function loadRoles(): Promise<Role[]> {
  try {
    const resp = await fetch(`${API}/talent-pluto/roles`, { cache: "no-store" });
    if (resp.ok) {
      const data = await resp.json();
      if (data.custom && data.roles?.length > 0) return data.roles;
    }
  } catch { /* fallback */ }
  return DEFAULT_ROLES;
}

export async function saveRoles(roles: Role[]): Promise<void> {
  try {
    await fetch(`${API}/talent-pluto/roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles }),
    });
  } catch { /* best effort */ }
}
