"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Check, Undo2 } from "lucide-react";
import { Transaction } from "@/lib/types";
import { DbCategory } from "@/lib/db";

interface ConflictResolverProps {
  conflictTransactions: Transaction[];
  categories: DbCategory[];
  onResolve: (transactionId: string, categoryId: string) => void;
  onUndo: (transactionId: string) => void;
}

export function ConflictResolver({
  conflictTransactions,
  categories,
  onResolve,
  onUndo,
}: ConflictResolverProps) {
  // Count unresolved (no categoryId yet)
  const unresolvedCount = conflictTransactions.filter(t => !t.categoryId).length;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getConflictingCategories = (transaction: Transaction): DbCategory[] => {
    if (!transaction.conflictingCategories) return [];
    return categories.filter((cat) =>
      transaction.conflictingCategories?.includes(cat.uuid)
    );
  };

  const getResolvedCategory = (transaction: Transaction): DbCategory | undefined => {
    if (!transaction.categoryId) return undefined;
    return categories.find(c => c.uuid === transaction.categoryId);
  };

  if (conflictTransactions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resolve Conflicts</span>
          <Badge variant={unresolvedCount > 0 ? "destructive" : "secondary"}>
            {conflictTransactions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          These transactions matched multiple categories. Please select the
          correct category for each.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Matching Categories</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conflictTransactions.map((transaction) => {
              const conflicting = getConflictingCategories(transaction);
              const resolvedCategory = getResolvedCategory(transaction);
              const isResolved = !!resolvedCategory;

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="max-w-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm truncate cursor-default">
                              {transaction.description}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <p>{transaction.description}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground truncate cursor-default">
                              {transaction.matchField}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <p>{transaction.matchField}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {transaction.amountOut > 0 ? (
                      <span className="text-destructive">
                        {formatCurrency(transaction.amountOut)}
                      </span>
                    ) : (
                      <span className="text-green-600">
                        {formatCurrency(transaction.amountIn)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {conflicting.map((cat) => (
                        <Badge key={cat.uuid} variant="outline">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isResolved ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          {resolvedCategory.name}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onUndo(transaction.id)}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Select
                        onValueChange={(value) =>
                          onResolve(transaction.id, value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {conflicting.map((cat) => (
                            <SelectItem key={cat.uuid} value={cat.uuid}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
