// Main Initialization and Speed Control

let updateInterval = null;
let currentSpeed = 2000; // Normal speed: 2 seconds

// Set speed
function setSpeed(speed, skipButtonUpdate = false) {
    currentSpeed = speed;

    // Track ultra speed for milestone
    if (speed === 500) {
        if (!gameState.ultraSpeedStartTime) {
            gameState.ultraSpeedStartTime = Date.now();
        }
    } else {
        gameState.ultraSpeedStartTime = null;
    }

    // Update button states (only if called from button click)
    if (!skipButtonUpdate && typeof event !== 'undefined' && event.target) {
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    // Clear old interval and start new one
    if (updateInterval) {
        clearInterval(updateInterval);
    }

    updateInterval = setInterval(() => {
        if (!pricesFrozen) {
            updatePrices();
            updateMarketCycle(); // Market cycles system
            triggerRandomMarketEvent();

            // World Events & Realism
            if (typeof triggerStockSplit === 'function') triggerStockSplit();
            if (typeof generateNewsEvent === 'function') generateNewsEvent();
            if (typeof triggerEarningsReport === 'function') triggerEarningsReport();
            if (typeof triggerMergerAcquisition === 'function') triggerMergerAcquisition();
            if (typeof checkBankruptcies === 'function') checkBankruptcies();
            if (typeof triggerRegulatoryEvent === 'function') triggerRegulatoryEvent();
            if (typeof clearExpiredRegulatoryEvents === 'function') clearExpiredRegulatoryEvents();
            if (typeof checkMarketHours === 'function') checkMarketHours();

            // Trading Mechanics - Price Updates
            if (typeof updateCryptoPrices === 'function') updateCryptoPrices();
            if (typeof updateForexPrices === 'function') updateForexPrices();
            if (typeof updateCommodityPrices === 'function') updateCommodityPrices();
            if (typeof updateBondPrices === 'function') updateBondPrices();
            if (typeof updateShortPositions === 'function') updateShortPositions();
            if (typeof updateOptions === 'function') updateOptions();

            if (typeof triggerBadEvent === 'function') triggerBadEvent(); // New bad events system

            // Advanced features
            if (typeof updateEconomicIndicators === 'function') updateEconomicIndicators();
            if (typeof triggerSectorEvent === 'function') triggerSectorEvent();
            if (typeof triggerInsiderTip === 'function') triggerInsiderTip();
            if (typeof triggerIPO === 'function') triggerIPO();
        }

        if (typeof payDividends === 'function') payDividends();
        checkThemeUnlocks();
        checkBadgeUnlocks();
        checkActivePotions();
        updateRank(); // Update rank based on current stats

        // Advanced features checks
        if (typeof checkInsiderTipExpiry === 'function') checkInsiderTipExpiry();
        if (typeof updateIPOs === 'function') updateIPOs();
        if (typeof checkStockUnlocks === 'function') checkStockUnlocks();

        // New features checks
        if (typeof clearExpiredNews === 'function') clearExpiredNews();
        if (typeof applyBadLuckCurse === 'function') applyBadLuckCurse();
        if (typeof calculateMarginInterest === 'function') calculateMarginInterest();
        if (typeof checkTradingBan === 'function') checkTradingBan();
        if (typeof checkAccountFreeze === 'function') checkAccountFreeze();
        if (typeof checkAchievementChains === 'function') checkAchievementChains();

        saveState();
        checkMilestones(); // Check for speed demon milestone
    }, speed);

    console.log('Speed set to:', speed, 'ms');
}

// Initialize game
function initGame() {
    loadState();
    checkLoginStreak();
    updateTier();
    updateRank();
    generateDailyChallenge(); // Generate daily challenge

    // Initialize new trading systems - ALWAYS initialize these (auto-unlock)
    if (typeof initializeCrypto === 'function') {
        initializeCrypto();
        console.log('Crypto initialized:', gameState.cryptoAssets ? 'Success' : 'Failed');
    }
    if (typeof initializeForex === 'function') {
        initializeForex();
        console.log('Forex initialized:', gameState.forexPairs ? 'Success' : 'Failed');
    }
    if (typeof initializeCommodities === 'function') {
        initializeCommodities();
        console.log('Commodities initialized:', gameState.commodities ? 'Success' : 'Failed');
    }
    if (typeof initializeBonds === 'function') {
        initializeBonds();
        console.log('Bonds initialized:', gameState.bonds ? 'Success' : 'Failed');
    }
    if (typeof initializeDividends === 'function') initializeDividends();
    renderAll();

    // Set initial asset type to stocks
    setTimeout(() => {
        if (typeof showAssetType === 'function') {
            showAssetType('stocks');
        }
    }, 100);

    // Apply saved theme
    if (gameState.currentTheme && gameState.currentTheme !== 'default') {
        applyTheme(gameState.currentTheme);
    }

    // Apply saved view mode
    if (gameState.viewMode === 'compact') {
        document.querySelector('.container').classList.add('compact-mode');
    }

    // Apply saved dark mode
    if (gameState.darkMode === false) {
        toggleDarkMode();
        toggleDarkMode(); // Toggle twice to set to light mode
    }

    // Start price updates at current speed using setSpeed function
    setSpeed(currentSpeed, true); // true = skip button update
    console.log('Game initialized with speed:', currentSpeed);
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Escape - Close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('acquireModal');
        if (modal && modal.classList.contains('active')) {
            closeModal();
        }
    }

    // Ctrl/Cmd + Number keys - Switch tabs
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const tabMap = {
            '1': 'trading',
            '2': 'portfolio',
            '3': 'analytics',
            '4': 'progression',
            '5': 'achievements',
            '6': 'shop',
            '7': 'prestige',
            '8': 'settings'
        };

        if (tabMap[e.key]) {
            e.preventDefault();
            switchTab(tabMap[e.key]);
            // Update active tab button
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            const targetTab = Array.from(document.querySelectorAll('.tab')).find(t =>
                t.textContent.toLowerCase().includes(tabMap[e.key].substring(0, 4))
            );
            if (targetTab) targetTab.classList.add('active');
        }
    }

    // D - Toggle Dark/Light mode
    if (e.key === 'd' && !e.ctrlKey && !e.metaKey && !e.target.matches('input')) {
        toggleDarkMode();
    }

    // C - Toggle Compact/Expanded view
    if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !e.target.matches('input')) {
        toggleViewMode();
    }

    // Space - Pause/Resume (freeze prices)
    if (e.key === ' ' && !e.target.matches('input')) {
        e.preventDefault();
        pricesFrozen = !pricesFrozen;
        showNotification(pricesFrozen ? '⏸️ Paused' : '▶️ Resumed');
    }
});

// Close modal on background click
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('acquireModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'acquireModal') {
                closeModal();
            }
        });
    }

    // Initialize the game
    initGame();

    // Show cheat button if unlocked
    if (gameState.cheatMenuUnlocked) {
        showCheatButton();
    }

    // Show update log after everything is loaded
    setTimeout(() => {
        showUpdateLog();
    }, 1500);
});

