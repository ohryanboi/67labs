// Theme and Customization System

// Apply theme
function applyTheme(themeKey) {
    if (!gameState.unlockedThemes.includes(themeKey)) {
        showNotification('❌ Theme not unlocked yet!');
        return;
    }

    gameState.currentTheme = themeKey;
    const theme = THEMES[themeKey];

    // Apply CSS variables
    document.documentElement.style.setProperty('--primary-color', theme.colors.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.colors.secondary);
    document.documentElement.style.setProperty('--background-color', theme.colors.background);
    document.documentElement.style.setProperty('--card-bg', theme.colors.cardBg);
    document.documentElement.style.setProperty('--positive-color', theme.colors.positive);
    document.documentElement.style.setProperty('--negative-color', theme.colors.negative);

    // Apply background
    if (gameState.darkMode !== false) {
        document.body.style.background = `linear-gradient(135deg, ${theme.colors.background} 0%, #1a1a24 100%)`;
    }

    showNotification(`🎨 ${theme.name} theme applied!`);
    saveState();
    renderSettings();
}

// Check theme unlocks
function checkThemeUnlocks() {
    const wealthZone = calculateWealthZoneScore();
    const totalAchievements = (gameState.secretAchievements || []).length + gameState.milestones.length;

    // Matrix theme - $500k wealth
    if (wealthZone >= 500000 && !gameState.unlockedThemes.includes('matrix')) {
        gameState.unlockedThemes.push('matrix');
        showNotification('🎨 Unlocked Matrix theme!');
        playSound('achievement');
    }

    // Cyberpunk theme - Master rank
    if (gameState.currentRank >= 18 && !gameState.unlockedThemes.includes('cyberpunk')) {
        gameState.unlockedThemes.push('cyberpunk');
        showNotification('🎨 Unlocked Cyberpunk theme!');
        playSound('achievement');
    }

    // Neon theme - 20 achievements
    if (totalAchievements >= 20 && !gameState.unlockedThemes.includes('neon')) {
        gameState.unlockedThemes.push('neon');
        showNotification('🎨 Unlocked Neon theme!');
        playSound('achievement');
    }
}

// Badge & Title System
function equipBadge(badgeId) {
    if (!gameState.unlockedBadges.includes(badgeId)) {
        showNotification('❌ Badge not unlocked yet!');
        return;
    }

    gameState.activeBadge = badgeId;
    const badge = BADGES.find(b => b.id === badgeId);
    showNotification(`${badge.icon} Equipped ${badge.name} badge!`);
    saveState();
    renderSettings();
}

function equipTitle(titleId) {
    if (!gameState.unlockedBadges.includes(titleId)) {
        showNotification('❌ Title not unlocked yet!');
        return;
    }

    gameState.activeTitle = titleId;
    const title = TITLES.find(t => t.id === titleId);
    showNotification(`✨ Equipped "${title.name}" title!`);
    saveState();
    renderSettings();
}

function checkBadgeUnlocks() {
    const wealthZone = calculateWealthZoneScore();
    const totalTrades = gameState.completedCycles.length;

    if (!gameState.unlockedBadges) gameState.unlockedBadges = [];

    // First trade
    if (totalTrades >= 1 && !gameState.unlockedBadges.includes('first_trade')) {
        gameState.unlockedBadges.push('first_trade');
        gameState.unlockedBadges.push('novice'); // Title
        showNotification('🏅 Unlocked "First Steps" badge!');
    }

    // Day trader
    if (totalTrades >= 100 && !gameState.unlockedBadges.includes('day_trader')) {
        gameState.unlockedBadges.push('day_trader');
        gameState.unlockedBadges.push('trader'); // Title
        showNotification('🏅 Unlocked "Day Trader" badge!');
    }

    // Whale
    if (wealthZone >= 1000000 && !gameState.unlockedBadges.includes('whale')) {
        gameState.unlockedBadges.push('whale');
        gameState.unlockedBadges.push('millionaire'); // Title
        showNotification('🏅 Unlocked "Whale" badge!');
    }

    // Diamond hands
    const hasLongHold = gameState.completedCycles.some(c => c.holdTime >= 3600000);
    if (hasLongHold && !gameState.unlockedBadges.includes('diamond_hands')) {
        gameState.unlockedBadges.push('diamond_hands');
        showNotification('🏅 Unlocked "Diamond Hands" badge!');
    }

    // Speed demon
    if (gameState.milestones.includes('speed_demon') && !gameState.unlockedBadges.includes('speed_demon')) {
        gameState.unlockedBadges.push('speed_demon');
        showNotification('🏅 Unlocked "Speed Demon" badge!');
    }

    // Diversified
    if (gameState.tradedSectors && gameState.tradedSectors.size >= 23 && !gameState.unlockedBadges.includes('diversified')) {
        gameState.unlockedBadges.push('diversified');
        gameState.unlockedBadges.push('sector_specialist'); // Title
        showNotification('🏅 Unlocked "Diversified" badge!');
    }

    // Profit master
    const totalProfit = gameState.completedCycles.reduce((sum, c) => sum + (c.performanceMetric > 0 ? c.performanceMetric : 0), 0);
    if (totalProfit >= 500000 && !gameState.unlockedBadges.includes('profit_master')) {
        gameState.unlockedBadges.push('profit_master');
        showNotification('🏅 Unlocked "Profit Master" badge!');
    }

    // Rank master
    if (gameState.currentRank >= 19 && !gameState.unlockedBadges.includes('rank_master')) {
        gameState.unlockedBadges.push('rank_master');
        gameState.unlockedBadges.push('immortal'); // Title
        showNotification('🏅 Unlocked "Rank Master" badge!');
    }

    // Achievement hunter
    if ((gameState.secretAchievements || []).length >= 15 && !gameState.unlockedBadges.includes('achievement_hunter')) {
        gameState.unlockedBadges.push('achievement_hunter');
        showNotification('🏅 Unlocked "Achievement Hunter" badge!');
    }

    // Unlock badges for higher ranks
    if (gameState.currentRank >= 32 && !gameState.unlockedBadges.includes('divine_trader')) {
        gameState.unlockedBadges.push('divine_trader');
        gameState.unlockedBadges.push('divine'); // Title
        showNotification('🏅 Unlocked "Divine Trader" badge!');
    }

    if (gameState.currentRank >= 41 && !gameState.unlockedBadges.includes('cosmic_lord')) {
        gameState.unlockedBadges.push('cosmic_lord');
        gameState.unlockedBadges.push('cosmic'); // Title
        showNotification('🏅 Unlocked "Cosmic Lord" badge!');
    }

    if (gameState.currentRank >= 59 && !gameState.unlockedBadges.includes('infinite_master')) {
        gameState.unlockedBadges.push('infinite_master');
        gameState.unlockedBadges.push('infinite'); // Title
        showNotification('🏅 Unlocked "Infinite Master" badge!');
    }

    // Unlock titles based on ranks
    if (gameState.currentRank >= 3 && !gameState.unlockedBadges.includes('expert')) {
        gameState.unlockedBadges.push('expert');
    }

    if (gameState.currentRank >= 9 && !gameState.unlockedBadges.includes('master')) {
        gameState.unlockedBadges.push('master');
    }

    if (gameState.currentRank >= 15 && !gameState.unlockedBadges.includes('legend')) {
        gameState.unlockedBadges.push('legend');
    }

    // Unlock titles based on wealth
    if (wealthZone >= 5000000 && !gameState.unlockedBadges.includes('tycoon')) {
        gameState.unlockedBadges.push('tycoon');
    }

    // Unlock titles based on trades
    if (totalTrades >= 500 && !gameState.unlockedBadges.includes('market_maker')) {
        gameState.unlockedBadges.push('market_maker');
    }

    // Comeback kid title
    if (gameState.secretAchievements && gameState.secretAchievements.includes('comeback_kid') && !gameState.unlockedBadges.includes('comeback_kid')) {
        gameState.unlockedBadges.push('comeback_kid');
    }
}

