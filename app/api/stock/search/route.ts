import { NextRequest, NextResponse } from 'next/server';

interface FinnhubSearchResult {
  count: number;
  result: Array<{
    description: string; // Company name
    displaySymbol: string;
    symbol: string;
    type: string; // "Common Stock", "ETP", "ADR", etc.
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const apiKey = request.headers.get('x-finnhub-key');

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured', code: 'NO_API_KEY' },
        { status: 401 }
      );
    }

    // Search for symbols using Finnhub symbol search
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`
    );

    if (response.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }

    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to search symbols' },
        { status: 500 }
      );
    }

    const data: FinnhubSearchResult = await response.json();

    // Filter and map results - prioritize stocks over other types
    const results = data.result
      .filter(item => {
        // Filter out empty or invalid entries
        if (!item.symbol || !item.description) return false;
        // Prioritize common stocks, ETFs, ADRs
        const validTypes = ['Common Stock', 'ETP', 'ADR', 'ETF', 'REIT', 'Unit', 'Depositary Receipt'];
        return validTypes.some(t => item.type?.includes(t)) || !item.type;
      })
      .slice(0, 10) // Limit to 10 results
      .map(item => ({
        symbol: item.symbol,
        displaySymbol: item.displaySymbol,
        name: item.description,
        type: item.type || 'Stock',
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Symbol search error:', error);
    return NextResponse.json(
      { error: 'Failed to search symbols' },
      { status: 500 }
    );
  }
}
