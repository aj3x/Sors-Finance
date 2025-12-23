"use client";

import {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Tv,
  Lightbulb,
  Heart,
  Film,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { budgetItems, type BudgetItem } from "@/lib/dummyData";

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Tv,
  Lightbulb,
  Heart,
  Film,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function BudgetCard({ item }: { item: BudgetItem }) {
  const Icon = iconMap[item.icon] || ShoppingCart;
  const percentage = Math.round((item.spent / item.budgeted) * 100);
  const remaining = item.budgeted - item.spent;
  const isOverBudget = remaining < 0;
  const isNearLimit = percentage >= 90 && percentage < 100;

  return (
    <Card className={isOverBudget ? "border-red-500/50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isOverBudget
                  ? "bg-red-500/10 text-red-500"
                  : isNearLimit
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{item.category}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(item.spent)} of {formatCurrency(item.budgeted)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-lg font-semibold ${
                isOverBudget ? "text-red-500" : ""
              }`}
            >
              {isOverBudget ? "-" : ""}
              {formatCurrency(Math.abs(remaining))}
            </p>
            <p className="text-xs text-muted-foreground">
              {isOverBudget ? "over budget" : "remaining"}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <Progress
            value={Math.min(percentage, 100)}
            className={`h-2 ${
              isOverBudget
                ? "[&>div]:bg-red-500"
                : isNearLimit
                ? "[&>div]:bg-yellow-500"
                : ""
            }`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage}% used</span>
            {isOverBudget && (
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
  const totalBudgeted = budgetItems.reduce((sum, item) => sum + item.budgeted, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercentage = Math.round((totalSpent / totalBudgeted) * 100);

  const categoriesOverBudget = budgetItems.filter(
    (item) => item.spent > item.budgeted
  ).length;
  const categoriesNearLimit = budgetItems.filter(
    (item) => {
      const pct = (item.spent / item.budgeted) * 100;
      return pct >= 90 && pct < 100;
    }
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground">
            Track your spending against your monthly budget
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
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
        <CardContent className="grid gap-4 md:grid-cols-2">
          {budgetItems.map((item) => (
            <BudgetCard key={item.id} item={item} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
