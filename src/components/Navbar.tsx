import React, { useState } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Activity, 
  PlusSquare, 
  PieChart, 
  Coins, 
  Copy, 
  Check, 
  Power
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'MARKETS' | 'PORTFOLIO' | 'CREATE' | 'FAUCET';
  setActiveTab: (tab: 'MARKETS' | 'PORTFOLIO' | 'CREATE' | 'FAUCET') => void;
  isDemoMode: boolean;
  setIsDemoMode: (demo: boolean) => void;
  usdcBalance: number;
  isConnected: boolean;
  address: string | undefined;
  connectWallet: (connector: any) => void;
  disconnectWallet: () => void;
  totalVolume: number;
  connectors: readonly any[];
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDemoMode,
  setIsDemoMode,
  usdcBalance,
  isConnected,
  address,
  connectWallet,
  disconnectWallet,
  totalVolume,
  connectors
}) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncatedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '';

  return (
    <header className="stats-bar-outer" style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(7, 8, 11, 0.5)', backdropFilter: 'blur(12px)' }}>
      {/* Global Mini Stats Bar */}
      <div className="app-container">
        <div className="stats-bar">
          <div className="stat-item">
            <Activity size={13} style={{ color: 'var(--color-yes)' }} />
            <span>Arc RPC Status:</span>
            <span className="stat-value" style={{ color: 'var(--color-yes)' }}>Active Testnet</span>
          </div>
          <div className="stat-item">
            <TrendingUp size={13} style={{ color: 'var(--color-accent)' }} />
            <span>24H Platform Volume:</span>
            <span className="stat-value">${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
          </div>
          <div className="stat-item">
            <Coins size={13} style={{ color: 'var(--color-accent)' }} />
            <span>Gas Token:</span>
            <span className="stat-value">Native USDC</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="app-container" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="nav-logo-group" onClick={() => setActiveTab('MARKETS')}>
          <div className="nav-logo-icon">
            <TrendingUp size={18} />
          </div>
          <span>ArcOracle</span>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn btn-secondary ${activeTab === 'MARKETS' ? 'active' : ''}`}
            onClick={() => setActiveTab('MARKETS')}
            style={{ 
              background: activeTab === 'MARKETS' ? 'rgba(255, 159, 28, 0.1)' : 'transparent',
              borderColor: activeTab === 'MARKETS' ? 'rgba(255, 159, 28, 0.3)' : 'transparent',
              color: activeTab === 'MARKETS' ? 'var(--color-accent)' : 'var(--text-secondary)'
            }}
          >
            <Activity size={15} />
            Markets
          </button>
          
          <button 
            className={`btn btn-secondary ${activeTab === 'PORTFOLIO' ? 'active' : ''}`}
            onClick={() => setActiveTab('PORTFOLIO')}
            style={{ 
              background: activeTab === 'PORTFOLIO' ? 'rgba(255, 159, 28, 0.1)' : 'transparent',
              borderColor: activeTab === 'PORTFOLIO' ? 'rgba(255, 159, 28, 0.3)' : 'transparent',
              color: activeTab === 'PORTFOLIO' ? 'var(--color-accent)' : 'var(--text-secondary)'
            }}
          >
            <PieChart size={15} />
            Portfolio
          </button>

          <button 
            className={`btn btn-secondary ${activeTab === 'CREATE' ? 'active' : ''}`}
            onClick={() => setActiveTab('CREATE')}
            style={{ 
              background: activeTab === 'CREATE' ? 'rgba(255, 159, 28, 0.1)' : 'transparent',
              borderColor: activeTab === 'CREATE' ? 'rgba(255, 159, 28, 0.3)' : 'transparent',
              color: activeTab === 'CREATE' ? 'var(--color-accent)' : 'var(--text-secondary)'
            }}
          >
            <PlusSquare size={15} />
            Launch Market
          </button>

          <button 
            className={`btn btn-secondary ${activeTab === 'FAUCET' ? 'active' : ''}`}
            onClick={() => setActiveTab('FAUCET')}
            style={{ 
              background: activeTab === 'FAUCET' ? 'rgba(255, 159, 28, 0.1)' : 'transparent',
              borderColor: activeTab === 'FAUCET' ? 'rgba(255, 159, 28, 0.3)' : 'transparent',
              color: activeTab === 'FAUCET' ? 'var(--color-accent)' : 'var(--text-secondary)'
            }}
          >
            <Coins size={15} />
            Faucet
          </button>
        </nav>

        {/* User Connector Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Dual Mode Switcher */}
          <div 
            style={{ 
              display: 'flex', 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: 'var(--radius-full)', 
              padding: '2px', 
              border: '1px solid var(--border-color)' 
            }}
          >
            <button
              onClick={() => setIsDemoMode(true)}
              style={{
                background: isDemoMode ? 'var(--color-accent)' : 'transparent',
                color: isDemoMode ? 'var(--bg-dark)' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Demo Mode
            </button>
            <button
              onClick={() => setIsDemoMode(false)}
              style={{
                background: !isDemoMode ? 'var(--color-accent)' : 'transparent',
                color: !isDemoMode ? 'var(--bg-dark)' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Web3 Connection
            </button>
          </div>

          {/* Wallet Balance & Connect Button */}
          {isDemoMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{ 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                  padding: '8px 14px', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '13px', 
                  color: 'var(--color-yes)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Wallet size={14} />
                <span>${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
              </div>
              <div 
                style={{ 
                  background: 'rgba(255, 159, 28, 0.08)', 
                  border: '1px solid rgba(255, 159, 28, 0.2)', 
                  padding: '8px 14px', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '13px', 
                  color: 'var(--color-accent)',
                  fontWeight: 700
                }}
              >
                Demo Wallet Active
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isConnected && address ? (
                <>
                  <div 
                    style={{ 
                      background: 'rgba(16, 185, 129, 0.08)', 
                      border: '1px solid rgba(16, 185, 129, 0.2)', 
                      padding: '8px 14px', 
                      borderRadius: 'var(--radius-md)', 
                      fontSize: '13px', 
                      color: 'var(--color-yes)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Wallet size={14} />
                    <span>${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                  </div>
                  
                  <div 
                    className="btn btn-secondary" 
                    style={{ 
                      padding: '8px 14px', 
                      fontSize: '13px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px' 
                    }}
                  >
                    <span 
                      onClick={copyAddress} 
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      title="Copy Address"
                    >
                      {copied ? <Check size={13} style={{ color: 'var(--color-yes)' }} /> : <Copy size={13} />}
                      {truncatedAddress}
                    </span>
                    <button 
                      onClick={disconnectWallet}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: 'var(--color-no)', 
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '4px'
                      }}
                      title="Disconnect Wallet"
                    >
                      <Power size={13} />
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => connectWallet(connectors.find(c => c.id === 'injected') || connectors[0])}
                    style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Wallet size={13} />
                    MetaMask
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => connectWallet(connectors.find(c => c.id === 'walletConnect') || connectors[1] || connectors[0])}
                    style={{ 
                      padding: '8px 14px', 
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255, 159, 28, 0.1)',
                      borderColor: 'rgba(255, 159, 28, 0.3)',
                      color: 'var(--color-accent)'
                    }}
                  >
                    <Power size={13} />
                    WalletConnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
