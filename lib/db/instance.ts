/**
 * Database Instance
 *
 * Dexie database class definition and singleton instance.
 */

import Dexie, { Table } from "dexie";
import type {
  DbCategory,
  DbTransaction,
  DbBudget,
  DbImport,
  DbSettings,
  DbPortfolioAccount,
  DbPortfolioItem,
  DbPortfolioSnapshot,
} from "./types";

class SorsDatabase extends Dexie {
  categories!: Table<DbCategory>;
  transactions!: Table<DbTransaction>;
  budgets!: Table<DbBudget>;
  imports!: Table<DbImport>;
  settings!: Table<DbSettings>;
  portfolioAccounts!: Table<DbPortfolioAccount>;
  portfolioItems!: Table<DbPortfolioItem>;
  portfolioSnapshots!: Table<DbPortfolioSnapshot>;

  constructor() {
    super("sors-finance");

    this.version(1).stores({
      categories: "++id, &uuid, name, order",
      transactions: "++id, &uuid, date, categoryId, source, importId, [date+categoryId]",
      budgets: "++id, categoryId, year, month, [year+month], [year+month+categoryId]",
      imports: "++id, source, importedAt",
      settings: "++id, &key",
    });

    this.version(2).stores({
      categories: "++id, &uuid, name, order, isSystem",
      transactions: "++id, &uuid, date, categoryId, source, importId, [date+categoryId]",
      budgets: "++id, categoryId, year, month, [year+month], [year+month+categoryId]",
      imports: "++id, source, importedAt",
      settings: "++id, &key",
    });

    this.version(3).stores({
      categories: "++id, &uuid, name, order, isSystem",
      transactions: "++id, &uuid, date, categoryId, source, importId, [date+categoryId]",
      budgets: "++id, categoryId, year, month, [year+month], [year+month+categoryId]",
      imports: "++id, source, importedAt",
      settings: "++id, &key",
      portfolioAccounts: "++id, &uuid, bucket, order",
      portfolioItems: "++id, &uuid, accountId, isActive, order",
      portfolioSnapshots: "++id, &uuid, date",
    });
  }
}

export const db = new SorsDatabase();
