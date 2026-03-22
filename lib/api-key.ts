const KEY = "talent-matcher-openai-key";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) || "";
}

export function saveApiKey(key: string) {
  if (typeof window === "undefined") return;
  if (key.trim()) {
    localStorage.setItem(KEY, key.trim());
  } else {
    localStorage.removeItem(KEY);
  }
}
