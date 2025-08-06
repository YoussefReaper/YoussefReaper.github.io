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
        this.handleAnchorNavigation();
        console.log('Remi Shop initialized with', this.items.length, 'items');
    }

    loadShopItems() {
        // Define all customization shop items
        this.items = [
            // Color Presets - All now regular priced (no premium section)
            {
                id: 'lavender',
                name: 'Lavender Dream',
                description: 'Soft lavender tones with aqua accents',
                price: 100,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#B37FEB', '#50C9C3', '#FAF7FF'],
                    background: '#FAF7FF'
                }
            },
            {
                id: 'ocean',
                name: 'Deep Ocean',
                description: 'Refreshing blue ocean theme',
                price: 120,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#0EA5E9', '#06B6D4', '#F0F9FF'],
                    background: '#F0F9FF'
                }
            },
            {
                id: 'rose',
                name: 'Rose Garden',
                description: 'Elegant rose and pink gradient',
                price: 150,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#F43F5E', '#EC4899', '#FFF1F2'],
                    background: '#FFF1F2'
                }
            },
            {
                id: 'mint',
                name: 'Fresh Mint',
                description: 'Cool mint green theme',
                price: 100,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#10B981', '#059669', '#ECFDF5'],
                    background: '#ECFDF5'
                }
            },
            {
                id: 'cosmic',
                name: 'Cosmic Purple',
                description: 'Deep space purple theme',
                price: 200,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#8B5CF6', '#A855F7', '#FAF5FF'],
                    background: '#FAF5FF'
                }
            },
            {
                id: 'amber',
                name: 'Golden Amber',
                description: 'Warm amber and gold tones',
                price: 130,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#F59E0B', '#D97706', '#FFFBEB'],
                    background: '#FFFBEB'
                }
            },
            {
                id: 'coral',
                name: 'Coral Reef',
                description: 'Vibrant coral and orange theme',
                price: 140,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#FF7849', '#FF6B9D', '#FFF8F5'],
                    background: '#FFF8F5'
                }
            },
            {
                id: 'emerald',
                name: 'Emerald Forest',
                description: 'Rich emerald green theme',
                price: 180,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#50C878', '#00A86B', '#F0FFF0'],
                    background: '#F0FFF0'
                }
            },
            {
                id: 'crimson',
                name: 'Crimson Fire',
                description: 'Bold crimson red theme',
                price: 220,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#DC143C', '#B22222', '#FFF5F5'],
                    background: '#FFF5F5'
                }
            },
            {
                id: 'neon',
                name: 'Neon Future',
                description: 'Cyberpunk neon theme with glowing effects',
                price: 250,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#00FFFF', '#FF00FF', '#F0F8FF'],
                    background: '#F0F8FF'
                }
            },
            {
                id: 'royal',
                name: 'Royal Purple',
                description: 'Majestic royal purple theme',
                price: 300,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#4B0082', '#800080', '#F5F0FF'],
                    background: '#F5F0FF'
                }
            },
            {
                id: 'sapphire',
                name: 'Sapphire Ocean',
                description: 'Deep sapphire blue luxury theme',
                price: 280,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#0F52BA', '#1E90FF', '#F0F8FF'],
                    background: '#F0F8FF'
                }
            },
            {
                id: 'gold',
                name: 'Golden Luxury',
                description: 'Ultimate luxury gold theme',
                price: 350,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#FFD700', '#FFA500', '#FFFACD'],
                    background: '#FFFACD'
                }
            },
            {
                id: 'midnight',
                name: 'Midnight Sky',
                description: 'Mysterious midnight blue theme',
                price: 320,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#191970', '#483D8B', '#F8F8FF'],
                    background: '#F8F8FF'
                }
            },
            {
                id: 'cherry',
                name: 'Cherry Blossom',
                description: 'Beautiful cherry blossom pink theme',
                price: 270,
                category: 'color-presets',
                type: 'colorPresets',
                preview: {
                    colors: ['#FF69B4', '#FF1493', '#FFF0F5'],
                    background: '#FFF0F5'
                }
            },
            // Topbar Styles
            {
                id: 'modern-cyber',
                name: 'Cyber Blue Topbar',
                description: 'Futuristic blue glass effect',
                price: 150,
                category: 'topbar-styles',
                type: 'topbarStyles',
                preview: {
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: 'rgba(59, 130, 246, 0.3)',
                    text: '#1e40af'
                },
                itemKey: 'modern.Cyber Blue'
            },
            {
                id: 'modern-neon',
                name: 'Neon Green Topbar',
                description: 'Vibrant green neon effect',
                price: 200,
                category: 'topbar-styles',
                type: 'topbarStyles',
                preview: {
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: 'rgba(34, 197, 94, 0.3)',
                    text: '#15803d'
                },
                itemKey: 'modern.Neon Green'
            },
            {
                id: 'classic-white',
                name: 'Classic White',
                description: 'Clean white classic style',
                price: 100,
                category: 'topbar-styles',
                type: 'topbarStyles',
                preview: {
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: 'rgba(0, 0, 0, 0.1)',
                    text: '#374151'
                },
                itemKey: 'classic.Classic White'
            },
            {
                id: 'minimal-clean',
                name: 'Clean Lines',
                description: 'Minimalist clean design',
                price: 80,
                category: 'topbar-styles',
                type: 'topbarStyles',
                preview: {
                    background: 'rgba(248, 250, 252, 0.9)',
                    border: 'rgba(148, 163, 184, 0.2)',
                    text: '#475569'
                },
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

    handleAnchorNavigation() {
        // Check if there's an anchor in the URL to navigate to a specific item
        const hash = window.location.hash.substring(1);
        if (hash) {
            // Find the item and scroll to it
            setTimeout(() => {
                const targetItem = document.querySelector(`[data-item-id="${hash}"]`);
                if (targetItem) {
                    targetItem.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                    // Add a highlight effect
                    targetItem.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
                    setTimeout(() => {
                        targetItem.style.boxShadow = '';
                    }, 3000);
                }
            }, 500);
        }
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

    // Color Preview System
    previewColorPreset(presetId, colors) {
        if (!colors || colors.length < 3) {
            console.error('Invalid color preset data');
            return;
        }

        const [primary, secondary, background] = colors;
        
        // Apply temporary preview styles
        this.applyPreviewStyles(primary, secondary, background);
        
        // Show preview notification
        this.showPreviewNotification(presetId);
        
        // Auto-revert after 10 seconds
        setTimeout(() => {
            this.revertPreview();
        }, 10000);
    }

    applyPreviewStyles(primary, secondary, background) {
        // Store original styles for reverting
        if (!this.originalStyles) {
            this.originalStyles = {
                accentPrimary: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim(),
                accentSecondary: getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim(),
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim()
            };
        }

        // Apply preview styles to CSS variables
        document.documentElement.style.setProperty('--accent-primary', primary);
        document.documentElement.style.setProperty('--accent-secondary', secondary);
        document.documentElement.style.setProperty('--background-color', background);
        
        // Add preview indicator class to body
        document.body.classList.add('preview-mode');
        
        console.log(`Previewing colors: ${primary}, ${secondary}, ${background}`);
    }

    revertPreview() {
        if (this.originalStyles) {
            // Restore original styles
            document.documentElement.style.setProperty('--accent-primary', this.originalStyles.accentPrimary);
            document.documentElement.style.setProperty('--accent-secondary', this.originalStyles.accentSecondary);
            document.documentElement.style.setProperty('--background-color', this.originalStyles.backgroundColor);
        }
        
        // Remove preview mode class
        document.body.classList.remove('preview-mode');
        
        console.log('Preview reverted to original colors');
    }

    showPreviewNotification(presetId) {
        // Remove any existing preview notifications
        const existingNotification = document.querySelector('.preview-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'preview-notification';
        notification.innerHTML = `
            <i class="fas fa-eye"></i>
            <div>
                <div style="font-weight: 700;">Previewing ${this.getPresetName(presetId)}</div>
                <div style="font-size: 0.8rem; opacity: 0.9;">Colors will revert in 10 seconds</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove notification after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInPreview 0.3s ease reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 10000);
    }

    getPresetName(presetId) {
        const presetNames = {
            lavender: 'Lavender Dream',
            ocean: 'Deep Ocean',
            rose: 'Rose Garden',
            mint: 'Fresh Mint',
            cosmic: 'Cosmic Purple',
            amber: 'Golden Amber',
            coral: 'Coral Reef',
            emerald: 'Emerald Forest',
            crimson: 'Crimson Fire',
            neon: 'Neon Nights',
            royal: 'Royal Purple',
            sapphire: 'Sapphire Blue',
            gold: 'Golden Luxury',
            midnight: 'Midnight Sky',
            cherry: 'Cherry Blossom'
        };
        return presetNames[presetId] || presetId;
    }

    // Initialize shop when page loads
    static initialize() {
        document.addEventListener('DOMContentLoaded', () => {
            new RemiShop();
        });
    }
}

// Global function for preview buttons
window.previewColorPreset = function(presetId, colors) {
    if (window.remiShop) {
        window.remiShop.previewColorPreset(presetId, colors);
    }
};

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    RemiShop.initialize();
} else {
    const shop = new RemiShop();
    window.remiShop = shop;
}

// Listen for purchase events to update shop display
document.addEventListener('itemPurchased', function(event) {
    if (window.remiShop) {
        window.remiShop.markOwnedItems();
    }
});
