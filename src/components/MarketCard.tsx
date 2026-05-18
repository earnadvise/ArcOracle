import React from 'react';
import { PredictionMarket } from '../types';
import { 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface MarketCardProps {
  market: PredictionMarket;
  onSelect: (market: PredictionMarket) => void;
  onQuickBuy: (market: PredictionMarket, outcome: 'YES' | 'NO') => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  onSelect,
  onQuickBuy
}) => {
  const yesPct = Math.round(market.yesPrice * 100);
  const noPct = 100 - yesPct;

  // Custom inline SVG sparkline coordinate mapping
  const sparklineHeight = 32;
  const sparklineWidth = 120;
  const minVal = 0;
  const maxVal = 1;
  
  const sparkPoints = market.sparklineData.map((val, idx) => {
    const x = (idx / (market.sparklineData.length - 1)) * sparklineWidth;
    // Map value (0 to 1) to Y coordinate (height - padding to padding)
    const y = sparklineHeight - 2 - (val * (sparklineHeight - 4));
    return `${x},${y}`;
  }).join(' ');

  const priceHistoryIsUp = market.sparklineData.length >= 2 
    ? market.sparklineData[market.sparklineData.length - 1] >= market.sparklineData[0]
    : true;

  const formattedVolume = market.volume >= 1000 
    ? `$${(market.volume / 1000).toFixed(1)}k USDC` 
    : `$${market.volume.toFixed(2)} USDC`;

  return (
    <div className="glass-panel market-card glow-accent" onClick={() => onSelect(market)} style={{ cursor: 'pointer' }}>
      <div className="card-top">
        <div className="card-meta">
          <span className="card-category">{market.category}</span>
          <span className="card-volume">
            <TrendingUp size={12} style={{ color: 'var(--color-accent)' }} />
            {formattedVolume} Volume
          </span>
        </div>
        <h3 className="card-question">{market.question}</h3>
      </div>

      <div className="card-middle">
        {/* Dynamic Probability Bar */}
        <div className="prob-track-container">
          <div className="prob-track-labels">
            <span className="yes">Yes {yesPct}%</span>
            <span className="no">No {noPct}%</span>
          </div>
          <div className="prob-track-bar">
            <div 
              className="prob-track-fill" 
              style={{ width: `${yesPct}%` }}
            ></div>
          </div>
        </div>

        {/* Custom Mini SVG Sparkline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {priceHistoryIsUp ? (
              <TrendingUp size={12} style={{ color: 'var(--color-yes)' }} />
            ) : (
              <TrendingDown size={12} style={{ color: 'var(--color-no)' }} />
            )}
            <span style={{ color: priceHistoryIsUp ? 'var(--color-yes)' : 'var(--color-no)' }}>
              {priceHistoryIsUp ? '+' : ''}{((market.yesPrice - market.sparklineData[0]) * 100).toFixed(1)}%
            </span>
            <span>trend</span>
          </span>

          <svg width={sparklineWidth} height={sparklineHeight} style={{ overflow: 'visible' }}>
            <polyline
              fill="none"
              stroke={priceHistoryIsUp ? 'var(--color-yes)' : 'var(--color-no)'}
              strokeWidth="1.5"
              points={sparkPoints}
            />
            {/* Subtle glow filter on trend lines */}
            <polyline
              fill="none"
              stroke={priceHistoryIsUp ? 'var(--color-yes)' : 'var(--color-no)'}
              strokeWidth="4"
              strokeOpacity="0.15"
              points={sparkPoints}
            />
          </svg>
        </div>
      </div>

      <div className="card-bottom" onClick={(e) => e.stopPropagation()}>
        <span className="card-date">
          <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '4px', color: 'var(--text-muted)' }} />
          Ends {market.endDate}
        </span>
        <div className="card-actions">
          <button 
            className="btn btn-yes"
            onClick={() => onQuickBuy(market, 'YES')}
            style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)' }}
          >
            BUY YES
          </button>
          <button 
            className="btn btn-no"
            onClick={() => onQuickBuy(market, 'NO')}
            style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)' }}
          >
            BUY NO
          </button>
        </div>
      </div>
    </div>
  );
};
