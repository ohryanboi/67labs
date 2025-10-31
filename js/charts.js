// Chart Drawing Functions

// Calculate Moving Average
function calculateMA(prices, period) {
    const ma = [];
    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            ma.push(null);
        } else {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            ma.push(sum / period);
        }
    }
    return ma;
}

// Calculate RSI
function calculateRSI(prices, period = 14) {
    const rsi = [];
    const changes = [];

    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }

    for (let i = 0; i < changes.length; i++) {
        if (i < period - 1) {
            rsi.push(null);
        } else {
            const recentChanges = changes.slice(i - period + 1, i + 1);
            const gains = recentChanges.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
            const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;

            if (losses === 0) {
                rsi.push(100);
            } else {
                const rs = gains / losses;
                rsi.push(100 - (100 / (1 + rs)));
            }
        }
    }

    return rsi;
}

// Draw mini chart for a node
function drawMiniChart(symbol) {
    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node || !node.priceHistory || node.priceHistory.length < 2) return;

    const canvas = document.getElementById(`chart-${symbol}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const prices = node.priceHistory;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;

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

    // Add hover functionality
    setupChartHover(canvas, symbol, prices, minPrice, maxPrice, priceRange);
}

// Setup chart hover to show price tooltip (improved sensitivity)
function setupChartHover(canvas, symbol, prices, minPrice, maxPrice, priceRange) {
    const tooltip = document.getElementById(`tooltip-${symbol}`);
    if (!tooltip) return;

    // Make the entire chart container hoverable, not just the canvas
    const chartContainer = canvas.parentElement;

    const showTooltip = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate which price point we're hovering over (with wider tolerance)
        const exactIndex = (x / canvas.width) * (prices.length - 1);
        const index = Math.round(exactIndex);

        if (index >= 0 && index < prices.length) {
            const price = prices[index];
            const pointsAgo = prices.length - 1 - index;

            tooltip.style.display = 'block';
            tooltip.style.left = `${x + 10}px`; // Offset to avoid cursor
            tooltip.style.top = `${Math.max(5, y - 45)}px`; // Keep in bounds
            tooltip.innerHTML = `
                <div style="font-weight: bold;">${formatCurrency(price)}</div>
                <div style="font-size: 10px; color: #888;">${pointsAgo === 0 ? 'Now' : pointsAgo + ' updates ago'}</div>
            `;
        }
    };

    const hideTooltip = () => {
        tooltip.style.display = 'none';
    };

    // Add listeners to both canvas and container for better coverage
    canvas.onmousemove = showTooltip;
    canvas.onmouseleave = hideTooltip;
    chartContainer.onmousemove = showTooltip;
    chartContainer.onmouseleave = hideTooltip;

    // Increase canvas cursor area
    canvas.style.cursor = 'crosshair';
}

// Draw larger chart for modal
function drawModalChart(symbol) {
    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node || !node.priceHistory || node.priceHistory.length < 2) return;

    const canvas = document.getElementById(`modal-chart-${symbol}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const prices = node.priceHistory;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Draw price line
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;

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

// Draw advanced chart with candlesticks, volume, MA, and RSI
function drawAdvancedChart(canvasId, symbol) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node || !node.priceHistory || node.priceHistory.length < 2) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const prices = node.priceHistory;
    const volumes = node.volumeHistory || [];

    // Calculate indicators
    const ma7 = calculateMA(prices, 7);
    const ma30 = calculateMA(prices, 30);
    const rsi = calculateRSI(prices);

    // Layout: 60% price chart, 20% volume, 20% RSI
    const priceHeight = height * 0.6;
    const volumeHeight = height * 0.2;
    const rsiHeight = height * 0.2;
    const volumeY = priceHeight;
    const rsiY = priceHeight + volumeHeight;

    // Draw price chart section
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = (priceHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Draw moving averages
    if (ma7.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1.5;
        ma7.forEach((ma, i) => {
            if (ma !== null) {
                const x = (i / (prices.length - 1)) * width;
                const y = priceHeight - ((ma - minPrice) / priceRange) * priceHeight;
                if (i === 0 || ma7[i - 1] === null) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        });
        ctx.stroke();
    }

    if (ma30.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#ff00e5';
        ctx.lineWidth = 1.5;
        ma30.forEach((ma, i) => {
            if (ma !== null) {
                const x = (i / (prices.length - 1)) * width;
                const y = priceHeight - ((ma - minPrice) / priceRange) * priceHeight;
                if (i === 0 || ma30[i - 1] === null) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        });
        ctx.stroke();
    }

    // Draw price line
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    prices.forEach((price, i) => {
        const x = (i / (prices.length - 1)) * width;
        const y = priceHeight - ((price - minPrice) / priceRange) * priceHeight;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw volume bars
    if (volumes.length > 0) {
        const maxVolume = Math.max(...volumes) || 1;
        const barWidth = width / volumes.length;

        volumes.forEach((vol, i) => {
            const x = (i / (volumes.length - 1)) * width;
            const barHeight = (vol / maxVolume) * volumeHeight;
            const y = volumeY + volumeHeight - barHeight;

            ctx.fillStyle = prices[i] > (prices[i - 1] || prices[i]) ?
                'rgba(0, 255, 136, 0.5)' : 'rgba(255, 68, 68, 0.5)';
            ctx.fillRect(x - barWidth / 2, y, barWidth * 0.8, barHeight);
        });
    }

    // Draw RSI
    if (rsi.length > 0) {
        // Draw RSI background zones
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(0, rsiY, width, rsiHeight * 0.3); // Overbought zone
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(0, rsiY + rsiHeight * 0.7, width, rsiHeight * 0.3); // Oversold zone

        // Draw RSI line
        ctx.beginPath();
        ctx.strokeStyle = '#b000ff';
        ctx.lineWidth = 2;
        rsi.forEach((value, i) => {
            if (value !== null) {
                const x = (i / (rsi.length - 1)) * width;
                const y = rsiY + rsiHeight - (value / 100) * rsiHeight;
                if (i === 0 || rsi[i - 1] === null) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        });
        ctx.stroke();

        // Draw RSI reference lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        [30, 50, 70].forEach(level => {
            const y = rsiY + rsiHeight - (level / 100) * rsiHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        });
    }

    // Draw labels
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.fillText(`Price: ${formatCurrency(prices[prices.length - 1])}`, 5, 12);
    ctx.fillText('MA7', 5, priceHeight - 25);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(35, priceHeight - 30, 15, 3);
    ctx.fillStyle = '#fff';
    ctx.fillText('MA30', 55, priceHeight - 25);
    ctx.fillStyle = '#ff00e5';
    ctx.fillRect(90, priceHeight - 30, 15, 3);

    ctx.fillStyle = '#fff';
    ctx.fillText('Volume', 5, volumeY + 12);
    ctx.fillText('RSI', 5, rsiY + 12);
    if (rsi.length > 0 && rsi[rsi.length - 1] !== null) {
        ctx.fillText(rsi[rsi.length - 1].toFixed(1), 30, rsiY + 12);
    }
}

// Draw sector performance chart
function drawSectorPerformanceChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Calculate sector performance
    const sectorPerformance = {};
    EQUITY_NODES.forEach(node => {
        if (!sectorPerformance[node.sector]) {
            sectorPerformance[node.sector] = {
                totalChange: 0,
                count: 0
            };
        }
        const changePercent = ((node.currentPrice - node.basePrice) / node.basePrice) * 100;
        sectorPerformance[node.sector].totalChange += changePercent;
        sectorPerformance[node.sector].count++;
    });

    // Calculate average performance per sector
    const sectors = Object.keys(sectorPerformance).map(sector => ({
        name: sector,
        performance: sectorPerformance[sector].totalChange / sectorPerformance[sector].count
    })).sort((a, b) => b.performance - a.performance);

    // Draw bars
    const barHeight = height / sectors.length;
    const maxPerformance = Math.max(...sectors.map(s => Math.abs(s.performance)));

    sectors.forEach((sector, i) => {
        const y = i * barHeight;
        const barWidth = (Math.abs(sector.performance) / maxPerformance) * (width * 0.7);
        const x = width * 0.3;

        // Draw bar
        ctx.fillStyle = sector.performance > 0 ?
            'rgba(0, 255, 136, 0.6)' : 'rgba(255, 68, 68, 0.6)';
        ctx.fillRect(x, y + 2, barWidth, barHeight - 4);

        // Draw sector name
        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(sector.name.substring(0, 15), x - 5, y + barHeight / 2 + 4);

        // Draw performance value
        ctx.textAlign = 'left';
        ctx.fillStyle = sector.performance > 0 ? '#00ff88' : '#ff4444';
        ctx.fillText(
            `${sector.performance > 0 ? '+' : ''}${sector.performance.toFixed(2)}%`,
            x + barWidth + 5,
            y + barHeight / 2 + 4
        );
    });

    ctx.textAlign = 'left';
}

// Draw portfolio performance graph
function drawPortfolioPerformanceChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    if (!gameState.wealthHistory || gameState.wealthHistory.length < 2) {
        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Not enough data yet...', width / 2, height / 2);
        return;
    }

    const data = gameState.wealthHistory;
    const minWealth = Math.min(...data.map(d => d.wealth));
    const maxWealth = Math.max(...data.map(d => d.wealth));
    const wealthRange = maxWealth - minWealth || 1;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Draw starting capital line
    const startY = height - ((STARTER_CAPITAL - minWealth) / wealthRange) * height;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(width, startY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw wealth line
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;

    data.forEach((point, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((point.wealth - minWealth) / wealthRange) * height;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw area fill
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const currentWealth = data[data.length - 1].wealth;
    if (currentWealth > STARTER_CAPITAL) {
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 68, 68, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0)');
    }
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw labels
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.fillText(formatCurrency(maxWealth), 5, 12);
    ctx.fillText(formatCurrency(minWealth), 5, height - 5);
    ctx.fillText(`Current: ${formatCurrency(currentWealth)}`, 5, 25);

    const totalGain = currentWealth - STARTER_CAPITAL;
    const totalGainPercent = (totalGain / STARTER_CAPITAL) * 100;
    ctx.fillStyle = totalGain > 0 ? '#00ff88' : '#ff4444';
    ctx.fillText(
        `${totalGain > 0 ? '+' : ''}${formatCurrency(totalGain)} (${totalGainPercent.toFixed(2)}%)`,
        5,
        38
    );
}
