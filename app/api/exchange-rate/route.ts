import { NextRequest, NextResponse } from 'next/server';

// Cache exchange rates for 1 hour
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from')?.toUpperCase() || 'USD';
    const to = searchParams.get('to')?.toUpperCase() || 'CAD';

    // Same currency, no conversion needed
    if (from === to) {
      return NextResponse.json({ rate: 1, from, to });
    }

    const cacheKey = `${from}${to}`;

    // Check cache
    const cached = rateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        rate: cached.rate,
        from,
        to,
        cached: true,
      });
    }

    // Fetch from Frankfurter API (free, no API key required)
    // https://www.frankfurter.app/docs/
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`
    );

    if (!response.ok) {
      // Try to get error message
      const errorText = await response.text();
      console.error('Frankfurter API error:', errorText);
      return NextResponse.json(
        { error: 'Exchange rate not found' },
        { status: 404 }
      );
    }

    const data: FrankfurterResponse = await response.json();

    if (!data.rates || data.rates[to] === undefined) {
      return NextResponse.json(
        { error: 'Exchange rate not found' },
        { status: 404 }
      );
    }

    const rate = data.rates[to];

    // Cache the result
    rateCache.set(cacheKey, { rate, timestamp: Date.now() });

    return NextResponse.json({ rate, from, to });
  } catch (error) {
    console.error('Exchange rate error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 500 }
    );
  }
}
