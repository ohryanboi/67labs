// Shop System and Code Redemption

// Shop System
function buyPotion(potionKey) {
    const potion = POTIONS[potionKey];
    
    if (gameState.digitalReserve < potion.price) {
        showNotification('❌ Insufficient funds!');
        return;
    }

    gameState.digitalReserve -= potion.price;
    
    if (!gameState.potions) {
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
    }
    
    gameState.potions[potionKey] = (gameState.potions[potionKey] || 0) + 1;
    
    showNotification(`${potion.icon} Purchased ${potion.name}!`);
    playSound('achievement');
    saveState();
    renderShop();
}

function usePotion(potionKey) {
    if (!gameState.potions || !gameState.potions[potionKey] || gameState.potions[potionKey] <= 0) {
        showNotification('❌ No potions available!');
        return;
    }

    const potion = POTIONS[potionKey];

    // Initialize activePotions if needed
    if (!gameState.activePotions) gameState.activePotions = [];

    // Handle special instant-effect potions
    if (potion.effect === 'crash') {
        // Market Crash - instant effect
        EQUITY_NODES.forEach(node => {
            node.currentPrice *= 0.80; // 20% drop
            node.trend = -0.8;
        });
        gameState.potions[potionKey]--;
        showNotification(`${potion.icon} MARKET CRASH! All stocks dropped 20%!`);
        playSound('achievement');
        createConfetti();
        saveState();
        renderAll();
        return;
    }

    if (potion.effect === 'protection') {
        // Loss Protection - lasts for 3 trades
        gameState.protectedTrades = potion.charges;
        gameState.potions[potionKey]--;
        showNotification(`${potion.icon} Activated ${potion.name}! Next ${potion.charges} trades protected!`);
        playSound('achievement');
        createConfetti();
        saveState();
        renderShop();
        return;
    }

    if (potion.effect === 'freeze') {
        // Time Freeze - pause price updates
        pricesFrozen = true;
        gameState.potions[potionKey]--;
        setTimeout(() => {
            pricesFrozen = false;
            showNotification('⏰ Time Freeze ended! Prices resuming...');
        }, potion.duration);
        showNotification(`${potion.icon} TIME FROZEN! Prices paused for 1 minute!`);
        playSound('achievement');
        createConfetti();
        saveState();
        renderShop();
        return;
    }

    if (potion.effect === 'diamond') {
        // Diamond Hands - lock positions with guaranteed profit
        gameState.diamondHandsActive = true;
        gameState.diamondHandsEndTime = Date.now() + potion.duration;
        gameState.potions[potionKey]--;
        showNotification(`${potion.icon} DIAMOND HANDS! Positions locked for 5 min with guaranteed 10% profit!`);
        playSound('achievement');
        createConfetti();
        saveState();
        renderShop();
        return;
    }

    // Regular duration-based potions
    gameState.potions[potionKey]--;

    const activePotion = {
        type: potionKey,
        effect: potion.effect,
        endTime: Date.now() + potion.duration,
        expired: false
    };

    gameState.activePotions.push(activePotion);

    // Check for potion combos
    checkPotionCombos();

    showNotification(`${potion.icon} Activated ${potion.name}!`);
    playSound('achievement');
    createConfetti();
    saveState();
    renderShop();
}

// Check for potion combos
function checkPotionCombos() {
    if (!gameState.activePotions) return;

    const activePotionTypes = gameState.activePotions
        .filter(p => !p.expired)
        .map(p => p.type);

    // Check each combo
    Object.keys(POTION_COMBOS).forEach(comboKey => {
        const combo = POTION_COMBOS[comboKey];
        const hasCombo = combo.requiredPotions.every(req => activePotionTypes.includes(req));

        if (hasCombo) {
            showNotification(`✨ COMBO ACTIVATED: ${combo.name}! ${combo.bonusEffect}`);
            playSound('achievement');
            createConfetti();
        }
    });
}

// Check if a specific potion is active
function isPotionActive(effect) {
    if (!gameState.activePotions) return false;

    const now = Date.now();
    return gameState.activePotions.some(p =>
        p.effect === effect && !p.expired && now < p.endTime
    );
}

// Check if combo is active
function isComboActive(comboKey) {
    if (!gameState.activePotions) return false;

    const combo = POTION_COMBOS[comboKey];
    if (!combo) return false;

    const activePotionTypes = gameState.activePotions
        .filter(p => !p.expired && Date.now() < p.endTime)
        .map(p => p.type);

    return combo.requiredPotions.every(req => activePotionTypes.includes(req));
}

function checkActivePotions() {
    if (!gameState.activePotions) return;

    const now = Date.now();
    let hasChanges = false;

    gameState.activePotions.forEach((potion) => {
        if (now >= potion.endTime && !potion.expired) {
            potion.expired = true;
            hasChanges = true;
            const potionData = POTIONS[potion.type];
            showNotification(`⏰ ${potionData.name} expired!`);
        }
    });

    // Check Diamond Hands expiration
    if (gameState.diamondHandsActive && now >= gameState.diamondHandsEndTime) {
        gameState.diamondHandsActive = false;
        gameState.diamondHandsEndTime = null;

        // Apply guaranteed 10% profit to all positions
        gameState.activeStrategies.forEach(strategy => {
            const node = EQUITY_NODES.find(n => n.symbol === strategy.symbol);
            if (node) {
                // Boost price by 10%
                node.currentPrice *= 1.10;
            }
        });

        showNotification('💎 Diamond Hands expired! All positions gained 10%!');
        hasChanges = true;
    }

    if (hasChanges) {
        saveState();
    }
}

function clearExpiredPotions() {
    if (!gameState.activePotions) return;

    const beforeCount = gameState.activePotions.length;
    gameState.activePotions = gameState.activePotions.filter(p => !p.expired);
    const removedCount = beforeCount - gameState.activePotions.length;

    if (removedCount > 0) {
        showNotification(`🗑️ Cleared ${removedCount} expired potion${removedCount > 1 ? 's' : ''}!`);
        saveState();
        renderShop();
    }
}

// Code Redemption System
function redeemCode() {
    const input = document.getElementById('codeInput');
    const code = input.value.trim();
    
    if (!code) {
        showNotification('❌ Please enter a code!');
        return;
    }

    if (!gameState.redeemedCodes) gameState.redeemedCodes = [];

    const reward = REDEEM_CODES[code];

    if (!reward) {
        showNotification('❌ Invalid code!');
        input.value = '';
        return;
    }

    // Allow CHEATS code to be redeemed multiple times
    if (code !== 'CHEATS') {
        if (gameState.redeemedCodes.includes(code)) {
            showNotification('❌ Code already redeemed!');
            input.value = '';
            return;
        }
        gameState.redeemedCodes.push(code);
    }

    if (reward.type === 'money') {
        gameState.digitalReserve += reward.amount;
        showNotification(`🎁 Redeemed! +${formatCurrency(reward.amount)}`);
    } else if (reward.type === 'potions') {
        if (!gameState.potions) {
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
        }
        // Give one of each original potion
        gameState.potions.speedBoost++;
        gameState.potions.profitMultiplier++;
        gameState.potions.luckBoost++;
        gameState.potions.dividendBoost++;
        showNotification('🎁 Redeemed! +1 of each basic potion!');
    } else if (reward.type === 'cheat_menu') {
        gameState.cheatMenuUnlocked = true;
        showNotification('🎮 Cheat Menu Unlocked!');
        showCheatButton();
    } else if (reward.type === 'advanced_trading') {
        // Unlock all advanced trading features
        gameState.shortSellingEnabled = true;
        gameState.optionsEnabled = true;
        gameState.afterHoursEnabled = true;
        gameState.marginEnabled = true;

        // Initialize all asset classes
        if (typeof initializeCrypto === 'function') initializeCrypto();
        if (typeof initializeForex === 'function') initializeForex();
        if (typeof initializeCommodities === 'function') initializeCommodities();
        if (typeof initializeBonds === 'function') initializeBonds();

        showNotification('🚀 All Advanced Trading Features Unlocked!');
    }

    playSound('achievement');
    createConfetti();
    input.value = '';
    saveState();
    renderCodes();
    renderShop();
    renderStats();
}

// Cheat Menu Functions
function showCheatButton() {
    const existingButton = document.getElementById('cheatMenuButton');
    if (existingButton) return; // Already exists

    const button = document.createElement('button');
    button.id = 'cheatMenuButton';
    button.innerHTML = '🎮 Cheats';
    button.className = 'cheat-menu-button';
    button.onclick = openCheatMenu;
    document.body.appendChild(button);
}

function openCheatMenu() {
    document.getElementById('cheatMenuModal').classList.add('active');
}

function closeCheatMenu() {
    document.getElementById('cheatMenuModal').classList.remove('active');
}

// Cheat Functions
function cheatAddMoney() {
    const amount = parseInt(document.getElementById('cheatMoneyAmount').value) || 0;
    if (amount > 0) {
        gameState.digitalReserve += amount;
        showNotification(`💰 Added ${formatCurrency(amount)}`);
        saveState();
        renderAll();
    }
}

function cheatAddRP() {
    const amount = parseInt(document.getElementById('cheatRPAmount').value) || 0;
    if (amount > 0) {
        gameState.rankPoints = (gameState.rankPoints || 0) + amount;
        showNotification(`⭐ Added ${amount} RP`);
        updateRank(gameState.rankPoints); // Pass manual points
        saveState();
        renderAll();
    }
}

function cheatMaxRank() {
    gameState.rankPoints = 30000;
    gameState.currentRank = RANKS.length - 1;
    showNotification('👑 Max Rank Unlocked!');
    updateRank(30000); // Pass manual points
    saveState();
    renderAll();
}

function cheatUnlockAllThemes() {
    gameState.unlockedThemes = ['default', 'matrix', 'cyberpunk', 'neon'];
    showNotification('🎨 All Themes Unlocked!');
    saveState();
    renderAll();
}

function cheatAddPotions() {
    if (!gameState.potions) {
        gameState.potions = { speedBoost: 0, profitMultiplier: 0, luckBoost: 0, dividendBoost: 0 };
    }
    gameState.potions.speedBoost += 10;
    gameState.potions.profitMultiplier += 10;
    gameState.potions.luckBoost += 10;
    gameState.potions.dividendBoost += 10;
    showNotification('🧪 Added 10 of each potion!');
    saveState();
    renderAll();
}

function cheatUnlockAllAchievements() {
    // Unlock all milestones
    MILESTONES.forEach(m => {
        if (!gameState.milestones.includes(m.id)) {
            gameState.milestones.push(m.id);
            m.unlocked = true;
        }
    });

    // Unlock all secret achievements
    SECRET_ACHIEVEMENTS.forEach(a => {
        if (!gameState.secretAchievements.includes(a.id)) {
            gameState.secretAchievements.push(a.id);
            gameState.achievementPoints += a.points;
        }
    });

    showNotification('🏆 All Achievements Unlocked!');
    saveState();
    renderAll();
}

function cheatCompleteChallenge() {
    if (gameState.dailyChallenge) {
        gameState.rankPoints += gameState.dailyChallenge.reward;
        showNotification(`🎯 Challenge Complete! +${gameState.dailyChallenge.reward} RP`);
        gameState.dailyChallenge = null;
        saveState();
        renderAll();
    } else {
        showNotification('❌ No active challenge!');
    }
}

function cheatFreezePrice() {
    pricesFrozen = !pricesFrozen;
    showNotification(pricesFrozen ? '❄️ Prices Frozen!' : '🔥 Prices Unfrozen!');
    document.getElementById('freezePriceBtn').textContent = pricesFrozen ? '🔥 Unfreeze Prices' : '❄️ Freeze Prices';
}

// ========================================
// NEW CHEAT FUNCTIONS FOR ADVANCED FEATURES
// ========================================

// Market Manipulation Cheats
function cheatTriggerBullMarket() {
    gameState.currentMarketCycle = 'bull';
    gameState.marketCycleEndTime = Date.now() + 180000; // 3 minutes
    showNotification('📈 Bull Market activated!');
    saveState();
    renderAll();
}

function cheatTriggerBearMarket() {
    gameState.currentMarketCycle = 'bear';
    gameState.marketCycleEndTime = Date.now() + 180000; // 3 minutes
    showNotification('📉 Bear Market activated!');
    saveState();
    renderAll();
}

function cheatTriggerRecession() {
    gameState.currentMarketCycle = 'recession';
    gameState.marketCycleEndTime = Date.now() + 300000; // 5 minutes
    gameState.lastRecessionTime = Date.now();
    EQUITY_NODES.forEach(node => {
        const drop = 0.30 + Math.random() * 0.20; // 30-50% drop
        node.currentPrice *= (1 - drop);
    });
    showNotification('💔 Recession triggered! All stocks crashed!');
    saveState();
    renderAll();
}

function cheatTriggerRecovery() {
    gameState.currentMarketCycle = 'recovery';
    gameState.marketCycleEndTime = Date.now() + 240000; // 4 minutes
    showNotification('💚 Recovery Phase activated!');
    saveState();
    renderAll();
}

function cheatTriggerInsiderTip() {
    if (typeof triggerInsiderTip === 'function') {
        const node = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];
        const willRise = Math.random() < 0.5;
        const magnitude = 0.15 + Math.random() * 0.25;

        gameState.activeInsiderTip = {
            symbol: node.symbol,
            willRise,
            magnitude,
            acted: false
        };
        gameState.insiderTipEndTime = Date.now() + 30000;

        const direction = willRise ? 'RISE' : 'FALL';
        showNotification(`🕵️ INSIDER TIP: ${node.symbol} will ${direction}!`);
        saveState();
        renderAll();
    }
}

function cheatTriggerIPO() {
    if (typeof triggerIPO === 'function') {
        triggerIPO();
    } else {
        showNotification('❌ IPO system not loaded!');
    }
}

// Economic Controls Cheats
function cheatSetInterestRate() {
    const rate = parseFloat(prompt('Set Interest Rate (0.01 to 0.15):', '0.05'));
    if (rate && rate >= 0.01 && rate <= 0.15) {
        if (!gameState.economicIndicators) gameState.economicIndicators = {};
        gameState.economicIndicators.interestRate = rate;
        showNotification(`📊 Interest Rate set to ${(rate * 100).toFixed(1)}%`);
        saveState();
        renderAll();
    }
}

function cheatSetInflation() {
    const rate = parseFloat(prompt('Set Inflation Rate (0.01 to 0.10):', '0.03'));
    if (rate && rate >= 0.01 && rate <= 0.10) {
        if (!gameState.economicIndicators) gameState.economicIndicators = {};
        gameState.economicIndicators.inflation = rate;
        showNotification(`💸 Inflation set to ${(rate * 100).toFixed(1)}%`);
        saveState();
        renderAll();
    }
}

function cheatSetGDP() {
    const rate = parseFloat(prompt('Set GDP Growth (-0.05 to 0.08):', '0.03'));
    if (rate && rate >= -0.05 && rate <= 0.08) {
        if (!gameState.economicIndicators) gameState.economicIndicators = {};
        gameState.economicIndicators.gdpGrowth = rate;
        showNotification(`📈 GDP Growth set to ${(rate * 100).toFixed(1)}%`);
        saveState();
        renderAll();
    }
}

function cheatSetUnemployment() {
    const rate = parseFloat(prompt('Set Unemployment Rate (0.02 to 0.12):', '0.04'));
    if (rate && rate >= 0.02 && rate <= 0.12) {
        if (!gameState.economicIndicators) gameState.economicIndicators = {};
        gameState.economicIndicators.unemployment = rate;
        showNotification(`👥 Unemployment set to ${(rate * 100).toFixed(1)}%`);
        saveState();
        renderAll();
    }
}

// Prestige & Unlocks Cheats
function cheatAddPrestigeLevel() {
    gameState.prestigeLevel = (gameState.prestigeLevel || 0) + 1;
    gameState.prestigePoints = (gameState.prestigePoints || 0) + 1000;
    showNotification(`⭐ Prestige Level ${gameState.prestigeLevel}!`);
    saveState();
    renderAll();
}

function cheatUnlockAllStocks() {
    if (!gameState.unlockedStocks) gameState.unlockedStocks = [];
    EQUITY_NODES.forEach(node => {
        if (!gameState.unlockedStocks.includes(node.symbol)) {
            gameState.unlockedStocks.push(node.symbol);
        }
    });
    showNotification('🔓 All stocks unlocked!');
    saveState();
    renderAll();
}

function cheatUnlockExclusiveStocks() {
    if (!gameState.unlockedExclusiveStocks) gameState.unlockedExclusiveStocks = [];
    gameState.unlockedExclusiveStocks.push('all_exclusive');

    // Add exclusive stocks to game
    if (typeof addExclusiveStocks === 'function') {
        addExclusiveStocks();
    }

    showNotification('💎 All exclusive stocks unlocked!');
    saveState();
    renderAll();
}

function cheatRemoveTaxes() {
    gameState.difficultyMode = 'easy'; // Easy mode has no taxes
    showNotification('💰 Taxes removed! (Set to Easy mode)');
    saveState();
    renderAll();
}

// News and Features Cheats
function cheatTriggerNews() {
    if (typeof generateNewsEvent === 'function') {
        // Force trigger news
        const node = EQUITY_NODES[Math.floor(Math.random() * EQUITY_NODES.length)];
        const sentimentType = Math.random() < 0.5 ? 'positive' : 'negative';
        const sentiment = NEWS_SENTIMENT[sentimentType];

        const headlines = {
            positive: [`${node.name} announces breakthrough innovation!`, `${node.symbol} reports record profits!`],
            negative: [`${node.name} faces lawsuit!`, `${node.symbol} reports losses!`]
        };

        const headline = headlines[sentimentType][0];
        const impact = sentiment.priceImpact.min + Math.random() * (sentiment.priceImpact.max - sentiment.priceImpact.min);

        node.currentPrice *= (1 + impact);
        node.newsImpact = {
            sentiment: sentimentType,
            headline,
            impact,
            endTime: Date.now() + sentiment.duration
        };

        showNotification(`📰 ${headline}`);
        saveState();
        renderAll();
    }
}

function cheatRemoveBadLuck() {
    gameState.badLuckCurse = false;
    gameState.badLuckEndTime = null;
    gameState.tradingBan = false;
    gameState.tradingBanEndTime = null;
    gameState.accountFrozen = false;
    gameState.accountFreezeEndTime = null;
    showNotification('✨ All bad luck effects removed!');
    saveState();
    renderAll();
}

function cheatClearMarginDebt() {
    gameState.marginDebt = 0;
    showNotification('💰 Margin debt cleared!');
    saveState();
    renderAll();
}

function cheatUnlockAllAchievements() {
    if (ACHIEVEMENT_CHAINS) {
        Object.keys(ACHIEVEMENT_CHAINS).forEach(chainId => {
            const chain = ACHIEVEMENT_CHAINS[chainId];
            gameState.achievementChains[chainId] = {
                currentStep: chain.steps.length,
                completed: chain.steps.map(s => s.id)
            };
        });
    }

    // Also unlock old achievements
    if (ACHIEVEMENTS) {
        ACHIEVEMENTS.forEach(achievement => {
            achievement.unlocked = true;
        });
    }

    showNotification('🏆 All achievements unlocked!');
    saveState();
    renderAll();
}

// ========================================
// CHEATS FOR NEW TRADING MECHANICS
// ========================================

function cheatEnableAllTrading() {
    gameState.shortSellingEnabled = true;
    gameState.optionsEnabled = true;
    gameState.afterHoursEnabled = true;
    gameState.marginEnabled = true;
    showNotification('🚀 All advanced trading features enabled!');
    saveState();
    renderAll();
}

function cheatAddCrypto() {
    if (typeof initializeCrypto === 'function') {
        initializeCrypto();
        showNotification('₿ Crypto markets added!');
    }
    saveState();
    renderAll();
}

function cheatTriggerEarnings() {
    if (typeof triggerEarningsReport === 'function') {
        triggerEarningsReport();
    }
}

function cheatTriggerDividend() {
    if (typeof payDividends === 'function') {
        // Force dividend payment
        const oldFreq = DIVIDEND_CONFIG.frequency;
        DIVIDEND_CONFIG.frequency = 1;
        payDividends();
        DIVIDEND_CONFIG.frequency = oldFreq;
    }
}

function cheatTriggerMerger() {
    if (typeof triggerMergerAcquisition === 'function') {
        triggerMergerAcquisition();
    }
}

function cheatTriggerSplit() {
    if (typeof triggerStockSplit === 'function') {
        triggerStockSplit();
    }
}

function cheatClearShorts() {
    if (gameState.shortPositions) {
        gameState.shortPositions = [];
        showNotification('📉 All short positions cleared!');
        saveState();
        renderAll();
    }
}

function cheatClearOptions() {
    if (gameState.optionPositions) {
        gameState.optionPositions = [];
        showNotification('📊 All options cleared!');
        saveState();
        renderAll();
    }
}

