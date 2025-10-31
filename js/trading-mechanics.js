// ========================================
// TRADING MECHANICS - ADVANCED SYSTEMS
// ========================================

// ========================================
// SHORT SELLING SYSTEM
// ========================================

function enableShortSelling() {
    const equity = calculateWealthZoneScore();
    if (equity >= SHORT_SELLING_CONFIG.minEquity) {
        gameState.shortSellingEnabled = true;
        showNotification('📉 Short Selling Enabled! Profit from falling stocks!');
        saveState();
        renderAll();
    } else {
        showNotification(`❌ Need ${formatCurrency(SHORT_SELLING_CONFIG.minEquity)} equity to enable short selling!`);
    }
}

function shortStock(symbol, quantity) {
    if (!gameState.shortSellingEnabled) {
        alert('❌ Short selling not enabled!');
        return;
    }
    
    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node) return;
    
    const locateFee = (quantity / 1000) * SHORT_SELLING_CONFIG.locateFeePer1000;
    const marginRequired = node.currentPrice * quantity * SHORT_SELLING_CONFIG.marginRequirement;
    
    if (gameState.digitalReserve < marginRequired + locateFee) {
        alert(`Insufficient funds for short!\nNeed: ${formatCurrency(marginRequired + locateFee)}`);
        return;
    }
    
    // Deduct locate fee and lock margin
    gameState.digitalReserve -= locateFee;
    
    // Create short position
    if (!gameState.shortPositions) gameState.shortPositions = [];
    
    gameState.shortPositions.push({
        symbol,
        quantity,
        entryPrice: node.currentPrice,
        currentPrice: node.currentPrice,
        marginLocked: marginRequired,
        borrowFeeAccrued: 0,
        openTime: Date.now()
    });
    
    showNotification(`📉 Shorted ${quantity} shares of ${symbol} at ${formatCurrency(node.currentPrice)}`);
    saveState();
    renderAll();
}

function coverShort(symbol) {
    if (!gameState.shortPositions) return;
    
    const shortIndex = gameState.shortPositions.findIndex(s => s.symbol === symbol);
    if (shortIndex === -1) return;
    
    const short = gameState.shortPositions[shortIndex];
    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node) return;
    
    // Calculate profit/loss (inverse of normal trading)
    const priceDiff = short.entryPrice - node.currentPrice;
    const profit = priceDiff * short.quantity - short.borrowFeeAccrued;
    
    // Return margin and add profit
    gameState.digitalReserve += short.marginLocked + profit;
    
    // Remove short position
    gameState.shortPositions.splice(shortIndex, 1);
    
    const profitText = profit >= 0 ? `+${formatCurrency(profit)}` : formatCurrency(profit);
    showNotification(`📈 Covered short on ${symbol}: ${profitText}`);
    
    saveState();
    renderAll();
}

function updateShortPositions() {
    if (!gameState.shortPositions || gameState.shortPositions.length === 0) return;
    
    gameState.shortPositions.forEach(short => {
        const node = EQUITY_NODES.find(n => n.symbol === short.symbol);
        if (!node) return;
        
        // Update current price
        short.currentPrice = node.currentPrice;
        
        // Accrue borrow fees
        const borrowFee = short.entryPrice * short.quantity * SHORT_SELLING_CONFIG.borrowFeeRate;
        short.borrowFeeAccrued += borrowFee;
        
        // Check for margin call (if stock price increased too much)
        const unrealizedLoss = (node.currentPrice - short.entryPrice) * short.quantity;
        const equity = short.marginLocked - unrealizedLoss - short.borrowFeeAccrued;
        
        if (equity <= short.marginLocked * 0.3) {
            showNotification(`⚠️ MARGIN CALL on short ${short.symbol}! Stock price rising!`);
        }
        
        if (equity <= 0) {
            // Force cover
            coverShort(short.symbol);
            showNotification(`💥 Short position on ${short.symbol} force-covered!`);
        }
    });
}

// ========================================
// OPTIONS TRADING SYSTEM
// ========================================

function enableOptionsTrading() {
    const equity = calculateWealthZoneScore();
    if (equity >= OPTIONS_CONFIG.minEquity) {
        gameState.optionsEnabled = true;
        showNotification('📊 Options Trading Enabled! Trade calls and puts!');
        saveState();
        renderAll();
    } else {
        showNotification(`❌ Need ${formatCurrency(OPTIONS_CONFIG.minEquity)} equity to trade options!`);
    }
}

function buyOption(symbol, type, strikePrice, expirationDays) {
    if (!gameState.optionsEnabled) {
        alert('❌ Options trading not enabled!');
        return;
    }
    
    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node) return;
    
    // Calculate premium
    const timeValue = expirationDays / 365;
    const volatilityFactor = node.volatility === 'extreme' ? 2 : node.volatility === 'high' ? 1.5 : 1;
    const moneyness = type === 'call' ? 
        Math.max(0, node.currentPrice - strikePrice) : 
        Math.max(0, strikePrice - node.currentPrice);
    
    const premium = (node.currentPrice * OPTIONS_CONFIG.premiumMultiplier * volatilityFactor * timeValue) + moneyness;
    const totalCost = premium * 100; // Options are per 100 shares
    
    if (gameState.digitalReserve < totalCost) {
        alert(`Insufficient funds!\nNeed: ${formatCurrency(totalCost)}`);
        return;
    }
    
    gameState.digitalReserve -= totalCost;
    
    if (!gameState.optionPositions) gameState.optionPositions = [];
    
    gameState.optionPositions.push({
        symbol,
        type, // 'call' or 'put'
        strikePrice,
        premium,
        expirationTime: Date.now() + (expirationDays * 24 * 60 * 60 * 1000),
        purchaseTime: Date.now(),
        contracts: 1 // 1 contract = 100 shares
    });
    
    showNotification(`📊 Bought ${type.toUpperCase()} option on ${symbol} (Strike: ${formatCurrency(strikePrice)})`);
    saveState();
    renderAll();
}

function exerciseOption(index) {
    if (!gameState.optionPositions || !gameState.optionPositions[index]) return;
    
    const option = gameState.optionPositions[index];
    const node = EQUITY_NODES.find(n => n.symbol === option.symbol);
    if (!node) return;
    
    const shares = option.contracts * 100;
    
    if (option.type === 'call') {
        // Buy shares at strike price
        const cost = option.strikePrice * shares;
        if (gameState.digitalReserve >= cost) {
            gameState.digitalReserve -= cost;
            // Add to portfolio (simplified - just add cash value)
            const currentValue = node.currentPrice * shares;
            const profit = currentValue - cost - (option.premium * 100);
            gameState.digitalReserve += currentValue;
            showNotification(`📈 Exercised CALL: ${formatCurrency(profit)} profit`);
        }
    } else {
        // Sell shares at strike price
        const proceeds = option.strikePrice * shares;
        gameState.digitalReserve += proceeds;
        const profit = proceeds - (node.currentPrice * shares) - (option.premium * 100);
        showNotification(`📉 Exercised PUT: ${formatCurrency(profit)} profit`);
    }
    
    gameState.optionPositions.splice(index, 1);
    saveState();
    renderAll();
}

function updateOptions() {
    if (!gameState.optionPositions || gameState.optionPositions.length === 0) return;
    
    const now = Date.now();
    const expiredIndices = [];
    
    gameState.optionPositions.forEach((option, index) => {
        if (now >= option.expirationTime) {
            expiredIndices.push(index);
            
            const node = EQUITY_NODES.find(n => n.symbol === option.symbol);
            if (node) {
                // Auto-exercise if in the money
                const inTheMoney = option.type === 'call' ? 
                    node.currentPrice > option.strikePrice : 
                    node.currentPrice < option.strikePrice;
                
                if (inTheMoney) {
                    exerciseOption(index);
                } else {
                    showNotification(`⏰ ${option.type.toUpperCase()} option on ${option.symbol} expired worthless`);
                }
            }
        }
    });
    
    // Remove expired options (in reverse to maintain indices)
    expiredIndices.reverse().forEach(index => {
        if (gameState.optionPositions[index]) {
            gameState.optionPositions.splice(index, 1);
        }
    });
}

// ========================================
// CRYPTO TRADING SYSTEM
// ========================================

function initializeCrypto() {
    if (!gameState.cryptoAssets) {
        gameState.cryptoAssets = CRYPTO_ASSETS.map(crypto => ({
            ...crypto,
            currentPrice: crypto.basePrice,
            previousPrice: crypto.basePrice,
            priceHistory: [crypto.basePrice],
            trend: 0,
            is24_7: true // Crypto trades 24/7
        }));
    }
}

function updateCryptoPrices() {
    if (!gameState.cryptoAssets) return;
    
    gameState.cryptoAssets.forEach(crypto => {
        crypto.previousPrice = crypto.currentPrice;
        
        // Extreme volatility for crypto
        const volatilityFactor = 0.05; // ±5% per update
        const change = (Math.random() - 0.5) * 2 * volatilityFactor;
        
        crypto.currentPrice *= (1 + change);
        crypto.currentPrice = Math.max(crypto.currentPrice, crypto.basePrice * 0.1); // Can't go below 10% of base
        
        crypto.priceHistory.push(crypto.currentPrice);
        if (crypto.priceHistory.length > 100) {
            crypto.priceHistory.shift();
        }
    });
}

// ========================================
// FOREX TRADING SYSTEM
// ========================================

function initializeForex() {
    if (!gameState.forexPairs) {
        gameState.forexPairs = FOREX_PAIRS.map(pair => ({
            ...pair,
            currentPrice: pair.basePrice,
            previousPrice: pair.basePrice,
            priceHistory: [pair.basePrice],
            trend: 0
        }));
    }
}

function updateForexPrices() {
    if (!gameState.forexPairs) return;
    
    gameState.forexPairs.forEach(pair => {
        pair.previousPrice = pair.currentPrice;
        
        // Small pip movements
        const pips = (Math.random() - 0.5) * 20; // ±20 pips
        const change = pips * pair.pipValue;
        
        pair.currentPrice += change;
        pair.currentPrice = Math.max(pair.currentPrice, pair.basePrice * 0.5);
        
        pair.priceHistory.push(pair.currentPrice);
        if (pair.priceHistory.length > 100) {
            pair.priceHistory.shift();
        }
    });
}

