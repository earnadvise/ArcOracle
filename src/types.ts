export type MarketCategory = 'ALL' | 'CRYPTO' | 'AI' | 'SCIENCE' | 'POLITICS' | 'POP';

export interface PricePoint {
  timestamp: string;
  yesPrice: number;
}

export interface PredictionMarket {
  id: string;
  question: string;
  description: string;
  category: Exclude<MarketCategory, 'ALL'>;
  volume: number;
  endDate: string;
  resolutionSource: string;
  yesPrice: number; // probability between 0.01 and 0.99 (represents USDC cost per YES share)
  noPrice: number;  // 1 - yesPrice
  yesSharesPool: number; // CPMM pool reserve for YES
  noSharesPool: number;  // CPMM pool reserve for NO
  status: 'ACTIVE' | 'RESOLVED';
  winningOutcome?: 'YES' | 'NO';
  icon: string; // Lucide icon name
  sparklineData: number[]; // Last 10 price points for miniature sparklines
  history: PricePoint[]; // Full historical price points for the details page interactive chart
}

export interface Position {
  id: string; // marketId + '-' + outcome
  marketId: string;
  marketQuestion: string;
  outcome: 'YES' | 'NO';
  quantity: number; // quantity of shares owned
  avgBuyPrice: number; // average price paid per share (USDC)
  currentPrice: number; // current value of share (USDC)
  value: number; // quantity * currentPrice
  unrealizedPnL: number; // value - (quantity * avgBuyPrice)
  unrealizedPnLPct: number; // percentage profit/loss
}

export interface Transaction {
  id: string;
  marketId?: string;
  marketQuestion?: string;
  type: 'BUY' | 'SELL' | 'RESOLVE' | 'FAUCET' | 'DEPOSIT';
  outcome?: 'YES' | 'NO';
  amountUsdc: number; // amount of USDC involved
  sharesQuantity?: number; // amount of YES/NO shares traded
  pricePerShare?: number; // transaction price
  timestamp: string;
  txHash: string; // Mock or real transaction hash
}

export interface PortfolioSummary {
  netAssetValue: number;
  usdcBalance: number;
  totalPnL: number;
  totalPnLPct: number;
  totalTrades: number;
}
