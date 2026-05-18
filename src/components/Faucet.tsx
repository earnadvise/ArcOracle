import React, { useState } from 'react';
import { Coins, HelpCircle, Loader, Copy, Check, ExternalLink } from 'lucide-react';

interface FaucetProps {
  isDemoMode: boolean;
  onClaimFaucet: () => void;
  isConnected: boolean;
}

export const Faucet: React.FC<FaucetProps> = ({
  isDemoMode,
  onClaimFaucet,
  isConnected
}) => {
  const [isMinting, setIsMinting] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleClaim = () => {
    setIsMinting(true);
    setTimeout(() => {
      onClaimFaucet();
      setIsMinting(false);
      setClaimed(true);
      setTimeout(() => setClaimed(false), 3000);
    }, 1500);
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="app-container">
      <div className="glass-panel faucet-card glow-accent">
        <div className="faucet-icon-container">
          <Coins size={24} />
        </div>
        <h2 className="faucet-title">Arc Testnet USDC Faucet</h2>
        <p className="faucet-sub">Get test tokens to trade on Aegis Markets. Gas fees on Arc Testnet are paid directly in USDC.</p>

        {isDemoMode ? (
          /* Demo Mode Faucet Minting */
          <div style={{ padding: '8px 0' }}>
            <div className="faucet-info-block" style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h4 style={{ justifyContent: 'center' }}>Demo Faucet Sandbox</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                You are currently in <strong>Demo Mode</strong>. You can instantly mint a sandbox balance of <strong>$10,000.00 USDC</strong> directly into your browser's virtual wallet. No real gas or wallet signature required!
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleClaim}
              disabled={isMinting}
              style={{
                padding: '14px 28px',
                fontSize: '15px',
                width: '100%',
                maxWidth: '320px',
                margin: '0 auto',
                display: 'flex',
                gap: '10px'
              }}
            >
              {isMinting ? (
                <>
                  <Loader className="spinner" />
                  Minting Sandbox USDC...
                </>
              ) : claimed ? (
                'Claimed +$10,000.00 USDC!'
              ) : (
                'Claim $10,000.00 Demo USDC'
              )}
            </button>
          </div>
        ) : (
          /* Web3 Wallet Configuration and Circle Faucet Guide */
          <div style={{ textAlign: 'left' }}>
            <div className="faucet-info-block">
              <h4>
                <HelpCircle size={16} />
                MetaMask Network Configuration
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginBottom: '14px' }}>
                To connect your real wallet, you must configure your provider to point to the <strong>Arc Testnet</strong> custom chain. USDC is the native gas token of the Arc Network.
              </p>
              
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Network Name', value: 'Arc Testnet', id: 'name' },
                  { label: 'New RPC URL', value: 'https://rpc.testnet.arc.network', id: 'rpc' },
                  { label: 'Chain ID', value: '5042002', id: 'chain' },
                  { label: 'Currency Symbol', value: 'USDC', id: 'symbol' },
                  { label: 'Block Explorer', value: 'https://testnet.arcscan.app', id: 'explorer' }
                ].map(param => (
                  <li 
                    key={param.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.15)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12.5px',
                      border: '1px solid rgba(255,255,255,0.02)'
                    }}
                  >
                    <span>{param.label}: <strong style={{ color: 'var(--text-primary)' }}>{param.value}</strong></span>
                    <button
                      onClick={() => copyToClipboard(param.value, param.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      title="Copy"
                    >
                      {copiedField === param.id ? <Check size={12} style={{ color: 'var(--color-yes)' }} /> : <Copy size={12} />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="faucet-info-block">
              <h4>Circle Developer Faucet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                Arc Testnet uses native USDC. You can request official, free testnet USDC directly from <strong>Circle's Developer Faucet</strong> to fund your MetaMask address.
              </p>
            </div>

            <div className="faucet-actions">
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ flex: 1, textDecoration: 'none' }}
              >
                Go to Circle Faucet
                <ExternalLink size={14} />
              </a>
              
              {!isConnected && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  💡 Connect your wallet via the top navbar to view real-time balances.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
