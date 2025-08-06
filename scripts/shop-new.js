// Remi Shop - Customization Shopping System
class RemiShop {
    constructor() {
        this.items = [];
        this.currentCategory = 'all';
        this.currentItem = null;
        this.purchaseModal = null;
        this.coinSystem = null;
        this.init();
    }

    init() {
        console.log('Initializing Remi Shop...');
        
        // Wait for coin system to be ready
        if (typeof CoinSystem !== 'undefined') {
            this.coinSystem = new CoinSystem();
        }
        
        this.loadShopItems();
        this.setupEventListeners();
        this.updateShopDisplay();
        this.markOwnedItems();
        console.log('Remi Shop initialized with', this.items.length, 'items');
    }

    loadShopItems() {
        // Define all customization shop items
        this.items = [
            // Color Presets
            {
                id: 'lavender',
                name: 'Lavender Dream',
                description: 'Soft lavender tones with aqua accents',
                price: 100,
                category: 'color-presets',
                type: 'colorPresets',
                preview: 'lavender-preview'
            },
            {
                id: 'ocean',
                name: 'Ocean Breeze',
                description: 'Refreshing blue ocean theme',
                price: 120,
                category: 'color-presets',
                type: 'colorPresets',
                preview: 'ocean-preview'
            },
            {
                id: 'rose',
                name: 'Rose Garden',
                description: 'Elegant rose and pink gradient',
                price: 150,
                category: 'color-presets',
                type: 'colorPresets',
                preview: 'rose-preview'
            },
            {
                id: 'mint',
                name: 'Fresh Mint',
                description: 'Cool mint green theme',
                price: 100,
                category: 'color-presets',
                type: 'colorPresets',
                preview: 'mint-preview'
            },
            {
                id: 'cosmic',
                name: 'Cosmic Purple',
                description: 'Deep space purple theme',
                price: 200,
                category: 'color-presets',
                type: 'colorPresets',
                preview: 'cosmic-preview'
            },
            {
                id: 'amber',
                name: 'Amber Glow',
                description: 'Warm amber and gold tones',
                price: 130,
                category: 'color-presets',
                type: 'colorPresets',
                preview: 'amber-preview'
            },
            {
                id: 'coral',
                name: 'Coral Reef',
                description: 'Vibrant coral and orange theme',
                price: 140,
                category: 'color-presets',
                type: 'colorPresets',
                preview: 'coral-preview'
            },
            {
                id: 'emerald',
                name: 'Emerald Forest',
                description: 'Rich emerald green theme',
                price: 180,
                category: 'color-presets',
                type: 'colorPresets',
                preview: 'emerald-preview'
            },
            {
                id: 'crimson',
                name: 'Crimson Fire',
                description: 'Bold crimson red theme',
                price: 220,
                category: 'color-presets',
                type: 'colorPresets',
                preview: 'crimson-preview'
            },
            // Premium Color Presets
            {
                id: 'neon',
                name: 'Neon Future',
                description: 'Cyberpunk neon theme with glowing effects',
                price: 250,
                category: 'premium',
                type: 'colorPresets',
                preview: 'neon-preview',
                premium: true
            },
            {
                id: 'royal',
                name: 'Royal Purple',
                description: 'Majestic royal purple theme',
                price: 300,
                category: 'premium',
                type: 'colorPresets',
                preview: 'royal-preview',
                premium: true
            },
            {
                id: 'sapphire',
                name: 'Sapphire Ocean',
                description: 'Deep sapphire blue luxury theme',
                price: 280,
                category: 'premium',
                type: 'colorPresets',
                preview: 'sapphire-preview',
                premium: true
            },
            {
                id: 'gold',
                name: 'Golden Luxury',
                description: 'Ultimate luxury gold theme',
                price: 350,
                category: 'premium',
                type: 'colorPresets',
                preview: 'gold-preview',
                premium: true
            },
            {
                id: 'midnight',
                name: 'Midnight Sky',
                description: 'Mysterious midnight blue theme',
                price: 320,
                category: 'premium',
                type: 'colorPresets',
                preview: 'midnight-preview',
                premium: true
            },
            {
                id: 'cherry',
                name: 'Cherry Blossom',
                description: 'Beautiful cherry blossom pink theme',
                price: 270,
                category: 'premium',
                type: 'colorPresets',
                preview: 'cherry-preview',
                premium: true
            },
            // Topbar Styles
            {
                id: 'modern-cyber',
                name: 'Cyber Blue Topbar',
                description: 'Futuristic blue glass effect',
                price: 150,
                category: 'topbar-styles',
                type: 'topbarStyles',
                preview: 'cyber-topbar-preview',
                itemKey: 'modern.Cyber Blue'
            },
            {
                id: 'modern-neon',
                name: 'Neon Green Topbar',
                description: 'Vibrant green neon effect',
                price: 200,
                category: 'topbar-styles',
                type: 'topbarStyles',
                preview: 'neon-topbar-preview',
                itemKey: 'modern.Neon Green'
            },
            {
                id: 'classic-white',
                name: 'Classic White',
                description: 'Clean white classic style',
                price: 100,
                category: 'topbar-styles',
                type: 'topbarStyles',
                preview: 'white-topbar-preview',
                itemKey: 'classic.Classic White'
            },
            {
                id: 'minimal-clean',
                name: 'Clean Lines',
                description: 'Minimalist clean design',
                price: 80,
                category: 'topbar-styles',
                type: 'topbarStyles',
                preview: 'clean-topbar-preview',
                itemKey: 'minimal.Clean Lines'
            }
        ];
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Category filter buttons
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = btn.dataset.category;
                this.filterByCategory(category);
            });
        });

        // Buy buttons in the shop items
        document.addEventListener('click', (e) => {
            if (e.target.closest('.buy-btn')) {
                e.preventDefault();
                const buyBtn = e.target.closest('.buy-btn');
                const itemId = buyBtn.dataset.item;
                const itemType = buyBtn.dataset.type;
                
                if (itemId && itemType) {
                    console.log(`Attempting to purchase: ${itemId} (${itemType})`);
                    this.handlePurchase(itemId, itemType);
                } else {
                    console.error('Missing item data on buy button');
                }
            }
        });
        
        console.log('Event listeners set up successfully');
    }

    filterByCategory(category) {
        console.log('Filtering by category:', category);
        this.currentCategory = category;
        
        // Update active button
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });

        // Show/hide sections based on category
        const sections = document.querySelectorAll('.shop-section');
        sections.forEach(section => {
            const sectionCategory = section.dataset.category;
            if (category === 'all' || sectionCategory === category) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }

    handlePurchase(itemId, itemType) {
        console.log(`Purchase attempt: ${itemId} (Type: ${itemType})`);
        
        if (!this.coinSystem) {
            console.error('Coin system not available');
            return;
        }

        // Find the item
        const item = this.items.find(i => i.id === itemId);
        if (!item) {
            console.error(`Item not found: ${itemId}`);
            return;
        }

        // Use the coin system's purchase method
        const purchaseKey = item.itemKey || itemId;
        this.coinSystem.openPurchaseModal(purchaseKey, itemType, item.price, item.name);
    }

    updateShopDisplay() {
        // Update coin display
        if (this.coinSystem) {
            const coinElements = document.querySelectorAll('.coins-amount');
            coinElements.forEach(el => {
                el.textContent = this.coinSystem.getCoins();
            });
        }
    }

    markOwnedItems() {
        // Mark items as owned if they're already purchased
        if (!this.coinSystem) return;

        this.items.forEach(item => {
            const purchaseKey = item.itemKey || item.id;
            const isOwned = this.coinSystem.isUnlocked(purchaseKey, item.type);
            
            if (isOwned) {
                const shopItem = document.querySelector(`[data-item-id="${item.id}"]`);
                if (shopItem) {
                    shopItem.classList.add('owned');
                    const buyBtn = shopItem.querySelector('.buy-btn');
                    if (buyBtn) {
                        buyBtn.textContent = 'Owned';
                        buyBtn.disabled = true;
                        buyBtn.classList.add('owned');
                    }
                }
            }
        });
    }

    // Initialize shop when page loads
    static initialize() {
        document.addEventListener('DOMContentLoaded', () => {
            new RemiShop();
        });
    }
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    RemiShop.initialize();
} else {
    new RemiShop();
}
