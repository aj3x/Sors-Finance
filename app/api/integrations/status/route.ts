/**
 * API Route: Check Integration Configuration Status
 * GET /api/integrations/status
 * 
 * Returns whether API keys are configured (does NOT test if they are valid)
 * Does NOT require authentication - public endpoint for settings page
 */

import { NextResponse } from "next/server";
import { isPlaidConfigured } from "@/lib/plaid/client";

export async function GET() {
  try {
    const finnhubConfigured = !!process.env.FINNHUB_API_KEY;
    const plaidConfigured = isPlaidConfigured();

    return NextResponse.json({
      finnhub: finnhubConfigured,
      plaid: plaidConfigured,
    });
  } catch (error) {
    console.error("Failed to check integration status:", error);
    return NextResponse.json(
      { error: "Failed to check integration status" },
      { status: 500 }
    );
  }
}
