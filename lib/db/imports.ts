/**
 * Import Operations
 *
 * CRUD operations for tracking file imports.
 */

import { db } from "./instance";
import type { DbImport } from "./types";

export async function getImports(): Promise<DbImport[]> {
  return db.imports.orderBy("importedAt").reverse().toArray();
}

export async function addImport(importData: Omit<DbImport, "id">): Promise<number> {
  return db.imports.add(importData);
}

export async function deleteImport(id: number): Promise<void> {
  await db.transaction("rw", [db.imports, db.transactions], async () => {
    await db.transactions.where("importId").equals(id).delete();
    await db.imports.delete(id);
  });
}
