import { NextRequest, NextResponse } from 'next/server';

interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

interface FinnhubProfile {
  name: string;
  ticker: string;
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  shareOutstanding: number;
  logo: string;
  phone: string;
  weburl: string;
  finnhubIndustry: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const apiKey = request.headers.get('x-finnhub-key');

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured', code: 'NO_API_KEY' },
        { status: 401 }
      );
    }

    const upperTicker = ticker.toUpperCase();

    // Fetch quote and profile in parallel
    const [quoteResponse, profileResponse] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${upperTicker}&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${upperTicker}&token=${apiKey}`),
    ]);

    if (quoteResponse.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }

    if (quoteResponse.status === 429 || profileResponse.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    if (!quoteResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch stock data' },
        { status: 500 }
      );
    }

    const quote: FinnhubQuote = await quoteResponse.json();

    // Finnhub returns 0 for all values if ticker not found
    if (quote.c === 0 && quote.pc === 0 && quote.t === 0) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      );
    }

    // Try to get company profile for the name
    let companyName = upperTicker;
    let currency = 'USD';

    if (profileResponse.ok) {
      const profile: FinnhubProfile = await profileResponse.json();
      if (profile.name) {
        companyName = profile.name;
      }
      if (profile.currency) {
        currency = profile.currency;
      }
    }

    return NextResponse.json({
      ticker: upperTicker,
      price: quote.c,
      currency,
      name: companyName,
      change: quote.dp,
      previousClose: quote.pc,
      marketState: 'open',
    });
  } catch (error) {
    console.error('Finnhub error:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }

    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
