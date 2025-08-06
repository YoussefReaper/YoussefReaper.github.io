// ===== UNIVERSAL PAGE SYSTEM =====
// This script ensures consistent theming, navigation, and layout across all pages

(function() {
    'use strict';

    class UniversalPageSystem {
        constructor() {
            this.currentPage = this.detectCurrentPage();
            this.init();
        }

        init() {
            // Apply saved customizations
            this.loadAndApplyCustomizations();
            
            // Set up navigation
            this.setupNavigation();
            
            // Apply theme
            this.applyTheme();
            
            // Set current page indicators
            this.setCurrentPageIndicators();
            
            // Initialize responsive behavior
            this.initializeResponsive();
            
            // Setup theme change listeners
            this.setupThemeListeners();
        }

        detectCurrentPage() {
            const path = window.location.pathname;
            const filename = path.split('/').pop().split('.')[0];
            
            // Map filenames to page identifiers
            const pageMap = {
                'index': 'home',
                'dashboard': 'dashboard',
                'plans': 'plans',
                'chat': 'chat',
                'tasks': 'tasks',
                'schedule': 'schedule',
                'achievements': 'achievements',
                'super-tracker': 'tracker',
                'customization': 'customization',
                'shop': 'shop',
                'about': 'about',
                'about-me': 'about',
                'settings': 'settings'
            };
            
            return pageMap[filename] || 'home';
        }

        loadAndApplyCustomizations() {
            // Load saved customization settings
            const savedSettings = this.loadCustomizationSettings();
            
            // Apply colors
            this.applyColors(savedSettings.colors);
            
            // Apply topbar settings
            this.applyTopbarSettings(savedSettings.topbar);
            
            // Apply backgrounds
            this.applyBackgrounds(savedSettings.backgrounds);
            
            // Apply personality settings (deferred to avoid conflicts with profile manager)
            setTimeout(() => {
                this.applyPersonalitySettings(savedSettings.personality);
                // Ensure GlobalProfileManager applies after personality settings
                if (window.GlobalProfileManager) {
                    window.GlobalProfileManager.applyProfiles();
                }
            }, 100);
        }

        loadCustomizationSettings() {
            const defaultSettings = {
                theme: 'auto',
                colors: {
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
                },
                topbar: {
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
                },
                backgrounds: {
                    chat: { desktop: null, mobile: null },
                    main: { desktop: null, mobile: null },
                    overlayOpacity: 0.85,
                    overlayDarkness: 0.75
                },
                personality: {
                    communicationStyle: 'friendly',
                    relationshipLevel: 65,
                    name: 'Remi',
                    avatar: 'pfp/Remi-pfp.png'
                }
            };

            try {
                const saved = localStorage.getItem('customizationSettings');
                if (saved) {
                    return { ...defaultSettings, ...JSON.parse(saved) };
                }
            } catch (error) {
                console.warn('Failed to load customization settings:', error);
            }
            
            return defaultSettings;
        }

        applyColors(colors) {
            const root = document.documentElement;
            
            // Apply CSS variables
            root.style.setProperty('--accent-primary', colors.accentPrimary);
            root.style.setProperty('--accent-secondary', colors.accentSecondary);
            root.style.setProperty('--background-color', colors.backgroundColor);
            root.style.setProperty('--text-color', colors.textColor);
            root.style.setProperty('--sidebar-border-color', colors.sidebarBorderColor);
            root.style.setProperty('--success-color', colors.successColor);
            root.style.setProperty('--warning-color', colors.warningColor);
            root.style.setProperty('--error-color', colors.errorColor);
            root.style.setProperty('--title-text-color', colors.accentSecondary);
            root.style.setProperty('--icons-color', colors.accentPrimary);
            
            // Convert hex to RGB for gradient usage
            const primaryRgb = this.hexToRgb(colors.accentPrimary);
            const secondaryRgb = this.hexToRgb(colors.accentSecondary);
            
            if (primaryRgb) {
                root.style.setProperty('--accent-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
            }
            if (secondaryRgb) {
                root.style.setProperty('--accent-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
            }
        }

        applyTopbarSettings(topbar) {
            const topbarElement = document.querySelector('.topbar');
            if (!topbarElement) return;

            // Apply topbar styling
            topbarElement.style.background = topbar.colors.background;
            topbarElement.style.borderBottom = `1px solid ${topbar.colors.border}`;
            topbarElement.style.backdropFilter = 'blur(20px)';
            topbarElement.style.color = topbar.colors.text;
        }

        applyBackgrounds(backgrounds) {
            // Apply background settings if any
            if (backgrounds.main && backgrounds.main.desktop) {
                this.applyBackgroundImage(backgrounds.main.desktop, backgrounds.overlayOpacity);
            }
        }

        applyBackgroundImage(imageData, opacity = 0.85) {
            if (!imageData) return;
            
            try {
                const backgroundOverlay = document.querySelector('.background-overlay, #background-overlay');
                if (backgroundOverlay) {
                    backgroundOverlay.style.backgroundImage = `url(${imageData})`;
                    backgroundOverlay.style.backgroundSize = 'cover';
                    backgroundOverlay.style.backgroundPosition = 'center';
                    backgroundOverlay.style.backgroundRepeat = 'no-repeat';
                    backgroundOverlay.style.opacity = opacity;
                }
            } catch (error) {
                console.warn('Failed to apply background image:', error);
            }
        }

        applyPersonalitySettings(personality) {
            // Update Remi/AI personality elements only (not user profile)
            const remiProfilePics = document.querySelectorAll('[data-remi-avatar], .remi-avatar, .ai-avatar');
            const remiNames = document.querySelectorAll('[data-remi-name], .remi-name, .ai-name');
            
            // Apply Remi personality settings
            remiProfilePics.forEach(pic => {
                if (personality.avatar && personality.avatar !== 'pfp/Remi-pfp.png') {
                    pic.style.backgroundImage = `url(${personality.avatar})`;
                    pic.style.backgroundSize = 'cover';
                    pic.style.backgroundPosition = 'center';
                    pic.textContent = '';
                } else {
                    pic.textContent = personality.name ? personality.name.charAt(0).toUpperCase() : 'R';
                }
            });
            
            remiNames.forEach(name => {
                name.textContent = personality.name || 'Remi';
            });
            
            // DO NOT override user profile elements - let GlobalProfileManager handle those
            // User profile elements should be handled by global-profile-manager.js
        }

        setupNavigation() {
            // Add current page class to navigation items
            const navItems = document.querySelectorAll('.nav-option[data-page]');
            navItems.forEach(item => {
                const page = item.getAttribute('data-page');
                if (page === this.currentPage) {
                    item.classList.add('current-page');
                } else {
                    item.classList.remove('current-page');
                }
            });
        }

        setCurrentPageIndicators() {
            // Update breadcrumb
            const breadcrumbCurrent = document.getElementById('current-page-name');
            if (breadcrumbCurrent) {
                const pageNames = {
                    'home': 'Home',
                    'dashboard': 'Dashboard',
                    'plans': 'Plans',
                    'chat': 'Chat',
                    'tasks': 'Tasks',
                    'schedule': 'Schedule',
                    'achievements': 'Achievements',
                    'tracker': 'Tracker',
                    'customization': 'Customization',
                    'shop': 'Shop',
                    'about': 'About',
                    'settings': 'Settings'
                };
                breadcrumbCurrent.textContent = pageNames[this.currentPage] || 'Page';
            }
        }

        applyTheme() {
            const settings = this.loadCustomizationSettings();
            const theme = settings.theme;
            
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else if (theme === 'light') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                // Auto theme - detect system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
            }
        }

        initializeResponsive() {
            // Add responsive behavior
            const handleResize = () => {
                // Adjust layout for mobile
                if (window.innerWidth <= 768) {
                    document.body.classList.add('mobile-layout');
                } else {
                    document.body.classList.remove('mobile-layout');
                }
            };
            
            handleResize();
            window.addEventListener('resize', handleResize);
        }

        setupThemeListeners() {
            // Listen for theme changes from customization page
            window.addEventListener('themeChanged', (event) => {
                this.applyTheme();
                this.loadAndApplyCustomizations();
            });
            
            // Listen for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                this.applyTheme();
            });
        }

        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
    }

    // Initialize the universal page system when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.universalPageSystem = new UniversalPageSystem();
        });
    } else {
        window.universalPageSystem = new UniversalPageSystem();
    }

    // Make it globally available
    window.UniversalPageSystem = UniversalPageSystem;
})();
