"use client";

import { AlertTriangle, CheckCircle2, ExternalLink, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PlaidSyncBannerProps {
  accountsUpdated: number;
  accountsFailed: number;
  errors: string[];
  onDismiss: () => void;
}

export function PlaidSyncBanner({
  accountsUpdated,
  accountsFailed,
  errors,
  onDismiss,
}: PlaidSyncBannerProps) {
  const hasErrors = accountsFailed > 0;
  const hasLoginErrors = errors.some(err => 
    err.includes("login details") || 
    err.includes("credentials") || 
    err.includes("required user action")
  );

  if (accountsUpdated === 0 && accountsFailed === 0) {
    return null;
  }

  return (
    <Alert
      variant={hasErrors ? "destructive" : "default"}
      className="relative"
    >
      <div className="flex items-start gap-3">
        {hasErrors ? (
          <AlertTriangle className="h-5 w-5 mt-0.5" />
        ) : (
          <CheckCircle2 className="h-5 w-5 mt-0.5" />
        )}
        
        <div className="flex-1 space-y-2">
          <AlertTitle>
            {hasErrors ? "Sync Partially Complete" : "Sync Complete"}
          </AlertTitle>
          
          <AlertDescription className="space-y-2">
            <p>
              {accountsUpdated > 0 && (
                <span className="font-medium">
                  {accountsUpdated} account{accountsUpdated === 1 ? "" : "s"} synced successfully
                </span>
              )}
              {accountsUpdated > 0 && accountsFailed > 0 && ", "}
              {accountsFailed > 0 && (
                <span className="font-medium">
                  {accountsFailed} account{accountsFailed === 1 ? "" : "s"} failed
                </span>
              )}
            </p>

            {hasLoginErrors && (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Some banks require re-authentication.
                </span>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="h-7 gap-1">
                    Go to Integrations
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}

            {errors.length > 0 && (
              <details className="text-sm mt-2">
                <summary className="cursor-pointer hover:underline">
                  View error details
                </summary>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i} className="text-xs">
                      {error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </AlertDescription>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
