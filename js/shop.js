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
        gameState.potions = { speedBoost: 0, profitMultiplier: 0, luckBoost: 0, dividendBoost: 0 };
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

    // Potions can now stack - no check for already active
    gameState.potions[potionKey]--;

    const activePotion = {
        type: potionKey,
        effect: potion.effect,
        endTime: Date.now() + potion.duration,
        expired: false
    };

    gameState.activePotions.push(activePotion);

    showNotification(`${potion.icon} Activated ${potion.name}!`);
    playSound('achievement');
    createConfetti();
    saveState();
    renderShop();
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
            gameState.potions = { speedBoost: 0, profitMultiplier: 0, luckBoost: 0, dividendBoost: 0 };
        }
        gameState.potions.speedBoost++;
        gameState.potions.profitMultiplier++;
        gameState.potions.luckBoost++;
        gameState.potions.dividendBoost++;
        showNotification('🎁 Redeemed! +1 of each potion!');
    } else if (reward.type === 'cheat_menu') {
        gameState.cheatMenuUnlocked = true;
        showNotification('🎮 Cheat Menu Unlocked!');
        showCheatButton();
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

