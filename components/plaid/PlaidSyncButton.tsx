"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { invalidatePortfolio } from "@/lib/hooks/useDatabase";

interface PlaidSyncButtonProps {
  variant?: "default" | "secondary" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSyncComplete?: (result: {
    accountsUpdated: number;
    accountsFailed: number;
    errors: string[];
  }) => void;
}

export function PlaidSyncButton({ 
  variant = "secondary", 
  size = "sm",
  className,
  onSyncComplete
}: PlaidSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/plaid/balances", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync balances");
      }

      const data = await response.json();

      // Show success with details
      const updated = data.accountsUpdated || 0;
      const failed = data.accountsFailed || 0;

      // Invalidate portfolio cache to refresh UI with new balances
      if (updated > 0) {
        invalidatePortfolio();
      }

      // Pass results to parent component if callback provided
      if (onSyncComplete) {
        onSyncComplete({
          accountsUpdated: updated,
          accountsFailed: failed,
          errors: data.errors || [],
        });
      }

      if (updated > 0 && failed === 0) {
        toast.success(`Synced ${updated} account${updated === 1 ? '' : 's'} successfully with Plaid`);
      } else if (updated > 0 && failed > 0) {
        toast.warning(`Synced ${updated} account${updated === 1 ? '' : 's'}, ${failed} failed`);
        if (data.errors && data.errors.length > 0) {
          console.error('Sync errors:', data.errors);
        }
      } else if (failed > 0) {
        toast.error(`Failed to sync ${failed} account${failed === 1 ? '' : 's'}`);
        if (data.errors && data.errors.length > 0) {
          console.error('Sync errors:', data.errors);
        }
      } else {
        toast.info("No Plaid accounts to sync");
      }
    } catch (error) {
      console.error("Error syncing balances:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync balances");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isSyncing}
      className={className}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
      Sync Balances
    </Button>
  );
}
