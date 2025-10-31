// Trading Functions (Buy/Sell)

// Acquire node (buy stock/asset)
function acquireNode() {
    const symbol = document.getElementById('modalSymbol').textContent;
    const quantity = parseInt(document.getElementById('quantityInput').value);

    if (!quantity || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }

    // Check if trading is halted
    if (gameState.tradingHalted) {
        alert('🚫 Trading is halted! Cannot buy!');
        return;
    }

    // Check if broker outage is active
    if (gameState.brokerOutage) {
        alert('⚠️ Broker outage! Cannot buy!');
        return;
    }

    // Check if trading ban is active
    if (gameState.tradingBan) {
        alert('🚫 Trading ban active! Cannot trade!');
        return;
    }

    // Check if account is frozen
    if (gameState.accountFrozen) {
        alert('❄️ Account frozen! Cannot trade!');
        return;
    }

    // Find asset in any asset class
    let node = EQUITY_NODES.find(n => n.symbol === symbol);
    let assetType = 'stock';

    if (!node && typeof getAssetBySymbol === 'function') {
        node = getAssetBySymbol(symbol);
        // Determine asset type
        if (gameState.cryptoAssets && gameState.cryptoAssets.find(a => a.symbol === symbol)) {
            assetType = 'crypto';
        } else if (gameState.forexPairs && gameState.forexPairs.find(a => a.symbol === symbol)) {
            assetType = 'forex';
        } else if (gameState.commodities && gameState.commodities.find(a => a.symbol === symbol)) {
            assetType = 'commodity';
        } else if (gameState.bonds && gameState.bonds.find(a => a.symbol === symbol)) {
            assetType = 'bond';
        }
    }

    if (!node) {
        alert('Asset not found!');
        return;
    }

    // Check if stock is unlocked (only for stocks, not other assets)
    if (assetType === 'stock' && typeof isStockUnlocked === 'function' && !isStockUnlocked(symbol)) {
        alert('🔒 This stock is locked! Unlock it by reaching milestones.');
        return;
    }

    // Mark insider tip action
    if (typeof actOnInsiderTip === 'function') {
        actOnInsiderTip(symbol);
    }

    let totalCost = node.currentPrice * quantity;

    // Apply leverage if margin trading is enabled
    const leverage = gameState.marginEnabled ? (gameState.currentLeverage || 1) : 1;
    const actualCost = totalCost / leverage;
    const borrowedAmount = totalCost - actualCost;

    console.log('Attempting to buy:', symbol, 'Quantity:', quantity, 'Total Cost:', totalCost, 'Leverage:', leverage, 'Actual Cost:', actualCost, 'Digital Reserve:', gameState.digitalReserve);

    if (actualCost > gameState.digitalReserve) {
        alert(`Insufficient Digital Reserve\nNeed: ${formatCurrency(actualCost)}\nHave: ${formatCurrency(gameState.digitalReserve)}`);
        return;
    }

    // Deduct from reserve and add to margin debt
    gameState.digitalReserve -= actualCost;
    if (borrowedAmount > 0) {
        gameState.marginDebt = (gameState.marginDebt || 0) + borrowedAmount;
    }

    // Check if already have position in this asset
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
            assetType: assetType, // Track asset type
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

// Release node (sell stock/asset)
function releaseNode(symbol) {
    const strategyIndex = gameState.activeStrategies.findIndex(s => s.symbol === symbol);
    if (strategyIndex === -1) return;

    const strategy = gameState.activeStrategies[strategyIndex];

    // Find asset in any asset class
    let node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node && typeof getAssetBySymbol === 'function') {
        node = getAssetBySymbol(symbol);
    }

    if (!node) {
        alert('Asset not found!');
        return;
    }

    // Check if diamond hands is active - can't sell!
    if (gameState.diamondHandsActive) {
        showNotification('💎 Diamond Hands Active! Cannot sell positions!');
        return;
    }

    // Check if trading is halted
    if (gameState.tradingHalted) {
        showNotification('🚫 Trading is halted! Cannot sell positions!');
        return;
    }

    // Check if broker outage is active
    if (gameState.brokerOutage) {
        showNotification('⚠️ Broker outage! Cannot sell positions!');
        return;
    }

    if (!confirm(`Release ${strategy.quantity} units of ${symbol}?\n\nCurrent Value: ${formatCurrency(strategy.currentValue)}\nPerformance: ${formatCurrency(strategy.performanceMetric)} (${strategy.performancePercent.toFixed(2)}%)`)) {
        return;
    }

    // Add to digital reserve (with profit multiplier if active)
    let finalValue = strategy.currentValue;
    let profitMultiplier = 1;

    // Apply loss protection potion if active and trade is losing
    if (gameState.protectedTrades > 0 && strategy.performanceMetric < 0) {
        finalValue = strategy.investedCapital; // Break even instead of loss
        gameState.protectedTrades--;
        showNotification(`🛡️ Loss Protection Activated! Trade protected (${gameState.protectedTrades} remaining)`);
    }

    // Apply profit multiplier potion if active
    if (isPotionActive('profit') && strategy.performanceMetric > 0) {
        profitMultiplier = 2; // 2x profit
    }

    // Apply perfect storm combo (volatility + profit)
    if (isComboActive && isComboActive('perfectStorm') && strategy.performanceMetric > 0) {
        profitMultiplier = 3; // 3x profit
    }

    // Apply profit multiplier
    if (profitMultiplier > 1 && strategy.performanceMetric > 0) {
        const profit = strategy.performanceMetric;
        const boostedProfit = profit * profitMultiplier;
        finalValue = strategy.investedCapital + boostedProfit;
        showNotification(`💰 Profit Multiplier Active! +${formatCurrency(boostedProfit - profit)} bonus!`);
    }

    // Apply prestige profit bonus
    if (gameState.prestigeLevel > 0 && strategy.performanceMetric > 0) {
        const prestigeBonus = PRESTIGE_BONUSES[gameState.prestigeLevel];
        if (prestigeBonus) {
            const profit = finalValue - strategy.investedCapital;
            const bonusProfit = profit * prestigeBonus.profitBonus;
            finalValue += bonusProfit;
            showNotification(`🔄 Prestige Bonus! +${formatCurrency(bonusProfit)} (${(prestigeBonus.profitBonus * 100).toFixed(0)}%)`);
        }
    }

    // Calculate and apply taxes on profits
    let taxAmount = 0;
    if (strategy.performanceMetric > 0) {
        const difficulty = DIFFICULTY_MODES[gameState.difficultyMode || 'easy'];
        const taxRate = TAX_RATES[difficulty.taxRate];
        if (taxRate && taxRate.rate > 0) {
            const profit = finalValue - strategy.investedCapital;
            taxAmount = profit * taxRate.rate;
            finalValue -= taxAmount;
            gameState.totalTaxesPaid = (gameState.totalTaxesPaid || 0) + taxAmount;
            showNotification(`💸 Tax: ${formatCurrency(taxAmount)} (${(taxRate.rate * 100).toFixed(0)}% capital gains)`);
        }
    }

    gameState.digitalReserve += finalValue;

    // Track lifetime earnings
    if (strategy.performanceMetric > 0) {
        gameState.totalLifetimeEarnings = (gameState.totalLifetimeEarnings || 0) + strategy.performanceMetric;
    }

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

    // Track total trades
    gameState.totalTrades = (gameState.totalTrades || 0) + 1;

    // Check if traded during news event
    if (node && node.newsImpact) {
        gameState.newsTradesCount = (gameState.newsTradesCount || 0) + 1;
    }

    // Check for bad luck curse trigger
    if (typeof checkBadLuckCurse === 'function' && strategy.performanceMetric > 0) {
        checkBadLuckCurse(strategy.performanceMetric);
    }

    // Pay back margin debt if profitable
    if (gameState.marginDebt > 0 && strategy.performanceMetric > 0) {
        const debtPayment = Math.min(gameState.marginDebt, strategy.performanceMetric * 0.5);
        gameState.marginDebt -= debtPayment;
        gameState.digitalReserve -= debtPayment;
        showNotification(`📊 Paid ${formatCurrency(debtPayment)} margin debt`);
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

