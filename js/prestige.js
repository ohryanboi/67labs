// Prestige/Rebirth System

// Check if player can prestige
function canPrestige() {
    const totalWealth = calculateWealthZoneScore();
    const requiredWealth = getPrestigeRequirement();
    return totalWealth >= requiredWealth;
}

// Get prestige requirement (increases by 10x each time)
function getPrestigeRequirement() {
    const baseRequirement = 1000000; // $1M for first prestige
    const currentLevel = gameState.prestigeLevel || 0;
    return baseRequirement * Math.pow(10, currentLevel);
}

// Perform prestige/rebirth
function performPrestige() {
    const requiredWealth = getPrestigeRequirement();
    if (!canPrestige()) {
        showNotification(`❌ Need ${formatCurrency(requiredWealth)} total wealth to prestige!`);
        return;
    }

    const totalWealth = calculateWealthZoneScore();
    const prestigePoints = Math.floor(totalWealth / 100000); // 1 point per $100k
    const nextRequirement = getPrestigeRequirement() * 10;

    const confirmMsg = `🔄 PRESTIGE REBIRTH\n\n` +
        `You will reset to starting capital but keep:\n` +
        `✓ +5% profit bonus (permanent)\n` +
        `✓ Prestige level & badges\n` +
        `✓ Exclusive stocks unlock\n` +
        `✓ Special titles\n\n` +
        `Current Prestige Level: ${gameState.prestigeLevel}\n` +
        `New Prestige Level: ${gameState.prestigeLevel + 1}\n` +
        `Prestige Points Earned: ${prestigePoints}\n` +
        `Next Prestige Requirement: ${formatCurrency(nextRequirement)}\n\n` +
        `Continue?`;

    if (!confirm(confirmMsg)) {
        return;
    }

    // Save prestige data
    const newPrestigeLevel = gameState.prestigeLevel + 1;
    const prestigeBonus = PRESTIGE_BONUSES[newPrestigeLevel];

    // Reset game state but keep prestige data
    const keptData = {
        prestigeLevel: newPrestigeLevel,
        prestigePoints: (gameState.prestigePoints || 0) + prestigePoints,
        totalLifetimeEarnings: gameState.totalLifetimeEarnings || 0,
        unlockedExclusiveStocks: [...(gameState.unlockedExclusiveStocks || [])],
        prestigeBadges: [...(gameState.prestigeBadges || [])],
        prestigeTitles: [...(gameState.prestigeTitles || [])],
        difficultyMode: gameState.difficultyMode,
        redeemedCodes: [...(gameState.redeemedCodes || [])],
        cheatMenuUnlocked: gameState.cheatMenuUnlocked
    };

    // Unlock new content
    if (prestigeBonus && prestigeBonus.unlocks) {
        prestigeBonus.unlocks.forEach(unlock => {
            if (!keptData.unlockedExclusiveStocks.includes(unlock)) {
                keptData.unlockedExclusiveStocks.push(unlock);
            }
        });
    }

    // Add badge and title
    if (prestigeBonus) {
        if (!keptData.prestigeBadges.includes(prestigeBonus.badge)) {
            keptData.prestigeBadges.push(prestigeBonus.badge);
        }
        if (!keptData.prestigeTitles.includes(prestigeBonus.title)) {
            keptData.prestigeTitles.push(prestigeBonus.title);
        }
    }

    // Reset to initial state
    const difficulty = DIFFICULTY_MODES[gameState.difficultyMode || 'easy'];
    gameState.digitalReserve = difficulty.startingCapital;
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

    // Restore prestige data
    Object.assign(gameState, keptData);

    // Reset stock prices
    EQUITY_NODES.forEach(node => {
        node.currentPrice = node.basePrice;
        node.previousPrice = node.basePrice;
        node.priceHistory = [node.basePrice];
        node.volumeHistory = [];
        node.bankrupt = false;
    });

    // Add exclusive stocks if unlocked
    addExclusiveStocks();

    showNotification(`🔄 PRESTIGE ${newPrestigeLevel}! You are now a ${prestigeBonus.title}!`);
    playSound('achievement');
    createConfetti();
    saveState();
    renderAll();
}

// Add exclusive stocks based on unlocks
function addExclusiveStocks() {
    if (!gameState.unlockedExclusiveStocks) return;

    gameState.unlockedExclusiveStocks.forEach(unlockKey => {
        if (unlockKey === 'all_exclusive') {
            // Unlock all exclusive stocks
            Object.values(EXCLUSIVE_STOCKS).forEach(stockArray => {
                stockArray.forEach(stock => addExclusiveStock(stock));
            });
        } else if (EXCLUSIVE_STOCKS[unlockKey]) {
            // Unlock specific category
            EXCLUSIVE_STOCKS[unlockKey].forEach(stock => addExclusiveStock(stock));
        }
    });
}

// Add a single exclusive stock if not already present
function addExclusiveStock(stockData) {
    const exists = EQUITY_NODES.find(n => n.symbol === stockData.symbol);
    if (!exists) {
        const newStock = {
            ...stockData,
            currentPrice: stockData.basePrice,
            previousPrice: stockData.basePrice,
            pulse: 'neutral',
            trend: 0,
            volume: 1000,
            priceHistory: [stockData.basePrice],
            volumeHistory: [],
            open: stockData.basePrice,
            high: stockData.basePrice,
            low: stockData.basePrice,
            close: stockData.basePrice,
            bankrupt: false
        };
        EQUITY_NODES.push(newStock);
    }
}

// Get current prestige info
function getPrestigeInfo() {
    const level = gameState.prestigeLevel || 0;
    const bonus = PRESTIGE_BONUSES[level];
    const nextBonus = PRESTIGE_BONUSES[level + 1];

    return {
        level,
        points: gameState.prestigePoints || 0,
        currentBonus: bonus,
        nextBonus,
        canPrestige: canPrestige(),
        totalWealth: calculateWealthZoneScore(),
        lifetimeEarnings: gameState.totalLifetimeEarnings || 0,
        badges: gameState.prestigeBadges || [],
        titles: gameState.prestigeTitles || []
    };
}

// Render prestige display
function renderPrestigeDisplay() {
    const container = document.getElementById('prestigeDisplay');
    if (!container) return;

    const info = getPrestigeInfo();
    const canPrestigeNow = info.canPrestige;

    container.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(176, 0, 255, 0.2), rgba(0, 240, 255, 0.2)); border: 2px solid rgba(176, 0, 255, 0.5); border-radius: 16px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: #b000ff; margin-bottom: 20px; text-align: center; font-size: 32px;">
                🔄 PRESTIGE SYSTEM
            </h2>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                    <div style="color: #888; font-size: 14px; margin-bottom: 10px;">Prestige Level</div>
                    <div style="color: #b000ff; font-size: 36px; font-weight: bold;">${info.level}</div>
                    ${info.currentBonus ? `<div style="color: #00ff88; font-size: 14px; margin-top: 10px;">${info.currentBonus.badge} ${info.currentBonus.title}</div>` : ''}
                </div>

                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                    <div style="color: #888; font-size: 14px; margin-bottom: 10px;">Profit Bonus</div>
                    <div style="color: #00ff88; font-size: 36px; font-weight: bold;">+${info.currentBonus ? (info.currentBonus.profitBonus * 100).toFixed(0) : 0}%</div>
                    <div style="color: #888; font-size: 14px; margin-top: 10px;">Permanent</div>
                </div>

                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                    <div style="color: #888; font-size: 14px; margin-bottom: 10px;">Prestige Points</div>
                    <div style="color: #00f0ff; font-size: 36px; font-weight: bold;">${info.points}</div>
                    <div style="color: #888; font-size: 14px; margin-top: 10px;">Total Earned</div>
                </div>

                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                    <div style="color: #888; font-size: 14px; margin-bottom: 10px;">Lifetime Earnings</div>
                    <div style="color: #ffd700; font-size: 24px; font-weight: bold;">${formatCurrency(info.lifetimeEarnings)}</div>
                    <div style="color: #888; font-size: 14px; margin-top: 10px;">All Time</div>
                </div>
            </div>

            ${info.nextBonus ? `
                <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(176, 0, 255, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h3 style="color: #b000ff; margin-bottom: 15px;">Next Prestige Level ${info.level + 1}</h3>
                    <div style="color: #fff; margin-bottom: 10px;">
                        ${info.nextBonus.badge} <strong>${info.nextBonus.title}</strong>
                    </div>
                    <div style="color: #00ff88; margin-bottom: 10px;">
                        ✓ +${(info.nextBonus.profitBonus * 100).toFixed(0)}% Profit Bonus
                    </div>
                    ${info.nextBonus.unlocks && info.nextBonus.unlocks.length > 0 ? `
                        <div style="color: #00f0ff;">
                            ✓ Unlock: ${info.nextBonus.unlocks.join(', ')}
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <div style="text-align: center;">
                <button
                    class="btn ${canPrestigeNow ? 'btn-success' : 'btn-secondary'}"
                    onclick="performPrestige()"
                    ${!canPrestigeNow ? 'disabled' : ''}
                    style="font-size: 20px; padding: 15px 40px; ${!canPrestigeNow ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                >
                    🔄 ${canPrestigeNow ? 'PRESTIGE NOW' : `Need ${formatCurrency(getPrestigeRequirement())} to Prestige`}
                </button>
                <div style="color: #888; font-size: 14px; margin-top: 15px;">
                    Current Total Wealth: ${formatCurrency(info.totalWealth)} / ${formatCurrency(getPrestigeRequirement())}
                </div>
            </div>

            ${info.badges.length > 0 ? `
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(176, 0, 255, 0.3);">
                    <h3 style="color: #b000ff; margin-bottom: 15px;">Your Badges & Titles</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${info.badges.map((badge, i) => `
                            <div style="background: rgba(176, 0, 255, 0.2); border: 1px solid rgba(176, 0, 255, 0.4); border-radius: 8px; padding: 10px 20px;">
                                <span style="font-size: 24px;">${badge}</span>
                                <span style="color: #fff; margin-left: 10px;">${info.titles[i] || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

