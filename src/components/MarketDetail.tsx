import React, { useState, useRef, useEffect } from 'react';
import { PredictionMarket, Position, Transaction } from '../types';
import { calculateBuy, calculateSell } from '../lib/cpmm';
import { 
  TrendingUp, 
  ArrowLeft, 
  Calendar, 
  Globe, 
  Check, 
  MessageSquare, 
  AlertTriangle,
  Info,
  Send,
  Loader
} from 'lucide-react';

interface MarketDetailProps {
  market: PredictionMarket;
  usdcBalance: number;
  onBack: () => void;
  onTradeExecuted: (
    marketId: string,
    outcome: 'YES' | 'NO',
    tradeType: 'BUY' | 'SELL',
    amountUsdc: number,
    shares: number,
    pricePerShare: number,
    newYesPool: number,
    newNoPool: number,
    newYesPrice: number
  ) => void;
  userPositions: Position[];
  initialOutcome?: 'YES' | 'NO';
  onPlaceLimitOrder?: (
    marketId: string,
    marketQuestion: string,
    outcome: 'YES' | 'NO',
    type: 'BUY' | 'SELL',
    limitPrice: number,
    shares: number,
    amountUsdc: number
  ) => void;
}

export const MarketDetail: React.FC<MarketDetailProps> = ({
  market,
  usdcBalance,
  onBack,
  onTradeExecuted,
  userPositions,
  initialOutcome,
  onPlaceLimitOrder
}) => {
  // Trade Terminal State
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>(initialOutcome || 'YES');
  const [inputAmount, setInputAmount] = useState<string>('100');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [infoTab, setInfoTab] = useState<'BOOK' | 'DISCUSS' | 'RULES'>('BOOK');
  const [timeframe, setTimeframe] = useState<'24H' | '1W' | '1M' | 'ALL'>('1M');
  const [orderMethod, setOrderMethod] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPriceInput, setLimitPriceInput] = useState<string>('');

  useEffect(() => {
    setLimitPriceInput(selectedOutcome === 'YES' ? market.yesPrice.toFixed(2) : market.noPrice.toFixed(2));
  }, [selectedOutcome, market.yesPrice, market.noPrice]);

  // Chart Hover State
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; date: string } | null>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  // Discussion Forum State
  const [comments, setComments] = useState<any[]>([
    { id: 1, user: 'Arc鯨 (0x8b32)', stance: 'YES', text: 'This outcome is practically guaranteed. Look at the developer commit rates on Arc Network, they are building around the clock.', time: '12m ago' },
    { id: 2, user: 'ProphetMax', stance: 'NO', text: 'Markets are overpricing this. Regulatory hurdles will slow down the announcement by at least two quarters.', time: '43m ago' },
    { id: 3, user: 'BaseMigrator', stance: 'YES', text: 'Native USDC gas fees on Arc Testnet mean the UX is incredibly smooth. Volume will skyrocket soon.', time: '2h ago' }
  ]);
  const [newComment, setNewComment] = useState<string>('');

  // Check if user has active shares to sell
  const activePosition = userPositions.find(
    p => p.marketId === market.id && p.outcome === selectedOutcome
  );

  // Math Calculations for Trade
  const usdcNum = parseFloat(inputAmount) || 0;
  
  let tradeCalc: any = null;
  let sellCalc: any = null;
  let isInvalid = false;
  let errorMsg = '';

  if (tradeType === 'BUY') {
    if (usdcNum <= 0) {
      isInvalid = true;
    } else if (usdcNum > usdcBalance) {
      isInvalid = true;
      errorMsg = 'Insufficient USDC Balance';
    }
    tradeCalc = calculateBuy(
      usdcNum > 0 ? usdcNum : 0.01,
      selectedOutcome,
      market.yesSharesPool,
      market.noSharesPool
    );
  } else {
    // SELL calculations
    const maxSharesAvailable = activePosition ? activePosition.quantity : 0;
    if (usdcNum <= 0) {
      isInvalid = true;
    } else if (usdcNum > maxSharesAvailable) {
      isInvalid = true;
      errorMsg = `Insufficient ${selectedOutcome} shares owned`;
    }
    sellCalc = calculateSell(
      usdcNum > 0 ? usdcNum : 0.01,
      selectedOutcome,
      market.yesSharesPool,
      market.noSharesPool
    );
  }

  // Handle transaction submit
  const handleExecuteTrade = () => {
    if (isInvalid) return;
    setIsSubmitting(true);
    
    // Simulate web3 signature delays
    setTimeout(() => {
      if (orderMethod === 'LIMIT') {
        const lp = parseFloat(limitPriceInput) || 0.5;
        let finalShares = 0;
        let finalUsdc = 0;
        if (tradeType === 'BUY') {
          finalUsdc = usdcNum;
          finalShares = lp > 0 ? (usdcNum / lp) : 0;
        } else {
          finalShares = usdcNum; // for sell, input is shares to sell
          finalUsdc = finalShares * lp;
        }

        if (onPlaceLimitOrder) {
          onPlaceLimitOrder(
            market.id,
            market.question,
            selectedOutcome,
            tradeType,
            lp,
            finalShares,
            finalUsdc
          );
        }
      } else {
        if (tradeType === 'BUY') {
          onTradeExecuted(
            market.id,
            selectedOutcome,
            'BUY',
            usdcNum,
            tradeCalc.shares,
            tradeCalc.avgPrice,
            tradeCalc.newYesPool,
            tradeCalc.newNoPool,
            tradeCalc.newYesPrice
          );
        } else {
          onTradeExecuted(
            market.id,
            selectedOutcome,
            'SELL',
            sellCalc.usdcPayout,
            usdcNum, // shares sold
            sellCalc.avgPrice,
            sellCalc.newYesPool,
            sellCalc.newNoPool,
            sellCalc.newYesPrice
          );
        }
      }
      setIsSubmitting(false);
      setInputAmount('0');
    }, 1200);
  };

  // Add Comment
  const submitComment = () => {
    if (!newComment.trim()) return;
    const commentObj = {
      id: Date.now(),
      user: `Player (0x${Math.random().toString(16).slice(2, 6)})`,
      stance: selectedOutcome,
      text: newComment,
      time: 'Just now'
    };
    setComments([commentObj, ...comments]);
    setNewComment('');
  };

  // Chart Rendering Math
  const historyPoints = market.history;
  const chartHeight = 240;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 20;

  // Filter history points based on timeframe selection
  const getFilteredHistory = () => {
    if (timeframe === '24H') return historyPoints.slice(-4);
    if (timeframe === '1W') return historyPoints.slice(-7);
    if (timeframe === '1M') return historyPoints.slice(-15);
    return historyPoints;
  };

  const activeHistory = getFilteredHistory();

  // Create SVG path coords
  const mapPoints = () => {
    if (activeHistory.length < 2) return { linePath: '', areaPath: '', coords: [] };
    
    const w = chartWidth - paddingX * 2;
    const h = chartHeight - paddingY * 2;
    
    const coords = activeHistory.map((pt, index) => {
      const x = paddingX + (index / (activeHistory.length - 1)) * w;
      // Map 0.0 to Y=h+paddingY (bottom) and 1.0 to Y=paddingY (top)
      const y = paddingY + (1 - pt.yesPrice) * h;
      return { x, y, price: pt.yesPrice, date: pt.timestamp };
    });

    const linePath = coords.reduce((acc, c, idx) => {
      return idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`;
    }, '');

    const areaPath = `
      ${linePath}
      L ${coords[coords.length - 1].x} ${chartHeight - paddingY}
      L ${coords[0].x} ${chartHeight - paddingY}
      Z
    `;

    return { linePath, areaPath, coords };
  };

  const { linePath, areaPath, coords } = mapPoints();

  // Handle mouse move on SVG for tooltip tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!chartRef.current || coords.length === 0) return;
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Scale factor between SVG native coordinate space and actual onscreen bounds
    const scaleX = chartWidth / rect.width;
    const scaledMouseX = mouseX * scaleX;

    // Find nearest point along the horizontal axis
    let nearest = coords[0];
    let minDist = Math.abs(coords[0].x - scaledMouseX);

    for (let i = 1; i < coords.length; i++) {
      const dist = Math.abs(coords[i].x - scaledMouseX);
      if (dist < minDist) {
        minDist = dist;
        nearest = coords[i];
      }
    }

    setHoveredPoint({
      x: nearest.x,
      y: nearest.y,
      price: nearest.price,
      date: nearest.date
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const currentProbability = Math.round(market.yesPrice * 100);
  const initialProbability = Math.round(market.history[0].yesPrice * 100);
  const probChange = currentProbability - initialProbability;

  return (
    <div className="app-container">
      {/* Back button */}
      <button 
        className="btn btn-secondary" 
        onClick={onBack}
        style={{ marginBottom: '24px', padding: '8px 14px' }}
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </button>

      <div className="detail-grid">
        {/* Left main pane */}
        <div className="detail-left">
          {/* Header Card */}
          <div className="glass-panel detail-header">
            <span className="featured-badge">{market.category}</span>
            <h1 className="detail-title">{market.question}</h1>
            
            <div className="detail-meta-row">
              <div className="detail-meta-item">
                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Expires: <strong style={{ color: 'var(--text-primary)' }}>{market.endDate}</strong></span>
              </div>
              <div className="detail-meta-item">
                <Globe size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Source: <a href={market.resolutionSource} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>Consensus Oracle</a></span>
              </div>
              <div className="detail-meta-item">
                <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Total Pool: <strong style={{ color: 'var(--text-primary)' }}>${market.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC</strong></span>
              </div>
            </div>
          </div>

          {/* Interactive Spark Chart */}
          <div className="glass-panel detail-chart-card">
            <div className="chart-header">
              <div className="chart-title-group">
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>YES outcome probability</span>
                <div className="chart-current-prob">
                  {hoveredPoint ? `${Math.round(hoveredPoint.price * 100)}%` : `${currentProbability}%`}
                  <span 
                    className={`chart-change-indicator ${probChange >= 0 ? 'up' : 'down'}`}
                  >
                    {probChange >= 0 ? '▲' : '▼'} {Math.abs(probChange)}% ({timeframe})
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {hoveredPoint ? hoveredPoint.date : 'Current Market Price'}
                </span>
              </div>

              {/* Timeframe filters */}
              <div className="chart-timeframe-group">
                {(['24H', '1W', '1M', 'ALL'] as const).map(tf => (
                  <button
                    key={tf}
                    className={`chart-tf-btn ${timeframe === tf ? 'active' : ''}`}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Chart area */}
            <div className="chart-container">
              <svg
                ref={chartRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ overflow: 'visible', cursor: 'crosshair' }}
              >
                <defs>
                  {/* Glowing background area gradient */}
                  <linearGradient id="chart-area-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={probChange >= 0 ? 'var(--color-yes)' : 'var(--color-no)'} stopOpacity="0.18" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                {[0.25, 0.5, 0.75].map(v => (
                  <line
                    key={v}
                    x1={paddingX}
                    y1={paddingY + (1 - v) * (chartHeight - paddingY * 2)}
                    x2={chartWidth - paddingX}
                    y2={paddingY + (1 - v) * (chartHeight - paddingY * 2)}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Plot Paths */}
                {coords.length >= 2 && (
                  <>
                    {/* Background Shaded Area */}
                    <path d={areaPath} fill="url(#chart-area-glow)" />
                    
                    {/* Glowing Outline */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke={probChange >= 0 ? 'var(--color-yes)' : 'var(--color-no)'}
                      strokeWidth="2.5"
                    />
                    <path
                      d={linePath}
                      fill="none"
                      stroke={probChange >= 0 ? 'var(--color-yes)' : 'var(--color-no)'}
                      strokeWidth="6"
                      strokeOpacity="0.1"
                    />
                  </>
                )}

                {/* Hover Cursor Overlays */}
                {hoveredPoint && (
                  <>
                    {/* Vertical guideline */}
                    <line
                      x1={hoveredPoint.x}
                      y1={paddingY}
                      x2={hoveredPoint.x}
                      y2={chartHeight - paddingY}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />
                    
                    {/* Horizontal guideline */}
                    <line
                      x1={paddingX}
                      y1={hoveredPoint.y}
                      x2={chartWidth - paddingX}
                      y2={hoveredPoint.y}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />

                    {/* Tracking glowing dot */}
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="7"
                      fill={probChange >= 0 ? 'var(--color-yes)' : 'var(--color-no)'}
                      stroke="var(--bg-dark)"
                      strokeWidth="2.5"
                      style={{ filter: `drop-shadow(0 0 4px ${probChange >= 0 ? 'var(--color-yes)' : 'var(--color-no)'})` }}
                    />
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Social book depth and discussion forum card tabs */}
          <div className="glass-panel detail-rules-card">
            <div className="info-tabs">
              <span 
                className={`info-tab ${infoTab === 'BOOK' ? 'active' : ''}`}
                onClick={() => setInfoTab('BOOK')}
              >
                Order Book
              </span>
              <span 
                className={`info-tab ${infoTab === 'DISCUSS' ? 'active' : ''}`}
                onClick={() => setInfoTab('DISCUSS')}
              >
                Discussions ({comments.length})
              </span>
              <span 
                className={`info-tab ${infoTab === 'RULES' ? 'active' : ''}`}
                onClick={() => setInfoTab('RULES')}
              >
                Rules & Source
              </span>
            </div>

            {/* TAB: ORDER BOOK */}
            {infoTab === 'BOOK' && (
              <div style={{ padding: '8px 0' }}>
                <table className="orderbook-table">
                  <thead>
                    <tr>
                      <th>Outcome</th>
                      <th>Consensus Probability</th>
                      <th>Bid Depth (USDC)</th>
                      <th>Liquidity Depth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bid-row">
                      <td className="outcome" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} style={{ color: 'var(--color-yes)' }} /> YES bids</td>
                      <td className="price">${market.yesPrice.toFixed(2)} USDC</td>
                      <td>$12,450.00 USDC</td>
                      <td style={{ color: 'var(--text-secondary)' }}>95.8% (Tight)</td>
                    </tr>
                    <tr className="ask-row">
                      <td className="outcome" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} style={{ color: 'var(--color-no)' }} /> NO bids</td>
                      <td className="price">${market.noPrice.toFixed(2)} USDC</td>
                      <td>$8,940.00 USDC</td>
                      <td style={{ color: 'var(--text-secondary)' }}>91.2% (Standard)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: DISCUSSIONS */}
            {infoTab === 'DISCUSS' && (
              <div>
                <div className="comments-list">
                  {comments.map(c => (
                    <div key={c.id} className="comment-box">
                      <div className="comment-header">
                        <span className="comment-user">
                          {c.user}
                          <span className={`comment-badge ${c.stance === 'YES' ? 'yes' : 'no'}`}>
                            {c.stance} stance
                          </span>
                        </span>
                        <span className="comment-time">{c.time}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                    </div>
                  ))}
                </div>

                <div className="comment-input-row">
                  <input
                    type="text"
                    className="comment-input"
                    placeholder={`Argue your ${selectedOutcome} stance on this market...`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  />
                  <button className="btn btn-primary" onClick={submitComment} style={{ padding: '10px 14px' }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB: RULES */}
            {infoTab === 'RULES' && (
              <div className="rules-content">
                <h4 className="rules-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={16} style={{ color: 'var(--color-accent)' }} />
                  Resolution Conditions
                </h4>
                <p style={{ marginBottom: '14px' }}>
                  {market.description}
                </p>
                <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Validation Source:</strong> Resolves exclusively based on primary consensus data verified via <code>{market.resolutionSource}</code>. In the event of conflicting news, settlement is delayed up to 72 hours until absolute audit logs are compiled.
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Trading panel sidebar */}
        <div className="glass-panel trade-card">
          {/* Market vs Limit tab selector */}
          <div className="order-method-toggle" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <button 
              className={`method-tab ${orderMethod === 'MARKET' ? 'active' : ''}`}
              onClick={() => setOrderMethod('MARKET')}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: 'none',
                color: orderMethod === 'MARKET' ? 'var(--color-accent)' : 'var(--text-muted)',
                borderBottom: orderMethod === 'MARKET' ? '2px solid var(--color-accent)' : 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              Market (Swap)
            </button>
            <button 
              className={`method-tab ${orderMethod === 'LIMIT' ? 'active' : ''}`}
              onClick={() => setOrderMethod('LIMIT')}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: 'none',
                color: orderMethod === 'LIMIT' ? 'var(--color-accent)' : 'var(--text-muted)',
                borderBottom: orderMethod === 'LIMIT' ? '2px solid var(--color-accent)' : 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              Limit Order
            </button>
          </div>

          <div className="trade-toggle-row">
            <button 
              className={`trade-toggle-btn ${tradeType === 'BUY' ? 'active' : ''}`}
              onClick={() => setTradeType('BUY')}
            >
              BUY SHARES
            </button>
            <button 
              className={`trade-toggle-btn ${tradeType === 'SELL' ? 'active' : ''}`}
              onClick={() => setTradeType('SELL')}
            >
              SELL SHARES
            </button>
          </div>

          {/* YES/NO selector */}
          <div className="trade-outcome-select">
            <div 
              className={`outcome-btn yes ${selectedOutcome === 'YES' ? 'selected' : ''}`}
              onClick={() => setSelectedOutcome('YES')}
            >
              YES ({Math.round(market.yesPrice * 100)}%)
            </div>
            <div 
              className={`outcome-btn no ${selectedOutcome === 'NO' ? 'selected' : ''}`}
              onClick={() => setSelectedOutcome('NO')}
            >
              NO ({Math.round(market.noPrice * 100)}%)
            </div>
          </div>

          {/* Limit Price input block (Only rendered in LIMIT mode) */}
          {orderMethod === 'LIMIT' && (
            <div className="trade-input-block" style={{ marginBottom: '14px' }}>
              <div className="input-header">
                <span>Limit Price (USDC)</span>
                <span className="balance">
                  Current: <span>${(selectedOutcome === 'YES' ? market.yesPrice : market.noPrice).toFixed(2)}</span>
                </span>
              </div>
              <div className="input-wrapper" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  className="trade-numeric-input"
                  placeholder="0.00"
                  value={limitPriceInput}
                  onChange={(e) => setLimitPriceInput(e.target.value)}
                />
                <span className="input-currency">USDC</span>
              </div>
            </div>
          )}

          {/* Amount input block */}
          <div className="trade-input-block">
            <div className="input-header">
              <span>{tradeType === 'BUY' ? 'USDC Amount' : `${selectedOutcome} Shares`}</span>
              <span className="balance">
                {tradeType === 'BUY' ? (
                  <>Wallet: <span>${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> USDC</>
                ) : (
                  <>Owned: <span>{(activePosition ? activePosition.quantity : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> shares</>
                )}
              </span>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                className="trade-numeric-input"
                placeholder="0.00"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
              />
              <span className="input-currency">{tradeType === 'BUY' ? 'USDC' : 'SHARES'}</span>
            </div>

            {/* Quick shortcuts */}
            <div className="quick-amount-row">
              {tradeType === 'BUY' ? (
                ([10, 50, 100, 500] as const).map(amt => (
                  <button 
                    key={amt}
                    className="quick-amount-btn"
                    onClick={() => setInputAmount(amt.toString())}
                  >
                    +${amt}
                  </button>
                ))
              ) : (
                ([25, 50, 75, 100] as const).map(pct => (
                  <button 
                    key={pct}
                    className="quick-amount-btn"
                    onClick={() => {
                      const owned = activePosition ? activePosition.quantity : 0;
                      setInputAmount((owned * (pct / 100)).toFixed(2));
                    }}
                  >
                    {pct}%
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CPMM Ledger Breakdown receipt */}
          <div className="trade-details-ledger">
            {orderMethod === 'LIMIT' ? (
              <>
                <div className="ledger-row">
                  <span>Order Type</span>
                  <span className="val" style={{ color: 'var(--color-accent)' }}>Limit {tradeType} {selectedOutcome}</span>
                </div>
                <div className="ledger-row">
                  <span>Limit Price</span>
                  <span className="val">${(parseFloat(limitPriceInput) || 0).toFixed(2)} USDC</span>
                </div>
                <div className="ledger-row">
                  <span>{tradeType === 'BUY' ? 'Estimated Shares' : 'USDC Payout (Filled)'}</span>
                  <span className="val yes">
                    {tradeType === 'BUY' 
                      ? `${((parseFloat(inputAmount) || 0) / (parseFloat(limitPriceInput) || 0.5)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} shares`
                      : `$${((parseFloat(inputAmount) || 0) * (parseFloat(limitPriceInput) || 0.5)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
                    }
                  </span>
                </div>
                {tradeType === 'BUY' && (
                  <div className="ledger-row" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                    <span>Max Payout (At Settlement)</span>
                    <span className="val">${((parseFloat(inputAmount) || 0) / (parseFloat(limitPriceInput) || 0.5)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                  </div>
                )}
              </>
            ) : (
              tradeType === 'BUY' ? (
                <>
                  <div className="ledger-row">
                    <span>Est. Average Price</span>
                    <span className="val">${tradeCalc.avgPrice.toFixed(4)} USDC</span>
                  </div>
                  <div className="ledger-row">
                    <span>Slippage / Price Impact</span>
                    <span className="val" style={{ color: tradeCalc.priceImpact > 0.05 ? 'var(--color-no)' : 'var(--text-primary)' }}>
                      {(tradeCalc.priceImpact * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="ledger-row">
                    <span>Estimated Shares bought</span>
                    <span className="val yes">{tradeCalc.shares.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} shares</span>
                  </div>
                  <div className="ledger-row" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                    <span>Max Payout (At Settlement)</span>
                    <span className="val">${tradeCalc.shares.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                  </div>
                  <div className="ledger-row">
                    <span>Net Return Multiplier</span>
                    <span className="val profit">
                      +{((1 / tradeCalc.avgPrice - 1) * 100).toFixed(1)}% Return
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="ledger-row">
                    <span>Est. Selling Price</span>
                    <span className="val">${sellCalc.avgPrice.toFixed(4)} USDC</span>
                  </div>
                  <div className="ledger-row">
                    <span>Slippage / Price Impact</span>
                    <span className="val">{(sellCalc.priceImpact * 100).toFixed(2)}%</span>
                  </div>
                  <div className="ledger-row" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                    <span>USDC Payout (Refunded)</span>
                    <span className="val yes">${sellCalc.usdcPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                  </div>
                </>
              )
            )}
          </div>

          {/* Action trigger button */}
          <button
            className={`btn trade-submit-btn ${isInvalid ? 'btn-secondary' : selectedOutcome === 'YES' ? 'btn-primary' : 'btn-no'}`}
            disabled={isInvalid || isSubmitting}
            onClick={handleExecuteTrade}
            style={{
              background: isInvalid 
                ? 'rgba(255,255,255,0.04)' 
                : selectedOutcome === 'YES' 
                  ? 'linear-gradient(135deg, var(--color-yes), var(--color-yes-hover))' 
                  : 'linear-gradient(135deg, var(--color-no), var(--color-no-hover))',
              color: isInvalid ? 'var(--text-muted)' : '#000',
              boxShadow: isInvalid ? 'none' : `0 0 15px ${selectedOutcome === 'YES' ? 'var(--color-yes-glow)' : 'var(--color-no-glow)'}`
            }}
          >
            {isSubmitting ? (
              <>
                <Loader className="spinner" />
                Signing Transaction...
              </>
            ) : isInvalid && errorMsg ? (
              errorMsg
            ) : (
              `${tradeType} ${selectedOutcome} Shares`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
