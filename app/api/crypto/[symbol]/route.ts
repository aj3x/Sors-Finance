import { NextRequest, NextResponse } from 'next/server';

// Map Binance symbols to CoinGecko IDs
const symbolToCoingeckoId: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  LINK: 'chainlink',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  ETC: 'ethereum-classic',
  XLM: 'stellar',
  ALGO: 'algorand',
  VET: 'vechain',
  FIL: 'filecoin',
  AAVE: 'aave',
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  AXS: 'axie-infinity',
  SHIB: 'shiba-inu',
  APE: 'apecoin',
  CRO: 'crypto-com-chain',
  NEAR: 'near',
  FTM: 'fantom',
  EGLD: 'elrond-erd-2',
  HBAR: 'hedera-hashgraph',
  ICP: 'internet-computer',
  THETA: 'theta-token',
  XMR: 'monero',
  XTZ: 'tezos',
  EOS: 'eos',
  CAKE: 'pancakeswap-token',
  RUNE: 'thorchain',
  ZEC: 'zcash',
  NEO: 'neo',
  KAVA: 'kava',
  WAVES: 'waves',
  DASH: 'dash',
  COMP: 'compound-governance-token',
  MKR: 'maker',
  SNX: 'havven',
  ENJ: 'enjincoin',
  CHZ: 'chiliz',
  BAT: 'basic-attention-token',
  ZIL: 'zilliqa',
  ENS: 'ethereum-name-service',
  GRT: 'the-graph',
  ONE: 'harmony',
  FLOW: 'flow',
  LRC: 'loopring',
  KSM: 'kusama',
  QTUM: 'qtum',
  OP: 'optimism',
  ARB: 'arbitrum',
  SUI: 'sui',
  APT: 'aptos',
  INJ: 'injective-protocol',
  SEI: 'sei-network',
  TIA: 'celestia',
  PEPE: 'pepe',
  WIF: 'dogwifcoin',
  BONK: 'bonk',
  FLOKI: 'floki',
  BNB: 'binancecoin',
  TRX: 'tron',
  TON: 'the-open-network',
  USDT: 'tether',
  USDC: 'usd-coin',
};

// Map symbols to full names
const symbolToName: Record<string, string> = {
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
  BNB: 'BNB',
  TRX: 'Tron',
  TON: 'Toncoin',
  USDT: 'Tether',
  USDC: 'USD Coin',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Extract base symbol from Binance format (e.g., "BINANCE:BTCUSDT" -> "BTC")
    const displaySymbol = symbol.split(':')[1] || symbol;
    const baseSymbol = displaySymbol.replace(/USDT$|USD$|BUSD$/, '');

    // Get CoinGecko ID
    const coingeckoId = symbolToCoingeckoId[baseSymbol];
    if (!coingeckoId) {
      return NextResponse.json(
        { error: `Unknown crypto symbol: ${baseSymbol}` },
        { status: 404 }
      );
    }

    // Fetch price from CoinGecko (free, no API key needed)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in a minute.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    if (!response.ok) {
      console.error('CoinGecko error:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Failed to fetch crypto price' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const coinData = data[coingeckoId];

    if (!coinData || coinData.usd === undefined) {
      return NextResponse.json(
        { error: 'Crypto price not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol,
      displaySymbol,
      price: coinData.usd,
      currency: 'USD',
      name: symbolToName[baseSymbol] || baseSymbol,
      change: coinData.usd_24h_change || 0,
    });
  } catch (error) {
    console.error('Crypto price error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crypto data' },
      { status: 500 }
    );
  }
}
