import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { arcTestnet } from './lib/chains';
import { formatUnits } from 'viem';
import { calculateBuy, calculateSell } from './lib/cpmm';
import { 
  PredictionMarket, 
  Position, 
  Transaction, 
  MarketCategory,
  PortfolioSummary
} from './types';

// Import UI Components
import { Navbar } from './components/Navbar';
import { MarketCard } from './components/MarketCard';
import { MarketDetail } from './components/MarketDetail';
import { Portfolio } from './components/Portfolio';
import { CreateMarket } from './components/CreateMarket';
import { Faucet } from './components/Faucet';

// Icon library imports
import { 
  TrendingUp, 
  Cpu, 
  Globe, 
  Scale, 
  Music,
  CheckCircle,
  XCircle,
  Info,
  LifeBuoy,
  HelpCircle,
  Briefcase,
  Trash2,
  Send
} from 'lucide-react';

export default function App() {
  // Navigation & State Mode
  const [activeTab, setActiveTab] = useState<'MARKETS' | 'PORTFOLIO' | 'CREATE' | 'FAUCET'>('MARKETS');
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('ALL');
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>('YES');

  // Notifications/Toasts state
  const [toasts, setToasts] = useState<any[]>([]);

  // Demo Mode Local Sandbox balances
  const [demoUsdcBalance, setDemoUsdcBalance] = useState<number>(2500);
  const [demoPositions, setDemoPositions] = useState<Position[]>([]);
  const [demoTransactions, setDemoTransactions] = useState<Transaction[]>([]);

  // Polymarket-style dashboard extensions
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [supportMsg, setSupportMsg] = useState<string>('');

  // Web3 Mode WAGMI state hooks
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  // Fetch real on-chain balance if connected on Arc Testnet
  const { data: balanceData } = useBalance({
    address,
    chainId: arcTestnet.id,
  });

  const web3UsdcBalance = balanceData 
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals)) 
    : 0;

  // Active wallet details wrapper
  const usdcBalance = isDemoMode ? demoUsdcBalance : web3UsdcBalance;
  const userPositions = isDemoMode ? demoPositions : []; // Web3 mode uses on-chain contracts (mocked as demo state in this prototype)
  const transactions = isDemoMode ? demoTransactions : [];

  // Generate random transaction hashes
  const generateTxHash = () => {
    return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  // Launch a toast notification
  const addToast = (title: string, desc: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Active markets state
  const [markets, setMarkets] = useState<PredictionMarket[]>([
    {
      id: 'btc-150k-2026',
      question: 'Will Bitcoin breach $150,000 in 2026?',
      description: 'This market resolves to YES if Bitcoin (BTC) reaches a trading price of $150,000.00 or higher on any major global exchange (Coinbase, Binance, Kraken) on or before December 31, 2026, at 23:59 UTC. Otherwise, resolves to NO. Settlement is verified via primary spot price index feeds.',
      category: 'CRYPTO',
      volume: 452800,
      endDate: '2026-12-31',
      resolutionSource: 'https://coinmarketcap.com',
      yesPrice: 0.62,
      noPrice: 0.38,
      yesSharesPool: 380000,
      noSharesPool: 620000,
      status: 'ACTIVE',
      icon: 'TrendingUp',
      sparklineData: [0.5, 0.52, 0.51, 0.55, 0.54, 0.58, 0.6, 0.59, 0.61, 0.62],
      history: [
        { timestamp: 'May 1', yesPrice: 0.5 },
        { timestamp: 'May 3', yesPrice: 0.52 },
        { timestamp: 'May 5', yesPrice: 0.51 },
        { timestamp: 'May 7', yesPrice: 0.55 },
        { timestamp: 'May 9', yesPrice: 0.54 },
        { timestamp: 'May 11', yesPrice: 0.58 },
        { timestamp: 'May 13', yesPrice: 0.6 },
        { timestamp: 'May 15', yesPrice: 0.59 },
        { timestamp: 'May 17', yesPrice: 0.61 },
        { timestamp: 'May 18 (Today)', yesPrice: 0.62 }
      ]
    },
    {
      id: 'uk-election-labour-next',
      question: 'Will the next UK Prime Minister be a member of the Labour Party?',
      description: 'This market resolves to YES if the next individual officially appointed as UK Prime Minister following the next General Election is a registered member of the Labour Party. Otherwise, resolves to NO. Settlement is audited via government parliamentary record updates.',
      category: 'POLITICS',
      volume: 312450,
      endDate: '2026-11-30',
      resolutionSource: 'https://parliament.uk',
      yesPrice: 0.76,
      noPrice: 0.24,
      yesSharesPool: 240000,
      noSharesPool: 760000,
      status: 'ACTIVE',
      icon: 'Scale',
      sparklineData: [0.65, 0.68, 0.7, 0.72, 0.73, 0.75, 0.74, 0.76, 0.76, 0.76],
      history: [
        { timestamp: 'May 1', yesPrice: 0.65 },
        { timestamp: 'May 5', yesPrice: 0.68 },
        { timestamp: 'May 9', yesPrice: 0.72 },
        { timestamp: 'May 13', yesPrice: 0.75 },
        { timestamp: 'May 18 (Today)', yesPrice: 0.76 }
      ]
    },
    {
      id: 'llama4-1t-2026',
      question: 'Will Meta launch Llama-4 with over 1T parameters before July 1, 2026?',
      description: 'This market resolves to YES if Meta Platforms announces and officially releases an open-weight model designated as Llama-4 with a parameter size equal to or exceeding 1 trillion parameters on or before June 30, 2026, 23:59 UTC. Parameter counts must be explicitly specified in scientific release documentation.',
      category: 'AI',
      volume: 289450,
      endDate: '2026-06-30',
      resolutionSource: 'https://ai.meta.com',
      yesPrice: 0.45,
      noPrice: 0.55,
      yesSharesPool: 550000,
      noSharesPool: 450000,
      status: 'ACTIVE',
      icon: 'Cpu',
      sparklineData: [0.35, 0.38, 0.4, 0.42, 0.4, 0.43, 0.46, 0.44, 0.45, 0.45],
      history: [
        { timestamp: 'May 1', yesPrice: 0.35 },
        { timestamp: 'May 3', yesPrice: 0.38 },
        { timestamp: 'May 5', yesPrice: 0.4 },
        { timestamp: 'May 7', yesPrice: 0.42 },
        { timestamp: 'May 9', yesPrice: 0.4 },
        { timestamp: 'May 11', yesPrice: 0.43 },
        { timestamp: 'May 13', yesPrice: 0.46 },
        { timestamp: 'May 15', yesPrice: 0.44 },
        { timestamp: 'May 17', yesPrice: 0.45 },
        { timestamp: 'May 18 (Today)', yesPrice: 0.45 }
      ]
    },
    {
      id: 'france-worldcup-2026',
      question: 'Will France win the 2026 FIFA World Cup?',
      description: 'This market resolves to YES if the French Men\'s National Football Team wins the FIFA World Cup tournament scheduled to conclude in 2026. Otherwise, resolves to NO. Settlement is verified via the official FIFA match result log.',
      category: 'POP',
      volume: 512190,
      endDate: '2026-07-19',
      resolutionSource: 'https://fifa.com',
      yesPrice: 0.18,
      noPrice: 0.82,
      yesSharesPool: 820000,
      noSharesPool: 180000,
      status: 'ACTIVE',
      icon: 'Music',
      sparklineData: [0.15, 0.16, 0.16, 0.17, 0.18, 0.17, 0.19, 0.18, 0.18, 0.18],
      history: [
        { timestamp: 'May 1', yesPrice: 0.15 },
        { timestamp: 'May 5', yesPrice: 0.16 },
        { timestamp: 'May 9', yesPrice: 0.17 },
        { timestamp: 'May 13', yesPrice: 0.18 },
        { timestamp: 'May 18 (Today)', yesPrice: 0.18 }
      ]
    },
    {
      id: 'starship-mars-2026',
      question: 'Will SpaceX land Starship on Mars before 2027?',
      description: 'This market resolves to YES if SpaceX successfully executes a soft, uncrewed landing of a Starship orbital flight vehicle on the surface of Mars on or before December 31, 2026, 23:59 UTC. Verified by telemetry data and press feeds published directly by SpaceX and NASA.',
      category: 'SCIENCE',
      volume: 712300,
      endDate: '2026-12-31',
      resolutionSource: 'https://spacex.com',
      yesPrice: 0.28,
      noPrice: 0.72,
      yesSharesPool: 720000,
      noSharesPool: 280000,
      status: 'ACTIVE',
      icon: 'Globe',
      sparklineData: [0.2, 0.22, 0.25, 0.23, 0.24, 0.26, 0.25, 0.27, 0.28, 0.28],
      history: [
        { timestamp: 'May 1', yesPrice: 0.2 },
        { timestamp: 'May 3', yesPrice: 0.22 },
        { timestamp: 'May 5', yesPrice: 0.25 },
        { timestamp: 'May 7', yesPrice: 0.23 },
        { timestamp: 'May 9', yesPrice: 0.24 },
        { timestamp: 'May 11', yesPrice: 0.26 },
        { timestamp: 'May 13', yesPrice: 0.25 },
        { timestamp: 'May 15', yesPrice: 0.27 },
        { timestamp: 'May 17', yesPrice: 0.28 },
        { timestamp: 'May 18 (Today)', yesPrice: 0.28 }
      ]
    },
    {
      id: 'eu-exit-2026',
      question: 'Will any nation officially exit the European Union by the end of 2026?',
      description: 'This market resolves to YES if any member state of the European Union (EU) officially ceases to be a member state under Article 50 of the Treaty on European Union on or before December 31, 2026. Otherwise, resolves to NO. Settlement is verified via the European Commission portal.',
      category: 'POLITICS',
      volume: 142500,
      endDate: '2026-12-31',
      resolutionSource: 'https://commission.europa.eu',
      yesPrice: 0.12,
      noPrice: 0.88,
      yesSharesPool: 880000,
      noSharesPool: 120000,
      status: 'ACTIVE',
      icon: 'Scale',
      sparklineData: [0.15, 0.14, 0.13, 0.13, 0.12, 0.13, 0.11, 0.12, 0.12, 0.12],
      history: [
        { timestamp: 'May 1', yesPrice: 0.15 },
        { timestamp: 'May 5', yesPrice: 0.14 },
        { timestamp: 'May 9', yesPrice: 0.13 },
        { timestamp: 'May 13', yesPrice: 0.12 },
        { timestamp: 'May 18 (Today)', yesPrice: 0.12 }
      ]
    },
    {
      id: 'f1-africa-2027',
      question: 'Will Formula 1 announce an active African Grand Prix for the 2027 season?',
      description: 'This market resolves to YES if the official Formula One (F1) schedule for the 2027 calendar year contains a Grand Prix located in any sovereign state in Africa (e.g. Kyalami Grand Prix Circuit, South Africa). The calendar announcement must be verified by the FIA.',
      category: 'POP',
      volume: 98120,
      endDate: '2026-10-31',
      resolutionSource: 'https://formula1.com',
      yesPrice: 0.54,
      noPrice: 0.46,
      yesSharesPool: 460000,
      noSharesPool: 540000,
      status: 'ACTIVE',
      icon: 'Music',
      sparklineData: [0.65, 0.63, 0.6, 0.58, 0.57, 0.55, 0.56, 0.53, 0.54, 0.54],
      history: [
        { timestamp: 'May 1', yesPrice: 0.65 },
        { timestamp: 'May 3', yesPrice: 0.63 },
        { timestamp: 'May 5', yesPrice: 0.6 },
        { timestamp: 'May 7', yesPrice: 0.58 },
        { timestamp: 'May 9', yesPrice: 0.57 },
        { timestamp: 'May 11', yesPrice: 0.55 },
        { timestamp: 'May 13', yesPrice: 0.56 },
        { timestamp: 'May 15', yesPrice: 0.53 },
        { timestamp: 'May 17', yesPrice: 0.54 },
        { timestamp: 'May 18 (Today)', yesPrice: 0.54 }
      ]
    }
  ]);

  // Aggregate global platform volume dynamically
  const platformVolume = markets.reduce((acc, m) => acc + m.volume, 0);

  // Trigger web3 wallet connection prompt
  const handleConnectWallet = (connector: any) => {
    if (connector) {
      connect({ connector });
      addToast('Connecting Wallet', `Connecting to ${connector.name}...`, 'info');
    } else {
      const injected = connectors.find(c => c.id === 'injected') || connectors[0];
      if (injected) {
        connect({ connector: injected });
        addToast('Connecting Wallet', 'Connecting your Ethereum provider to Arc Testnet...', 'info');
      } else {
        addToast('No Wallet Found', 'No Web3 browser extension detected. Please download MetaMask or try Demo Mode!', 'error');
      }
    }
  };

  // Claim Demo Mode Faucet Minting
  const handleClaimFaucet = () => {
    setDemoUsdcBalance((prev) => prev + 10000);
    const tx = generateTxHash();
    
    // Add transaction ledger log
    const ledgerItem: Transaction = {
      id: Date.now().toString(),
      type: 'FAUCET',
      amountUsdc: 10000,
      timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      txHash: tx
    };
    
    setDemoTransactions((prev) => [ledgerItem, ...prev]);
    addToast(
      'Faucet Mint Successful', 
      `Successfully minted $10,000.00 USDC to Demo Wallet. Tx: ${tx.slice(0, 10)}...`, 
      'success'
    );
  };

  // Place a Limit Order
  const handlePlaceLimitOrder = (
    marketId: string,
    marketQuestion: string,
    outcome: 'YES' | 'NO',
    type: 'BUY' | 'SELL',
    limitPrice: number,
    shares: number,
    amountUsdc: number
  ) => {
    if (isDemoMode) {
      if (type === 'BUY') {
        if (amountUsdc > demoUsdcBalance) {
          addToast('Order Placement Failed', 'Insufficient USDC balance to place limit order escrow.', 'error');
          return;
        }
        setDemoUsdcBalance((prev) => prev - amountUsdc);
      } else {
        // Escrow shares (reduce positions)
        const posId = `${marketId}-${outcome}`;
        const existing = demoPositions.find(p => p.id === posId);
        if (!existing || existing.quantity < shares) {
          addToast('Order Placement Failed', 'Insufficient shares owned to escrow for limit sell order.', 'error');
          return;
        }
        setDemoPositions((prev) => 
          prev.map(p => p.id === posId ? { ...p, quantity: p.quantity - shares } : p).filter(p => p.quantity > 0)
        );
      }

      const newOrder = {
        id: Date.now().toString(),
        marketId,
        marketQuestion,
        outcome,
        type,
        price: limitPrice,
        shares,
        amountUsdc,
        timestamp: 'Just now'
      };

      setOpenOrders((prev) => [...prev, newOrder]);
      addToast(
        'Limit Order Placed', 
        `Placed limit order to ${type.toLowerCase()} ${shares.toFixed(0)} ${outcome} shares at $${limitPrice.toFixed(2)} USDC.`, 
        'success'
      );
      setSelectedMarket(null); // Return to lobby to see the order immediately!
    } else {
      addToast('Limit Order Blocked', 'Web3 on-chain limit orders require an active off-chain relayer. Switch to Demo Mode to test!', 'info');
    }
  };

  // Cancel an active pending limit order
  const handleCancelLimitOrder = (orderId: string) => {
    const order = openOrders.find(o => o.id === orderId);
    if (!order) return;

    if (isDemoMode) {
      if (order.type === 'BUY') {
        setDemoUsdcBalance((prev) => prev + order.amountUsdc);
      } else {
        // Refund shares
        const posId = `${order.marketId}-${order.outcome}`;
        setDemoPositions((prev) => {
          const idx = prev.findIndex(p => p.id === posId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              quantity: updated[idx].quantity + order.shares
            };
            return updated;
          } else {
            return [
              ...prev,
              {
                id: posId,
                marketId: order.marketId,
                marketQuestion: order.marketQuestion,
                outcome: order.outcome,
                quantity: order.shares,
                avgBuyPrice: order.price,
                currentPrice: order.price,
                value: order.amountUsdc,
                unrealizedPnL: 0,
                unrealizedPnLPct: 0
              }
            ];
          }
        });
      }

      setOpenOrders((prev) => prev.filter(o => o.id !== orderId));
      addToast('Order Cancelled', 'Limit order cancelled and escrow refunded.', 'info');
    }
  };

  // Dynamic Limit Order Fill Engine
  useEffect(() => {
    if (openOrders.length === 0 || !isDemoMode) return;

    const interval = setInterval(() => {
      const filledOrderIdx = openOrders.findIndex((order) => {
        const mkt = markets.find(m => m.id === order.marketId);
        if (!mkt) return false;
        
        const currentPrice = order.outcome === 'YES' ? mkt.yesPrice : mkt.noPrice;
        if (order.type === 'BUY') {
          return currentPrice <= order.price;
        } else {
          return currentPrice >= order.price;
        }
      });

      if (filledOrderIdx >= 0) {
        const order = openOrders[filledOrderIdx];
        const tx = generateTxHash();
        
        if (order.type === 'BUY') {
          const posId = `${order.marketId}-${order.outcome}`;
          setDemoPositions((prev) => {
            const idx = prev.findIndex(p => p.id === posId);
            if (idx >= 0) {
              const existing = prev[idx];
              const newQty = existing.quantity + order.shares;
              const newCost = (existing.quantity * existing.avgBuyPrice) + order.amountUsdc;
              const updated = [...prev];
              updated[idx] = {
                ...existing,
                quantity: newQty,
                avgBuyPrice: newCost / newQty,
                currentPrice: order.price,
                value: newQty * order.price,
                unrealizedPnL: 0,
                unrealizedPnLPct: 0
              };
              return updated;
            } else {
              return [
                ...prev,
                {
                  id: posId,
                  marketId: order.marketId,
                  marketQuestion: order.marketQuestion,
                  outcome: order.outcome,
                  quantity: order.shares,
                  avgBuyPrice: order.price,
                  currentPrice: order.price,
                  value: order.amountUsdc,
                  unrealizedPnL: 0,
                  unrealizedPnLPct: 0
                }
              ];
            }
          });

          setDemoTransactions((prev) => [
            {
              id: Date.now().toString(),
              marketId: order.marketId,
              marketQuestion: order.marketQuestion,
              type: 'BUY',
              outcome: order.outcome,
              amountUsdc: order.amountUsdc,
              sharesQuantity: order.shares,
              pricePerShare: order.price,
              timestamp: 'Just now',
              txHash: tx
            },
            ...prev
          ]);
        } else {
          // SELL order filled
          setDemoUsdcBalance((prev) => prev + order.amountUsdc);

          setDemoTransactions((prev) => [
            {
              id: Date.now().toString(),
              marketId: order.marketId,
              marketQuestion: order.marketQuestion,
              type: 'SELL',
              outcome: order.outcome,
              amountUsdc: order.amountUsdc,
              sharesQuantity: order.shares,
              pricePerShare: order.price,
              timestamp: 'Just now',
              txHash: tx
            },
            ...prev
          ]);
        }

        setOpenOrders((prev) => prev.filter(o => o.id !== order.id));
        addToast(
          'Limit Order Filled! 🎉', 
          `Limit order to ${order.type.toLowerCase()} ${order.shares.toFixed(0)} ${order.outcome} shares of "${order.marketQuestion.slice(0, 30)}..." filled completely at $${order.price.toFixed(2)} USDC!`,
          'success'
        );
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [openOrders, markets, isDemoMode]);

  // Launch custom market
  const handleCreateMarket = (marketData: {
    question: string;
    description: string;
    category: Exclude<MarketCategory, 'ALL'>;
    endDate: string;
    resolutionSource: string;
    initialYesOdds: number;
    icon: string;
  }) => {
    const yesReserve = 500000;
    const noReserve = yesReserve * ((1 - marketData.initialYesOdds) / marketData.initialYesOdds);
    
    const newMkt: PredictionMarket = {
      id: marketData.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 36),
      question: marketData.question,
      description: marketData.description,
      category: marketData.category,
      volume: 10000, // Initial liquidity value
      endDate: marketData.endDate,
      resolutionSource: marketData.resolutionSource,
      yesPrice: marketData.initialYesOdds,
      noPrice: 1 - marketData.initialYesOdds,
      yesSharesPool: yesReserve,
      noSharesPool: noReserve,
      status: 'ACTIVE',
      icon: marketData.icon,
      sparklineData: [marketData.initialYesOdds, marketData.initialYesOdds],
      history: [
        { timestamp: 'Launched', yesPrice: marketData.initialYesOdds }
      ]
    };

    setMarkets((prev) => [newMkt, ...prev]);
    addToast('Market Deployed', 'New prediction market successfully launched on the Arc Network!', 'success');
    setActiveTab('MARKETS');
  };

  // Process Buy/Sell trades
  const handleTradeExecuted = (
    marketId: string,
    outcome: 'YES' | 'NO',
    tradeType: 'BUY' | 'SELL',
    amountUsdc: number,
    shares: number,
    pricePerShare: number,
    newYesPool: number,
    newNoPool: number,
    newYesPrice: number
  ) => {
    const tx = generateTxHash();
    const timestampStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Update Market Reserve Pool sizes & historical prices
    setMarkets((prevMarkets) =>
      prevMarkets.map((m) => {
        if (m.id === marketId) {
          const updatedHistory = [
            ...m.history,
            { timestamp: 'Just now', yesPrice: newYesPrice }
          ];
          const updatedSpark = [
            ...m.sparklineData.slice(-9),
            newYesPrice
          ];
          const addedVolume = tradeType === 'BUY' ? amountUsdc : 0; // Sell swaps shares, doesn't add liquidity volume directly

          const updated = {
            ...m,
            yesSharesPool: newYesPool,
            noSharesPool: newNoPool,
            yesPrice: newYesPrice,
            noPrice: 1 - newYesPrice,
            history: updatedHistory,
            sparklineData: updatedSpark,
            volume: m.volume + addedVolume
          };

          // Sync detail view immediately if open
          if (selectedMarket && selectedMarket.id === m.id) {
            setSelectedMarket(updated);
          }

          return updated;
        }
        return m;
      })
    );

    // 2. Adjust Demo Sandbox user balance
    if (isDemoMode) {
      if (tradeType === 'BUY') {
        setDemoUsdcBalance((prev) => prev - amountUsdc);
      } else {
        setDemoUsdcBalance((prev) => prev + amountUsdc);
      }

      // 3. Adjust User Positions
      const posId = `${marketId}-${outcome}`;
      const targetMkt = markets.find(m => m.id === marketId)!;

      setDemoPositions((prevPositions) => {
        const existingIdx = prevPositions.findIndex((p) => p.id === posId);
        
        if (tradeType === 'BUY') {
          if (existingIdx >= 0) {
            const existing = prevPositions[existingIdx];
            const newQty = existing.quantity + shares;
            const newCost = (existing.quantity * existing.avgBuyPrice) + amountUsdc;
            const newAvg = newCost / newQty;
            
            const updated = [...prevPositions];
            updated[existingIdx] = {
              ...existing,
              quantity: newQty,
              avgBuyPrice: newAvg,
              currentPrice: outcome === 'YES' ? newYesPrice : (1 - newYesPrice),
              value: newQty * (outcome === 'YES' ? newYesPrice : (1 - newYesPrice)),
              unrealizedPnL: (newQty * (outcome === 'YES' ? newYesPrice : (1 - newYesPrice))) - newCost,
              unrealizedPnLPct: (((newQty * (outcome === 'YES' ? newYesPrice : (1 - newYesPrice))) - newCost) / newCost) * 100
            };
            return updated;
          } else {
            // New position
            const newPos: Position = {
              id: posId,
              marketId,
              marketQuestion: targetMkt.question,
              outcome,
              quantity: shares,
              avgBuyPrice: pricePerShare,
              currentPrice: outcome === 'YES' ? newYesPrice : (1 - newYesPrice),
              value: shares * (outcome === 'YES' ? newYesPrice : (1 - newYesPrice)),
              unrealizedPnL: (shares * (outcome === 'YES' ? newYesPrice : (1 - newYesPrice))) - amountUsdc,
              unrealizedPnLPct: (((shares * (outcome === 'YES' ? newYesPrice : (1 - newYesPrice))) - amountUsdc) / amountUsdc) * 100
            };
            return [...prevPositions, newPos];
          }
        } else {
          // Sell shares
          if (existingIdx >= 0) {
            const existing = prevPositions[existingIdx];
            const newQty = Math.max(0, existing.quantity - amountUsdc); // in SELL, 'amountUsdc' parameter is shares quantity sold
            
            const updated = [...prevPositions];
            if (newQty <= 0) {
              // Delete position if empty
              return prevPositions.filter(p => p.id !== posId);
            } else {
              const costBasis = newQty * existing.avgBuyPrice;
              updated[existingIdx] = {
                ...existing,
                quantity: newQty,
                value: newQty * (outcome === 'YES' ? newYesPrice : (1 - newYesPrice)),
                currentPrice: outcome === 'YES' ? newYesPrice : (1 - newYesPrice),
                unrealizedPnL: (newQty * (outcome === 'YES' ? newYesPrice : (1 - newYesPrice))) - costBasis,
                unrealizedPnLPct: (((newQty * (outcome === 'YES' ? newYesPrice : (1 - newYesPrice))) - costBasis) / costBasis) * 100
              };
              return updated;
            }
          }
          return prevPositions;
        }
      });

      // 4. Create Ledger transaction entry
      const ledgerEntry: Transaction = {
        id: Date.now().toString(),
        marketId,
        marketQuestion: targetMkt.question,
        type: tradeType,
        outcome,
        amountUsdc: tradeType === 'BUY' ? amountUsdc : (shares * pricePerShare), // shares is USDC payout in SELL
        sharesQuantity: tradeType === 'BUY' ? shares : amountUsdc, // amountUsdc is shares quantity in SELL
        pricePerShare,
        timestamp: timestampStr,
        txHash: tx
      };

      setDemoTransactions((prev) => [ledgerEntry, ...prev]);
      
      const actionVerb = tradeType === 'BUY' ? 'Purchased' : 'Liquidated';
      addToast(
        'Transaction Executed', 
        `Successfully ${actionVerb} ${shares.toFixed(2)} ${outcome} shares. Tx: ${tx.slice(0, 10)}...`, 
        'success'
      );
    }
  };

  // Sell shortcut from portfolio screen
  const handleSellPosition = (marketId: string, outcome: 'YES' | 'NO', quantity: number) => {
    const m = markets.find(m => m.id === marketId)!;
    const sellCalc = calculateSell(
      quantity,
      outcome,
      m.yesSharesPool,
      m.noSharesPool
    );

    handleTradeExecuted(
      marketId,
      outcome,
      'SELL',
      sellCalc.usdcPayout,
      quantity, // shares sold
      sellCalc.avgPrice,
      sellCalc.newYesPool,
      sellCalc.newNoPool,
      sellCalc.newYesPrice
    );
  };

  // Sync Positions current price changes on market price shifts
  useEffect(() => {
    if (isDemoMode && demoPositions.length > 0) {
      setDemoPositions((prevPositions) =>
        prevPositions.map((pos) => {
          const m = markets.find((mkt) => mkt.id === pos.marketId);
          if (m) {
            const currentPrice = pos.outcome === 'YES' ? m.yesPrice : m.noPrice;
            const costBasis = pos.quantity * pos.avgBuyPrice;
            return {
              ...pos,
              currentPrice,
              value: pos.quantity * currentPrice,
              unrealizedPnL: (pos.quantity * currentPrice) - costBasis,
              unrealizedPnLPct: (((pos.quantity * currentPrice) - costBasis) / costBasis) * 100
            };
          }
          return pos;
        })
      );
    }
  }, [markets, isDemoMode]);

  // Filter lobby cards
  const getFilteredMarkets = () => {
    if (selectedCategory === 'ALL') return markets;
    return markets.filter((m) => m.category === selectedCategory);
  };

  const filteredMarkets = getFilteredMarkets();
  const featuredMarket = markets[0]; // Set BTC market as default header feature

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Toast Notification Container Overlay */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-banner ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && <CheckCircle size={18} className="toast-icon success" />}
              {toast.type === 'error' && <XCircle size={18} className="toast-icon error" />}
              {toast.type === 'info' && <Info size={18} className="toast-icon info" />}
            </div>
            <div className="toast-body">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-desc">{toast.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Network switch prompt if connected to wrong chain in Web3 Mode */}
      {!isDemoMode && isConnected && balanceData === undefined && (
        <div className="network-overlay">
          <div className="glass-panel network-card">
            <div className="network-icon-container">
              <XCircle size={28} />
            </div>
            <h3 className="network-title">Unsupported Chain Detected</h3>
            <p className="network-desc">
              Your wallet is connected to an unsupported network. To view balances and resolve predictions on-chain, please switch your network provider to the <strong>Arc Testnet</strong>.
            </p>
            <button className="btn btn-primary" onClick={handleConnectWallet} style={{ width: '100%' }}>
              Switch to Arc Testnet
            </button>
          </div>
        </div>
      )}

      {/* Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedMarket(null); // Clear selected market on tab switch
        }}
        isDemoMode={isDemoMode}
        setIsDemoMode={setIsDemoMode}
        usdcBalance={usdcBalance}
        isConnected={isConnected}
        address={address}
        connectWallet={handleConnectWallet}
        disconnectWallet={disconnect}
        totalVolume={platformVolume}
        connectors={connectors}
      />

      {/* Main app screens router */}
      <main className="main-content">
        {selectedMarket ? (
          /* Market detail page view */
          <MarketDetail
            market={selectedMarket}
            usdcBalance={usdcBalance}
            onBack={() => setSelectedMarket(null)}
            onTradeExecuted={handleTradeExecuted}
            userPositions={userPositions}
            initialOutcome={selectedOutcome}
            onPlaceLimitOrder={handlePlaceLimitOrder}
          />
        ) : (
          /* Router views */
          <>
            {activeTab === 'MARKETS' && (
              <div className="app-container">
                {/* Featured Hot Market Hero Banner */}
                <div className="glass-panel featured-banner glow-accent" onClick={() => setSelectedMarket(featuredMarket)} style={{ cursor: 'pointer' }}>
                  <div className="featured-left">
                    <div>
                      <div className="featured-badge">🔥 HOTTEST MARKET</div>
                      <h2 className="featured-question">{featuredMarket.question}</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '8px 0 16px 0', lineHeight: 1.5 }}>
                        {featuredMarket.description.slice(0, 160)}...
                      </p>
                    </div>
                    <div className="featured-details">
                      <span>Ends: <strong>{featuredMarket.endDate}</strong></span>
                      <span>Volume: <strong>${featuredMarket.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC</strong></span>
                    </div>
                  </div>

                  <div className="featured-right" onClick={(e) => e.stopPropagation()}>
                    <div className="featured-odds-title">Current Settlement Probability</div>
                    <div className="featured-odds-bar">
                      <div className="featured-odd-box yes">
                        <div className="featured-odd-label yes">YES ODDS</div>
                        <div className="featured-odd-pct">{Math.round(featuredMarket.yesPrice * 100)}%</div>
                      </div>
                      <div className="featured-odd-box no">
                        <div className="featured-odd-label no">NO ODDS</div>
                        <div className="featured-odd-pct">{Math.round(featuredMarket.noPrice * 100)}%</div>
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedMarket(featuredMarket)}>
                      Open Price Chart
                    </button>
                  </div>
                </div>

                {/* Two-Column Lobby layout containing main category grid and high-fidelity Polymarket-style sidebars */}
                <div className="lobby-layout" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: '24px' }}>
                  
                  {/* LEFT COLUMN: CATEGORIES AND ACTIVE MARKETS GRID */}
                  <div className="lobby-main" style={{ flex: '1', minWidth: '320px' }}>
                    {/* Category Pill filter rows */}
                    <div className="category-bar">
                      {[
                        { id: 'ALL', label: 'All Prediction Markets' },
                        { id: 'CRYPTO', label: 'Crypto & Chains' },
                        { id: 'AI', label: 'Artificial Intelligence' },
                        { id: 'SCIENCE', label: 'Space & Science' },
                        { id: 'POLITICS', label: 'Politics & News' },
                        { id: 'POP', label: 'Pop Culture & Sports' }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(cat.id as any)}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Markets Grid list */}
                    {filteredMarkets.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        No active markets found under this category.
                      </div>
                    ) : (
                      <div className="markets-grid">
                        {filteredMarkets.map((market) => (
                          <MarketCard
                            key={market.id}
                            market={market}
                            onSelect={(m) => setSelectedMarket(m)}
                            onQuickBuy={(m, outcome) => {
                              setSelectedMarket(m);
                              setSelectedOutcome(outcome);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: HIGH-FIDELITY POLYMARKET WIDGET SIDEBAR */}
                  <div className="lobby-sidebar" style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 }}>
                    
                    {/* WIDGET 1: OPEN POSITIONS */}
                    <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                        <Briefcase size={16} style={{ color: 'var(--color-yes)' }} />
                        Open Positions ({userPositions.length})
                      </h3>
                      {userPositions.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, padding: '10px 0', textAlign: 'center' }}>
                          No active open positions. Buy YES/NO shares on any market to open a position!
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {userPositions.map((pos) => (
                            <div 
                              key={pos.id} 
                              onClick={() => {
                                const m = markets.find(mkt => mkt.id === pos.marketId);
                                if (m) setSelectedMarket(m);
                              }}
                              style={{ 
                                padding: '10px', 
                                background: 'rgba(0,0,0,0.2)', 
                                borderRadius: 'var(--radius-sm)', 
                                border: '1px solid rgba(255,255,255,0.04)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              className="hover-scale"
                            >
                              <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {pos.marketQuestion}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ 
                                    padding: '2px 6px', 
                                    borderRadius: 'var(--radius-xs)', 
                                    fontSize: '9px', 
                                    fontWeight: 700, 
                                    color: '#000',
                                    background: pos.outcome === 'YES' ? 'var(--color-yes)' : 'var(--color-no)'
                                  }}>
                                    {pos.outcome}
                                  </span>
                                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                                    {pos.quantity.toFixed(0)} shares
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: pos.unrealizedPnL >= 0 ? 'var(--color-yes)' : 'var(--color-no)' }}>
                                  ${pos.value.toFixed(2)} ({pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnLPct.toFixed(1)}%)
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* WIDGET 2: OPEN ORDERS */}
                    <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                        <TrendingUp size={16} style={{ color: 'var(--color-accent)' }} />
                        Open Limit Orders ({openOrders.length})
                      </h3>
                      {openOrders.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, padding: '10px 0', textAlign: 'center' }}>
                          No active limit orders. Place a Limit Buy/Sell inside any market details page.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {openOrders.map((ord) => (
                            <div 
                              key={ord.id}
                              style={{ 
                                padding: '10px', 
                                background: 'rgba(0,0,0,0.2)', 
                                borderRadius: 'var(--radius-sm)', 
                                border: '1px solid rgba(255,255,255,0.04)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                                  {ord.marketQuestion}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '10.5px', color: ord.type === 'BUY' ? 'var(--color-yes)' : 'var(--color-no)', fontWeight: 700 }}>
                                    {ord.type} {ord.outcome}
                                  </span>
                                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                    {ord.shares.toFixed(0)} @ ${ord.price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleCancelLimitOrder(ord.id)}
                                className="btn btn-secondary" 
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '10px', 
                                  color: 'var(--color-no)', 
                                  borderColor: 'var(--color-no-glow)',
                                  background: 'rgba(239, 68, 68, 0.05)'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* WIDGET 3: LIVE CHAT & FAQ SUPPORT */}
                    <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                        <LifeBuoy size={16} style={{ color: 'var(--color-accent)' }} />
                        ArcOracle Live Support
                      </h3>
                      
                      {/* Accordion FAQ summary list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        <details style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <summary style={{ fontSize: '11px', padding: '6px 8px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            How are prediction markets resolved?
                          </summary>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', padding: '0 8px 8px 8px', lineHeight: 1.4 }}>
                            Outcomes resolve strictly using official public records audited by decentralized oracle curators on the Arc Testnet.
                          </div>
                        </details>
                        <details style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <summary style={{ fontSize: '11px', padding: '6px 8px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Are there platform trading fees?
                          </summary>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', padding: '0 8px 8px 8px', lineHeight: 1.4 }}>
                            ArcOracle charges a flat 2.00% fee on swap volumes to maintain liquidity pools. Zero fee is charged on limit orders before fill!
                          </div>
                        </details>
                      </div>

                      {/* Ticket Input submission */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          placeholder="Type message to support..."
                          value={supportMsg}
                          onChange={(e) => setSupportMsg(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && supportMsg.trim()) {
                              addToast('Ticket Submitted', 'ArcOracle support ticket successfully opened! An assistant will respond shortly.', 'success');
                              setSupportMsg('');
                            }
                          }}
                          style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px 10px',
                            color: 'var(--text-primary)',
                            fontSize: '11.5px'
                          }}
                        />
                        <button 
                          onClick={() => {
                            if (supportMsg.trim()) {
                              addToast('Ticket Submitted', 'ArcOracle support ticket successfully opened! An assistant will respond shortly.', 'success');
                              setSupportMsg('');
                            }
                          }}
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {activeTab === 'PORTFOLIO' && (
              <Portfolio
                positions={userPositions}
                transactions={transactions}
                usdcBalance={usdcBalance}
                onSelectMarket={(marketId) => {
                  const m = markets.find(mkt => mkt.id === marketId);
                  if (m) setSelectedMarket(m);
                }}
                onSellPosition={handleSellPosition}
              />
            )}

            {activeTab === 'CREATE' && (
              <CreateMarket onCreateMarket={handleCreateMarket} />
            )}

            {activeTab === 'FAUCET' && (
              <Faucet
                isDemoMode={isDemoMode}
                onClaimFaucet={handleClaimFaucet}
                isConnected={isConnected}
              />
            )}
          </>
        )}
      </main>

      {/* Global institutional footer */}
      <footer style={{ background: '#030406', padding: '32px 24px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', marginTop: 'auto' }}>
        <div className="app-container">
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            ArcOracle — Institutional Prediction Protocols
          </p>
          <p style={{ marginBottom: '16px', lineHeight: 1.6 }}>
            Powered exclusively by the <strong>Arc Network</strong>. Settlement contracts interact with the native EVM layer utilizing stable USDC denominations. Sandbox simulated models calculate real-time Constant Product bonding curve slippages.
          </p>
          <p>© 2026 ArcOracle. Built with React, TypeScript, and WAGMI.</p>
        </div>
      </footer>
    </div>
  );
}
