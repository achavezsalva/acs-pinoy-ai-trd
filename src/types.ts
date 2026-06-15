export interface AnalysisResult {
  symbol: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  targetPrice: string;
  stopLoss: string;
  reasoning: string[];
  marketSentiment: string;
  technicalIndicators: {
    rsi: string;
    macd: string;
    movingAverages: string;
  };
  fallback?: boolean;
}

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  type: "crypto" | "stock";
  prices24h: number[]; // Sparkline data values
}

export interface Trade {
  id: string;
  timestamp: string;
  symbol: string;
  type: "BUY" | "SELL";
  price: number;
  amount: number;
  status: "ACTIVE" | "COMPLETED" | "LIQUIDATED";
  roi?: number;
  autoCloseOnProfit?: boolean;
  takeProfitMode?: "PERCENT" | "PIPS";
  takeProfitPercent?: number; // e.g. 0.5% or 1% or 2% target auto-close profit percentage
  takeProfitPips?: number; // target pips for auto-close (e.g. 10, 50, 100 pips)
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: "ABOVE" | "BELOW";
  isActive: boolean;
  createdAt: string;
}

