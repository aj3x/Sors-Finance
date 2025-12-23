"use client";

import { useState } from "react";
import { Plus, FileSpreadsheet, Calendar, Hash, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "sonner";
import { TransactionImporter } from "@/components/TransactionImporter";
import { dummyImports, type ImportRecord } from "@/lib/dummyData";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

function ImportCard({ record }: { record: ImportRecord }) {
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{record.fileName}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(record.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {record.transactionCount} transactions
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(record.totalAmount)}
                </span>
              </div>
            </div>
          </div>
          <Badge variant={record.source === "CIBC" ? "default" : "secondary"}>
            {record.source}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TransactionsPage() {
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleImportComplete = () => {
    setIsImportOpen(false);
  };

  return (
    <>
      <Toaster position="bottom-right" richColors />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Import and categorize your bank transactions
            </p>
          </div>
          <Button onClick={() => setIsImportOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Import
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
            <CardDescription>
              View your past transaction imports and their details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dummyImports.map((record) => (
              <ImportCard key={record.id} record={record} />
            ))}
          </CardContent>
        </Card>

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Transactions</DialogTitle>
              <DialogDescription>
                Upload your bank statements and categorize transactions
              </DialogDescription>
            </DialogHeader>
            <TransactionImporter
              onComplete={handleImportComplete}
              onCancel={() => setIsImportOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
