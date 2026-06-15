import { useState, useEffect, useRef, FormEvent } from "react";
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Zap,
  Play,
  X,
  Plus,
  ShieldCheck,
  Cpu,
  RefreshCw,
  LineChart as LucideLineChart,
  DollarSign,
  Layers,
  Globe,
  Settings,
  Flame,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  History,
  Briefcase,
  ChevronRight,
  Loader2,
  Terminal,
  Activity,
  ArrowRightLeft,
  Bell,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Asset, Trade, AnalysisResult, PriceAlert } from "./types";

const PHP_RATE = 58;

const formatPriceField = (val: string | number | undefined): string => {
  if (val === undefined || val === null) return "";
  const strVal = String(val).trim();
  if (strVal.startsWith("₱")) return strVal;
  if (strVal.startsWith("$")) {
    const numericStr = strVal.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(numericStr);
    if (!isNaN(parsed)) {
      const converted = parsed < 120000 ? parsed * PHP_RATE : parsed;
      return "₱" + converted.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    return strVal.replace("$", "₱");
  }
  const parsed = parseFloat(strVal.replace(/,/g, ""));
  if (!isNaN(parsed)) {
    const converted = parsed < 120000 ? parsed * PHP_RATE : parsed;
    return "₱" + converted.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return "₱" + strVal;
};

const getPipValue = (symbol: string): number => {
  if (symbol === "BTC") return 100; // 1 pip = ₱100
  if (symbol === "ETH") return 10;   // 1 pip = ₱10
  return 1;                          // 1 pip = ₱1 for SOL, NVDA, AAPL, TSLA
};

const INITIAL_ASSETS: Asset[] = [
  { symbol: "BTC", name: "Bitcoin", price: 69420.50 * PHP_RATE, change24h: 3.42, type: "crypto", prices24h: [68100, 68400, 68300, 68900, 69100, 69050, 69420.50].map(p => p * PHP_RATE) },
  { symbol: "ETH", name: "Ethereum", price: 3450.25 * PHP_RATE, change24h: 1.84, type: "crypto", prices24h: [3380, 3410, 3395, 3420, 3450, 3430, 3450.25].map(p => p * PHP_RATE) },
  { symbol: "SOL", name: "Solana", price: 172.85 * PHP_RATE, change24h: 5.91, type: "crypto", prices24h: [160, 163, 165, 168, 171, 169, 172.85].map(p => p * PHP_RATE) },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 124.65 * PHP_RATE, change24h: 4.15, type: "stock", prices24h: [118, 120, 121, 123, 122, 124, 124.65].map(p => p * PHP_RATE) },
  { symbol: "AAPL", name: "Apple Inc.", price: 189.30 * PHP_RATE, change24h: -0.65, type: "stock", prices24h: [191, 190.5, 190, 189.5, 189, 189.2, 189.30].map(p => p * PHP_RATE) },
  { symbol: "TSLA", name: "Tesla Inc.", price: 215.40 * PHP_RATE, change24h: -2.31, type: "stock", prices24h: [221, 219, 220, 217, 216, 214, 215.40].map(p => p * PHP_RATE) },
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"platform" | "terminal" | "backtests">("platform");

  // Market Tickers State
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(INITIAL_ASSETS[0]);

  // AI Inference & Configuration State
  const [timeframe, setTimeframe] = useState<string>("H4");
  const [riskProfile, setRiskProfile] = useState<string>("balanced");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showInferenceHistory, setShowInferenceHistory] = useState<boolean>(false);
  const [inferenceLogs, setInferenceLogs] = useState<AnalysisResult[]>([]);

  // Simulation Wallet & Trades State
  const [cash, setCash] = useState<number>(50000.00 * PHP_RATE);
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [completedTrades, setCompletedTrades] = useState<Trade[]>([]);
  const [tradeSize, setTradeSize] = useState<number>(5000 * PHP_RATE);
  const [tradeMessage, setTradeMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [botAutoClose, setBotAutoClose] = useState<boolean>(true);
  const [botTakeProfitMode, setBotTakeProfitMode] = useState<"PERCENT" | "PIPS">("PERCENT");
  const [botTakeProfitPercent, setBotTakeProfitPercent] = useState<number>(1.5);
  const [botTakeProfitPips, setBotTakeProfitPips] = useState<number>(50);

  // Backtester simulation state
  const [isBacktesting, setIsBacktesting] = useState<boolean>(false);
  const [backtestProgress, setBacktestProgress] = useState<number>(0);
  const [backtestLogs, setBacktestLogs] = useState<string[]>([]);
  const [backtestResult, setBacktestResult] = useState<{
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    netReturn: number;
    sharpeRatio: number;
  } | null>(null);

  // System notification banner
  const [notification, setNotification] = useState<string | null>(
    "✓ NEURAL ACCESS: Dynamic sandbox connected with 6 high-fidelity sub-second pricing nodes."
  );

  // Sound toggle (visual only for premium experience)
  const [neuralAudioFeedback, setNeuralAudioFeedback] = useState<boolean>(true);

  // Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertPrice, setAlertPrice] = useState<string>("");
  const [alertCondition, setAlertCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Keep alert price aligned to current selected asset default
  useEffect(() => {
    if (selectedAsset) {
      setAlertPrice(selectedAsset.price.toString());
    }
  }, [selectedAsset.symbol]);

  // Monitor price alerts whenever assets update
  useEffect(() => {
    if (alerts.length === 0) return;
    
    alerts.forEach(alert => {
      if (!alert.isActive) return;
      const asset = assets.find(a => a.symbol === alert.symbol);
      if (!asset) return;

      let triggered = false;
      if (alert.condition === "ABOVE" && asset.price >= alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === "BELOW" && asset.price <= alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        setNotification(`🔔 DETECTED: Price Alert hit! ${alert.symbol} is currently ₱${asset.price.toLocaleString()} (Target: ₱${alert.targetPrice.toLocaleString()})`);
        
        // Mark alert as inactive
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isActive: false } : a));

        if (neuralAudioFeedback) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          } catch (e) {
            console.log("Audio feedback requires first interaction:", e);
          }
        }
      }
    });
  }, [assets, alerts, neuralAudioFeedback]);

  // Fetch real-time crypto prices from behind Express secure proxy
  const fetchLivePrices = async () => {
    try {
      const res = await fetch("/api/trading/prices");
      if (!res.ok) throw new Error("Price feed offline");
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON from price feed API, received non-JSON");
      }
      
      const data = await res.json();
      if (data.success && data.prices) {
        setAssets(prev =>
          prev.map(asset => {
            if (asset.type === "crypto" && data.prices[asset.symbol]) {
              const live = data.prices[asset.symbol];
              const phpPrice = Number((live.price * PHP_RATE).toFixed(2));
              
              // Keep/append latest prices for clean dynamic sparklines structure
              let currentHistory = [...asset.prices24h];
              if (currentHistory[currentHistory.length - 1] !== phpPrice) {
                currentHistory.shift();
                currentHistory.push(phpPrice);
              }
              
              return {
                ...asset,
                price: phpPrice,
                change24h: live.change24h,
                prices24h: currentHistory
              };
            }
            return asset;
          })
        );
      }
    } catch (err) {
      console.warn("Live API prices fetch failed, relying on simulated session state", err);
    }
  };

  useEffect(() => {
    // Initial fetch on mount
    fetchLivePrices();

    // Poll live crypto prices every 5 seconds for a hyper-realistic experience
    const liveTimer = setInterval(fetchLivePrices, 5000);
    return () => clearInterval(liveTimer);
  }, []);

  // Brownian random simulation walk for non-crypto assets (stocks)
  useEffect(() => {
    const timer = setInterval(() => {
      setAssets(prev =>
        prev.map(asset => {
          if (asset.type === "stock") {
            // Standard Wiener dynamic asset pricing approximation
            const changePercent = (Math.random() - 0.495) * 0.012; // daily bias + slight volatility
            const oldPrice = asset.price;
            const newPrice = Number((oldPrice * (1 + changePercent)).toFixed(2));
            const net24hDiff = asset.change24h + (changePercent * 100);
            const finalChange = Number(net24hDiff.toFixed(2));

            // Retain latest 7 data points for neat sparkline render
            let currentHistory = [...asset.prices24h];
            currentHistory.shift();
            currentHistory.push(newPrice);

            return {
              ...asset,
              price: newPrice,
              change24h: finalChange,
              prices24h: currentHistory,
            };
          }
          return asset;
        })
      );
    }, 2800);

    return () => clearInterval(timer);
  }, []);

  // Update selected asset price whenever asset arrays change
  useEffect(() => {
    const currentVer = assets.find(a => a.symbol === selectedAsset.symbol);
    if (currentVer) {
      setSelectedAsset(currentVer);
    }
  }, [assets]);

  // Keep simulated positions ticking based on live asset prices
  const calculatePositionROI = (t: Trade): { profit: number; roi: number } => {
    const freshAsset = assets.find(a => a.symbol === t.symbol);
    if (!freshAsset) return { profit: 0, roi: 0 };

    const currentPrice = freshAsset.price;
    const entryPrice = t.price;
    const sizeInAsset = t.amount / entryPrice;

    let profit = 0;
    if (t.type === "BUY") {
      profit = (currentPrice - entryPrice) * sizeInAsset;
    } else {
      profit = (entryPrice - currentPrice) * sizeInAsset;
    }

    const roi = (profit / t.amount) * 100;
    return {
      profit: Number(profit.toFixed(2)),
      roi: Number(roi.toFixed(2))
    };
  };

  // Monitor active trades for auto-close take profit target criteria whenever assets tick/change
  useEffect(() => {
    if (activeTrades.length === 0) return;

    let updatedCompleted = false;
    const completedList: Trade[] = [];
    const remainingList: Trade[] = [];

    activeTrades.forEach(trade => {
      if (trade.status === "ACTIVE" && trade.autoCloseOnProfit) {
        const { profit, roi } = calculatePositionROI(trade);
        const freshAsset = assets.find(a => a.symbol === trade.symbol);
        
        let shouldClose = false;
        let closeReason = "";
        let detailsMessage = "";

        if (freshAsset) {
          const currentPrice = freshAsset.price;
          const entryPrice = trade.price;
          const pipVal = getPipValue(trade.symbol);
          
          let pipsAchieved = 0;
          if (trade.type === "BUY") {
            pipsAchieved = (currentPrice - entryPrice) / pipVal;
          } else {
            pipsAchieved = (entryPrice - currentPrice) / pipVal;
          }

          if (trade.takeProfitMode === "PIPS") {
            const targetPips = trade.takeProfitPips !== undefined ? trade.takeProfitPips : 50;
            if (profit > 0 && pipsAchieved >= targetPips) {
              shouldClose = true;
              closeReason = `at target of +${targetPips} pips (Achieved: +${Number(pipsAchieved.toFixed(1))} pips)`;
              detailsMessage = `automatically realized profit at +${Number(pipsAchieved.toFixed(1))} pips!`;
            }
          } else {
            const targetPercent = trade.takeProfitPercent !== undefined ? trade.takeProfitPercent : 1.5;
            if (profit > 0 && roi >= targetPercent) {
              shouldClose = true;
              closeReason = `at target ROI of +${roi}%`;
              detailsMessage = `automatically realized profit at +${roi}%!`;
            }
          }
        }

        // Auto close if trigger condition met
        if (shouldClose) {
          updatedCompleted = true;
          const payout = trade.amount + profit;

          // Refund capital & gains to cash balance
          setCash(prev => Number((prev + payout).toFixed(2)));

          completedList.push({
            ...trade,
            status: "COMPLETED",
            roi: roi
          });

          setTradeMessage({
            text: `🎯 AUTO-CLOSE TRIGGERED: Position [${trade.id}] on ${trade.symbol} auto-closed ${closeReason} (+₱${profit.toLocaleString()}).`,
            type: "success"
          });

          setNotification(`🎯 AUTO-CLOSE: Position [${trade.id}] on ${trade.symbol} ${detailsMessage}`);

          // Quick sound tone
          if (neuralAudioFeedback) {
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = "sine";
              osc.frequency.setValueAtTime(1046.50, ctx.currentTime);
              gain.gain.setValueAtTime(0.08, ctx.currentTime);
              osc.start();
              osc.stop(ctx.currentTime + 0.15);
              
              const osc2 = ctx.createOscillator();
              const gain2 = ctx.createGain();
              osc2.connect(gain2);
              gain2.connect(ctx.destination);
              osc2.type = "sine";
              osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.15);
              gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.15);
              osc2.start(ctx.currentTime + 0.15);
              osc2.stop(ctx.currentTime + 0.35);
            } catch (e) {
              console.log("Audio feedback error omitted:", e);
            }
          }
        } else {
          remainingList.push(trade);
        }
      } else {
        remainingList.push(trade);
      }
    });

    if (updatedCompleted) {
      setCompletedTrades(prev => [...completedList, ...prev]);
      setActiveTrades(remainingList);
    }
  }, [assets, activeTrades, neuralAudioFeedback]);

  // Automated trigger of Gemini API
  const fetchNeuralAnalysis = async () => {
    setIsAnalyzing(true);
    setTradeMessage(null);
    try {
      const response = await fetch("/api/trading/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedAsset.symbol,
          type: selectedAsset.type,
          timeframe,
          riskProfile
        })
      });

      if (!response.ok) {
        throw new Error("Neural response system returned a bad gateway state.");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON from analyze API, received non-JSON");
      }

      const rawResult: AnalysisResult = await response.json();
      setAnalysis(rawResult);

      // Add to historic analysis log
      setInferenceLogs(prev => [rawResult, ...prev.slice(0, 19)]);
    } catch (err: any) {
      console.error(err);
      // Construct fallback UI object safe state
      const fallbackAnalysis: AnalysisResult = {
        symbol: selectedAsset.symbol,
        signal: "BUY",
        confidence: 76,
        targetPrice: (selectedAsset.price * 1.12).toFixed(2),
        stopLoss: (selectedAsset.price * 0.94).toFixed(2),
        reasoning: [
          `Localized indicators identify a strong dynamic support pivot for ${selectedAsset.symbol}.`,
          "Stochastic crossover detected under optimal high-frequency momentum criteria.",
          "Consensus prediction models highlight strong passive buy blocks accumulating."
        ],
        marketSentiment: "Bullish (Accumulating Delta)",
        technicalIndicators: {
          rsi: "54.6 Balanced",
          macd: "Bullish divergence imminent",
          movingAverages: "Sustained EMA-20 dynamically supporting"
        },
        fallback: true
      };
      setAnalysis(fallbackAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // First-time load analysis trigger
  useEffect(() => {
    fetchNeuralAnalysis();
  }, [selectedAsset.symbol]);

  // Price Threshold Alerts Management
  const handleAddAlert = (e: FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(alertPrice);
    if (!priceNum || isNaN(priceNum) || priceNum <= 0) {
      setAlertMessage("Mangyaring maglagay ng tamang presyo.");
      return;
    }

    const newAlert: PriceAlert = {
      id: "ALT-" + Math.floor(100000 + Math.random() * 900000),
      symbol: selectedAsset.symbol,
      targetPrice: priceNum,
      condition: alertCondition,
      isActive: true,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setAlerts(prev => [newAlert, ...prev]);
    setAlertMessage(`Alert iset: ${selectedAsset.symbol} ${alertCondition} ₱${priceNum.toLocaleString()}`);
    
    setTimeout(() => {
      setAlertMessage(null);
    }, 3000);
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Execute trade on broker simulator
  const handleDeployBot = (side: "BUY" | "SELL") => {
    if (tradeSize <= 0) {
      setTradeMessage({ text: "Deploy size must exceed 0.", type: "error" });
      return;
    }
    if (tradeSize > cash) {
      setTradeMessage({ text: `Insufficient balance. Available capital: ₱${cash.toLocaleString()}`, type: "error" });
      return;
    }

    // Capital draw
    setCash(prev => Number((prev - tradeSize).toFixed(2)));

    const newPosition: Trade = {
      id: "TRD-" + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toLocaleTimeString(),
      symbol: selectedAsset.symbol,
      type: side,
      price: selectedAsset.price,
      amount: tradeSize,
      status: "ACTIVE",
      autoCloseOnProfit: botAutoClose,
      takeProfitMode: botTakeProfitMode,
      takeProfitPercent: botTakeProfitPercent,
      takeProfitPips: botTakeProfitPips
    };

    setActiveTrades(prev => [newPosition, ...prev]);
    setTradeMessage({
      text: `🚀 Bot [${newPosition.id}] initiated ${side} on ${selectedAsset.symbol} with ₱${tradeSize.toLocaleString()} allocated.`,
      type: "success"
    });
  };

  // Close simulated active position and lock gains/losses
  const handleClosePosition = (id: string) => {
    const tradeSource = activeTrades.find(t => t.id === id);
    if (!tradeSource) return;

    const { profit } = calculatePositionROI(tradeSource);
    const payout = tradeSource.amount + profit;

    // Refund capital and locked ROI profit back to virtual wallet
    setCash(prev => Number((prev + payout).toFixed(2)));

    // Shift to completed trades log
    const completed: Trade = {
      ...tradeSource,
      status: "COMPLETED",
      roi: calculatePositionROI(tradeSource).roi
    };

    setCompletedTrades(prev => [completed, ...prev]);
    setActiveTrades(prev => prev.filter(t => t.id !== id));
    setTradeMessage({
      text: `✓ Closed Position [${id}] - Realized Gain/Loss: ${profit >= 0 ? "+" : ""}₱${profit.toLocaleString()} (${completed.roi}%)`,
      type: "success"
    });
  };

  // Run backtester strategy engine simulation
  const handleRunBacktest = () => {
    setIsBacktesting(true);
    setBacktestLogs([]);
    setBacktestResult(null);
    setBacktestProgress(5);

    let progress = 5;
    const ticker = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(ticker);

        // Compute simulated result state criteria
        const simulatedWinRate = Math.floor(62 + Math.random() * 14); // 62% - 76%
        const simulatedProfitFactor = Number((1.65 + Math.random() * 0.75).toFixed(2));
        const simulatedTrades = Math.floor(250 + Math.random() * 450);
        const netGrowth = Number((12.4 + Math.random() * 24.6).toFixed(2));
        const sharpe = Number((1.85 + Math.random() * 1.1).toFixed(2));

        setBacktestResult({
          totalTrades: simulatedTrades,
          winRate: simulatedWinRate,
          profitFactor: simulatedProfitFactor,
          netReturn: netGrowth,
          sharpeRatio: sharpe
        });
        setIsBacktesting(false);
      }

      setBacktestProgress(progress);

      // Add cool high-fidelity quant terminal messages
      const batchLogs = [
        `[Init Engine] Pre-loading historical tick intervals for ${selectedAsset.symbol} - Year 2018 to 2026.`,
        `[Stochastic Run] Calculating EMA crossover vectors over 18,400 structural bars...`,
        `[Optimization] Dynamic threshold risk profiling calculated for model setting: "${riskProfile}".`,
        `[Matrix Build] Evaluating Monte Carlo probability outcomes for 1,000 baseline variables...`,
        `[Diagnostic] Sharpe metric validation initialized. Total anomalies localized: 0.`,
        `[Compile Status] Completed dynamic analysis on timeframe [${timeframe}] simulation.`
      ];

      const index = Math.min(Math.floor((progress / 100) * batchLogs.length), batchLogs.length - 1);
      setBacktestLogs(prev => {
        if (!prev.includes(batchLogs[index])) {
          return [...prev, `${new Date().toLocaleTimeString()} :: ${batchLogs[index]}`];
        }
        return prev;
      });

    }, 350);
  };

  // Calculated Portfolio Aggregates (Live & Cumulative)
  const livePositionsPnl = activeTrades.reduce((sum, t) => sum + calculatePositionROI(t).profit, 0);
  const totalPortfolioValue = Number((cash + activeTrades.reduce((sum, t) => sum + t.amount, 0) + livePositionsPnl).toFixed(2));
  const changeSinceBaseline = Number((((totalPortfolioValue - (50000.00 * PHP_RATE)) / (50000.00 * PHP_RATE)) * 100).toFixed(2));

  // Visual helper to extract line coordinates for a beautiful micro-sparkline
  const generateSparklinePoints = (prices: number[], width: number, height: number): string => {
    if (prices.length === 0) return "";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    return prices
      .map((price, index) => {
        const x = (index / (prices.length - 1)) * width;
        const y = height - ((price - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col relative overflow-x-hidden antialiased">
      {/* Dynamic Backgrounds matching layout requirements */}
      <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,#4f46e5_0%,transparent_70%)]" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Global System Notice */}
      {notification && (
        <div id="notice-rail" className="relative z-50 bg-indigo-950 text-indigo-300 px-4 py-2 text-xs font-mono flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-indigo-400 hover:text-white transition-colors ml-4 p-0.5">
            <X size={14} />
          </button>
        </div>
      )}

      {/* HEADER / NAVIGATION BAR */}
      <nav id="navbar-top" className="relative flex items-center justify-between px-6 md:px-12 py-6 z-40 border-b border-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-4 h-4 border-2 border-white rotate-45 animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-wider text-white">ACS.PINOY.AI.TRADING</span>
            <span className="text-[9px] text-indigo-400 tracking-widest font-mono uppercase">AI QUANTS V3.4</span>
          </div>
        </div>

        {/* Desktop Nav Tels */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => setActiveTab("platform")}
            className={`transition-all py-1 border-b-2 hover:text-white ${activeTab === "platform" ? "border-indigo-500 text-white" : "border-transparent text-slate-400"}`}
          >
            Terminal Overview
          </button>
          <button
            onClick={() => setActiveTab("terminal")}
            className={`transition-all py-1 border-b-2 hover:text-white ${activeTab === "terminal" ? "border-indigo-500 text-white" : "border-transparent text-slate-400"}`}
          >
            Live AI Simulator
          </button>
          <button
            onClick={() => setActiveTab("backtests")}
            className={`transition-all py-1 border-b-2 hover:text-white ${activeTab === "backtests" ? "border-indigo-500 text-white" : "border-transparent text-slate-400"}`}
          >
            Interactive Backtesting
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Live System Gate indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full font-mono text-[10px] text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span>GATEWAY: ON</span>
          </div>

          <button
            onClick={() => {
              setActiveTab("terminal");
              const el = document.getElementById("terminal-screen");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-500 transition-all rounded-full font-semibold text-xs tracking-wide shadow-md shadow-indigo-600/15"
          >
            Deploy Live Bot
          </button>
        </div>
      </nav>

      {/* DETAILED CONTENT HUB */}
      <AnimatePresence mode="wait">
        {activeTab === "platform" && (
          <motion.main
            key="platform"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="relative flex-grow flex flex-col z-20 px-6 md:px-12 py-8"
          >
            {/* HERO SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-8 md:my-14">
              <div className="lg:col-span-7 flex flex-col gap-6" id="hero-left-column">
                <div className="inline-flex max-w-fit items-center gap-2 px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest font-mono">Neural Interface V3.0 Is Active</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold leading-[1.08] text-white tracking-tight">
                  Outperform markets with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Precision Intelligence.</span>
                </h1>

                <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
                  Ikonekta ang iyong simulated wallet at mag-deploy ng high-frequency neural algorithms na patuloy na natututo, umaangkop, at nag-eexecute ng trades sa loob lamang ng milliseconds. Dinisenyo para sa propesyonal na crypto at stock retail traders gamit ang lakas ng dynamic na artificial intelligence.
                </p>

                {/* Localized Filipino Callout Banner */}
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl leading-relaxed max-w-xl text-xs font-sans text-indigo-200">
                  <span className="font-bold text-white uppercase tracking-wider block mb-1">💡 Tungkol sa AI Trading Platform na ito:</span>
                  Ito ay isang interactive simulation na pinalakas ng modernong <strong>Gemini 3.5 AI</strong> na nagbibigay ng detalyadong kaukulang quant analysis, dynamic target levels, stop losses, at signal strategies base sa iba't-ibang risk profile nang sa gayon ay mapag-aralan ang galaw ng merkado nang ligtas at walang panganib.
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button
                    onClick={() => {
                      setActiveTab("terminal");
                      setTimeout(() => {
                        document.getElementById("terminal-screen")?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-indigo-400 transition-all flex items-center gap-2"
                  >
                    <span>Subukan ang AI Simulator</span>
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => setActiveTab("backtests")}
                    className="px-8 py-4 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
                  >
                    Magpatakbo ng Backtests
                  </button>
                </div>
              </div>

              {/* HIGH VALUE STATS & PORTFOLIO LOGO PREVIEW */}
              <div className="lg:col-span-5 flex justify-center" id="hero-right-column">
                <div className="w-full max-w-md bg-slate-900/45 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                  {/* Glowing background circles */}
                  <div className="absolute -bottom-4 -right-4 w-40 h-40 bg-indigo-500/10 blur-[60px] rounded-full" />
                  <div className="absolute -top-4 -left-4 w-40 h-40 bg-cyan-500/5 blur-[60px] rounded-full" />

                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest font-bold">SIMULATED PORTFOLIO VALUE</p>
                      <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                        ₱{totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h2>
                    </div>
                    <div className={`px-2.5 py-1 text-xs font-bold rounded-lg font-mono flex items-center gap-1 ${changeSinceBaseline >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                      {changeSinceBaseline >= 0 ? "+" : ""}
                      {changeSinceBaseline}%
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    {/* Visual bar chart representing real-time volatility index */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400 font-medium">Real-Time Allocation Volatility Diagram</span>
                        <span className="text-[10px] text-indigo-400 font-mono">Dynamic Node Stream</span>
                      </div>
                      <div className="h-[120px] w-full flex items-end gap-1 px-1 bg-slate-950/40 rounded-xl border border-slate-800/80 pt-4">
                        {assets.map((asset, idx) => (
                           <div
                            key={asset.symbol}
                            className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                            onClick={() => setSelectedAsset(asset)}
                          >
                            {/* Height is scaled based on price percentage change dynamics */}
                            <div
                              className="w-full rounded-t transition-all duration-500"
                              style={{
                                height: `${Math.max(15, Math.min(100, Math.floor(45 + asset.change24h * 10)))}%`,
                                backgroundColor: asset.change24h >= 0 ? "rgba(99, 102, 241, 0.85)" : "rgba(239, 68, 68, 0.7)"
                              }}
                            />
                            <span className="text-[8px] font-mono mt-1.5 text-slate-500 select-none">{asset.symbol}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-1">
                      <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 font-mono font-bold uppercase mb-1">ACTIVE CAPITAL</p>
                        <p className="text-lg font-bold text-white">₱{cash.toLocaleString()}</p>
                      </div>
                      <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 font-mono font-bold uppercase mb-1">ACTIVE COMMITTED</p>
                        <p className="text-lg font-bold text-white">
                          ₱{activeTrades.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 rounded-xl p-3 border border-indigo-900/20 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-indigo-400 animate-spin" />
                        <span className="text-slate-400">Deployed Bot Threads:</span>
                      </div>
                      <span className="text-white font-bold">{activeTrades.length} Active Bots</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* THREE-COLUMN FEATURE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 md:my-14" id="features">
              <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                  <Brain size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Advanced AI Reasoning</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Powered by the modern <strong>Gemini 3.5 API</strong> to deliver premium technical synthesis, technical indicators evaluation, and dynamic triggers mapping.
                </p>
              </div>

              <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-lg flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Sub-second Pricing Updates</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Real-time micro-fluctuations modeled dynamically using a secure stochastic walk, keeping stock and crypto price feeds hyper-responsive.
                </p>
              </div>

              <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Full sandbox loop</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Allocate virtual cash, trigger live trades based on real quantitative outputs, let automated bots run, track ROI, and lock profits without real stress.
                </p>
              </div>
            </div>

            {/* PLATFORM QUICK TELEMETRY CARDS */}
            <div className="border-t border-slate-900/60 pt-10 mt-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left" id="telemetry-banner">
              <div>
                <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest mb-1">Aggregate Simulated Value</p>
                <p className="text-2xl font-bold text-slate-100">₱2,900,000 PHP Start</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest mb-1">Average Quant Latency</p>
                <p className="text-2xl font-bold text-slate-100">12 ms response</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest mb-1">Supported Asset Clusters</p>
                <p className="text-2xl font-bold text-slate-100">Crypto + Stocks</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest mb-1">Autonomous Trading Core</p>
                <p className="text-2xl font-bold text-indigo-400">Gemini 3.5 Engine</p>
              </div>
            </div>
          </motion.main>
        )}

        {/* INTERACTIVE SIMULATOR TERMINAL */}
        {activeTab === "terminal" && (
          <motion.main
            key="terminal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="flex-grow grid grid-cols-1 xl:grid-cols-12 gap-6 z-20 px-6 md:px-12 py-8"
            id="terminal-screen"
          >
            {/* LEFT-COLUMN: TICKERS LIST & BROKER STATUS */}
            <section id="terminal-tickers" className="xl:col-span-3 flex flex-col gap-6">
              {/* Wallet Header */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-indigo-400" />
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Trading capital</span>
                  </div>
                  <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-indigo-900/20 text-indigo-300 font-mono font-bold">VIRTUAL CASH</span>
                </div>
                <div className="text-2xl font-extrabold text-white tracking-tight leading-none mb-1">
                  ₱{cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-normal">PHP</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Cum. portfolio value: <strong className="text-emerald-400">₱{totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                </p>

                <div className="bg-slate-950 rounded-xl p-2 mt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 uppercase font-mono font-bold">ACTIVE POSITIONS</span>
                    <span className="text-xs font-bold text-white">{activeTrades.length} deployed thread(s)</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Sigurado ka bang nais mong isara ang lahat ng posisyon?")) {
                        // Liquidate all
                        activeTrades.forEach(t => handleClosePosition(t.id));
                      }
                    }}
                    disabled={activeTrades.length === 0}
                    className="text-[9px] text-red-400 hover:text-red-300 font-mono underline disabled:opacity-50 disabled:no-underline"
                  >
                    Liquidate All
                  </button>
                </div>
              </div>

              {/* Price Alerts Card */}
              <div id="price-alerts-engine-card" className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-indigo-400 animate-pulse animate-swing" />
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Price Alert Engine</h3>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">Threshold Watch</span>
                </div>

                <form onSubmit={handleAddAlert} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAlertCondition("ABOVE")}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold border transition-all flex items-center justify-center gap-1 ${
                        alertCondition === "ABOVE"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold"
                          : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <span>Goes ABOVE (▲)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertCondition("BELOW")}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold border transition-all flex items-center justify-center gap-1 ${
                        alertCondition === "BELOW"
                          ? "bg-red-500/10 border-red-500 text-red-400 font-semibold"
                          : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <span>Goes BELOW (▼)</span>
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">₱</span>
                    <input
                      type="number"
                      step="any"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-7 pr-16 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      placeholder="Target Price"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-indigo-400 font-mono font-bold bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40 uppercase">
                      {selectedAsset.symbol}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all text-white font-bold text-[10px] uppercase font-mono tracking-wider rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Bell size={12} />
                    <span>Set {selectedAsset.symbol} Target Alert</span>
                  </button>
                </form>

                {alertMessage && (
                  <p className="text-[10px] text-emerald-400 font-mono bg-emerald-950/15 border border-emerald-900/20 px-2 py-1 rounded text-center">
                    {alertMessage}
                  </p>
                )}

                {/* List of alerts */}
                {alerts.length > 0 && (
                  <div className="space-y-1.5 mt-2 max-h-[140px] overflow-y-auto pr-0.5" id="price-alerts-watcher-list">
                    <p className="text-[9px] text-slate-500 uppercase font-mono font-bold pb-1 border-b border-slate-950">Active Watchlists:</p>
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-2 rounded-xl border flex items-center justify-between text-[10px] font-mono ${
                          alert.isActive
                            ? "bg-slate-950/60 border-slate-850"
                            : "bg-slate-950/20 border-slate-900 opacity-60"
                        }`}
                        id={`alert-row-${alert.id}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${alert.isActive ? "bg-indigo-400 animate-pulse" : "bg-slate-600"}`}></span>
                            <span className="text-white font-bold">{alert.symbol}</span>
                            <span className={alert.condition === "ABOVE" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                              {alert.condition === "ABOVE" ? "≥" : "≤"} ₱{alert.targetPrice.toLocaleString()}
                            </span>
                          </div>
                          <span className="text-[8px] text-slate-500">Set at {alert.createdAt}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleAlert(alert.id)}
                            className={`px-1.5 py-0.5 rounded text-[8px] border transition-all ${
                              alert.isActive
                                ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-slate-900"
                                : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800"
                            }`}
                          >
                            {alert.isActive ? "Pause" : "Resume"}
                          </button>
                          <button
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition-colors"
                            title="Delete Alert"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ticker Selector */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800/60">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">High Frequency Nodes</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] text-emerald-400 font-mono">Ticking: Live</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {assets.map(asset => {
                    const isSelected = selectedAsset.symbol === asset.symbol;
                    const changeValue = asset.change24h;
                    const sparkPoints = generateSparklinePoints(asset.prices24h, 80, 24);

                    return (
                      <div
                        key={asset.symbol}
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-3 rounded-xl transition-all border cursor-pointer group flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-950/40 border-indigo-500 text-white"
                            : "bg-slate-950/40 border-slate-800 hover:bg-slate-900/25 text-slate-300 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                            asset.type === "crypto" ? "bg-amber-500/10 text-amber-400" : "bg-cyan-500/10 text-cyan-400"
                          }`}>
                            {asset.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-sm leading-tight">{asset.symbol}</span>
                              <span className="text-[8px] text-slate-500 uppercase px-1 bg-slate-950/40 rounded leading-none">{asset.type}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal line-clamp-1">{asset.name}</span>
                          </div>
                        </div>

                        {/* Sparkline Canvas rendering directly inside ticker */}
                        <div className="hidden sm:block mx-1">
                          <svg className="w-16 h-8 overflow-visible" stroke={changeValue >= 0 ? "#10b981" : "#ef4444"}>
                            <polyline
                              fill="none"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              points={sparkPoints}
                            />
                          </svg>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span className="font-mono font-bold text-sm">₱{asset.price.toLocaleString()}</span>
                          <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 mt-0.5 ${changeValue >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {changeValue >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {changeValue >= 0 ? "+" : ""}{changeValue}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* MIDDLE PANEL: NEURAL INFERENCE ADVISOR */}
            <section id="terminal-inference-module" className="xl:col-span-6 flex flex-col gap-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col h-full overflow-hidden">
                {/* Header controls select */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{selectedAsset.name} Quant Agent</span>
                        <span className="text-xs font-mono px-2 py-0.5 bg-slate-900 text-indigo-400 rounded-md uppercase font-bold tracking-widest">{selectedAsset.symbol}</span>
                      </h2>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">MODEL ID: GEMINI-3.5-FLASH INFERENCE ENGINE</p>
                    </div>
                  </div>

                  {/* Operational configurations */}
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 uppercase font-mono font-bold mb-1">Timeframe</span>
                      <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 font-mono text-xs cursor-pointer"
                      >
                        <option value="M15">15 Min (Scalp)</option>
                        <option value="H1">1 Hour (Intraday)</option>
                        <option value="H4">4 Hour (Swing)</option>
                        <option value="D1">Daily (Macro)</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 uppercase font-mono font-bold mb-1">Risk Profile</span>
                      <select
                        value={riskProfile}
                        onChange={(e) => setRiskProfile(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 font-mono text-xs cursor-pointer"
                      >
                        <option value="conservative">Conservative</option>
                        <option value="balanced">Balanced</option>
                        <option value="aggressive">High Speculation</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Main inference section */}
                <div className="flex-grow flex flex-col justify-between">
                  {isAnalyzing ? (
                    <div className="flex-grow py-12 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                      <h4 className="text-sm font-bold text-white mb-2">Analyzing Stochastic Dynamics...</h4>
                      <p className="text-xs text-slate-500 max-w-sm font-mono animate-pulse">
                        Querying price matrices, analyzing relative price action delta, and structuring Gemini response...
                      </p>
                    </div>
                  ) : analysis ? (
                    <div className="space-y-5">
                      {/* Live Decision Display */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                        <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-center">
                          <span className="text-[9px] text-slate-500 uppercase font-mono font-bold block mb-1">SIGNAL DECISION</span>
                          <span className={`text-2xl font-black font-mono tracking-wider ${
                            analysis.signal === "BUY"
                              ? "text-emerald-400 font-extrabold shadow-sm"
                              : analysis.signal === "SELL"
                                ? "text-amber-500 font-extrabold shadow-sm"
                                : "text-yellow-400"
                          }`}>
                            {analysis.signal}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                          <span className="text-[9px] text-slate-500 uppercase font-mono font-bold block text-center mb-1">PROBABILITY DENSITY</span>
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                style={{ width: `${analysis.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono font-bold text-white">{analysis.confidence}%</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-center">
                          <span className="text-[9px] text-slate-500 uppercase font-mono font-bold block mb-1">TARGET CO-ORDINATES</span>
                          <span className="text-sm font-mono font-bold text-white">{formatPriceField(analysis.targetPrice)}</span>
                          <p className="text-[8px] text-slate-500 mt-0.5">SL level: <strong className="text-red-400/80 font-mono">{formatPriceField(analysis.stopLoss)}</strong></p>
                        </div>
                      </div>

                      {/* Technical Breakdown Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                          <h4 className="text-xs font-mono font-bold text-indigo-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                            <Activity size={12} />
                            <span>System Metrics Signals</span>
                          </h4>
                          <div className="space-y-2.5 text-xs font-mono">
                            <div className="flex justify-between border-b border-slate-900/60 pb-1">
                              <span className="text-slate-500">Vol Sentiment:</span>
                              <span className="text-slate-300 text-right">{analysis.marketSentiment}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-900/60 pb-1">
                              <span className="text-slate-500">Relative RSI:</span>
                              <span className="text-slate-300 text-right">{analysis.technicalIndicators.rsi}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-900/60 pb-1">
                              <span className="text-slate-500">Momentum MACD:</span>
                              <span className="text-slate-300 text-right">{analysis.technicalIndicators.macd}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">MAs Structure:</span>
                              <span className="text-indigo-300 text-right">{analysis.technicalIndicators.movingAverages}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                          <h4 className="text-xs font-mono font-bold text-indigo-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                            <Brain size={12} />
                            <span>Algorithmic Reasoning</span>
                          </h4>
                          <ul className="space-y-2 text-xs">
                            {analysis.reasoning.map((r, i) => (
                              <li key={i} className="flex gap-2 text-slate-300 tracking-wide">
                                <span className="text-indigo-400 font-mono font-bold">{i + 1}.</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {analysis.fallback && (
                        <div className="text-[10px] text-amber-300/80 bg-amber-950/20 p-2.5 border border-amber-900/30 rounded-lg flex items-start gap-2">
                          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                          <span>Gamit ang high-fidelity lokal fallback quant data. Upang mapagana ang aktuwal na Gemini AI real-time inferences, i-configure lamang ang iyong personal na kaukulang <strong>GEMINI_API_KEY</strong> sa system secrets.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-grow py-12 flex flex-col items-center justify-center text-center text-slate-500">
                      <Brain size={32} className="opacity-40 mb-2 animate-bounce" />
                      <p>Wala pang kaukulang data ng pagsusuri na nakuha.</p>
                      <button onClick={fetchNeuralAnalysis} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-xl transition-colors">
                        Suriin ang {selectedAsset.symbol}
                      </button>
                    </div>
                  )}

                  {/* Prompt Trigger Button */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/80">
                    <button
                      onClick={fetchNeuralAnalysis}
                      disabled={isAnalyzing}
                      className="flex-grow px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl tracking-wider transition-all uppercase flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
                    >
                      <Cpu size={14} className={isAnalyzing ? "animate-spin" : ""} />
                      <span>{isAnalyzing ? "Processing Neural Vector..." : "Trigger AI Inference Model"}</span>
                    </button>

                    <button
                      onClick={() => setShowInferenceHistory(!showInferenceHistory)}
                      disabled={inferenceLogs.length === 0}
                      className="px-4 py-3 bg-slate-950 border border-slate-800 hover:bg-slate-900/40 text-slate-300 text-xs rounded-xl font-semibold transition-all disabled:opacity-40"
                    >
                      {showInferenceHistory ? "Hide Log" : `Logs History (${inferenceLogs.length})`}
                    </button>
                  </div>
                </div>
              </div>

              {/* History overlay dropdown list layout */}
              {showInferenceHistory && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 max-h-[180px] overflow-y-auto font-mono text-[11px] text-slate-400 space-y-2">
                  <h4 className="text-white text-xs font-bold font-mono border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                    <span>INFERENCE TELEMETRY DUMP</span>
                    <button onClick={() => setShowInferenceHistory(false)} className="text-slate-500 hover:text-white">&times;</button>
                  </h4>
                  {inferenceLogs.map((log, index) => (
                    <div key={index} className="flex justify-between border-b border-slate-950/60 pb-1">
                      <span className="text-indigo-400 font-bold">[{log.symbol}] {log.signal} (Conf: {log.confidence}%)</span>
                      <span className="text-slate-500">Target: {formatPriceField(log.targetPrice)} | MACD: {log.technicalIndicators.macd.slice(0, 15)}...</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* RIGHT PANEL: LIVE POSITION CONTROL PANEL & COMMAND LINE */}
            <section id="terminal-broker" className="xl:col-span-3 flex flex-col gap-6">
              {/* Deploy command options */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3 pb-2 border-b border-slate-800/60">DEPLOY AGENT BOT</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1.5">Trade sizing (₱ PHP)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₱</span>
                      <input
                        type="number"
                        value={tradeSize}
                        onChange={(e) => setTradeSize(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-7 pr-3 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                        placeholder="Size in PHP"
                      />
                    </div>
                    {/* Preset sizes */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      {[1000 * PHP_RATE, 5000 * PHP_RATE, 10000 * PHP_RATE].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setTradeSize(amt)}
                          className={`py-1 rounded bg-slate-950 border text-[10px] font-mono hover:bg-slate-900 transition-colors ${
                            tradeSize === amt ? "border-indigo-500 text-indigo-400" : "border-slate-850 text-slate-400"
                          }`}
                        >
                          ₱{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-Close on Profit Config Panel */}
                  <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="auto-close-check"
                          checked={botAutoClose}
                          onChange={(e) => setBotAutoClose(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                        />
                        <label htmlFor="auto-close-check" className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-wider cursor-pointer select-none">
                          Auto-Close on Profit
                        </label>
                      </div>
                      <span className="text-[8px] text-indigo-400 font-mono uppercase bg-indigo-950/45 px-1.5 py-0.5 rounded border border-indigo-900/30">
                        Take Profit
                      </span>
                    </div>

                    {botAutoClose && (
                      <div className="space-y-3 block">
                        {/* Segmented Toggle for Take Profit Mode */}
                        <div className="grid grid-cols-2 gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-855">
                          <button
                            type="button"
                            onClick={() => setBotTakeProfitMode("PERCENT")}
                            className={`py-1 text-[9px] font-mono font-bold rounded-md transition-all ${
                              botTakeProfitMode === "PERCENT"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Percentage (% ROI)
                          </button>
                          <button
                            type="button"
                            onClick={() => setBotTakeProfitMode("PIPS")}
                            className={`py-1 text-[9px] font-mono font-bold rounded-md transition-all ${
                              botTakeProfitMode === "PIPS"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Pips / Points
                          </button>
                        </div>

                        {botTakeProfitMode === "PERCENT" ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                              <span>Target ROI Trigger:</span>
                              <span className="text-emerald-400 font-bold">+{botTakeProfitPercent}% profit</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="5.0"
                              step="0.5"
                              value={botTakeProfitPercent}
                              onChange={(e) => setBotTakeProfitPercent(parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="grid grid-cols-4 gap-1 text-[8px] font-mono text-center text-slate-500">
                              {[0.5, 1.0, 2.0, 5.0].map(val => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setBotTakeProfitPercent(val)}
                                  className={`py-0.5 rounded border ${
                                    botTakeProfitPercent === val ? "border-indigo-500/50 text-indigo-400 bg-indigo-950/20" : "border-slate-850 text-slate-500 hover:text-slate-300"
                                  }`}
                                >
                                  +{val}%
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                              <span>Target Pips Trigger:</span>
                              <span className="text-indigo-400 font-bold">+{botTakeProfitPips} pips profit</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="300"
                              step="10"
                              value={botTakeProfitPips}
                              onChange={(e) => setBotTakeProfitPips(parseInt(e.target.value))}
                              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="grid grid-cols-4 gap-1 text-[8px] font-mono text-center text-slate-500">
                              {[20, 50, 100, 200].map(val => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setBotTakeProfitPips(val)}
                                  className={`py-0.5 rounded border ${
                                    botTakeProfitPips === val ? "border-indigo-500/50 text-indigo-400 bg-indigo-950/20" : "border-slate-850 text-slate-500 hover:text-slate-300"
                                  }`}
                                >
                                  +{val} pips
                                </button>
                              ))}
                            </div>
                            <div className="text-[8px] font-mono text-slate-500 leading-normal pt-1 bg-slate-950/25 px-2 py-1.5 rounded-lg border border-slate-900/30">
                              <span className="font-semibold text-slate-400">Pip Scale standard for {selectedAsset.symbol}: </span>
                              1 Pip = ₱{getPipValue(selectedAsset.symbol).toLocaleString()} Change. 
                              (+{botTakeProfitPips} pips = ₱{(botTakeProfitPips * getPipValue(selectedAsset.symbol)).toLocaleString()})
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <button
                      onClick={() => handleDeployBot("BUY")}
                      className="py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-bold text-xs rounded-xl tracking-wider uppercase flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10"
                    >
                      <Plus size={14} />
                      <span>LONG (BUY)</span>
                    </button>
                    <button
                      onClick={() => handleDeployBot("SELL")}
                      className="py-3 bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all text-white font-bold text-xs rounded-xl tracking-wider uppercase flex items-center justify-center gap-1 shadow-md shadow-amber-500/10"
                    >
                      <X size={14} />
                      <span>SHORT (SELL)</span>
                    </button>
                  </div>
                </div>

                {/* Status alerts logs */}
                {tradeMessage && (
                  <div className={`mt-4 p-3 rounded-xl border text-xs font-mono leading-relaxed flex items-start gap-2 ${
                    tradeMessage.type === "success" ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-300" : "bg-red-950/20 border-red-900/30 text-red-300"
                  }`}>
                    {tradeMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />}
                    <span>{tradeMessage.text}</span>
                  </div>
                )}
              </div>

              {/* Active simulated trades */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/60">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">ACTIVE AGENT THREADS ({activeTrades.length})</h3>
                  <span className="text-[9px] text-slate-500 font-mono">Real-Time Sync</span>
                </div>

                <div className="flex-grow overflow-y-auto max-h-[300px] space-y-3 pr-1">
                  {activeTrades.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-center text-slate-500">
                      <Terminal size={24} className="opacity-30 mb-2" />
                      <p className="text-xs">Walang aktibong posisyon.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Mag-klik ng BUY o SELL sa taas para magpadala ng broker bot!</p>
                    </div>
                  ) : (
                    activeTrades.map(trade => {
                      const { profit, roi } = calculatePositionROI(trade);
                      const isProfit = profit >= 0;

                      return (
                        <div key={trade.id} className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                trade.type === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                              }`}>
                                {trade.type === "BUY" ? "LONG" : "SHORT"}
                              </span>
                              <strong className="font-mono text-xs text-white">{trade.symbol}</strong>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{trade.timestamp}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-b border-slate-900/60 pb-2">
                            <div>
                              <span className="text-slate-500 block">Entry:</span>
                              <span className="text-slate-300 font-bold">₱{trade.price.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Allocation:</span>
                              <span className="text-slate-300 font-bold">₱{trade.amount.toLocaleString()}</span>
                            </div>
                          </div>

                          {trade.autoCloseOnProfit && (
                            <div className="flex items-center justify-between text-[9px] font-mono bg-indigo-950/20 border border-indigo-900/20 rounded-lg px-2 py-1 text-indigo-400">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Auto-Close Active
                              </span>
                              <span>Target: {trade.takeProfitMode === "PIPS" ? `≥ +${trade.takeProfitPips} pips` : `≥ +${trade.takeProfitPercent}%`}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase font-mono block">LIVE RETURN PnL</span>
                              <span className={`font-mono font-extrabold text-xs ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                                {isProfit ? "+" : ""}₱{profit.toLocaleString()} ({roi}%)
                              </span>
                            </div>
                            <button
                              onClick={() => handleClosePosition(trade.id)}
                              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-100 font-mono text-[9px] font-bold rounded"
                            >
                              Close Trade
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Historic Closed log segment */}
                {completedTrades.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800 pb-1">
                    <h4 className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-widest mb-2 flex items-center justify-between">
                      <span>Closed Trades Ledger ({completedTrades.length})</span>
                      <History size={11} />
                    </h4>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto text-[10px] font-mono text-slate-400">
                      {completedTrades.slice(0, 5).map((ct, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-950">
                          <span>{ct.symbol} {ct.type}</span>
                          <span className={ct.roi && ct.roi >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {ct.roi && ct.roi >= 0 ? "+" : ""}{ct.roi}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </motion.main>
        )}

        {/* BACKTESTING INTERACTIVE SANDBOX */}
        {activeTab === "backtests" && (
          <motion.main
            key="backtests"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="flex-grow flex flex-col z-20 px-6 md:px-12 py-8 max-w-5xl mx-auto w-full gap-6"
            id="backtests-view"
          >
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full font-mono text-xs text-indigo-400 font-bold uppercase tracking-wider mb-2">
                    <Briefcase size={12} strokeWidth={2.5} />
                    <span>Algorithmic Backtester Rig</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Interactive Backtesting Diagnostic Sandbox</h2>
                  <p className="text-sm text-slate-400 mt-1 max-w-lg">
                    Suriin ang historikal na pagganap ng algorithmic neural strategy para sa napiling asset bago ito ilungsad sa live na simulated na merkado. Emulated locally.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block uppercase font-mono text-[9px] font-bold">TARGET TICKER</span>
                    <strong className="text-white font-mono text-sm">{selectedAsset.symbol}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-mono text-[9px] font-bold">TIMEFRAME</span>
                    <strong className="text-white font-mono text-xs uppercase">{timeframe} STRUCT</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-mono text-[9px] font-bold">RISK SETTING</span>
                    <strong className="text-indigo-400 font-mono text-xs uppercase">{riskProfile}</strong>
                  </div>
                </div>
              </div>

              {/* Input trigger module */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-5">
                  <div className="p-5 bg-slate-950 border border-slate-850 rounded-2xl">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Settings size={16} className="text-indigo-400" />
                      <span>Backtest Criteria Vector</span>
                    </h3>
                    <div className="space-y-4">
                      {/* Range setting picker */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block mb-1">
                          Simulation Interval Range
                        </label>
                        <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono text-xs cursor-pointer">
                          <option>Past 1 Year (Dynamic Fast Cycle)</option>
                          <option>Past 3 Years (Standard Cycle)</option>
                          <option>Past 5 Years (Macro Market Phase)</option>
                          <option>All Historical ticks (High intensive)</option>
                        </select>
                      </div>

                      {/* Leverage criteria simulated slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                            Simulated Leverage Multiplier
                          </label>
                          <span className="text-xs font-mono font-bold text-white">1x (Spot Baseline)</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          defaultValue="1"
                          disabled
                          className="w-full text-indigo-600 appearance-none bg-slate-900 h-1.5 rounded-full cursor-not-allowed"
                        />
                        <span className="text-[8px] text-slate-600 font-mono select-none mt-1 block">Leverage adjustment locked for portfolio safety boundaries.</span>
                      </div>
                    </div>

                    <button
                      onClick={handleRunBacktest}
                      disabled={isBacktesting}
                      className="w-full mt-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
                    >
                      {isBacktesting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Processing Simulation Data ({backtestProgress}%)</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          <span>Magpatakbo ng Strategy Diagnostico</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Backtest engine state description */}
                  <div className="p-4 bg-indigo-950/10 border border-indigo-900/30 rounded-xl flex items-start gap-3">
                    <ShieldCheck size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white mb-1">Quant Proof Standard Rules</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Dito mo matutuklasan ang tinatayang Win Rate ng robot. Gumagamit ang algorithm ng historical price vectors kasama ang EMA systems upang matiyak ang dynamic accuracy.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Backtester Output Terminal Console Logs */}
                <div className="lg:col-span-7 flex flex-col gap-5">
                  <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 flex flex-col min-h-[220px] max-h-[300px]">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block border-b border-slate-900 pb-2 mb-3">
                      STRATEGY DIAGNOSTIC RENDER CONSOLE
                    </span>
                    <div className="flex-grow font-mono text-[11px] text-indigo-300 space-y-1.5 overflow-y-auto pr-1">
                      {backtestLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-10 text-center text-slate-600">
                          <Terminal size={24} className="opacity-40 mb-2" />
                          <span>Console idle. Mag-click ng "Magpatakbo ng Strategy Diagnostico" sa kaliwa...</span>
                        </div>
                      ) : (
                        backtestLogs.map((log, index) => (
                          <div key={index} className="leading-relaxed whitespace-pre-wrap select-all">
                            {log}
                          </div>
                        ))
                      )}
                      {isBacktesting && (
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-2">
                          <div
                            className="bg-indigo-500 h-full transition-all duration-300"
                            style={{ width: `${backtestProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Finalized results parameters */}
                  {backtestResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-900/80 border border-indigo-950/60 rounded-2xl p-5"
                    >
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center justify-between">
                        <span>STRATEGY PARAMETER DIAGNOSTICS FOR {selectedAsset.symbol}</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase">SIM COMPLETED</span>
                      </h3>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="p-3 bg-slate-950/60 rounded-xl text-center border border-slate-850">
                          <span className="text-[9px] text-slate-500 font-bold block mb-1">CUM. RETURN</span>
                          <span className="text-lg font-mono font-extrabold text-emerald-400">+{backtestResult.netReturn}%</span>
                        </div>
                        <div className="p-3 bg-slate-950/60 rounded-xl text-center border border-slate-850">
                          <span className="text-[9px] text-slate-500 font-bold block mb-1">WIN RATE</span>
                          <span className="text-lg font-mono font-extrabold text-white">{backtestResult.winRate}%</span>
                        </div>
                        <div className="p-3 bg-slate-955/60 rounded-xl text-center border border-slate-850">
                          <span className="text-[9px] text-slate-500 font-bold block mb-1">PROFIT FACTOR</span>
                          <span className="text-lg font-mono font-extrabold text-white">{backtestResult.profitFactor}</span>
                        </div>
                        <div className="p-3 bg-slate-950/60 rounded-xl text-center border border-slate-850">
                          <span className="text-[9px] text-slate-500 font-bold block mb-1">TOTAL TRADES</span>
                          <span className="text-lg font-mono font-extrabold text-slate-300">{backtestResult.totalTrades}</span>
                        </div>
                        <div className="col-span-2 lg:col-span-1 p-3 bg-indigo-950/20 rounded-xl text-center border border-indigo-900/20">
                          <span className="text-[9px] text-indigo-400 font-bold block mb-1">SHARPE RATIO</span>
                          <span className="text-lg font-mono font-extrabold text-indigo-300">{backtestResult.sharpeRatio}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* FOOTER SECTION: Standard visual credibility indicators */}
      <footer id="footer-bottom" className="relative mt-auto border-t border-slate-900/80 bg-slate-950/70 py-10 px-6 md:px-12 z-10 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="font-mono text-slate-300">ACS.PINOY.AI.TRADING Engine v3.4</span>
            </div>
            <span>© 2026 ACS.PINOY.AI.TRADING INC. All Rights Reserved.</span>
            <span>Simulated Broker Model for learning and analytical synthesis. No real money involved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Trusted Core Systems:</span>
            <div className="flex gap-4 items-center opacity-40 hover:opacity-75 transition-opacity">
              <div className="w-16 h-3 bg-slate-700 rounded-md"></div>
              <div className="w-14 h-3 bg-slate-700 rounded-md"></div>
              <div className="w-18 h-3 bg-slate-700 rounded-md"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
