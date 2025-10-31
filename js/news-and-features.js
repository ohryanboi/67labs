// ========================================
// NEWS SENTIMENT ANALYSIS SYSTEM
// ========================================

function generateNewsEvent() {
    if (Math.random() < 0.01) { // 1% chance per update
        const node = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];
        const sentimentType = Math.random() < 0.4 ? 'positive' : (Math.random() < 0.7 ? 'negative' : 'neutral');
        const sentiment = NEWS_SENTIMENT[sentimentType];
        
        const headlines = {
            positive: [
                `${node.name} announces breakthrough innovation!`,
                `${node.symbol} reports record quarterly profits!`,
                `${node.name} stock surges on expansion news!`,
                `${node.symbol} secures major partnership deal!`,
                `${node.name} exceeds analyst expectations!`
            ],
            negative: [
                `${node.name} faces lawsuit over practices!`,
                `${node.symbol} reports significant losses!`,
                `${node.name} under investigation by regulators!`,
                `${node.symbol} stock crashes on scandal!`,
                `${node.name} announces layoffs and restructuring!`
            ],
            neutral: [
                `${node.name} announces quarterly earnings report`,
                `${node.symbol} holds shareholder meeting`,
                `${node.name} releases product update`,
                `${node.symbol} issues company statement`,
                `${node.name} schedules investor call`
            ]
        };
        
        const headline = headlines[sentimentType][Math.floor(Math.random() * headlines[sentimentType].length)];
        const impact = sentiment.priceImpact.min + Math.random() * (sentiment.priceImpact.max - sentiment.priceImpact.min);
        
        // Apply news impact
        node.currentPrice *= (1 + impact);
        node.newsImpact = {
            sentiment: sentimentType,
            headline,
            impact,
            endTime: Date.now() + sentiment.duration
        };
        
        // Show notification
        const emoji = sentimentType === 'positive' ? '📈' : (sentimentType === 'negative' ? '📉' : '📰');
        showNotification(`${emoji} NEWS: ${headline}`);
        
        if (typeof playSound === 'function') {
            playSound('achievement');
        }
        
        saveState();
    }
}

function clearExpiredNews() {
    const now = Date.now();
    EQUITY_NODES.forEach(node => {
        if (node.newsImpact && now >= node.newsImpact.endTime) {
            delete node.newsImpact;
        }
    });
}

// ========================================
// STOCK SORTING AND FILTERING
// ========================================

function sortStocks(stocks, sortBy, sortOrder) {
    const sorted = [...stocks].sort((a, b) => {
        let aVal, bVal;
        
        switch(sortBy) {
            case 'symbol':
                aVal = a.symbol;
                bVal = b.symbol;
                break;
            case 'price':
                aVal = a.currentPrice;
                bVal = b.currentPrice;
                break;
            case 'change':
                aVal = ((a.currentPrice - a.previousPrice) / a.previousPrice) * 100;
                bVal = ((b.currentPrice - b.previousPrice) / b.previousPrice) * 100;
                break;
            case 'sector':
                aVal = a.sector;
                bVal = b.sector;
                break;
            default:
                aVal = a.symbol;
                bVal = b.symbol;
        }
        
        if (typeof aVal === 'string') {
            return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        } else {
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
    });
    
    return sorted;
}

function filterStocks(stocks, searchQuery) {
    if (!searchQuery || searchQuery.trim() === '') {
        return stocks;
    }
    
    const query = searchQuery.toLowerCase();
    return stocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query) ||
        stock.sector.toLowerCase().includes(query)
    );
}

// ========================================
// ACHIEVEMENT CHAINS SYSTEM
// ========================================

function checkAchievementChains() {
    if (!gameState.achievementChains) {
        gameState.achievementChains = {};
    }
    
    Object.entries(ACHIEVEMENT_CHAINS).forEach(([chainId, chain]) => {
        if (!gameState.achievementChains[chainId]) {
            gameState.achievementChains[chainId] = { currentStep: 0, completed: [] };
        }
        
        const progress = gameState.achievementChains[chainId];
        const currentStep = chain.steps[progress.currentStep];
        
        if (currentStep && !progress.completed.includes(currentStep.id)) {
            if (currentStep.check()) {
                // Achievement unlocked!
                progress.completed.push(currentStep.id);
                progress.currentStep++;
                
                gameState.rankPoints = (gameState.rankPoints || 0) + currentStep.reward;
                
                showNotification(`🏆 ${currentStep.name} Unlocked! +${currentStep.reward} RP`);
                
                if (typeof playSound === 'function') {
                    playSound('achievement');
                }
                
                if (typeof updateRank === 'function') {
                    updateRank(gameState.rankPoints);
                }
                
                saveState();
            }
        }
    });
}

// ========================================
// BAD LUCK MECHANICS
// ========================================

function checkBadLuckCurse(profit) {
    if (profit >= BAD_LUCK_CONFIG.bigWinThreshold && Math.random() < BAD_LUCK_CONFIG.curseChance) {
        gameState.badLuckCurse = true;
        gameState.badLuckEndTime = Date.now() + BAD_LUCK_CONFIG.curseDuration;
        showNotification('😈 BAD LUCK CURSE! Your next trades will be unlucky!');
        saveState();
    }
}

function applyBadLuckCurse() {
    if (gameState.badLuckCurse && Date.now() < gameState.badLuckEndTime) {
        // Make prices worse for the player
        EQUITY_NODES.forEach(node => {
            if (Math.random() < 0.3) { // 30% chance to affect each stock
                const badChange = -0.05 - Math.random() * 0.10; // -5% to -15%
                node.currentPrice *= (1 + badChange);
            }
        });
    } else if (gameState.badLuckCurse && Date.now() >= gameState.badLuckEndTime) {
        gameState.badLuckCurse = false;
        gameState.badLuckEndTime = null;
        showNotification('✨ Bad luck curse has lifted!');
        saveState();
    }
}

function triggerTradingBan(reason) {
    if (Math.random() < BAD_LUCK_CONFIG.tradingBanChance) {
        gameState.tradingBan = true;
        gameState.tradingBanEndTime = Date.now() + BAD_LUCK_CONFIG.tradingBanDuration;
        showNotification(`🚫 TRADING BAN! ${reason} (3 minutes)`);
        saveState();
    }
}

function checkTradingBan() {
    if (gameState.tradingBan && Date.now() >= gameState.tradingBanEndTime) {
        gameState.tradingBan = false;
        gameState.tradingBanEndTime = null;
        showNotification('✅ Trading ban lifted!');
        saveState();
    }
}

function triggerAccountFreeze() {
    if (Math.random() < BAD_LUCK_CONFIG.accountFreezeChance) {
        gameState.accountFrozen = true;
        gameState.accountFreezeEndTime = Date.now() + BAD_LUCK_CONFIG.accountFreezeDuration;
        showNotification('❄️ ACCOUNT FROZEN! Cannot trade for 5 minutes!');
        saveState();
    }
}

function checkAccountFreeze() {
    if (gameState.accountFrozen && Date.now() >= gameState.accountFreezeEndTime) {
        gameState.accountFrozen = false;
        gameState.accountFreezeEndTime = null;
        showNotification('🔥 Account unfrozen!');
        saveState();
    }
}

// ========================================
// MARGIN TRADING SYSTEM
// ========================================

function enableMarginTrading() {
    const equity = calculateWealthZoneScore();
    if (equity >= MARGIN_CONFIG.minEquity) {
        gameState.marginEnabled = true;
        showNotification('📊 Margin Trading Enabled! Use leverage to amplify gains (and losses)!');
        saveState();
        renderAll();
    } else {
        showNotification(`❌ Need ${formatCurrency(MARGIN_CONFIG.minEquity)} equity to enable margin trading!`);
    }
}

function setLeverage(leverage) {
    if (!gameState.marginEnabled) {
        showNotification('❌ Enable margin trading first!');
        return;
    }
    
    if (MARGIN_CONFIG.leverageOptions.includes(leverage)) {
        gameState.currentLeverage = leverage;
        showNotification(`📊 Leverage set to ${leverage}x`);
        saveState();
        renderAll();
    }
}

function calculateMarginInterest() {
    if (gameState.marginDebt > 0) {
        const interest = gameState.marginDebt * MARGIN_CONFIG.interestRate;
        gameState.marginDebt += interest;
        gameState.digitalReserve -= interest;
        
        // Check for margin call
        checkMarginCall();
    }
}

function checkMarginCall() {
    if (gameState.marginDebt <= 0) return;
    
    const totalEquity = calculateWealthZoneScore();
    const equityRatio = (totalEquity - gameState.marginDebt) / totalEquity;
    
    if (equityRatio <= MARGIN_CONFIG.liquidationThreshold) {
        // LIQUIDATION!
        liquidatePosition();
    } else if (equityRatio <= MARGIN_CONFIG.marginCallThreshold) {
        showNotification('⚠️ MARGIN CALL! Your equity is low! Add funds or close positions!');
    }
}

function liquidatePosition() {
    // Sell all positions
    gameState.activeStrategies.forEach(strategy => {
        if (typeof releaseNode === 'function') {
            releaseNode(strategy.symbol, true); // Force sell
        }
    });
    
    // Pay off debt with remaining cash
    const remaining = gameState.digitalReserve - gameState.marginDebt;
    gameState.digitalReserve = Math.max(0, remaining);
    gameState.marginDebt = Math.max(0, -remaining);
    
    showNotification('💥 LIQUIDATED! All positions sold to cover margin debt!');
    saveState();
    renderAll();
}

