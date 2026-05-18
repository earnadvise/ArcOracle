import React, { useState } from 'react';
import { PlusSquare, Info, Sparkles } from 'lucide-react';
import { MarketCategory } from '../types';

interface CreateMarketProps {
  onCreateMarket: (marketData: {
    question: string;
    description: string;
    category: Exclude<MarketCategory, 'ALL'>;
    endDate: string;
    resolutionSource: string;
    initialYesOdds: number;
    icon: string;
  }) => void;
}

export const CreateMarket: React.FC<CreateMarketProps> = ({ onCreateMarket }) => {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Exclude<MarketCategory, 'ALL'>>('CRYPTO');
  const [endDate, setEndDate] = useState('');
  const [resolutionSource, setResolutionSource] = useState('');
  const [initialYesOdds, setInitialYesOdds] = useState<number>(0.5);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field validations
    if (!question.trim()) return setError('Market question is required.');
    if (question.length < 15) return setError('Market question should be highly descriptive (min 15 chars).');
    if (!description.trim()) return setError('Detailed resolution rules are required.');
    if (!endDate) return setError('Market expiration date is required.');
    if (!resolutionSource.trim()) return setError('Consensus audit verification source URL is required.');

    // Select standard icon based on category
    let icon = 'TrendingUp';
    if (category === 'AI') icon = 'Cpu';
    if (category === 'SCIENCE') icon = 'Globe';
    if (category === 'POLITICS') icon = 'Scale';
    if (category === 'POP') icon = 'Music';

    // Submit
    onCreateMarket({
      question: question.trim(),
      description: description.trim(),
      category,
      endDate,
      resolutionSource: resolutionSource.trim(),
      initialYesOdds,
      icon
    });

    setSuccess(true);
    
    // Clear form
    setQuestion('');
    setDescription('');
    setEndDate('');
    setResolutionSource('');
    setInitialYesOdds(0.5);

    setTimeout(() => setSuccess(false), 3000);
  };

  const yesPct = Math.round(initialYesOdds * 100);
  const noPct = 100 - yesPct;

  return (
    <div className="app-container">
      <div className="glass-panel create-card glow-accent">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="faucet-icon-container">
            <PlusSquare size={24} />
          </div>
          <h2 className="create-title">Launch New Custom Market</h2>
          <p className="create-sub">Deploy a custom prediction market and supply initial pool liquidity instantly.</p>
        </div>

        {error && (
          <div 
            style={{ 
              background: 'rgba(244, 63, 94, 0.1)', 
              border: '1px solid var(--color-no)', 
              color: 'var(--color-no)', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '13px', 
              marginBottom: '20px',
              fontWeight: 600
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div 
            style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid var(--color-yes)', 
              color: 'var(--color-yes)', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '13px', 
              marginBottom: '20px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={16} />
            Market successfully launched on the platform!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Question */}
          <div className="form-group">
            <label className="form-label">Market Question</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="e.g. Will Arc Mainnet reach over $500M TVL by December 31, 2026?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          {/* Rules & Description */}
          <div className="form-group">
            <label className="form-label">Resolution Conditions & Criteria</label>
            <textarea 
              className="form-textarea"
              placeholder="Specify the exact parameters. e.g. This market resolves to YES if Llama-4 is announced by Meta with open-weights on or before June 15, 2026. Otherwise, resolves to NO."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-grid">
            {/* Category */}
            <div className="form-group">
              <label className="form-label">Market Category</label>
              <select 
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                style={{ background: '#0e121b' }}
              >
                <option value="CRYPTO">Crypto / Web3</option>
                <option value="AI">Artificial Intelligence</option>
                <option value="SCIENCE">Space & Science</option>
                <option value="POLITICS">Politics / Elections</option>
                <option value="POP">Pop Culture / Sports</option>
              </select>
            </div>

            {/* End Date */}
            <div className="form-group">
              <label className="form-label">Expiration Date</label>
              <input 
                type="date" 
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Resolution URL */}
          <div className="form-group">
            <label className="form-label">Consensus Audit Source (URL)</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="e.g. https://testnet.arcscan.app or https://defillama.com"
              value={resolutionSource}
              onChange={(e) => setResolutionSource(e.target.value)}
            />
          </div>

          {/* Initial Odds Slider */}
          <div className="form-group" style={{ background: 'rgba(0,0,0,0.15)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Initial Pool Odds Probability</label>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                <span style={{ color: 'var(--color-yes)' }}>YES {yesPct}%</span>
                <span style={{ color: 'var(--text-muted)' }}> | </span>
                <span style={{ color: 'var(--color-no)' }}>NO {noPct}%</span>
              </span>
            </div>
            
            <input 
              type="range" 
              min="0.1" 
              max="0.9" 
              step="0.05"
              className="form-input"
              value={initialYesOdds}
              onChange={(e) => setInitialYesOdds(parseFloat(e.target.value))}
              style={{ padding: 0, height: '4px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              <span>Initial Cost: ${initialYesOdds.toFixed(2)} USDC / YES share</span>
              <span>Initial Cost: ${(1 - initialYesOdds).toFixed(2)} USDC / NO share</span>
            </div>
          </div>

          {/* Form Action Submit */}
          <button type="submit" className="btn btn-primary create-submit-btn">
            Deploy Market Contract
          </button>
        </form>
      </div>
    </div>
  );
};
