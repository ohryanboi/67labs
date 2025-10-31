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
            triggerRandomMarketEvent();
            triggerStockSplit();
            generateNewsEvent();
            triggerEarningsReport();
        }
        payDividends();
        checkThemeUnlocks();
        checkBadgeUnlocks();
        checkActivePotions();
        updateRank(); // Update rank based on current stats
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
    renderAll();

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

