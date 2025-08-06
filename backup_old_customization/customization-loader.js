// ===== UNIVERSAL CUSTOMIZATION LOADER =====
// This script applies saved customization settings to any page

(function() {
    'use strict';

    // IndexedDB storage for large files (same as customization.js)
    class LargeFileStorage {
        constructor() {
            this.dbName = 'RemiBackgrounds';
            this.dbVersion = 1;
            this.storeName = 'backgrounds';
            this.db = null;
        }

        async init() {
            if (this.db) return this.db;
            
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                        store.createIndex('type', 'type', { unique: false });
                        store.createIndex('size', 'size', { unique: false });
                    }
                };
            });
        }

        async retrieve(key) {
            try {
                await this.init();
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                
                return new Promise((resolve, reject) => {
                    const request = store.get(key);
                    request.onsuccess = () => {
                        const result = request.result;
                        resolve(result ? result.data : null);
                    };
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.error(`Failed to retrieve ${key} from IndexedDB:`, error);
                return null;
            }
        }
    }

    // Initialize the large file storage
    const largeFileStorage = new LargeFileStorage();

    // Enhanced data retrieval with IndexedDB first
    async function retrieveBackgroundData(key) {
        // Try IndexedDB first (primary storage method)
        const indexedData = await largeFileStorage.retrieve(key);
        if (indexedData) {
            console.log(`Loader: Retrieved ${key} from IndexedDB`);
            return indexedData;
        }
        
        // Try localStorage chunked second
        const chunkedData = retrieveDataFromChunks(key);
        if (chunkedData) {
            console.log(`Loader: Retrieved ${key} from localStorage chunks`);
            return chunkedData;
        }
        
        // Try direct localStorage last
        const directData = localStorage.getItem(key);
        if (directData) {
            console.log(`Loader: Retrieved ${key} from direct localStorage`);
            return directData;
        }
        
        console.warn(`Loader: No data found for ${key} in any storage method`);
        return null;
    }

    // Chunked storage utilities for the loader (legacy support)
    function retrieveDataFromChunks(key) {
        try {
            const chunkCount = parseInt(localStorage.getItem(`${key}_chunks`));
            if (isNaN(chunkCount) || chunkCount === 0) {
                return null;
            }
            
            let data = '';
            for (let i = 0; i < chunkCount; i++) {
                const chunk = localStorage.getItem(`${key}_chunk_${i}`);
                if (chunk === null) {
                    console.warn(`Missing chunk ${i} for ${key}`);
                    return null;
                }
                data += chunk;
            }
            
            return data;
        } catch (error) {
            console.error(`Error retrieving chunked data for ${key}:`, error);
            return null;
        }
    }

    // Default settings (same as in customization.js)
    const DEFAULT_SETTINGS = {
        theme: 'auto',
        colors: {
            accentPrimary: '#67C5FF',
            accentSecondary: '#AA79F9',
            backgroundColor: '#EEF8FF',
            textColor: '#125E8E',
            sidebarBorderColor: '#18BEFF',
            successColor: '#10B981',
            warningColor: '#F59E0B',
            errorColor: '#EF4444'
        },
        topbar: {
            preset: 'modern',
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
            chat: null,
            main: null,
            overlayOpacity: 0.85,
            overlayDarkness: 0.75
        },
        personality: {
            communicationStyle: 'friendly',
            relationshipLevel: 65,
            name: 'Auro',
            avatar: 'pfp/Auro_Logo.png'
        },
        preferences: {
            autoExpandSidebar: false,
            typingIndicators: true,
            smoothAnimations: true,
            soundEffects: false,
            compactMode: false,
            autoSave: true
        }
    };

    let currentSettings = { ...DEFAULT_SETTINGS };

    // Load and apply settings immediately
    async function loadAndApplySettings() {
        try {
            const saved = localStorage.getItem('remiCustomization');
            if (saved) {
                currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
                
                // Handle stored backgrounds (new system)
                for (const bgType of Object.keys(currentSettings.backgrounds)) {
                    const bg = currentSettings.backgrounds[bgType];
                    
                    if (bg && bg.isStored) {
                        console.log(`Loader: Loading stored background: ${bgType} (${bg.storageMethod || 'unknown method'})`);
                        
                        const storageKey = bg.storageKey || `remiBackground_${bgType}`;
                        const storedData = await retrieveBackgroundData(storageKey);
                        
                        if (storedData) {
                            bg.url = storedData;
                            bg.base64Size = (storedData.length * 3) / 4;
                            
                            // Create object URL for performance
                            try {
                                const base64Data = storedData.split(',')[1];
                                const mimeType = storedData.split(',')[0].split(':')[1].split(';')[0];
                                const byteCharacters = atob(base64Data);
                                const byteNumbers = new Array(byteCharacters.length);
                                
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: mimeType });
                                bg.objectURL = URL.createObjectURL(blob);
                                
                                // Ensure background is not marked as temporary
                                delete bg.isTemporary;
                                delete bg.needsReupload;
                                
                                console.log(`Loader: Restored stored ${bg.type} background: ${bg.filename} (${(bg.base64Size / 1024).toFixed(0)}KB)`);
                            } catch (error) {
                                console.warn(`Loader: Error creating object URL for stored ${bgType}:`, error);
                                // Even if object URL creation fails, keep the base64 URL
                                delete bg.isTemporary;
                            }
                        } else {
                            console.warn(`Loader: Failed to load stored background: ${bgType}`);
                            // Instead of marking as needs reupload, remove the background
                            currentSettings.backgrounds[bgType] = null;
                        }
                    }
                    // Handle legacy chunked backgrounds
                    else if (bg && bg.isChunked) {
                        console.log(`Loader: Loading legacy chunked background: ${bgType}`);
                        
                        const chunkKey = bg.chunkKey || `remiBackground_${bgType}`;
                        const chunkedData = retrieveDataFromChunks(chunkKey);
                        
                        if (chunkedData) {
                            bg.url = chunkedData;
                            bg.base64Size = (chunkedData.length * 3) / 4;
                            
                            // Create object URL for performance
                            try {
                                const base64Data = chunkedData.split(',')[1];
                                const mimeType = chunkedData.split(',')[0].split(':')[1].split(';')[0];
                                const byteCharacters = atob(base64Data);
                                const byteNumbers = new Array(byteCharacters.length);
                                
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: mimeType });
                                bg.objectURL = URL.createObjectURL(blob);
                                
                                // Ensure background is not marked as temporary
                                delete bg.isTemporary;
                                delete bg.needsReupload;
                                
                                console.log(`Loader: Restored chunked ${bg.type} background: ${bg.filename} (${(bg.base64Size / 1024).toFixed(0)}KB)`);
                            } catch (error) {
                                console.warn(`Loader: Error creating object URL for chunked ${bgType}:`, error);
                                // Even if object URL creation fails, keep the base64 URL
                                delete bg.isTemporary;
                            }
                        } else {
                            console.warn(`Loader: Failed to load chunked background: ${bgType}`);
                            // Instead of marking as needs reupload, remove the background
                            currentSettings.backgrounds[bgType] = null;
                        }
                    }
                    // Handle legacy direct storage
                    else if (bg && bg.url && bg.url.startsWith('data:') && !bg.isStored && !bg.isChunked) {
                        try {
                            // Convert base64 to blob and create object URL for better performance
                            const base64Data = bg.url.split(',')[1];
                            const mimeType = bg.url.split(',')[0].split(':')[1].split(';')[0];
                            const byteCharacters = atob(base64Data);
                            const byteNumbers = new Array(byteCharacters.length);
                            
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            
                            const byteArray = new Uint8Array(byteNumbers);
                            const blob = new Blob([byteArray], { type: mimeType });
                            const objectURL = URL.createObjectURL(blob);
                            
                            // Keep both base64 (for persistence) and object URL (for performance)
                            bg.objectURL = objectURL;
                            
                            // Ensure background is not marked as temporary
                            delete bg.isTemporary;
                            delete bg.needsReupload;
                            
                            console.log(`Loader: Restored direct ${bg.type} background: ${bg.filename}`);
                        } catch (error) {
                            console.warn(`Loader: Failed to create object URL for ${bgType} background:`, error);
                            // Base64 data will still work, just less performant
                            delete bg.isTemporary;
                            delete bg.needsReupload;
                        }
                    }
                }
                
                console.log('Customization settings loaded and applied successfully with advanced storage support');
            } else {
                console.log('No saved customization settings found, using defaults');
            }
        } catch (error) {
            console.error('Error loading customization settings:', error);
            currentSettings = { ...DEFAULT_SETTINGS };
        }

        applyAllSettings();
    }

    // Apply all customization settings
    function applyAllSettings() {
        applyTheme();
        applyColors();
        applyTopbarStyles();
        applyBackgrounds();
        applyPersonality();
        applyPreferences();
    }

    // Apply theme settings
    function applyTheme() {
        const theme = currentSettings.theme;
        const body = document.body;
        
        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            body.setAttribute('data-theme', theme);
        }
    }    // Apply color settings
    function applyColors() {
        const root = document.documentElement;
        const colors = currentSettings.colors;
        
        // Apply custom colors to CSS variables
        root.style.setProperty('--accent-primary', colors.accentPrimary);
        root.style.setProperty('--accent-secondary', colors.accentSecondary);
        root.style.setProperty('--success-color', colors.successColor);
        root.style.setProperty('--warning-color', colors.warningColor);
        root.style.setProperty('--error-color', colors.errorColor);
        
        // Update gradients
        root.style.setProperty('--gradient-start', colors.accentPrimary);
        root.style.setProperty('--gradient-end', colors.accentSecondary);

        // Update other color variables for consistency
        root.style.setProperty('--icons-color', colors.accentPrimary);
        root.style.setProperty('--sidebar-border-color', colors.sidebarBorderColor);
        root.style.setProperty('--title-text-color', colors.accentSecondary);
        
        // Additional color mappings for comprehensive coverage
        root.style.setProperty('--button-hover-bg-color', colors.accentPrimary);
        root.style.setProperty('--text-shadow-color', colors.accentPrimary);
        root.style.setProperty('--completion-color', colors.successColor);
        root.style.setProperty('--late-color', colors.warningColor);
        root.style.setProperty('--not-done-color', colors.errorColor);
        root.style.setProperty('--in-progress-color', colors.accentPrimary);
        
        // Update theme-specific background if applicable
        if (colors.backgroundColor) {
            root.style.setProperty('--background-color', colors.backgroundColor);
        }
        if (colors.textColor) {
            root.style.setProperty('--text-color', colors.textColor);
        }
    }

    // Apply topbar styles
    function applyTopbarStyles() {
        // Support both .topbar and .topbar-menu classes for different page layouts
        const topbar = document.querySelector('.topbar, .topbar-menu');
        if (!topbar) return;

        // If no topbar settings exist, use default
        if (!currentSettings.topbar) {
            currentSettings.topbar = DEFAULT_SETTINGS.topbar;
        }

        const preset = currentSettings.topbar.preset;
        const colors = currentSettings.topbar.colors;
        
        // Remove all existing preset classes
        topbar.classList.remove('topbar-modern', 'topbar-solid', 'topbar-gradient', 'topbar-minimal', 'topbar-dark', 'topbar-neon', 'topbar-ocean', 'topbar-sunset', 'topbar-forest', 'topbar-cosmic');
        
        // Add the new preset class
        if (preset) {
            topbar.classList.add(`topbar-${preset}`);
        }
        
        // Apply colors from preset if available
        if (colors) {
            applyTopbarColors(topbar, colors);
        }
    }

    // Apply colors to topbar
    function applyTopbarColors(topbar, colors) {
        if (!colors) return;
        
        try {
            const currentTheme = getCurrentTheme();
            const root = document.documentElement;
            
            // Apply background
            if (colors.background) {
                topbar.style.background = colors.background;
                root.style.setProperty('--topbar-background', colors.background);
            }
            
            // Apply border
            if (colors.border === 'none') {
                topbar.style.border = 'none';
                root.style.setProperty('--topbar-border', 'none');
            } else if (colors.border) {
                topbar.style.border = `1px solid ${colors.border}`;
                root.style.setProperty('--topbar-border', colors.border);
            }
            
            // Apply theme-aware text color
            const textColor = currentTheme === 'dark' ? (colors.textDark || colors.text) : colors.text;
            if (textColor) {
                topbar.style.color = textColor;
                root.style.setProperty('--topbar-text-color', textColor);
            }
            
            // Set accent color for interactions
            if (colors.accent) {
                root.style.setProperty('--topbar-accent-color', colors.accent);
                
                // Extract RGB values for rgba usage in CSS
                const accentHex = colors.accent.replace('#', '');
                if (accentHex.length === 6) {
                    const accentR = parseInt(accentHex.substr(0, 2), 16);
                    const accentG = parseInt(accentHex.substr(2, 2), 16);
                    const accentB = parseInt(accentHex.substr(4, 2), 16);
                    root.style.setProperty('--topbar-accent-rgb', `${accentR}, ${accentG}, ${accentB}`);
                }
            }
            
            // Apply backdrop filter for glass effects
            if (colors.background && colors.background.includes('rgba')) {
                topbar.style.backdropFilter = 'blur(20px)';
                topbar.style.webkitBackdropFilter = 'blur(20px)';
            } else {
                topbar.style.backdropFilter = 'none';
                topbar.style.webkitBackdropFilter = 'none';
            }
            
            // Apply box shadow based on style
            if (colors.background && colors.background.includes('gradient') && colors.accent) {
                topbar.style.boxShadow = `0 4px 20px ${colors.accent}40`; // 40 is hex alpha for 25%
            } else if (colors.background && colors.background.includes('rgba')) {
                topbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            } else if (colors.border === 'none') {
                topbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            } else if (colors.border && colors.accent) {
                topbar.style.boxShadow = `0 0 20px ${colors.border}, inset 0 0 20px ${colors.accent}20`;
            }
            
            // Apply accent color to interactive elements
            const buttons = topbar.querySelectorAll('button, .btn, .topbar-item, .topbar-nav-item');
            buttons.forEach(button => {
                if (colors.accent) {
                    button.style.setProperty('--topbar-accent', colors.accent);
                }
                if (textColor) {
                    button.style.color = textColor;
                }
                
                // Remove any existing event listeners by cloning the button
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // Add hover effects
                if (colors.accent && textColor) {
                    newButton.addEventListener('mouseenter', function() {
                        this.style.backgroundColor = `${colors.accent}20`;
                        this.style.color = colors.accent;
                    });
                    
                    newButton.addEventListener('mouseleave', function() {
                        this.style.backgroundColor = 'transparent';
                        this.style.color = textColor;
                    });
                }
            });
            
            // Apply to text elements
            if (textColor) {
                const textElements = topbar.querySelectorAll('.topbar-text, .topbar-title, span, p, .breadcrumb-item, .breadcrumb-current');
                textElements.forEach(element => {
                    element.style.color = textColor;
                });
            }
            
            // Apply to icons
            if (colors.accent) {
                const icons = topbar.querySelectorAll('i, .icon, svg');
                icons.forEach(icon => {
                    icon.style.color = colors.accent;
                });
            }
            
            // Apply to breadcrumb separators
            if (textColor) {
                const separators = topbar.querySelectorAll('.breadcrumb-separator');
                separators.forEach(separator => {
                    separator.style.color = `${textColor}80`; // 50% opacity
                });
            }
        } catch (error) {
            console.warn('Error applying topbar colors:', error);
        }
    }

    // Get current theme (needed for topbar styling)
    function getCurrentTheme() {
        const theme = currentSettings.theme;
        
        if (theme === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        return theme;
    }

    // Apply background settings
    function applyBackgrounds() {
        // Apply chat background
        if (currentSettings.backgrounds.chat) {
            applyBackgroundToElement('.chat-container, .chat-messages, .messages-container', currentSettings.backgrounds.chat);
        }
        
        // Apply main background to various page containers
        if (currentSettings.backgrounds.main) {
            applyBackgroundToElement('.main-content, .hero-section, .content-container, .page-container', currentSettings.backgrounds.main);
        }
        
        // Apply background overlay settings
        applyBackgroundOverlay();
    }

    function applyBackgroundOverlay() {
        // Set CSS custom properties for overlay opacity
        const opacity = currentSettings.backgrounds.overlayOpacity || 0.85;
        document.documentElement.style.setProperty('--bg-overlay-opacity', opacity);
    }

    function applyBackgroundToElement(selector, backgroundData) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element && backgroundData) {
                // Get media URL - prioritize object URL for current session, then base64 data URL
                const mediaUrl = backgroundData.objectURL || backgroundData.url;
                
                if (mediaUrl && backgroundData.type) {
                    if (backgroundData.type === 'video') {
                        // Handle video backgrounds for chat
                        if (selector.includes('chat-')) {
                            const video = document.getElementById('chatBackgroundVideo');
                            const wrapper = document.querySelector('.chat-messages-wrapper');
                            
                            if (video && wrapper) {
                                // Stop current video first
                                video.pause();
                                video.currentTime = 0;
                                video.src = '';
                                video.load();
                                
                                // Configure video properties
                                video.loop = true;
                                video.muted = true;
                                video.setAttribute('playsinline', 'true');
                                
                                video.src = mediaUrl;
                                video.style.display = 'block';
                                
                                // Wait for video to be ready
                                video.addEventListener('canplay', function startVideo() {
                                    video.removeEventListener('canplay', startVideo);
                                    video.play().catch(e => {
                                        console.warn('Chat video play failed:', e.message);
                                    });
                                }, { once: true });
                                
                                video.load();
                                
                                // Mark wrapper as having background for overlay support
                                wrapper.setAttribute('data-has-background', 'true');
                                
                                // Clear any background styles to let video show through
                                element.style.backgroundImage = 'none';
                                element.style.background = 'transparent';
                                wrapper.style.background = 'transparent';
                                
                                console.log('Video background applied:', backgroundData.filename || 'Unknown');
                            }
                        }
                    } else if (backgroundData.type === 'image') {
                        // Hide video if switching from video to image
                        if (selector.includes('chat-')) {
                            const video = document.getElementById('chatBackgroundVideo');
                            const wrapper = document.querySelector('.chat-messages-wrapper');
                            
                            if (video) {
                                video.pause();
                                video.style.display = 'none';
                                video.src = '';
                            }
                            if (wrapper) {
                                wrapper.removeAttribute('data-has-background');
                            }
                        }
                        
                        element.style.backgroundImage = `url(${mediaUrl})`;
                        element.style.backgroundSize = 'cover';
                        element.style.backgroundPosition = 'center';
                        element.style.backgroundRepeat = 'no-repeat';
                        
                        console.log('Image background applied:', backgroundData.filename || 'Unknown');
                    } else if (backgroundData.type === 'gradient') {
                        // Hide video if switching from video to gradient
                        if (selector.includes('chat-')) {
                            const video = document.getElementById('chatBackgroundVideo');
                            const wrapper = document.querySelector('.chat-messages-wrapper');
                            
                            if (video) {
                                video.pause();
                                video.style.display = 'none';
                                video.src = '';
                            }
                            if (wrapper) {
                                wrapper.removeAttribute('data-has-background');
                            }
                        }
                        
                        element.style.background = backgroundData.gradient;
                    }
                } else {
                    // No media URL available, clear background
                    if (selector.includes('chat-')) {
                        const video = document.getElementById('chatBackgroundVideo');
                        const wrapper = document.querySelector('.chat-messages-wrapper');
                        
                        if (video) {
                            video.pause();
                            video.style.display = 'none';
                            video.src = '';
                        }
                        if (wrapper) {
                            wrapper.removeAttribute('data-has-background');
                        }
                    }
                    
                    element.style.backgroundImage = '';
                    element.style.background = '';
                }
            } else {
                // Clear background when no data
                if (selector.includes('chat-')) {
                    const video = document.getElementById('chatBackgroundVideo');
                    const wrapper = document.querySelector('.chat-messages-wrapper');
                    
                    if (video) {
                        video.pause();
                        video.style.display = 'none';
                        video.src = '';
                    }
                    if (wrapper) {
                        wrapper.removeAttribute('data-has-background');
                    }
                }
                
                element.style.backgroundImage = '';
                element.style.background = '';
            }
        });
    }    // Apply personality settings
    function applyPersonality() {
        const personality = currentSettings.personality;
        
        // Update Remi name in various elements
        const nameElements = document.querySelectorAll('.remi-name, .ai-name, [data-remi-name], .hero-title .gradient-text');
        nameElements.forEach(element => {
            if (element.classList.contains('gradient-text') || element.closest('.hero-title')) {
                // For hero title, only update if it contains "Remi"
                const text = element.textContent;
                if (text.includes('Remi')) {
                    element.textContent = text.replace('Remi', personality.name);
                }
            } else {
                element.textContent = personality.name;
            }
        });

        // Update Remi avatar in various elements
        const avatarElements = document.querySelectorAll('.remi-avatar img, .ai-avatar, .avatar-img, [data-remi-avatar]');
        avatarElements.forEach(element => {
            element.src = personality.avatar;
            element.alt = personality.name;
        });

        // Update communication style indicators
        const styleElements = document.querySelectorAll('[data-communication-style], .relationship-level');
        styleElements.forEach(element => {
            element.textContent = getStyleDescription(personality.communicationStyle);
        });

        // Update relationship level displays
        updateRelationshipDisplays();
        
        // Update page title if it contains Remi
        if (document.title.includes('Remi')) {
            document.title = document.title.replace('Remi', personality.name);
        }
    }

    function getStyleDescription(style) {
        const descriptions = {
            friendly: 'Your AI Study Companion',
            professional: 'Your AI Assistant',
            casual: 'Your Study Buddy'
        };
        return descriptions[style] || descriptions.friendly;
    }    function updateRelationshipDisplays() {
        const level = currentSettings.personality.relationshipLevel;
        
        // Update relationship meters
        const meters = document.querySelectorAll('.meter-fill, .relationship-meter .meter-fill, [data-relationship-meter]');
        meters.forEach(meter => {
            meter.style.width = `${level}%`;
        });

        // Update relationship percentages
        const percentages = document.querySelectorAll('.relationship-percentage, [data-relationship-percentage]');
        percentages.forEach(element => {
            element.textContent = `${level}%`;
        });

        // Update relationship text and labels
        const relationshipTexts = document.querySelectorAll('.relationship-text, [data-relationship-text], .meter-label');
        relationshipTexts.forEach(element => {
            let relationship = 'Acquaintance';
            if (level >= 21 && level < 41) relationship = 'Acquaintance';
            else if (level >= 41 && level < 71) relationship = 'Friend';
            else if (level >= 71 && level < 91) relationship = 'Close Friend';
            else if (level >= 91) relationship = 'Best Friend';
            else if (level < 21) relationship = 'Stranger';
            
            element.textContent = `${relationship} (${level}%)`;
        });
        
        // Update mood indicators based on relationship level
        const moodElements = document.querySelectorAll('.mood-emoji, .mood-indicator');
        moodElements.forEach(element => {
            let emoji = '😐';
            if (level >= 21 && level < 41) emoji = '🙂';
            else if (level >= 41 && level < 71) emoji = '😊';
            else if (level >= 71 && level < 91) emoji = '🥰';
            else if (level >= 91) emoji = '💖';
            
            if (element.classList.contains('mood-emoji')) {
                element.textContent = emoji;
            }
        });
    }

    // Apply preference settings
    function applyPreferences() {
        const prefs = currentSettings.preferences;
        const body = document.body;
        
        // Apply smooth animations
        if (prefs.smoothAnimations) {
            body.classList.add('smooth-animations');
        } else {
            body.classList.remove('smooth-animations');
        }
        
        // Apply compact mode
        if (prefs.compactMode) {
            body.classList.add('compact-mode');
        } else {
            body.classList.remove('compact-mode');
        }

        // Apply auto-expand sidebar
        if (prefs.autoExpandSidebar) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.add('auto-expanded');
            }
        }
    }

    // Function to trigger updates across all open tabs/windows
    function broadcastCustomizationUpdate() {
        // Dispatch custom event for same-page updates
        window.dispatchEvent(new CustomEvent('remiCustomizationUpdated'));
        
        // Store a timestamp to trigger storage events in other tabs
        localStorage.setItem('remiCustomizationTimestamp', Date.now().toString());
    }    // Listen for storage changes to update settings in real-time
    function setupStorageListener() {
        window.addEventListener('storage', function(e) {
            if (e.key === 'remiCustomization' || e.key === 'remiCustomizationTimestamp') {
                loadAndApplySettings().catch(error => {
                    console.error('Error loading settings from storage event:', error);
                });
            }
        });

        // Also listen for custom events from the customization page
        window.addEventListener('remiCustomizationUpdated', function() {
            loadAndApplySettings().catch(error => {
                console.error('Error loading settings from custom event:', error);
            });
        });
    }

    // Initialize when DOM is ready
    function initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadAndApplySettings().catch(error => {
                    console.error('Error loading settings on DOM ready:', error);
                });
            });
        } else {
            loadAndApplySettings().catch(error => {
                console.error('Error loading settings on initialize:', error);
            });
        }
        
        setupStorageListener();
        
        // Re-apply settings when theme changes (for auto theme)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    }

    // Auto-initialize
    initialize();

    // Expose global functions for external use
    window.refreshCustomization = loadAndApplySettings;
    window.broadcastCustomization = broadcastCustomizationUpdate;

})();
