// Advanced Features: Economic Indicators, Sector Correlations, Insider Trading, IPOs, Stock Unlocking

// ========================================
// ECONOMIC INDICATORS
// ========================================

function updateEconomicIndicators() {
    if (!gameState.economicIndicators) {
        gameState.economicIndicators = {
            interestRate: 0.05,
            inflation: 0.03,
            gdpGrowth: 0.03,
            unemployment: 0.04
        };
    }

    // Update each indicator randomly
    Object.keys(ECONOMIC_INDICATORS).forEach(key => {
        const indicator = ECONOMIC_INDICATORS[key];
        if (Math.random() < indicator.changeChance) {
            const change = (Math.random() - 0.5) * 0.01; // ±0.5% change
            gameState.economicIndicators[key] = Math.max(
                indicator.min,
                Math.min(indicator.max, gameState.economicIndicators[key] + change)
            );
        }
    });

    // Apply inflation to cash (reduces value over time)
    const inflationImpact = ECONOMIC_INDICATORS.inflation.cashImpact * gameState.economicIndicators.inflation;
    gameState.digitalReserve *= (1 + inflationImpact);
}

// Apply economic indicators to stock prices
function applyEconomicImpact(node, priceChange) {
    let multiplier = 1.0;

    // Interest rate impact (negative correlation)
    const interestImpact = ECONOMIC_INDICATORS.interestRate.impact * 
        (gameState.economicIndicators.interestRate - 0.05); // Baseline 5%
    multiplier += interestImpact;

    // GDP growth impact (positive correlation)
    const gdpImpact = ECONOMIC_INDICATORS.gdpGrowth.impact * 
        (gameState.economicIndicators.gdpGrowth - 0.03); // Baseline 3%
    multiplier += gdpImpact;

    // Unemployment impact on consumer stocks
    if (node.sector === 'Consumer Goods' || node.sector === 'Retail') {
        const unemploymentImpact = ECONOMIC_INDICATORS.unemployment.consumerImpact * 
            (gameState.economicIndicators.unemployment - 0.04); // Baseline 4%
        multiplier += unemploymentImpact;
    }

    return priceChange * multiplier;
}

// ========================================
// SECTOR CORRELATIONS
// ========================================

function applySectorCorrelation(node, priceChange) {
    const correlation = SECTOR_CORRELATIONS[node.sector] || 0.5;
    
    // Find other stocks in the same sector
    const sectorStocks = EQUITY_NODES.filter(n => n.sector === node.sector && n.symbol !== node.symbol);
    
    // Calculate average sector movement
    let sectorMovement = 0;
    sectorStocks.forEach(stock => {
        const stockChange = (stock.currentPrice - stock.previousPrice) / stock.previousPrice;
        sectorMovement += stockChange;
    });
    
    if (sectorStocks.length > 0) {
        sectorMovement /= sectorStocks.length;
        // Apply correlation - blend individual movement with sector movement
        const correlatedChange = priceChange * (1 - correlation) + (priceChange * sectorMovement * 10) * correlation;
        return correlatedChange;
    }
    
    return priceChange;
}

// Trigger sector-wide crash or boom
function triggerSectorEvent() {
    if (Math.random() < 0.005) { // 0.5% chance
        const sectors = Object.keys(SECTOR_CORRELATIONS);
        const sector = sectors[Math.floor(Math.random() * sectors.length)];
        const isCrash = Math.random() < 0.5;
        const magnitude = 0.10 + Math.random() * 0.20; // 10-30%
        
        EQUITY_NODES.filter(n => n.sector === sector).forEach(node => {
            if (isCrash) {
                node.currentPrice *= (1 - magnitude);
                node.trend = -0.8;
            } else {
                node.currentPrice *= (1 + magnitude);
                node.trend = 0.8;
            }
        });
        
        const icon = isCrash ? '📉' : '📈';
        const action = isCrash ? 'CRASHED' : 'SURGED';
        showNotification(`${icon} ${sector} sector ${action} ${(magnitude * 100).toFixed(0)}%!`);
        playSound('achievement');
    }
}

// ========================================
// INSIDER TRADING
// ========================================

function triggerInsiderTip() {
    // Don't trigger if one is already active
    if (gameState.activeInsiderTip) return;
    
    if (Math.random() < INSIDER_EVENTS.probability) {
        const node = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];
        const willRise = Math.random() < 0.5;
        const magnitude = 0.15 + Math.random() * 0.25; // 15-40% movement
        
        gameState.activeInsiderTip = {
            symbol: node.symbol,
            willRise,
            magnitude,
            acted: false
        };
        gameState.insiderTipEndTime = Date.now() + INSIDER_EVENTS.duration;
        
        const direction = willRise ? 'RISE' : 'FALL';
        const emoji = willRise ? '📈' : '📉';
        showNotification(`🕵️ INSIDER TIP: ${node.symbol} will ${direction} soon! ${emoji} (30s to act)`);
        playSound('achievement');
        saveState();
    }
}

function checkInsiderTipExpiry() {
    if (!gameState.activeInsiderTip) return;
    
    const now = Date.now();
    if (now >= gameState.insiderTipEndTime) {
        // Execute the insider tip
        const tip = gameState.activeInsiderTip;
        const node = EQUITY_NODES.find(n => n.symbol === tip.symbol);
        
        if (node) {
            if (tip.willRise) {
                node.currentPrice *= (1 + tip.magnitude);
                node.trend = 0.9;
            } else {
                node.currentPrice *= (1 - tip.magnitude);
                node.trend = -0.9;
            }
            
            // Check if player acted on it and got caught
            if (tip.acted && Math.random() < INSIDER_EVENTS.penaltyChance) {
                const penalty = INSIDER_EVENTS.penaltyAmount.min + 
                    Math.random() * (INSIDER_EVENTS.penaltyAmount.max - INSIDER_EVENTS.penaltyAmount.min);
                gameState.digitalReserve -= penalty;
                gameState.insiderPenalties = (gameState.insiderPenalties || 0) + 1;
                showNotification(`🚨 CAUGHT! Insider trading penalty: -${formatCurrency(penalty)}`);
                playSound('achievement');
            }
        }
        
        gameState.activeInsiderTip = null;
        gameState.insiderTipEndTime = null;
        saveState();
    }
}

// Mark that player acted on insider tip (called from trading.js)
function actOnInsiderTip(symbol) {
    if (gameState.activeInsiderTip && gameState.activeInsiderTip.symbol === symbol) {
        gameState.activeInsiderTip.acted = true;
    }
}

// ========================================
// STOCK IPOS
// ========================================

function triggerIPO() {
    if (Math.random() < IPO_CONFIG.probability) {
        const sectors = ['Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer Goods', 'Industrial', 'Retail'];
        const sector = sectors[Math.floor(Math.random() * sectors.length)];
        const symbol = 'IPO' + Math.floor(Math.random() * 10000);
        const name = generateIPOName(sector);
        const price = IPO_CONFIG.initialPriceRange.min + 
            Math.random() * (IPO_CONFIG.initialPriceRange.max - IPO_CONFIG.initialPriceRange.min);
        
        const isWinner = Math.random() < IPO_CONFIG.successChance;
        const multiplier = isWinner ?
            IPO_CONFIG.winnerMultiplier.min + Math.random() * (IPO_CONFIG.winnerMultiplier.max - IPO_CONFIG.winnerMultiplier.min) :
            IPO_CONFIG.flopMultiplier.min + Math.random() * (IPO_CONFIG.flopMultiplier.max - IPO_CONFIG.flopMultiplier.min);
        
        const ipo = {
            symbol,
            name,
            sector,
            basePrice: price,
            currentPrice: price,
            previousPrice: price,
            volatility: 'extreme',
            dividendYield: 0.005,
            pulse: 'neutral',
            trend: 0,
            volume: 10000,
            priceHistory: [price],
            volumeHistory: [],
            open: price,
            high: price,
            low: price,
            close: price,
            isIPO: true,
            ipoEndTime: Date.now() + IPO_CONFIG.duration,
            ipoMultiplier: multiplier,
            isWinner
        };
        
        EQUITY_NODES.push(ipo);
        gameState.activeIPOs = gameState.activeIPOs || [];
        gameState.activeIPOs.push(symbol);
        
        showNotification(`🎉 NEW IPO: ${name} (${symbol}) @ ${formatCurrency(price)}!`);
        playSound('achievement');
        saveState();
        renderAll();
    }
}

function updateIPOs() {
    if (!gameState.activeIPOs || gameState.activeIPOs.length === 0) return;
    
    const now = Date.now();
    gameState.activeIPOs = gameState.activeIPOs.filter(symbol => {
        const node = EQUITY_NODES.find(n => n.symbol === symbol);
        if (!node) return false;
        
        if (now >= node.ipoEndTime) {
            // IPO period ended - apply final multiplier
            node.currentPrice = node.basePrice * node.ipoMultiplier;
            node.isIPO = false;
            
            const result = node.isWinner ? 'SUCCESS' : 'FLOP';
            const emoji = node.isWinner ? '🚀' : '💥';
            const change = ((node.ipoMultiplier - 1) * 100).toFixed(0);
            showNotification(`${emoji} IPO ${result}: ${node.symbol} ${change > 0 ? '+' : ''}${change}%!`);
            
            gameState.ipoHistory = gameState.ipoHistory || [];
            gameState.ipoHistory.push({
                symbol,
                result,
                multiplier: node.ipoMultiplier,
                timestamp: now
            });
            
            return false; // Remove from active IPOs
        }
        
        return true;
    });
}

function generateIPOName(sector) {
    const prefixes = ['Mega', 'Ultra', 'Super', 'Hyper', 'Neo', 'Quantum', 'Digital', 'Global', 'Prime', 'Elite'];
    const suffixes = {
        Technology: ['Tech', 'Systems', 'Solutions', 'Labs', 'Innovations'],
        Finance: ['Capital', 'Financial', 'Investments', 'Holdings', 'Group'],
        Healthcare: ['Health', 'Medical', 'Pharma', 'Bio', 'Care'],
        Energy: ['Energy', 'Power', 'Resources', 'Petroleum', 'Gas'],
        'Consumer Goods': ['Consumer', 'Products', 'Brands', 'Goods', 'Retail'],
        Industrial: ['Industrial', 'Manufacturing', 'Engineering', 'Materials', 'Corp'],
        Retail: ['Retail', 'Stores', 'Markets', 'Shopping', 'Commerce']
    };
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[sector][Math.floor(Math.random() * suffixes[sector].length)];
    return `${prefix} ${suffix}`;
}

// ========================================
// STOCK UNLOCKING
// ========================================

function checkStockUnlocks() {
    if (!gameState.unlockedStocks) {
        gameState.unlockedStocks = STOCK_UNLOCK_REQUIREMENTS.initial;
    }
    
    const wealth = calculateWealthZoneScore();
    const rank = gameState.currentRank || 0;
    const trades = gameState.totalTrades || 0;
    
    let newUnlocks = [];
    
    // Check wealth unlocks
    if (wealth >= 100000) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.wealth_100k || []));
    if (wealth >= 500000) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.wealth_500k || []));
    if (wealth >= 1000000) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.wealth_1M || []));
    if (wealth >= 5000000) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.wealth_5M || []));
    if (wealth >= 10000000) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.wealth_10M || []));
    
    // Check rank unlocks
    if (rank >= 5) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.rank_5 || []));
    if (rank >= 10) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.rank_10 || []));
    if (rank >= 15) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.rank_15 || []));
    if (rank >= 20) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.rank_20 || []));
    
    // Check challenge unlocks
    if (trades >= 10) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.challenge_10_trades || []));
    if (trades >= 100) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.challenge_100_trades || []));
    if (trades >= 1000) newUnlocks.push(...(STOCK_UNLOCK_REQUIREMENTS.challenge_1000_trades || []));
    
    // Add new unlocks
    newUnlocks.forEach(symbol => {
        if (!gameState.unlockedStocks.includes(symbol)) {
            gameState.unlockedStocks.push(symbol);
            const node = EQUITY_NODES.find(n => n.symbol === symbol);
            if (node) {
                showNotification(`🔓 NEW STOCK UNLOCKED: ${node.name} (${symbol})!`);
                playSound('achievement');
            }
        }
    });
}

// Check if stock is unlocked
function isStockUnlocked(symbol) {
    if (!gameState.unlockedStocks) {
        gameState.unlockedStocks = STOCK_UNLOCK_REQUIREMENTS.initial;
    }
    return gameState.unlockedStocks.includes(symbol);
}

