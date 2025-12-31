"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { toast } from "sonner";

interface SnapshotProgress {
  isRunning: boolean;
  total: number;
  completed: number;
  failed: number;
  currentTicker?: string;
}

interface SnapshotContextType {
  progress: SnapshotProgress;
  startBackgroundSnapshot: (options?: { forceUpdate?: boolean }) => Promise<void>;
  isSnapshotInProgress: boolean;
}

const SnapshotContext = createContext<SnapshotContextType | undefined>(undefined);

// Rate limit: 60 requests per minute = 1 request per second to be safe
const RATE_LIMIT_DELAY_MS = 1100; // Slightly over 1 second to be safe

export function SnapshotProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<SnapshotProgress>({
    isRunning: false,
    total: 0,
    completed: 0,
    failed: 0,
  });

  const isRunningRef = useRef(false);

  const startBackgroundSnapshot = useCallback(async (options?: { forceUpdate?: boolean }) => {
    // Prevent multiple concurrent snapshots
    if (isRunningRef.current) {
      toast.info("Snapshot already in progress");
      return;
    }

    const { forceUpdate = false } = options || {};

    // Import dynamically to avoid circular dependencies
    const {
      hasSnapshotToday,
      getTodaySnapshot,
      deletePortfolioSnapshot,
      createPortfolioSnapshot,
      getTickerModeItems,
      updatePortfolioItem
    } = await import("./hooks/useDatabase");
    const { lookupTicker, getExchangeRate } = await import("./hooks/useStockPrice");
    const { hasFinnhubApiKey } = await import("./settingsStore");

    // Check if we already have a snapshot today
    const existsToday = await hasSnapshotToday();
    if (existsToday && !forceUpdate) {
      return; // Silently skip if already exists
    }

    // Get ticker items
    const tickerItems = await getTickerModeItems();

    // If no ticker items or no API key, just create snapshot directly
    if (tickerItems.length === 0 || !hasFinnhubApiKey()) {
      if (forceUpdate && existsToday) {
        const todaySnapshot = await getTodaySnapshot();
        if (todaySnapshot?.id) {
          await deletePortfolioSnapshot(todaySnapshot.id);
        }
      }

      try {
        await createPortfolioSnapshot();
        toast.success("Portfolio snapshot saved");
      } catch {
        toast.error("Failed to create snapshot");
      }
      return;
    }

    // Start background processing
    isRunningRef.current = true;
    setProgress({
      isRunning: true,
      total: tickerItems.length,
      completed: 0,
      failed: 0,
    });

    // Show initial toast for many tickers
    if (tickerItems.length > 50) {
      toast.info(`Updating ${tickerItems.length} stock prices. This may take a few minutes...`);
    }

    let completedCount = 0;
    let failedCount = 0;
    const failedItems: Array<{ ticker: string; name: string }> = [];

    // Process tickers with rate limiting
    for (let i = 0; i < tickerItems.length; i++) {
      const item = tickerItems[i];
      if (!item.ticker) continue;

      setProgress(prev => ({
        ...prev,
        currentTicker: item.ticker,
      }));

      try {
        const quote = await lookupTicker(item.ticker);

        if (!quote) {
          failedCount++;
          failedItems.push({ ticker: item.ticker, name: item.name });
        } else {
          // Get exchange rate if currency differs
          let exchangeRate = 1;
          if (quote.currency !== "CAD") {
            exchangeRate = await getExchangeRate(quote.currency, "CAD");
          }

          // Calculate new value
          const newValue = (item.quantity || 0) * quote.price * exchangeRate;

          // Update the item
          await updatePortfolioItem(item.id!, {
            pricePerUnit: quote.price,
            currency: quote.currency,
            currentValue: newValue,
            lastPriceUpdate: new Date(),
          });

          completedCount++;
        }
      } catch {
        failedCount++;
        failedItems.push({ ticker: item.ticker!, name: item.name });
      }

      setProgress(prev => ({
        ...prev,
        completed: completedCount,
        failed: failedCount,
      }));

      // Rate limit delay (skip on last item)
      if (i < tickerItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      }
    }

    // Done with price updates, create snapshot
    if (failedCount === 0) {
      // All succeeded, create snapshot
      if (forceUpdate && existsToday) {
        const todaySnapshot = await getTodaySnapshot();
        if (todaySnapshot?.id) {
          await deletePortfolioSnapshot(todaySnapshot.id);
        }
      }

      try {
        await createPortfolioSnapshot();
        toast.success(`Portfolio snapshot saved (${completedCount} prices updated)`);
      } catch {
        toast.error("Failed to create snapshot");
      }
    } else {
      // Some failed, still create snapshot but warn
      if (forceUpdate && existsToday) {
        const todaySnapshot = await getTodaySnapshot();
        if (todaySnapshot?.id) {
          await deletePortfolioSnapshot(todaySnapshot.id);
        }
      }

      try {
        await createPortfolioSnapshot();
        toast.warning(
          `Snapshot saved with ${failedCount} failed price update${failedCount > 1 ? "s" : ""}. ` +
          `Check: ${failedItems.slice(0, 3).map(f => f.ticker).join(", ")}${failedItems.length > 3 ? "..." : ""}`
        );
      } catch {
        toast.error("Failed to create snapshot");
      }
    }

    // Reset state
    isRunningRef.current = false;
    setProgress({
      isRunning: false,
      total: 0,
      completed: 0,
      failed: 0,
    });
  }, []);

  return (
    <SnapshotContext.Provider
      value={{
        progress,
        startBackgroundSnapshot,
        isSnapshotInProgress: progress.isRunning,
      }}
    >
      {children}
    </SnapshotContext.Provider>
  );
}

export function useSnapshot() {
  const context = useContext(SnapshotContext);
  if (!context) {
    throw new Error("useSnapshot must be used within a SnapshotProvider");
  }
  return context;
}
