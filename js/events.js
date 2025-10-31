// Market Events, News, and Earnings

// News Events System
function generateNewsEvent() {
    // 2% chance per update
    if (Math.random() > 0.02) return;

    const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
    const node = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];

    const newsEvent = {
        id: Date.now(),
        symbol: node.symbol,
        text: template.text.replace('{symbol}', node.symbol),
        impact: template.impact,
        type: template.type,
        timestamp: Date.now()
    };

    // Apply impact to stock price
    node.currentPrice *= (1 + template.impact);
    node.trend = template.impact > 0 ? 0.5 : -0.5;

    // Add to news queue
    if (!gameState.newsEvents) gameState.newsEvents = [];
    gameState.newsEvents.push(newsEvent);
    
    // Keep only last 10 news items
    if (gameState.newsEvents.length > 10) {
        gameState.newsEvents.shift();
    }

    gameState.currentNews = newsEvent;
    
    showNotification(`📰 ${newsEvent.text}`);
    playSound('achievement');
    
    saveState();
}

// Earnings Reports (quarterly)
function triggerEarningsReport() {
    // 0.5% chance per update
    if (Math.random() > 0.005) return;

    const node = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];
    const beatOrMiss = Math.random() > 0.5;
    
    const newsEvent = {
        id: Date.now(),
        symbol: node.symbol,
        text: beatOrMiss 
            ? `${node.symbol} reports Q${Math.floor(Math.random() * 4) + 1} earnings beat! Revenue up 15%.`
            : `${node.symbol} misses Q${Math.floor(Math.random() * 4) + 1} earnings. Stock tumbles.`,
        impact: beatOrMiss ? 0.18 : -0.15,
        type: beatOrMiss ? 'earnings_beat' : 'earnings_miss',
        timestamp: Date.now()
    };

    // Apply impact
    node.currentPrice *= (1 + newsEvent.impact);
    node.trend = newsEvent.impact > 0 ? 0.7 : -0.7;

    if (!gameState.newsEvents) gameState.newsEvents = [];
    gameState.newsEvents.push(newsEvent);
    
    if (gameState.newsEvents.length > 10) {
        gameState.newsEvents.shift();
    }

    gameState.currentNews = newsEvent;
    
    showNotification(`📊 ${newsEvent.text}`);
    playSound('achievement');
    
    saveState();
}

// Random market events
function triggerRandomMarketEvent() {
    // If event is active, check if it should end
    if (gameState.marketEvent && Date.now() >= gameState.marketEventEndTime) {
        gameState.marketEvent = null;
        gameState.marketEventEndTime = null;
        showNotification('📊 Market event ended');
        saveState();
        return;
    }

    // Don't trigger new event if one is active
    if (gameState.marketEvent) return;

    // 2% chance to trigger event
    if (Math.random() > 0.02) return;

    const events = [
        { name: 'Tech Boom', affectedSectors: ['Technology', 'Software', 'Hardware'], priceImpact: 0.15, duration: 60000 },
        { name: 'Market Crash', affectedSectors: ['all'], priceImpact: -0.20, duration: 40000 },
        { name: 'Energy Crisis', affectedSectors: ['Energy', 'Utilities'], priceImpact: 0.25, duration: 50000 },
        { name: 'Healthcare Breakthrough', affectedSectors: ['Healthcare', 'Biotechnology'], priceImpact: 0.18, duration: 55000 },
        { name: 'Financial Regulation', affectedSectors: ['Finance', 'Banking'], priceImpact: -0.12, duration: 45000 },
        { name: 'Consumer Spending Surge', affectedSectors: ['Retail', 'Consumer Goods'], priceImpact: 0.14, duration: 50000 },
        { name: 'Manufacturing Slowdown', affectedSectors: ['Manufacturing', 'Industrial'], priceImpact: -0.10, duration: 40000 },
        { name: 'Real Estate Boom', affectedSectors: ['Real Estate', 'Construction'], priceImpact: 0.16, duration: 60000 },
        { name: 'Crypto Rally', affectedSectors: ['Technology', 'Finance'], priceImpact: 0.20, duration: 35000 },
        { name: 'Supply Chain Disruption', affectedSectors: ['Manufacturing', 'Retail', 'Transportation'], priceImpact: -0.15, duration: 50000 }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    
    gameState.marketEvent = event;
    gameState.marketEventEndTime = Date.now() + event.duration;

    showNotification(`🌍 Market Event: ${event.name}!`);
    playSound('achievement');
    saveState();
}

// Market Cycle System
function updateMarketCycle() {
    const now = Date.now();

    // Check if current cycle should end
    if (gameState.marketCycleEndTime && now >= gameState.marketCycleEndTime) {
        const oldCycle = gameState.currentMarketCycle;
        gameState.currentMarketCycle = 'neutral';
        gameState.marketCycleEndTime = null;

        if (oldCycle !== 'neutral') {
            showNotification(`📊 ${MARKET_CYCLES[oldCycle].name} ended - Market returning to normal`);
        }

        saveState();
    }

    // Don't trigger new cycle if one is active
    if (gameState.currentMarketCycle !== 'neutral') return;

    // Check for recession trigger (less likely if recent recession)
    const timeSinceRecession = gameState.lastRecessionTime ? now - gameState.lastRecessionTime : Infinity;
    const recessionCooldown = 600000; // 10 minutes

    // Try to trigger a new cycle
    Object.keys(MARKET_CYCLES).forEach(cycleKey => {
        if (cycleKey === 'neutral') return;

        const cycle = MARKET_CYCLES[cycleKey];
        let probability = cycle.probability;

        // Adjust probabilities based on difficulty
        const difficulty = DIFFICULTY_MODES[gameState.difficultyMode || 'easy'];
        if (cycleKey === 'recession' || cycleKey === 'bear') {
            probability *= difficulty.volatilityMultiplier;
        }

        // Reduce recession chance if recent recession
        if (cycleKey === 'recession' && timeSinceRecession < recessionCooldown) {
            probability *= 0.1; // 90% reduction
        }

        // Increase recovery chance after recession
        if (cycleKey === 'recovery' && timeSinceRecession < recessionCooldown) {
            probability *= 3.0; // 3x more likely
        }

        if (Math.random() < probability) {
            gameState.currentMarketCycle = cycleKey;
            gameState.marketCycleEndTime = now + cycle.duration;

            if (cycleKey === 'recession') {
                gameState.lastRecessionTime = now;
                // Apply immediate price drop
                EQUITY_NODES.forEach(node => {
                    const drop = 0.30 + Math.random() * 0.20; // 30-50% drop
                    node.currentPrice *= (1 - drop);
                });
                showNotification(`💔 RECESSION! All stocks crashed ${Math.floor((0.30 + 0.20/2) * 100)}%!`);
            } else {
                showNotification(`${cycle.icon} ${cycle.name} started! ${cycle.description}`);
            }

            playSound('achievement');
            saveState();
        }
    });
}

// Bad Random Events System
function triggerBadEvent() {
    // Check if trading is halted or broker outage is active
    if (gameState.tradingHalted && Date.now() >= gameState.haltEndTime) {
        gameState.tradingHalted = false;
        gameState.haltEndTime = null;
        showNotification('✅ Market halt lifted! Trading resumed.');
        saveState();
    }

    if (gameState.brokerOutage && Date.now() >= gameState.outageEndTime) {
        gameState.brokerOutage = false;
        gameState.outageEndTime = null;
        showNotification('✅ Broker systems restored! Trading resumed.');
        saveState();
    }

    // Don't trigger new bad events if one is already active
    if (gameState.tradingHalted || gameState.brokerOutage) return;

    // Get difficulty multiplier
    const difficulty = DIFFICULTY_MODES[gameState.difficultyMode || 'easy'];
    const eventMultiplier = difficulty.badEventMultiplier || 1.0;

    // Check each bad event
    BAD_EVENTS.forEach(event => {
        const adjustedProbability = event.probability * eventMultiplier;
        if (Math.random() < adjustedProbability) {
            const message = event.execute(gameState);
            showNotification(message);
            playSound('achievement');
            saveState();
            renderAll();
        }
    });

    // Check for stock bankruptcy (nightmare mode only)
    if (difficulty.bankruptcyChance && Math.random() < difficulty.bankruptcyChance) {
        const node = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];
        node.currentPrice = 1; // Stock goes to $1
        node.bankrupt = true;
        showNotification(`💀 BANKRUPTCY! ${node.symbol} has gone bankrupt!`);
        playSound('achievement');
        saveState();
        renderAll();
    }
}

// Stock splits
function triggerStockSplit() {
    // 0.1% chance per update cycle
    if (Math.random() > 0.001) return;
    
    // Pick a random stock with price > $100
    const eligibleNodes = EQUITY_NODES.filter(n => n.currentPrice > 100);
    if (eligibleNodes.length === 0) return;
    
    const node = eligibleNodes[Math.floor(Math.random() * eligibleNodes.length)];
    
    // 2:1 split
    node.currentPrice = node.currentPrice / 2;
    node.basePrice = node.basePrice / 2;
    node.open = node.open / 2;
    node.high = node.high / 2;
    node.low = node.low / 2;
    node.close = node.close / 2;
    
    // Double quantity for all active positions
    gameState.activeStrategies.forEach(strategy => {
        if (strategy.symbol === node.symbol) {
            strategy.quantity *= 2;
        }
    });
    
    // Record split
    if (!gameState.stockSplitHistory) gameState.stockSplitHistory = [];
    gameState.stockSplitHistory.push({
        symbol: node.symbol,
        timestamp: new Date().toISOString(),
        ratio: '2:1'
    });
    
    showNotification(`📊 ${node.symbol} executed a 2:1 stock split!`);
    playSound('achievement');
    saveState();
}

// Dividends
function payDividends() {
    const now = Date.now();
    const lastPayout = gameState.lastDividendPayout || now;
    const hoursSinceLastPayout = (now - lastPayout) / (1000 * 60 * 60);
    
    // Pay dividends every hour
    if (hoursSinceLastPayout >= 1) {
        let totalDividends = 0;
        
        gameState.activeStrategies.forEach(strategy => {
            const node = EQUITY_NODES.find(n => n.symbol === strategy.symbol);
            if (node) {
                // Annual yield / 8760 hours per year
                const hourlyYield = node.dividendYield / 8760;
                let dividend = strategy.investedCapital * hourlyYield;
                
                // Apply dividend boost potion if active
                if (isPotionActive('dividend')) {
                    dividend *= 3; // 3x dividends
                }
                
                totalDividends += dividend;
            }
        });
        
        if (totalDividends > 0) {
            gameState.digitalReserve += totalDividends;
            showNotification(`💰 Dividend payout: ${formatCurrency(totalDividends)}`);
            playSound('profit');
        }
        
        gameState.lastDividendPayout = now;
        saveState();
    }
}

