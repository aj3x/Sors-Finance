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

    // Fetch quote from Finnhub
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker.toUpperCase()}&token=${apiKey}`
    );

    if (response.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }

    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch stock data' },
        { status: 500 }
      );
    }

    const quote: FinnhubQuote = await response.json();

    // Finnhub returns 0 for all values if ticker not found
    if (quote.c === 0 && quote.pc === 0 && quote.t === 0) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      price: quote.c,
      currency: 'USD', // Finnhub returns USD prices for US stocks
      name: ticker.toUpperCase(), // Finnhub quote doesn't include name
      change: quote.dp,
      previousClose: quote.pc,
      marketState: 'open', // Finnhub doesn't provide market state in quote
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
