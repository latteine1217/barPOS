// 全局變數
let currentUser = null;
let notionConfig = {
    token: localStorage.getItem('notionToken') || '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',
    databaseId: localStorage.getItem('databaseId') || '31054bbd0e004118b6540645d872fd8f'
};

let currentData = {
    orders: [],
    menuItems: [],
    tables: [],
    stats: {
        todayRevenue: 0,
        todayOrders: 0,
        activeCustomers: 0
    }
};

// Notion API 基礎配置
const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

// 初始化應用程式
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// 初始化應用程式
function initializeApp() {
    // 載入儲存的設定
    if (notionConfig.token) {
        document.getElementById('notionToken').value = notionConfig.token;
    }
    if (notionConfig.databaseId) {
        document.getElementById('databaseId').value = notionConfig.databaseId;
    }

    // 初始化資料
    initializeSampleData();
    
    // 如果有 Notion 設定，嘗試同步資料
    if (notionConfig.token && notionConfig.databaseId) {
        refreshData();
    }
    
    // 渲染初始畫面
    renderDashboard();
    renderOrders();
    renderMenu();
    renderTables();
}

// 設定事件監聽器
function setupEventListeners() {
    // 導航選單
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // 模態窗口關閉
    document.getElementById('modalOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // 表單提交
    document.getElementById('newOrderForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveOrder();
    });

    document.getElementById('addMenuItemForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveMenuItem();
    });
}

// 切換標籤
function switchTab(tabName) {
    // 更新導航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // 更新內容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // 載入對應資料
    switch(tabName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'orders':
            renderOrders();
            break;
        case 'menu':
            renderMenu();
            break;
        case 'tables':
            renderTables();
            break;
        case 'reports':
            renderReports();
            break;
    }
}

// 更新日期時間
function updateDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('datetime').textContent = now.toLocaleString('zh-TW', options);
}

// 初始化範例資料
function initializeSampleData() {
    // 範例菜單項目
    currentData.menuItems = [
        {
            id: '1',
            name: '牛肉麵',
            price: 180,
            category: 'main',
            description: '傳統台式牛肉麵，湯頭濃郁'
        },
        {
            id: '2',
            name: '滷肉飯',
            price: 80,
            category: 'main',
            description: '香濃滷肉搭配白飯'
        },
        {
            id: '3',
            name: '珍珠奶茶',
            price: 50,
            category: 'beverage',
            description: '經典台式飲品'
        },
        {
            id: '4',
            name: '小籠包',
            price: 120,
            category: 'appetizer',
            description: '手工小籠包，一籠6個'
        }
    ];

    // 範例桌位
    currentData.tables = [];
    for (let i = 1; i <= 12; i++) {
        currentData.tables.push({
            id: i.toString(),
            number: i,
            status: Math.random() > 0.7 ? 'occupied' : 'available',
            capacity: Math.floor(Math.random() * 6) + 2
        });
    }

    // 範例訂單
    currentData.orders = [
        {
            id: '001',
            tableNumber: 3,
            items: [
                { menuItemId: '1', quantity: 2, name: '牛肉麵', price: 180 },
                { menuItemId: '3', quantity: 1, name: '珍珠奶茶', price: 50 }
            ],
            total: 410,
            status: 'preparing',
            customerCount: 2,
            timestamp: new Date()
        },
        {
            id: '002',
            tableNumber: 7,
            items: [
                { menuItemId: '2', quantity: 1, name: '滷肉飯', price: 80 },
                { menuItemId: '4', quantity: 1, name: '小籠包', price: 120 }
            ],
            total: 200,
            status: 'ready',
            customerCount: 1,
            timestamp: new Date()
        }
    ];

    // 計算統計資料
    updateStats();
}

// 更新統計資料
function updateStats() {
    const today = new Date().toDateString();
    const todayOrders = currentData.orders.filter(order => 
        order.timestamp.toDateString() === today
    );
    
    currentData.stats.todayOrders = todayOrders.length;
    currentData.stats.todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    currentData.stats.activeCustomers = currentData.orders
        .filter(order => order.status !== 'completed')
        .reduce((sum, order) => sum + order.customerCount, 0);
}

// 渲染儀表板
function renderDashboard() {
    updateStats();
    
    document.getElementById('todayRevenue').textContent = `$${currentData.stats.todayRevenue}`;
    document.getElementById('todayOrders').textContent = currentData.stats.todayOrders;
    document.getElementById('activeCustomers').textContent = currentData.stats.activeCustomers;
}

// 渲染訂單列表
function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    if (currentData.orders.length === 0) {
        ordersList.innerHTML = '<p class="no-data">目前沒有訂單</p>';
        return;
    }

    currentData.orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item';
        orderElement.innerHTML = `
            <div class="order-info">
                <div class="order-number">訂單 #${order.id}</div>
                <div class="order-details">
                    桌號: ${order.tableNumber} | 人數: ${order.customerCount} | 
                    總額: $${order.total} | 
                    時間: ${order.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            <div class="order-status status-${order.status}">
                ${getStatusText(order.status)}
            </div>
            <div class="order-actions">
                <button class="btn-secondary" onclick="viewOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-primary" onclick="updateOrderStatus('${order.id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
        ordersList.appendChild(orderElement);
    });
}

// 渲染菜單
function renderMenu() {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    if (currentData.menuItems.length === 0) {
        menuGrid.innerHTML = '<p class="no-data">目前沒有菜品</p>';
        return;
    }

    currentData.menuItems.forEach(item => {
        const menuElement = document.createElement('div');
        menuElement.className = 'menu-item';
        menuElement.innerHTML = `
            <div class="menu-item-header">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-price">$${item.price}</div>
            </div>
            <div class="menu-item-category">${getCategoryText(item.category)}</div>
            <div class="menu-item-description">${item.description || '暫無描述'}</div>
            <div class="menu-item-actions" style="margin-top: 15px;">
                <button class="btn-secondary" onclick="editMenuItem('${item.id}')" style="margin-right: 10px;">
                    <i class="fas fa-edit"></i> 編輯
                </button>
                <button class="btn-secondary" onclick="deleteMenuItem('${item.id}')">
                    <i class="fas fa-trash"></i> 刪除
                </button>
            </div>
        `;
        menuGrid.appendChild(menuElement);
    });
}

// 渲染桌位
function renderTables() {
    const tablesGrid = document.getElementById('tablesGrid');
    tablesGrid.innerHTML = '';

    if (currentData.tables.length === 0) {
        tablesGrid.innerHTML = '<p class="no-data">目前沒有桌位</p>';
        return;
    }

    currentData.tables.forEach(table => {
        const tableElement = document.createElement('div');
        tableElement.className = 'table-item';
        tableElement.onclick = () => selectTable(table.id);
        tableElement.innerHTML = `
            <div class="table-number">桌 ${table.number}</div>
            <div class="table-status table-${table.status}">
                ${getTableStatusText(table.status)}
            </div>
            <div class="table-capacity">${table.capacity} 人座</div>
        `;
        tablesGrid.appendChild(tableElement);
    });
}

// 渲染報表
function renderReports() {
    // 這裡可以整合 Chart.js 或其他圖表庫
    console.log('渲染報表功能待實作');
}

// 顯示新增訂單模態窗口
function showNewOrderModal() {
    // 載入桌號選項
    const tableSelect = document.getElementById('tableNumber');
    tableSelect.innerHTML = '';
    
    currentData.tables
        .filter(table => table.status === 'available')
        .forEach(table => {
            const option = document.createElement('option');
            option.value = table.number;
            option.textContent = `桌 ${table.number}`;
            tableSelect.appendChild(option);
        });

    // 清空表單
    document.getElementById('newOrderForm').reset();
    document.getElementById('orderItemsList').innerHTML = '';
    
    showModal('newOrderModal');
}

// 顯示新增菜品模態窗口
function showAddMenuItemModal() {
    document.getElementById('addMenuItemForm').reset();
    showModal('addMenuItemModal');
}

// 顯示模態窗口
function showModal(modalId) {
    document.getElementById('modalOverlay').classList.add('active');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.getElementById(modalId).style.display = 'block';
}

// 關閉模態窗口
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// 新增訂單項目
function addOrderItem() {
    const orderItemsList = document.getElementById('orderItemsList');
    
    const itemRow = document.createElement('div');
    itemRow.className = 'order-item-row';
    itemRow.innerHTML = `
        <select class="item-select" required>
            <option value="">選擇菜品</option>
            ${currentData.menuItems.map(item => 
                `<option value="${item.id}" data-price="${item.price}">${item.name} - $${item.price}</option>`
            ).join('')}
        </select>
        <input type="number" class="item-quantity" placeholder="數量" min="1" required>
        <button type="button" class="remove-item" onclick="removeOrderItem(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    orderItemsList.appendChild(itemRow);
    
    // 添加變更事件監聽器
    itemRow.querySelector('.item-select').addEventListener('change', updateOrderTotal);
    itemRow.querySelector('.item-quantity').addEventListener('input', updateOrderTotal);
}

// 移除訂單項目
function removeOrderItem(button) {
    button.parentElement.remove();
    updateOrderTotal();
}

// 更新訂單總額
function updateOrderTotal() {
    let total = 0;
    const itemRows = document.querySelectorAll('.order-item-row');
    
    itemRows.forEach(row => {
        const select = row.querySelector('.item-select');
        const quantity = row.querySelector('.item-quantity');
        
        if (select.value && quantity.value) {
            const price = parseFloat(select.selectedOptions[0].dataset.price);
            const qty = parseInt(quantity.value);
            total += price * qty;
        }
    });
    
    // 顯示總額
    let totalElement = document.querySelector('.order-total');
    if (!totalElement) {
        totalElement = document.createElement('div');
        totalElement.className = 'order-total';
        document.getElementById('orderItemsList').parentElement.appendChild(totalElement);
    }
    
    totalElement.innerHTML = `<strong>總計: $${total}</strong>`;
}

// 儲存訂單
function saveOrder() {
    const form = document.getElementById('newOrderForm');
    const formData = new FormData(form);
    
    const tableNumber = parseInt(formData.get('tableNumber') || document.getElementById('tableNumber').value);
    const customerCount = parseInt(formData.get('customerCount') || document.getElementById('customerCount').value);
    
    // 收集訂單項目
    const items = [];
    const itemRows = document.querySelectorAll('.order-item-row');
    
    itemRows.forEach(row => {
        const select = row.querySelector('.item-select');
        const quantity = row.querySelector('.item-quantity');
        
        if (select.value && quantity.value) {
            const menuItem = currentData.menuItems.find(item => item.id === select.value);
            items.push({
                menuItemId: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: parseInt(quantity.value)
            });
        }
    });
    
    if (items.length === 0) {
        showNotification('請至少添加一個菜品', 'error');
        return;
    }
    
    // 計算總額
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // 建立新訂單
    const newOrder = {
        id: generateOrderId(),
        tableNumber: tableNumber,
        customerCount: customerCount,
        items: items,
        total: total,
        status: 'pending',
        timestamp: new Date()
    };
    
    currentData.orders.push(newOrder);
    
    // 更新桌位狀態
    const table = currentData.tables.find(t => t.number === tableNumber);
    if (table) {
        table.status = 'occupied';
    }
    
    // 同步到 Notion
    if (notionConfig.token && notionConfig.databaseId) {
        syncOrderToNotion(newOrder);
    }
    
    // 更新 UI
    renderOrders();
    renderTables();
    renderDashboard();
    
    closeModal();
    showNotification('訂單已建立', 'success');
}

// 儲存菜品
function saveMenuItem() {
    const form = document.getElementById('addMenuItemForm');
    const formData = new FormData(form);
    
    const newMenuItem = {
        id: generateMenuItemId(),
        name: formData.get('itemName') || document.getElementById('itemName').value,
        price: parseFloat(formData.get('itemPrice') || document.getElementById('itemPrice').value),
        category: formData.get('itemCategory') || document.getElementById('itemCategory').value,
        description: formData.get('itemDescription') || document.getElementById('itemDescription').value
    };
    
    currentData.menuItems.push(newMenuItem);
    
    // 同步到 Notion
    if (notionConfig.token && notionConfig.databaseId) {
        syncMenuItemToNotion(newMenuItem);
    }
    
    renderMenu();
    closeModal();
    showNotification('菜品已新增', 'success');
}

// 儲存 Notion 設定
function saveNotionSettings() {
    const token = document.getElementById('notionToken').value.trim();
    let databaseInput = document.getElementById('databaseId').value.trim();
    
    // 從 Notion URL 提取 Database ID
    let databaseId = extractDatabaseId(databaseInput);
    
    if (!token || !databaseId) {
        showNotification('請填寫完整的 Notion 設定', 'error');
        return;
    }
    
    notionConfig.token = token;
    notionConfig.databaseId = databaseId;
    
    // 儲存到本地
    localStorage.setItem('notionToken', token);
    localStorage.setItem('databaseId', databaseId);
    
    // 更新輸入框顯示純 ID
    document.getElementById('databaseId').value = databaseId;
    
    showNotification('設定已儲存', 'success');
    
    // 測試連接
    testNotionConnection();
}

// 從 Notion URL 或直接輸入中提取 Database ID
function extractDatabaseId(input) {
    if (!input) return '';
    
    // 如果是完整的 URL
    if (input.includes('notion.so') || input.includes('notion.com')) {
        // 提取 URL 中的 32 字元 ID
        const match = input.match(/([a-f0-9]{32})/i);
        return match ? match[1] : '';
    }
    
    // 如果已經是 32 字元的 ID
    if (/^[a-f0-9]{32}$/i.test(input)) {
        return input;
    }
    
    // 如果是帶連字符的格式，移除連字符
    const cleaned = input.replace(/-/g, '');
    if (/^[a-f0-9]{32}$/i.test(cleaned)) {
        return cleaned;
    }
    
    return input; // 返回原始輸入讓用戶檢查
}

// 測試 Notion 連接
async function testNotionConnection() {
    try {
        const response = await fetch(`${NOTION_BASE_URL}/databases/${notionConfig.databaseId}`, {
            headers: {
                'Authorization': `Bearer ${notionConfig.token}`,
                'Notion-Version': NOTION_API_VERSION,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showNotification('Notion 連接成功', 'success');
        } else {
            throw new Error('連接失敗');
        }
    } catch (error) {
        showNotification('Notion 連接失敗，請檢查設定', 'error');
        console.error('Notion connection error:', error);
    }
}

// 同步資料到 Notion
async function syncOrderToNotion(order) {
    try {
        const response = await fetch(`${NOTION_BASE_URL}/pages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${notionConfig.token}`,
                'Notion-Version': NOTION_API_VERSION,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                parent: { database_id: notionConfig.databaseId },
                properties: {
                    '訂單編號': {
                        title: [{ text: { content: order.id } }]
                    },
                    '桌號': {
                        number: order.tableNumber
                    },
                    '人數': {
                        number: order.customerCount
                    },
                    '總額': {
                        number: order.total
                    },
                    '狀態': {
                        select: { name: order.status }
                    },
                    '建立時間': {
                        date: { start: order.timestamp.toISOString() }
                    },
                    '項目': {
                        rich_text: [{
                            text: {
                                content: order.items.map(item => 
                                    `${item.name} x${item.quantity} ($${item.price})`
                                ).join(', ')
                            }
                        }]
                    }
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('同步失敗');
        }
        
        console.log('訂單已同步到 Notion');
    } catch (error) {
        console.error('Notion sync error:', error);
    }
}

// 同步菜品到 Notion
async function syncMenuItemToNotion(menuItem) {
    // 類似 syncOrderToNotion 的實作
    console.log('菜品同步功能待實作');
}

// 刷新資料
function refreshData() {
    if (!notionConfig.token || !notionConfig.databaseId) {
        showNotification('請先設定 Notion API', 'error');
        return;
    }
    
    showNotification('正在同步資料...', 'success');
    
    // 這裡可以從 Notion 拉取最新資料
    // 目前使用本地資料
    renderDashboard();
    renderOrders();
    renderMenu();
    renderTables();
}

// 工具函數
function generateOrderId() {
    return String(currentData.orders.length + 1).padStart(3, '0');
}

function generateMenuItemId() {
    return String(currentData.menuItems.length + 1);
}

function getStatusText(status) {
    const statusMap = {
        'pending': '待處理',
        'preparing': '製作中',
        'ready': '已完成',
        'completed': '已結帳'
    };
    return statusMap[status] || status;
}

function getCategoryText(category) {
    const categoryMap = {
        'appetizer': '前菜',
        'main': '主菜',
        'dessert': '甜點',
        'beverage': '飲品'
    };
    return categoryMap[category] || category;
}

function getTableStatusText(status) {
    const statusMap = {
        'available': '空桌',
        'occupied': '用餐中',
        'reserved': '已預約'
    };
    return statusMap[status] || status;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 其他功能函數（待實作）
function viewOrderDetails(orderId) {
    console.log('查看訂單詳情:', orderId);
}

function updateOrderStatus(orderId) {
    const order = currentData.orders.find(o => o.id === orderId);
    if (order) {
        const statusMap = {
            'pending': 'preparing',
            'preparing': 'ready',
            'ready': 'completed'
        };
        
        if (statusMap[order.status]) {
            order.status = statusMap[order.status];
            
            // 如果訂單完成，釋放桌位
            if (order.status === 'completed') {
                const table = currentData.tables.find(t => t.number === order.tableNumber);
                if (table) {
                    table.status = 'available';
                }
            }
            
            renderOrders();
            renderTables();
            renderDashboard();
            showNotification('訂單狀態已更新', 'success');
        }
    }
}

function editMenuItem(itemId) {
    console.log('編輯菜品:', itemId);
}

function deleteMenuItem(itemId) {
    if (confirm('確定要刪除這個菜品嗎？')) {
        currentData.menuItems = currentData.menuItems.filter(item => item.id !== itemId);
        renderMenu();
        showNotification('菜品已刪除', 'success');
    }
}

function selectTable(tableId) {
    const table = currentData.tables.find(t => t.id === tableId);
    if (table) {
        if (table.status === 'available') {
            showNewOrderModal();
            document.getElementById('tableNumber').value = table.number;
        } else {
            // 顯示桌位詳情
            showTableDetail(table);
        }
    }
}

// 顯示桌位詳情
function showTableDetail(table) {
    // 更新桌位基本資訊
    document.getElementById('tableDetailTitle').textContent = `桌 ${table.number} 詳情`;
    document.getElementById('tableDetailNumber').textContent = `桌 ${table.number}`;
    document.getElementById('tableDetailStatus').textContent = getTableStatusText(table.status);
    document.getElementById('tableDetailStatus').className = `table-status table-${table.status}`;
    document.getElementById('tableDetailCapacity').textContent = `${table.capacity} 人座`;
    
    // 找到該桌的所有訂單
    const tableOrders = currentData.orders.filter(order => 
        order.tableNumber === table.number && order.status !== 'completed'
    );
    
    // 計算用餐時間（使用最早的訂單時間）
    if (tableOrders.length > 0) {
        const earliestOrder = tableOrders.reduce((earliest, order) => 
            order.timestamp < earliest.timestamp ? order : earliest
        );
        const duration = calculateDuration(earliestOrder.timestamp);
        document.getElementById('tableDetailTime').textContent = `已用餐 ${duration}`;
    } else {
        document.getElementById('tableDetailTime').textContent = '無用餐記錄';
    }
    
    // 渲染訂單列表
    renderTableOrders(tableOrders);
    
    // 計算總金額
    const totalAmount = tableOrders.reduce((sum, order) => sum + order.total, 0);
    document.getElementById('tableDetailTotal').textContent = `$${totalAmount}`;
    
    // 儲存當前選中的桌位
    window.currentSelectedTable = table;
    
    showModal('tableDetailModal');
}

// 渲染桌位訂單
function renderTableOrders(orders) {
    const ordersList = document.getElementById('tableOrdersList');
    ordersList.innerHTML = '';
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p class="no-data">目前沒有訂單</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'table-order-item';
        orderElement.innerHTML = `
            <div class="order-item-header">
                <span class="order-number">訂單 #${order.id}</span>
                <span class="order-time">${order.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="order-items-detail">
                ${order.items.map(item => `
                    <div class="order-item-line">
                        <span class="item-name-qty">${item.name} x${item.quantity}</span>
                        <span class="item-price">$${item.price * item.quantity}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-status-section">
                <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                <button class="btn-secondary" onclick="updateOrderStatus('${order.id}')" style="margin-left: 10px; padding: 4px 8px; font-size: 0.8rem;">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        ordersList.appendChild(orderElement);
    });
}

// 計算用餐時間
function calculateDuration(startTime) {
    const now = new Date();
    const diff = now - startTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours} 小時 ${minutes} 分`;
    } else {
        return `${minutes} 分鐘`;
    }
}

// 為該桌顯示菜單選擇
function showMenuSelectionForTable() {
    if (!window.currentSelectedTable) return;
    
    const table = window.currentSelectedTable;
    document.getElementById('posTableInfo').textContent = `桌 ${table.number} - 加點`;
    
    // 找到該桌的活躍訂單來獲取人數
    const activeOrder = currentData.orders.find(order => 
        order.tableNumber === table.number && order.status !== 'completed'
    );
    
    if (activeOrder) {
        document.getElementById('posCustomerCount').textContent = `${activeOrder.customerCount} 人`;
    }
    
    // 初始化 POS 系統
    initializePosSystem();
    showModal('menuSelectionModal');
}

// 開啟菜單選擇（新訂單）
function openMenuSelection() {
    const tableNumber = document.getElementById('tableNumber').value;
    const customerCount = document.getElementById('customerCount').value;
    
    if (!tableNumber || !customerCount) {
        showNotification('請先選擇桌號和人數', 'error');
        return;
    }
    
    document.getElementById('posTableInfo').textContent = `桌 ${tableNumber} - 點餐`;
    document.getElementById('posCustomerCount').textContent = `${customerCount} 人`;
    
    // 儲存新訂單資訊
    window.currentNewOrder = {
        tableNumber: parseInt(tableNumber),
        customerCount: parseInt(customerCount),
        isNewOrder: true
    };
    
    initializePosSystem();
    showModal('menuSelectionModal');
}

// 顯示傳統點餐方式
function showTraditionalOrdering() {
    document.getElementById('traditionalOrderSection').style.display = 'block';
    document.getElementById('saveOrderBtn').style.display = 'inline-flex';
    
    // 如果列表為空，自動添加一個項目
    const orderItemsList = document.getElementById('orderItemsList');
    if (orderItemsList.children.length === 0) {
        addOrderItem();
    }
}

// 初始化 POS 系統
function initializePosSystem() {
    // 重置當前訂單
    window.currentPosOrder = [];
    
    // 渲染菜單格子
    renderPosMenu();
    
    // 渲染當前訂單
    renderCurrentOrder();
    
    // 設定預設分類為全部
    filterMenuByCategory('all');
}

// 渲染 POS 菜單格子
function renderPosMenu() {
    const menuGrid = document.getElementById('posMenuGrid');
    menuGrid.innerHTML = '';
    
    currentData.menuItems.forEach(item => {
        const menuCard = document.createElement('div');
        menuCard.className = 'menu-item-card';
        menuCard.dataset.category = item.category;
        menuCard.onclick = () => addToPosOrder(item);
        
        menuCard.innerHTML = `
            <div class="menu-card-category">${getCategoryText(item.category)}</div>
            <div class="menu-card-name">${item.name}</div>
            <div class="menu-card-price">$${item.price}</div>
        `;
        
        menuGrid.appendChild(menuCard);
    });
}

// 按分類篩選菜單
function filterMenuByCategory(category) {
    // 更新分類標籤狀態
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // 顯示/隱藏菜品
    document.querySelectorAll('.menu-item-card').forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// 添加到 POS 訂單
function addToPosOrder(menuItem) {
    if (!window.currentPosOrder) {
        window.currentPosOrder = [];
    }
    
    // 檢查是否已存在該項目
    const existingItem = window.currentPosOrder.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        window.currentPosOrder.push({
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1
        });
    }
    
    renderCurrentOrder();
    
    // 視覺反饋
    const menuCard = document.querySelector(`[onclick="addToPosOrder(${JSON.stringify(menuItem).replace(/"/g, "'")}"]`);
    if (menuCard) {
        menuCard.classList.add('selected');
        setTimeout(() => menuCard.classList.remove('selected'), 200);
    }
}

// 渲染當前訂單
function renderCurrentOrder() {
    const orderItems = document.getElementById('currentOrderItems');
    orderItems.innerHTML = '';
    
    if (!window.currentPosOrder || window.currentPosOrder.length === 0) {
        orderItems.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">尚未選擇任何菜品</p>';
        updatePosOrderSummary();
        return;
    }
    
    window.currentPosOrder.forEach((item, index) => {
        const orderItem = document.createElement('div');
        orderItem.className = 'current-order-item';
        orderItem.innerHTML = `
            <div class="current-item-info">
                <div class="current-item-name">${item.name}</div>
                <div class="current-item-price">$${item.price} 每份</div>
            </div>
            <div class="current-item-controls">
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updatePosItemQuantity(${index}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updatePosItemQuantity(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="remove-btn" onclick="removePosItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        orderItems.appendChild(orderItem);
    });
    
    updatePosOrderSummary();
}

// 更新 POS 項目數量
function updatePosItemQuantity(index, change) {
    if (!window.currentPosOrder || !window.currentPosOrder[index]) return;
    
    window.currentPosOrder[index].quantity += change;
    
    if (window.currentPosOrder[index].quantity <= 0) {
        window.currentPosOrder.splice(index, 1);
    }
    
    renderCurrentOrder();
}

// 移除 POS 項目
function removePosItem(index) {
    if (!window.currentPosOrder) return;
    
    window.currentPosOrder.splice(index, 1);
    renderCurrentOrder();
}

// 清空當前訂單
function clearCurrentOrder() {
    window.currentPosOrder = [];
    renderCurrentOrder();
}

// 更新 POS 訂單摘要
function updatePosOrderSummary() {
    if (!window.currentPosOrder) {
        document.getElementById('currentSubtotal').textContent = '$0';
        document.getElementById('currentTotal').textContent = '$0';
        return;
    }
    
    const subtotal = window.currentPosOrder.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
    );
    
    document.getElementById('currentSubtotal').textContent = `$${subtotal}`;
    document.getElementById('currentTotal').textContent = `$${subtotal}`;
}

// 確認 POS 訂單
function confirmPosOrder() {
    if (!window.currentPosOrder || window.currentPosOrder.length === 0) {
        showNotification('請至少選擇一個菜品', 'error');
        return;
    }
    
    const total = window.currentPosOrder.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
    );
    
    if (window.currentNewOrder && window.currentNewOrder.isNewOrder) {
        // 新訂單
        const newOrder = {
            id: generateOrderId(),
            tableNumber: window.currentNewOrder.tableNumber,
            customerCount: window.currentNewOrder.customerCount,
            items: [...window.currentPosOrder],
            total: total,
            status: 'pending',
            timestamp: new Date()
        };
        
        currentData.orders.push(newOrder);
        
        // 更新桌位狀態
        const table = currentData.tables.find(t => t.number === newOrder.tableNumber);
        if (table) {
            table.status = 'occupied';
        }
        
        // 同步到 Notion
        if (notionConfig.token && notionConfig.databaseId) {
            syncOrderToNotion(newOrder);
        }
        
        showNotification('訂單已建立', 'success');
        
    } else if (window.currentSelectedTable) {
        // 加點
        const addOnOrder = {
            id: generateOrderId(),
            tableNumber: window.currentSelectedTable.number,
            customerCount: 1, // 加點不改變人數
            items: [...window.currentPosOrder],
            total: total,
            status: 'pending',
            timestamp: new Date()
        };
        
        currentData.orders.push(addOnOrder);
        
        // 同步到 Notion
        if (notionConfig.token && notionConfig.databaseId) {
            syncOrderToNotion(addOnOrder);
        }
        
        showNotification('加點成功', 'success');
    }
    
    // 重置變數
    window.currentPosOrder = [];
    window.currentNewOrder = null;
    window.currentSelectedTable = null;
    
    // 更新 UI
    renderOrders();
    renderTables();
    renderDashboard();
    
    closeModal();
}

// 結帳功能
function checkoutTable() {
    if (!window.currentSelectedTable) return;
    
    const table = window.currentSelectedTable;
    const tableOrders = currentData.orders.filter(order => 
        order.tableNumber === table.number && order.status !== 'completed'
    );
    
    if (tableOrders.length === 0) {
        showNotification('該桌沒有未結帳的訂單', 'error');
        return;
    }
    
    const totalAmount = tableOrders.reduce((sum, order) => sum + order.total, 0);
    
    if (confirm(`確定要為桌 ${table.number} 結帳嗎？\n總金額: $${totalAmount}`)) {
        // 將所有訂單標記為已完成
        tableOrders.forEach(order => {
            order.status = 'completed';
        });
        
        // 釋放桌位
        table.status = 'available';
        
        showNotification(`桌 ${table.number} 結帳完成，總金額: $${totalAmount}`, 'success');
        
        // 更新 UI
        renderOrders();
        renderTables();
        renderDashboard();
        
        closeModal();
    }
}

// 初始化時添加一些範例訂單項目
document.addEventListener('DOMContentLoaded', function() {
    // 在新增訂單表單中預設添加一個項目選擇行
    setTimeout(() => {
        if (document.getElementById('orderItemsList')) {
            addOrderItem();
        }
    }, 100);
});