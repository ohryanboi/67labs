// NEW SIMPLIFIED PRICE UPDATE SYSTEM

// Helper function to check if a potion effect is active
function isPotionActive(effect) {
    if (!gameState.activePotions) return false;
    return gameState.activePotions.some(p => p.effect === effect && !p.expired);
}

// Main price update function - COMPLETELY REWRITTEN
function updatePrices() {
    // Don't update prices if frozen (cheat)
    if (pricesFrozen) {
        // Still update UI even when frozen
        if (typeof renderAll === 'function') {
            renderAll();
        }
        return;
    }

    // Update each stock price
    EQUITY_NODES.forEach(node => {
        // Store previous price for change calculation
        node.previousPrice = node.currentPrice;

        // Get volatility multiplier (how much price can change per update)
        let baseVolatility = 0.03; // Default 3%
        if (node.volatility === 'low') baseVolatility = 0.02;      // 2% - can swing ±2%
        if (node.volatility === 'moderate') baseVolatility = 0.04; // 4% - can swing ±4%
        if (node.volatility === 'high') baseVolatility = 0.07;     // 7% - can swing ±7%
        if (node.volatility === 'extreme') baseVolatility = 0.12;  // 12% - can swing ±12%

        // Add random volatility spike (10% chance for extra volatility)
        const volatilitySpike = Math.random() < 0.1 ? 1.5 : 1.0;
        const volatility = baseVolatility * volatilitySpike;

        // Get pulse direction (bullish = up, bearish = down)
        let direction = 0;
        if (node.pulse === 'bullish') direction = 0.4;
        if (node.pulse === 'bearish') direction = -0.4;
        if (node.pulse === 'volatile') direction = (Math.random() - 0.5) * 3; // More extreme swings
        if (node.pulse === 'neutral') direction = 0;

        // Apply luck boost potion - make prices go up more
        if (isPotionActive('luck')) {
            direction += 0.5;
        }

        // Calculate price change with more randomness
        const randomChange = (Math.random() - 0.5) * 2.5; // -1.25 to 1.25 (more random)

        // Weight randomness more heavily for unpredictability
        const finalChange = (randomChange * 0.7 + direction * 0.3) * volatility;

        // Update price (minimum $1)
        node.currentPrice = Math.max(1, node.currentPrice * (1 + finalChange));

        // Occasionally change pulse to keep things dynamic (5% chance)
        if (Math.random() < 0.05) {
            const pulses = ['bullish', 'bearish', 'volatile', 'neutral'];
            node.pulse = pulses[Math.floor(Math.random() * pulses.length)];
        }

        // Update price history
        if (!node.priceHistory) node.priceHistory = [];
        node.priceHistory.push(node.currentPrice);
        if (node.priceHistory.length > 50) node.priceHistory.shift();

        // Update volume (higher on big price changes)
        const priceChangePercent = Math.abs((node.currentPrice - node.previousPrice) / node.previousPrice);
        const volumeMultiplier = 1 + (priceChangePercent * 10);
        node.volume = Math.floor((1000 + Math.random() * 5000) * volumeMultiplier);
        if (!node.volumeHistory) node.volumeHistory = [];
        node.volumeHistory.push(node.volume);
        if (node.volumeHistory.length > 50) node.volumeHistory.shift();

        // Update OHLC data
        node.open = node.previousPrice;
        node.high = Math.max(node.previousPrice, node.currentPrice);
        node.low = Math.min(node.previousPrice, node.currentPrice);
        node.close = node.currentPrice;
    });

    // Update portfolio values
    if (gameState.activeStrategies) {
        gameState.activeStrategies.forEach(strategy => {
            const node = EQUITY_NODES.find(n => n.symbol === strategy.symbol);
            if (node) {
                strategy.currentPrice = node.currentPrice;
                strategy.currentValue = strategy.quantity * node.currentPrice;
                strategy.performanceMetric = strategy.currentValue - strategy.investedCapital;
                strategy.performancePercent = (strategy.performanceMetric / strategy.investedCapital) * 100;
            }
        });
    }

    // Check orders
    if (typeof checkAndExecuteOrders === 'function') {
        checkAndExecuteOrders();
    }

    // Update UI
    if (typeof renderAll === 'function') {
        renderAll();
    }
}

// Helper: Update active strategies with current prices
function updateActiveStrategies() {
    if (!gameState.activeStrategies) return;

    gameState.activeStrategies.forEach(strategy => {
        const node = EQUITY_NODES.find(n => n.symbol === strategy.symbol);
        if (node) {
            strategy.currentPrice = node.currentPrice;
            strategy.currentValue = strategy.quantity * node.currentPrice;
            strategy.performanceMetric = strategy.currentValue - strategy.investedCapital;
            strategy.performancePercent = (strategy.performanceMetric / strategy.investedCapital) * 100;
        }
    });
}

// Helper: Calculate performance metric for a strategy
function calculatePerformanceMetric(strategy) {
    const node = EQUITY_NODES.find(n => n.symbol === strategy.symbol);
    if (!node) return 0;

    const currentValue = strategy.quantity * node.currentPrice;
    return currentValue - strategy.investedCapital;
}

