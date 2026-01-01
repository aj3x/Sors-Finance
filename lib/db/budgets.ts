/**
 * Budget Operations
 *
 * CRUD operations for category budgets.
 */

import { db } from "./instance";
import type { DbBudget } from "./types";

// ============================================
// Read Operations
// ============================================

export async function getBudgets(year: number, month?: number | null): Promise<DbBudget[]> {
  if (month !== undefined && month !== null) {
    return db.budgets.where("[year+month]").equals([year, month]).toArray();
  }
  return db.budgets.where("year").equals(year).toArray();
}

export async function getBudgetForCategory(
  categoryId: number,
  year: number,
  month?: number | null
): Promise<DbBudget | undefined> {
  if (month !== undefined && month !== null) {
    return db.budgets.where("[year+month+categoryId]").equals([year, month, categoryId]).first();
  }
  return db.budgets.where({ categoryId, year, month: null }).first();
}

// ============================================
// Write Operations
// ============================================

export async function setBudget(
  categoryId: number,
  year: number,
  month: number | null,
  amount: number
): Promise<number> {
  const existing = await getBudgetForCategory(categoryId, year, month);

  if (existing?.id) {
    await db.budgets.update(existing.id, { amount, updatedAt: new Date() });
    return existing.id;
  }

  return db.budgets.add({
    categoryId,
    year,
    month,
    amount,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function deleteBudget(id: number): Promise<void> {
  await db.budgets.delete(id);
}

export async function copyBudgetToMonth(
  fromYear: number,
  fromMonth: number | null,
  toYear: number,
  toMonth: number | null
): Promise<void> {
  const sourceBudgets = await getBudgets(fromYear, fromMonth);

  await db.transaction("rw", db.budgets, async () => {
    for (const budget of sourceBudgets) {
      const existing = await getBudgetForCategory(budget.categoryId, toYear, toMonth);
      if (!existing) {
        await db.budgets.add({
          categoryId: budget.categoryId,
          year: toYear,
          month: toMonth,
          amount: budget.amount,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  });
}
