// ===== GLOBAL THEME SYNCHRONIZATION SYSTEM =====
// This script ensures theme and color changes are applied across all pages in real-time

class GlobalThemeSync {
    constructor() {
        this.currentTheme = null;
        this.init();
    }

    init() {
        this.loadThemeFromStorage();
        this.setupEventListeners();
        this.applyStoredTheme();
        
        // Apply theme on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.applyStoredTheme();
        });
    }

    loadThemeFromStorage() {
        try {
            // Load from customization settings
            const customizationSettings = localStorage.getItem('remiCustomization');
            if (customizationSettings) {
                const settings = JSON.parse(customizationSettings);
                this.currentTheme = {
                    theme: settings.theme || 'auto',
                    colors: settings.colors || this.getDefaultColors(),
                    topbar: settings.topbar || this.getDefaultTopbar()
                };
            } else {
                this.currentTheme = this.getDefaultTheme();
            }
        } catch (error) {
            console.warn('Error loading theme from storage:', error);
            this.currentTheme = this.getDefaultTheme();
        }
    }

    getDefaultTheme() {
        return {
            theme: 'auto',
            colors: this.getDefaultColors(),
            topbar: this.getDefaultTopbar()
        };
    }

    getDefaultColors() {
        return {
            accentPrimary: '#67C5FF',
            accentSecondary: '#AA79F9',
            backgroundColor: '#EEF8FF',
            backgroundColorDark: '#1a1a1a',
            textColor: '#125E8E',
            textColorDark: '#E5F4FF',
            sidebarBorderColor: '#18BEFF',
            successColor: '#10B981',
            warningColor: '#F59E0B',
            errorColor: '#EF4444'
        };
    }

    getDefaultTopbar() {
        return {
            preset: 'modern',
            name: 'Glass Blue',
            style: 'glass',
            colors: {
                background: 'rgba(103, 197, 255, 0.15)',
                border: 'rgba(103, 197, 255, 0.3)',
                text: '#125E8E',
                textDark: '#E5F4FF',
                accent: '#67C5FF'
            }
        };
    }

    setupEventListeners() {
        // Listen for theme updates from other pages
        window.addEventListener('remiThemeUpdated', (event) => {
            if (event.detail) {
                this.currentTheme = event.detail;
                this.applyTheme();
            }
        });

        // Listen for storage changes
        window.addEventListener('storage', (event) => {
            if (event.key === 'remiCustomization') {
                this.loadThemeFromStorage();
                this.applyTheme();
            }
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.currentTheme.theme === 'auto') {
                this.applyTheme();
            }
        });
    }

    applyStoredTheme() {
        if (this.currentTheme) {
            this.applyTheme();
        }
    }

    applyTheme() {
        this.applyThemeMode();
        this.applyColors();
        this.applyTopbarStyles();
    }

    applyThemeMode() {
        // Force dark theme only for tracker and tasks pages
        const body = document.body;
        body.setAttribute('data-theme', 'dark');
    }

    applyColors() {
        const root = document.documentElement;
        const colors = this.currentTheme.colors;
        const currentTheme = this.getCurrentTheme();
        
        // Apply custom colors to CSS variables
        root.style.setProperty('--accent-primary', colors.accentPrimary);
        root.style.setProperty('--accent-secondary', colors.accentSecondary);
        root.style.setProperty('--sidebar-border-color', colors.sidebarBorderColor);
        root.style.setProperty('--success-color', colors.successColor);
        root.style.setProperty('--warning-color', colors.warningColor);
        root.style.setProperty('--error-color', colors.errorColor);
        
        // Apply theme-specific colors
        if (currentTheme === 'dark') {
            root.style.setProperty('--background-color', colors.backgroundColorDark || colors.backgroundColor);
            root.style.setProperty('--text-color', colors.textColorDark || colors.textColor);
        } else {
            root.style.setProperty('--background-color', colors.backgroundColor);
            root.style.setProperty('--text-color', colors.textColor);
        }
        
        // Update gradients
        root.style.setProperty('--gradient-start', colors.accentPrimary);
        root.style.setProperty('--gradient-end', colors.accentSecondary);
        
        // Set effective background color
        const effectiveBackgroundColor = currentTheme === 'dark' ? 
            (colors.backgroundColorDark || colors.backgroundColor) : 
            colors.backgroundColor;
        
        root.style.setProperty('--effective-background-color', effectiveBackgroundColor);
    }

    applyTopbarStyles() {
        const topbar = document.querySelector('.topbar');
        if (!topbar || !this.currentTheme.topbar) return;
        
        const topbarConfig = this.currentTheme.topbar;
        const currentTheme = this.getCurrentTheme();
        
        // Apply topbar colors
        this.applyTopbarColors(topbar, topbarConfig.colors, currentTheme);
    }

    applyTopbarColors(topbar, colors, currentTheme) {
        const textColor = currentTheme === 'dark' ? 
            (colors.textDark || colors.text) : 
            colors.text;
        
        // Apply background
        if (colors.background) {
            topbar.style.background = colors.background;
        }
        
        // Apply border
        if (colors.border && colors.border !== 'transparent') {
            topbar.style.borderBottom = `1px solid ${colors.border}`;
        } else {
            topbar.style.borderBottom = 'none';
        }
        
        // Apply text colors to navigation items
        const navItems = topbar.querySelectorAll('.topbar-nav-item, .breadcrumb-item, .breadcrumb-current');
        navItems.forEach(item => {
            item.style.color = textColor;
        });
        
        // Apply accent color to icons and active states
        const icons = topbar.querySelectorAll('i');
        icons.forEach(icon => {
            icon.style.color = colors.accent || textColor;
        });
        
        // Update CSS variables for topbar
        const root = document.documentElement;
        root.style.setProperty('--topbar-bg', colors.background || 'transparent');
        root.style.setProperty('--topbar-text', textColor);
        root.style.setProperty('--topbar-border', colors.border || 'transparent');
        root.style.setProperty('--topbar-accent', colors.accent || colors.text);
    }

    getCurrentTheme() {
        const theme = this.currentTheme.theme;
        
        if (theme === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        return theme;
    }

    // Public method to update theme from other scripts
    updateTheme(newTheme) {
        this.currentTheme = { ...this.currentTheme, ...newTheme };
        this.applyTheme();
        
        // Broadcast to other pages
        window.dispatchEvent(new CustomEvent('remiThemeUpdated', {
            detail: this.currentTheme
        }));
    }

    // Public method to get current theme
    getTheme() {
        return this.currentTheme;
    }
}

// Initialize global theme sync
const globalThemeSync = new GlobalThemeSync();

// Make it globally accessible
window.globalThemeSync = globalThemeSync;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalThemeSync;
}
