// Trading Functions (Buy/Sell)

// Acquire node (buy stock)
function acquireNode() {
    const symbol = document.getElementById('modalSymbol').textContent;
    const quantity = parseInt(document.getElementById('quantityInput').value);

    if (!quantity || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }

    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    const totalCost = node.currentPrice * quantity;

    console.log('Attempting to buy:', symbol, 'Quantity:', quantity, 'Total Cost:', totalCost, 'Digital Reserve:', gameState.digitalReserve);

    if (totalCost > gameState.digitalReserve) {
        alert(`Insufficient Digital Reserve\nNeed: ${formatCurrency(totalCost)}\nHave: ${formatCurrency(gameState.digitalReserve)}`);
        return;
    }

    // Deduct from reserve
    gameState.digitalReserve -= totalCost;

    // Check if already have position in this stock
    const existingStrategy = gameState.activeStrategies.find(s => s.symbol === symbol);

    if (existingStrategy) {
        // Add to existing position
        const newTotalQuantity = existingStrategy.quantity + quantity;
        const newTotalCost = existingStrategy.investedCapital + totalCost;
        existingStrategy.quantity = newTotalQuantity;
        existingStrategy.investedCapital = newTotalCost;
        existingStrategy.purchasePrice = newTotalCost / newTotalQuantity; // Average price
        existingStrategy.purchaseCost = newTotalCost;
        existingStrategy.currentValue = newTotalQuantity * node.currentPrice;
        existingStrategy.performanceMetric = existingStrategy.currentValue - newTotalCost;
        existingStrategy.performancePercent = (existingStrategy.performanceMetric / newTotalCost) * 100;
    } else {
        // Create new strategy
        gameState.activeStrategies.push({
            symbol: symbol,
            quantity: quantity,
            purchasePrice: node.currentPrice,
            purchaseCost: totalCost,
            investedCapital: totalCost,
            currentPrice: node.currentPrice,
            currentValue: totalCost,
            performanceMetric: 0,
            performancePercent: 0,
            acquireTime: Date.now()
        });

        // Track acquire time for hold time calculation
        if (!gameState.strategyAcquireTimes) {
            gameState.strategyAcquireTimes = {};
        }
        gameState.strategyAcquireTimes[symbol] = Date.now();

        // Track sector trading for diversification milestone
        if (node.sector) {
            if (!gameState.tradedSectors) {
                gameState.tradedSectors = new Set();
            }
            gameState.tradedSectors.add(node.sector);
        }
    }

    playSound('buy');
    closeModal();

    // Update rank after buying
    if (typeof updateRank === 'function') {
        updateRank();
    }

    saveState();
    renderAll();
}

// Release node (sell stock)
function releaseNode(symbol) {
    const strategyIndex = gameState.activeStrategies.findIndex(s => s.symbol === symbol);
    if (strategyIndex === -1) return;

    const strategy = gameState.activeStrategies[strategyIndex];
    const node = EQUITY_NODES.find(n => n.symbol === symbol);

    if (!confirm(`Release ${strategy.quantity} units of ${symbol}?\n\nCurrent Value: ${formatCurrency(strategy.currentValue)}\nPerformance: ${formatCurrency(strategy.performanceMetric)} (${strategy.performancePercent.toFixed(2)}%)`)) {
        return;
    }

    // Add to digital reserve (with profit multiplier if active)
    let finalValue = strategy.currentValue;
    
    // Apply profit multiplier potion if active
    if (isPotionActive('profit') && strategy.performanceMetric > 0) {
        const profit = strategy.performanceMetric;
        const boostedProfit = profit * 2; // 2x profit
        finalValue = strategy.investedCapital + boostedProfit;
        showNotification(`💰 Profit Multiplier Active! +${formatCurrency(boostedProfit - profit)} bonus!`);
    }
    
    gameState.digitalReserve += finalValue;

    // Check for quick flip milestone (bought and sold within 30 seconds)
    const holdTime = Date.now() - (strategy.acquireTime || 0);
    const isQuickFlip = holdTime < 30000; // 30 seconds

    // Update advanced statistics
    if (strategy.performanceMetric > 0) {
        gameState.totalWins = (gameState.totalWins || 0) + 1;
    } else {
        gameState.totalLosses = (gameState.totalLosses || 0) + 1;
    }

    // Track best/worst trades
    if (!gameState.bestTrade || strategy.performanceMetric > gameState.bestTrade.profit) {
        gameState.bestTrade = {
            symbol: strategy.symbol,
            profit: strategy.performanceMetric,
            percent: strategy.performancePercent,
            timestamp: new Date().toISOString()
        };
    }

    if (!gameState.worstTrade || strategy.performanceMetric < gameState.worstTrade.loss) {
        gameState.worstTrade = {
            symbol: strategy.symbol,
            loss: strategy.performanceMetric,
            percent: strategy.performancePercent,
            timestamp: new Date().toISOString()
        };
    }

    // Track hold time
    gameState.totalHoldTime = (gameState.totalHoldTime || 0) + holdTime;

    // Track profit by sector
    if (node) {
        if (!gameState.profitBySector) {
            gameState.profitBySector = {};
        }
        gameState.profitBySector[node.sector] = (gameState.profitBySector[node.sector] || 0) + strategy.performanceMetric;
    }

    // Add to completed cycles
    gameState.completedCycles.push({
        symbol: strategy.symbol,
        quantity: strategy.quantity,
        purchasePrice: strategy.purchasePrice,
        sellPrice: strategy.currentPrice,
        purchaseCost: strategy.purchaseCost,
        sellValue: strategy.currentValue,
        performanceMetric: strategy.performanceMetric,
        performancePercent: strategy.performancePercent,
        timestamp: new Date().toISOString(),
        quickFlip: isQuickFlip,
        holdTime: holdTime,
        sector: node ? node.sector : 'Unknown'
    });

    // Remove from active strategies
    gameState.activeStrategies.splice(strategyIndex, 1);

    // Play sound based on profit/loss
    if (strategy.performanceMetric > 0) {
        playSound('profit');
    } else {
        playSound('loss');
    }
    playSound('sell');

    // Remove from acquire times
    if (gameState.strategyAcquireTimes && gameState.strategyAcquireTimes[symbol]) {
        delete gameState.strategyAcquireTimes[symbol];
    }

    // Update daily challenge progress
    updateDailyChallengeProgress('trade');

    // Update rank after selling
    if (typeof updateRank === 'function') {
        updateRank();
    }

    saveState();
    renderAll();
}

