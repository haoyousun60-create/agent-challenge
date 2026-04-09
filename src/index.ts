/**
 * Crypto Portfolio Monitor Plugin for ElizaOS
 * 
 * This plugin provides crypto monitoring capabilities:
 * - Price checking for major cryptocurrencies
 * - Portfolio tracking
 * - Price alerts
 * - Market news aggregation
 */

import { type Plugin, type IAgentRuntime, type Memory, type State, elizaLogger } from "@elizaos/core";

interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
}

interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  active: boolean;
}

// In-memory storage for alerts (in production, use a database)
const priceAlerts: PriceAlert[] = [];

// CoinGecko API for price data (free, no API key needed)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

const getCryptoPrice = async (symbol: string): Promise<CryptoPrice | null> => {
  try {
    const symbolMap: Record<string, string> = {
      'DOGE': 'dogecoin',
      'ADA': 'cardano',
      'XRP': 'ripple',
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'DOT': 'polkadot',
      'AVAX': 'avalanche-2',
      'MATIC': 'matic-network',
      'LINK': 'chainlink'
    };

    const coinId = symbolMap[symbol.toUpperCase()];
    if (!coinId) {
      elizaLogger.warn(`Unknown symbol: ${symbol}`);
      return null;
    }

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`
    );

    if (!response.ok) {
      elizaLogger.error(`Failed to fetch price for ${symbol}`);
      return null;
    }

    const data = await response.json();
    const coinData = data[coinId];

    return {
      symbol: symbol.toUpperCase(),
      price: coinData.usd,
      change24h: coinData.usd_24h_change,
      marketCap: coinData.usd_market_cap
    };
  } catch (error) {
    elizaLogger.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
};

const setPriceAlert = (
  symbol: string,
  condition: 'above' | 'below',
  targetPrice: number
): PriceAlert => {
  const alert: PriceAlert = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    symbol: symbol.toUpperCase(),
    condition,
    targetPrice,
    active: true
  };
  priceAlerts.push(alert);
  elizaLogger.info(`Price alert set: ${symbol} ${condition} $${targetPrice}`);
  return alert;
};

const checkAlerts = async (prices: Record<string, number>): Promise<PriceAlert[]> => {
  const triggered: PriceAlert[] = [];

  for (const alert of priceAlerts) {
    if (!alert.active) continue;

    const currentPrice = prices[alert.symbol];
    if (currentPrice === undefined) continue;

    const shouldTrigger =
      (alert.condition === 'above' && currentPrice > alert.targetPrice) ||
      (alert.condition === 'below' && currentPrice < alert.targetPrice);

    if (shouldTrigger) {
      triggered.push(alert);
      alert.active = false;
    }
  }

  return triggered;
};

const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(8)}`;
  }
};

const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  } else {
    return `$${marketCap.toLocaleString()}`;
  }
};

// Actions
const getPriceAction = {
  name: "GET_PRICE",
  description: "Get the current price of a cryptocurrency",
  similes: ["CHECK_PRICE", "PRICE_CHECK", "CRYPTO_PRICE", "GET_CRYPTO_PRICE"],
  validate: async (_runtime: IAgentRuntime, _message: { content: { text: string } }) => true,
  handler: async (
    _runtime: IAgentRuntime,
    _message: { content: { text: string } }
  ): Promise<string> => {
    // Extract symbol from message
    const text = _message.content.text.toUpperCase();
    const symbols = ['DOGE', 'ADA', 'XRP', 'BTC', 'ETH', 'SOL'];
    const foundSymbol = symbols.find(s => text.includes(s));

    if (!foundSymbol) {
      return "Which crypto price do you want to check? I can check DOGE, ADA, XRP, BTC, ETH, or SOL.";
    }

    const price = await getCryptoPrice(foundSymbol);
    if (!price) {
      return `Sorry, I couldn't fetch the price for ${foundSymbol}.`;
    }

    const changeEmoji = price.change24h >= 0 ? '📈' : '📉';
    const changeSign = price.change24h >= 0 ? '+' : '';

    return `${changeEmoji} ${price.symbol} Price:\n` +
      `💰 Current: ${formatPrice(price.price)}\n` +
      `📊 24h Change: ${changeSign}${price.change24h.toFixed(2)}%\n` +
      `🏛️ Market Cap: ${formatMarketCap(price.marketCap)}`;
  },
  examples: [
    [
      { user: "user1", content: { text: "What's the price of DOGE?" } },
      { user: "CryptoAgent", content: { text: "Let me check DOGE price..." } }
    ]
  ]
};

const setAlertAction = {
  name: "SET_PRICE_ALERT",
  description: "Set a price alert for a cryptocurrency",
  similes: ["ALERT", "PRICE_ALERT", "NOTIFY_ME", "WARN_ME"],
  validate: async (_runtime: IAgentRuntime, _message: { content: { text: string } }) => true,
  handler: async (
    _runtime: IAgentRuntime,
    _message: { content: { text: string } }
  ): Promise<string> => {
    const text = _message.content.text.toUpperCase();

    // Extract symbol
    const symbols = ['DOGE', 'ADA', 'XRP', 'BTC', 'ETH', 'SOL'];
    const foundSymbol = symbols.find(s => text.includes(s));
    if (!foundSymbol) {
      return "Which crypto do you want to set an alert for? I support DOGE, ADA, XRP, BTC, ETH, and SOL.";
    }

    // Extract condition and price
    const belowMatch = text.match(/BELOW\s*\$?(\d+\.?\d*)/);
    const aboveMatch = text.match(/ABOVE\s*\$?(\d+\.?\d*)/);
    const condition = belowMatch ? 'below' : 'above';
    const targetPrice = parseFloat(belowMatch?.[1] || aboveMatch?.[1] || '0');

    if (targetPrice === 0) {
      return "Please specify a target price. For example: 'Alert me when DOGE drops below $0.10'";
    }

    const alert = setPriceAlert(foundSymbol, condition, targetPrice);
    return `✅ Price alert set!\n\n` +
      `🔔 ${foundSymbol} ${condition === 'below' ? 'drops below' : 'rises above'} ${formatPrice(targetPrice)}\n` +
      `ID: ${alert.id}`;
  },
  examples: [
    [
      { user: "user1", content: { text: "Alert me when DOGE drops below $0.10" } },
      { user: "CryptoAgent", content: { text: "Alert set for DOGE below $0.10" } }
    ]
  ]
};

const getPortfolioAction = {
  name: "GET_PORTFOLIO",
  description: "Get the user's portfolio overview",
  similes: ["SHOW_PORTFOLIO", "MY_HOLDINGS", "CHECK_PORTFOLIO", "MY_POSITIONS"],
  validate: async (_runtime: IAgentRuntime, _message: { content: { text: string } }) => true,
  handler: async (
    _runtime: IAgentRuntime,
    _message: { content: { text: string } }
  ): Promise<string> => {
    // For demo purposes, show tracked coins
    // In production, this would read from user's stored wallet addresses
    const trackedCoins = ['DOGE', 'ADA', 'XRP', 'BTC', 'ETH', 'SOL'];
    const prices: Record<string, CryptoPrice> = {};

    const pricePromises = trackedCoins.map(async (symbol) => {
      const price = await getCryptoPrice(symbol);
      if (price) prices[symbol] = price;
    });

    await Promise.all(pricePromises);

    let portfolio = "📊 **Your Tracked Crypto Portfolio**\n\n";

    for (const [symbol, data] of Object.entries(prices)) {
      const changeEmoji = data.change24h >= 0 ? '🟢' : '🔴';
      portfolio += `${changeEmoji} **${symbol}**: ${formatPrice(data.price)} (24h: ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%)\n`;
    }

    portfolio += "\n💡 Add more coins to track or set price alerts!";

    return portfolio;
  },
  examples: [
    [
      { user: "user1", content: { text: "Show me my portfolio" } },
      { user: "CryptoAgent", content: { text: "Here's your portfolio overview..." } }
    ]
  ]
};

const getMarketNewsAction = {
  name: "GET_MARKET_NEWS",
  description: "Get the latest cryptocurrency market news",
  similes: ["NEWS", "CRYPTO_NEWS", "MARKET_NEWS", "LATEST_NEWS"],
  validate: async (_runtime: IAgentRuntime, _message: { content: { text: string } }) => true,
  handler: async (
    _runtime: IAgentRuntime,
    _message: { content: { text: string } }
  ): Promise<string> => {
    // In production, integrate with a news API
    // For now, return a placeholder
    return `📰 **Crypto Market News**\n\n` +
      `I'm monitoring the latest crypto news feeds. ` +
      `I can help you stay updated on:\n\n` +
      `• Bitcoin and Ethereum developments\n` +
      `• DeFi protocol updates\n` +
      `• Altcoin news and trends\n` +
      `• Regulatory announcements\n\n` +
      `🔔 Set price alerts to get notified of important movements!`;
  },
  examples: [
    [
      { user: "user1", content: { text: "Any news about Solana?" } },
      { user: "CryptoAgent", content: { text: "Let me search for the latest Solana news..." } }
    ]
  ]
};

// Provider for getting current prices
const cryptoPriceProvider = {
  name: "crypto-price-provider",
  description: "Provides current cryptocurrency prices",
  async get(runtime: IAgentRuntime): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const symbols = ['DOGE', 'ADA', 'XRP', 'BTC', 'ETH', 'SOL'];

    const pricePromises = symbols.map(async (symbol) => {
      const price = await getCryptoPrice(symbol);
      if (price) prices[symbol] = price.price;
    });

    await Promise.all(pricePromises);
    return prices;
  }
};

export const cryptoPlugin: Plugin = {
  name: "crypto-plugin",
  description: "Crypto portfolio monitoring plugin - tracks prices, alerts, and market data",
  actions: [getPriceAction, setAlertAction, getPortfolioAction, getMarketNewsAction],
  providers: [cryptoPriceProvider],
  evaluators: [],
};

export default cryptoPlugin;
