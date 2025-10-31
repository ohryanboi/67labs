// Game State Management

let pricesFrozen = false; // Global flag for pausing price updates

let gameState = {
    digitalReserve: STARTER_CAPITAL,
    activeStrategies: [],
    completedCycles: [],
    focusStream: [],
    milestones: [],
    currentTier: 0,
    tradedSectors: new Set(),
    ultraSpeedStartTime: null,
    strategyAcquireTimes: {},
    currentRank: 0, // Index into RANKS array
    rankPoints: 0, // Points earned for ranking up
    stopLossOrders: [], // {symbol, targetPrice, strategyIndex}
    takeProfitOrders: [], // {symbol, targetPrice, strategyIndex}
    limitBuyOrders: [], // {symbol, targetPrice, quantity}
    limitSellOrders: [], // {symbol, targetPrice, strategyIndex}
    dailyChallenge: null, // Current daily challenge
    dailyChallengeProgress: 0,
    lastChallengeDate: null,
    wealthHistory: [], // Track wealth over time
    marketEvent: null, // Current market event
    marketEventEndTime: null,

    // Advanced Statistics
    totalWins: 0,
    totalLosses: 0,
    bestTrade: null, // {symbol, profit, percent, timestamp}
    worstTrade: null, // {symbol, loss, percent, timestamp}
    totalHoldTime: 0, // Total milliseconds
    profitBySector: {}, // {sector: totalProfit}

    // Achievement System
    achievementPoints: 0,
    secretAchievements: [],
    lastLoginDate: null,
    loginStreak: 0,

    // Customization & Settings
    currentTheme: 'default', // default, matrix, cyberpunk, neon
    unlockedThemes: ['default'],
    soundEnabled: true,
    unlockedBadges: [],
    activeBadge: null,
    activeTitle: null,

    // Dividends & Stock Splits
    lastDividendPayout: null,
    stockSplitHistory: [],

    // News & Events
    newsEvents: [],
    currentNews: null,

    // UI Settings
    viewMode: 'expanded', // expanded or compact
    darkMode: true,

    // Notifications & Alerts
    priceAlerts: [], // {symbol, targetPrice, type: 'above'/'below'}

    // Shop & Codes
    potions: {
        speedBoost: 0,
        profitMultiplier: 0,
        luckBoost: 0,
        dividendBoost: 0,
        insiderVision: 0,
        lossProtection: 0,
        timeFreeze: 0,
        volatilityBomb: 0,
        diamondHands: 0,
        marketCrash: 0,
        bullRun: 0
    },
    activePotions: [],
    redeemedCodes: [],
    cheatMenuUnlocked: false,

    // Bad Events
    tradingHalted: false,
    haltEndTime: null,
    brokerOutage: false,
    outageEndTime: null,
    protectedTrades: 0, // For loss protection potion
    diamondHandsActive: false,
    diamondHandsEndTime: null,
    futurePrice: null, // For insider vision

    // Market Cycles
    currentMarketCycle: 'neutral',
    marketCycleEndTime: null,
    lastRecessionTime: null,

    // Tax System
    totalTaxesPaid: 0,
    taxableGains: 0,

    // Difficulty & Prestige
    difficultyMode: 'easy', // easy, normal, hard, nightmare
    prestigeLevel: 0,
    prestigePoints: 0,
    totalLifetimeEarnings: 0,
    unlockedExclusiveStocks: [],
    prestigeBadges: [],
    prestigeTitles: [],

    // Stock unlocking system
    unlockedStocks: ['TECH-A', 'FIN-A', 'HLTH-A', 'ENRG-A', 'CONS-A', 'IND-A', 'RET-A', 'TECH-B', 'FIN-B', 'HLTH-B'],
    totalTrades: 0,

    // Economic indicators
    economicIndicators: {
        interestRate: 0.05,
        inflation: 0.03,
        gdpGrowth: 0.03,
        unemployment: 0.04
    },

    // Insider trading
    activeInsiderTip: null,
    insiderTipEndTime: null,
    insiderPenalties: 0,

    // IPOs
    activeIPOs: [],
    ipoHistory: [],

    // Stock sorting and filtering
    stockSortBy: 'symbol', // symbol, price, change, sector
    stockSortOrder: 'asc', // asc, desc
    stockSearchQuery: '',

    // Achievement chains
    achievementChains: {},

    // Bad luck mechanics
    badLuckCurse: false,
    badLuckEndTime: null,
    tradingBan: false,
    tradingBanEndTime: null,
    accountFrozen: false,
    accountFreezeEndTime: null,

    // Margin trading
    marginEnabled: false,
    currentLeverage: 1, // 1x, 2x, 5x, 10x
    marginDebt: 0,
    marginInterestRate: 0.001, // 0.1% per update

    // Trading Mechanics - New Asset Classes
    shortSellingEnabled: false,
    shortPositions: [],
    optionsEnabled: false,
    optionPositions: [],
    cryptoAssets: null,
    forexPairs: null,
    commodities: null,
    bonds: null,

    // World Events & Realism
    earningsHistory: [],
    dividendStocks: null,
    totalDividendsEarned: 0,
    activeMerger: null,
    bankruptcyLosses: 0,
    globalMarketOpen: true,
    marketClosedNotified: false,
    afterHoursEnabled: false
};

// Load saved state
function loadState() {
    // Check if we're in the middle of a reset
    const isResetting = localStorage.getItem('67labs-resetting');
    if (isResetting === 'true') {
        // Clear the reset flag
        localStorage.removeItem('67labs-resetting');
        // Don't load any saved state - start fresh
        console.log('Game reset detected - starting fresh with $' + STARTER_CAPITAL);
        return;
    }

    const saved = localStorage.getItem('67labs-state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = { ...gameState, ...parsed };

            // Convert tradedSectors array back to Set
            if (parsed.tradedSectorsArray) {
                gameState.tradedSectors = new Set(parsed.tradedSectorsArray);
            }

            MILESTONES.forEach((m, i) => {
                if (gameState.milestones.includes(m.id)) {
                    m.unlocked = true;
                }
            });

            console.log('Loaded state - Digital Reserve:', gameState.digitalReserve);
        } catch (error) {
            console.error('Error loading saved state:', error);
            console.log('Starting fresh due to error');
        }
    } else {
        console.log('No saved state - Starting with:', gameState.digitalReserve);
    }
}

// Save state
function saveState() {
    gameState.milestones = MILESTONES.filter(m => m.unlocked).map(m => m.id);
    
    // Convert Set to array for JSON serialization
    const stateToSave = {
        ...gameState,
        tradedSectorsArray: gameState.tradedSectors ? Array.from(gameState.tradedSectors) : []
    };
    
    localStorage.setItem('67labs-state', JSON.stringify(stateToSave));
}

// Reset game (clear all progress)
function resetGame() {
    const confirmMessage = '⚠️ WARNING ⚠️\n\nThis will permanently delete ALL your progress:\n\n' +
                          '• All money and investments\n' +
                          '• All ranks and achievements\n' +
                          '• All unlocked themes and badges\n' +
                          '• All potions and codes\n' +
                          '• Everything will be reset to zero\n\n' +
                          'This action CANNOT be undone!\n\n' +
                          'Are you absolutely sure you want to continue?';

    if (confirm(confirmMessage)) {
        try {
            // Set a flag in localStorage to indicate we're resetting
            localStorage.setItem('67labs-resetting', 'true');

            // Clear all game data
            localStorage.removeItem('67labs-state');
            sessionStorage.clear();

            // Reset all EQUITY_NODES to base prices
            if (typeof EQUITY_NODES !== 'undefined') {
                EQUITY_NODES.forEach(node => {
                    node.currentPrice = node.basePrice;
                    node.previousPrice = node.basePrice;
                    node.priceHistory = [node.basePrice];
                    node.volumeHistory = [0];
                    node.volume = 0;
                    node.open = node.basePrice;
                    node.high = node.basePrice;
                    node.low = node.basePrice;
                    node.close = node.basePrice;
                });
            }

            // Reset all MILESTONES
            if (typeof MILESTONES !== 'undefined') {
                MILESTONES.forEach(m => {
                    m.unlocked = false;
                });
            }

            // Reset all SECRET_ACHIEVEMENTS
            if (typeof SECRET_ACHIEVEMENTS !== 'undefined') {
                SECRET_ACHIEVEMENTS.forEach(a => {
                    a.unlocked = false;
                });
            }

            // Reset global flags
            pricesFrozen = false;

            // Show notification before reload
            if (typeof showNotification === 'function') {
                showNotification('🔄 Resetting game... Page will reload.');
            }

            // Force hard reload to completely reset the page
            setTimeout(() => {
                window.location.href = window.location.href.split('?')[0] + '?reset=' + Date.now();
            }, 500);
        } catch (error) {
            console.error('Error during reset:', error);
            alert('Error resetting game. Please refresh the page manually.');
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

