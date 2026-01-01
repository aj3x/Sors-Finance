/**
 * Category Operations
 *
 * CRUD operations for transaction categories.
 */

import { db } from "./instance";
import type { DbCategory, UpdateCategoryResult } from "./types";
import { SYSTEM_CATEGORIES } from "./types";

// ============================================
// Read Operations
// ============================================

export async function getCategories(): Promise<DbCategory[]> {
  return db.categories.orderBy("order").toArray();
}

export async function getCategoryById(id: number): Promise<DbCategory | undefined> {
  return db.categories.get(id);
}

export async function getCategoryByUuid(uuid: string): Promise<DbCategory | undefined> {
  return db.categories.where("uuid").equals(uuid).first();
}

export async function getExcludedCategory(): Promise<DbCategory | undefined> {
  return db.categories.where("name").equals(SYSTEM_CATEGORIES.EXCLUDED).first();
}

export async function getUncategorizedCategory(): Promise<DbCategory | undefined> {
  return db.categories.where("name").equals(SYSTEM_CATEGORIES.UNCATEGORIZED).first();
}

// ============================================
// Write Operations
// ============================================

export async function addCategory(name: string, keywords: string[] = []): Promise<number> {
  const maxOrder = await db.categories.orderBy("order").last();
  const order = (maxOrder?.order ?? -1) + 1;

  return db.categories.add({
    uuid: crypto.randomUUID(),
    name,
    keywords,
    order,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateCategory(
  id: number,
  updates: Partial<Omit<DbCategory, "id" | "uuid" | "createdAt">>
): Promise<UpdateCategoryResult> {
  const result: UpdateCategoryResult = { assigned: 0, uncategorized: 0, conflicts: 0 };

  const oldCategory = await db.categories.get(id);
  if (!oldCategory) return result;

  const oldKeywords = oldCategory.keywords;
  const newKeywords = updates.keywords ?? oldKeywords;
  const keywordsChanged = JSON.stringify(oldKeywords.sort()) !== JSON.stringify([...newKeywords].sort());

  await db.transaction("rw", [db.categories, db.transactions], async () => {
    await db.categories.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    if (keywordsChanged) {
      const allCategories = await db.categories.toArray();

      // Check transactions currently in this category
      const transactionsInCategory = await db.transactions
        .where("categoryId")
        .equals(id)
        .toArray();

      for (const transaction of transactionsInCategory) {
        const stillMatches = matchesKeywords(transaction.matchField, newKeywords);
        if (!stillMatches) {
          const otherMatch = findMatchingCategory(transaction.matchField, allCategories, id);
          if (otherMatch) {
            await db.transactions.update(transaction.id!, {
              categoryId: otherMatch.id!,
              updatedAt: new Date(),
            });
            result.assigned++;
          } else {
            await db.transactions.update(transaction.id!, {
              categoryId: null,
              updatedAt: new Date(),
            });
          }
          result.uncategorized++;
        }
      }

      // Check uncategorized transactions
      const allTransactions = await db.transactions.toArray();
      const uncategorizedTransactions = allTransactions.filter(t => t.categoryId === null);

      for (const transaction of uncategorizedTransactions) {
        const matchesThis = matchesKeywords(transaction.matchField, newKeywords);
        if (matchesThis) {
          const otherCategories = allCategories.filter(c => c.id !== id);
          const otherMatches = otherCategories.filter(c =>
            matchesKeywords(transaction.matchField, c.keywords)
          );

          if (otherMatches.length === 0) {
            await db.transactions.update(transaction.id!, {
              categoryId: id,
              updatedAt: new Date(),
            });
            result.assigned++;
          } else {
            result.conflicts++;
          }
        }
      }
    }
  });

  return result;
}

export async function deleteCategory(id: number): Promise<void> {
  const category = await db.categories.get(id);
  if (category?.isSystem) {
    throw new Error("Cannot delete system categories");
  }

  await db.transaction("rw", [db.categories, db.transactions, db.budgets], async () => {
    await db.transactions.where("categoryId").equals(id).modify({ categoryId: null });
    await db.budgets.where("categoryId").equals(id).delete();
    await db.categories.delete(id);
  });
}

export async function reorderCategories(activeId: number, overId: number): Promise<void> {
  const categories = await db.categories.orderBy("order").toArray();
  const activeIndex = categories.findIndex(c => c.id === activeId);
  const overIndex = categories.findIndex(c => c.id === overId);

  if (activeIndex === -1 || overIndex === -1) return;

  const [moved] = categories.splice(activeIndex, 1);
  categories.splice(overIndex, 0, moved);

  await db.transaction("rw", db.categories, async () => {
    for (let i = 0; i < categories.length; i++) {
      await db.categories.update(categories[i].id!, { order: i, updatedAt: new Date() });
    }
  });
}

export async function addKeywordToCategory(categoryId: number, keyword: string): Promise<void> {
  const category = await db.categories.get(categoryId);
  if (!category) return;

  const trimmed = keyword.trim().toUpperCase();
  if (!trimmed || category.keywords.some(k => k.toUpperCase() === trimmed)) return;

  await db.categories.update(categoryId, {
    keywords: [...category.keywords, keyword.trim()],
    updatedAt: new Date(),
  });
}

export async function removeKeywordFromCategory(categoryId: number, keyword: string): Promise<void> {
  const category = await db.categories.get(categoryId);
  if (!category) return;

  await db.categories.update(categoryId, {
    keywords: category.keywords.filter(k => k !== keyword),
    updatedAt: new Date(),
  });
}

// ============================================
// Helpers
// ============================================

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

function findMatchingCategory(text: string, categories: DbCategory[], excludeId: number): DbCategory | null {
  const lowerText = text.toLowerCase();
  for (const category of categories) {
    if (category.id === excludeId) continue;
    if (category.keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  return null;
}
