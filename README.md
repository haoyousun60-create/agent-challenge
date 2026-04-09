# Crypto Portfolio Monitor Agent 🤖💰

A personal AI agent for monitoring cryptocurrency portfolios, built with ElizaOS and deployed on Nosana's decentralized GPU network.

## 🌟 Features

### Core Features
- **Real-time Price Check** - Query prices for DOGE, ADA, XRP, BTC, ETH, SOL via CoinGecko API
- **Price Alerts** - Set alerts for price movements (above/below thresholds)
- **Portfolio Tracking** - Monitor multiple cryptocurrency holdings
- **Market News** - Stay updated with latest crypto news

### Supported Cryptocurrencies
| Symbol | Name | 
|--------|------|
| DOGE | Dogecoin |
| ADA | Cardano |
| XRP | Ripple |
| BTC | Bitcoin |
| ETH | Ethereum |
| SOL | Solana |

## 🚀 Quick Start

### Prerequisites
- Node.js 23+
- Bun runtime
- Docker (for deployment)
- Nosana account

### Local Development

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Start agent in development mode
bun run dev
```

### Deploy to Nosana

```bash
# Build Docker image
docker build -t yourusername/crypto-agent:latest .

# Push to Docker Hub
docker push yourusername/crypto-agent:latest

# Deploy via Nosana dashboard
```

## 📁 Project Structure

```
├── characters/
│   └── crypto-agent.character.json  # Agent personality
├── src/
│   └── index.ts                    # Custom plugin (crypto monitoring)
├── .env                            # Environment variables
├── Dockerfile                      # Container config
└── README.md
```

## 🎯 Use Cases

- Monitor your crypto holdings 24/7
- Set price alerts for buying/selling
- Get market insights and news
- Track portfolio performance

## 💡 Example Commands

- "What's the price of DOGE?"
- "Alert me when ADA drops below $0.50"
- "Show me my portfolio"
- "Any news about Solana?"

## 🌐 Live Demo

Agent deployed on Nosana GPU network: [Coming Soon]

## 📜 License

MIT - Built by 马上发财 (Ma-Shang-Fa-Cai) 💰

---

**Built with ElizaOS · Deployed on Nosana · Powered by Qwen3.5**
