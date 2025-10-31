// ========================================
// WORLD EVENTS & REALISM SYSTEMS
// ========================================

// ========================================
// EARNINGS SEASONS
// ========================================

function triggerEarningsReport() {
    if (Math.random() < EARNINGS_CONFIG.frequency) {
        const node = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];
        
        const rand = Math.random();
        let outcome, impact;
        
        if (rand < EARNINGS_CONFIG.beatExpectations) {
            outcome = 'beat';
            impact = EARNINGS_CONFIG.beatImpact.min + 
                Math.random() * (EARNINGS_CONFIG.beatImpact.max - EARNINGS_CONFIG.beatImpact.min);
        } else if (rand < EARNINGS_CONFIG.beatExpectations + EARNINGS_CONFIG.missExpectations) {
            outcome = 'miss';
            impact = EARNINGS_CONFIG.missImpact.min + 
                Math.random() * (EARNINGS_CONFIG.missImpact.max - EARNINGS_CONFIG.missImpact.min);
        } else {
            outcome = 'meet';
            impact = EARNINGS_CONFIG.meetImpact.min + 
                Math.random() * (EARNINGS_CONFIG.meetImpact.max - EARNINGS_CONFIG.meetImpact.min);
        }
        
        node.currentPrice *= (1 + impact);
        
        const messages = {
            beat: `📊 ${node.symbol} BEATS earnings expectations! Stock surges ${(impact * 100).toFixed(1)}%!`,
            miss: `📉 ${node.symbol} MISSES earnings! Stock drops ${(Math.abs(impact) * 100).toFixed(1)}%!`,
            meet: `📋 ${node.symbol} meets earnings expectations. Stock ${impact >= 0 ? 'up' : 'down'} ${(Math.abs(impact) * 100).toFixed(1)}%`
        };
        
        showNotification(messages[outcome]);
        
        // Track earnings event
        if (!gameState.earningsHistory) gameState.earningsHistory = [];
        gameState.earningsHistory.push({
            symbol: node.symbol,
            outcome,
            impact,
            timestamp: Date.now()
        });
        
        if (typeof playSound === 'function') {
            playSound('achievement');
        }
        
        saveState();
    }
}

// ========================================
// DIVIDEND SYSTEM
// ========================================

function initializeDividends() {
    if (!gameState.dividendStocks) {
        gameState.dividendStocks = new Set();
        
        // Randomly assign dividend-paying stocks
        EQUITY_NODES.forEach(node => {
            if (Math.random() < 0.3) { // 30% of stocks pay dividends
                gameState.dividendStocks.add(node.symbol);
            }
        });
    }
}

function payDividends() {
    if (!gameState.dividendStocks) initializeDividends();
    
    if (Math.random() < DIVIDEND_CONFIG.frequency) {
        const dividendSymbols = Array.from(gameState.dividendStocks);
        if (dividendSymbols.length === 0) return;
        
        const symbol = dividendSymbols[Math.floor(Math.random() * dividendSymbols.length)];
        const node = EQUITY_NODES.find(n => n.symbol === symbol);
        if (!node) return;
        
        // Check if player owns this stock
        const position = gameState.activeStrategies.find(s => s.symbol === symbol);
        if (!position) return;
        
        const isSpecial = Math.random() < DIVIDEND_CONFIG.specialDividendChance;
        const yieldRate = DIVIDEND_CONFIG.yieldRange.min + 
            Math.random() * (DIVIDEND_CONFIG.yieldRange.max - DIVIDEND_CONFIG.yieldRange.min);
        
        const annualDividend = node.currentPrice * yieldRate;
        const quarterlyDividend = annualDividend / 4;
        const totalDividend = quarterlyDividend * position.quantity * (isSpecial ? DIVIDEND_CONFIG.specialDividendMultiplier : 1);
        
        // Apply dividend boost potion if active
        const dividendBoost = gameState.activePotions?.some(p => p.type === 'dividendBoost' && !p.expired) ? 3 : 1;
        const finalDividend = totalDividend * dividendBoost;
        
        gameState.digitalReserve += finalDividend;
        
        const dividendType = isSpecial ? 'SPECIAL DIVIDEND' : 'Dividend';
        showNotification(`💰 ${dividendType} from ${symbol}: ${formatCurrency(finalDividend)}`);
        
        // Track dividend income
        gameState.totalDividendsEarned = (gameState.totalDividendsEarned || 0) + finalDividend;
        
        if (typeof playSound === 'function') {
            playSound('achievement');
        }
        
        saveState();
    }
}

// ========================================
// STOCK SPLITS
// ========================================

function triggerStockSplit() {
    if (Math.random() < STOCK_SPLIT_CONFIG.frequency) {
        // Find stocks eligible for split
        const eligibleForSplit = EQUITY_NODES.filter(n => n.currentPrice > STOCK_SPLIT_CONFIG.priceThreshold);
        const eligibleForReverse = EQUITY_NODES.filter(n => n.currentPrice < STOCK_SPLIT_CONFIG.reverseSplitThreshold);
        
        let node, isReverse = false, ratio;
        
        if (eligibleForSplit.length > 0 && Math.random() < 0.7) {
            // Regular split
            node = eligibleForSplit[Math.floor(Math.random() * eligibleForSplit.length)];
            const ratioData = weightedRandom(STOCK_SPLIT_CONFIG.splitRatios);
            ratio = ratioData.ratio;
        } else if (eligibleForReverse.length > 0) {
            // Reverse split
            node = eligibleForReverse[Math.floor(Math.random() * eligibleForReverse.length)];
            const ratioData = weightedRandom(STOCK_SPLIT_CONFIG.reverseSplitRatios);
            ratio = ratioData.ratio;
            isReverse = true;
        }
        
        if (!node) return;
        
        // Apply split
        const oldPrice = node.currentPrice;
        node.currentPrice = oldPrice / ratio;
        node.basePrice = node.basePrice / ratio;
        
        // Adjust player positions
        const position = gameState.activeStrategies.find(s => s.symbol === node.symbol);
        if (position) {
            position.quantity = Math.floor(position.quantity * ratio);
            position.purchasePrice = position.purchasePrice / ratio;
        }
        
        const splitText = isReverse ? 
            `🔄 ${node.symbol} REVERSE SPLIT ${Math.round(1/ratio)}:1! Price: ${formatCurrency(oldPrice)} → ${formatCurrency(node.currentPrice)}` :
            `🔄 ${node.symbol} STOCK SPLIT ${ratio}:1! Price: ${formatCurrency(oldPrice)} → ${formatCurrency(node.currentPrice)}`;
        
        showNotification(splitText);
        
        if (typeof playSound === 'function') {
            playSound('achievement');
        }
        
        saveState();
    }
}

function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
        random -= item.weight;
        if (random <= 0) return item;
    }
    
    return items[0];
}

// ========================================
// MERGERS & ACQUISITIONS
// ========================================

function triggerMergerAcquisition() {
    if (Math.random() < MA_CONFIG.frequency) {
        const target = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];
        const acquirer = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];
        
        if (target.symbol === acquirer.symbol) return;
        
        const premium = MA_CONFIG.premiumRange.min + 
            Math.random() * (MA_CONFIG.premiumRange.max - MA_CONFIG.premiumRange.min);
        const offerPrice = target.currentPrice * (1 + premium);
        const dealType = MA_CONFIG.dealTypes[Math.floor(Math.random() * MA_CONFIG.dealTypes.length)];
        
        gameState.activeMerger = {
            target: target.symbol,
            acquirer: acquirer.symbol,
            offerPrice,
            dealType,
            premium,
            expirationTime: Date.now() + MA_CONFIG.approvalTime,
            approved: false
        };
        
        showNotification(`🤝 M&A ALERT: ${acquirer.symbol} offers to acquire ${target.symbol} at ${formatCurrency(offerPrice)} (${(premium * 100).toFixed(0)}% premium)!`);
        
        // Set timer to resolve deal
        setTimeout(() => {
            resolveMerger();
        }, MA_CONFIG.approvalTime);
        
        if (typeof playSound === 'function') {
            playSound('achievement');
        }
        
        saveState();
    }
}

function resolveMerger() {
    if (!gameState.activeMerger) return;
    
    const dealFailed = Math.random() < MA_CONFIG.failureChance;
    const target = EQUITY_NODES.find(n => n.symbol === gameState.activeMerger.target);
    
    if (!target) {
        gameState.activeMerger = null;
        return;
    }
    
    if (dealFailed) {
        // Deal falls through - stock drops
        target.currentPrice *= 0.85;
        showNotification(`❌ M&A FAILED: ${gameState.activeMerger.target} deal falls through! Stock drops 15%!`);
    } else {
        // Deal succeeds
        const position = gameState.activeStrategies.find(s => s.symbol === gameState.activeMerger.target);
        
        if (position) {
            // Cash out at offer price
            const proceeds = gameState.activeMerger.offerPrice * position.quantity;
            gameState.digitalReserve += proceeds;
            
            const profit = proceeds - position.investedCapital;
            showNotification(`✅ M&A COMPLETE: ${gameState.activeMerger.target} acquired! You received ${formatCurrency(proceeds)} (${formatCurrency(profit)} profit)`);
            
            // Remove position
            const index = gameState.activeStrategies.findIndex(s => s.symbol === gameState.activeMerger.target);
            if (index !== -1) {
                gameState.activeStrategies.splice(index, 1);
            }
        } else {
            showNotification(`✅ M&A COMPLETE: ${gameState.activeMerger.target} acquired by ${gameState.activeMerger.acquirer}!`);
        }
        
        // Remove target stock from trading
        target.delisted = true;
    }
    
    gameState.activeMerger = null;
    saveState();
    renderAll();
}

// ========================================
// BANKRUPTCY & DELISTING
// ========================================

function checkBankruptcies() {
    EQUITY_NODES.forEach(node => {
        if (node.delisted || node.bankrupt) return;
        
        // Warning for low-priced stocks
        if (node.currentPrice < BANKRUPTCY_CONFIG.warningThreshold && !node.bankruptcyWarning) {
            node.bankruptcyWarning = true;
            showNotification(`⚠️ DELISTING WARNING: ${node.symbol} trading below $${BANKRUPTCY_CONFIG.warningThreshold}!`);
        }
        
        // Delisting check
        if (node.currentPrice < BANKRUPTCY_CONFIG.delistingPrice) {
            if (Math.random() < BANKRUPTCY_CONFIG.frequency) {
                declareBankruptcy(node);
            }
        }
    });
}

function declareBankruptcy(node) {
    node.bankrupt = true;
    node.delisted = true;
    node.currentPrice = 0;
    
    // Check if player has position
    const position = gameState.activeStrategies.find(s => s.symbol === node.symbol);
    
    if (position) {
        const loss = position.investedCapital;
        showNotification(`💀 BANKRUPTCY: ${node.symbol} has filed for bankruptcy! You lost ${formatCurrency(loss)}!`);
        
        // Remove position
        const index = gameState.activeStrategies.findIndex(s => s.symbol === node.symbol);
        if (index !== -1) {
            gameState.activeStrategies.splice(index, 1);
        }
        
        // Track bankruptcy loss
        gameState.bankruptcyLosses = (gameState.bankruptcyLosses || 0) + loss;
    } else {
        showNotification(`💀 BANKRUPTCY: ${node.symbol} has filed for bankruptcy!`);
    }
    
    if (typeof playSound === 'function') {
        playSound('achievement');
    }
    
    saveState();
}

// ========================================
// REGULATORY EVENTS
// ========================================

function triggerRegulatoryEvent() {
    if (Math.random() < REGULATORY_CONFIG.frequency) {
        const node = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];
        const eventType = REGULATORY_CONFIG.types[Math.floor(Math.random() * REGULATORY_CONFIG.types.length)];

        const impact = eventType.impact.min +
            Math.random() * (eventType.impact.max - eventType.impact.min);

        node.currentPrice *= (1 + impact);

        // Add temporary regulatory effect
        node.regulatoryEvent = {
            type: eventType.type,
            impact,
            endTime: Date.now() + eventType.duration
        };

        const emoji = impact > 0 ? '✅' : '⚠️';
        showNotification(`${emoji} REGULATORY: ${node.symbol} - ${eventType.type}! Stock ${impact > 0 ? 'up' : 'down'} ${(Math.abs(impact) * 100).toFixed(1)}%`);

        if (typeof playSound === 'function') {
            playSound('achievement');
        }

        saveState();
    }
}

function clearExpiredRegulatoryEvents() {
    const now = Date.now();

    EQUITY_NODES.forEach(node => {
        if (node.regulatoryEvent && now >= node.regulatoryEvent.endTime) {
            delete node.regulatoryEvent;
        }
    });
}

// ========================================
// GLOBAL MARKETS & TIME ZONES
// ========================================

function checkMarketHours() {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    // Check if any global market is open
    let anyMarketOpen = false;

    GLOBAL_MARKETS.forEach(market => {
        const isOpen = currentHour >= market.open && currentHour < market.close;

        if (isOpen) {
            anyMarketOpen = true;
        }
    });

    gameState.globalMarketOpen = anyMarketOpen;

    // If no market is open, reduce volatility
    if (!anyMarketOpen && !gameState.marketClosedNotified) {
        showNotification('🌙 All major markets closed. Reduced trading activity.');
        gameState.marketClosedNotified = true;
    } else if (anyMarketOpen && gameState.marketClosedNotified) {
        showNotification('🌅 Markets opening! Trading activity resuming.');
        gameState.marketClosedNotified = false;
    }
}

function getActiveMarkets() {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    return GLOBAL_MARKETS.filter(market => {
        return currentHour >= market.open && currentHour < market.close;
    });
}

// ========================================
// AFTER-HOURS TRADING
// ========================================

function enableAfterHoursTrading() {
    const equity = calculateWealthZoneScore();
    if (equity >= AFTER_HOURS_CONFIG.minEquity) {
        gameState.afterHoursEnabled = true;
        AFTER_HOURS_CONFIG.enabled = true;
        showNotification('🌙 After-Hours Trading Enabled! Trade outside market hours!');
        saveState();
        renderAll();
    } else {
        showNotification(`❌ Need ${formatCurrency(AFTER_HOURS_CONFIG.minEquity)} equity for after-hours trading!`);
    }
}

function isAfterHours() {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    const isPreMarket = currentHour >= AFTER_HOURS_CONFIG.preMarketStart &&
                        currentHour < AFTER_HOURS_CONFIG.preMarketEnd;
    const isAfterHours = currentHour >= AFTER_HOURS_CONFIG.afterHoursStart &&
                         currentHour < AFTER_HOURS_CONFIG.afterHoursEnd;

    return isPreMarket || isAfterHours;
}

function getAfterHoursMultipliers() {
    if (!isAfterHours() || !gameState.afterHoursEnabled) {
        return { volatility: 1, liquidity: 1 };
    }

    return {
        volatility: AFTER_HOURS_CONFIG.volatilityMultiplier,
        liquidity: AFTER_HOURS_CONFIG.liquidityMultiplier
    };
}

// ========================================
// COMMODITIES & BONDS SYSTEMS
// ========================================

function initializeCommodities() {
    if (!gameState.commodities) {
        gameState.commodities = COMMODITIES.map(commodity => ({
            ...commodity,
            currentPrice: commodity.basePrice,
            previousPrice: commodity.basePrice,
            priceHistory: [commodity.basePrice],
            trend: 0
        }));
    }
}

function updateCommodityPrices() {
    if (!gameState.commodities) return;

    gameState.commodities.forEach(commodity => {
        commodity.previousPrice = commodity.currentPrice;

        // Commodities affected by supply/demand and weather
        let volatilityFactor = 0.02; // Base 2%

        if (commodity.volatility === 'extreme') volatilityFactor = 0.05;
        else if (commodity.volatility === 'high') volatilityFactor = 0.03;

        // Random weather events for agricultural commodities
        if ((commodity.symbol === 'WHEAT' || commodity.symbol === 'CORN') && Math.random() < 0.01) {
            const weatherEvent = Math.random() < 0.5 ? 'drought' : 'flood';
            const impact = weatherEvent === 'drought' ? 0.15 : -0.10;
            commodity.currentPrice *= (1 + impact);
            showNotification(`🌾 ${weatherEvent.toUpperCase()} affects ${commodity.symbol}! Price ${impact > 0 ? 'surges' : 'drops'} ${(Math.abs(impact) * 100).toFixed(0)}%`);
        }

        const change = (Math.random() - 0.5) * 2 * volatilityFactor;
        commodity.currentPrice *= (1 + change);
        commodity.currentPrice = Math.max(commodity.currentPrice, commodity.basePrice * 0.3);

        commodity.priceHistory.push(commodity.currentPrice);
        if (commodity.priceHistory.length > 100) {
            commodity.priceHistory.shift();
        }
    });
}

function initializeBonds() {
    if (!gameState.bonds) {
        gameState.bonds = BONDS.map(bond => ({
            ...bond,
            currentPrice: bond.basePrice,
            previousPrice: bond.basePrice,
            priceHistory: [bond.basePrice],
            currentYield: bond.yield
        }));
    }
}

function updateBondPrices() {
    if (!gameState.bonds) return;

    // Bonds move inversely to interest rates
    const interestRateChange = (gameState.economicIndicators?.interestRate || 0.045) - 0.045;

    gameState.bonds.forEach(bond => {
        bond.previousPrice = bond.currentPrice;

        // Inverse relationship with interest rates
        const priceChange = -interestRateChange * 10; // Simplified duration effect
        const volatility = bond.volatility === 'moderate' ? 0.005 : 0.002;
        const randomChange = (Math.random() - 0.5) * 2 * volatility;

        bond.currentPrice *= (1 + priceChange + randomChange);
        bond.currentPrice = Math.max(bond.currentPrice, 50); // Bonds don't go below 50

        // Update yield (inverse to price)
        bond.currentYield = (bond.yield * bond.basePrice) / bond.currentPrice;

        bond.priceHistory.push(bond.currentPrice);
        if (bond.priceHistory.length > 100) {
            bond.priceHistory.shift();
        }
    });
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getAllTradableAssets() {
    const assets = [...EQUITY_NODES];

    if (gameState.cryptoAssets) assets.push(...gameState.cryptoAssets);
    if (gameState.forexPairs) assets.push(...gameState.forexPairs);
    if (gameState.commodities) assets.push(...gameState.commodities);
    if (gameState.bonds) assets.push(...gameState.bonds);

    return assets.filter(a => !a.delisted && !a.bankrupt);
}

function getAssetBySymbol(symbol) {
    const allAssets = getAllTradableAssets();
    return allAssets.find(a => a.symbol === symbol);
}

