/**
 * Aegis Markets - Constant Product Market Maker (CPMM) Math Engine
 * Implements standard binary prediction market trading equations.
 * Pools are composed of YES shares (y) and NO shares (n).
 * 1 YES share pays out 1 USDC if YES resolves true.
 * 1 NO share pays out 1 USDC if NO resolves true.
 * Constant Product: k = y * n
 */

export interface TradeCalculation {
  shares: number;        // Total YES/NO shares returned to user
  avgPrice: number;      // Average price paid per share (USDC)
  priceImpact: number;   // Percentage price impact (slippage)
  newYesPool: number;    // Adjusted pool reserve for YES
  newNoPool: number;     // Adjusted pool reserve for NO
  newYesPrice: number;   // Adjusted probability/price of YES (0 to 1)
  newNoPrice: number;    // Adjusted probability/price of NO (0 to 1)
}

export interface SellCalculation {
  usdcPayout: number;    // Total USDC returned to user
  avgPrice: number;      // Average price received per share (USDC)
  priceImpact: number;   // Percentage price impact (slippage)
  newYesPool: number;    // Adjusted pool reserve for YES
  newNoPool: number;     // Adjusted pool reserve for NO
  newYesPrice: number;   // Adjusted probability/price of YES (0 to 1)
  newNoPrice: number;    // Adjusted probability/price of NO (0 to 1)
}

/**
 * Calculates shares received when buying YES or NO with a specified USDC input.
 * 
 * Buying YES:
 * User gives C USDC. USDC is converted to C YES and C NO.
 * C NO shares are added to pool: n_new = n + C
 * Pool constant product k = y * n must remain constant.
 * So YES reserve in pool is: y_new = k / n_new = (y * n) / (n + C)
 * YES shares extracted from pool: y - y_new = y - (y * n)/(n + C) = (y * C) / (n + C)
 * Total YES shares received = C (deposited) + (y * C)/(n + C) = C * (y + n + C) / (n + C)
 */
export function calculateBuy(
  usdcInput: number,
  outcome: 'YES' | 'NO',
  yesPool: number,
  noPool: number,
  feePct: number = 0.02 // 2% trading fee standard
): TradeCalculation {
  // Apply trading fee
  const tradingAmount = usdcInput * (1 - feePct);
  const k = yesPool * noPool;
  
  let shares = 0;
  let newYesPool = yesPool;
  let newNoPool = noPool;

  const currentYesPrice = noPool / (yesPool + noPool);

  if (outcome === 'YES') {
    // n_new = n + C
    newNoPool = noPool + tradingAmount;
    // y_new = k / n_new
    newYesPool = k / newNoPool;
    // shares = C * (y + n + C) / (n + C)
    shares = tradingAmount * (yesPool + noPool + tradingAmount) / (noPool + tradingAmount);
  } else {
    // y_new = y + C
    newYesPool = yesPool + tradingAmount;
    // n_new = k / y_new
    newNoPool = k / newYesPool;
    // shares = C * (y + n + C) / (y + C)
    shares = tradingAmount * (yesPool + noPool + tradingAmount) / (yesPool + tradingAmount);
  }

  // Calculate prices
  const newYesPrice = newNoPool / (newYesPool + newNoPool);
  const newNoPrice = 1 - newYesPrice;
  const avgPrice = usdcInput / shares;
  
  // Price impact = |newPrice - currentPrice| / currentPrice
  const targetInitialPrice = outcome === 'YES' ? currentYesPrice : (1 - currentYesPrice);
  const targetFinalPrice = outcome === 'YES' ? newYesPrice : newNoPrice;
  const priceImpact = Math.max(0, (targetFinalPrice - targetInitialPrice) / Math.max(0.01, targetInitialPrice));

  return {
    shares,
    avgPrice,
    priceImpact,
    newYesPool,
    newNoPool,
    newYesPrice,
    newNoPrice
  };
}

/**
 * Calculates USDC payout when selling YES or NO shares.
 * Utilizes a continuous slippage model proportional to position size vs pool reserve.
 */
export function calculateSell(
  sharesInput: number,
  outcome: 'YES' | 'NO',
  yesPool: number,
  noPool: number,
  feePct: number = 0.02
): SellCalculation {
  const k = yesPool * noPool;
  const currentYesPrice = noPool / (yesPool + noPool);
  const spotPrice = outcome === 'YES' ? currentYesPrice : (1 - currentYesPrice);
  
  // Simple, robust slippage model:
  // Selling YES adds YES to pool and pulls USDC out.
  // Payout = Shares * SpotPrice * (1 - Slippage)
  // Slippage increases as user sells more shares relative to pool reserve.
  const poolReserve = outcome === 'YES' ? yesPool : noPool;
  const slippageFactor = 0.35; // Sensitivity parameter
  const slippage = Math.min(0.85, (sharesInput / (poolReserve + sharesInput)) * slippageFactor);
  
  const rawPayout = sharesInput * spotPrice * (1 - slippage);
  const usdcPayout = Math.max(0, rawPayout * (1 - feePct));
  const avgPrice = usdcPayout / sharesInput;
  
  let newYesPool = yesPool;
  let newNoPool = noPool;

  if (outcome === 'YES') {
    // User puts YES shares, pulls USDC.
    // In terms of reserves, YES pool increases by shares, NO pool decreases.
    newYesPool = yesPool + sharesInput;
    newNoPool = k / newYesPool;
  } else {
    newNoPool = noPool + sharesInput;
    newYesPool = k / newNoPool;
  }

  // Recalculate adjusted final prices
  const newYesPrice = newNoPool / (newYesPool + newNoPool);
  const newNoPrice = 1 - newYesPrice;
  const priceImpact = slippage;

  return {
    usdcPayout,
    avgPrice,
    priceImpact,
    newYesPool,
    newNoPool,
    newYesPrice,
    newNoPrice
  };
}

/**
 * Generates an SVG chart path from market historical price points.
 */
export function generateChartPath(
  history: { yesPrice: number }[],
  width: number,
  height: number,
  padding: number = 10
): { linePath: string; areaPath: string } {
  if (history.length < 2) {
    return { linePath: '', areaPath: '' };
  }

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const points = history.map((pt, i) => {
    const x = padding + (i / (history.length - 1)) * chartWidth;
    // Map price (0.01 - 0.99) to height (high price is near top, i.e., lower Y coordinate)
    const y = padding + (1 - pt.yesPrice) * chartHeight;
    return { x, y };
  });

  const linePath = points.reduce((path, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `
    ${linePath} 
    L ${points[points.length - 1].x} ${height - padding} 
    L ${points[0].x} ${height - padding} 
    Z
  `;

  return { linePath, areaPath };
}
