// Order Management (Stop Loss, Take Profit, Limit Orders)

// Set stop loss order
function setStopLoss(symbol) {
    const strategy = gameState.activeStrategies.find(s => s.symbol === symbol);
    if (!strategy) return;

    const targetPrice = prompt(`Set stop loss price for ${symbol}\nCurrent price: ${formatCurrency(strategy.currentPrice)}\n\nEnter target price:`);
    if (!targetPrice) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
        alert('Invalid price');
        return;
    }

    if (price >= strategy.currentPrice) {
        alert('Stop loss must be below current price');
        return;
    }

    if (!gameState.stopLossOrders) gameState.stopLossOrders = [];
    
    // Remove existing stop loss for this symbol
    gameState.stopLossOrders = gameState.stopLossOrders.filter(o => o.symbol !== symbol);
    
    gameState.stopLossOrders.push({
        symbol: symbol,
        targetPrice: price,
        strategyIndex: gameState.activeStrategies.findIndex(s => s.symbol === symbol)
    });

    showNotification(`🛑 Stop loss set for ${symbol} at ${formatCurrency(price)}`);
    saveState();
    renderActiveOrders();
}

// Set take profit order
function setTakeProfit(symbol) {
    const strategy = gameState.activeStrategies.find(s => s.symbol === symbol);
    if (!strategy) return;

    const targetPrice = prompt(`Set take profit price for ${symbol}\nCurrent price: ${formatCurrency(strategy.currentPrice)}\n\nEnter target price:`);
    if (!targetPrice) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
        alert('Invalid price');
        return;
    }

    if (price <= strategy.currentPrice) {
        alert('Take profit must be above current price');
        return;
    }

    if (!gameState.takeProfitOrders) gameState.takeProfitOrders = [];
    
    // Remove existing take profit for this symbol
    gameState.takeProfitOrders = gameState.takeProfitOrders.filter(o => o.symbol !== symbol);
    
    gameState.takeProfitOrders.push({
        symbol: symbol,
        targetPrice: price,
        strategyIndex: gameState.activeStrategies.findIndex(s => s.symbol === symbol)
    });

    showNotification(`🎯 Take profit set for ${symbol} at ${formatCurrency(price)}`);
    saveState();
    renderActiveOrders();
}

// Set limit buy order
function setLimitBuy(symbol) {
    const node = EQUITY_NODES.find(n => n.symbol === symbol);
    if (!node) return;

    const targetPrice = prompt(`Set limit buy price for ${symbol}\nCurrent price: ${formatCurrency(node.currentPrice)}\n\nEnter target price:`);
    if (!targetPrice) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
        alert('Invalid price');
        return;
    }

    const quantity = prompt(`Enter quantity to buy when price reaches ${formatCurrency(price)}:`);
    if (!quantity) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
        alert('Invalid quantity');
        return;
    }

    if (!gameState.limitBuyOrders) gameState.limitBuyOrders = [];
    
    gameState.limitBuyOrders.push({
        symbol: symbol,
        targetPrice: price,
        quantity: qty
    });

    showNotification(`📊 Limit buy order set for ${qty} ${symbol} at ${formatCurrency(price)}`);
    saveState();
    renderActiveOrders();
}

// Set limit sell order
function setLimitSell(symbol) {
    const strategy = gameState.activeStrategies.find(s => s.symbol === symbol);
    if (!strategy) return;

    const targetPrice = prompt(`Set limit sell price for ${symbol}\nCurrent price: ${formatCurrency(strategy.currentPrice)}\n\nEnter target price:`);
    if (!targetPrice) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
        alert('Invalid price');
        return;
    }

    if (!gameState.limitSellOrders) gameState.limitSellOrders = [];
    
    // Remove existing limit sell for this symbol
    gameState.limitSellOrders = gameState.limitSellOrders.filter(o => o.symbol !== symbol);
    
    gameState.limitSellOrders.push({
        symbol: symbol,
        targetPrice: price,
        strategyIndex: gameState.activeStrategies.findIndex(s => s.symbol === symbol)
    });

    showNotification(`📊 Limit sell order set for ${symbol} at ${formatCurrency(price)}`);
    saveState();
    renderActiveOrders();
}

// Cancel order
function cancelOrder(type, index) {
    if (type === 'stopLoss') {
        gameState.stopLossOrders.splice(index, 1);
    } else if (type === 'takeProfit') {
        gameState.takeProfitOrders.splice(index, 1);
    } else if (type === 'limitBuy') {
        gameState.limitBuyOrders.splice(index, 1);
    } else if (type === 'limitSell') {
        gameState.limitSellOrders.splice(index, 1);
    }

    showNotification('❌ Order cancelled');
    saveState();
    renderActiveOrders();
}

// Check and execute orders
function checkAndExecuteOrders() {
    if (!gameState.stopLossOrders) gameState.stopLossOrders = [];
    if (!gameState.takeProfitOrders) gameState.takeProfitOrders = [];
    if (!gameState.limitBuyOrders) gameState.limitBuyOrders = [];
    if (!gameState.limitSellOrders) gameState.limitSellOrders = [];

    // Check stop loss orders
    const stopLossToExecute = [];
    gameState.stopLossOrders.forEach((order, index) => {
        const strategy = gameState.activeStrategies.find(s => s.symbol === order.symbol);
        if (strategy && strategy.currentPrice <= order.targetPrice) {
            stopLossToExecute.push({ order, index, strategy });
        }
    });

    stopLossToExecute.reverse().forEach(({ order, index, strategy }) => {
        showNotification(`🛑 Stop loss triggered for ${order.symbol} at ${formatCurrency(strategy.currentPrice)}`);
        releaseNode(order.symbol);
        gameState.stopLossOrders.splice(index, 1);
    });

    // Check take profit orders
    const takeProfitToExecute = [];
    gameState.takeProfitOrders.forEach((order, index) => {
        const strategy = gameState.activeStrategies.find(s => s.symbol === order.symbol);
        if (strategy && strategy.currentPrice >= order.targetPrice) {
            takeProfitToExecute.push({ order, index, strategy });
        }
    });

    takeProfitToExecute.reverse().forEach(({ order, index, strategy }) => {
        showNotification(`🎯 Take profit triggered for ${order.symbol} at ${formatCurrency(strategy.currentPrice)}`);
        releaseNode(order.symbol);
        gameState.takeProfitOrders.splice(index, 1);
    });

    // Check limit buy orders
    const limitBuyToExecute = [];
    gameState.limitBuyOrders.forEach((order, index) => {
        const node = EQUITY_NODES.find(n => n.symbol === order.symbol);
        if (node && node.currentPrice <= order.targetPrice) {
            const totalCost = node.currentPrice * order.quantity;
            if (totalCost <= gameState.digitalReserve) {
                limitBuyToExecute.push({ order, index, node });
            }
        }
    });

    limitBuyToExecute.reverse().forEach(({ order, index, node }) => {
        showNotification(`📊 Limit buy executed for ${order.quantity} ${order.symbol} at ${formatCurrency(node.currentPrice)}`);
        
        // Execute buy
        const totalCost = node.currentPrice * order.quantity;
        gameState.digitalReserve -= totalCost;

        const existingStrategy = gameState.activeStrategies.find(s => s.symbol === order.symbol);
        if (existingStrategy) {
            const newTotalQuantity = existingStrategy.quantity + order.quantity;
            const newTotalCost = existingStrategy.investedCapital + totalCost;
            existingStrategy.quantity = newTotalQuantity;
            existingStrategy.investedCapital = newTotalCost;
            existingStrategy.purchasePrice = newTotalCost / newTotalQuantity;
            existingStrategy.purchaseCost = newTotalCost;
        } else {
            gameState.activeStrategies.push({
                symbol: order.symbol,
                quantity: order.quantity,
                purchasePrice: node.currentPrice,
                purchaseCost: totalCost,
                investedCapital: totalCost,
                currentPrice: node.currentPrice,
                currentValue: totalCost,
                performanceMetric: 0,
                performancePercent: 0,
                acquireTime: Date.now()
            });
        }

        gameState.limitBuyOrders.splice(index, 1);
    });

    // Check limit sell orders
    const limitSellToExecute = [];
    gameState.limitSellOrders.forEach((order, index) => {
        const strategy = gameState.activeStrategies.find(s => s.symbol === order.symbol);
        if (strategy && strategy.currentPrice >= order.targetPrice) {
            limitSellToExecute.push({ order, index, strategy });
        }
    });

    limitSellToExecute.reverse().forEach(({ order, index, strategy }) => {
        showNotification(`📊 Limit sell executed for ${order.symbol} at ${formatCurrency(strategy.currentPrice)}`);
        releaseNode(order.symbol);
        gameState.limitSellOrders.splice(index, 1);
    });
}

