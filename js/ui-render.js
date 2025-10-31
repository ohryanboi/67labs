// UI Rendering Functions

// Render status bar for special effects
function renderStatusBar() {
    const statusBar = document.getElementById('statusBar');
    if (!statusBar) return;

    const statuses = [];

    // Check for trading halt
    if (gameState.tradingHalted) {
        const timeLeft = Math.max(0, gameState.haltEndTime - Date.now());
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        statuses.push({ icon: '🚫', text: `MARKET HALT - ${minutes}:${seconds.toString().padStart(2, '0')}`, type: 'bad' });
    }

    // Check for broker outage
    if (gameState.brokerOutage) {
        const timeLeft = Math.max(0, gameState.outageEndTime - Date.now());
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        statuses.push({ icon: '⚠️', text: `BROKER OUTAGE - ${minutes}:${seconds.toString().padStart(2, '0')}`, type: 'bad' });
    }

    // Check for loss protection
    if (gameState.protectedTrades > 0) {
        statuses.push({ icon: '🛡️', text: `Loss Protection: ${gameState.protectedTrades} trades`, type: 'good' });
    }

    // Check for diamond hands
    if (gameState.diamondHandsActive) {
        const timeLeft = Math.max(0, gameState.diamondHandsEndTime - Date.now());
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        statuses.push({ icon: '💎', text: `DIAMOND HANDS - ${minutes}:${seconds.toString().padStart(2, '0')}`, type: 'good' });
    }

    // Check for insider tips
    if (gameState.activeInsiderTip && gameState.insiderTipEndTime) {
        const timeLeft = Math.max(0, gameState.insiderTipEndTime - Date.now());
        const seconds = Math.floor(timeLeft / 1000);
        const direction = gameState.activeInsiderTip.willRise ? '📈 RISE' : '📉 FALL';
        statuses.push({
            icon: '🕵️',
            text: `INSIDER TIP: ${gameState.activeInsiderTip.symbol} will ${direction} (${seconds}s)`,
            type: 'good'
        });
    }

    // Check for market cycles
    const marketCycle = gameState.currentMarketCycle || 'neutral';
    if (marketCycle !== 'neutral' && MARKET_CYCLES[marketCycle]) {
        const cycle = MARKET_CYCLES[marketCycle];
        const timeLeft = Math.max(0, gameState.marketCycleEndTime - Date.now());
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        const cycleType = (marketCycle === 'bull' || marketCycle === 'recovery') ? 'good' : 'bad';
        statuses.push({
            icon: cycle.icon,
            text: `${cycle.name.toUpperCase()} - ${minutes}:${seconds.toString().padStart(2, '0')}`,
            type: cycleType
        });
    }

    // Check for active combos
    if (isComboActive && isComboActive('goldenHour')) {
        statuses.push({ icon: '✨', text: 'GOLDEN HOUR COMBO!', type: 'good' });
    }
    if (isComboActive && isComboActive('perfectStorm')) {
        statuses.push({ icon: '⚡', text: 'PERFECT STORM COMBO!', type: 'good' });
    }
    if (isComboActive && isComboActive('safeHaven')) {
        statuses.push({ icon: '🛡️', text: 'SAFE HAVEN COMBO!', type: 'good' });
    }
    if (isComboActive && isComboActive('marketMaster')) {
        statuses.push({ icon: '👑', text: 'MARKET MASTER COMBO!', type: 'good' });
    }

    if (statuses.length === 0) {
        statusBar.style.display = 'none';
        return;
    }

    statusBar.style.display = 'flex';
    const hasGood = statuses.some(s => s.type === 'good');
    const hasBad = statuses.some(s => s.type === 'bad');

    if (hasGood && !hasBad) {
        statusBar.className = 'status-bar positive';
    } else {
        statusBar.className = 'status-bar';
    }

    statusBar.innerHTML = statuses.map(s => `
        <div class="status-item">
            <span class="status-icon">${s.icon}</span>
            <span>${s.text}</span>
        </div>
    `).join('');
}

// Render stats
function renderStats() {
    const wealthZone = calculateWealthZoneScore();

    // Calculate total performance across all active strategies
    const performanceMetric = gameState.activeStrategies.reduce((sum, s) => sum + s.performanceMetric, 0);
    const performancePercent = ((performanceMetric / STARTER_CAPITAL) * 100).toFixed(2);

    const digitalReserveEl = document.getElementById('digitalReserve');
    const wealthZoneEl = document.getElementById('wealthZoneScore');
    const perfElement = document.getElementById('performanceMetric');
    const totalTradesEl = document.getElementById('totalTrades');
    const currentTierEl = document.getElementById('currentTier');

    if (digitalReserveEl) digitalReserveEl.textContent = formatCurrency(gameState.digitalReserve);
    if (wealthZoneEl) wealthZoneEl.textContent = formatCurrency(wealthZone);

    if (perfElement) {
        perfElement.textContent = formatCurrency(performanceMetric) + ` (${performancePercent}%)`;
        perfElement.className = 'stat-value ' + (performanceMetric >= 0 ? 'positive' : 'negative');
    }

    if (totalTradesEl) totalTradesEl.textContent = gameState.completedCycles.length;

    const tier = TIERS[gameState.currentTier];
    if (currentTierEl) currentTierEl.textContent = `${tier.icon} ${tier.name}`;
}

// Render rank display
function renderRankDisplay() {
    const currentRank = RANKS[gameState.currentRank];
    const nextRank = RANKS[gameState.currentRank + 1];

    // Update small rank display in Progress tab
    const rankIcon = document.getElementById('rankIcon');
    const rankName = document.getElementById('rankName');
    const rankProgress = document.getElementById('rankProgress');
    const rankProgressBar = document.getElementById('rankProgressBar');

    if (rankIcon) rankIcon.textContent = currentRank.icon;
    if (rankName) {
        rankName.textContent = currentRank.name;
        rankName.style.color = currentRank.color;
    }

    if (nextRank) {
        if (rankProgress) {
            rankProgress.textContent = `${gameState.rankPoints} / ${nextRank.pointsRequired} RP`;
        }
        if (rankProgressBar) {
            const progressPercent = (gameState.rankPoints / nextRank.pointsRequired) * 100;
            rankProgressBar.style.width = Math.min(100, progressPercent) + '%';
        }
    } else {
        // Max rank achieved
        if (rankProgress) {
            rankProgress.textContent = `${gameState.rankPoints} RP (MAX RANK)`;
        }
        if (rankProgressBar) {
            rankProgressBar.style.width = '100%';
        }
    }

    // Update large rank display in Ranks tab
    const rankIconLarge = document.getElementById('rankIconLarge');
    const rankNameLarge = document.getElementById('rankNameLarge');
    const rankPointsDisplay = document.getElementById('rankPointsDisplay');

    if (rankIconLarge) rankIconLarge.textContent = currentRank.icon;
    if (rankNameLarge) {
        rankNameLarge.textContent = currentRank.name;
        rankNameLarge.style.color = currentRank.color;
    }
    if (rankPointsDisplay) rankPointsDisplay.textContent = `${gameState.rankPoints} RP`;

    const rankProgressLarge = document.getElementById('rankProgressLarge');
    const rankProgressBarLarge = document.getElementById('rankProgressBarLarge');

    if (nextRank) {
        if (rankProgressLarge) {
            rankProgressLarge.textContent = `${gameState.rankPoints} / ${nextRank.pointsRequired} RP to next rank`;
        }
        if (rankProgressBarLarge) {
            const progressPercent = (gameState.rankPoints / nextRank.pointsRequired) * 100;
            rankProgressBarLarge.style.width = Math.min(100, progressPercent) + '%';
        }
    } else {
        if (rankProgressLarge) rankProgressLarge.textContent = 'MAX RANK ACHIEVED!';
        if (rankProgressBarLarge) rankProgressBarLarge.style.width = '100%';
    }
}

// Render all ranks
function renderAllRanks() {
    const container = document.getElementById('allRanksDisplay');
    if (!container) return;

    let html = '';
    let currentRankGroup = '';

    RANKS.forEach((rank, index) => {
        // Extract rank group name (e.g., "Novice" from "Novice III")
        const rankGroup = rank.name.split(' ')[0];

        // Add group header for new rank groups
        if (rankGroup !== currentRankGroup) {
            if (currentRankGroup !== '') {
                html += '</div>'; // Close previous group
            }
            html += `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: ${rank.color}; margin-bottom: 10px; font-size: 16px;">
                        ${rank.icon} ${rankGroup}
                    </h4>
            `;
            currentRankGroup = rankGroup;
        }

        const isCurrent = index === gameState.currentRank;
        const isUnlocked = gameState.rankPoints >= rank.pointsRequired;
        const cardClass = isCurrent ? 'current' : (isUnlocked ? 'unlocked' : 'locked');

        html += `
            <div class="rank-card ${cardClass}">
                <div class="rank-card-icon">${rank.icon}</div>
                <div class="rank-card-info">
                    <div class="rank-card-name" style="color: ${rank.color};">
                        ${rank.name}
                    </div>
                    <div class="rank-card-requirement">
                        ${rank.pointsRequired.toLocaleString()} RP required
                    </div>
                </div>
                ${isCurrent ? '<div class="rank-card-badge">CURRENT</div>' : ''}
                ${isUnlocked && !isCurrent ? '<div class="rank-card-badge" style="background: rgba(0, 255, 136, 0.3);">✓ UNLOCKED</div>' : ''}
            </div>
        `;
    });

    html += '</div>'; // Close last group
    container.innerHTML = html;
}

// Render tier display
function renderTierDisplay() {
    const tier = TIERS[gameState.currentTier];
    const nextTier = TIERS[gameState.currentTier + 1];
    const wealthZone = calculateWealthZoneScore();

    const container = document.getElementById('tierDisplayContainer');
    if (!container) return;

    let html = `
        <div class="tier-display">
            <div class="tier-icon">${tier.icon}</div>
            <div class="tier-name">${tier.name}</div>
            <div style="color: #888; margin-top: 10px;">Current Wealth: ${formatCurrency(wealthZone)}</div>
    `;

    if (nextTier) {
        const progress = ((wealthZone - tier.threshold) / (nextTier.threshold - tier.threshold)) * 100;
        html += `
            <div style="margin-top: 15px;">
                <div style="color: #888; font-size: 14px; margin-bottom: 5px;">
                    Next Tier: ${nextTier.icon} ${nextTier.name}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(100, progress)}%;"></div>
                </div>
                <div style="color: #888; font-size: 12px; margin-top: 5px;">
                    ${formatCurrency(wealthZone)} / ${formatCurrency(nextTier.threshold)}
                </div>
            </div>
        `;
    } else {
        html += `<div style="color: #ffea00; margin-top: 15px; font-weight: bold;">MAX TIER ACHIEVED!</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Render equity node card
function renderEquityNode(node, isFocused = false) {
    try {
        const priceChange = node.currentPrice - node.previousPrice;
        const priceChangePercent = ((priceChange / node.previousPrice) * 100).toFixed(2);
        const isPositive = priceChange >= 0;

    const pulseColors = {
        'bullish': '#00ff88',
        'bearish': '#ff4444',
        'volatile': '#ff00e5',
        'neutral': '#888'
    };

    const volatilityColors = {
        'low': '#00ff88',
        'moderate': '#ffea00',
        'high': '#ff8800',
        'extreme': '#ff0044'
    };

    // Check for news impact
    let newsBadge = '';
    if (node.newsImpact) {
        const sentiment = node.newsImpact.sentiment;
        const emoji = sentiment === 'positive' ? '📈' : (sentiment === 'negative' ? '📉' : '📰');
        const color = sentiment === 'positive' ? '#00ff88' : (sentiment === 'negative' ? '#ff4444' : '#00f0ff');
        newsBadge = `<div style="position: absolute; top: 10px; right: 10px; background: ${color}; color: #000; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold;">${emoji} NEWS</div>`;
    }

    return `
        <div class="node-card" id="node-${node.symbol}" style="position: relative;">
            ${newsBadge}
            <div class="node-header">
                <div>
                    <div class="node-symbol">${node.symbol}</div>
                    <div class="node-name">${node.name}</div>
                </div>
                <div class="node-sector">${node.sector}</div>
            </div>

            <div class="node-price">
                <div class="price-main">${formatCurrency(node.currentPrice)}</div>
                <div class="price-change ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '▲' : '▼'} ${formatCurrency(Math.abs(priceChange))} (${Math.abs(priceChangePercent)}%)
                </div>
            </div>

            <div class="node-indicators">
                <div class="indicator">
                    <span class="indicator-label">Market Pulse:</span>
                    <span class="indicator-value" style="color: ${pulseColors[node.pulse]};">${node.pulse.toUpperCase()}</span>
                </div>
                <div class="indicator">
                    <span class="indicator-label">Volatility:</span>
                    <span class="indicator-value" style="color: ${volatilityColors[node.volatility]};">${node.volatility.toUpperCase()}</span>
                </div>
            </div>

            <div class="price-chart" style="position: relative;">
                <canvas id="chart-${node.symbol}"></canvas>
                <div class="chart-tooltip" id="tooltip-${node.symbol}"></div>
                <button class="expand-chart-btn" onclick="openExpandedChart('${node.symbol}')" title="Expand Chart">⛶</button>
            </div>

            <div class="node-actions">
                <button class="btn btn-primary chart-btn" onclick="openAcquireModal('${node.symbol}')">Acquire Node</button>
                <button class="btn btn-secondary chart-btn" onclick="setLimitBuy('${node.symbol}')">Limit Buy</button>
            </div>
        </div>
    `;
    } catch (error) {
        console.error('Error rendering node', node.symbol, error);
        return `<div class="node-card"><p>Error rendering ${node.symbol}</p></div>`;
    }
}

// Render trading (all nodes)
function renderTrading() {
    // Use the new asset type system
    if (typeof showAssetType === 'function') {
        const assetType = typeof currentAssetType !== 'undefined' ? currentAssetType : 'stocks';
        showAssetType(assetType);
    } else {
        // Fallback to old system
        const grid = document.getElementById('tradingGrid');
        if (!grid) return;

        const sortBy = gameState.stockSortBy || 'symbol';
        const sortOrder = gameState.stockSortOrder || 'asc';
        const searchQuery = gameState.stockSearchQuery || '';

        let stocks = EQUITY_NODES;
        if (typeof filterStocks === 'function') {
            stocks = filterStocks(stocks, searchQuery);
        }
        if (typeof sortStocks === 'function') {
            stocks = sortStocks(stocks, sortBy, sortOrder);
        }

        grid.innerHTML = stocks.map(node => renderEquityNode(node, false)).join('');

        setTimeout(() => {
            stocks.forEach(node => drawMiniChart(node.symbol));
        }, 10);
    }

    // Update margin display
    updateMarginDisplay();

    // Update sort controls
    updateSortControls();

    // Update advanced trading displays
    if (typeof updateShortPositionsDisplay === 'function') updateShortPositionsDisplay();
    if (typeof updateOptionsDisplay === 'function') updateOptionsDisplay();
}

// Update margin display
function updateMarginDisplay() {
    const debtDisplay = document.getElementById('marginDebtDisplay');
    const leverageSelect = document.getElementById('leverageSelect');

    if (debtDisplay) {
        const debt = gameState.marginDebt || 0;
        debtDisplay.textContent = `Debt: ${formatCurrency(debt)}`;
        debtDisplay.style.color = debt > 0 ? '#ff4444' : '#00ff88';
    }

    if (leverageSelect && gameState.marginEnabled) {
        leverageSelect.value = gameState.currentLeverage || 1;
        leverageSelect.style.borderColor = 'rgba(0, 255, 136, 0.5)';
    }
}

// Update sort controls
function updateSortControls() {
    const sortBySelect = document.getElementById('stockSortBy');
    const sortOrderBtn = document.getElementById('stockSortOrder');

    if (sortBySelect) {
        sortBySelect.value = gameState.stockSortBy || 'symbol';
    }

    if (sortOrderBtn) {
        const order = gameState.stockSortOrder || 'asc';
        sortOrderBtn.textContent = order === 'asc' ? '⬆️ Ascending' : '⬇️ Descending';
    }
}

// Handle stock search
function handleStockSearch(query) {
    gameState.stockSearchQuery = query;
    saveState();
    renderTrading();
}

// Handle stock sort
function handleStockSort() {
    const sortBySelect = document.getElementById('stockSortBy');
    if (sortBySelect) {
        gameState.stockSortBy = sortBySelect.value;
        saveState();
        renderTrading();
    }
}

// Toggle sort order
function toggleSortOrder() {
    gameState.stockSortOrder = (gameState.stockSortOrder === 'asc') ? 'desc' : 'asc';
    saveState();
    renderTrading();
}

// Removed renderFocusStream - feature removed

// Render active strategies
function renderActiveStrategies() {
    const container = document.getElementById('activeStrategies');

    if (gameState.activeStrategies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💼</div>
                <div>No Active Strategies</div>
                <div style="margin-top: 10px; font-size: 14px;">Acquire an Equity Node to start trading</div>
            </div>
        `;
        return;
    }

    container.innerHTML = gameState.activeStrategies.map(strategy => {
        const isPositive = strategy.performanceMetric >= 0;
        return `
            <div class="strategy-card">
                <div class="strategy-header">
                    <div>
                        <div class="node-symbol">${strategy.symbol}</div>
                        <div class="node-name">${strategy.quantity} units @ ${formatCurrency(strategy.purchasePrice)}</div>
                    </div>
                    <button class="btn btn-danger" onclick="releaseNode('${strategy.symbol}')">Release Node</button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 15px;">
                    <div>
                        <div class="stat-label">Current Price</div>
                        <div style="font-size: 18px; font-weight: bold;">${formatCurrency(strategy.currentPrice)}</div>
                    </div>
                    <div>
                        <div class="stat-label">Current Value</div>
                        <div style="font-size: 18px; font-weight: bold;">${formatCurrency(strategy.currentValue)}</div>
                    </div>
                    <div>
                        <div class="stat-label">Performance Metric</div>
                        <div class="${isPositive ? 'positive' : 'negative'}" style="font-size: 18px; font-weight: bold;">
                            ${formatCurrency(strategy.performanceMetric)} (${strategy.performancePercent.toFixed(2)}%)
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-secondary" onclick="setStopLoss('${strategy.symbol}')" style="flex: 1; min-width: 120px;">
                        🛑 Stop Loss
                    </button>
                    <button class="btn btn-secondary" onclick="setTakeProfit('${strategy.symbol}')" style="flex: 1; min-width: 120px;">
                        🎯 Take Profit
                    </button>
                    <button class="btn btn-secondary" onclick="setLimitSell('${strategy.symbol}')" style="flex: 1; min-width: 120px;">
                        📊 Limit Sell
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Render completed cycles
function renderCompletedCycles() {
    const container = document.getElementById('completedCycles');

    if (gameState.completedCycles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div>No Completed Cycles</div>
                <div style="margin-top: 10px; font-size: 14px;">Release an Active Strategy to see your trade history</div>
            </div>
        `;
        return;
    }

    const cycles = [...gameState.completedCycles].reverse();
    container.innerHTML = cycles.map((cycle, index) => {
        const isPositive = cycle.performanceMetric >= 0;
        return `
            <div class="strategy-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div class="node-symbol">${cycle.symbol}</div>
                    <div style="font-size: 12px; color: #888;">Trade #${gameState.completedCycles.length - index}</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; font-size: 14px;">
                    <div>
                        <div class="stat-label">Quantity</div>
                        <div>${cycle.quantity}</div>
                    </div>
                    <div>
                        <div class="stat-label">Buy Price</div>
                        <div>${formatCurrency(cycle.purchasePrice)}</div>
                    </div>
                    <div>
                        <div class="stat-label">Sell Price</div>
                        <div>${formatCurrency(cycle.sellPrice)}</div>
                    </div>
                    <div>
                        <div class="stat-label">Performance</div>
                        <div class="${isPositive ? 'positive' : 'negative'}" style="font-weight: bold;">
                            ${formatCurrency(cycle.performanceMetric)} (${cycle.performancePercent.toFixed(2)}%)
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render milestones
function renderMilestones() {
    const milestonesGrid = document.getElementById('milestonesGrid');
    if (!milestonesGrid) return;

    milestonesGrid.innerHTML = MILESTONES.map(milestone => `
        <div class="milestone-card ${milestone.unlocked ? 'unlocked' : ''}">
            <div class="milestone-icon">${milestone.unlocked ? milestone.icon : '🔒'}</div>
            <div class="milestone-name">${milestone.name}</div>
            <div class="milestone-desc">${milestone.desc}</div>
            ${milestone.unlocked ? '<div style="color: #ffea00; font-weight: bold; margin-top: 10px;">✓ UNLOCKED</div>' : ''}
        </div>
    `).join('');
}

// Render progression tab (combined ranks + progress)
function renderProgression() {
    renderTierDisplay();
    renderRankDisplay();
    renderAllRanks();
    renderMilestones();
}

// Render difficulty selector
function renderDifficultySelector() {
    const container = document.getElementById('difficultySelector');
    if (!container) return;

    const currentMode = gameState.difficultyMode || 'easy';

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            ${Object.entries(DIFFICULTY_MODES).map(([key, mode]) => `
                <div style="background: rgba(0, 0, 0, 0.3); border: 2px solid ${currentMode === key ? '#00ff88' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s;" onclick="changeDifficulty('${key}')">
                    <div style="text-align: center; font-size: 48px; margin-bottom: 10px;">${mode.icon}</div>
                    <div style="color: #fff; font-weight: bold; font-size: 18px; text-align: center; margin-bottom: 10px;">
                        ${mode.name} ${currentMode === key ? '✓' : ''}
                    </div>
                    <div style="color: #888; font-size: 13px; text-align: center; margin-bottom: 15px;">
                        ${mode.description}
                    </div>
                    <div style="color: #00f0ff; font-size: 14px; margin-bottom: 5px;">
                        💰 Start: ${formatCurrency(mode.startingCapital)}
                    </div>
                    <div style="color: #ff8800; font-size: 14px; margin-bottom: 5px;">
                        📊 Volatility: ${(mode.volatilityMultiplier * 100).toFixed(0)}%
                    </div>
                    <div style="color: #ff4444; font-size: 14px; margin-bottom: 5px;">
                        ⚠️ Bad Events: ${(mode.badEventMultiplier * 100).toFixed(0)}%
                    </div>
                    <div style="color: #ffd700; font-size: 14px;">
                        💸 Tax: ${TAX_RATES[mode.taxRate].rate * 100}%
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Change difficulty mode
function changeDifficulty(newMode) {
    if (gameState.difficultyMode === newMode) {
        showNotification('Already on this difficulty!');
        return;
    }

    const mode = DIFFICULTY_MODES[newMode];
    const confirmMsg = `Change to ${mode.name}?\n\n` +
        `This will reset your game progress!\n` +
        `(Prestige data will be kept)\n\n` +
        `New Settings:\n` +
        `💰 Starting Capital: ${formatCurrency(mode.startingCapital)}\n` +
        `📊 Volatility: ${(mode.volatilityMultiplier * 100).toFixed(0)}%\n` +
        `⚠️ Bad Events: ${(mode.badEventMultiplier * 100).toFixed(0)}%\n` +
        `💸 Tax Rate: ${TAX_RATES[mode.taxRate].rate * 100}%`;

    if (!confirm(confirmMsg)) {
        return;
    }

    // Save prestige data
    const prestigeData = {
        prestigeLevel: gameState.prestigeLevel || 0,
        prestigePoints: gameState.prestigePoints || 0,
        totalLifetimeEarnings: gameState.totalLifetimeEarnings || 0,
        unlockedExclusiveStocks: [...(gameState.unlockedExclusiveStocks || [])],
        prestigeBadges: [...(gameState.prestigeBadges || [])],
        prestigeTitles: [...(gameState.prestigeTitles || [])],
        redeemedCodes: [...(gameState.redeemedCodes || [])],
        cheatMenuUnlocked: gameState.cheatMenuUnlocked,
        unlockedStocks: [...(gameState.unlockedStocks || [])]
    };

    // Reset game state (without page reload)
    gameState.digitalReserve = mode.startingCapital;
    gameState.activeStrategies = [];
    gameState.completedCycles = [];
    gameState.focusStream = [];
    gameState.milestones = [];
    gameState.currentTier = 0;
    gameState.tradedSectors = new Set();
    gameState.currentRank = 0;
    gameState.rankPoints = 0;
    gameState.stopLossOrders = [];
    gameState.takeProfitOrders = [];
    gameState.limitBuyOrders = [];
    gameState.limitSellOrders = [];
    gameState.wealthHistory = [];
    gameState.totalWins = 0;
    gameState.totalLosses = 0;
    gameState.bestTrade = null;
    gameState.worstTrade = null;
    gameState.totalHoldTime = 0;
    gameState.profitBySector = {};
    gameState.achievementPoints = 0;
    gameState.secretAchievements = [];
    gameState.newsEvents = [];
    gameState.currentNews = null;
    gameState.potions = {
        speedBoost: 0,
        profitMultiplier: 0,
        luckBoost: 0,
        dividendBoost: 0,
        insiderVision: 0,
        lossProtection: 0,
        timeFreeze: 0,
        volatilityBomb: 0,
        diamondHands: 0,
        marketCrash: 0,
        bullRun: 0
    };
    gameState.activePotions = [];
    gameState.totalTaxesPaid = 0;
    gameState.difficultyMode = newMode;

    // Restore prestige data
    Object.assign(gameState, prestigeData);

    // Reset stock prices
    EQUITY_NODES.forEach(node => {
        node.currentPrice = node.basePrice;
        node.previousPrice = node.basePrice;
        node.priceHistory = [node.basePrice];
        node.volumeHistory = [];
        node.bankrupt = false;
    });

    // Reset milestones
    MILESTONES.forEach(m => m.unlocked = false);
    SECRET_ACHIEVEMENTS.forEach(a => a.unlocked = false);

    showNotification(`✅ Difficulty changed to ${mode.name}!`);
    saveState();
    renderAll();
    renderDifficultySelector();
}

// Render all
function renderAll() {
    renderStats();
    renderStatusBar(); // Render special effects status
    renderNewsTicker();
    renderTrading();
    renderActiveStrategies();
    renderCompletedCycles();
    renderTierDisplay();
    renderRankDisplay();
    renderAllRanks();
    renderMilestones();
    renderDailyChallenge();
    renderMarketEvent();
    renderActiveOrders();
    renderDifficultySelector();

    // Render prestige if on that tab
    const prestigeTab = document.getElementById('prestige');
    if (prestigeTab && prestigeTab.classList.contains('active')) {
        if (typeof renderPrestigeDisplay === 'function') {
            renderPrestigeDisplay();
        }
    }

    // Render analytics if on that tab
    const analyticsTab = document.getElementById('analytics');
    if (analyticsTab && analyticsTab.classList.contains('active')) {
        renderAnalytics();
        renderStatistics();
    }
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    // Find and activate the correct tab button
    const tabButtons = Array.from(document.querySelectorAll('.tab'));
    const activeButton = tabButtons.find(tab => {
        const text = tab.textContent.toLowerCase();
        return text.includes(tabName.toLowerCase().substring(0, 4));
    });
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const tabContent = document.getElementById(tabName);
    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Redraw charts if switching to a tab with charts
    if (tabName === 'trading') {
        setTimeout(() => {
            EQUITY_NODES.forEach(node => {
                if (document.getElementById(`chart-${node.symbol}`)) {
                    drawMiniChart(node.symbol);
                }
            });
        }, 10);
    } else if (tabName === 'analytics') {
        renderAnalytics();
        renderStatistics();
    } else if (tabName === 'achievements') {
        renderAchievements();
    } else if (tabName === 'progression') {
        renderMilestones();
    } else if (tabName === 'shop') {
        renderShop();
        renderCodes();
    } else if (tabName === 'settings') {
        renderSettings();
    } else if (tabName === 'portfolio') {
        renderPortfolio();
        renderOrders();
    } else if (tabName === 'prestige') {
        if (typeof renderPrestigeDisplay === 'function') {
            renderPrestigeDisplay();
        }
    }
}

// Modal functions
function openAcquireModal(symbol) {
    // Find asset in any asset class
    let node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node && typeof getAssetBySymbol === 'function') {
        node = getAssetBySymbol(symbol);
    }

    if (!node) {
        alert('Asset not found!');
        return;
    }

    document.getElementById('modalSymbol').textContent = node.symbol;
    document.getElementById('modalName').textContent = node.name;
    document.getElementById('modalPrice').textContent = formatCurrency(node.currentPrice);
    document.getElementById('quantityInput').value = '1';
    document.getElementById('acquireModal').classList.add('active');
    updateTotalCost();
}

function closeModal() {
    document.getElementById('acquireModal').classList.remove('active');
}

function updateTotalCost() {
    const symbol = document.getElementById('modalSymbol').textContent;

    // Find asset in any asset class
    let node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node && typeof getAssetBySymbol === 'function') {
        node = getAssetBySymbol(symbol);
    }

    if (!node) return;

    const quantity = parseInt(document.getElementById('quantityInput').value) || 0;
    const totalCost = quantity * node.currentPrice;
    document.getElementById('totalCost').textContent = formatCurrency(totalCost);
}

function setQuickQuantity(percent) {
    const symbol = document.getElementById('modalSymbol').textContent;
    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    const maxAffordable = Math.floor(gameState.digitalReserve / node.currentPrice);
    const quantity = Math.floor(maxAffordable * (percent / 100));
    document.getElementById('quantityInput').value = Math.max(1, quantity);
    updateTotalCost();
}

// Toggle expand chart
function toggleExpand(symbol) {
    const card = document.getElementById(`node-${symbol}`);
    card.classList.toggle('expanded');
    setTimeout(() => drawMiniChart(symbol), 10);
}

// Order modal functions
let currentOrderType = '';
let currentOrderSymbol = '';

function openOrderModal(orderType, symbol) {
    currentOrderType = orderType;
    currentOrderSymbol = symbol;

    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    const modal = document.getElementById('orderModal');

    document.getElementById('orderModalSymbol').textContent = symbol;
    document.getElementById('orderModalCurrentPrice').textContent = formatCurrency(node.currentPrice);

    // Set title and label based on order type
    const titles = {
        stopLoss: '🛑 Set Stop Loss',
        takeProfit: '🎯 Set Take Profit',
        limitSell: '📊 Set Limit Sell',
        limitBuy: '📊 Set Limit Buy'
    };

    document.getElementById('orderModalTitle').textContent = titles[orderType];
    document.getElementById('orderModalLabel').textContent = 'Target Price';

    // Show quantity input for limit buy
    const quantityGroup = document.getElementById('orderQuantityGroup');
    if (orderType === 'limitBuy') {
        quantityGroup.style.display = 'block';
    } else {
        quantityGroup.style.display = 'none';
    }

    // Set suggested price
    const priceInput = document.getElementById('orderPriceInput');
    if (orderType === 'stopLoss') {
        priceInput.value = (node.currentPrice * 0.95).toFixed(2); // 5% below
    } else if (orderType === 'takeProfit' || orderType === 'limitSell') {
        priceInput.value = (node.currentPrice * 1.05).toFixed(2); // 5% above
    } else if (orderType === 'limitBuy') {
        priceInput.value = (node.currentPrice * 0.95).toFixed(2); // 5% below
    }

    modal.classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

function submitOrder() {
    const targetPrice = parseFloat(document.getElementById('orderPriceInput').value);

    if (isNaN(targetPrice) || targetPrice <= 0) {
        alert('Please enter a valid price!');
        return;
    }

    if (currentOrderType === 'stopLoss') {
        addStopLoss(currentOrderSymbol, targetPrice);
    } else if (currentOrderType === 'takeProfit') {
        addTakeProfit(currentOrderSymbol, targetPrice);
    } else if (currentOrderType === 'limitSell') {
        addLimitSell(currentOrderSymbol, targetPrice);
    } else if (currentOrderType === 'limitBuy') {
        const quantity = parseInt(document.getElementById('orderQuantityInput').value);
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid quantity!');
            return;
        }
        addLimitBuy(currentOrderSymbol, targetPrice, quantity);
    }

    closeOrderModal();
}

// Render daily challenge
function renderDailyChallenge() {
    const container = document.getElementById('dailyChallengeContainer');
    if (!container) return;

    if (!gameState.dailyChallenge) {
        container.innerHTML = '';
        return;
    }

    const challenge = gameState.dailyChallenge;
    const progress = gameState.dailyChallengeProgress || 0;
    const progressPercent = Math.min(100, (progress / challenge.target) * 100);

    container.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(176, 0, 255, 0.1)); border: 2px solid ${challenge.completed ? '#00ff88' : '#00f0ff'}; border-radius: 12px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                    <div style="font-size: 20px; font-weight: bold; color: #00f0ff; margin-bottom: 5px;">
                        ${challenge.completed ? '✅' : '🎯'} Daily Challenge: ${challenge.name}
                    </div>
                    <div style="color: #888; font-size: 14px;">${challenge.description}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 24px; font-weight: bold; color: ${challenge.completed ? '#00ff88' : '#00f0ff'};">
                        +${challenge.reward} RP
                    </div>
                    <div style="color: #888; font-size: 12px;">Reward</div>
                </div>
            </div>
            <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="color: #888;">Progress</span>
                    <span style="color: #00f0ff; font-weight: bold;">${progress.toFixed(0)} / ${challenge.target}</span>
                </div>
                <div class="progress-bar" style="height: 12px;">
                    <div class="progress-fill" style="width: ${progressPercent}%; background: linear-gradient(90deg, #00f0ff, #b000ff);"></div>
                </div>
            </div>
            ${challenge.completed ? '<div style="color: #00ff88; text-align: center; font-weight: bold; margin-top: 10px;">🎉 COMPLETED! 🎉</div>' : ''}
        </div>
    `;
}

// Render market event
function renderMarketEvent() {
    const container = document.getElementById('marketEventContainer');
    if (!container) return;

    if (!gameState.marketEvent) {
        container.innerHTML = '';
        return;
    }

    const event = gameState.marketEvent;
    const timeLeft = Math.max(0, gameState.marketEventEndTime - Date.now());
    const secondsLeft = Math.floor(timeLeft / 1000);

    container.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 136, 0, 0.1)); border: 2px solid #ff8800; border-radius: 12px; padding: 20px; animation: pulse 2s infinite;">
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #ff8800; margin-bottom: 10px;">
                    🚨 MARKET EVENT: ${event.name}
                </div>
                <div style="color: #fff; font-size: 16px; margin-bottom: 10px;">
                    ${event.description}
                </div>
                <div style="color: #888; font-size: 14px; margin-bottom: 10px;">
                    Affected Sectors: ${event.affectedSectors.join(', ')}
                </div>
                <div style="color: ${event.priceImpact > 0 ? '#00ff88' : '#ff4444'}; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                    Price Impact: ${event.priceImpact > 0 ? '+' : ''}${(event.priceImpact * 100).toFixed(1)}%
                </div>
                <div style="color: #00f0ff; font-size: 14px;">
                    ⏱️ Time Remaining: ${secondsLeft}s
                </div>
            </div>
        </div>
    `;
}

// Render active orders
function renderActiveOrders() {
    const container = document.getElementById('activeOrders');
    if (!container) return;

    const allOrders = [
        ...gameState.stopLossOrders.map(o => ({ ...o, type: 'Stop Loss', color: '#ff4444' })),
        ...gameState.takeProfitOrders.map(o => ({ ...o, type: 'Take Profit', color: '#00ff88' })),
        ...gameState.limitBuyOrders.map(o => ({ ...o, type: 'Limit Buy', color: '#00f0ff' })),
        ...gameState.limitSellOrders.map(o => ({ ...o, type: 'Limit Sell', color: '#b000ff' }))
    ];

    if (allOrders.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">No active orders</div>';
        return;
    }

    container.innerHTML = allOrders.map((order, index) => {
        const node = EQUITY_NODES.find(n => n.symbol === order.symbol);
        const currentPrice = node ? node.currentPrice : 0;
        const distance = ((order.targetPrice - currentPrice) / currentPrice) * 100;

        return `
            <div style="background: rgba(0, 0, 0, 0.3); border-left: 4px solid ${order.color}; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 18px; font-weight: bold; color: ${order.color}; margin-bottom: 5px;">
                            ${order.type}: ${order.symbol}
                        </div>
                        <div style="color: #888; font-size: 14px;">
                            Target: ${formatCurrency(order.targetPrice)}
                            ${order.quantity ? `| Quantity: ${order.quantity}` : ''}
                        </div>
                        <div style="color: #888; font-size: 12px; margin-top: 5px;">
                            Current: ${formatCurrency(currentPrice)}
                            (${distance > 0 ? '+' : ''}${distance.toFixed(2)}% away)
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="cancelOrder('${order.type.toLowerCase().replace(' ', '')}', ${index})" style="padding: 8px 16px;">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Render analytics charts
function renderAnalytics() {
    setTimeout(() => {
        drawPortfolioPerformanceChart('portfolioPerformanceChart');
        drawSectorPerformanceChart('sectorPerformanceChart');
    }, 100);
}

// Render statistics
function renderStatistics() {
    const container = document.getElementById('statisticsContainer');
    if (!container) return;

    const winRate = getWinRate();
    const winLossRatio = getWinLossRatio();
    const avgHoldTime = getAverageHoldTime();
    const sectorProfits = getProfitBySectorSorted();

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div class="stat-card">
                <div class="stat-label">Win/Loss Ratio</div>
                <div class="stat-value" style="color: #00ff88;">${winLossRatio}</div>
                <div class="stat-sublabel">${gameState.totalWins || 0} wins / ${gameState.totalLosses || 0} losses</div>
            </div>

            <div class="stat-card">
                <div class="stat-label">Win Rate</div>
                <div class="stat-value" style="color: ${winRate >= 50 ? '#00ff88' : '#ff4444'};">${winRate}%</div>
                <div class="stat-sublabel">${gameState.totalWins || 0} / ${(gameState.totalWins || 0) + (gameState.totalLosses || 0)} trades</div>
            </div>

            <div class="stat-card">
                <div class="stat-label">Average Hold Time</div>
                <div class="stat-value" style="color: #00f0ff;">${avgHoldTime}</div>
                <div class="stat-sublabel">${gameState.completedCycles.length} total trades</div>
            </div>

            <div class="stat-card">
                <div class="stat-label">Login Streak</div>
                <div class="stat-value" style="color: #ffea00;">🔥 ${gameState.loginStreak || 0} days</div>
                <div class="stat-sublabel">Keep it going!</div>
            </div>
        </div>

        <div style="margin-bottom: 30px;">
            <h3 style="color: #00f0ff; margin-bottom: 15px;">🏆 Best & Worst Trades</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div class="strategy-card" style="background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 240, 255, 0.1));">
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                        <div style="font-size: 14px; color: #888; margin-bottom: 10px;">BEST TRADE</div>
                        ${gameState.bestTrade ? `
                            <div style="font-size: 24px; font-weight: bold; color: #00ff88; margin-bottom: 5px;">
                                ${formatCurrency(gameState.bestTrade.profit)}
                            </div>
                            <div style="color: #00ff88; margin-bottom: 10px;">
                                +${gameState.bestTrade.percent.toFixed(2)}%
                            </div>
                            <div style="font-size: 18px; color: #00f0ff; margin-bottom: 5px;">
                                ${gameState.bestTrade.symbol}
                            </div>
                            <div style="font-size: 12px; color: #888;">
                                ${new Date(gameState.bestTrade.timestamp).toLocaleDateString()}
                            </div>
                        ` : `
                            <div style="color: #888;">No trades yet</div>
                        `}
                    </div>
                </div>

                <div class="strategy-card" style="background: linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 0, 229, 0.1));">
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">💔</div>
                        <div style="font-size: 14px; color: #888; margin-bottom: 10px;">WORST TRADE</div>
                        ${gameState.worstTrade ? `
                            <div style="font-size: 24px; font-weight: bold; color: #ff4444; margin-bottom: 5px;">
                                ${formatCurrency(gameState.worstTrade.loss)}
                            </div>
                            <div style="color: #ff4444; margin-bottom: 10px;">
                                ${gameState.worstTrade.percent.toFixed(2)}%
                            </div>
                            <div style="font-size: 18px; color: #00f0ff; margin-bottom: 5px;">
                                ${gameState.worstTrade.symbol}
                            </div>
                            <div style="font-size: 12px; color: #888;">
                                ${new Date(gameState.worstTrade.timestamp).toLocaleDateString()}
                            </div>
                        ` : `
                            <div style="color: #888;">No trades yet</div>
                        `}
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h3 style="color: #00f0ff; margin-bottom: 15px;">💰 Profit by Sector</h3>
            <div style="display: grid; gap: 10px;">
                ${sectorProfits.length > 0 ? sectorProfits.map(({ sector, profit }) => {
                    const isPositive = profit >= 0;
                    return `
                        <div class="strategy-card" style="padding: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-weight: bold; color: #00f0ff;">${sector}</div>
                                <div class="${isPositive ? 'positive' : 'negative'}" style="font-size: 18px; font-weight: bold;">
                                    ${formatCurrency(profit)}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div style="text-align: center; color: #888; padding: 40px;">
                        No sector data yet. Start trading to see your sector performance!
                    </div>
                `}
            </div>
        </div>
    `;
}

// Render achievements
function renderAchievements() {
    const container = document.getElementById('achievementsContainer');
    if (!container) return;

    const unlockedSecrets = gameState.secretAchievements || [];
    const totalAP = gameState.achievementPoints || 0;

    // Group milestones by tier
    const milestoneTiers = {
        bronze: MILESTONES.filter((_, i) => i < 11),
        silver: MILESTONES.filter((_, i) => i >= 11 && i < 22),
        gold: MILESTONES.filter((_, i) => i >= 22)
    };

    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
            <div style="font-size: 32px; font-weight: bold; color: #ffea00; margin-bottom: 5px;">
                ${totalAP} AP
            </div>
            <div style="color: #888;">Achievement Points</div>
        </div>

        <div style="margin-bottom: 30px;">
            <h3 style="color: #00f0ff; margin-bottom: 15px;">🎯 Secret Achievements</h3>
            <div style="color: #888; margin-bottom: 15px; text-align: center;">
                ${unlockedSecrets.length} / ${SECRET_ACHIEVEMENTS.length} Discovered
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
                ${SECRET_ACHIEVEMENTS.map(achievement => {
                    const unlocked = unlockedSecrets.includes(achievement.id);
                    return `
                        <div class="strategy-card" style="opacity: ${unlocked ? '1' : '0.4'}; ${unlocked ? 'background: linear-gradient(135deg, rgba(255, 234, 0, 0.1), rgba(255, 136, 0, 0.1));' : ''}">
                            <div style="text-align: center;">
                                <div style="font-size: 36px; margin-bottom: 10px;">${unlocked ? achievement.icon : '🔒'}</div>
                                <div style="font-weight: bold; color: ${unlocked ? '#ffea00' : '#666'}; margin-bottom: 5px;">
                                    ${unlocked ? achievement.name : '???'}
                                </div>
                                <div style="font-size: 12px; color: #888; margin-bottom: 10px;">
                                    ${unlocked ? achievement.description : 'Secret achievement - discover it!'}
                                </div>
                                <div style="color: ${unlocked ? '#ffea00' : '#666'}; font-weight: bold;">
                                    ${unlocked ? `+${achievement.points} AP` : '???'}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div>
            <h3 style="color: #00f0ff; margin-bottom: 15px;">🎖️ Milestone Achievements</h3>

            <div style="margin-bottom: 20px;">
                <h4 style="color: #cd7f32; margin-bottom: 10px;">🥉 Bronze Tier</h4>
                <div style="display: grid; gap: 10px;">
                    ${milestoneTiers.bronze.map(m => `
                        <div class="strategy-card" style="padding: 15px; opacity: ${m.unlocked ? '1' : '0.5'};">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: bold; color: ${m.unlocked ? '#00f0ff' : '#666'};">${m.name}</div>
                                    <div style="font-size: 12px; color: #888;">${m.description}</div>
                                </div>
                                <div style="font-size: 24px;">${m.unlocked ? '✅' : '🔒'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h4 style="color: #c0c0c0; margin-bottom: 10px;">🥈 Silver Tier</h4>
                <div style="display: grid; gap: 10px;">
                    ${milestoneTiers.silver.map(m => `
                        <div class="strategy-card" style="padding: 15px; opacity: ${m.unlocked ? '1' : '0.5'};">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: bold; color: ${m.unlocked ? '#00f0ff' : '#666'};">${m.name}</div>
                                    <div style="font-size: 12px; color: #888;">${m.description}</div>
                                </div>
                                <div style="font-size: 24px;">${m.unlocked ? '✅' : '🔒'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div>
                <h4 style="color: #ffd700; margin-bottom: 10px;">🥇 Gold Tier</h4>
                <div style="display: grid; gap: 10px;">
                    ${milestoneTiers.gold.map(m => `
                        <div class="strategy-card" style="padding: 15px; opacity: ${m.unlocked ? '1' : '0.5'};">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: bold; color: ${m.unlocked ? '#00f0ff' : '#666'};">${m.name}</div>
                                    <div style="font-size: 12px; color: #888;">${m.description}</div>
                                </div>
                                <div style="font-size: 24px;">${m.unlocked ? '✅' : '🔒'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Render settings
function renderSettings() {
    const container = document.getElementById('settingsContainer');
    if (!container) return;

    const currentTheme = gameState.currentTheme || 'default';
    const soundEnabled = gameState.soundEnabled !== false;
    const unlockedThemes = gameState.unlockedThemes || ['default'];
    const unlockedBadges = gameState.unlockedBadges || [];
    const activeBadge = gameState.activeBadge;
    const activeTitle = gameState.activeTitle;

    container.innerHTML = `
        <!-- Display Settings -->
        <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #00f0ff; margin-bottom: 15px;">🎨 Display Settings</h3>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="darkModeToggle" ${gameState.darkMode !== false ? 'checked' : ''} onchange="toggleDarkMode()" style="width: 20px; height: 20px; cursor: pointer;">
                    <span style="color: #fff;">🌙 Dark Mode (Press 'D' to toggle)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="compactViewToggle" ${gameState.viewMode === 'compact' ? 'checked' : ''} onchange="toggleViewMode()" style="width: 20px; height: 20px; cursor: pointer;">
                    <span style="color: #fff;">� Compact View (Press 'C' to toggle)</span>
                </label>
            </div>
        </div>

        <!-- Sound Settings -->
        <div style="background: rgba(176, 0, 255, 0.05); border: 1px solid rgba(176, 0, 255, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #b000ff; margin-bottom: 15px;">�🔊 Sound Effects</h3>
            <div style="display: flex; align-items: center; gap: 15px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="soundToggle" ${soundEnabled ? 'checked' : ''} onchange="toggleSound()" style="width: 20px; height: 20px; cursor: pointer;">
                    <span style="color: #fff;">Enable sound effects (trade sounds, profit/loss alerts)</span>
                </label>
            </div>
        </div>

        <!-- Keyboard Shortcuts -->
        <div style="background: rgba(0, 255, 136, 0.05); border: 1px solid rgba(0, 255, 136, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #00ff88; margin-bottom: 15px;">⌨️ Keyboard Shortcuts</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; color: #888; font-size: 13px;">
                <div><kbd style="background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 4px; color: #00f0ff;">Ctrl+1-0</kbd> Switch tabs</div>
                <div><kbd style="background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 4px; color: #00f0ff;">D</kbd> Toggle dark/light mode</div>
                <div><kbd style="background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 4px; color: #00f0ff;">C</kbd> Toggle compact view</div>
                <div><kbd style="background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 4px; color: #00f0ff;">Space</kbd> Pause/Resume</div>
                <div><kbd style="background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 4px; color: #00f0ff;">Esc</kbd> Close modal</div>
            </div>
        </div>

        <!-- Themes -->
        <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #00f0ff; margin-bottom: 15px;">🎨 Themes</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${Object.entries(THEMES).map(([key, theme]) => {
                    const isUnlocked = unlockedThemes.includes(key);
                    const isActive = currentTheme === key;
                    return `
                        <div style="
                            background: ${isActive ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(176, 0, 255, 0.2))' : 'rgba(0, 0, 0, 0.3)'};
                            border: 2px solid ${isActive ? '#00f0ff' : (isUnlocked ? 'rgba(0, 240, 255, 0.3)' : 'rgba(100, 100, 100, 0.3)')};
                            border-radius: 12px;
                            padding: 15px;
                            text-align: center;
                            opacity: ${isUnlocked ? '1' : '0.5'};
                            cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                        " onclick="${isUnlocked ? `applyTheme('${key}')` : ''}">
                            <div style="font-size: 32px; margin-bottom: 10px;">${isUnlocked ? theme.icon : '🔒'}</div>
                            <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">${theme.name}</div>
                            <div style="color: #888; font-size: 12px;">${isUnlocked ? (isActive ? '✓ Active' : 'Click to apply') : theme.unlockCondition}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Badges & Titles -->
        <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #00f0ff; margin-bottom: 15px;">🏅 Badges & Titles</h3>

            <!-- Active Badge/Title Display -->
            <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <div style="color: #888; font-size: 12px; margin-bottom: 10px;">CURRENTLY EQUIPPED</div>
                <div style="font-size: 24px; margin-bottom: 5px;">${activeBadge ? BADGES.find(b => b.id === activeBadge)?.icon : '—'}</div>
                <div style="color: #00f0ff; font-weight: bold;">${activeTitle ? TITLES.find(t => t.id === activeTitle)?.name : 'No Title'}</div>
            </div>

            <!-- Badges Grid -->
            <div style="margin-bottom: 20px;">
                <h4 style="color: #00ff88; margin-bottom: 10px;">Badges</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">
                    ${BADGES.map(badge => {
                        const isUnlocked = unlockedBadges.includes(badge.id);
                        const isActive = activeBadge === badge.id;
                        return `
                            <div style="
                                background: ${isActive ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(176, 0, 255, 0.2))' : 'rgba(0, 0, 0, 0.3)'};
                                border: 1px solid ${isActive ? '#00f0ff' : 'rgba(100, 100, 100, 0.3)'};
                                border-radius: 8px;
                                padding: 10px;
                                text-align: center;
                                opacity: ${isUnlocked ? '1' : '0.4'};
                                cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                            " onclick="${isUnlocked ? `equipBadge('${badge.id}')` : ''}" title="${badge.condition}">
                                <div style="font-size: 24px; margin-bottom: 5px;">${isUnlocked ? badge.icon : '🔒'}</div>
                                <div style="color: #fff; font-size: 11px;">${badge.name}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Titles List -->
            <div>
                <h4 style="color: #00ff88; margin-bottom: 10px;">Titles</h4>
                <div style="display: grid; gap: 8px;">
                    ${TITLES.map(title => {
                        const isUnlocked = unlockedBadges.includes(title.id); // Titles use same unlock system
                        const isActive = activeTitle === title.id;
                        return `
                            <div style="
                                background: ${isActive ? 'linear-gradient(90deg, rgba(0, 240, 255, 0.2), rgba(176, 0, 255, 0.2))' : 'rgba(0, 0, 0, 0.3)'};
                                border: 1px solid ${isActive ? '#00f0ff' : 'rgba(100, 100, 100, 0.3)'};
                                border-radius: 8px;
                                padding: 10px 15px;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                opacity: ${isUnlocked ? '1' : '0.4'};
                                cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                            " onclick="${isUnlocked ? `equipTitle('${title.id}')` : ''}">
                                <div>
                                    <span style="color: ${isUnlocked ? '#00f0ff' : '#666'}; font-weight: bold;">${title.name}</span>
                                    <span style="color: #888; font-size: 11px; margin-left: 10px;">${title.condition}</span>
                                </div>
                                <div style="color: ${isActive ? '#00ff88' : '#666'};">${isActive ? '✓ Equipped' : (isUnlocked ? 'Click to equip' : '🔒')}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>

        <!-- Update Log -->
        <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #00f0ff; margin-bottom: 15px;">📝 Update Log</h3>
            <div style="display: flex; align-items: center; gap: 15px;">
                <button class="btn btn-primary" onclick="showUpdateLog()" style="padding: 10px 20px;">
                    📋 View Update Log
                </button>
                <div style="color: #888; font-size: 13px;">
                    Current Version: <span style="color: #00f0ff;">v${UPDATE_LOG.version}</span>
                </div>
            </div>
        </div>

        <!-- Danger Zone -->
        <div style="background: rgba(255, 0, 0, 0.1); border: 2px solid rgba(255, 0, 0, 0.5); border-radius: 12px; padding: 25px;">
            <h3 style="color: #ff4444; margin-bottom: 15px; font-size: 20px;">⚠️ DANGER ZONE ⚠️</h3>
            <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <div style="color: #ff8888; font-size: 14px; margin-bottom: 10px; font-weight: bold;">
                    ⚠️ WARNING: This action is PERMANENT and IRREVERSIBLE!
                </div>
                <div style="color: #aaa; font-size: 13px; line-height: 1.6;">
                    Clicking this button will permanently delete:
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>All your money and investments</li>
                        <li>All ranks, achievements, and milestones</li>
                        <li>All unlocked themes, badges, and titles</li>
                        <li>All potions, codes, and cheat menu access</li>
                        <li>All trading history and statistics</li>
                    </ul>
                    You will start completely fresh with $100,000.
                </div>
            </div>
            <button
                class="btn btn-danger"
                onclick="resetGame()"
                style="background: #ff4444; color: #fff; padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; width: 100%; transition: all 0.3s;"
                onmouseover="this.style.background='#ff0000'"
                onmouseout="this.style.background='#ff4444'"
            >
                🔄 WIPE ALL DATA & RESET GAME
            </button>
        </div>
    `;
}

// Render news ticker
function renderNewsTicker() {
    const ticker = document.getElementById('newsTicker');
    if (!ticker) return;

    const newsEvents = gameState.newsEvents || [];

    if (newsEvents.length === 0) {
        ticker.innerHTML = `
            <div style="text-align: center; color: #888; font-size: 14px;">
                📰 No recent news events
            </div>
        `;
        return;
    }

    // Duplicate news items for seamless scrolling
    const newsItems = [...newsEvents, ...newsEvents];

    ticker.innerHTML = `
        <div class="news-ticker-content">
            ${newsItems.map(news => `
                <div class="news-item">
                    <span class="news-icon">${news.impact > 0 ? '📈' : '📉'}</span>
                    <span class="news-text ${news.impact > 0 ? 'news-positive' : 'news-negative'}">
                        ${news.text}
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

// Render shop
function renderShop() {
    const container = document.getElementById('shopContainer');
    if (!container) return;

    const potions = gameState.potions || { speedBoost: 0, profitMultiplier: 0, luckBoost: 0, dividendBoost: 0 };
    const activePotions = gameState.activePotions || [];

    const hasExpired = activePotions.some(p => p.expired);

    container.innerHTML = `
        <!-- Active Potions -->
        ${activePotions.length > 0 ? `
            <div style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="color: #00f0ff; margin: 0;">⏰ Active Potions</h3>
                    ${hasExpired ? `
                        <button class="btn btn-danger" onclick="clearExpiredPotions()" style="padding: 8px 16px; font-size: 13px;">
                            🗑️ Clear Expired
                        </button>
                    ` : ''}
                </div>
                <div style="display: grid; gap: 10px;">
                    ${activePotions.map(potion => {
                        const potionData = POTIONS[potion.type];
                        const timeLeft = Math.max(0, potion.endTime - Date.now());
                        const minutes = Math.floor(timeLeft / 60000);
                        const seconds = Math.floor((timeLeft % 60000) / 1000);
                        const isExpired = potion.expired || timeLeft === 0;
                        return `
                            <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center; ${isExpired ? 'opacity: 0.5; border: 1px solid rgba(255, 0, 0, 0.3);' : ''}">
                                <div>
                                    <span style="font-size: 24px; margin-right: 10px;">${potionData.icon}</span>
                                    <span style="color: ${isExpired ? '#888' : '#fff'}; font-weight: bold;">${potionData.name}</span>
                                </div>
                                <div style="color: ${isExpired ? '#ff4444' : '#00ff88'}; font-weight: bold;">
                                    ${isExpired ? 'EXPIRED' : `${minutes}:${seconds.toString().padStart(2, '0')}`}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}

        <!-- Potion Inventory -->
        <div style="background: rgba(176, 0, 255, 0.1); border: 1px solid rgba(176, 0, 255, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #b000ff; margin-bottom: 15px;">🎒 Your Inventory</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${Object.entries(POTIONS).map(([key, potion]) => `
                    <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 10px;">${potion.icon}</div>
                        <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">${potion.name}</div>
                        <div style="color: #888; font-size: 12px; margin-bottom: 10px;">Owned: ${potions[key] || 0}</div>
                        <button
                            class="btn btn-primary"
                            onclick="usePotion('${key}')"
                            ${(potions[key] || 0) === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                        >
                            Use Potion
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Shop -->
        <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 12px; padding: 20px;">
            <h3 style="color: #00f0ff; margin-bottom: 15px;">🛒 Buy Potions</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                ${Object.entries(POTIONS).map(([key, potion]) => `
                    <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 12px; padding: 20px;">
                        <div style="text-align: center; font-size: 48px; margin-bottom: 15px;">${potion.icon}</div>
                        <div style="color: #fff; font-weight: bold; font-size: 16px; margin-bottom: 10px; text-align: center;">${potion.name}</div>
                        <div style="color: #888; font-size: 13px; margin-bottom: 15px; text-align: center; min-height: 40px;">${potion.description}</div>
                        <div style="color: #00ff88; font-weight: bold; font-size: 18px; margin-bottom: 15px; text-align: center;">${formatCurrency(potion.price)}</div>
                        <button
                            class="btn btn-success"
                            onclick="buyPotion('${key}')"
                            style="width: 100%;"
                        >
                            Purchase
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render codes
function renderCodes() {
    const container = document.getElementById('codesContainer');
    if (!container) return;

    const redeemedCodes = gameState.redeemedCodes || [];

    container.innerHTML = `
        <!-- Code Input -->
        <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center;">
            <h3 style="color: #00f0ff; margin-bottom: 20px;">🎁 Enter Redeem Code</h3>
            <div style="display: flex; gap: 15px; max-width: 500px; margin: 0 auto;">
                <input
                    type="text"
                    id="codeInput"
                    placeholder="Enter code here..."
                    style="flex: 1; padding: 12px 20px; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 8px; color: #fff; font-size: 16px;"
                    onkeypress="if(event.key === 'Enter') redeemCode()"
                >
                <button class="btn btn-primary" onclick="redeemCode()" style="padding: 12px 30px;">
                    Redeem
                </button>
            </div>
        </div>

        <!-- Available Codes Hint -->
        <div style="background: rgba(176, 0, 255, 0.05); border: 1px solid rgba(176, 0, 255, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #b000ff; margin-bottom: 15px;">💡 How to Get Codes</h3>
            <div style="color: #888; font-size: 14px; line-height: 1.8;">
                • Follow 67 Labs on social media for exclusive codes<br>
                • Join the community Discord server<br>
                • Participate in special events and challenges<br>
                • Check the official website for announcements<br>
                • Codes are case-sensitive!
            </div>
        </div>

        <!-- Redeemed Codes -->
        <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(100, 100, 100, 0.3); border-radius: 12px; padding: 20px;">
            <h3 style="color: #888; margin-bottom: 15px;">✅ Redeemed Codes (${redeemedCodes.length})</h3>
            ${redeemedCodes.length > 0 ? `
                <div style="display: grid; gap: 10px;">
                    ${redeemedCodes.map(code => {
                        const reward = REDEEM_CODES[code];
                        return `
                            <div style="background: rgba(0, 240, 255, 0.1); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <span style="color: #00f0ff; font-weight: bold; font-family: monospace;">${code}</span>
                                </div>
                                <div style="color: #00ff88; font-size: 13px;">${reward ? reward.description : 'Unknown'}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : `
                <div style="text-align: center; color: #666; padding: 20px;">
                    No codes redeemed yet
                </div>
            `}
        </div>
    `;
}
