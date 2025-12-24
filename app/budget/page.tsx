"use client";

import {
  Plus,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBudgetWithSpending } from "@/lib/hooks";

interface BudgetItemData {
  id: number;
  categoryName: string;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function BudgetCard({ item }: { item: BudgetItemData }) {
  const percentage = Math.round(item.percentUsed);

  return (
    <Card className={item.isOverBudget ? "border-red-500/50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                item.isOverBudget
                  ? "bg-red-500/10 text-red-500"
                  : item.isNearLimit
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{item.categoryName}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(item.spent)} of {formatCurrency(item.amount)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-lg font-semibold ${
                item.isOverBudget ? "text-red-500" : ""
              }`}
            >
              {item.isOverBudget ? "-" : ""}
              {formatCurrency(Math.abs(item.remaining))}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.isOverBudget ? "over budget" : "remaining"}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <Progress
            value={Math.min(percentage, 100)}
            className={`h-2 ${
              item.isOverBudget
                ? "[&>div]:bg-red-500"
                : item.isNearLimit
                ? "[&>div]:bg-yellow-500"
                : ""
            }`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage}% used</span>
            {item.isOverBudget && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-3 w-3" />
                Over budget
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BudgetPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Fetch real budget data from Dexie
  const budgetWithSpending = useBudgetWithSpending(currentYear, currentMonth);
  const budgetItems = budgetWithSpending || [];

  const totalBudgeted = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  const categoriesOverBudget = budgetItems.filter((item) => item.isOverBudget).length;
  const categoriesNearLimit = budgetItems.filter((item) => item.isNearLimit).length;

  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground">
            Track your spending for {monthName}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Budget</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalBudgeted)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Monthly allocation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Spent</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalSpent)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {overallPercentage}% of budget used
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle
              className={`text-2xl ${totalRemaining < 0 ? "text-red-500" : "text-green-500"}`}
            >
              {formatCurrency(totalRemaining)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {categoriesOverBudget > 0 && (
                <span className="text-red-500">
                  {categoriesOverBudget} over budget
                </span>
              )}
              {categoriesOverBudget > 0 && categoriesNearLimit > 0 && " · "}
              {categoriesNearLimit > 0 && (
                <span className="text-yellow-500">
                  {categoriesNearLimit} near limit
                </span>
              )}
              {categoriesOverBudget === 0 && categoriesNearLimit === 0 && (
                <span className="text-green-500">All categories on track</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
          <CardDescription>
            Your spending progress for each category this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgetItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No budgets set up yet. Add budgets for your categories to track spending.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {budgetItems.map((item) => (
                <BudgetCard key={item.id} item={item as BudgetItemData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
