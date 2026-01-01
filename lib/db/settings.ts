/**
 * Settings Operations
 *
 * Key-value settings storage.
 */

import { db } from "./instance";

export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.where("key").equals(key).first();
  return setting?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where("key").equals(key).first();
  if (existing?.id) {
    await db.settings.update(existing.id, { value });
  } else {
    await db.settings.add({ key, value });
  }
}
