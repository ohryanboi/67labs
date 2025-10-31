// Progression System (Ranks, Tiers, Achievements, Challenges)

// Calculate wealth zone score
function calculateWealthZoneScore() {
    return gameState.digitalReserve + gameState.activeStrategies.reduce((sum, s) => sum + s.currentValue, 0);
}

// Update tier based on wealth
function updateTier() {
    const wealth = calculateWealthZoneScore();
    
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (wealth >= TIERS[i].threshold) {
            gameState.currentTier = i;
            break;
        }
    }
}

// Calculate rank points
function calculateRankPoints() {
    let points = 0;

    // Points from completed trades
    points += gameState.completedCycles.length * 10;

    // Points from wealth
    const wealth = calculateWealthZoneScore();
    points += Math.floor(wealth / 10000);

    // Points from milestones
    points += gameState.milestones.length * 100;

    // Points from achievements
    points += (gameState.secretAchievements || []).length * 150;

    return Math.floor(points);
}

// Update rank
function updateRank(manualPoints = null) {
    // If manual points provided (from cheats), use those
    // Otherwise, calculate based on game stats
    if (manualPoints !== null) {
        gameState.rankPoints = manualPoints;
    } else {
        // Recalculate points based on current game state
        const calculatedPoints = calculateRankPoints();
        // Only update if calculated is higher (prevents losing RP from cheats)
        if (calculatedPoints > gameState.rankPoints) {
            gameState.rankPoints = calculatedPoints;
        }
    }

    const points = gameState.rankPoints;

    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (points >= RANKS[i].pointsRequired) {
            if (gameState.currentRank < i) {
                gameState.currentRank = i;
                showNotification(`🎉 Rank Up! You are now ${RANKS[i].name}!`);
                playSound('achievement');
                createConfetti();
            }
            gameState.currentRank = i;
            break;
        }
    }
}

// Check milestones
function checkMilestones() {
    MILESTONES.forEach(milestone => {
        if (milestone.unlocked) return;

        let unlocked = false;

        switch(milestone.id) {
            case 'first_trade':
                unlocked = gameState.completedCycles.length >= 1;
                break;
            case 'ten_trades':
                unlocked = gameState.completedCycles.length >= 10;
                break;
            case 'hundred_trades':
                unlocked = gameState.completedCycles.length >= 100;
                break;
            case 'first_profit':
                unlocked = gameState.completedCycles.some(c => c.performanceMetric > 0);
                break;
            case 'thousand_profit':
                unlocked = gameState.completedCycles.some(c => c.performanceMetric >= 1000);
                break;
            case 'diversified':
                unlocked = gameState.tradedSectors && gameState.tradedSectors.size >= 10;
                break;
            case 'quick_flip':
                unlocked = gameState.completedCycles.some(c => c.quickFlip);
                break;
            case 'diamond_hands':
                unlocked = gameState.completedCycles.some(c => c.holdTime >= 3600000); // 1 hour
                break;
            case 'millionaire':
                unlocked = calculateWealthZoneScore() >= 1000000;
                break;
            case 'speed_demon':
                if (gameState.ultraSpeedStartTime) {
                    const ultraSpeedDuration = Date.now() - gameState.ultraSpeedStartTime;
                    unlocked = ultraSpeedDuration >= 300000; // 5 minutes
                }
                break;
        }

        if (unlocked) {
            milestone.unlocked = true;
            gameState.milestones.push(milestone.id);
            showNotification(`🏆 Milestone Unlocked: ${milestone.name}!`);
            playSound('achievement');
            createConfetti();
        }
    });
}

// Daily Challenges
function generateDailyChallenge() {
    const today = new Date().toDateString();
    
    if (gameState.lastChallengeDate === today && gameState.dailyChallenge) {
        return; // Already have today's challenge
    }

    const challenges = [
        { id: 'profit_5k', name: 'Profit Master', description: 'Make $5,000 profit today', target: 5000, reward: 500, type: 'profit' },
        { id: 'trades_10', name: 'Active Trader', description: 'Complete 10 trades today', target: 10, reward: 300, type: 'trades' },
        { id: 'hold_1h', name: 'Patient Investor', description: 'Hold a position for 1 hour', target: 3600000, reward: 400, type: 'hold' },
        { id: 'diversify_5', name: 'Diversification', description: 'Trade in 5 different sectors today', target: 5, reward: 350, type: 'sectors' },
        { id: 'profit_10pct', name: 'Big Win', description: 'Make a trade with 10%+ profit', target: 10, reward: 450, type: 'percent' },
        { id: 'volume_50k', name: 'High Volume', description: 'Trade $50,000 worth of stocks', target: 50000, reward: 600, type: 'volume' },
        { id: 'no_loss', name: 'Perfect Day', description: 'Complete 5 trades without a loss', target: 5, reward: 700, type: 'no_loss' }
    ];

    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    gameState.dailyChallenge = challenge;
    gameState.dailyChallengeProgress = 0;
    gameState.lastChallengeDate = today;
    
    saveState();
}

function updateDailyChallengeProgress(action) {
    if (!gameState.dailyChallenge) return;

    const challenge = gameState.dailyChallenge;

    // Update progress based on challenge type
    if (challenge.type === 'trades' && action === 'trade') {
        gameState.dailyChallengeProgress++;
    }

    // Check if completed
    if (gameState.dailyChallengeProgress >= challenge.target) {
        gameState.rankPoints += challenge.reward;
        showNotification(`🎯 Daily Challenge Complete! +${challenge.reward} RP`);
        playSound('achievement');
        createConfetti();
        gameState.dailyChallenge = null;
        saveState();
    }
}

function checkDailyChallenge() {
    if (!gameState.dailyChallenge) return;

    const challenge = gameState.dailyChallenge;
    let progress = 0;

    switch(challenge.type) {
        case 'profit':
            const todayProfit = gameState.completedCycles
                .filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString())
                .reduce((sum, c) => sum + c.performanceMetric, 0);
            progress = todayProfit;
            break;
        case 'trades':
            progress = gameState.completedCycles
                .filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString())
                .length;
            break;
        case 'hold':
            const longestHold = Math.max(...gameState.activeStrategies.map(s => Date.now() - (s.acquireTime || Date.now())), 0);
            progress = longestHold;
            break;
        case 'sectors':
            const todaySectors = new Set(gameState.completedCycles
                .filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString())
                .map(c => c.sector));
            progress = todaySectors.size;
            break;
        case 'percent':
            const bestPercent = Math.max(...gameState.completedCycles
                .filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString())
                .map(c => c.performancePercent), 0);
            progress = bestPercent;
            break;
        case 'volume':
            const todayVolume = gameState.completedCycles
                .filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString())
                .reduce((sum, c) => sum + c.sellValue, 0);
            progress = todayVolume;
            break;
        case 'no_loss':
            const todayTrades = gameState.completedCycles
                .filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString());
            const profitableTrades = todayTrades.filter(c => c.performanceMetric > 0);
            progress = todayTrades.length === profitableTrades.length ? profitableTrades.length : 0;
            break;
    }

    gameState.dailyChallengeProgress = progress;

    if (progress >= challenge.target) {
        gameState.rankPoints += challenge.reward;
        showNotification(`🎯 Daily Challenge Complete! +${challenge.reward} RP`);
        playSound('achievement');
        createConfetti();
        gameState.dailyChallenge = null;
        saveState();
    }
}

// Secret Achievements
function checkSecretAchievements() {
    if (!gameState.secretAchievements) gameState.secretAchievements = [];

    SECRET_ACHIEVEMENTS.forEach(achievement => {
        if (gameState.secretAchievements.includes(achievement.id)) return;

        let unlocked = false;

        switch(achievement.id) {
            case 'night_owl':
                const hour = new Date().getHours();
                unlocked = (hour >= 0 && hour < 6) && gameState.completedCycles.length > 0;
                break;
            case 'comeback_kid':
                const minWealth = Math.min(...(gameState.wealthHistory || [calculateWealthZoneScore()]));
                const currentWealth = calculateWealthZoneScore();
                unlocked = minWealth < STARTER_CAPITAL * 0.5 && currentWealth > STARTER_CAPITAL;
                break;
            case 'risk_taker':
                unlocked = gameState.activeStrategies.some(s => {
                    const node = EQUITY_NODES.find(n => n.symbol === s.symbol);
                    return node && node.volatility === 'extreme';
                });
                break;
            case 'diversification_master':
                unlocked = gameState.tradedSectors && gameState.tradedSectors.size >= 23;
                break;
            case 'speed_trader':
                const recentTrades = gameState.completedCycles.slice(-10);
                unlocked = recentTrades.length === 10 && recentTrades.every(t => t.quickFlip);
                break;
            case 'profit_streak':
                const last5 = gameState.completedCycles.slice(-5);
                unlocked = last5.length === 5 && last5.every(t => t.performanceMetric > 0);
                break;
            case 'whale':
                unlocked = gameState.activeStrategies.some(s => s.investedCapital >= 100000);
                break;
            case 'sector_specialist':
                if (gameState.profitBySector) {
                    unlocked = Object.values(gameState.profitBySector).some(profit => profit >= 50000);
                }
                break;
            case 'marathon_trader':
                unlocked = gameState.completedCycles.length >= 1000;
                break;
            case 'perfect_timing':
                unlocked = gameState.completedCycles.some(t => t.performancePercent >= 50);
                break;
            case 'diamond_portfolio':
                unlocked = gameState.activeStrategies.length >= 20;
                break;
            case 'market_master':
                unlocked = gameState.completedCycles.length >= 500 &&
                          (gameState.totalWins / (gameState.totalWins + gameState.totalLosses)) >= 0.7;
                break;
            case 'achievement_hunter':
                unlocked = gameState.secretAchievements.length >= 10;
                break;
            case 'legendary_trader':
                unlocked = gameState.currentRank >= 29 && calculateWealthZoneScore() >= 10000000;
                break;
            case 'infinite_trader':
                unlocked = gameState.currentRank >= 59; // Infinite I rank
                break;
        }

        if (unlocked) {
            gameState.secretAchievements.push(achievement.id);
            gameState.achievementPoints += achievement.points;
            showNotification(`🌟 Secret Achievement: ${achievement.name}!`);
            playSound('achievement');
            createConfetti();
            saveState();
        }
    });
}

// Login Streak
function checkLoginStreak() {
    const today = new Date().toDateString();
    const lastLogin = gameState.lastLoginDate;

    if (lastLogin === today) {
        return; // Already logged in today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastLogin === yesterdayStr) {
        // Consecutive day
        gameState.loginStreak = (gameState.loginStreak || 0) + 1;
    } else {
        // Streak broken
        gameState.loginStreak = 1;
    }

    gameState.lastLoginDate = today;

    // Reward for streak
    const streakBonus = Math.floor(gameState.loginStreak / 7) * 500; // $500 per week
    if (streakBonus > 0) {
        gameState.digitalReserve += streakBonus;
        showNotification(`🔥 ${gameState.loginStreak} day streak! Bonus: ${formatCurrency(streakBonus)}`);
    }

    saveState();
}

// Statistics Helper Functions
function getWinLossRatio() {
    const wins = gameState.totalWins || 0;
    const losses = gameState.totalLosses || 0;
    if (losses === 0) return wins > 0 ? wins : 0;
    return (wins / losses).toFixed(2);
}

function getWinRate() {
    const wins = gameState.totalWins || 0;
    const losses = gameState.totalLosses || 0;
    const total = wins + losses;
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
}

function getAverageHoldTime() {
    const totalTrades = gameState.completedCycles.length;
    if (totalTrades === 0) return 0;

    const totalHoldTime = gameState.totalHoldTime || 0;
    return totalHoldTime / totalTrades;
}

function getProfitBySectorSorted() {
    if (!gameState.profitBySector) return [];

    return Object.entries(gameState.profitBySector)
        .map(([sector, profit]) => ({ sector, profit }))
        .sort((a, b) => b.profit - a.profit);
}

// Prestige system removed - now using extended rank system instead

