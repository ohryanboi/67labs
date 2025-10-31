// UI Helper Functions

// Notification System
function showNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Confetti Animation
function createConfetti() {
    const colors = ['#00f0ff', '#b000ff', '#00ff88', '#ffea00', '#ff00e5'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

// Dark/Light Mode Toggle
function toggleDarkMode() {
    gameState.darkMode = !gameState.darkMode;
    
    if (gameState.darkMode) {
        document.body.style.background = 'linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%)';
        document.documentElement.style.setProperty('--background-color', '#0a0a0a');
        document.body.style.color = '#fff';
    } else {
        document.body.style.background = 'linear-gradient(135deg, #f0f0f5 0%, #e0e0ea 100%)';
        document.documentElement.style.setProperty('--background-color', '#ffffff');
        document.body.style.color = '#1a1a1a';
    }
    
    showNotification(gameState.darkMode ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
    saveState();
}

// Compact/Expanded View Toggle
function toggleViewMode() {
    gameState.viewMode = gameState.viewMode === 'expanded' ? 'compact' : 'expanded';
    
    const container = document.querySelector('.container');
    if (gameState.viewMode === 'compact') {
        container.classList.add('compact-mode');
    } else {
        container.classList.remove('compact-mode');
    }
    
    showNotification(gameState.viewMode === 'compact' ? '📦 Compact view enabled' : '📋 Expanded view enabled');
    saveState();
}

// Sound System
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    showNotification(gameState.soundEnabled ? '🔊 Sound enabled' : '🔇 Sound disabled');
    saveState();
}

function playSound(type) {
    if (!gameState.soundEnabled) return;
    
    try {
        // Create simple beep sounds using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set frequency based on sound type
        switch(type) {
            case 'buy': oscillator.frequency.value = 440; break; // A4
            case 'sell': oscillator.frequency.value = 330; break; // E4
            case 'profit': oscillator.frequency.value = 523; break; // C5
            case 'loss': oscillator.frequency.value = 220; break; // A3
            case 'achievement': oscillator.frequency.value = 659; break; // E5
            default: oscillator.frequency.value = 440;
        }
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Silently fail if Web Audio API is not supported
        console.log('Audio not supported');
    }
}

// Modal functions
function openAcquireModal(symbol) {
    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    document.getElementById('modalSymbol').textContent = node.symbol;
    document.getElementById('modalName').textContent = node.name;
    document.getElementById('modalPrice').textContent = formatCurrency(node.currentPrice);
    document.getElementById('modalSector').textContent = node.sector;
    document.getElementById('quantityInput').value = '1';
    document.getElementById('acquireModal').classList.add('active');
}

function closeModal() {
    document.getElementById('acquireModal').classList.remove('active');
}

// Expanded Chart Modal
let currentExpandedSymbol = null;

function openExpandedChart(symbol) {
    currentExpandedSymbol = symbol;
    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node) return;

    document.getElementById('expandedChartSymbol').textContent = node.symbol;
    document.getElementById('expandedChartName').textContent = node.name;
    document.getElementById('expandedChartPrice').textContent = formatCurrency(node.currentPrice);
    document.getElementById('expandedChartModal').classList.add('active');

    // Draw chart
    setTimeout(() => {
        drawExpandedChart();
        setupExpandedChartHover();
    }, 100);
}

function closeExpandedChart() {
    document.getElementById('expandedChartModal').classList.remove('active');
    currentExpandedSymbol = null;
}

function drawExpandedChart() {
    if (!currentExpandedSymbol) return;

    const node = EQUITY_NODES.find(n => n.symbol === currentExpandedSymbol);
    if (!node || !node.priceHistory || node.priceHistory.length < 2) return;

    const canvas = document.getElementById('expandedChartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    drawLineChart(ctx, node, width, height);
}

function setupExpandedChartHover() {
    const canvas = document.getElementById('expandedChartCanvas');
    const tooltip = document.getElementById('expandedChartTooltip');
    if (!canvas || !tooltip) return;

    const node = EQUITY_NODES.find(n => n.symbol === currentExpandedSymbol);
    if (!node || !node.priceHistory) return;

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const prices = node.priceHistory;

        if (x >= padding && x <= canvas.width - padding && y >= padding && y <= canvas.height - padding) {
            // Calculate which price point we're hovering over
            const index = Math.floor(((x - padding) / chartWidth) * (prices.length - 1));
            const price = prices[index];

            if (price) {
                tooltip.style.display = 'block';
                tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
                tooltip.style.top = (e.clientY - rect.top - 30) + 'px';
                tooltip.textContent = `Price: ${formatCurrency(price)} | Point: ${index + 1}/${prices.length}`;
            }
        } else {
            tooltip.style.display = 'none';
        }
    });

    canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
}

function drawLineChart(ctx, node, width, height) {
    const prices = node.priceHistory;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        // Price labels
        const price = maxPrice - (priceRange / 5) * i;
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(formatCurrency(price), padding - 5, y + 4);
    }

    // Draw line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    prices.forEach((price, i) => {
        const x = padding + (chartWidth / (prices.length - 1)) * i;
        const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw gradient fill
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
}

// Update Log Functions
function showUpdateLog() {
    try {
        // Check if user has disabled update log
        if (!UPDATE_LOG.showOnLoad) {
            return;
        }

        // Populate update log content
        const titleEl = document.getElementById('updateLogTitle');
        const versionEl = document.getElementById('updateLogVersion');
        const dateEl = document.getElementById('updateLogDate');
        const updateList = document.getElementById('updateLogList');
        const modal = document.getElementById('updateLogModal');

        if (!titleEl || !versionEl || !dateEl || !updateList || !modal) {
            console.error('Update log elements not found!');
            return;
        }

        titleEl.textContent = UPDATE_LOG.title;
        versionEl.textContent = `v${UPDATE_LOG.version}`;
        dateEl.textContent = UPDATE_LOG.date;

        updateList.innerHTML = UPDATE_LOG.updates.map(update => `
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(0, 240, 255, 0.1); color: #e0e0e0; font-size: 14px;">
                ${update}
            </li>
        `).join('');

        // Show modal
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error showing update log:', error);
    }
}

function closeUpdateLog() {
    const modal = document.getElementById('updateLogModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

