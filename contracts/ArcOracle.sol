// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC20 standard token (USDC).
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title ArcOracle
 * @notice An institutional, professional-grade prediction market protocol on the Arc Network.
 * Uses native USDC for prediction funding and gas fee denominations.
 * Implements an on-chain Constant Product Market Maker (CPMM) AMM for YES/NO share contracts.
 */
contract ArcOracle {
    
    enum Outcome { NONE, YES, NO }
    enum MarketStatus { ACTIVE, RESOLVED }

    struct Market {
        bytes32 id;
        string question;
        uint256 yesSharesPool;  // YES reserves in the AMM pool
        uint256 noSharesPool;   // NO reserves in the AMM pool
        uint256 totalVolume;    // Cumulative USDC trading volume
        uint256 endDate;        // Expiration timestamp
        MarketStatus status;
        Outcome winningOutcome;
        address creator;
    }

    // Platform configurations
    address public oracle;
    IERC20 public immutable usdcToken;
    uint256 public constant TRADING_FEE_BPS = 200; // 2% platform fee

    // Storage maps
    mapping(bytes32 => Market) public markets;
    // user => marketId => YES/NO => share quantity
    mapping(address => mapping(bytes32 => mapping(Outcome => uint256))) public shareBalances;

    // Events ledger
    event MarketCreated(bytes32 indexed id, string question, uint256 initialYesPool, uint256 initialNoPool, uint256 endDate);
    event SharesPurchased(bytes32 indexed id, address indexed buyer, Outcome outcome, uint256 usdcSpent, uint256 sharesReceived);
    event SharesSold(bytes32 indexed id, address indexed seller, Outcome outcome, uint256 sharesLiquidated, uint256 usdcReturned);
    event MarketResolved(bytes32 indexed id, Outcome winningOutcome);
    event PayoutClaimed(bytes32 indexed id, address indexed claimant, uint256 payoutAmount);

    modifier onlyOracle() {
        require(msg.sender == oracle, "ArcOracle: Caller is not the authorized oracle");
        _;
    }

    /**
     * @param _usdcAddress Address of the native USDC ERC20 contract on Arc Testnet.
     */
    constructor(address _usdcAddress) {
        require(_usdcAddress != address(0), "ArcOracle: Invalid USDC address");
        oracle = msg.sender;
        usdcToken = IERC20(_usdcAddress);
    }

    /**
     * @notice Deploys a new prediction market on the protocol, supplying initial seed liquidity.
     * @param _id Unique market hash.
     * @param _question Question string.
     * @param _endDate Expiration timestamp.
     * @param _initialYesOdds Initial YES probability scaled (e.g. 5000 = 50% YES odds).
     * @param _liquidityAmount Total USDC seed liquidity deposited by the creator.
     */
    function createMarket(
        bytes32 _id,
        string calldata _question,
        uint256 _endDate,
        uint256 _initialYesOdds,
        uint256 _liquidityAmount
    ) external {
        require(markets[_id].id == bytes32(0), "ArcOracle: Market ID already registered");
        require(_endDate > block.timestamp, "ArcOracle: Expiration must be in the future");
        require(_initialYesOdds > 0 && _initialYesOdds < 10000, "ArcOracle: Odds must be within 1-9999");
        require(_liquidityAmount >= 10 * 1e6, "ArcOracle: Seed liquidity must be >= 10 USDC"); // USDC standard 6 decimals

        // Pull seed USDC liquidity
        require(
            usdcToken.transferFrom(msg.sender, address(this), _liquidityAmount),
            "ArcOracle: USDC transfer failed"
        );

        // Calculate pool shares based on initial odds input
        // e.g. 50/50 odds on 100 USDC adds 100 YES and 100 NO to pool reserves
        uint256 yesReserve = (_liquidityAmount * 10000) / (10000 - _initialYesOdds);
        uint256 noReserve = (_liquidityAmount * 10000) / _initialYesOdds;

        markets[_id] = Market({
            id: _id,
            question: _question,
            yesSharesPool: yesReserve,
            noSharesPool: noReserve,
            totalVolume: _liquidityAmount,
            endDate: _endDate,
            status: MarketStatus.ACTIVE,
            winningOutcome: Outcome.NONE,
            creator: msg.sender
        });

        emit MarketCreated(_id, _question, yesReserve, noReserve, _endDate);
    }

    /**
     * @notice Purchase outcome shares using native USDC.
     * @param _id Market ID.
     * @param _outcome Stance to buy (YES or NO).
     * @param _usdcInput Total USDC to spend.
     */
    function buyShares(bytes32 _id, Outcome _outcome, uint256 _usdcInput) external {
        Market storage market = markets[_id];
        require(market.status == MarketStatus.ACTIVE, "ArcOracle: Market is not active");
        require(market.endDate > block.timestamp, "ArcOracle: Market has expired");
        require(_outcome == Outcome.YES || _outcome == Outcome.NO, "ArcOracle: Invalid outcome");
        require(_usdcInput > 0, "ArcOracle: Spend must exceed 0");

        // Pull USDC from buyer
        require(
            usdcToken.transferFrom(msg.sender, address(this), _usdcInput),
            "ArcOracle: USDC transfer failed"
        );

        // Deduct platform trading fee (e.g. 2%)
        uint256 fee = (_usdcInput * TRADING_FEE_BPS) / 10000;
        uint256 netInput = _usdcInput - fee;
        require(usdcToken.transfer(oracle, fee), "ArcOracle: Fee transfer failed");

        uint256 sharesReceived = 0;
        uint256 k = market.yesSharesPool * market.noSharesPool;

        if (_outcome == Outcome.YES) {
            // Constant Product: y_new * n_new = k
            // n_new = n + netInput
            uint256 newNoPool = market.noSharesPool + netInput;
            uint256 newYesPool = k / newNoPool;
            
            // sharesReceived = netInput * (y + n + netInput) / (n + netInput)
            sharesReceived = (netInput * (market.yesSharesPool + market.noSharesPool + netInput)) / newNoPool;
            
            market.yesSharesPool = newYesPool;
            market.noSharesPool = newNoPool;
        } else {
            // y_new = y + netInput
            uint256 newYesPool = market.yesSharesPool + netInput;
            uint256 newNoPool = k / newYesPool;
            
            // sharesReceived = netInput * (y + n + netInput) / (y + netInput)
            sharesReceived = (netInput * (market.yesSharesPool + market.noSharesPool + netInput)) / newYesPool;
            
            market.yesSharesPool = newYesPool;
            market.noSharesPool = newNoPool;
        }

        market.totalVolume += _usdcInput;
        shareBalances[msg.sender][_id][_outcome] += sharesReceived;

        emit SharesPurchased(_id, msg.sender, _outcome, _usdcInput, sharesReceived);
    }

    /**
     * @notice Liquidate/Sell outcome shares back to the AMM pool.
     * @param _id Market ID.
     * @param _outcome Stance to sell (YES or NO).
     * @param _sharesToSell Share quantity to liquidate.
     */
    function sellShares(bytes32 _id, Outcome _outcome, uint256 _sharesToSell) external {
        Market storage market = markets[_id];
        require(market.status == MarketStatus.ACTIVE, "ArcOracle: Market is not active");
        require(shareBalances[msg.sender][_id][_outcome] >= _sharesToSell, "ArcOracle: Insufficient shares owned");
        require(_sharesToSell > 0, "ArcOracle: Sell quantity must exceed 0");

        uint256 yesPool = market.yesSharesPool;
        uint256 noPool = market.noSharesPool;
        uint256 spotPrice = _outcome == Outcome.YES 
            ? (noPool * 1e6) / (yesPool + noPool) 
            : (yesPool * 1e6) / (yesPool + noPool);

        // Calculate slippage: (shares / (poolReserve + shares)) * 0.35
        uint256 poolReserve = _outcome == Outcome.YES ? yesPool : noPool;
        uint256 slippage = (_sharesToSell * 350000) / (poolReserve + _sharesToSell); // Scaled in 1e6
        if (slippage > 850000) slippage = 850000; // Cap slippage at 85%

        uint256 rawPayout = (_sharesToSell * spotPrice * (1e6 - slippage)) / 1e12; // Adjusted decimals
        uint256 fee = (rawPayout * TRADING_FEE_BPS) / 10000;
        uint256 netPayout = rawPayout - fee;

        // Perform pool reserve shifts
        uint256 k = yesPool * noPool;
        if (_outcome == Outcome.YES) {
            market.yesSharesPool = yesPool + _sharesToSell;
            market.noSharesPool = k / market.yesSharesPool;
        } else {
            market.noSharesPool = noPool + _sharesToSell;
            market.yesSharesPool = k / market.noSharesPool;
        }

        // Deduct balances & payout USDC
        shareBalances[msg.sender][_id][_outcome] -= _sharesToSell;
        require(usdcToken.transfer(msg.sender, netPayout), "ArcOracle: USDC transfer failed");
        require(usdcToken.transfer(oracle, fee), "ArcOracle: Fee transfer failed");

        emit SharesSold(_id, msg.sender, _outcome, _sharesToSell, netPayout);
    }

    /**
     * @notice Resolves an expired prediction market.
     * @param _id Market ID.
     * @param _winningOutcome The final consensus outcome (YES or NO).
     */
    function resolveMarket(bytes32 _id, Outcome _winningOutcome) external onlyOracle {
        Market storage market = markets[_id];
        require(market.status == MarketStatus.ACTIVE, "ArcOracle: Market is not active");
        require(block.timestamp >= market.endDate, "ArcOracle: Expiration deadline has not passed");
        require(_winningOutcome == Outcome.YES || _winningOutcome == Outcome.NO, "ArcOracle: Invalid final resolution");

        market.status = MarketStatus.RESOLVED;
        market.winningOutcome = _winningOutcome;

        emit MarketResolved(_id, _winningOutcome);
    }

    /**
     * @notice Allows winning share holders to claim their 1:1 USDC payouts.
     * @param _id Market ID.
     */
    function claimPayout(bytes32 _id) external {
        Market storage market = markets[_id];
        require(market.status == MarketStatus.RESOLVED, "ArcOracle: Market has not resolved");
        
        Outcome winningOutcome = market.winningOutcome;
        uint256 winningShares = shareBalances[msg.sender][_id][winningOutcome];
        require(winningShares > 0, "ArcOracle: No winning shares to claim");

        // Nullify balance & payout USDC 1:1 (guaranteed standard)
        shareBalances[msg.sender][_id][winningOutcome] = 0;
        
        // Payout winning contract shares (1 Share = 1 USDC)
        require(usdcToken.transfer(msg.sender, winningShares), "ArcOracle: Payout transfer failed");

        emit PayoutClaimed(_id, msg.sender, winningShares);
    }

    /**
     * @notice Updates the Oracle controller address.
     */
    function setOracle(address _newOracle) external onlyOracle {
        require(_newOracle != address(0), "ArcOracle: Invalid new oracle address");
        oracle = _newOracle;
    }
}
