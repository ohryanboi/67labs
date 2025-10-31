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
        dividendBoost: 0
    },
    activePotions: [],
    redeemedCodes: [],
    cheatMenuUnlocked: false
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

