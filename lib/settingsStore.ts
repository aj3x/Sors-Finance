const STORAGE_KEY = "sors-settings";

export interface AppSettings {
  finnhubApiKey?: string;
}

/**
 * Load settings from localStorage
 */
export function loadSettings(): AppSettings {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }

    return JSON.parse(stored) as AppSettings;
  } catch (error) {
    console.error("Error loading settings from localStorage:", error);
    return {};
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings to localStorage:", error);
  }
}

/**
 * Get Finnhub API key
 */
export function getFinnhubApiKey(): string | undefined {
  return loadSettings().finnhubApiKey;
}

/**
 * Set Finnhub API key
 */
export function setFinnhubApiKey(apiKey: string | undefined): void {
  const settings = loadSettings();
  if (apiKey) {
    settings.finnhubApiKey = apiKey;
  } else {
    delete settings.finnhubApiKey;
  }
  saveSettings(settings);
}

/**
 * Check if Finnhub API key is configured
 */
export function hasFinnhubApiKey(): boolean {
  const key = getFinnhubApiKey();
  return Boolean(key && key.trim().length > 0);
}
