"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PiggyBank,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  useMonthlyTrend,
  useMonthlyTotals,
  useBudgetWithSpending,
  useTransactionCount,
} from "@/lib/hooks";

const areaChartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-fill)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-fill)",
  },
} satisfies ChartConfig;

const barChartConfig = {
  amount: {
    label: "Spent",
    color: "var(--chart-fill)",
  },
  budget: {
    label: "Budget",
    color: "var(--chart-marker)",
  },
} satisfies ChartConfig;

// Distinct colors for pie chart categories
const PIE_COLORS = [
  "var(--chart-blue)",
  "var(--chart-orange)",
  "var(--chart-emerald)",
  "var(--chart-fuchsia)",
  "var(--chart-cyan)",
  "var(--chart-amber)",
  "var(--chart-indigo)",
  "var(--chart-lime)",
  "var(--chart-pink)",
  "var(--chart-green)",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
          {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Fetch real data from Dexie
  const monthlyTrend = useMonthlyTrend(currentYear);
  const monthlyTotals = useMonthlyTotals(currentYear, currentMonth);
  const budgetWithSpending = useBudgetWithSpending(currentYear, currentMonth);
  const transactionCount = useTransactionCount();

  // Transform budget data for charts
  const categorySpendingData = useMemo(() => {
    if (!budgetWithSpending) return [];
    return budgetWithSpending
      .filter(b => b.spent > 0)
      .map(b => ({
        category: b.categoryName,
        amount: b.spent,
        budget: b.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [budgetWithSpending]);

  // Create pie chart config dynamically
  const pieChartConfig = useMemo(() => {
    return categorySpendingData.reduce((acc, item, index) => {
      acc[item.category] = {
        label: item.category,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
      return acc;
    }, {} as ChartConfig);
  }, [categorySpendingData]);

  // Calculate stats
  const totalIncome = monthlyTotals?.income ?? 0;
  const totalExpenses = monthlyTotals?.expenses ?? 0;
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const topCategory = categorySpendingData.length > 0 ? categorySpendingData[0].category : "None";
  const totalCategorySpending = categorySpendingData.reduce((sum, item) => sum + item.amount, 0);

  // Format month name
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your financial overview for {monthName}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          description="This month"
          icon={DollarSign}
          trend={totalIncome > 0 ? "up" : undefined}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          description="This month"
          icon={Receipt}
          trend={totalExpenses > 0 ? "up" : undefined}
        />
        <StatCard
          title="Net Savings"
          value={formatCurrency(netSavings)}
          description={`${savingsRate}% savings rate`}
          icon={PiggyBank}
          trend={netSavings > 0 ? "up" : netSavings < 0 ? "down" : undefined}
        />
        <StatCard
          title="Transactions"
          value={(transactionCount ?? 0).toString()}
          description={`Top: ${topCategory}`}
          icon={ArrowUpRight}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trend Area Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Monthly comparison for {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaChartConfig} className="h-[300px] w-full">
              <AreaChart
                data={monthlyTrend || []}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="monthName"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  dataKey="income"
                  type="natural"
                  fill="var(--chart-fill)"
                  fillOpacity={0.5}
                  stroke="var(--chart-fill)"
                  stackId="a"
                />
                <Area
                  dataKey="expenses"
                  type="natural"
                  fill="var(--chart-fill)"
                  fillOpacity={0.3}
                  stroke="var(--chart-fill)"
                  strokeOpacity={0.6}
                  stackId="b"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>This month&apos;s breakdown vs budget</CardDescription>
          </CardHeader>
          <CardContent>
            {categorySpendingData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No spending data yet. Import transactions to see your spending breakdown.
              </div>
            ) : (
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <ComposedChart
                data={categorySpendingData}
                layout="vertical"
                margin={{ left: 0, right: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={100}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="amount"
                  radius={4}
                  name="Spent"
                  shape={(props) => {
                    const { x, y, width, height, index } = props as {
                      x?: number;
                      y?: number;
                      width?: number;
                      height?: number;
                      index?: number;
                    };
                    if (x === undefined || y === undefined || width === undefined || height === undefined || index === undefined) return null;

                    const entry = categorySpendingData[index];
                    if (!entry) return null;

                    const budget = entry.budget || 0;
                    const isOverBudget = budget > 0 && entry.amount > budget;
                    const hasBudget = budget > 0;
                    const color = isOverBudget ? "var(--chart-danger)" : "var(--chart-success)";

                    // width corresponds to 'amount', calculate budget width proportionally
                    const budgetWidth = hasBudget ? (budget / entry.amount) * width : width;

                    return (
                      <g>
                        {hasBudget && (
                          /* Neutral background up to budget */
                          <rect
                            x={x}
                            y={y}
                            width={Math.min(budgetWidth, width)}
                            height={height}
                            rx={4}
                            ry={4}
                            fill="var(--muted-foreground)"
                            fillOpacity={0.3}
                          />
                        )}
                        {isOverBudget ? (
                          <>
                            {/* Within budget portion - amber/orange (warning) */}
                            <rect
                              x={x}
                              y={y}
                              width={budgetWidth + 4}
                              height={height}
                              rx={4}
                              ry={4}
                              fill="var(--chart-amber)"
                            />
                            {/* Over budget portion - red (danger) */}
                            <rect
                              x={x + budgetWidth}
                              y={y}
                              width={width - budgetWidth}
                              height={height}
                              rx={4}
                              ry={4}
                              fill={color}
                            />
                          </>
                        ) : (
                          /* Within budget: solid spending bar */
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            rx={4}
                            ry={4}
                            fill={color}
                          />
                        )}
                      </g>
                    );
                  }}
                />
              </ComposedChart>
            </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Percentage breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {categorySpendingData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No spending data yet.
              </div>
            ) : (
              <>
                <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={categorySpendingData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {categorySpendingData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="category" />}
                      className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold">{formatCurrency(totalCategorySpending)}</p>
                  <p className="text-sm text-muted-foreground">Total spending this month</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
