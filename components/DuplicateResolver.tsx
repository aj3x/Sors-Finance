"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Check, X, Copy, Undo2 } from "lucide-react";
import { Transaction } from "@/lib/types";

interface DuplicateResolverProps {
  duplicateTransactions: Transaction[];
  onAllow: (transactionId: string) => void;
  onIgnore: (transactionId: string) => void;
  onUndo: (transactionId: string) => void;
  onIgnoreAll: () => void;
  onAllowAll: () => void;
  className?: string;
}

export function DuplicateResolver({
  duplicateTransactions,
  onAllow,
  onIgnore,
  onUndo,
  onIgnoreAll,
  onAllowAll,
  className,
}: DuplicateResolverProps) {
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

  if (duplicateTransactions.length === 0) {
    return null;
  }

  return (
    <Card className={`flex flex-col ${className || ""}`}>
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Transactions
          </span>
          <Badge variant="secondary">{duplicateTransactions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <p className="text-sm text-muted-foreground">
            These transactions already exist in your database. You can choose to import them anyway
            (creating duplicates) or ignore them.
          </p>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onIgnoreAll}
            >
              <X className="h-4 w-4 mr-1" />
              Ignore All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onAllowAll}
            >
              <Check className="h-4 w-4 mr-1" />
              Allow All
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {duplicateTransactions.map((transaction) => (
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
                  <Badge variant="outline">{transaction.source}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {transaction.allowDuplicate ? (
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant="default" className="bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Allowed
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onUndo(transaction.id)}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : transaction.ignoreDuplicate ? (
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant="secondary">
                        <X className="h-3 w-3 mr-1" />
                        Ignored
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
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onIgnore(transaction.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Ignore
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onAllow(transaction.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Allow
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
