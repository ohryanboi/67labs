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

    // Prestige System
    prestigeLevel: 0,
    prestigeBonuses: {
        startingCapitalBonus: 0, // % bonus
        rpMultiplier: 1.0,
        tradingFeeReduction: 0 // % reduction
    },

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
        dividendBoost: 0
    },
    activePotions: [],
    redeemedCodes: [],
    cheatMenuUnlocked: false
};

// Load saved state
function loadState() {
    const saved = localStorage.getItem('67labs-state');
    if (saved) {
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
    if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
        // Clear localStorage completely
        localStorage.clear();

        // Reset all EQUITY_NODES to base prices
        EQUITY_NODES.forEach(node => {
            node.currentPrice = node.basePrice;
            node.previousPrice = node.basePrice;
            node.priceHistory = [node.basePrice];
            node.volumeHistory = [];
            node.volume = 0;
        });

        // Reset all MILESTONES
        MILESTONES.forEach(m => {
            m.unlocked = false;
        });

        // Force reload to completely reset the page
        location.reload(true);
    }
}

// Format currency
function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

