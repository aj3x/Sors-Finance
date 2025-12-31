"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Key, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { getFinnhubApiKey, setFinnhubApiKey } from "@/lib/settingsStore";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | undefined>();
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const key = getFinnhubApiKey();
    setSavedKey(key);
    if (key) {
      setApiKey(key);
    }
  }, []);

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      // Clear the key
      setFinnhubApiKey(undefined);
      setSavedKey(undefined);
      toast.success("API key removed");
      return;
    }

    // Validate the key by making a test request
    setIsValidating(true);
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${trimmedKey}`
      );

      if (response.status === 401) {
        toast.error("Invalid API key");
        return;
      }

      if (response.status === 429) {
        toast.error("Rate limit exceeded. Try again later.");
        return;
      }

      if (!response.ok) {
        toast.error("Failed to validate API key");
        return;
      }

      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Key is valid, save it
      setFinnhubApiKey(trimmedKey);
      setSavedKey(trimmedKey);
      toast.success("API key saved and validated");
    } catch (error) {
      console.error("Error validating API key:", error);
      toast.error("Failed to validate API key");
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setFinnhubApiKey(undefined);
    setSavedKey(undefined);
    setApiKey("");
    toast.success("API key removed");
  };

  const hasKey = Boolean(savedKey);

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your app preferences and integrations
        </p>
      </div>

      {/* Stock Data API Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Stock Price Data
          </CardTitle>
          <CardDescription>
            Connect to Finnhub to get real-time stock prices for your
            investments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {hasKey ? (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                Not configured
              </span>
            )}
          </div>

          {/* Explanation when no key */}
          {!hasKey && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No API key configured</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Without a Finnhub API key, you will need to{" "}
                  <strong>manually update stock prices</strong> for your
                  investments. The automatic price refresh feature will not
                  work.
                </p>
                <p>
                  Finnhub offers a <strong>free tier</strong> with 60 API
                  calls per minute - more than enough for personal portfolio
                  tracking.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">Finnhub API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Finnhub API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
              <Button onClick={handleSave} disabled={isValidating}>
                {isValidating ? "Validating..." : "Save"}
              </Button>
              {hasKey && (
                <Button variant="outline" onClick={handleClear}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Your API key is stored locally in your browser and never sent to
              our servers.
            </p>
          </div>

          {/* How to get an API key */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium">How to get a free Finnhub API key:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Go to{" "}
                <a
                  href="https://finnhub.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  finnhub.io
                </a>
              </li>
              <li>Click &quot;Get free API key&quot; and sign up with your email</li>
              <li>Copy your API key from the dashboard</li>
              <li>Paste it above and click Save</li>
            </ol>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://finnhub.io/register"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Sign up for Finnhub (free)
              </a>
            </Button>
          </div>

          {/* Free tier info */}
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <strong>Free tier includes:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>60 API calls per minute</li>
              <li>Real-time US stock prices</li>
              <li>Forex rates</li>
              <li>No credit card required</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
