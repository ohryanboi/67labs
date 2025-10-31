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

