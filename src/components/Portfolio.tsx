import React from 'react';
import { Position, Transaction } from '../types';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  FileText,
  ExternalLink
} from 'lucide-react';

interface PortfolioProps {
  positions: Position[];
  transactions: Transaction[];
  usdcBalance: number;
  onSelectMarket: (marketId: string) => void;
  onSellPosition: (marketId: string, outcome: 'YES' | 'NO', quantity: number) => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({
  positions,
  transactions,
  usdcBalance,
  onSelectMarket,
  onSellPosition
}) => {
  // Aggregate portfolio totals
  const totalPositionsValue = positions.reduce((acc, pos) => acc + pos.value, 0);
  const netAssetValue = usdcBalance + totalPositionsValue;

  const totalCostBasis = positions.reduce((acc, pos) => acc + (pos.quantity * pos.avgBuyPrice), 0);
  const totalPnL = totalPositionsValue - totalCostBasis;
  const totalPnLPct = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  const activeHoldingsCount = positions.filter(p => p.quantity > 0).length;

  return (
    <div className="app-container">
      {/* 4-Column Stat Cards Row */}
      <div className="portfolio-header-grid">
        <div className="glass-panel portfolio-stat-card">
          <span className="p-stat-label">Net Asset Value (NAV)</span>
          <div className="p-stat-val">${netAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <span className="p-stat-sub">Free USDC Cash + Active Share Value</span>
        </div>

        <div className="glass-panel portfolio-stat-card">
          <span className="p-stat-label">Unrealized P&L</span>
          <div className={`p-stat-val ${totalPnL >= 0 ? 'profit' : 'loss'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className={`p-stat-sub ${totalPnL >= 0 ? 'profit' : 'loss'}`} style={{ color: totalPnL >= 0 ? 'var(--color-yes)' : 'var(--color-no)', fontWeight: 600 }}>
            {totalPnL >= 0 ? '▲' : '▼'} {totalPnLPct.toFixed(2)}% net return
          </span>
        </div>

        <div className="glass-panel portfolio-stat-card">
          <span className="p-stat-label">Free Cash liquidity</span>
          <div className="p-stat-val" style={{ color: 'var(--color-accent)' }}>${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <span className="p-stat-sub">Available USDC ready to trade</span>
        </div>

        <div className="glass-panel portfolio-stat-card">
          <span className="p-stat-label">Active Contracts</span>
          <div className="p-stat-val">{activeHoldingsCount}</div>
          <span className="p-stat-sub">Active market outcomes backed</span>
        </div>
      </div>

      {/* Main active positions table */}
      <h3 className="portfolio-section-title">
        <Activity size={18} style={{ color: 'var(--color-accent)' }} />
        Active Investment Positions
      </h3>
      
      <div className="glass-panel positions-table-card" style={{ marginBottom: '40px' }}>
        {positions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FileText size={48} style={{ strokeWidth: 1, color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ fontSize: '15px', fontWeight: 600 }}>No Active Positions</p>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Browse our active markets to open predictions on-chain.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="positions-table">
              <thead>
                <tr>
                  <th>Prediction Market Contract</th>
                  <th>Stance</th>
                  <th>Shares Owned</th>
                  <th>Avg Buy Price</th>
                  <th>Spot Price</th>
                  <th>Current Value</th>
                  <th>Returns (PnL)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => {
                  if (pos.quantity <= 0) return null;
                  const returnPct = pos.unrealizedPnLPct;
                  const formattedValue = `$${pos.value.toFixed(2)} USDC`;
                  const formattedPnL = `${pos.unrealizedPnL >= 0 ? '+' : ''}$${pos.unrealizedPnL.toFixed(2)} USDC`;

                  return (
                    <tr key={pos.id}>
                      <td 
                        onClick={() => onSelectMarket(pos.marketId)}
                        style={{ cursor: 'pointer', fontWeight: 600, maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                        className="hover-underline"
                      >
                        {pos.marketQuestion}
                      </td>
                      <td>
                        <span className={`pos-outcome-badge ${pos.outcome === 'YES' ? 'yes' : 'no'}`}>
                          {pos.outcome}
                        </span>
                      </td>
                      <td>{pos.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td>${pos.avgBuyPrice.toFixed(4)}</td>
                      <td>${pos.currentPrice.toFixed(4)}</td>
                      <td style={{ fontWeight: 600 }}>{formattedValue}</td>
                      <td className={`pos-pnl ${pos.unrealizedPnL >= 0 ? 'profit' : 'loss'}`}>
                        {formattedPnL} ({returnPct.toFixed(1)}%)
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => onSellPosition(pos.marketId, pos.outcome, pos.quantity)}
                          style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--color-no-glow)', color: 'var(--color-no)' }}
                        >
                          SELL ALL
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chronological Transaction Ledger */}
      <h3 className="portfolio-section-title">
        <FileText size={18} style={{ color: 'var(--color-accent)' }} />
        Chronological Audit Ledger
      </h3>

      <div className="glass-panel positions-table-card">
        {transactions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No historical logs available.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="positions-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Prediction Target</th>
                  <th>Outcome backed</th>
                  <th>Execution Volume</th>
                  <th>Contract Price</th>
                  <th>Tx Proof</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  let badgeColor = 'var(--text-secondary)';
                  let actionText = '';
                  let actionIcon = null;

                  if (tx.type === 'BUY') {
                    badgeColor = 'var(--color-yes)';
                    actionText = 'BUY EXEC';
                    actionIcon = <ArrowUpRight size={13} style={{ color: 'var(--color-yes)', marginRight: '4px' }} />;
                  } else if (tx.type === 'SELL') {
                    badgeColor = 'var(--color-no)';
                    actionText = 'SELL LIQ';
                    actionIcon = <ArrowDownLeft size={13} style={{ color: 'var(--color-no)', marginRight: '4px' }} />;
                  } else if (tx.type === 'DEPOSIT' || tx.type === 'FAUCET') {
                    badgeColor = 'var(--color-accent)';
                    actionText = 'MINT FAUCET';
                    actionIcon = <Wallet size={13} style={{ color: 'var(--color-accent)', marginRight: '4px' }} />;
                  } else if (tx.type === 'RESOLVE') {
                    badgeColor = '#a855f7'; // Purple resolved
                    actionText = 'RESOLVED';
                  }

                  return (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{tx.timestamp}</td>
                      <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        {actionIcon}
                        <span style={{ color: badgeColor }}>{actionText}</span>
                      </td>
                      <td style={{ maxWidth: '240px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {tx.marketQuestion || 'Direct Wallet Deposit'}
                      </td>
                      <td>
                        {tx.outcome ? (
                          <span className={`pos-outcome-badge ${tx.outcome === 'YES' ? 'yes' : 'no'}`} style={{ fontSize: '9px' }}>
                            {tx.outcome}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {tx.type === 'BUY' || tx.type === 'SELL' ? (
                          <span>{tx.sharesQuantity?.toLocaleString(undefined, { maximumFractionDigits: 2 })} shares</span>
                        ) : (
                          <span>${tx.amountUsdc.toFixed(2)} USDC</span>
                        )}
                      </td>
                      <td>
                        {tx.pricePerShare ? `$${tx.pricePerShare.toFixed(4)}` : '-'}
                      </td>
                      <td style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        <a 
                          href={`https://testnet.arcscan.app/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          className="hover-underline"
                        >
                          {tx.txHash.slice(0, 8)}...
                          <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
