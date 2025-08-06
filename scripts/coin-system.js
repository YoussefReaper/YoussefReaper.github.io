/**
 * Coin and Purchase Management System
 * Handles coins, unlockables, and purchase restrictions
 */

class CoinSystem {
    constructor() {
        this.coins = parseInt(localStorage.getItem('userCoins')) || 0;
        this.purchases = JSON.parse(localStorage.getItem('purchases')) || {};
        this.unlockedItems = JSON.parse(localStorage.getItem('unlockedItems')) || this.getDefaultUnlocked();
        this.migrateOldTopbarPurchases();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCoinDisplay();
        this.checkUnlocks();
    }

    // Define default unlocked items (3 color presets and 1 topbar style each)
    getDefaultUnlocked() {
        return {
            colorPresets: ['default', 'sunset', 'forest'], // First 3 are free
            topbarStyles: {
                modern: ['Glass Blue'], // Only one style available per type
                classic: [],
                minimal: []
            },
            backgrounds: [],
            themes: ['auto']
        };
    }

    // Define shop items with prices
    getShopItems() {
        return {
            colorPresets: {
                lavender: { price: 100, name: 'Lavender Dream' },
                ocean: { price: 120, name: 'Ocean Breeze' },
                rose: { price: 150, name: 'Rose Garden' },
                mint: { price: 100, name: 'Fresh Mint' },
                cosmic: { price: 200, name: 'Cosmic Purple' },
                amber: { price: 130, name: 'Amber Glow' },
                coral: { price: 140, name: 'Coral Reef' },
                neon: { price: 250, name: 'Neon Future' },
                royal: { price: 300, name: 'Royal Purple' },
                emerald: { price: 180, name: 'Emerald Forest' },
                crimson: { price: 220, name: 'Crimson Fire' },
                sapphire: { price: 280, name: 'Sapphire Ocean' },
                gold: { price: 350, name: 'Golden Luxury' },
                midnight: { price: 320, name: 'Midnight Sky' },
                cherry: { price: 270, name: 'Cherry Blossom' }
            },
            topbarStyles: {
                modern: {
                    'Cyber Blue': { price: 150, colors: { background: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#1e40af', accent: '#3b82f6' }},
                    'Neon Green': { price: 200, colors: { background: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', text: '#15803d', accent: '#22c55e' }},
                    'Royal Purple': { price: 250, colors: { background: 'rgba(147, 51, 234, 0.15)', border: 'rgba(147, 51, 234, 0.3)', text: '#7c2d12', accent: '#9333ea' }}
                },
                classic: {
                    'Classic White': { price: 100, colors: { background: 'rgba(255, 255, 255, 0.95)', border: 'rgba(0, 0, 0, 0.1)', text: '#374151', accent: '#6b7280' }},
                    'Dark Mode': { price: 180, colors: { background: 'rgba(17, 24, 39, 0.95)', border: 'rgba(255, 255, 255, 0.1)', text: '#f9fafb', accent: '#9ca3af' }},
                    'Gradient Sunset': { price: 300, colors: { background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(239, 68, 68, 0.2))', border: 'rgba(251, 146, 60, 0.3)', text: '#dc2626', accent: '#f97316' }}
                },
                minimal: {
                    'Clean Lines': { price: 80, colors: { background: 'rgba(248, 250, 252, 0.9)', border: 'rgba(148, 163, 184, 0.2)', text: '#475569', accent: '#64748b' }},
                    'Monochrome': { price: 150, colors: { background: 'rgba(255, 255, 255, 0.8)', border: 'rgba(0, 0, 0, 0.05)', text: '#000000', accent: '#404040' }},
                    'Soft Shadow': { price: 220, colors: { background: 'rgba(255, 255, 255, 0.7)', border: 'none', text: '#334155', accent: '#0f172a', shadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}
                }
            }
        };
    }

    // Migrate old topbar purchases to new format
    migrateOldTopbarPurchases() {
        // Check if there are any topbar purchases in old format (without category prefix)
        if (this.purchases.topbarStyles) {
            const oldPurchases = {};
            const newPurchases = {};
            
            for (const [itemId, data] of Object.entries(this.purchases.topbarStyles)) {
                if (!itemId.includes('.')) {
                    // Old format - move to premium category
                    newPurchases[`premium.${itemId}`] = data;
                    // Add to unlocked items
                    if (!this.unlockedItems.topbarStyles.premium) {
                        this.unlockedItems.topbarStyles.premium = [];
                    }
                    if (!this.unlockedItems.topbarStyles.premium.includes(itemId)) {
                        this.unlockedItems.topbarStyles.premium.push(itemId);
                    }
                } else {
                    // New format - keep as is
                    newPurchases[itemId] = data;
                }
            }
            
            // Update purchases
            this.purchases.topbarStyles = newPurchases;
            this.savePurchases();
            this.saveUnlocked();
        }
    }

    // Add coins (for earning through tasks, achievements, etc.)
    addCoins(amount, reason = '') {
        this.coins += amount;
        this.saveCoins();
        this.updateCoinDisplay();
        
        if (reason) {
            this.showNotification(`+${amount} coins! ${reason}`, 'success');
        }
    }

    // Get current coin count
    getCoins() {
        return this.coins;
    }

    // Check if user can afford an item
    canAfford(price) {
        return this.coins >= price;
    }

    // Check if user has unlocked an item
    hasUnlocked(category, item) {
        if (category === 'colorPresets') {
            return this.unlockedItems.colorPresets.includes(item);
        } else if (category === 'topbarStyles') {
            const [type, style] = item.split('.');
            const result = this.unlockedItems.topbarStyles[type] && 
                   this.unlockedItems.topbarStyles[type].includes(style);
            console.log('Checking hasUnlocked for topbar:', item, 'type:', type, 'style:', style, 'result:', result);
            console.log('Available topbar styles:', this.unlockedItems.topbarStyles);
            return result;
        }
        return false;
    }

    // Purchase an item
    purchaseItem(category, item, price) {
        console.log('CoinSystem.purchaseItem called:', category, item, price);
        
        if (!this.canAfford(price)) {
            this.showNotification('Not enough coins!', 'error');
            return false;
        }

        if (this.hasUnlocked(category, item)) {
            this.showNotification('Item already owned!', 'warning');
            return false;
        }

        // Deduct coins
        this.coins -= price;
        this.saveCoins();

        // Unlock item
        if (category === 'colorPresets') {
            this.unlockedItems.colorPresets.push(item);
        } else if (category === 'topbarStyles') {
            const [type, style] = item.split('.');
            if (!this.unlockedItems.topbarStyles[type]) {
                this.unlockedItems.topbarStyles[type] = [];
            }
            this.unlockedItems.topbarStyles[type].push(style);
            console.log('Unlocked topbar style:', type, style);
            console.log('Current unlocked topbar styles:', this.unlockedItems.topbarStyles);
        }

        // Save purchase
        if (!this.purchases[category]) {
            this.purchases[category] = {};
        }
        this.purchases[category][item] = {
            price: price,
            purchaseDate: new Date().toISOString()
        };

        this.saveUnlocked();
        this.savePurchases();
        this.updateCoinDisplay();
        this.checkUnlocks();

        console.log('Purchase completed successfully');
        
        // Dispatch purchase event
        const event = new CustomEvent('itemPurchased', {
            detail: {
                category: category,
                item: item,
                price: price
            }
        });
        document.dispatchEvent(event);

        this.showNotification(`Successfully purchased ${this.getItemName(category, item)}!`, 'success');
        return true;
    }

    // Get item display name
    getItemName(category, item) {
        const shopItems = this.getShopItems();
        if (category === 'colorPresets' && shopItems.colorPresets[item]) {
            return shopItems.colorPresets[item].name;
        } else if (category === 'topbarStyles') {
            const [type, style] = item.split('.');
            if (shopItems.topbarStyles[type] && shopItems.topbarStyles[type][style]) {
                return shopItems.topbarStyles[type][style].name || style;
            }
        }
        return item;
    }

    // Check and update UI based on unlocks
    checkUnlocks() {
        this.updateColorPresetUI();
        this.updateTopbarStyleUI();
    }

    // Update color preset UI to show/hide locked items
    updateColorPresetUI() {
        const colorPresetButtons = document.querySelectorAll('[data-preset]');
        colorPresetButtons.forEach(button => {
            const preset = button.dataset.preset;
            const isUnlocked = this.hasUnlocked('colorPresets', preset);
            
            if (isUnlocked) {
                button.classList.remove('locked');
                button.disabled = false;
            } else {
                button.classList.add('locked');
                button.disabled = true;
                
                // Add lock icon and price
                const shopItems = this.getShopItems();
                if (shopItems.colorPresets[preset]) {
                    const price = shopItems.colorPresets[preset].price;
                    this.addLockIndicator(button, price);
                }
            }
        });
    }

    // Update topbar style UI
    updateTopbarStyleUI() {
        const topbarButtons = document.querySelectorAll('[data-topbar-style]');
        topbarButtons.forEach(button => {
            const style = button.dataset.topbarStyle;
            const type = button.dataset.topbarType || 'modern';
            const isUnlocked = this.hasUnlocked('topbarStyles', `${type}.${style}`);
            
            if (isUnlocked) {
                button.classList.remove('locked');
                button.disabled = false;
            } else {
                button.classList.add('locked');
                button.disabled = true;
                
                // Add lock indicator
                const shopItems = this.getShopItems();
                if (shopItems.topbarStyles[type] && shopItems.topbarStyles[type][style]) {
                    const price = shopItems.topbarStyles[type][style].price;
                    this.addLockIndicator(button, price);
                }
            }
        });
    }

    // Add lock indicator to UI element
    addLockIndicator(element, price) {
        // Remove existing indicator
        const existing = element.querySelector('.lock-indicator');
        if (existing) existing.remove();

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'lock-indicator';
        indicator.innerHTML = `
            <i class="fas fa-lock"></i>
            <span>${price} coins</span>
        `;
        element.appendChild(indicator);
        element.style.position = 'relative';
    }

    // Setup event listeners for purchase buttons
    setupEventListeners() {
        // Listen for purchase attempts
        document.addEventListener('click', (e) => {
            if (e.target.closest('.locked[data-preset]')) {
                e.preventDefault();
                const button = e.target.closest('.locked[data-preset]');
                const preset = button.dataset.preset;
                this.attemptPurchase('colorPresets', preset);
            } else if (e.target.closest('.locked[data-topbar-style]')) {
                e.preventDefault();
                const button = e.target.closest('.locked[data-topbar-style]');
                const style = button.dataset.topbarStyle;
                const type = button.dataset.topbarType || 'modern';
                this.attemptPurchase('topbarStyles', `${type}.${style}`);
            }
        });

        // Update coin display on page load and focus
        window.addEventListener('focus', () => this.updateCoinDisplay());
        document.addEventListener('DOMContentLoaded', () => this.updateCoinDisplay());
    }

    // Attempt to purchase an item
    attemptPurchase(category, item) {
        const shopItems = this.getShopItems();
        let price;

        if (category === 'colorPresets' && shopItems.colorPresets[item]) {
            price = shopItems.colorPresets[item].price;
        } else if (category === 'topbarStyles') {
            const [type, style] = item.split('.');
            if (shopItems.topbarStyles[type] && shopItems.topbarStyles[type][style]) {
                price = shopItems.topbarStyles[type][style].price;
            }
        }

        if (price === undefined) {
            this.showNotification('Item not found in shop!', 'error');
            return;
        }

        // Show purchase confirmation
        this.showPurchaseModal(category, item, price);
    }

    // Show purchase confirmation modal
    showPurchaseModal(category, item, price) {
        const itemName = this.getItemName(category, item);
        
        const modal = document.createElement('div');
        modal.className = 'purchase-modal-overlay';
        modal.innerHTML = `
            <div class="purchase-modal">
                <div class="modal-header">
                    <h3>Purchase Confirmation</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="purchase-item">
                        <h4>${itemName}</h4>
                        <div class="purchase-cost">
                            <i class="fas fa-coins"></i>
                            <span>${price} coins</span>
                        </div>
                        <div class="balance-info">
                            Current balance: <span class="coin-balance">${this.coins}</span> coins
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary cancel-purchase">Cancel</button>
                    <button class="btn btn-primary confirm-purchase" ${!this.canAfford(price) ? 'disabled' : ''}>
                        ${this.canAfford(price) ? 'Purchase' : 'Not Enough Coins'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.querySelector('.cancel-purchase').onclick = () => modal.remove();
        modal.querySelector('.confirm-purchase').onclick = () => {
            if (this.purchaseItem(category, item, price)) {
                modal.remove();
            }
        };
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    // Update coin display throughout the app
    updateCoinDisplay() {
        const coinElements = document.querySelectorAll('#userCoins, #totalPoints, .coin-balance, [data-stat="user-points"]');
        coinElements.forEach(element => {
            element.textContent = this.coins;
        });

        // Update global variable for chat.js compatibility
        if (typeof window.userCoins !== 'undefined') {
            window.userCoins = this.coins;
        }
    }

    // Save functions
    saveCoins() {
        localStorage.setItem('userCoins', this.coins.toString());
    }

    saveUnlocked() {
        localStorage.setItem('unlockedItems', JSON.stringify(this.unlockedItems));
    }

    savePurchases() {
        localStorage.setItem('purchases', JSON.stringify(this.purchases));
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `coin-notification notification-${type}`;
        notification.textContent = message;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease'
        });

        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Method to give coins for testing
    giveCoinsDev(amount) {
        this.addCoins(amount, 'Developer bonus');
    }

    // Reset all purchases (for testing)
    resetPurchases() {
        this.purchases = {};
        this.unlockedItems = this.getDefaultUnlocked();
        this.savePurchases();
        this.saveUnlocked();
        this.checkUnlocks();
        this.showNotification('All purchases reset!', 'info');
    }
}

// Initialize coin system
let coinSystem;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        coinSystem = new CoinSystem();
        window.coinSystem = coinSystem;
    });
} else {
    coinSystem = new CoinSystem();
    window.coinSystem = coinSystem;
}

// Make coin system globally available
window.CoinSystem = CoinSystem;
