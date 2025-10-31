// Game Configuration
const STARTER_CAPITAL = 100000;

// ========================================
// UPDATE LOG - CUSTOMIZE THIS SECTION
// ========================================
// Change the version number and update notes below
// The update log will show every time the game loads
const UPDATE_LOG = {
    version: "1.0.1",
    date: "2025-10-31",
    title: "67 Labs Update 1.0.1 MANGO MANGO",
    updates: [
        "Added codes to redemeem. Use code 67Labs to get $10,000",
        "Added a shop with potions and boosts.",
        "Autosell and Autobuy",
        "SECRET ACHIEVEMENTS",
        "secret codes!!!"
    ],
    showOnLoad: true // Set to false to disable the update log popup
};
// ========================================

// Ascension Tiers (based on wealth)
const TIERS = [
    { name: 'Bronze Strategist', icon: '🥉', threshold: 0 },
    { name: 'Silver Analyst', icon: '🥈', threshold: 125000 },
    { name: 'Gold Trader', icon: '🥇', threshold: 150000 },
    { name: 'Platinum Investor', icon: '💎', threshold: 200000 },
    { name: 'Diamond Mogul', icon: '💠', threshold: 300000 },
    { name: 'Elite Market Master', icon: '👑', threshold: 500000 }
];

// Competitive Ranks (based on performance points)
// Each rank has 3 divisions: III (lowest), II, I (highest)
const RANKS = [
    // Rank 1: Novice (0-299 points)
    { name: 'Novice III', icon: '🥉', color: '#8B4513', pointsRequired: 0 },
    { name: 'Novice II', icon: '🥉', color: '#A0522D', pointsRequired: 100 },
    { name: 'Novice I', icon: '🥉', color: '#CD853F', pointsRequired: 200 },

    // Rank 2: Apprentice (300-599 points)
    { name: 'Apprentice III', icon: '🥈', color: '#A9A9A9', pointsRequired: 300 },
    { name: 'Apprentice II', icon: '🥈', color: '#C0C0C0', pointsRequired: 400 },
    { name: 'Apprentice I', icon: '🥈', color: '#D3D3D3', pointsRequired: 500 },

    // Rank 3: Trader (600-999 points)
    { name: 'Trader III', icon: '🥇', color: '#DAA520', pointsRequired: 600 },
    { name: 'Trader II', icon: '🥇', color: '#FFD700', pointsRequired: 750 },
    { name: 'Trader I', icon: '🥇', color: '#FFA500', pointsRequired: 900 },

    // Rank 4: Analyst (1000-1499 points)
    { name: 'Analyst III', icon: '💠', color: '#4169E1', pointsRequired: 1000 },
    { name: 'Analyst II', icon: '💠', color: '#1E90FF', pointsRequired: 1200 },
    { name: 'Analyst I', icon: '💠', color: '#00BFFF', pointsRequired: 1400 },

    // Rank 5: Expert (1500-2199 points)
    { name: 'Expert III', icon: '⭐', color: '#00CED1', pointsRequired: 1500 },
    { name: 'Expert II', icon: '⭐', color: '#00E5EE', pointsRequired: 1750 },
    { name: 'Expert I', icon: '⭐', color: '#00FFFF', pointsRequired: 2000 },

    // Rank 6: Master (2200-3199 points)
    { name: 'Master III', icon: '💫', color: '#8A2BE2', pointsRequired: 2200 },
    { name: 'Master II', icon: '💫', color: '#9370DB', pointsRequired: 2600 },
    { name: 'Master I', icon: '💫', color: '#BA55D3', pointsRequired: 3000 },

    // Rank 7: Elite (3200-4499 points)
    { name: 'Elite III', icon: '💎', color: '#00CED1', pointsRequired: 3200 },
    { name: 'Elite II', icon: '💎', color: '#00E5EE', pointsRequired: 3700 },
    { name: 'Elite I', icon: '💎', color: '#00FFFF', pointsRequired: 4200 },

    // Rank 8: Champion (4500-6499 points)
    { name: 'Champion III', icon: '🏆', color: '#FF1493', pointsRequired: 4500 },
    { name: 'Champion II', icon: '🏆', color: '#FF69B4', pointsRequired: 5200 },
    { name: 'Champion I', icon: '🏆', color: '#FFB6C1', pointsRequired: 6000 },

    // Rank 9: Legend (6500-9999 points)
    { name: 'Legend III', icon: '👑', color: '#FF4500', pointsRequired: 6500 },
    { name: 'Legend II', icon: '👑', color: '#FF6347', pointsRequired: 7500 },
    { name: 'Legend I', icon: '👑', color: '#FF7F50', pointsRequired: 9000 },

    // Rank 10: Immortal (10000+ points)
    { name: 'Immortal III', icon: '🌟', color: '#FFD700', pointsRequired: 10000 },
    { name: 'Immortal II', icon: '🌟', color: '#FFEA00', pointsRequired: 15000 },
    { name: 'Immortal I', icon: '🌟', color: '#FFFF00', pointsRequired: 25000 }
];

// Milestones
const MILESTONES = [
    // Beginner Milestones
    { id: 'first_acquisition', name: 'First Acquisition', desc: 'Acquire your first Equity Node', icon: '🎯', unlocked: false },
    { id: 'in_the_green', name: 'In The Green', desc: 'Complete a profitable Cycle', icon: '💚', unlocked: false },
    { id: 'first_loss', name: 'Learning Experience', desc: 'Complete a losing trade (it happens!)', icon: '📉', unlocked: false },
    { id: 'quick_flip', name: 'Quick Flip', desc: 'Buy and sell within 30 seconds', icon: '⚡', unlocked: false },

    // Trading Volume
    { id: 'active_trader', name: 'Active Trader', desc: 'Complete 10 trades', icon: '📈', unlocked: false },
    { id: 'veteran', name: 'Veteran Trader', desc: 'Complete 50 trades', icon: '⭐', unlocked: false },
    { id: 'master_trader', name: 'Master Trader', desc: 'Complete 100 trades', icon: '🏆', unlocked: false },
    { id: 'legendary', name: 'Legendary Trader', desc: 'Complete 250 trades', icon: '👑', unlocked: false },

    // Performance
    { id: 'ten_percent', name: '10% Gains', desc: 'Achieve 10% Performance Metric', icon: '🚀', unlocked: false },
    { id: 'twenty_five_percent', name: '25% Gains', desc: 'Achieve 25% Performance Metric', icon: '💫', unlocked: false },
    { id: 'fifty_percent', name: '50% Gains', desc: 'Achieve 50% Performance Metric', icon: '🌟', unlocked: false },
    { id: 'double_money', name: 'Double or Nothing', desc: 'Achieve 100% Performance Metric', icon: '💰', unlocked: false },

    // Wealth Milestones
    { id: 'growing_wealth', name: 'Growing Wealth', desc: 'Reach $150,000', icon: '💎', unlocked: false },
    { id: 'six_figure', name: 'Six Figure Portfolio', desc: 'Reach $200,000', icon: '👑', unlocked: false },
    { id: 'quarter_million', name: 'Quarter Million', desc: 'Reach $250,000', icon: '💵', unlocked: false },
    { id: 'half_million', name: 'Half Million', desc: 'Reach $500,000', icon: '🤑', unlocked: false },
    { id: 'millionaire', name: 'Millionaire Status', desc: 'Reach $1,000,000', icon: '🏅', unlocked: false },

    // Strategy & Skill
    { id: 'diversified', name: 'Diversified Portfolio', desc: 'Hold 5 Active Strategies', icon: '🎨', unlocked: false },
    { id: 'mega_portfolio', name: 'Mega Portfolio', desc: 'Hold 10 Active Strategies', icon: '🌈', unlocked: false },
    { id: 'perfect_week', name: 'Perfect Week', desc: '5 profitable trades in a row', icon: '🔥', unlocked: false },
    { id: 'hot_streak', name: 'Hot Streak', desc: '10 profitable trades in a row', icon: '🔥🔥', unlocked: false },
    { id: 'big_win', name: 'Big Win', desc: 'Make $10,000 profit on a single trade', icon: '💸', unlocked: false },
    { id: 'whale_trade', name: 'Whale Trade', desc: 'Make $50,000 profit on a single trade', icon: '🐋', unlocked: false },

    // Market Knowledge
    { id: 'market_watcher', name: 'Market Watcher', desc: 'Add 10 to Focus Stream', icon: '👁️', unlocked: false },
    { id: 'market_expert', name: 'Market Expert', desc: 'Add 20 to Focus Stream', icon: '🔍', unlocked: false },
    { id: 'sector_specialist', name: 'Sector Specialist', desc: 'Trade in 20 different sectors', icon: '🎓', unlocked: false },
    { id: 'speed_demon', name: 'Speed Demon', desc: 'Use Ultra speed for 5 minutes', icon: '⚡⚡', unlocked: false },
    { id: 'patient_investor', name: 'Patient Investor', desc: 'Hold a position for 100 price updates', icon: '🧘', unlocked: false },
    
    // Rank Achievements
    { id: 'rank_trader', name: 'Ranked Trader', desc: 'Reach Trader rank', icon: '📈', unlocked: false },
    { id: 'rank_expert', name: 'Expert Status', desc: 'Reach Expert rank', icon: '⭐', unlocked: false },
    { id: 'rank_master', name: 'Master Trader', desc: 'Reach Master rank', icon: '💫', unlocked: false },
    { id: 'rank_elite', name: 'Elite Trader', desc: 'Reach Elite rank', icon: '💎', unlocked: false },
    { id: 'rank_legend', name: 'Legendary', desc: 'Reach Legend rank', icon: '👑', unlocked: false },
    { id: 'rank_immortal', name: 'Immortal', desc: 'Reach Immortal rank', icon: '🌟', unlocked: false }
];

// Secret Achievements
const SECRET_ACHIEVEMENTS = [
    { id: 'night_owl', name: 'Night Owl', description: 'Trade between midnight and 6 AM', icon: '🦉', points: 50 },
    { id: 'comeback_kid', name: 'Comeback Kid', description: 'Recover from 50% loss to profit', icon: '💪', points: 100 },
    { id: 'risk_taker', name: 'Risk Taker', description: 'Trade an extreme volatility stock', icon: '🎲', points: 50 },
    { id: 'sector_master', name: 'Sector Master', description: 'Trade in all 23 sectors', icon: '🌐', points: 150 },
    { id: 'speed_trader', name: 'Speed Trader', description: 'Complete 100 trades on Ultra speed', icon: '⚡', points: 100 },
    { id: 'patient_investor', name: 'Patient Investor', description: 'Hold a position for 2 hours', icon: '⏰', points: 75 },
    { id: 'day_trader', name: 'Day Trader', description: 'Complete 50 trades in one session', icon: '📈', points: 100 },
    { id: 'marathon_trader', name: 'Marathon Trader', description: 'Complete 1000 total trades', icon: '🏃', points: 200 },
    { id: 'perfect_timing', name: 'Perfect Timing', description: 'Make a trade with 50%+ profit', icon: '🎯', points: 100 },
    { id: 'diamond_portfolio', name: 'Diamond Portfolio', description: 'Hold 20 positions simultaneously', icon: '💎', points: 150 },
    { id: 'market_master', name: 'Market Master', description: '500 trades with 70%+ win rate', icon: '👑', points: 250 },
    { id: 'prestige_hunter', name: 'Prestige Hunter', description: 'Prestige at least once', icon: '🌟', points: 200 },
    { id: 'achievement_hunter', name: 'Achievement Hunter', description: 'Unlock 10 secret achievements', icon: '🏆', points: 300 },
    { id: 'legendary_trader', name: 'Legendary Trader', description: 'Reach Legend rank with $10M wealth', icon: '👑', points: 500 },
    { id: 'code_master', name: 'Code Master', description: 'Redeem all available codes', icon: '🎁', points: 50 }
];

// Equity Nodes
const EQUITY_NODES = [
    // Technology (5)
    { symbol: 'TECH-A', name: 'TechCorp Alpha', sector: 'Technology', basePrice: 150, volatility: 'moderate', pulse: 'bullish' },
    { symbol: 'SOFT-B', name: 'SoftNode Beta', sector: 'Technology', basePrice: 185, volatility: 'high', pulse: 'bullish' },
    { symbol: 'CHIP-C', name: 'ChipNode Gamma', sector: 'Technology', basePrice: 275, volatility: 'moderate', pulse: 'neutral' },
    { symbol: 'CLUD-D', name: 'CloudEdge Delta', sector: 'Technology', basePrice: 195, volatility: 'high', pulse: 'bullish' },
    { symbol: 'ROBO-E', name: 'RoboNode Epsilon', sector: 'Technology', basePrice: 340, volatility: 'extreme', pulse: 'volatile' },

    // Finance (4)
    { symbol: 'FINX-F', name: 'FinanceX Zeta', sector: 'Finance', basePrice: 220, volatility: 'low', pulse: 'neutral' },
    { symbol: 'BANK-G', name: 'BankNode Eta', sector: 'Finance', basePrice: 165, volatility: 'low', pulse: 'bullish' },
    { symbol: 'INSU-H', name: 'InsureNode Theta', sector: 'Finance', basePrice: 145, volatility: 'low', pulse: 'neutral' },
    { symbol: 'INVT-I', name: 'InvestEdge Iota', sector: 'Finance', basePrice: 198, volatility: 'moderate', pulse: 'bearish' },

    // Healthcare (3)
    { symbol: 'HLTH-J', name: 'HealthNode Kappa', sector: 'Healthcare', basePrice: 180, volatility: 'moderate', pulse: 'bullish' },
    { symbol: 'PHRM-K', name: 'PharmaNode Lambda', sector: 'Healthcare', basePrice: 225, volatility: 'high', pulse: 'volatile' },
    { symbol: 'BIOT-L', name: 'BioNode Mu', sector: 'Healthcare', basePrice: 310, volatility: 'extreme', pulse: 'bullish' },

    // Energy (3)
    { symbol: 'ENRG-M', name: 'EnergyFlow Nu', sector: 'Energy', basePrice: 95, volatility: 'high', pulse: 'volatile' },
    { symbol: 'SOLR-N', name: 'SolarNode Xi', sector: 'Energy', basePrice: 125, volatility: 'high', pulse: 'bullish' },
    { symbol: 'OILX-O', name: 'OilEdge Omicron', sector: 'Energy', basePrice: 88, volatility: 'moderate', pulse: 'bearish' },

    // Consumer (3)
    { symbol: 'CONS-P', name: 'ConsumerEdge Pi', sector: 'Consumer', basePrice: 130, volatility: 'low', pulse: 'neutral' },
    { symbol: 'RETL-Q', name: 'RetailNode Rho', sector: 'Consumer', basePrice: 155, volatility: 'moderate', pulse: 'bullish' },
    { symbol: 'LUXE-R', name: 'LuxuryNode Sigma', sector: 'Consumer', basePrice: 285, volatility: 'moderate', pulse: 'neutral' },

    // Industrial (2)
    { symbol: 'INDU-S', name: 'IndustryNode Tau', sector: 'Industrial', basePrice: 175, volatility: 'moderate', pulse: 'bearish' },
    { symbol: 'MNFG-T', name: 'ManufactNode Upsilon', sector: 'Industrial', basePrice: 142, volatility: 'low', pulse: 'neutral' },

    // Real Estate (2)
    { symbol: 'REAL-U', name: 'RealtyNode Phi', sector: 'Real Estate', basePrice: 210, volatility: 'low', pulse: 'bullish' },
    { symbol: 'PROP-V', name: 'PropertyEdge Chi', sector: 'Real Estate', basePrice: 178, volatility: 'low', pulse: 'neutral' },

    // Utilities (2)
    { symbol: 'UTIL-W', name: 'UtilityFlow Psi', sector: 'Utilities', basePrice: 85, volatility: 'low', pulse: 'neutral' },
    { symbol: 'WATR-X', name: 'WaterNode Omega', sector: 'Utilities', basePrice: 92, volatility: 'low', pulse: 'bullish' },

    // Materials (2)
    { symbol: 'MATL-Y', name: 'MaterialNode Alpha-2', sector: 'Materials', basePrice: 140, volatility: 'high', pulse: 'volatile' },
    { symbol: 'METL-Z', name: 'MetalEdge Beta-2', sector: 'Materials', basePrice: 118, volatility: 'moderate', pulse: 'bearish' },

    // Telecom (2)
    { symbol: 'TELE-AA', name: 'TelecomEdge Gamma-2', sector: 'Telecom', basePrice: 160, volatility: 'moderate', pulse: 'neutral' },
    { symbol: 'NETW-AB', name: 'NetworkNode Delta-2', sector: 'Telecom', basePrice: 135, volatility: 'low', pulse: 'bullish' },

    // Crypto (2)
    { symbol: 'CRYP-AC', name: 'CryptoNode Epsilon-2', sector: 'Crypto', basePrice: 320, volatility: 'extreme', pulse: 'volatile' },
    { symbol: 'BLOK-AD', name: 'BlockNode Zeta-2', sector: 'Crypto', basePrice: 425, volatility: 'extreme', pulse: 'bullish' },

    // Gaming (2)
    { symbol: 'GAME-AE', name: 'GameNode Eta-2', sector: 'Gaming', basePrice: 190, volatility: 'high', pulse: 'bullish' },
    { symbol: 'ESPT-AF', name: 'EsportsEdge Theta-2', sector: 'Gaming', basePrice: 215, volatility: 'high', pulse: 'volatile' },

    // Food (2)
    { symbol: 'FOOD-AG', name: 'FoodNode Iota-2', sector: 'Food', basePrice: 110, volatility: 'low', pulse: 'neutral' },
    { symbol: 'BVRG-AH', name: 'BeverageNode Kappa-2', sector: 'Food', basePrice: 125, volatility: 'low', pulse: 'bullish' },

    // Automotive (2)
    { symbol: 'AUTO-AI', name: 'AutoNode Lambda-2', sector: 'Automotive', basePrice: 240, volatility: 'moderate', pulse: 'bearish' },
    { symbol: 'ELEC-AJ', name: 'ElectricNode Mu-2', sector: 'Automotive', basePrice: 385, volatility: 'extreme', pulse: 'bullish' },

    // Aerospace (2)
    { symbol: 'AERO-AK', name: 'AeroNode Nu-2', sector: 'Aerospace', basePrice: 280, volatility: 'moderate', pulse: 'bullish' },
    { symbol: 'SPCE-AL', name: 'SpaceNode Xi-2', sector: 'Aerospace', basePrice: 465, volatility: 'extreme', pulse: 'volatile' },

    // Media & Entertainment (3)
    { symbol: 'MDIA-AM', name: 'MediaNode Omicron-2', sector: 'Media', basePrice: 172, volatility: 'moderate', pulse: 'neutral' },
    { symbol: 'STRM-AN', name: 'StreamEdge Pi-2', sector: 'Media', basePrice: 245, volatility: 'high', pulse: 'bullish' },
    { symbol: 'FILM-AO', name: 'FilmNode Rho-2', sector: 'Media', basePrice: 198, volatility: 'moderate', pulse: 'volatile' },

    // Cybersecurity (3)
    { symbol: 'CYBR-AP', name: 'CyberNode Sigma-2', sector: 'Cybersecurity', basePrice: 295, volatility: 'high', pulse: 'bullish' },
    { symbol: 'SECU-AQ', name: 'SecureEdge Tau-2', sector: 'Cybersecurity', basePrice: 265, volatility: 'moderate', pulse: 'bullish' },
    { symbol: 'HACK-AR', name: 'HackProof Upsilon-2', sector: 'Cybersecurity', basePrice: 315, volatility: 'high', pulse: 'volatile' },

    // E-Commerce (3)
    { symbol: 'ECOM-AS', name: 'EcomNode Phi-2', sector: 'E-Commerce', basePrice: 220, volatility: 'high', pulse: 'bullish' },
    { symbol: 'SHOP-AT', name: 'ShopEdge Chi-2', sector: 'E-Commerce', basePrice: 188, volatility: 'moderate', pulse: 'neutral' },
    { symbol: 'MRKT-AU', name: 'MarketNode Psi-2', sector: 'E-Commerce', basePrice: 205, volatility: 'high', pulse: 'bullish' },

    // Green Energy (3)
    { symbol: 'WIND-AV', name: 'WindNode Omega-3', sector: 'Green Energy', basePrice: 142, volatility: 'moderate', pulse: 'bullish' },
    { symbol: 'HYDRO-AW', name: 'HydroEdge Alpha-3', sector: 'Green Energy', basePrice: 135, volatility: 'moderate', pulse: 'neutral' },
    { symbol: 'NUCL-AX', name: 'NuclearNode Beta-3', sector: 'Green Energy', basePrice: 178, volatility: 'low', pulse: 'bullish' },

    // AI & Machine Learning (3)
    { symbol: 'AINX-AY', name: 'AI-Node Gamma-3', sector: 'AI', basePrice: 395, volatility: 'extreme', pulse: 'bullish' },
    { symbol: 'MLRN-AZ', name: 'MLearning Delta-3', sector: 'AI', basePrice: 425, volatility: 'extreme', pulse: 'volatile' },
    { symbol: 'DEEP-BA', name: 'DeepNode Epsilon-3', sector: 'AI', basePrice: 485, volatility: 'extreme', pulse: 'bullish' },

    // Biotech (2)
    { symbol: 'GENE-BB', name: 'GeneNode Zeta-3', sector: 'Biotech', basePrice: 355, volatility: 'extreme', pulse: 'volatile' },
    { symbol: 'STEM-BC', name: 'StemEdge Eta-3', sector: 'Biotech', basePrice: 298, volatility: 'high', pulse: 'bullish' },

    // Logistics (2)
    { symbol: 'SHIP-BD', name: 'ShipNode Theta-3', sector: 'Logistics', basePrice: 165, volatility: 'moderate', pulse: 'neutral' },
    { symbol: 'DELV-BE', name: 'DeliveryEdge Iota-3', sector: 'Logistics', basePrice: 192, volatility: 'moderate', pulse: 'bullish' },

    // Agriculture (2)
    { symbol: 'FARM-BF', name: 'FarmNode Kappa-3', sector: 'Agriculture', basePrice: 98, volatility: 'low', pulse: 'neutral' },
    { symbol: 'CROP-BG', name: 'CropEdge Lambda-3', sector: 'Agriculture', basePrice: 105, volatility: 'moderate', pulse: 'bullish' }
];

// Initialize prices and history
EQUITY_NODES.forEach(node => {
    node.currentPrice = node.basePrice;
    node.previousPrice = node.basePrice;
    node.priceHistory = [node.basePrice]; // Track last 50 prices for charts
    node.trend = 0; // -1 to 1, affects price direction
    node.volume = 0; // Trading volume
    node.volumeHistory = [0]; // Track volume for charts
    node.open = node.basePrice; // For candlestick charts
    node.high = node.basePrice;
    node.low = node.basePrice;
    node.close = node.basePrice;
    node.dividendYield = 0.01 + Math.random() * 0.04; // 1-5% annual yield
    node.lastDividend = Date.now();
});

// Themes
const THEMES = {
    default: {
        name: 'Default',
        icon: '🌐',
        unlockCondition: 'Available from start',
        colors: {
            primary: '#00f0ff',
            secondary: '#b000ff',
            background: '#0a0a0a',
            cardBg: 'rgba(0, 0, 0, 0.5)',
            positive: '#00ff88',
            negative: '#ff4444'
        }
    },
    matrix: {
        name: 'Matrix',
        icon: '💚',
        unlockCondition: 'Reach $500,000 wealth',
        unlockThreshold: 500000,
        colors: {
            primary: '#00ff00',
            secondary: '#00aa00',
            background: '#000000',
            cardBg: 'rgba(0, 50, 0, 0.5)',
            positive: '#00ff00',
            negative: '#ff0000'
        }
    },
    cyberpunk: {
        name: 'Cyberpunk',
        icon: '🌆',
        unlockCondition: 'Reach Master rank',
        unlockRank: 18, // Master I
        colors: {
            primary: '#ff00ff',
            secondary: '#ffff00',
            background: '#0a0015',
            cardBg: 'rgba(50, 0, 50, 0.5)',
            positive: '#ffff00',
            negative: '#ff00ff'
        }
    },
    neon: {
        name: 'Neon',
        icon: '✨',
        unlockCondition: 'Unlock 20 achievements',
        unlockAchievements: 20,
        colors: {
            primary: '#ff1493',
            secondary: '#00ffff',
            background: '#000510',
            cardBg: 'rgba(20, 0, 40, 0.5)',
            positive: '#00ffff',
            negative: '#ff1493'
        }
    }
};

// Badges & Titles
const BADGES = [
    { id: 'first_trade', name: 'First Steps', icon: '👶', condition: 'Complete your first trade' },
    { id: 'day_trader', name: 'Day Trader', icon: '📈', condition: 'Complete 100 trades' },
    { id: 'whale', name: 'Whale', icon: '🐋', condition: 'Have $1,000,000 wealth' },
    { id: 'diamond_hands', name: 'Diamond Hands', icon: '💎', condition: 'Hold a position for 1 hour' },
    { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', condition: 'Complete 50 trades on Ultra speed' },
    { id: 'diversified', name: 'Diversified', icon: '🌐', condition: 'Trade in all 23 sectors' },
    { id: 'profit_master', name: 'Profit Master', icon: '💰', condition: 'Make $500,000 total profit' },
    { id: 'rank_master', name: 'Rank Master', icon: '👑', condition: 'Reach Immortal rank' },
    { id: 'achievement_hunter', name: 'Achievement Hunter', icon: '🏆', condition: 'Unlock all secret achievements' },
    { id: 'prestige_1', name: 'Prestige I', icon: '🌟', condition: 'Prestige once' },
    { id: 'prestige_5', name: 'Prestige V', icon: '⭐', condition: 'Prestige 5 times' },
    { id: 'prestige_10', name: 'Prestige X', icon: '✨', condition: 'Prestige 10 times' }
];

const TITLES = [
    { id: 'novice', name: 'The Novice', condition: 'Reach Novice rank' },
    { id: 'trader', name: 'The Trader', condition: 'Reach Trader rank' },
    { id: 'expert', name: 'The Expert', condition: 'Reach Expert rank' },
    { id: 'master', name: 'The Master', condition: 'Reach Master rank' },
    { id: 'legend', name: 'The Legend', condition: 'Reach Legend rank' },
    { id: 'immortal', name: 'The Immortal', condition: 'Reach Immortal rank' },
    { id: 'millionaire', name: 'The Millionaire', condition: 'Reach $1,000,000 wealth' },
    { id: 'tycoon', name: 'The Tycoon', condition: 'Reach $5,000,000 wealth' },
    { id: 'market_maker', name: 'Market Maker', condition: 'Complete 500 trades' },
    { id: 'sector_specialist', name: 'Sector Specialist', condition: 'Make $50,000 in one sector' },
    { id: 'comeback_kid', name: 'Comeback Kid', condition: 'Recover from -50% to positive' },
    { id: 'prestige_master', name: 'Prestige Master', condition: 'Prestige 5 times' }
];

// News Events
const NEWS_TEMPLATES = [
    { type: 'earnings_beat', text: '{symbol} beats earnings expectations! Stock surges.', impact: 0.15 },
    { type: 'earnings_miss', text: '{symbol} misses earnings targets. Investors disappointed.', impact: -0.12 },
    { type: 'product_launch', text: '{symbol} announces revolutionary new product!', impact: 0.10 },
    { type: 'scandal', text: '{symbol} faces regulatory investigation.', impact: -0.15 },
    { type: 'partnership', text: '{symbol} signs major partnership deal.', impact: 0.08 },
    { type: 'ceo_change', text: '{symbol} appoints new CEO. Market reacts.', impact: 0.05 },
    { type: 'dividend_increase', text: '{symbol} increases dividend by 20%!', impact: 0.06 },
    { type: 'buyback', text: '{symbol} announces $1B stock buyback program.', impact: 0.07 },
    { type: 'downgrade', text: 'Analysts downgrade {symbol} to "Sell".', impact: -0.10 },
    { type: 'upgrade', text: 'Analysts upgrade {symbol} to "Strong Buy"!', impact: 0.12 },
    { type: 'merger', text: '{symbol} in talks for potential merger.', impact: 0.09 },
    { type: 'lawsuit', text: '{symbol} hit with class-action lawsuit.', impact: -0.08 },
    { type: 'innovation', text: '{symbol} patents breakthrough technology.', impact: 0.11 },
    { type: 'expansion', text: '{symbol} expands into new markets.', impact: 0.07 },
    { type: 'recall', text: '{symbol} recalls defective products.', impact: -0.09 }
];

// Potion Shop Items
const POTIONS = {
    speedBoost: {
        name: 'Speed Boost Potion',
        icon: '⚡',
        description: 'Doubles price update speed for 2 minutes',
        price: 2000,
        duration: 120000, // 2 minutes
        effect: 'speed'
    },
    profitMultiplier: {
        name: 'Profit Multiplier Potion',
        icon: '💰',
        description: '2x profit on all trades for 3 minutes',
        price: 3000,
        duration: 180000, // 3 minutes
        effect: 'profit'
    },
    luckBoost: {
        name: 'Luck Boost Potion',
        icon: '🍀',
        description: 'Increases chance of positive price movements for 2 minutes',
        price: 2500,
        duration: 120000, // 2 minutes
        effect: 'luck'
    },
    dividendBoost: {
        name: 'Dividend Boost Potion',
        icon: '💎',
        description: '3x dividend payouts for 5 minutes',
        price: 3500,
        duration: 300000, // 5 minutes
        effect: 'dividend'
    }
};

// Redeem Codes
const REDEEM_CODES = {
    '67Labs': { type: 'money', amount: 10000, description: '$10,000 cash' },
    'ParkerSmithSTOCKS': { type: 'money', amount: 10000, description: '$10,000 cash' },
    'TUFFAHHSTOCKS': { type: 'money', amount: 10000, description: '$10,000 cash' },
    'WETHEBESTMUSIC': { type: 'money', amount: 10000, description: '$10,000 cash' },
    'lallorona': { type: 'money', amount: 10000, description: '$10,000 cash' },
    'instagramGOON': { type: 'money', amount: 10000, description: '$10,000 cash' },
    'potions': { type: 'potions', description: 'One of each potion' },
    'THISISWHYWETRADE': { type: 'money', amount: 67, description: '$67 cash' },
    'CHEATS': { type: 'cheat_menu', description: 'Unlock cheat menu' }
};

