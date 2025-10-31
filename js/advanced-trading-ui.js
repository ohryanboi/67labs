// ========================================
// ADVANCED TRADING UI RENDERING
// ========================================

// Current asset type being displayed
let currentAssetType = 'stocks';

// Show specific asset type
function showAssetType(assetType) {
    currentAssetType = assetType;

    // Update button states
    document.querySelectorAll('[id^="assetBtn-"]').forEach(btn => {
        btn.style.background = 'rgba(0, 240, 255, 0.1)';
        btn.style.borderColor = 'rgba(0, 240, 255, 0.3)';
    });
    const activeBtn = document.getElementById(`assetBtn-${assetType}`);
    if (activeBtn) {
        activeBtn.style.background = 'rgba(0, 240, 255, 0.3)';
        activeBtn.style.borderColor = 'rgba(0, 240, 255, 0.6)';
    }

    const display = document.getElementById('tradingGrid');
    if (!display) return;

    let assets = [];

    switch(assetType) {
        case 'stocks':
            assets = EQUITY_NODES.filter(n => !n.delisted && !n.bankrupt);
            break;
        case 'crypto':
            // Auto-initialize crypto if not already initialized
            if (!gameState.cryptoAssets) {
                if (typeof initializeCrypto === 'function') {
                    initializeCrypto();
                    console.log('Auto-initialized crypto assets');
                }
            }
            assets = gameState.cryptoAssets || [];
            break;
        case 'forex':
            // Auto-initialize forex if not already initialized
            if (!gameState.forexPairs) {
                if (typeof initializeForex === 'function') {
                    initializeForex();
                    console.log('Auto-initialized forex pairs');
                }
            }
            assets = gameState.forexPairs || [];
            break;
        case 'commodities':
            // Auto-initialize commodities if not already initialized
            if (!gameState.commodities) {
                if (typeof initializeCommodities === 'function') {
                    initializeCommodities();
                    console.log('Auto-initialized commodities');
                }
            }
            assets = gameState.commodities || [];
            break;
        case 'bonds':
            // Auto-initialize bonds if not already initialized
            if (!gameState.bonds) {
                if (typeof initializeBonds === 'function') {
                    initializeBonds();
                    console.log('Auto-initialized bonds');
                }
            }
            assets = gameState.bonds || [];
            break;
    }

    if (assets.length === 0) {
        display.innerHTML = `<p style="color: #ccc; text-align: center; padding: 40px;">Loading ${assetType}...</p>`;
        return;
    }

    // Apply search and sort if stocks
    if (assetType === 'stocks') {
        const sortBy = gameState.stockSortBy || 'symbol';
        const sortOrder = gameState.stockSortOrder || 'asc';
        const searchQuery = gameState.stockSearchQuery || '';

        if (typeof filterStocks === 'function' && searchQuery) {
            assets = filterStocks(assets, searchQuery);
        }
        if (typeof sortStocks === 'function') {
            assets = sortStocks(assets, sortBy, sortOrder);
        }

        display.innerHTML = assets.map(node => renderEquityNode(node, false)).join('');

        // Draw charts
        setTimeout(() => {
            assets.forEach(node => {
                if (typeof drawMiniChart === 'function') {
                    drawMiniChart(node.symbol);
                }
            });
        }, 10);
    } else {
        display.innerHTML = assets.map(asset => renderAssetCard(asset, assetType)).join('');

        // Draw charts for assets
        setTimeout(() => {
            assets.forEach(asset => {
                drawAssetChart(asset.symbol, asset.priceHistory || [asset.currentPrice]);
            });
        }, 10);
    }

    saveState();
}

// Render asset card
function renderAssetCard(asset, assetType) {
    const priceChange = asset.currentPrice - asset.previousPrice;
    const priceChangePercent = (priceChange / asset.previousPrice) * 100;
    const changeColor = priceChange >= 0 ? '#00ff88' : '#ff4444';
    const changeIcon = priceChange >= 0 ? '▲' : '▼';

    const unit = asset.unit ? `/${asset.unit}` : '';
    const yieldInfo = asset.currentYield ? `<div style="color: #00f0ff; font-size: 12px;">Yield: ${(asset.currentYield * 100).toFixed(2)}%</div>` : '';

    return `
        <div class="node-card" style="position: relative;">
            <div class="node-header">
                <div>
                    <div class="node-symbol">${asset.symbol}</div>
                    <div class="node-name">${asset.name}</div>
                </div>
                ${asset.sector ? `<div class="node-sector">${asset.sector}</div>` : ''}
            </div>

            <!-- Mini Chart -->
            <canvas id="chart-${asset.symbol}" width="280" height="80" style="width: 100%; height: 80px; margin: 10px 0;"></canvas>

            <div style="margin: 15px 0;">
                <div style="font-size: 24px; font-weight: bold; color: #00f0ff;">
                    ${formatCurrency(asset.currentPrice)}${unit}
                </div>
                <div style="color: ${changeColor}; font-size: 14px; margin-top: 5px;">
                    ${changeIcon} ${formatCurrency(Math.abs(priceChange))} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)
                </div>
                ${yieldInfo}
            </div>

            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button onclick="openAcquireModal('${asset.symbol}')" class="btn btn-primary" style="flex: 1;">
                    Buy
                </button>
                <button onclick="releaseNode('${asset.symbol}')" class="btn btn-secondary" style="flex: 1;">
                    Sell
                </button>
            </div>
        </div>
    `;
}

// Update short positions display
function updateShortPositionsDisplay() {
    const display = document.getElementById('shortPositionsDisplay');
    if (!display) return;
    
    if (!gameState.shortPositions || gameState.shortPositions.length === 0) {
        display.innerHTML = '<p style="color: #888; font-size: 12px;">No active short positions</p>';
        return;
    }
    
    const html = gameState.shortPositions.map(short => {
        const currentNode = EQUITY_NODES.find(n => n.symbol === short.symbol);
        const currentPrice = currentNode ? currentNode.currentPrice : short.currentPrice;
        const priceDiff = short.entryPrice - currentPrice;
        const profit = priceDiff * short.quantity - short.borrowFeeAccrued;
        const profitColor = profit >= 0 ? '#00ff88' : '#ff4444';
        
        return `
            <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px; margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold; color: #fff;">${short.symbol}</div>
                        <div style="font-size: 12px; color: #888;">${short.quantity} shares @ ${formatCurrency(short.entryPrice)}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: ${profitColor}; font-weight: bold;">${profit >= 0 ? '+' : ''}${formatCurrency(profit)}</div>
                        <button onclick="coverShort('${short.symbol}')" class="btn btn-secondary" style="font-size: 11px; padding: 4px 8px; margin-top: 5px;">
                            Cover
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    display.innerHTML = html;
}

// Update options display
function updateOptionsDisplay() {
    const display = document.getElementById('optionsDisplay');
    if (!display) return;
    
    if (!gameState.optionPositions || gameState.optionPositions.length === 0) {
        display.innerHTML = '<p style="color: #888; font-size: 12px;">No active options</p>';
        return;
    }
    
    const html = gameState.optionPositions.map((option, index) => {
        const node = EQUITY_NODES.find(n => n.symbol === option.symbol);
        const currentPrice = node ? node.currentPrice : 0;
        const timeLeft = option.expirationTime - Date.now();
        const daysLeft = Math.max(0, Math.floor(timeLeft / (24 * 60 * 60 * 1000)));
        
        let intrinsicValue = 0;
        if (option.type === 'call') {
            intrinsicValue = Math.max(0, currentPrice - option.strikePrice);
        } else {
            intrinsicValue = Math.max(0, option.strikePrice - currentPrice);
        }
        
        const totalValue = intrinsicValue * 100 * option.contracts;
        const profit = totalValue - (option.premium * 100 * option.contracts);
        const profitColor = profit >= 0 ? '#00ff88' : '#ff4444';
        
        return `
            <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px; margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold; color: #fff;">${option.symbol} ${option.type.toUpperCase()}</div>
                        <div style="font-size: 12px; color: #888;">Strike: ${formatCurrency(option.strikePrice)} | ${daysLeft}d left</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: ${profitColor}; font-weight: bold;">${profit >= 0 ? '+' : ''}${formatCurrency(profit)}</div>
                        <button onclick="exerciseOption(${index})" class="btn btn-secondary" style="font-size: 11px; padding: 4px 8px; margin-top: 5px;">
                            Exercise
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    display.innerHTML = html;
}

// Set leverage
function setLeverage(leverage) {
    if (!gameState.marginEnabled) {
        showNotification('❌ Enable margin trading first!');
        return;
    }
    
    gameState.currentLeverage = leverage;
    showNotification(`📊 Leverage set to ${leverage}x`);
    saveState();
}

// Update advanced tab when it's active
function updateAdvancedTab() {
    const advancedTab = document.getElementById('advanced');
    if (!advancedTab || !advancedTab.classList.contains('active')) return;
    
    updateShortPositionsDisplay();
    updateOptionsDisplay();
}

// Draw mini chart for asset
function drawAssetChart(symbol, priceHistory) {
    const canvas = document.getElementById(`chart-${symbol}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!priceHistory || priceHistory.length < 2) {
        ctx.fillStyle = '#444';
        ctx.font = '12px monospace';
        ctx.fillText('No data', width / 2 - 25, height / 2);
        return;
    }

    // Get min/max for scaling
    const prices = priceHistory.slice(-50); // Last 50 data points
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Draw price line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    prices.forEach((price, index) => {
        const x = (index / (prices.length - 1)) * width;
        const y = height - ((price - minPrice) / priceRange) * height;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw gradient fill
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
}

// Refresh current asset view
function refreshCurrentAssetView() {
    const tradingTab = document.getElementById('trading');
    if (tradingTab && tradingTab.classList.contains('active')) {
        if (typeof currentAssetType !== 'undefined') {
            showAssetType(currentAssetType);
        }
    }
}

