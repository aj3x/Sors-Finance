import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-8xl font-bold text-muted-foreground/50">404</p>
        <div className="space-y-1">
          <h1 className="text-xl font-medium">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            This page doesn't exist or has been moved.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
