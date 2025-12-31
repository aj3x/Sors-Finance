import { NextRequest, NextResponse } from 'next/server';

interface FinnhubCryptoSymbol {
  description: string; // e.g., "Binance BTCUSDT"
  displaySymbol: string; // e.g., "BTC/USDT"
  symbol: string; // e.g., "BINANCE:BTCUSDT"
}

// Cache crypto symbols to avoid repeated API calls
let cachedSymbols: FinnhubCryptoSymbol[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';
    const apiKey = request.headers.get('x-finnhub-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured', code: 'NO_API_KEY' },
        { status: 401 }
      );
    }

    // Fetch and cache crypto symbols if not cached or cache expired
    if (!cachedSymbols || Date.now() - cacheTimestamp > CACHE_DURATION) {
      const response = await fetch(
        `https://finnhub.io/api/v1/crypto/symbol?exchange=binance&token=${apiKey}`
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
          { error: 'Failed to fetch crypto symbols' },
          { status: 500 }
        );
      }

      cachedSymbols = await response.json();
      cacheTimestamp = Date.now();
    }

    if (!query) {
      // Return popular cryptos when no search query
      const popular = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LINK'];
      const results = cachedSymbols!
        .filter(s => {
          const base = s.displaySymbol.split('/')[0];
          return popular.includes(base) && s.displaySymbol.endsWith('/USDT');
        })
        .slice(0, 10)
        .map(s => ({
          symbol: s.symbol,
          displaySymbol: s.displaySymbol,
          name: getCryptoName(s.displaySymbol.split('/')[0]),
          type: 'Crypto',
        }));

      return NextResponse.json({ results });
    }

    // Search through cached symbols
    const results = cachedSymbols!
      .filter(s => {
        const base = s.displaySymbol.split('/')[0].toLowerCase();
        const searchLower = query.toLowerCase();
        // Match base symbol (BTC, ETH) or description
        return (
          (base.includes(searchLower) ||
           s.description.toLowerCase().includes(searchLower) ||
           getCryptoName(s.displaySymbol.split('/')[0]).toLowerCase().includes(searchLower)) &&
          s.displaySymbol.endsWith('/USDT') // Only show USDT pairs for simplicity
        );
      })
      .slice(0, 10)
      .map(s => ({
        symbol: s.symbol,
        displaySymbol: s.displaySymbol,
        name: getCryptoName(s.displaySymbol.split('/')[0]),
        type: 'Crypto',
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Crypto search error:', error);
    return NextResponse.json(
      { error: 'Failed to search crypto symbols' },
      { status: 500 }
    );
  }
}

// Map common crypto symbols to full names
function getCryptoName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
    XRP: 'Ripple',
    ADA: 'Cardano',
    DOGE: 'Dogecoin',
    DOT: 'Polkadot',
    LINK: 'Chainlink',
    AVAX: 'Avalanche',
    MATIC: 'Polygon',
    UNI: 'Uniswap',
    ATOM: 'Cosmos',
    LTC: 'Litecoin',
    ETC: 'Ethereum Classic',
    XLM: 'Stellar',
    ALGO: 'Algorand',
    VET: 'VeChain',
    FIL: 'Filecoin',
    AAVE: 'Aave',
    SAND: 'The Sandbox',
    MANA: 'Decentraland',
    AXS: 'Axie Infinity',
    SHIB: 'Shiba Inu',
    APE: 'ApeCoin',
    CRO: 'Cronos',
    NEAR: 'NEAR Protocol',
    FTM: 'Fantom',
    EGLD: 'MultiversX',
    HBAR: 'Hedera',
    ICP: 'Internet Computer',
    THETA: 'Theta Network',
    XMR: 'Monero',
    XTZ: 'Tezos',
    EOS: 'EOS',
    CAKE: 'PancakeSwap',
    RUNE: 'THORChain',
    ZEC: 'Zcash',
    NEO: 'Neo',
    KAVA: 'Kava',
    WAVES: 'Waves',
    DASH: 'Dash',
    COMP: 'Compound',
    MKR: 'Maker',
    SNX: 'Synthetix',
    ENJ: 'Enjin Coin',
    CHZ: 'Chiliz',
    BAT: 'Basic Attention Token',
    ZIL: 'Zilliqa',
    ENS: 'Ethereum Name Service',
    GRT: 'The Graph',
    ONE: 'Harmony',
    FLOW: 'Flow',
    LRC: 'Loopring',
    KSM: 'Kusama',
    QTUM: 'Qtum',
    OP: 'Optimism',
    ARB: 'Arbitrum',
    SUI: 'Sui',
    APT: 'Aptos',
    INJ: 'Injective',
    SEI: 'Sei',
    TIA: 'Celestia',
    PEPE: 'Pepe',
    WIF: 'dogwifhat',
    BONK: 'Bonk',
    FLOKI: 'Floki',
  };
  return names[symbol] || symbol;
}
