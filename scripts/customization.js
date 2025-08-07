// ===== CUSTOMIZATION SCRIPT =====

// ===== MOBILE DETECTION AND DEVICE MANAGEMENT =====

function isMobile() {
    return window.innerWidth <= 768;
}

function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function getMobileOptimizations() {
    return {
        reduceAnimations: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        supportsWebP: supportsWebP(),
        lowMemoryDevice: navigator.deviceMemory && navigator.deviceMemory < 4,
        connectionSpeed: getConnectionSpeed()
    };
}

function supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('webp') > -1;
}

function getConnectionSpeed() {
    if (navigator.connection) {
        const connection = navigator.connection;
        if (connection.effectiveType) {
            return connection.effectiveType; // 'slow-2g', '2g', '3g', '4g'
        }
    }
    return 'unknown';
}

// Default settings
const DEFAULT_SETTINGS = {
    theme: 'dark',
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
        chat: {
            desktop: null,
            mobile: null
        },
        main: {
            desktop: null,
            mobile: null
        },
        overlayOpacity: 0.85,
        overlayDarkness: 0.75,
        mobile: {
            optimizeForMobile: true,
            reduceMotion: false,
            chatOptimization: true,
            mainOptimization: true
        }
    },
    personality: {
        communicationStyle: 'friendly',
        relationshipLevel: 65,
        name: 'Remi',
        avatar: 'pfp/Remi-pfp.png'
    },
    preferences: {
        autoExpandSidebar: false,
        typingIndicators: true,
        smoothAnimations: true,
        soundEffects: false,
        compactMode: false,
        autoSave: false
    }
};

// Current settings (loaded from localStorage or defaults)
// Initialize settings - don't use defaults if user has customizations
let currentSettings = {};
const hasUserCustomizations = localStorage.getItem('hasUserCustomizations') === 'true' || 
                             localStorage.getItem('preventDefaultReversion') === 'true';

if (!hasUserCustomizations) {
    currentSettings = { ...DEFAULT_SETTINGS };
    console.log('Initializing with default settings (first time)');
} else {
    // Initialize with defaults to prevent undefined errors, will be overridden by loadSettings
    currentSettings = { ...DEFAULT_SETTINGS };
    console.log('User has customizations - initializing with defaults, will load from storage');
}

// Track unsaved changes
let hasUnsavedChanges = false;
let originalSettings = null;

// Early theme application to prevent flash
(function earlyThemeApplication() {
    try {
        const saved = localStorage.getItem('remiCustomization');
        if (saved) {
            const settings = JSON.parse(saved);
            const theme = settings.theme || 'dark';
            
            // Always apply dark theme regardless of setting
            document.documentElement.setAttribute('data-theme', 'dark');
            console.log('Early theme applied: dark (forced)');
        } else {
            // No saved settings, apply dark theme
            document.documentElement.setAttribute('data-theme', 'dark');
            console.log('Early theme applied: dark (default)');
        }
    } catch (error) {
        console.warn('Early theme application failed:', error);
        // Fallback to dark theme
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', async function() {
    await loadSettings();
    // Store original settings for change tracking
    originalSettings = JSON.parse(JSON.stringify(currentSettings));
    
    // Apply theme immediately before any other setup
    applyTheme();
    
    initializeEventListeners();
    populateInterface();
    updatePreview();
    applySettings();
    setupSaveActions();
    initializeDeviceModeManager();
    
    // Initialize coin system integration after a brief delay to ensure coin-system.js is loaded
    setTimeout(initializeCoinSystemIntegration, 100);
    
    // Note: Removed system theme change listener since we always use dark theme
    
    // Also setup save actions with additional delay to ensure DOM is ready
    setTimeout(() => {
        if (document.getElementById('saveCustomizations')) {
            console.log('Setting up save actions again to ensure proper binding...');
            setupSaveActions();
        }
        
        // Setup chat element observer for dynamic content
        setupChatElementObserver();
        
        // Apply initial dark theme to any existing chat elements
        forceDarkThemeForChatElements();
    }, 1000);
});

// ===== DEVICE MODE MANAGEMENT =====

let currentDeviceMode = 'auto'; // 'auto', 'desktop', 'mobile'

function initializeDeviceModeManager() {
    // Auto-detect device mode
    updateDeviceMode();
    
    // Set up mode switcher buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            setDeviceMode(mode);
        });
    });
    
    // Listen for window resize to update auto mode
    window.addEventListener('resize', () => {
        if (currentDeviceMode === 'auto') {
            updateDeviceMode();
        }
    });
    
    // Update UI elements based on current mode
    updateDeviceModeUI();
}

function setDeviceMode(mode) {
    currentDeviceMode = mode;
    updateDeviceMode();
    updateDeviceModeUI();
    
    // Update mode switcher buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function updateDeviceMode() {
    const isCurrentlyMobile = isMobile();
    const deviceIcon = document.getElementById('currentDeviceIcon');
    const deviceText = document.getElementById('currentDeviceText');
    
    if (deviceIcon && deviceText) {
        if (isCurrentlyMobile) {
            deviceIcon.className = 'fas fa-mobile-alt';
            deviceText.textContent = 'Mobile Mode';
        } else {
            deviceIcon.className = 'fas fa-desktop';
            deviceText.textContent = 'Desktop Mode';
        }
    }
    
    // Auto-show mobile options on mobile devices
    const mobileOptions = document.querySelectorAll('.mobile-options');
    mobileOptions.forEach(option => {
        if (isCurrentlyMobile) {
            option.style.display = 'block';
        }
    });
}

function updateDeviceModeUI() {
    const isCurrentlyMobile = isMobile();
    
    // Toggle text visibility based on device
    const desktopElements = document.querySelectorAll('.desktop-label, .desktop-text');
    const mobileElements = document.querySelectorAll('.mobile-label, .mobile-text');
    
    desktopElements.forEach(el => {
        el.style.display = isCurrentlyMobile ? 'none' : 'block';
    });
    
    mobileElements.forEach(el => {
        el.style.display = isCurrentlyMobile ? 'block' : 'none';
    });
    
    // Update background groups with mobile indicators
    const backgroundGroups = document.querySelectorAll('.background-group');
    backgroundGroups.forEach(group => {
        if (isCurrentlyMobile) {
            group.setAttribute('data-mobile', 'true');
        } else {
            group.removeAttribute('data-mobile');
        }
    });
}

// ===== CHANGE TRACKING =====

function markAsChanged() {
    if (!hasUnsavedChanges) {
        hasUnsavedChanges = true;
        updateSaveIndicators();
    }
}

function markAsSaved() {
    hasUnsavedChanges = false;
    originalSettings = JSON.parse(JSON.stringify(currentSettings));
    updateSaveIndicators();
}

function updateSaveIndicators() {
    const unsavedIndicator = document.getElementById('unsavedIndicator');
    const savedIndicator = document.getElementById('savedIndicator');
    const saveBtn = document.getElementById('saveCustomizations');
    
    if (unsavedIndicator && savedIndicator && saveBtn) {
        if (hasUnsavedChanges) {
            unsavedIndicator.style.display = 'flex';
            savedIndicator.style.display = 'none';
            saveBtn.classList.add('pulse');
            saveBtn.disabled = false;
        } else {
            unsavedIndicator.style.display = 'none';
            savedIndicator.style.display = 'flex';
            saveBtn.classList.remove('pulse');
            // Keep save button enabled so users can always save their current state
            saveBtn.disabled = false;
            
            // Hide saved indicator after 3 seconds
            setTimeout(() => {
                if (savedIndicator) {
                    savedIndicator.style.display = 'none';
                }
            }, 3000);
        }
    }
}

function setupSaveActions() {
    console.log('Setting up save actions...');
    
    // Save button with multiple attempts
    const setupSaveButton = () => {
        const saveBtn = document.getElementById('saveCustomizations');
        console.log('Save button found:', saveBtn);
        
        if (saveBtn) {
            // Remove any existing listeners first
            saveBtn.replaceWith(saveBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('saveCustomizations');
            
            newSaveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Save button clicked!');
                console.log('Current settings:', currentSettings);
                
                try {
                    const success = saveSettings();
                    if (success) {
                        markAsSaved();
                        console.log('Save successful, marked as saved');
                    }
                } catch (error) {
                    console.error('Error in save button handler:', error);
                    showNotification('Error saving settings: ' + error.message, 'error');
                }
            });
            
            console.log('Save button event listener attached');
            return true;
        }
        return false;
    };
    
    // Try immediately
    if (!setupSaveButton()) {
        // If not found, try again after short delays
        setTimeout(() => {
            if (!setupSaveButton()) {
                console.error('Save button not found after first delay, trying again...');
                setTimeout(() => {
                    if (!setupSaveButton()) {
                        console.error('Save button not found after second delay');
                    }
                }, 500);
            }
        }, 100);
    }
    
    // Reset to defaults button
    const setupResetButton = () => {
        const resetBtn = document.getElementById('resetToDefaults');
        console.log('Reset button found:', resetBtn);
        
        if (resetBtn) {
            resetBtn.replaceWith(resetBtn.cloneNode(true));
            const newResetBtn = document.getElementById('resetToDefaults');
            
            newResetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Reset button clicked!');
                try {
                    resetToDefaults();
                } catch (error) {
                    console.error('Error resetting to defaults:', error);
                    showNotification('Error resetting settings: ' + error.message, 'error');
                }
            });
            
            console.log('Reset button event listener attached');
            return true;
        }
        return false;
    };
    
    // Try immediately
    if (!setupResetButton()) {
        // If not found, try again after a short delay
        setTimeout(() => {
            if (!setupResetButton()) {
                console.error('Reset button not found after delay');
            }
        }, 100);
    }
    
    // Export settings button
    const exportBtn = document.getElementById('exportSettings');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportCustomizations();
        });
    }
    
    // Import settings button
    const importBtn = document.getElementById('importSettingsBtn');
    const importInput = document.getElementById('importInput');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', function() {
            importInput.click();
        });
        
        // This event listener is already handled in the existing code,
        // but we'll modify it to mark as changed
    }
    
    // Initial state
    updateSaveIndicators();
}

// ===== SETTINGS MANAGEMENT =====

async function loadSettings() {
    try {
        console.log('Loading customization settings...');
        const saved = localStorage.getItem('remiCustomization');
        const hasUserCustomizations = localStorage.getItem('hasUserCustomizations') === 'true' || 
                                     localStorage.getItem('preventDefaultReversion') === 'true';
        
        if (!saved) {
            if (!hasUserCustomizations) {
                console.log('No saved settings found, using defaults (first time)');
                currentSettings = { ...DEFAULT_SETTINGS };
                // Mark that defaults are being used for first time
                localStorage.setItem('hasUserCustomizations', 'true');
            } else {
                console.log('No saved settings but user had customizations - keeping current');
                return;
            }
            populateInterface();
            return;
        }
        
        const parsedSettings = JSON.parse(saved);
        
        if (hasUserCustomizations) {
            // User has made customizations - use their settings without default merging
            currentSettings = parsedSettings;
            console.log('Loading user customizations without default merge');
            
            // Ensure critical properties exist with proper defaults
            if (!currentSettings.colors) {
                currentSettings.colors = { ...DEFAULT_SETTINGS.colors };
            } else {
                // Merge missing color properties with defaults
                currentSettings.colors = { ...DEFAULT_SETTINGS.colors, ...currentSettings.colors };
            }
            if (!currentSettings.backgrounds) {
                currentSettings.backgrounds = { ...DEFAULT_SETTINGS.backgrounds };
            }
            if (!currentSettings.topbar) {
                currentSettings.topbar = { ...DEFAULT_SETTINGS.topbar };
            }
            if (!currentSettings.personality) {
                currentSettings.personality = { ...DEFAULT_SETTINGS.personality };
            }
            if (!currentSettings.preferences) {
                currentSettings.preferences = { ...DEFAULT_SETTINGS.preferences };
            }
        } else {
            // First time loading - merge with defaults
            currentSettings = { ...DEFAULT_SETTINGS, ...parsedSettings };
            currentSettings.colors = { ...DEFAULT_SETTINGS.colors, ...currentSettings.colors };
            console.log('Loading settings with default merge (first time)');
            
            // Mark that user now has customizations
            localStorage.setItem('hasUserCustomizations', 'true');
        }
        
        // Handle stored backgrounds (new system)
        for (const bgType of Object.keys(currentSettings.backgrounds)) {
            // Skip non-background settings like 'mobile', 'overlayOpacity', etc.
            if (bgType === 'mobile' || bgType === 'overlayOpacity' || bgType === 'overlayDarkness') {
                continue;
            }
            
            const bgSection = currentSettings.backgrounds[bgType];
            
            // Handle new structure (desktop/mobile separation)
            if (bgSection && typeof bgSection === 'object') {
                for (const deviceType of ['desktop', 'mobile']) {
                    const bg = bgSection[deviceType];
                    
                    if (bg && bg.isStored) {
                        console.log(`Loading stored ${deviceType} background: ${bgType} (${bg.storageMethod || 'unknown method'})`);
                        
                        const storageKey = bg.storageKey || `remiBackground_${bgType}_${deviceType}`;
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
                                
                                console.log(`Restored stored ${bg.type} ${deviceType} background: ${bg.filename} (${(bg.base64Size / 1024).toFixed(0)}KB)`);
                            } catch (error) {
                                console.warn(`Error creating object URL for stored ${bgType} ${deviceType}:`, error);
                                // Even if object URL creation fails, keep the base64 URL
                            }
                            
                            // Ensure background is not marked as temporary
                            delete bg.isTemporary;
                            delete bg.needsReupload;
                        } else {
                            console.warn(`Failed to load stored ${deviceType} background: ${bgType}`);
                            // Instead of marking as needs reupload, remove the background to avoid confusion
                            currentSettings.backgrounds[bgType][deviceType] = null;
                            console.log(`Cleared missing ${deviceType} background data for ${bgType}`);
                        }
                    }
                    // Handle legacy chunked backgrounds in new structure
                    else if (bg && bg.isChunked) {
                        console.log(`Loading legacy chunked ${deviceType} background: ${bgType}`);
                        
                        const chunkKey = bg.chunkKey || `remiBackground_${bgType}_${deviceType}`;
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
                                
                                console.log(`Restored chunked ${bg.type} ${deviceType} background: ${bg.filename} (${(bg.base64Size / 1024).toFixed(0)}KB)`);
                            } catch (error) {
                                console.warn(`Error creating object URL for chunked ${bgType} ${deviceType}:`, error);
                            }
                            
                            // Ensure background is not marked as temporary
                            delete bg.isTemporary;
                            delete bg.needsReupload;
                        } else {
                            console.warn(`Failed to load chunked ${deviceType} background: ${bgType}`);
                            // Instead of marking as needs reupload, remove the background to avoid confusion
                            currentSettings.backgrounds[bgType][deviceType] = null;
                            console.log(`Cleared missing chunked ${deviceType} background data for ${bgType}`);
                        }
                    }
                }
            }
            // Handle old structure (single background object) - for legacy compatibility
            else if (bgSection && bgSection.isStored) {
                console.log(`Loading legacy stored background: ${bgType} (${bgSection.storageMethod || 'unknown method'})`);
                
                const storageKey = bgSection.storageKey || `remiBackground_${bgType}`;
                const storedData = await retrieveBackgroundData(storageKey);
                
                if (storedData) {
                    bgSection.url = storedData;
                    bgSection.base64Size = (storedData.length * 3) / 4;
                    
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
                        bgSection.objectURL = URL.createObjectURL(blob);
                        
                        console.log(`Restored stored ${bgSection.type} background: ${bgSection.filename} (${(bgSection.base64Size / 1024).toFixed(0)}KB)`);
                    } catch (error) {
                        console.warn(`Error creating object URL for stored ${bgType}:`, error);
                        // Even if object URL creation fails, keep the base64 URL
                    }
                    
                    // Ensure background is not marked as temporary
                    delete bgSection.isTemporary;
                    delete bgSection.needsReupload;
                } else {
                    console.warn(`Failed to load stored background: ${bgType}`);
                    // Instead of marking as needs reupload, remove the background to avoid confusion
                    currentSettings.backgrounds[bgType] = null;
                    console.log(`Cleared missing background data for ${bgType}`);
                }
            }
            // Handle legacy chunked backgrounds in old structure
            else if (bgSection && bgSection.isChunked) {
                console.log(`Loading legacy chunked background: ${bgType}`);
                
                const chunkKey = bgSection.chunkKey || `remiBackground_${bgType}`;
                const chunkedData = retrieveDataFromChunks(chunkKey);
                
                if (chunkedData) {
                    bgSection.url = chunkedData;
                    bgSection.base64Size = (chunkedData.length * 3) / 4;
                    
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
                        bgSection.objectURL = URL.createObjectURL(blob);
                        
                        console.log(`Restored chunked ${bgSection.type} background: ${bgSection.filename} (${(bgSection.base64Size / 1024).toFixed(0)}KB)`);
                    } catch (error) {
                        console.warn(`Error creating object URL for chunked ${bgType}:`, error);
                        // Even if object URL creation fails, keep the base64 URL
                    }
                    
                    // Ensure background is not marked as temporary
                    delete bgSection.isTemporary;
                    delete bgSection.needsReupload;
                } else {
                    console.warn(`Failed to load chunked background: ${bgType}`);
                    // Instead of marking as needs reupload, remove the background to avoid confusion
                    currentSettings.backgrounds[bgType] = null;
                    console.log(`Cleared missing chunked data for ${bgType}`);
                }
            }
        }
        
        // Check for backgrounds that need re-upload and notify user
        checkForMissingBackgrounds();
        migrateMobileSettings();
        
        console.log('Settings loaded successfully with advanced storage support');
    } catch (error) {
        console.error('Error loading settings:', error);
        currentSettings = { ...DEFAULT_SETTINGS };
        migrateMobileSettings();
    }
    populateInterface();
}

function migrateMobileSettings() {
    // Ensure mobile settings exist for backwards compatibility
    if (!currentSettings.backgrounds.mobile) {
        console.log('Migrating settings: Adding mobile optimization settings');
        currentSettings.backgrounds.mobile = {
            optimizeForMobile: true,
            reduceMotion: false,
            chatOptimization: true,
            mainOptimization: true
        };
    }
    
    // Migrate to new dark color system
    if (!currentSettings.colors.backgroundColorDark || !currentSettings.colors.textColorDark) {
        console.log('Migrating settings: Adding dark mode colors');
        
        // Set default dark colors if they don't exist
        if (!currentSettings.colors.backgroundColorDark) {
            currentSettings.colors.backgroundColorDark = '#1a1a1a';
        }
        if (!currentSettings.colors.textColorDark) {
            currentSettings.colors.textColorDark = '#E5F4FF';
        }
        
        // Show notification about new feature
        setTimeout(() => {
            showNotification(
                '🌙 New Feature: Separate dark and light mode colors are now available! Check the Interface Colors section.',
                'info',
                6000
            );
        }, 1000);
    }
    
    // Migrate old background structure to new desktop/mobile structure
    migrateBackgroundStructure();
    
    // Save the updated settings
    saveSettings();
}

function migrateBackgroundStructure() {
    const sectionsToMigrate = ['chat', 'main'];
    let migrationNeeded = false;
    
    sectionsToMigrate.forEach(section => {
        const background = currentSettings.backgrounds[section];
        
        // Check if this is old structure (direct background object instead of desktop/mobile)
        if (background && background.type && !background.desktop && !background.mobile) {
            console.log(`Migrating ${section} background structure to new desktop/mobile format`);
            
            // Create new structure
            const deviceType = background.deviceType || 'desktop';
            currentSettings.backgrounds[section] = {
                desktop: deviceType === 'desktop' ? background : null,
                mobile: deviceType === 'mobile' ? background : null
            };
            
            // If it was a desktop background, also create a mobile version if optimization is enabled
            if (deviceType === 'desktop' && currentSettings.backgrounds.mobile.optimizeForMobile) {
                // For now, use the same background for mobile (user can upload specific mobile version later)
                currentSettings.backgrounds[section].mobile = { ...background };
                currentSettings.backgrounds[section].mobile.deviceType = 'mobile';
            }
            
            migrationNeeded = true;
        }
        
        // Ensure structure exists even if no background is set
        if (!currentSettings.backgrounds[section] || typeof currentSettings.backgrounds[section] !== 'object' || 
            (!currentSettings.backgrounds[section].desktop && !currentSettings.backgrounds[section].mobile && 
             !currentSettings.backgrounds[section].type)) {
            currentSettings.backgrounds[section] = {
                desktop: null,
                mobile: null
            };
        }
    });
    
    if (migrationNeeded) {
        console.log('Background structure migration completed');
    }
}

function checkForMissingBackgrounds() {
    const backgroundsNeedingReupload = [];
    
    Object.keys(currentSettings.backgrounds).forEach(bgType => {
        // Skip non-background settings like 'mobile', 'overlayOpacity', etc.
        if (bgType === 'mobile' || bgType === 'overlayOpacity' || bgType === 'overlayDarkness') {
            return;
        }
        
        const bgSection = currentSettings.backgrounds[bgType];
        
        // Handle new structure (desktop/mobile)
        if (bgSection && typeof bgSection === 'object') {
            ['desktop', 'mobile'].forEach(deviceType => {
                const bg = bgSection[deviceType];
                if (bg && bg.needsReupload) {
                    backgroundsNeedingReupload.push({
                        type: `${bgType}_${deviceType}`,
                        filename: bg.filename,
                        originalType: bg.originalType || bg.type,
                        section: bgType,
                        device: deviceType
                    });
                }
            });
        }
        // Handle old structure (direct background object)
        else if (bgSection && bgSection.needsReupload) {
            backgroundsNeedingReupload.push({
                type: bgType,
                filename: bgSection.filename,
                originalType: bgSection.originalType || bgSection.type,
                section: bgType,
                device: 'unknown'
            });
        }
    });
    
    if (backgroundsNeedingReupload.length > 0) {
        // Show notification about missing backgrounds
        const missingFiles = backgroundsNeedingReupload.map(bg => 
            `${bg.filename || 'Unknown'} (${bg.originalType || 'file'})`
        ).join(', ');
        
        showNotification(
            `Some backgrounds were too large for storage: ${missingFiles}. Please re-upload smaller versions if you want them to persist.`,
            'info',
            8000
        );
        
        console.info('Backgrounds that need re-upload:', backgroundsNeedingReupload);
    }
}

function saveSettings() {
    try {
        console.log('Saving settings...');
        
        // Create a clean copy of settings
        const settingsToSave = JSON.parse(JSON.stringify(currentSettings));
        
        // Save to localStorage
        const settingsString = JSON.stringify(settingsToSave);
        localStorage.setItem('remiCustomization', settingsString);
        
        // Mark that user has made customizations
        localStorage.setItem('hasUserCustomizations', 'true');
        localStorage.setItem('preventDefaultReversion', 'true');
        localStorage.setItem('lastCustomizationSave', Date.now());
        
        console.log('Settings saved successfully');
        showNotification('Settings saved successfully!', 'success');
        
        // Dispatch custom event to notify other pages
        window.dispatchEvent(new CustomEvent('remiCustomizationUpdated', {
            detail: settingsToSave
        }));
        
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings: ' + error.message, 'error');
        return false;
    }
}

// Backup save function for testing and fallback
window.testSaveSettings = function() {
    console.log('Testing save settings...');
    console.log('Current settings:', currentSettings);
    const result = saveSettings();
    console.log('Save result:', result);
    return result;
};

// Expose save function globally for debugging
window.saveCustomizationSettings = saveSettings;

// ===== ADVANCED STORAGE MANAGEMENT =====
// IndexedDB storage for large files (fallback when localStorage is full)
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

    async store(key, data, metadata = {}) {
        try {
            await this.init();
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const record = {
                key: key,
                data: data,
                size: data.length,
                timestamp: new Date().toISOString(),
                ...metadata
            };
            
            await new Promise((resolve, reject) => {
                const request = store.put(record);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            console.log(`Stored ${key} in IndexedDB (${(data.length / 1024 / 1024).toFixed(1)}MB)`);
            return true;
        } catch (error) {
            console.error(`Failed to store ${key} in IndexedDB:`, error);
            return false;
        }
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

    async remove(key) {
        try {
            await this.init();
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            await new Promise((resolve, reject) => {
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            console.log(`Removed ${key} from IndexedDB`);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${key} from IndexedDB:`, error);
            return false;
        }
    }

    async clear() {
        try {
            await this.init();
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            console.log('Cleared all IndexedDB background storage');
            return true;
        } catch (error) {
            console.error('Failed to clear IndexedDB storage:', error);
            return false;
        }
    }

    async getStorageInfo() {
        try {
            await this.init();
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    const records = request.result;
                    const totalSize = records.reduce((sum, record) => sum + (record.size || 0), 0);
                    resolve({
                        count: records.length,
                        totalSize: totalSize,
                        records: records.map(r => ({ key: r.key, size: r.size, type: r.type }))
                    });
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get IndexedDB storage info:', error);
            return { count: 0, totalSize: 0, records: [] };
        }
    }
}

// Initialize the large file storage
const largeFileStorage = new LargeFileStorage();

// Enhanced storage strategy with IndexedDB as primary method for all backgrounds
async function storeBackgroundData(key, data, metadata = {}) {
    const dataSize = data.length;
    const dataSizeMB = dataSize / (1024 * 1024);
    
    console.log(`Attempting to store ${key}: ${dataSizeMB.toFixed(1)}MB`);
    
    // Strategy 1: Use IndexedDB as primary method for ALL backgrounds (no size limit)
    console.log(`Using IndexedDB for ${key} (${dataSizeMB.toFixed(1)}MB)`);
    const indexedDBSuccess = await largeFileStorage.store(key, data, {
        type: metadata.type || 'unknown',
        filename: metadata.filename || key,
        size: dataSize,
        timestamp: new Date().toISOString()
    });
    
    if (indexedDBSuccess) {
        return { success: true, method: 'IndexedDB', size: dataSizeMB };
    }
    
    // Strategy 2: Try localStorage chunked storage only if IndexedDB fails and file is small
    if (dataSizeMB < 2) { // Reduced from 4MB to 2MB to be safer
        console.log(`IndexedDB failed, trying localStorage chunks for ${key} (${dataSizeMB.toFixed(1)}MB)`);
        if (storeDataInChunks(key, data)) {
            return { success: true, method: 'localStorage-chunked', size: dataSizeMB };
        }
    }
    
    // Strategy 3: Emergency fallback - try localStorage without chunking (very small files only)
    if (dataSizeMB < 0.5) { // Reduced from 1MB to 0.5MB to be safer
        try {
            localStorage.setItem(key, data);
            console.log(`Stored ${key} in localStorage (emergency fallback)`);
            return { success: true, method: 'localStorage-direct', size: dataSizeMB };
        } catch (error) {
            console.warn(`Direct localStorage storage failed for ${key}:`, error);
        }
    }
    
    console.error(`All storage methods failed for ${key} - file too large for localStorage fallbacks`);
    return { success: false, method: 'none', size: dataSizeMB };
}

async function retrieveBackgroundData(key) {
    // Try IndexedDB first (primary storage method)
    const indexedData = await largeFileStorage.retrieve(key);
    if (indexedData) {
        console.log(`Retrieved ${key} from IndexedDB`);
        return indexedData;
    }
    
    // Try localStorage chunked second
    const chunkedData = retrieveDataFromChunks(key);
    if (chunkedData) {
        console.log(`Retrieved ${key} from localStorage chunks`);
        return chunkedData;
    }
    
    // Try direct localStorage last
    const directData = localStorage.getItem(key);
    if (directData) {
        console.log(`Retrieved ${key} from direct localStorage`);
        return directData;
    }
    
    console.warn(`No data found for ${key} in any storage method`);
    return null;
}

async function removeBackgroundData(key) {
    let removed = false;
    
    // Remove from localStorage chunks
    removeChunkedData(key);
    removed = true;
    
    // Remove from IndexedDB
    const indexedDBRemoved = await largeFileStorage.remove(key);
    if (indexedDBRemoved) removed = true;
    
    // Remove from direct localStorage
    try {
        localStorage.removeItem(key);
        removed = true;
    } catch (error) {
        console.warn(`Failed to remove ${key} from direct localStorage:`, error);
    }
    
    return removed;
}

// Helper function alias for retrieveBackgroundData (for consistency)
async function getBackgroundData(key) {
    return await retrieveBackgroundData(key);
}

// Function to store large data in chunks (enhanced version)
// Check localStorage usage and free space if needed
function checkAndFreeLocalStorageSpace(requiredBytes) {
    try {
        // Calculate current localStorage usage
        let totalSize = 0;
        const storageItems = [];
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const value = localStorage.getItem(key);
                const size = key.length + value.length;
                totalSize += size;
                
                // Collect items that can be cleaned up
                if (key.startsWith('remiBackground_') || key.includes('_chunk_') || key.includes('_chunks')) {
                    storageItems.push({ key, size, value });
                }
            }
        }
        
        const totalSizeMB = totalSize / (1024 * 1024);
        const requiredSizeMB = requiredBytes / (1024 * 1024);
        const maxStorageMB = 10; // Assume 10MB max localStorage
        const availableSpace = (maxStorageMB * 1024 * 1024) - totalSize;
        
        console.log(`localStorage usage: ${totalSizeMB.toFixed(1)}MB, Required: ${requiredSizeMB.toFixed(1)}MB, Available: ${(availableSpace / 1024 / 1024).toFixed(1)}MB`);
        
        // If we have enough space, return true
        if (availableSpace >= requiredBytes) {
            return true;
        }
        
        console.log('Insufficient space, attempting cleanup...');
        
        // Sort background items by size (largest first) for aggressive cleanup
        const backgroundItems = storageItems
            .filter(item => item.key.startsWith('remiBackground_') || item.key.includes('_chunk_'))
            .sort((a, b) => b.size - a.size);
        
        let freedSpace = 0;
        const itemsToRemove = [];
        
        // Calculate what to remove to free enough space
        for (const item of backgroundItems) {
            itemsToRemove.push(item.key);
            freedSpace += item.size;
            
            if (freedSpace >= requiredBytes * 1.2) { // 20% buffer
                break;
            }
        }
        
        // Remove items
        for (const key of itemsToRemove) {
            try {
                localStorage.removeItem(key);
                console.log(`Removed ${key} to free space`);
            } catch (removeError) {
                console.warn(`Failed to remove ${key}:`, removeError);
            }
        }
        
        // Also clean up any orphaned chunks
        const allKeys = Object.keys(localStorage);
        for (const key of allKeys) {
            if (key.includes('_chunk_')) {
                const baseKey = key.substring(0, key.lastIndexOf('_chunk_'));
                const metaKey = `${baseKey}_chunks`;
                
                // If metadata is missing, remove orphaned chunks
                if (!localStorage.getItem(metaKey)) {
                    try {
                        localStorage.removeItem(key);
                        console.log(`Removed orphaned chunk: ${key}`);
                        freedSpace += key.length + (localStorage.getItem(key)?.length || 0);
                    } catch (cleanupError) {
                        console.warn(`Failed to remove orphaned chunk ${key}:`, cleanupError);
                    }
                }
            }
        }
        
        console.log(`Freed approximately ${(freedSpace / 1024 / 1024).toFixed(1)}MB of space`);
        return freedSpace >= requiredBytes;
        
    } catch (error) {
        console.error('Error checking localStorage space:', error);
        return false;
    }
}

function storeDataInChunks(key, data) {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = [];
    
    // Split data into chunks
    for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
    }
    
    try {
        // More conservative space checking - require 50% more space than needed
        const estimatedSize = data.length + 1000; // Add buffer for metadata
        const requiredSpace = estimatedSize * 1.5; // 50% safety buffer
        
        if (!checkAndFreeLocalStorageSpace(requiredSpace)) {
            console.warn(`Cannot free enough space for ${key} (${(estimatedSize / 1024 / 1024).toFixed(1)}MB) - localStorage quota likely exhausted`);
            return false;
        }
        
        // Clean up any existing chunks for this key first
        removeChunkedData(key);
        
        // Pre-flight test: try storing the metadata first
        try {
            localStorage.setItem(`${key}_chunks`, chunks.length.toString());
        } catch (metaError) {
            console.error(`Failed to store chunk metadata:`, metaError);
            return false;
        }
        
        // Store each chunk with individual error handling
        for (let i = 0; i < chunks.length; i++) {
            const chunkKey = `${key}_chunk_${i}`;
            
            try {
                localStorage.setItem(chunkKey, chunks[i]);
            } catch (chunkError) {
                console.error(`Failed to store chunk ${i}:`, chunkError);
                
                // Clean up partial chunks immediately and fail fast
                localStorage.removeItem(`${key}_chunks`);
                for (let j = 0; j < i; j++) {
                    localStorage.removeItem(`${key}_chunk_${j}`);
                }
                
                return false; // Fail fast instead of retrying
            }
        }
        
        console.log(`Successfully stored ${chunks.length} chunks for ${key} (${(data.length / 1024 / 1024).toFixed(1)}MB)`);
        return true;
    } catch (error) {
        console.error('Failed to store chunked data:', error);
        
        // Clean up partial chunks
        try {
            localStorage.removeItem(`${key}_chunks`);
            for (let i = 0; i < chunks.length; i++) {
                localStorage.removeItem(`${key}_chunk_${i}`);
            }
        } catch (cleanupError) {
            console.error('Failed to cleanup chunks:', cleanupError);
        }
        
        return false;
    }
}

// Function to retrieve chunked data
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
                throw new Error(`Missing chunk ${i} for ${key}`);
            }
            data += chunk;
        }
        
        return data;
    } catch (error) {
        console.error('Failed to retrieve chunked data:', error);
        
        // Clean up corrupted chunks
        try {
            const chunkCount = parseInt(localStorage.getItem(`${key}_chunks`)) || 0;
            localStorage.removeItem(`${key}_chunks`);
            for (let i = 0; i < chunkCount; i++) {
                localStorage.removeItem(`${key}_chunk_${i}`);
            }
        } catch (cleanupError) {
            console.error('Failed to cleanup corrupted chunks:', cleanupError);
        }
        
        return null;
    }
}

// Function to remove chunked data
function removeChunkedData(key) {
    try {
        const chunkCount = parseInt(localStorage.getItem(`${key}_chunks`)) || 0;
        localStorage.removeItem(`${key}_chunks`);
        for (let i = 0; i < chunkCount; i++) {
            localStorage.removeItem(`${key}_chunk_${i}`);
        }
    } catch (error) {
        console.error('Failed to remove chunked data:', error);
    }
}

// Emergency space clearing function
function emergencyClearSpace() {
    try {
        // Calculate current usage
        let totalSize = 0;
        const itemsToRemove = [];
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const value = localStorage.getItem(key);
                const size = key.length + value.length;
                totalSize += size;
                
                // Identify items that can be safely removed
                if (key.startsWith('remiBackground_') || key.includes('_chunk_') || key.includes('_chunks')) {
                    itemsToRemove.push({ key, size });
                }
            }
        }
        
        const totalSizeMB = totalSize / (1024 * 1024);
        const maxSafeSizeMB = 4; // Keep under 4MB for safety
        
        console.log(`Emergency check: Current storage ${totalSizeMB.toFixed(1)}MB`);
        
        // If we're over the safe limit, clear everything we can
        if (totalSizeMB > maxSafeSizeMB) {
            console.log('Emergency clearing storage space...');
            
            // Sort by size and remove largest items first
            itemsToRemove.sort((a, b) => b.size - a.size);
            
            let removedCount = 0;
            let freedSpace = 0;
            
            for (const item of itemsToRemove) {
                try {
                    localStorage.removeItem(item.key);
                    freedSpace += item.size;
                    removedCount++;
                    
                    // Stop when we've freed enough space
                    if (freedSpace > (totalSize * 0.3)) { // Free 30% of total space
                        break;
                    }
                } catch (error) {
                    console.warn(`Failed to remove ${item.key}:`, error);
                }
            }
            
            console.log(`Emergency cleanup: Removed ${removedCount} items, freed ${(freedSpace / 1024 / 1024).toFixed(1)}MB`);
            
            // Clear background references in current settings to match what we removed
            Object.keys(currentSettings.backgrounds).forEach(bgType => {
                const bg = currentSettings.backgrounds[bgType];
                if (bg && (bg.isChunked || bg.base64Size > 500 * 1024)) {
                    if (bg.objectURL) {
                        URL.revokeObjectURL(bg.objectURL);
                    }
                    // Mark as needs re-upload instead of keeping broken references
                    currentSettings.backgrounds[bgType] = {
                        type: bg.type,
                        filename: bg.filename,
                        needsReupload: true,
                        note: 'Removed during storage cleanup - please re-upload'
                    };
                }
            });
            
            return true;
        }
        
        return true; // No emergency cleanup needed
    } catch (error) {
        console.error('Emergency cleanup failed:', error);
        return false;
    }
}

// Enhanced save settings function with IndexedDB-first storage for large files
async function saveSettingsEnhanced() {
    try {
        // Clean up old localStorage chunks first to free space
        await cleanupOldLocalStorageChunks();
        
        // Create a clean copy of settings
        const settingsToSave = JSON.parse(JSON.stringify(currentSettings));
        
        // Remove object URLs from settings (they're not needed for storage)
        if (settingsToSave.personality.customAvatarFile) {
            delete settingsToSave.personality.customAvatarFile.objectURL;
        }
        
        // Handle ALL backgrounds with advanced storage (no size limit!)
        const backgroundsToStore = [];
        Object.keys(settingsToSave.backgrounds).forEach(bgType => {
            // Skip non-background settings like 'mobile', 'overlayOpacity', etc.
            if (bgType === 'mobile' || bgType === 'overlayOpacity' || bgType === 'overlayDarkness') {
                return;
            }
            
            const bgSection = settingsToSave.backgrounds[bgType];
            
            // Handle new structure (desktop/mobile separation)
            if (bgSection && typeof bgSection === 'object') {
                ['desktop', 'mobile'].forEach(deviceType => {
                    const bg = bgSection[deviceType];
                    if (bg && bg.url && bg.url.startsWith('data:')) {
                        backgroundsToStore.push({
                            type: `${bgType}_${deviceType}`,
                            data: bg.url,
                            background: bg,
                            section: bgType,
                            device: deviceType
                        });
                        
                        // Replace with reference to advanced storage
                        settingsToSave.backgrounds[bgType][deviceType] = {
                            type: bg.type,
                            filename: bg.filename,
                            isCustom: true,
                            size: bg.size,
                            base64Size: (bg.url.length * 3) / 4,
                            isStored: true, // Flag to indicate stored externally
                            storageKey: `remiBackground_${bgType}_${deviceType}`,
                            lastSaved: new Date().toISOString(),
                            deviceType: deviceType,
                            mobileOptimized: bg.mobileOptimized || false
                        };
                    } else if (bg) {
                        // Clean up object URL reference for backgrounds without base64 data
                        const cleanBg = { ...bg };
                        delete cleanBg.objectURL;
                        settingsToSave.backgrounds[bgType][deviceType] = cleanBg;
                    }
                });
            }
            // Handle old structure (single background object) - should be rare after migration
            else if (bgSection && bgSection.url && bgSection.url.startsWith('data:')) {
                backgroundsToStore.push({
                    type: bgType,
                    data: bgSection.url,
                    background: bgSection,
                    section: bgType,
                    device: 'legacy'
                });
                
                // Replace with reference to advanced storage
                settingsToSave.backgrounds[bgType] = {
                    type: bgSection.type,
                    filename: bgSection.filename,
                    isCustom: true,
                    size: bgSection.size,
                    base64Size: (bgSection.url.length * 3) / 4,
                    isStored: true,
                    storageKey: `remiBackground_${bgType}`,
                    lastSaved: new Date().toISOString()
                };
            } else if (bgSection) {
                // Clean up object URL reference for all backgrounds
                if (typeof bgSection === 'object' && bgSection.objectURL) {
                    const cleanBg = { ...bgSection };
                    delete cleanBg.objectURL;
                    settingsToSave.backgrounds[bgType] = cleanBg;
                }
            }
        });
        
        // Store backgrounds using IndexedDB as primary method
        for (const bgInfo of backgroundsToStore) {
            const storageKey = bgInfo.device === 'legacy' ? 
                `remiBackground_${bgInfo.section}` : 
                `remiBackground_${bgInfo.section}_${bgInfo.device}`;
            
            showNotification(`Saving ${bgInfo.background.filename || bgInfo.type} to IndexedDB... (${((bgInfo.background.base64Size || 0) / 1024 / 1024).toFixed(1)}MB)`, 'info', 2000);
            
            const result = await storeBackgroundData(storageKey, bgInfo.data, {
                type: bgInfo.background.type,
                filename: bgInfo.background.filename
            });
            
            if (!result.success) {
                console.warn(`Failed to store ${bgInfo.type} background, marking as needs reupload`);
                
                // Mark as needing reupload if storage fails
                if (bgInfo.device === 'legacy') {
                    settingsToSave.backgrounds[bgInfo.section] = {
                        type: bgInfo.background.type,
                        filename: bgInfo.background.filename,
                        isCustom: true,
                        needsReupload: true,
                        originalType: bgInfo.background.type,
                        size: bgInfo.background.size,
                        lastSaved: new Date().toISOString(),
                        note: 'Storage failed - please try re-uploading'
                    };
                } else {
                    settingsToSave.backgrounds[bgInfo.section][bgInfo.device] = {
                        type: bgInfo.background.type,
                        filename: bgInfo.background.filename,
                        isCustom: true,
                        needsReupload: true,
                        originalType: bgInfo.background.type,
                        size: bgInfo.background.size,
                        lastSaved: new Date().toISOString(),
                        deviceType: bgInfo.device,
                        note: 'Storage failed - please try re-uploading'
                    };
                }
            } else {
                console.log(`Successfully stored ${bgInfo.type} background using ${result.method} (${result.size.toFixed(1)}MB)`);
                
                // Update the storage method info
                if (bgInfo.device === 'legacy') {
                    settingsToSave.backgrounds[bgInfo.section].storageMethod = result.method;
                } else {
                    settingsToSave.backgrounds[bgInfo.section][bgInfo.device].storageMethod = result.method;
                }
                
                // Show success message
                if (result.method === 'IndexedDB') {
                    showNotification(`${bgInfo.background.filename || bgInfo.type} saved to IndexedDB! (${result.size.toFixed(1)}MB)`, 'success', 3000);
                }
            }
        }
        
        // Save the main settings (now lightweight metadata only)
        const settingsString = JSON.stringify(settingsToSave);
        const sizeInBytes = new Blob([settingsString]).size;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        console.log(`Main settings size: ${sizeInMB.toFixed(2)} MB`);
        
        // Main settings should always be small now (just metadata)
        if (sizeInBytes > 1024 * 1024) { // 1MB limit for main settings
            throw new Error(`Main settings unexpectedly large (${sizeInMB.toFixed(1)}MB) - this shouldn't happen`);
        }
        
        localStorage.setItem('remiCustomization', settingsString);
        
        // Mark that user has made customizations - prevent future default reversion
        localStorage.setItem('hasUserCustomizations', 'true');
        localStorage.setItem('preventDefaultReversion', 'true');
        localStorage.setItem('lastCustomizationSave', Date.now());
        
        showNotification('Settings saved successfully with IndexedDB storage!', 'success');
        
        // Dispatch custom event to notify other pages
        window.dispatchEvent(new CustomEvent('remiCustomizationUpdated', {
            detail: settingsToSave
        }));
        
        if (currentSettings.preferences.autoSave) {
            applySettings();
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        
        // Show user-friendly error message
        if (error.name === 'QuotaExceededError' || error.message.includes('exceeded the quota')) {
            showNotification(
                'Storage issue encountered. Trying alternative storage method...',
                'warning',
                5000
            );
            
            // Try emergency fallback - this shouldn't happen with IndexedDB
            setTimeout(async () => {
                try {
                    await saveSettingsEnhanced(); // Retry once
                } catch (retryError) {
                    showNotification('Unable to save settings. Please try smaller files or contact support.', 'error', 10000);
                }
            }, 1000);
        } else {
            showNotification(`Error saving settings: ${error.message}`, 'error', 8000);
        }
    }
}

function applySettings() {
    applyTheme();
    applyColors();
    applyTopbarStyles();
    // Apply backgrounds asynchronously (non-blocking)
    applyBackgrounds().catch(error => {
        console.warn('Error applying backgrounds:', error);
    });
    applyPersonality();
    applyPreferences();
    updatePreview();
    
    // Force dark theme for chat elements after all other settings
    setTimeout(() => {
        forceDarkThemeForChatElements();
    }, 100);
    
    // Ensure topbar colors are applied even if no specific preset is active
    initializeTopbarColors();
}

function initializeTopbarColors() {
    const topbar = document.querySelector('.topbar');
    if (topbar && currentSettings.topbar && currentSettings.topbar.colors) {
        // Apply the current topbar colors to ensure text colors are visible
        applyTopbarColors(topbar, currentSettings.topbar.colors);
    }
}

// ===== THEME MANAGEMENT =====

function applyTheme() {
    const theme = 'dark'; // Always use dark theme
    const body = document.body;
    const html = document.documentElement;
    
    console.log('Applying theme: dark (forced)'); // Debug log
    
    // Always apply dark theme
    body.setAttribute('data-theme', 'dark');
    html.setAttribute('data-theme', 'dark');
    console.log('Dark theme applied (forced)'); // Debug log
    
    // Force DOM update
    body.offsetHeight;
    
    // Re-apply colors to update background for theme change
    applyColors();
    
    // Re-apply topbar styles to update text colors for theme change
    applyTopbarStyles();
    
    // Dispatch theme change event for other systems
    document.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { 
            theme: 'dark',
            effectiveTheme: 'dark'
        }
    }));
}

// ===== COLOR MANAGEMENT =====

function applyColors() {
    const root = document.documentElement;
    
    // Ensure colors exist, use defaults if not
    if (!currentSettings.colors) {
        currentSettings.colors = { ...DEFAULT_SETTINGS.colors };
    }
    
    const colors = currentSettings.colors;
    const currentTheme = getCurrentTheme(); // Get effective theme (light/dark)
    
    // Apply custom colors to CSS variables
    root.style.setProperty('--accent-primary', colors.accentPrimary || DEFAULT_SETTINGS.colors.accentPrimary);
    root.style.setProperty('--accent-secondary', colors.accentSecondary || DEFAULT_SETTINGS.colors.accentSecondary);
    root.style.setProperty('--sidebar-border-color', colors.sidebarBorderColor || DEFAULT_SETTINGS.colors.sidebarBorderColor);
    root.style.setProperty('--success-color', colors.successColor || DEFAULT_SETTINGS.colors.successColor);
    root.style.setProperty('--warning-color', colors.warningColor || DEFAULT_SETTINGS.colors.warningColor);
    root.style.setProperty('--error-color', colors.errorColor || DEFAULT_SETTINGS.colors.errorColor);
    
    // Apply theme-specific colors
    if (currentTheme === 'dark') {
        root.style.setProperty('--background-color', colors.backgroundColorDark || colors.backgroundColor);
        root.style.setProperty('--text-color', colors.textColorDark || colors.textColor);
        document.body.style.backgroundColor = colors.backgroundColorDark || colors.backgroundColor;
    } else {
        root.style.setProperty('--background-color', colors.backgroundColor);
        root.style.setProperty('--text-color', colors.textColor);
        document.body.style.backgroundColor = colors.backgroundColor;
    }
    
    // Force dark theme styling for chat containers regardless of theme
    forceDarkThemeForChatElements();
    
    // Update gradients
    root.style.setProperty('--gradient-start', colors.accentPrimary);
    root.style.setProperty('--gradient-end', colors.accentSecondary);
    
    // Set effective background color for other functions
    const effectiveBackgroundColor = currentTheme === 'dark' ? 
        (colors.backgroundColorDark || colors.backgroundColor) : 
        colors.backgroundColor;
    
    root.style.setProperty('--effective-background-color', effectiveBackgroundColor);
    
    // Update theme indicators in customization interface
    updateThemeIndicators(currentTheme);
}

function updateThemeIndicators(currentTheme) {
    // Update theme indicators to show which colors are currently active
    const lightIndicators = document.querySelectorAll('.light-active');
    const darkIndicators = document.querySelectorAll('.dark-active');
    const colorControls = document.querySelectorAll('.color-control[data-theme-target]');
    
    // Update indicator visibility
    lightIndicators.forEach(indicator => {
        indicator.classList.toggle('active', currentTheme === 'light');
    });
    
    darkIndicators.forEach(indicator => {
        indicator.classList.toggle('active', currentTheme === 'dark');
    });
    
    // Update color control highlighting
    colorControls.forEach(control => {
        const target = control.getAttribute('data-theme-target');
        control.classList.toggle('current-theme', target === currentTheme);
    });
}

function forceDarkThemeForChatElements() {
    // Force dark theme styling for all chat-related elements
    const chatSelectors = [
        '.chat-container',
        '.chat-messages',
        '.messages-container',
        '.message',
        '.chat-input',
        '.chat-input-container',
        '.chat-sidebar',
        '.chat-header',
        '.message-bubble',
        '.chat-area',
        '.conversation-area',
        '.chat-content'
    ];
    
    const colors = currentSettings.colors;
    const darkBgColor = colors.backgroundColorDark || '#1a1a1a';
    const darkTextColor = colors.textColorDark || '#E5F4FF';
    const darkBorderColor = 'rgba(255, 255, 255, 0.1)';
    
    chatSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            // Force dark theme data attribute
            element.setAttribute('data-theme', 'dark');
            
            // Apply dark theme styles directly
            element.style.setProperty('--background-color', darkBgColor, 'important');
            element.style.setProperty('--text-color', darkTextColor, 'important');
            element.style.setProperty('--border-color', darkBorderColor, 'important');
            
            // Apply specific dark theme styles
            if (element.style.backgroundColor && !element.style.backgroundImage) {
                element.style.backgroundColor = darkBgColor;
            }
            if (element.style.color) {
                element.style.color = darkTextColor;
            }
            if (element.style.borderColor) {
                element.style.borderColor = darkBorderColor;
            }
            
            // Add dark theme class for CSS targeting
            element.classList.add('force-dark-theme');
        });
    });
    
    // Apply dark theme styles to the document for chat elements
    const style = document.getElementById('force-dark-chat-style') || document.createElement('style');
    style.id = 'force-dark-chat-style';
    style.textContent = `
        /* Force dark theme for chat elements */
        .chat-container,
        .chat-messages,
        .messages-container,
        .message,
        .chat-input,
        .chat-input-container,
        .chat-sidebar,
        .chat-header,
        .message-bubble,
        .chat-area,
        .conversation-area,
        .chat-content,
        .force-dark-theme {
            background-color: ${darkBgColor} !important;
            color: ${darkTextColor} !important;
            border-color: ${darkBorderColor} !important;
        }
        
        .chat-container .message-text,
        .chat-container .message-content,
        .chat-container p,
        .chat-container span,
        .chat-container div {
            color: ${darkTextColor} !important;
        }
        
        .chat-container input,
        .chat-container textarea,
        .chat-container button {
            background-color: rgba(255, 255, 255, 0.1) !important;
            color: ${darkTextColor} !important;
            border-color: ${darkBorderColor} !important;
        }
        
        .chat-container button:hover {
            background-color: rgba(255, 255, 255, 0.2) !important;
        }
        
        /* Ensure scrollbars are dark themed */
        .chat-container *::-webkit-scrollbar {
            background-color: ${darkBgColor} !important;
        }
        
        .chat-container *::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.3) !important;
        }
        
        .chat-container *::-webkit-scrollbar-track {
            background-color: rgba(255, 255, 255, 0.1) !important;
        }
    `;
    
    if (!document.getElementById('force-dark-chat-style')) {
        document.head.appendChild(style);
    }
    
    console.log('Forced dark theme styling applied to chat elements');
}

// Set up observer to watch for new chat elements and apply dark theme
function setupChatElementObserver() {
    // Only set up once
    if (window.chatObserverSetup) return;
    window.chatObserverSetup = true;
    
    const observer = new MutationObserver((mutations) => {
        let shouldApplyDarkTheme = false;
        
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if the added node or its children are chat elements
                    const chatSelectors = [
                        '.chat-container', '.chat-messages', '.messages-container',
                        '.message', '.chat-input', '.chat-area', '.conversation-area'
                    ];
                    
                    const isChatElement = chatSelectors.some(selector => {
                        return node.matches && (node.matches(selector) || node.querySelector(selector));
                    });
                    
                    if (isChatElement) {
                        shouldApplyDarkTheme = true;
                    }
                }
            });
        });
        
        if (shouldApplyDarkTheme) {
            // Debounce the application to avoid excessive calls
            clearTimeout(window.chatThemeDebounce);
            window.chatThemeDebounce = setTimeout(() => {
                forceDarkThemeForChatElements();
            }, 50);
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('Chat element observer setup complete');
}

function getCurrentTheme() {
    // Always return dark theme
    return 'dark';
}

function adjustColorForDarkTheme(lightColor) {
    // Convert light background colors to appropriate dark versions
    const colorMap = {
        '#EEF8FF': '#1a1a1a',     // Ocean Breeze -> Dark
        '#FFF5E1': '#2a2017',     // Sunset -> Dark Orange
        '#F6FFED': '#1a2e1a',     // Forest -> Dark Green
        '#FAF7FF': '#2a1a2e',     // Lavender -> Dark Purple
        '#F0F9FF': '#1a252e',     // Ocean -> Dark Blue
        '#FFF1F2': '#2e1a1d',     // Rose -> Dark Pink
        '#ECFDF5': '#1a2e21',     // Mint -> Dark Mint
        '#FAF5FF': '#2a1a2e',     // Cosmic -> Dark Purple
        '#FFFBEB': '#2e2a1a',     // Amber -> Dark Yellow
        '#FFF8F5': '#2e221a'      // Coral -> Dark Orange
    };
    
    // Check if we have a direct mapping
    if (colorMap[lightColor.toUpperCase()]) {
        return colorMap[lightColor.toUpperCase()];
    }
    
    // For custom colors, convert to dark programmatically
    return convertLightToDark(lightColor);
}

function convertLightToDark(color) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // If it's already dark enough, use as is
    if (luminance < 0.5) {
        return color;
    }
    
    // Create a dark version by reducing brightness significantly
    const darkR = Math.max(0, Math.floor(r * 0.15));
    const darkG = Math.max(0, Math.floor(g * 0.15));
    const darkB = Math.max(0, Math.floor(b * 0.15));
    
    // Convert back to hex
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`;
}

function applyColorPreset(preset) {
    // Free presets that are always available
    const freePresets = ['default', 'sunset', 'forest'];
    
    // Check if coin system is available and if preset is unlocked (skip for free presets)
    if (window.coinSystem && !freePresets.includes(preset) && !window.coinSystem.hasUnlocked('colorPresets', preset)) {
        // Preset is locked - coin system will handle purchase attempt
        return false;
    }

    const presets = {
        default: {
            accentPrimary: '#67C5FF',
            accentSecondary: '#AA79F9',
            backgroundColor: '#EEF8FF',
            backgroundColorDark: '#1a1a1a',
            textColor: '#125E8E',
            textColorDark: '#E5F4FF'
        },
        sunset: {
            accentPrimary: '#FF6B6B',
            accentSecondary: '#4ECDC4',
            backgroundColor: '#FFF5E1',
            backgroundColorDark: '#2a2017',
            textColor: '#8B4513',
            textColorDark: '#FFE4B5'
        },
        forest: {
            accentPrimary: '#52C41A',
            accentSecondary: '#1890FF',
            backgroundColor: '#F6FFED',
            backgroundColorDark: '#1a2e1a',
            textColor: '#2F5233',
            textColorDark: '#C7F0C7'
        },
        lavender: {
            accentPrimary: '#B37FEB',
            accentSecondary: '#50C9C3',
            backgroundColor: '#FAF7FF',
            backgroundColorDark: '#2a1a2e',
            textColor: '#6B46C1',
            textColorDark: '#E9D5FF'
        },
        ocean: {
            accentPrimary: '#0EA5E9',
            accentSecondary: '#06B6D4',
            backgroundColor: '#F0F9FF',
            backgroundColorDark: '#1a252e',
            textColor: '#0C4A6E',
            textColorDark: '#E0F2FE'
        },
        rose: {
            accentPrimary: '#F43F5E',
            accentSecondary: '#EC4899',
            backgroundColor: '#FFF1F2',
            backgroundColorDark: '#2e1a1d',
            textColor: '#881337',
            textColorDark: '#FECDD3'
        },
        mint: {
            accentPrimary: '#10B981',
            accentSecondary: '#059669',
            backgroundColor: '#ECFDF5',
            backgroundColorDark: '#1a2e21',
            textColor: '#064E3B',
            textColorDark: '#D1FAE5'
        },
        cosmic: {
            accentPrimary: '#8B5CF6',
            accentSecondary: '#A855F7',
            backgroundColor: '#FAF5FF',
            backgroundColorDark: '#2a1a2e',
            textColor: '#5B21B6',
            textColorDark: '#E9D5FF'
        },
        amber: {
            accentPrimary: '#F59E0B',
            accentSecondary: '#D97706',
            backgroundColor: '#FFFBEB',
            backgroundColorDark: '#2e2a1a',
            textColor: '#92400E',
            textColorDark: '#FEF3C7'
        },
        coral: {
            accentPrimary: '#FF7849',
            accentSecondary: '#FF6B9D',
            backgroundColor: '#FFF8F5',
            backgroundColorDark: '#2e221a',
            textColor: '#C2410C',
            textColorDark: '#FFEDD5'
        },
        neon: {
            accentPrimary: '#00FFFF',
            accentSecondary: '#FF00FF',
            backgroundColor: '#F0F8FF',
            backgroundColorDark: '#1a1a2e',
            textColor: '#0066CC',
            textColorDark: '#CCFFFF'
        },
        royal: {
            accentPrimary: '#4B0082',
            accentSecondary: '#800080',
            backgroundColor: '#F5F0FF',
            backgroundColorDark: '#2a1a3e',
            textColor: '#4B0082',
            textColorDark: '#E6D7FF'
        },
        emerald: {
            accentPrimary: '#50C878',
            accentSecondary: '#00A86B',
            backgroundColor: '#F0FFF0',
            backgroundColorDark: '#1a2e1e',
            textColor: '#006400',
            textColorDark: '#98FB98'
        },
        crimson: {
            accentPrimary: '#DC143C',
            accentSecondary: '#B22222',
            backgroundColor: '#FFF5F5',
            backgroundColorDark: '#2e1a1a',
            textColor: '#8B0000',
            textColorDark: '#FFB6C1'
        },
        sapphire: {
            accentPrimary: '#0F52BA',
            accentSecondary: '#1E90FF',
            backgroundColor: '#F0F8FF',
            backgroundColorDark: '#1a1a2e',
            textColor: '#003366',
            textColorDark: '#ADD8E6'
        },
        gold: {
            accentPrimary: '#FFD700',
            accentSecondary: '#FFA500',
            backgroundColor: '#FFFACD',
            backgroundColorDark: '#2e2a1a',
            textColor: '#B8860B',
            textColorDark: '#FFFFE0'
        },
        midnight: {
            accentPrimary: '#191970',
            accentSecondary: '#483D8B',
            backgroundColor: '#F8F8FF',
            backgroundColorDark: '#1a1a2e',
            textColor: '#191970',
            textColorDark: '#E6E6FA'
        },
        cherry: {
            accentPrimary: '#FF69B4',
            accentSecondary: '#FF1493',
            backgroundColor: '#FFF0F5',
            backgroundColorDark: '#2e1a22',
            textColor: '#C71585',
            textColorDark: '#FFCCCB'
        },
        cyberpunk: {
            accentPrimary: '#00FFFF',
            accentSecondary: '#FF00FF',
            backgroundColor: '#0D1117',
            backgroundColorDark: '#0D1117',
            textColor: '#00FFFF',
            textColorDark: '#FF00FF'
        },
        galaxy: {
            accentPrimary: '#3F51B5',
            accentSecondary: '#9C27B0',
            backgroundColor: '#E8EAF6',
            backgroundColorDark: '#1a1a2e',
            textColor: '#283593',
            textColorDark: '#C5CAE9'
        },
        tropical: {
            accentPrimary: '#4CAF50',
            accentSecondary: '#00BCD4',
            backgroundColor: '#E8F5E8',
            backgroundColorDark: '#1a2e1e',
            textColor: '#2E7D32',
            textColorDark: '#C8E6C9'
        },
        volcano: {
            accentPrimary: '#FF3D00',
            accentSecondary: '#FF6D00',
            backgroundColor: '#FFF3E0',
            backgroundColorDark: '#2e1a0d',
            textColor: '#E65100',
            textColorDark: '#FFE0B2'
        },
        aurora: {
            accentPrimary: '#4CAF50',
            accentSecondary: '#2196F3',
            backgroundColor: '#E1F5FE',
            backgroundColorDark: '#1a2a2e',
            textColor: '#1976D2',
            textColorDark: '#B3E5FC'
        },
        sunset_beach: {
            accentPrimary: '#FF7043',
            accentSecondary: '#FFC107',
            backgroundColor: '#FFF8E1',
            backgroundColorDark: '#2e251a',
            textColor: '#F57C00',
            textColorDark: '#FFECB3'
        },
        mystic: {
            accentPrimary: '#388E3C',
            accentSecondary: '#7B1FA2',
            backgroundColor: '#F3E5F5',
            backgroundColorDark: '#2a1a2e',
            textColor: '#4A148C',
            textColorDark: '#E1BEE7'
        },
        ice: {
            accentPrimary: '#81D4FA',
            accentSecondary: '#B3E5FC',
            backgroundColor: '#F1F8E9',
            backgroundColorDark: '#1a2a2e',
            textColor: '#0277BD',
            textColorDark: '#E1F5FE'
        },
        bronze: {
            accentPrimary: '#8D6E63',
            accentSecondary: '#A1887F',
            backgroundColor: '#EFEBE9',
            backgroundColorDark: '#2a221a',
            textColor: '#5D4037',
            textColorDark: '#D7CCC8'
        }
    };
    
    if (presets[preset]) {
        currentSettings.colors = { ...currentSettings.colors, ...presets[preset] };
        populateColorInputs();
        applyColors();
        markAsChanged();
        return true;
    }
    return false;
}

// ===== TOPBAR PRESET MANAGEMENT =====

function applyTopbarPreset(preset) {
    const topbarPresets = {
        modern: [
            {
                name: 'Glass Blue',
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
            {
                name: 'Glass Purple',
                preset: 'modern',
                style: 'glass',
                colors: {
                    background: 'rgba(170, 121, 249, 0.15)',
                    border: 'rgba(170, 121, 249, 0.3)',
                    text: '#6B46C1',
                    textDark: '#E9D5FF',
                    accent: '#AA79F9'
                }
            },
            {
                name: 'Glass White',
                preset: 'modern',
                style: 'glass',
                colors: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'rgba(255, 255, 255, 0.2)',
                    text: '#333333',
                    textDark: '#F8F9FA',
                    accent: '#67C5FF'
                }
            }
        ],
        solid: [
            {
                name: 'Clean White',
                preset: 'solid',
                style: 'solid',
                colors: {
                    background: '#ffffff',
                    border: 'none',
                    text: '#333333',
                    textDark: '#E5E7EB',
                    accent: '#4A90E2'
                }
            },
            {
                name: 'Light Gray',
                preset: 'solid',
                style: 'solid',
                colors: {
                    background: '#F8F9FA',
                    border: 'rgba(0, 0, 0, 0.1)',
                    text: '#495057',
                    textDark: '#DEE2E6',
                    accent: '#6C757D'
                }
            },
            {
                name: 'Soft Blue',
                preset: 'solid',
                style: 'solid',
                colors: {
                    background: '#EEF8FF',
                    border: 'rgba(103, 197, 255, 0.2)',
                    text: '#125E8E',
                    textDark: '#E5F4FF',
                    accent: '#67C5FF'
                }
            }
        ],
        gradient: [
            {
                name: 'Ocean Wave',
                preset: 'gradient',
                style: 'gradient',
                colors: {
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
                    border: 'none',
                    text: '#ffffff',
                    textDark: '#ffffff',
                    accent: '#ffffff'
                }
            },
            {
                name: 'Sunset Glow',
                preset: 'gradient',
                style: 'gradient',
                colors: {
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                    border: 'none',
                    text: '#ffffff',
                    textDark: '#ffffff',
                    accent: '#ffffff'
                }
            },
            {
                name: 'Purple Dream',
                preset: 'gradient',
                style: 'gradient',
                colors: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    text: '#ffffff',
                    textDark: '#ffffff',
                    accent: '#ffffff'
                }
            },
            {
                name: 'Forest Green',
                preset: 'gradient',
                style: 'gradient',
                colors: {
                    background: 'linear-gradient(135deg, #52C41A 0%, #1890FF 100%)',
                    border: 'none',
                    text: '#ffffff',
                    textDark: '#ffffff',
                    accent: '#ffffff'
                }
            }
        ],
        minimal: [
            {
                name: 'Light Minimal',
                preset: 'minimal',
                style: 'minimal',
                colors: {
                    background: 'rgba(248, 250, 252, 0.95)',
                    border: 'rgba(0, 0, 0, 0.1)',
                    text: '#64748b',
                    textDark: '#F1F5F9',
                    accent: '#0f172a'
                }
            },
            {
                name: 'Warm Minimal',
                preset: 'minimal',
                style: 'minimal',
                colors: {
                    background: 'rgba(254, 252, 232, 0.95)',
                    border: 'rgba(217, 119, 6, 0.2)',
                    text: '#92400E',
                    textDark: '#FEF3C7',
                    accent: '#D97706'
                }
            },
            {
                name: 'Cool Minimal',
                preset: 'minimal',
                style: 'minimal',
                colors: {
                    background: 'rgba(240, 249, 255, 0.95)',
                    border: 'rgba(14, 165, 233, 0.2)',
                    text: '#0C4A6E',
                    textDark: '#E0F2FE',
                    accent: '#0EA5E9'
                }
            }
        ],
        dark: [
            {
                name: 'Pure Dark',
                preset: 'dark',
                style: 'dark',
                colors: {
                    background: '#1a1a1a',
                    border: 'rgba(255, 255, 255, 0.1)',
                    text: '#ffffff',
                    textDark: '#ffffff',
                    accent: '#10b981'
                }
            },
            {
                name: 'Dark Blue',
                preset: 'dark',
                style: 'dark',
                colors: {
                    background: '#1e293b',
                    border: 'rgba(59, 130, 246, 0.3)',
                    text: '#e2e8f0',
                    textDark: '#f1f5f9',
                    accent: '#3b82f6'
                }
            },
            {
                name: 'Dark Purple',
                preset: 'dark',
                style: 'dark',
                colors: {
                    background: '#2a1a2e',
                    border: 'rgba(139, 92, 246, 0.3)',
                    text: '#e9d5ff',
                    textDark: '#f3e8ff',
                    accent: '#8b5cf6'
                }
            }
        ],
        neon: [
            {
                name: 'Cyan Neon',
                preset: 'neon',
                style: 'neon',
                colors: {
                    background: '#000000',
                    border: 'rgba(0, 255, 255, 0.5)',
                    text: '#00ffff',
                    textDark: '#00ffff',
                    accent: '#ff00ff'
                }
            },
            {
                name: 'Green Neon',
                preset: 'neon',
                style: 'neon',
                colors: {
                    background: '#0a0a0a',
                    border: 'rgba(0, 255, 0, 0.5)',
                    text: '#00ff00',
                    textDark: '#00ff00',
                    accent: '#ff0080'
                }
            },
            {
                name: 'Purple Neon',
                preset: 'neon',
                style: 'neon',
                colors: {
                    background: '#000000',
                    border: 'rgba(255, 0, 255, 0.5)',
                    text: '#ff00ff',
                    textDark: '#ff00ff',
                    accent: '#00ffff'
                }
            }
        ]
    };
    
    // If preset is a string (old format), use the first variation
    if (typeof preset === 'string' && topbarPresets[preset]) {
        currentSettings.topbar = { ...topbarPresets[preset][0] };
        applyTopbarStyles();
        showNotification(`Applied ${preset} topbar preset with colors!`, 'success');
    }
    // If preset is an object with preset and index (new format)
    else if (typeof preset === 'object' && preset.preset && preset.index !== undefined) {
        const presetGroup = topbarPresets[preset.preset];
        if (presetGroup && presetGroup[preset.index]) {
            currentSettings.topbar = { ...presetGroup[preset.index] };
            applyTopbarStyles();
            showNotification(`Applied ${presetGroup[preset.index].name} topbar preset!`, 'success');
        }
    }
    // If preset is passed as a complete preset object
    else if (typeof preset === 'object' && preset.colors) {
        currentSettings.topbar = { ...preset };
        applyTopbarStyles();
        showNotification(`Applied ${preset.name || 'custom'} topbar preset!`, 'success');
    }
}

function applyTopbarStyles() {
    const preset = currentSettings.topbar.preset;
    const colors = currentSettings.topbar.colors;
    const topbar = document.querySelector('.topbar');
    
    if (topbar) {
        // Remove all existing preset classes
        topbar.classList.remove('topbar-modern', 'topbar-solid', 'topbar-gradient', 'topbar-minimal', 'topbar-dark', 'topbar-neon', 'topbar-ocean', 'topbar-sunset', 'topbar-forest', 'topbar-cosmic');
        
        // Add the new preset class
        topbar.classList.add(`topbar-${preset}`);
        
        // Apply colors from preset if available
        if (colors) {
            applyTopbarColors(topbar, colors);
        } else {
            // Fallback to original style methods for backward compatibility
            switch(preset) {
                case 'modern':
                    applyModernTopbar(topbar);
                    break;
                case 'solid':
                    applySolidTopbar(topbar);
                    break;
                case 'gradient':
                    applyGradientTopbar(topbar);
                    break;
                case 'minimal':
                    applyMinimalTopbar(topbar);
                    break;
                case 'dark':
                    applyDarkTopbar(topbar);
                    break;
                case 'neon':
                    applyNeonTopbar(topbar);
                    break;
            }
        }
    }
}

function applyTopbarColors(topbar, colors) {
    const currentTheme = getCurrentTheme();
    const root = document.documentElement;
    
    // Apply background
    topbar.style.background = colors.background;
    root.style.setProperty('--topbar-background', colors.background);
    
    // Apply border
    if (colors.border === 'none') {
        topbar.style.border = 'none';
        root.style.setProperty('--topbar-border', 'none');
    } else {
        topbar.style.border = `1px solid ${colors.border}`;
        root.style.setProperty('--topbar-border', colors.border);
    }
    
    // Apply theme-aware text color
    const textColor = currentTheme === 'dark' ? (colors.textDark || colors.text) : colors.text;
    topbar.style.color = textColor;
    root.style.setProperty('--topbar-text-color', textColor);
    
    // Set accent color for interactions
    root.style.setProperty('--topbar-accent-color', colors.accent);
    
    // Extract RGB values for rgba usage in CSS
    const accentHex = colors.accent.replace('#', '');
    const accentR = parseInt(accentHex.substr(0, 2), 16);
    const accentG = parseInt(accentHex.substr(2, 2), 16);
    const accentB = parseInt(accentHex.substr(4, 2), 16);
    root.style.setProperty('--topbar-accent-rgb', `${accentR}, ${accentG}, ${accentB}`);
    
    // Apply backdrop filter for glass effects
    if (colors.background.includes('rgba')) {
        topbar.style.backdropFilter = 'blur(20px)';
        topbar.style.webkitBackdropFilter = 'blur(20px)';
    } else {
        topbar.style.backdropFilter = 'none';
        topbar.style.webkitBackdropFilter = 'none';
    }
    
    // Apply box shadow based on style
    if (colors.background.includes('gradient')) {
        topbar.style.boxShadow = `0 4px 20px ${colors.accent}40`; // 40 is hex alpha for 25%
    } else if (colors.background.includes('rgba')) {
        topbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else if (colors.border === 'none') {
        topbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    } else {
        topbar.style.boxShadow = `0 0 20px ${colors.border}, inset 0 0 20px ${colors.accent}20`;
    }
    
    // Apply accent color to interactive elements
    const buttons = topbar.querySelectorAll('button, .btn, .topbar-item, .topbar-nav-item');
    buttons.forEach(button => {
        button.style.setProperty('--topbar-accent', colors.accent);
        button.style.color = textColor;
        
        // Add hover effects
        button.addEventListener('mouseenter', function() {
            this.style.backgroundColor = `${colors.accent}20`;
            this.style.color = colors.accent;
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
            this.style.color = textColor;
        });
    });
    
    // Apply to text elements
    const textElements = topbar.querySelectorAll('.topbar-text, .topbar-title, span, p, .breadcrumb-item, .breadcrumb-current');
    textElements.forEach(element => {
        element.style.color = textColor;
    });
    
    // Apply to icons
    const icons = topbar.querySelectorAll('i, .icon, svg');
    icons.forEach(icon => {
        icon.style.color = colors.accent;
    });
    
    // Apply to breadcrumb separators
    const separators = topbar.querySelectorAll('.breadcrumb-separator');
    separators.forEach(separator => {
        separator.style.color = `${textColor}80`; // 50% opacity
    });
}

function applyModernTopbar(topbar) {
    topbar.style.background = 'rgba(255, 255, 255, 0.1)';
    topbar.style.backdropFilter = 'blur(20px)';
    topbar.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    topbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
}

function applySolidTopbar(topbar) {
    topbar.style.background = '#ffffff';
    topbar.style.backdropFilter = 'none';
    topbar.style.border = 'none';
    topbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
}

function applyGradientTopbar(topbar) {
    topbar.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    topbar.style.backdropFilter = 'none';
    topbar.style.border = 'none';
    topbar.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)';
    topbar.style.color = 'white';
}

function applyMinimalTopbar(topbar) {
    topbar.style.background = 'rgba(248, 250, 252, 0.95)';
    topbar.style.backdropFilter = 'blur(10px)';
    topbar.style.border = 'none';
    topbar.style.borderBottom = '1px solid rgba(0, 0, 0, 0.1)';
    topbar.style.boxShadow = 'none';
}

function applyDarkTopbar(topbar) {
    topbar.style.background = '#1a1a1a';
    topbar.style.backdropFilter = 'none';
    topbar.style.border = 'none';
    topbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    topbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    topbar.style.color = 'white';
}

function applyNeonTopbar(topbar) {
    topbar.style.background = '#000';
    topbar.style.backdropFilter = 'none';
    topbar.style.border = '1px solid rgba(0, 255, 255, 0.5)';
    topbar.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.1)';
    topbar.style.color = '#00ffff';
}

function updateTopbarPresetSelection(selectedPreset, selectedIndex = 0) {
    document.querySelectorAll('.topbar-preset-option').forEach(option => {
        const presetName = option.dataset.topbarPreset;
        const presetIndex = parseInt(option.dataset.presetIndex || 0);
        
        const isSelected = presetName === selectedPreset && presetIndex === selectedIndex;
        option.classList.toggle('selected', isSelected);
    });
}

// ===== BACKGROUND MANAGEMENT =====

async function applyBackgrounds() {
    // Apply chat background
    if (currentSettings.backgrounds.chat) {
        await applyBackgroundToElement('.chat-container', currentSettings.backgrounds.chat);
    }
    
    // Apply main background
    if (currentSettings.backgrounds.main) {
        await applyBackgroundToElement('.main-content', currentSettings.backgrounds.main);
    }
    
    // Apply background overlay settings
    applyBackgroundOverlay();
}

function getDeviceBackground(backgroundSection, isMobileDevice) {
    // Handle new structure (desktop/mobile separation)
    if (backgroundSection && typeof backgroundSection === 'object') {
        if (backgroundSection.desktop || backgroundSection.mobile) {
            // New structure: separate desktop and mobile
            if (isMobileDevice) {
                // Use mobile version if available, fallback to desktop
                return backgroundSection.mobile || backgroundSection.desktop;
            } else {
                // Use desktop version if available, fallback to mobile
                return backgroundSection.desktop || backgroundSection.mobile;
            }
        } else if (backgroundSection.type && backgroundSection.url) {
            // Old structure: single background object
            return backgroundSection;
        }
    }
    return null;
}

async function applyBackgroundToElement(selector, backgroundData) {
    const element = document.querySelector(selector);
    if (element && backgroundData) {
        // Get background URL - try objectURL first, then load from storage if needed
        let backgroundUrl = backgroundData.objectURL || backgroundData.url;
        
        // If no URL available but background is stored, load it from IndexedDB
        if (!backgroundUrl && backgroundData.isStored && backgroundData.storageKey) {
            try {
                console.log(`Loading background from storage for ${selector}...`);
                backgroundUrl = await getBackgroundData(backgroundData.storageKey);
                
                // Cache as objectURL for future use
                if (backgroundUrl) {
                    try {
                        const response = await fetch(backgroundUrl);
                        const blob = await response.blob();
                        backgroundData.objectURL = URL.createObjectURL(blob);
                        backgroundUrl = backgroundData.objectURL;
                    } catch (error) {
                        console.warn('Failed to create object URL:', error);
                        // Continue with the base64 URL
                    }
                }
            } catch (error) {
                console.warn(`Failed to load background from storage:`, error);
                return;
            }
        }
        
        if (backgroundUrl && backgroundData.type) {
            // Check if mobile optimizations should be applied
            const isMobileDevice = isMobile();
            
            if (backgroundData.type === 'image') {
                element.style.backgroundImage = `url(${backgroundUrl})`;
                
                // Apply mobile-optimized CSS
                if (isMobileDevice) {
                    element.style.backgroundSize = 'cover';
                    element.style.backgroundAttachment = 'scroll'; // Better mobile performance
                    element.style.backgroundPosition = 'center center'; // Better for vertical screens
                } else {
                    element.style.backgroundSize = 'cover';
                    element.style.backgroundPosition = 'center';
                    element.style.backgroundAttachment = 'fixed';
                }
                
                element.style.backgroundRepeat = 'no-repeat';
                
            } else if (backgroundData.type === 'video') {
                // Handle video backgrounds with mobile optimization
                applyVideoBackground(element, { ...backgroundData, url: backgroundUrl }, isMobileDevice);
                
            } else if (backgroundData.type === 'gradient') {
                element.style.background = backgroundData.gradient;
            }
            
            // Apply mobile-specific performance optimizations
            if (isMobileDevice) {
                element.style.transform = 'translateZ(0)'; // Force GPU acceleration
                element.style.willChange = 'auto'; // Don't force will-change on mobile
            }
        }
        
        // Force dark theme styling for chat containers regardless of background
        if (selector.includes('chat') || selector.includes('.chat-container')) {
            element.setAttribute('data-theme', 'dark');
            element.classList.add('force-dark-theme');
            
            // Apply dark theme colors with overlay for readability
            const colors = currentSettings.colors;
            const darkTextColor = colors.textColorDark || '#E5F4FF';
            const overlayOpacity = currentSettings.backgrounds.overlayOpacity || 0.85;
            
            // Add overlay for text readability if background image exists
            if (backgroundUrl && backgroundData.type === 'image') {
                element.style.setProperty('--chat-overlay', `rgba(0, 0, 0, ${overlayOpacity})`, 'important');
                element.style.color = darkTextColor;
                
                // Create or update overlay for better text readability
                let overlay = element.querySelector('.chat-dark-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.className = 'chat-dark-overlay';
                    overlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, ${overlayOpacity});
                        pointer-events: none;
                        z-index: 1;
                    `;
                    element.style.position = 'relative';
                    element.appendChild(overlay);
                }
                
                // Ensure content is above overlay
                const children = element.children;
                for (let i = 0; i < children.length; i++) {
                    if (children[i] !== overlay) {
                        children[i].style.position = 'relative';
                        children[i].style.zIndex = '2';
                    }
                }
            }
            
            console.log('Applied dark theme styling to chat container:', selector);
        }
    }
}

function applyVideoBackground(element, backgroundData, shouldOptimize) {
    // Remove existing video background
    const existingVideo = element.querySelector('.background-video');
    if (existingVideo) {
        existingVideo.remove();
    }
    
    // Create video element
    const video = document.createElement('video');
    video.className = 'background-video';
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = shouldOptimize ? 'contain' : 'cover';
    video.style.zIndex = '-1';
    video.style.pointerEvents = 'none';
    
    // Mobile optimizations for video
    if (shouldOptimize) {
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata'; // Reduce initial load
        
        // Reduce quality for mobile if needed
        const connectionSpeed = getConnectionSpeed();
        if (connectionSpeed === 'slow-2g' || connectionSpeed === '2g') {
            video.style.filter = 'blur(1px)'; // Slight blur for performance
        }
        
        // Check if reduced motion is preferred
        if (currentSettings.backgrounds.mobile && currentSettings.backgrounds.mobile.reduceMotion) {
            video.pause();
            video.style.display = 'none';
            return; // Skip video on mobile if motion is reduced
        }
    } else {
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
    }
    
    video.src = backgroundData.url;
    element.style.position = 'relative';
    element.appendChild(video);
    
    // Auto-play with error handling
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log('Video autoplay failed:', error);
            // Fall back to poster image if available
            if (backgroundData.poster) {
                element.style.backgroundImage = `url(${backgroundData.poster})`;
                element.style.backgroundSize = shouldOptimize ? 'contain' : 'cover';
                element.style.backgroundPosition = 'center';
                element.style.backgroundRepeat = 'no-repeat';
            }
        });
    }
}

function selectBackground(type) {
    console.log(`selectBackground called with type: ${type}`);
    const input = document.getElementById(`${type}BackgroundInput`);
    console.log(`Input element found:`, input);
    if (input) {
        input.click();
    } else {
        console.error(`Input element with id "${type}BackgroundInput" not found`);
        showNotification(`Error: Background input not found for ${type}`, 'error');
    }
}

function showLockedFeature(featureName) {
    showNotification(`${featureName} is coming in a future update! 🚀`, 'info', 4000);
}

async function removeBackground(type) {
    const background = currentSettings.backgrounds[type];
    
    if (background) {
        // Clean up object URL if it exists to prevent memory leaks
        if (background.objectURL) {
            URL.revokeObjectURL(background.objectURL);
        }
        
        // Clean up stored data
        if (background.isStored) {
            const storageKey = background.storageKey || `remiBackground_${type}`;
            await removeBackgroundData(storageKey);
            console.log(`Removed stored data for ${type} background`);
        }
        
        // Reset background
        currentSettings.backgrounds[type] = null;
        
        updateBackgroundPreview(type);
        markAsChanged();
        
        if (currentSettings.preferences.autoSave) {
            await saveSettingsEnhanced();
        }
        
        showNotification(`${type} background removed`, 'success');
    }
}

async function removeBackgroundDevice(type, deviceType) {
    const backgroundSection = currentSettings.backgrounds[type];
    
    if (backgroundSection && backgroundSection[deviceType]) {
        const background = backgroundSection[deviceType];
        
        // Clean up object URL if it exists to prevent memory leaks
        if (background.objectURL) {
            URL.revokeObjectURL(background.objectURL);
        }
        
        // Clean up stored data
        if (background.isStored) {
            const storageKey = background.storageKey || `remiBackground_${type}_${deviceType}`;
            await removeBackgroundData(storageKey);
            console.log(`Removed stored data for ${type} ${deviceType} background`);
        }
        else if (background.isChunked) {
            const chunkKey = background.chunkKey || `remiBackground_${type}_${deviceType}`;
            removeChunkedData(chunkKey);
            console.log(`Removed chunked storage for ${type} ${deviceType} background`);
        }
        
        // Remove the specific device version
        currentSettings.backgrounds[type][deviceType] = null;
        
        updateBackgroundPreview(type);
        markAsChanged();
        
        if (currentSettings.preferences.autoSave) {
            await saveSettingsEnhanced();
        }
        
        const deviceName = deviceType === 'mobile' ? 'mobile wallpaper' : 'desktop background';
        showNotification(`${type} ${deviceName} removed`, 'success');
    }
}

async function updateBackgroundPreview(type) {
    console.log(`updateBackgroundPreview called for type: ${type}`);
    const preview = document.getElementById(`${type}Background`);
    const img = preview.querySelector('img');
    const video = preview.querySelector('video');
    const noBackground = preview.querySelector('.no-background');
    
    // Get the background data
    const background = currentSettings.backgrounds[type];
    console.log(`Background data for ${type}:`, background);
    
    if (background) {
        // Get media URL - check objectURL first, then try loading from IndexedDB if stored
        let mediaUrl = background.objectURL || background.url;
        console.log(`Media URL for ${type}: ${mediaUrl ? mediaUrl.substring(0, 50) + '...' : 'none'}`);
        
        // If no URL available but background is stored in IndexedDB, load it
        if (!mediaUrl && background.isStored && background.storageKey) {
            try {
                console.log(`Loading ${type} background from IndexedDB...`);
                mediaUrl = await getBackgroundData(background.storageKey);
                
                // Cache the loaded URL as objectURL for future use
                if (mediaUrl) {
                    // Convert base64 to blob URL for better memory management
                    const response = await fetch(mediaUrl);
                    const blob = await response.blob();
                    background.objectURL = URL.createObjectURL(blob);
                    mediaUrl = background.objectURL;
                }
            } catch (error) {
                console.warn(`Failed to load ${type} background from IndexedDB:`, error);
            }
        }
        
        if (mediaUrl && background.type) {
            console.log(`Displaying ${background.type} for ${type}`);
            if (background.type === 'video') {
                // Show video, hide image
                if (video) {
                    video.src = mediaUrl;
                    video.style.display = 'block';
                    video.load(); // Reload video
                    
                    // Configure video for autoplay
                    video.loop = true;
                    video.muted = true;
                    video.setAttribute('playsinline', 'true');
                    
                    video.play().catch(e => {
                        console.warn('Video preview play failed:', e.message);
                    });
                }
                if (img) {
                    img.style.display = 'none';
                }
            } else {
                // Show image, hide video
                if (img) {
                    img.src = mediaUrl;
                    img.style.display = 'block';
                    console.log(`Set image src for ${type} preview`);
                }
                if (video) {
                    video.pause();
                    video.style.display = 'none';
                    video.src = '';
                }
            }
            noBackground.style.display = 'none';
            
            // Add device indicator for unified background
            updatePreviewDeviceIndicator(preview, background);
            
        } else if (background.needsReupload) {
            // Show reupload message
            if (img) img.style.display = 'none';
            if (video) {
                video.pause();
                video.style.display = 'none';
                video.src = '';
            }
            noBackground.style.display = 'flex';
            
            const icon = noBackground.querySelector('i');
            const text = noBackground.querySelector('p');
            if (icon && text) {
                icon.className = 'fas fa-upload';
                icon.style.color = '#ff9500';
                text.textContent = `Re-upload ${background.filename || 'file'} (${background.originalType || background.type})`;
                text.style.fontSize = '0.85rem';
            }
        } else {
            // No valid media URL
            if (img) img.style.display = 'none';
            if (video) {
                video.pause();
                video.style.display = 'none';
                video.src = '';
            }
            noBackground.style.display = 'flex';
            
            // Reset to default state
            const icon = noBackground.querySelector('i');
            const text = noBackground.querySelector('p');
            if (icon && text) {
                icon.className = 'fas fa-image';
                icon.style.color = '';
                text.textContent = 'No background set';
                text.style.fontSize = '';
            }
        }
    } else {
        // No background set at all
        if (img) img.style.display = 'none';
        if (video) {
            video.pause();
            video.style.display = 'none';
            video.src = '';
        }
        noBackground.style.display = 'flex';
        
        // Reset to default state
        const icon = noBackground.querySelector('i');
        const text = noBackground.querySelector('p');
        if (icon && text) {
            icon.className = 'fas fa-image';
            icon.style.color = '';
            text.textContent = 'No background set';
            text.style.fontSize = '';
        }
    }
}

function updatePreviewDeviceIndicator(preview, background) {
    // Remove existing device indicator
    const existingIndicator = preview.querySelector('.device-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Create device indicator for unified background
    const indicator = document.createElement('div');
    indicator.className = 'device-indicator';
    indicator.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(34, 197, 94, 0.9);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
        z-index: 10;
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    // Show unified background indicator
    const isOptimized = background.mobileOptimized || false;
    indicator.innerHTML = `<i class="fas fa-layer-group" style="margin-right: 4px;"></i>Universal${isOptimized ? ' ✨' : ''}`;
    
    preview.style.position = 'relative';
    preview.appendChild(indicator);
        indicator.innerHTML = `<i class="fas fa-desktop" style="margin-right: 4px;"></i>Desktop`;
        indicator.style.background = 'rgba(99, 102, 241, 0.9)';
    }

// ===== BACKGROUND OVERLAY MANAGEMENT =====

function applyBackgroundOverlay() {
    // Set CSS custom properties for overlay opacity
    const opacity = currentSettings.backgrounds.overlayOpacity || 0.85;
    document.documentElement.style.setProperty('--bg-overlay-opacity', opacity);
}

function updateOverlayPreview() {
    const previewOverlay = document.querySelector('.preview-overlay');
    if (previewOverlay) {
        const isDark = document.documentElement.dataset.theme === 'dark';
        const opacity = currentSettings.backgrounds.overlayOpacity || 0.85;
        
        if (isDark) {
            previewOverlay.style.background = `rgba(0, 0, 0, ${opacity})`;
        } else {
            previewOverlay.style.background = `rgba(255, 255, 255, ${opacity})`;
        }
    }
}

function populateOverlayControls() {
    // Set darkness slider value
    const darknessSlider = document.getElementById('backgroundDarkness');
    const transparencySlider = document.getElementById('backgroundTransparency');
    const darknessValueDisplay = document.getElementById('darknessValue');
    const transparencyValueDisplay = document.getElementById('transparencyValue');
    
    if (darknessSlider && darknessValueDisplay) {
        const darknessValue = Math.round((currentSettings.backgrounds.overlayDarkness || 0.75) * 100);
        darknessSlider.value = darknessValue;
        darknessValueDisplay.textContent = darknessValue + '%';
    }
    
    if (transparencySlider && transparencyValueDisplay) {
        const transparencyValue = Math.round((currentSettings.backgrounds.overlayOpacity || 0.85) * 100);
        transparencySlider.value = transparencyValue;
        transparencyValueDisplay.textContent = transparencyValue + '%';
    }
    
    updateOverlayPreview();
}

// ===== PERSONALITY MANAGEMENT =====

function applyPersonality() {
    const personality = currentSettings.personality;
    
    // Update name displays - only if elements exist
    const previewName = document.getElementById('previewName');
    if (previewName) {
        previewName.textContent = personality.name;
    }
    
    // Update all elements with data-remi-name
    document.querySelectorAll('[data-remi-name]').forEach(element => {
        element.textContent = personality.name;
    });
    
    // Update relationship display
    updateRelationshipDisplay();
    
    // Update avatar with proper handling of custom uploads
    updateAvatarDisplay(personality.avatar);
}

function updateAvatarDisplay(avatarPath) {
    const previewAvatar = document.getElementById('previewAvatar');
    const currentAvatar = document.getElementById('currentAvatar');
    
    // Check if this is a custom uploaded avatar
    if (currentSettings.personality.customAvatarFile && 
        avatarPath.includes('custom_avatar_')) {
        
        // Use object URL for immediate display if available
        const customFile = currentSettings.personality.customAvatarFile;
        if (customFile.objectURL) {
            if (previewAvatar) previewAvatar.src = customFile.objectURL;
            if (currentAvatar) currentAvatar.src = customFile.objectURL;
            return;
        }
    }
    
    // For regular avatars or custom avatars that should be in the pfp folder
    // Try to load the image, fall back to default if it fails
    const testImage = new Image();
    testImage.onload = function() {
        if (previewAvatar) previewAvatar.src = avatarPath;
        if (currentAvatar) currentAvatar.src = avatarPath;
    };
    testImage.onerror = function() {
        // If custom avatar file doesn't exist, fall back to default
        console.warn(`Avatar image not found: ${avatarPath}. Falling back to default.`);
        const defaultAvatar = 'pfp/Remi-pfp.png';
        if (previewAvatar) previewAvatar.src = defaultAvatar;
        if (currentAvatar) currentAvatar.src = defaultAvatar;
        
        // Update settings to reflect the fallback
        if (avatarPath !== defaultAvatar) {
            currentSettings.personality.avatar = defaultAvatar;
            // Clean up invalid custom avatar reference
            if (currentSettings.personality.customAvatarFile) {
                delete currentSettings.personality.customAvatarFile;
            }
            // Only show notification if we have a notification system available
            if (typeof showNotification === 'function') {
                showNotification('Custom avatar not found. Using default avatar.', 'warning');
            }
        }
    };
    testImage.src = avatarPath;
}

function updateRelationshipDisplay() {
    const level = currentSettings.personality.relationshipLevel;
    const meterFill = document.querySelector('.meter-fill');
    const relationshipText = document.querySelector('.relationship-text');
    
    // Only update if elements exist (they were removed from the page)
    if (meterFill) {
        meterFill.style.width = `${level}%`;
    }
    
    let relationship = 'Acquaintance';
    if (level >= 33 && level < 66) relationship = 'Friend';
    else if (level >= 66) relationship = 'Best Friend';
    
    if (relationshipText) {
        relationshipText.textContent = `${relationship} (${level}%)`;
    }
    
    // Update preview relationship text
    const previewRelationship = document.getElementById('previewRelationship');
    if (previewRelationship) {
        const styles = {
            friendly: 'Your AI Study Companion',
            professional: 'Your AI Assistant',
            casual: 'Your Study Buddy'
        };
        previewRelationship.textContent = styles[currentSettings.personality.communicationStyle] || styles.friendly;
    }
}

function selectAvatar() {
    const input = document.getElementById('avatarInput');
    input.click();
}

function resetName() {
    document.getElementById('remiName').value = 'Remi';
    currentSettings.personality.name = 'Remi';
    updatePreview();
    markAsChanged();
}

// ===== PREFERENCES MANAGEMENT =====

function applyPreferences() {
    const prefs = currentSettings.preferences;
    
    // Apply smooth animations
    if (prefs.smoothAnimations) {
        document.body.classList.add('smooth-animations');
    } else {
        document.body.classList.remove('smooth-animations');
    }
    
    // Apply compact mode
    if (prefs.compactMode) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
}

// ===== EVENT LISTENERS =====

function initializeEventListeners() {
    // Theme selection
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.dataset.theme;
            console.log('Theme option clicked:', theme); // Debug log
            currentSettings.theme = theme;
            updateThemeSelection();
            applyTheme(); // Apply theme immediately
            markAsChanged();
        });
    });
    
    // Color inputs
    document.querySelectorAll('input[type="color"]').forEach(input => {
        input.addEventListener('change', function() {
            const colorType = this.id;
            const value = this.value;
            
            // Update color value display
            const valueDisplay = this.nextElementSibling;
            if (valueDisplay && valueDisplay.classList.contains('color-value')) {
                valueDisplay.textContent = value;
            }
            
            // Update settings
            currentSettings.colors[colorType] = value;
            
            // Apply colors immediately
            applyColors();
            
            markAsChanged();
        });
    });
    
    // Color presets
    document.querySelectorAll('.preset-option').forEach(preset => {
        preset.addEventListener('click', function(e) {
            const presetName = this.dataset.preset;
            
            // Check if coin system is available and if preset is locked
            if (window.coinSystem && !window.coinSystem.hasUnlocked('colorPresets', presetName)) {
                e.preventDefault();
                // The coin system will handle the purchase attempt
                return;
            }
            
            if (applyColorPreset(presetName)) {
                updatePresetSelection(presetName);
                // markAsChanged() is already called in applyColorPreset
            }
        });
    });
    
    // Topbar presets
    document.querySelectorAll('.topbar-preset-option').forEach(preset => {
        preset.addEventListener('click', function() {
            const presetName = this.dataset.topbarPreset;
            const presetIndex = this.dataset.presetIndex;
            
            if (presetIndex !== undefined) {
                // New format with multiple variations
                applyTopbarPreset({ preset: presetName, index: parseInt(presetIndex) });
                updateTopbarPresetSelection(presetName, parseInt(presetIndex));
            } else {
                // Legacy format (fallback)
                applyTopbarPreset(presetName);
                updateTopbarPresetSelection(presetName);
            }
            markAsChanged();
        });
    });
    
    // Background file inputs
    document.getElementById('chatBackgroundInput').addEventListener('change', function(e) {
        handleBackgroundUpload(e, 'chat');
    });
    
    document.getElementById('mainBackgroundInput').addEventListener('change', function(e) {
        handleBackgroundUpload(e, 'main');
    });

    // Background overlay controls (check if elements exist)
    const backgroundDarkness = document.getElementById('backgroundDarkness');
    if (backgroundDarkness) {
        backgroundDarkness.addEventListener('input', function() {
            const value = parseInt(this.value);
            currentSettings.backgrounds.overlayDarkness = value / 100;
            const darknessValue = document.getElementById('darknessValue');
            if (darknessValue) {
                darknessValue.textContent = value + '%';
            }
            updateOverlayPreview();
            applyBackgroundOverlay();
            markAsChanged();
        });
    }

    const backgroundTransparency = document.getElementById('backgroundTransparency');
    if (backgroundTransparency) {
        backgroundTransparency.addEventListener('input', function() {
            const value = parseInt(this.value);
            currentSettings.backgrounds.overlayOpacity = value / 100;
            const transparencyValue = document.getElementById('transparencyValue');
            if (transparencyValue) {
                transparencyValue.textContent = value + '%';
            }
            updateOverlayPreview();
            applyBackgroundOverlay();
            markAsChanged();
        });
    }

    // Mobile optimization checkboxes
    const chatOptimizeForMobile = document.getElementById('chatOptimizeForMobile');
    if (chatOptimizeForMobile) {
        chatOptimizeForMobile.addEventListener('change', function() {
            // Ensure mobile settings exist
            if (!currentSettings.backgrounds.mobile) {
                currentSettings.backgrounds.mobile = {
                    optimizeForMobile: true,
                    reduceMotion: false,
                    chatOptimization: true,
                    mainOptimization: true
                };
            }
            currentSettings.backgrounds.mobile.chatOptimization = this.checked;
            markAsChanged();
            if (currentSettings.backgrounds.chat) {
                applyBackgroundToElement('.chat-container', currentSettings.backgrounds.chat);
            }
        });
    }

    const mainOptimizeForMobile = document.getElementById('mainOptimizeForMobile');
    if (mainOptimizeForMobile) {
        mainOptimizeForMobile.addEventListener('change', function() {
            // Ensure mobile settings exist
            if (!currentSettings.backgrounds.mobile) {
                currentSettings.backgrounds.mobile = {
                    optimizeForMobile: true,
                    reduceMotion: false,
                    chatOptimization: true,
                    mainOptimization: true
                };
            }
            currentSettings.backgrounds.mobile.mainOptimization = this.checked;
            markAsChanged();
            if (currentSettings.backgrounds.main) {
                applyBackgroundToElement('.main-content', currentSettings.backgrounds.main);
            }
        });
    }

    const chatReduceMotion = document.getElementById('chatReduceMotion');
    if (chatReduceMotion) {
        chatReduceMotion.addEventListener('change', function() {
            // Ensure mobile settings exist
            if (!currentSettings.backgrounds.mobile) {
                currentSettings.backgrounds.mobile = {
                    optimizeForMobile: true,
                    reduceMotion: false,
                    chatOptimization: true,
                    mainOptimization: true
                };
            }
            currentSettings.backgrounds.mobile.reduceMotion = this.checked;
            markAsChanged();
            if (currentSettings.backgrounds.chat) {
                applyBackgroundToElement('.chat-container', currentSettings.backgrounds.chat);
            }
        });
    }

    const mainReduceMotion = document.getElementById('mainReduceMotion');
    if (mainReduceMotion) {
        mainReduceMotion.addEventListener('change', function() {
            // Ensure mobile settings exist
            if (!currentSettings.backgrounds.mobile) {
                currentSettings.backgrounds.mobile = {
                    optimizeForMobile: true,
                    reduceMotion: false,
                    chatOptimization: true,
                    mainOptimization: true
                };
            }
            currentSettings.backgrounds.mobile.reduceMotion = this.checked;
            markAsChanged();
            if (currentSettings.backgrounds.main) {
                applyBackgroundToElement('.main-content', currentSettings.backgrounds.main);
            }
        });
    }

    // Avatar input (check if element exists)
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            handleAvatarUpload(e);
        });
    }
    
    // Avatar presets (check if elements exist)
    document.querySelectorAll('.avatar-preset').forEach(preset => {
        preset.addEventListener('click', function() {
            const avatar = this.dataset.avatar;
            currentSettings.personality.avatar = avatar;
            updateAvatarSelection();
            markAsChanged();
        });
    });
    
    // Personality options (check if elements exist)
    document.querySelectorAll('input[name="communicationStyle"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                currentSettings.personality.communicationStyle = this.value;
                updatePreview();
                markAsChanged();
            }
        });
    });
    
    // Relationship slider (check if element exists)
    const relationshipLevel = document.getElementById('relationshipLevel');
    if (relationshipLevel) {
        relationshipLevel.addEventListener('input', function() {
            currentSettings.personality.relationshipLevel = parseInt(this.value);
            updateRelationshipDisplay();
            markAsChanged();
        });
    }
    
    // Name input (check if element exists)
    const remiName = document.getElementById('remiName');
    if (remiName) {
        remiName.addEventListener('input', function() {
            currentSettings.personality.name = this.value;
            updatePreview();
            markAsChanged();
        });
    }
    
    // Preference toggles (check if elements exist)
    document.querySelectorAll('.preference-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const prefName = this.id;
            currentSettings.preferences[prefName] = this.checked;
            
            if (prefName === 'smoothAnimations' || prefName === 'compactMode') {
                applyPreferences();
            }
            
            markAsChanged();
        });
    });
    
    // Import input (check if element exists)
    const importInput = document.getElementById('importInput');
    if (importInput) {
        importInput.addEventListener('change', function(e) {
            handleSettingsImport(e);
        });
    }
}

// ===== FILE HANDLING =====

function handleBackgroundUpload(event, type) {
    console.log(`handleBackgroundUpload called with type: ${type}`);
    const file = event.target.files[0];
    console.log(`File selected:`, file);
    
    if (file) {
        console.log(`File details: ${file.name}, ${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        
        // Only accept images
        if (!file.type.startsWith('image/')) {
            console.error('Invalid file type:', file.type);
            showNotification('Please select a valid image file', 'error');
            return;
        }
        
        // Size limits
        const maxSize = 8 * 1024 * 1024; // 8MB limit
        if (file.size > maxSize) {
            const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
            console.error('File too large:', fileSizeMB + 'MB');
            showNotification(
                `Image too large (${fileSizeMB}MB). Please select an image under 8MB.`,
                'error',
                6000
            );
            return;
        }
        
        console.log('File validation passed, processing...');
        showNotification('Processing background for all devices...', 'info', 3000);
        
        // Process the background file
        processUnifiedBackground(file, type);
    } else {
        console.log('No file selected');
    }
}

function processUnifiedBackground(file, type) {
    console.log(`processUnifiedBackground called with file: ${file.name}, type: ${type}`);
    const reader = new FileReader();
    reader.onload = async function(e) {
        console.log('FileReader onload triggered');
        const base64Data = e.target.result;
        const objectURL = URL.createObjectURL(file);
        console.log(`Base64 data length: ${base64Data.length}, ObjectURL: ${objectURL}`);
        
        // Create background data object
        const backgroundData = {
            type: 'image',
            url: base64Data,
            objectURL: objectURL,
            filename: file.name,
            isCustom: true,
            size: file.size,
            uploadDate: Date.now(),
            mobileOptimized: true // Always optimize for mobile
        };
        
        console.log('Background data created:', backgroundData);
        
        // Store using IndexedDB
        const storageKey = `remiBackground_${type}`;
        console.log(`Attempting to store with key: ${storageKey}`);
        const storageResult = await storeBackgroundData(storageKey, base64Data, {
            filename: file.name,
            size: file.size,
            type: type,
            uploadDate: Date.now()
        });
        
        console.log('Storage result:', storageResult);
        
        if (storageResult.success) {
            // Update settings with storage reference (remove base64 data to keep settings lightweight)
            const settingsBackgroundData = {
                type: 'image',
                filename: file.name,
                isCustom: true,
                size: file.size,
                uploadDate: Date.now(),
                mobileOptimized: true,
                isStored: true,
                storageKey: storageKey,
                storageMethod: storageResult.method,
                // Keep objectURL for immediate preview but remove base64 data
                objectURL: objectURL,
                // Keep url for immediate use, will be cleaned up during save
                url: base64Data
                // Note: 'url' (base64 data) will be moved to IndexedDB during save
            };
            
            // Store in settings as unified background 
            // Initialize the background type structure if it doesn't exist
            if (!currentSettings.backgrounds[type]) {
                currentSettings.backgrounds[type] = {};
            }
            
            // Store as the unified background (replaces the old desktop/mobile structure)
            currentSettings.backgrounds[type] = settingsBackgroundData;
            
            console.log(`Background stored successfully:`, {
                type: type,
                method: storageResult.method,
                size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
                filename: file.name,
                settingsSize: `${(JSON.stringify(settingsBackgroundData).length / 1024).toFixed(1)}KB`
            });
            
            console.log('Updating background preview...');
            updateBackgroundPreview(type);
            markAsChanged();
            
            if (currentSettings.preferences.autoSave) {
                console.log('Auto-saving settings...');
                await saveSettingsEnhanced();
            }
            
            console.log('Background upload process completed successfully');
            showNotification(`${type} background uploaded and optimized successfully!`, 'success');
        } else {
            console.error('Failed to store background:', storageResult.error);
            showNotification('Failed to save background. Please try a smaller image.', 'error');
        }
    };
    
    reader.onerror = function(error) {
        console.error('FileReader error:', error);
        showNotification('Failed to read the image file.', 'error');
    };
    
    console.log('Starting to read file as data URL...');
    reader.readAsDataURL(file);
}

function optimizeImageForMobile(file, type) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Standard mobile device dimensions (portrait orientation)
        const MOBILE_DIMENSIONS = [
            { width: 375, height: 667 },  // iPhone SE
            { width: 414, height: 896 },  // iPhone 11 Pro
            { width: 428, height: 926 },  // iPhone 14 Pro Max
            { width: 360, height: 640 },  // Android Standard
            { width: 412, height: 915 },  // Pixel 6
        ];
        
        // Use the most common mobile dimension or detect current mobile device
        let targetDimensions;
        if (isMobile() && window.screen.width <= 768) {
            // Use actual device dimensions if on mobile
            targetDimensions = {
                width: Math.min(window.screen.width, window.screen.height), // Portrait width
                height: Math.max(window.screen.width, window.screen.height)  // Portrait height
            };
        } else {
            // Use iPhone 11 Pro dimensions as default for mobile optimization
            targetDimensions = { width: 414, height: 896 };
        }
        
        // Scale for retina displays
        const maxWidth = targetDimensions.width * 2;   // 2x for retina
        const maxHeight = targetDimensions.height * 2; // 2x for retina
        
        let { width, height } = img;
        
        // Scale down if necessary to fit mobile dimensions
        if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const ratio = Math.min(widthRatio, heightRatio);
            
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(function(blob) {
            if (blob) {
                // Create optimized file
                const optimizedFile = new File([blob], file.name, {
                    type: 'image/jpeg', // Always use JPEG for better compression
                    lastModified: Date.now()
                });
                
                console.log(`Mobile wallpaper optimization: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(optimizedFile.size / 1024 / 1024).toFixed(1)}MB`);
                console.log(`Dimensions: ${img.width}x${img.height} → ${width}x${height} (optimized for ${targetDimensions.width}x${targetDimensions.height} mobile)`);
                
                // Process both desktop and mobile versions
                processBackgroundFileWithMobile(file, optimizedFile, type, false);
            } else {
                // Fallback to original file
                processBackgroundFile(file, type, false);
            }
        }, 'image/jpeg', 0.85); // 85% quality for mobile wallpapers
    };
    
    img.src = URL.createObjectURL(file);
}

function processBackgroundFileWithMobile(originalFile, mobileFile, type, isVideo) {
    // Process desktop version
    const desktopReader = new FileReader();
    desktopReader.onload = function(e) {
        const desktopBase64 = e.target.result;
        const desktopObjectURL = URL.createObjectURL(originalFile);
        
        // Process mobile version
        const mobileReader = new FileReader();
        mobileReader.onload = function(e) {
            const mobileBase64 = e.target.result;
            const mobileObjectURL = URL.createObjectURL(mobileFile);
            
            // Store both versions in settings
            if (!currentSettings.backgrounds[type]) {
                currentSettings.backgrounds[type] = {};
            }
            
            // Desktop version
            currentSettings.backgrounds[type].desktop = {
                type: isVideo ? 'video' : 'image',
                url: desktopBase64,
                objectURL: desktopObjectURL,
                filename: originalFile.name,
                isCustom: true,
                size: originalFile.size,
                base64Size: (desktopBase64.length * 3) / 4,
                deviceType: 'desktop'
            };
            
            // Mobile version (optimized)
            currentSettings.backgrounds[type].mobile = {
                type: isVideo ? 'video' : 'image',
                url: mobileBase64,
                objectURL: mobileObjectURL,
                filename: mobileFile.name,
                isCustom: true,
                size: mobileFile.size,
                base64Size: (mobileBase64.length * 3) / 4,
                deviceType: 'mobile',
                mobileOptimized: true,
                originalSize: originalFile.size
            };
            
            // Add poster frame for videos on mobile
            if (isVideo && isMobile()) {
                generateVideoPoster(mobileFile, type);
            }
            
            updateBackgroundPreview(type);
            markAsChanged();
            
            // Save enhanced settings
            if (currentSettings.preferences.autoSave) {
                saveSettingsEnhanced();
            }
            
            // Show completion message
            const isMobileDevice = isMobile();
            const completionMessage = `${isVideo ? 'Live wallpaper' : 'Wallpaper'} uploaded with separate ${isMobileDevice ? 'mobile' : 'desktop'} and ${isMobileDevice ? 'desktop' : 'mobile'} versions!`;
            showNotification(completionMessage, 'success');
        };
        
        mobileReader.onerror = function() {
            // Fallback: use desktop version for mobile too
            currentSettings.backgrounds[type].mobile = currentSettings.backgrounds[type].desktop;
            showNotification('Mobile optimization failed, using desktop version for mobile.', 'warning');
        };
        
        mobileReader.readAsDataURL(mobileFile);
    };
    
    desktopReader.onerror = function() {
        showNotification('Error reading file. Please try again.', 'error');
    };
    
    desktopReader.readAsDataURL(originalFile);
}

function processBackgroundFile(file, type, isVideo) {
    // Always convert to base64 for localStorage persistence
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        const base64Size = (base64Data.length * 3) / 4;
        
        // Create object URL for immediate preview while saving to localStorage
        const objectURL = URL.createObjectURL(file);
        
        // Get mobile optimization settings
        const isMobileDevice = isMobile();
        const optimizations = getMobileOptimizations();
        
        // Initialize section structure if needed
        if (!currentSettings.backgrounds[type]) {
            currentSettings.backgrounds[type] = {
                desktop: null,
                mobile: null
            };
        }
        
        // Determine which version to store (desktop or mobile)
        const deviceType = isMobileDevice ? 'mobile' : 'desktop';
        
        currentSettings.backgrounds[type][deviceType] = {
            type: isVideo ? 'video' : 'image',
            url: base64Data, // Save base64 for persistence
            objectURL: objectURL, // Keep object URL for immediate preview
            filename: file.name,
            isCustom: true,
            size: file.size,
            base64Size: base64Size,
            deviceType: deviceType,
            mobileOptimized: deviceType === 'mobile' && currentSettings.backgrounds.mobile.optimizeForMobile,
            originalSize: file.size
        };
        
        // If uploading from desktop but mobile optimization is enabled, also create mobile version
        if (!isMobileDevice && currentSettings.backgrounds.mobile.optimizeForMobile) {
            // Create a mobile-optimized version
            if (!isVideo) {
                optimizeImageForMobile(file, type);
                return; // optimizeImageForMobile will handle the rest
            }
        }
        
        // Add poster frame for videos on mobile
        if (isVideo && isMobileDevice) {
            generateVideoPoster(file, type);
        }
        
        updateBackgroundPreview(type);
        markAsChanged();
        
        // Save enhanced settings
        if (currentSettings.preferences.autoSave) {
            saveSettingsEnhanced();
        }
        
        // Show completion message with mobile optimization info
        const completionMessage = deviceType === 'mobile' && currentSettings.backgrounds.mobile.optimizeForMobile ?
            `${isVideo ? 'Live wallpaper' : 'Wallpaper'} optimized for mobile!` :
            `${isVideo ? 'Live wallpaper' : 'Background'} uploaded successfully!`;
        showNotification(completionMessage, 'success');
    };
    
    reader.onerror = function() {
        showNotification('Error reading file. Please try again.', 'error');
    };
    
    reader.readAsDataURL(file);
}

function generateVideoPoster(videoFile, type) {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = function() {
        // Seek to 1 second or 10% of video duration
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
    };
    
    video.onseeked = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(function(blob) {
            if (blob && currentSettings.backgrounds[type]) {
                const posterURL = URL.createObjectURL(blob);
                currentSettings.backgrounds[type].poster = posterURL;
                console.log(`Generated poster frame for ${type} video`);
            }
        }, 'image/jpeg', 0.7);
    };
    
    video.src = URL.createObjectURL(videoFile);
}

// Handle live wallpaper uploads specifically
function handleLiveWallpaperUpload(event, type) {
    handleBackgroundUpload(event, type); // Use the same handler since it now supports both
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showNotification('Please select a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            showNotification('Image file is too large. Please select an image under 5MB.', 'error');
            return;
        }
        
        // Generate unique filename to avoid conflicts
        const timestamp = new Date().getTime();
        const extension = file.name.split('.').pop();
        const newFileName = `custom_avatar_${timestamp}.${extension}`;
        const avatarPath = `pfp/${newFileName}`;
        
        // Create object URL for immediate preview
        const objectURL = URL.createObjectURL(file);
        
        // Update avatar immediately for preview
        currentSettings.personality.avatar = avatarPath;
        currentSettings.personality.customAvatarFile = {
            name: newFileName,
            objectURL: objectURL,
            originalName: file.name
        };
        
        updateAvatarSelection();
        
        // Show success message with instructions
        showNotification(
            `Avatar uploaded successfully! Note: To use this avatar across sessions, copy the image to the 'pfp' folder as '${newFileName}'`, 
            'success',
            8000 // Show for 8 seconds since it's important info
        );
        
        markAsChanged();
    }
}

function handleSettingsImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedSettings = JSON.parse(e.target.result);
                currentSettings = { ...DEFAULT_SETTINGS, ...importedSettings };
                populateInterface();
                applySettings();
                markAsChanged();
                showNotification('Settings imported successfully!', 'success');
            } catch (error) {
                console.error('Error importing settings:', error);
                showNotification('Error importing settings file', 'error');
            }
        };
        reader.readAsText(file);
    }
}

function exportCustomizations() {
    const dataStr = JSON.stringify(currentSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `remi-customizations-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Settings exported successfully!', 'success');
}

// ===== UI UPDATES =====

function populateInterface() {
    populateThemeSelection();
    populateColorInputs();
    populateTopbarPresets();
    populatePersonalityInputs();
    populateMobileOptimizations();
    // Only call these if the elements exist
    if (document.querySelector('.preference-item')) {
        populatePreferences();
    }
    updateBackgroundPreviews();
    // Only call this if overlay controls exist
    if (document.getElementById('backgroundDarkness')) {
        populateOverlayControls();
    }
}

function populateThemeSelection() {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.toggle('active', option.dataset.theme === currentSettings.theme);
    });
}

function populateColorInputs() {
    Object.entries(currentSettings.colors).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) {
            input.value = value;
            const valueDisplay = input.nextElementSibling;
            if (valueDisplay && valueDisplay.classList.contains('color-value')) {
                valueDisplay.textContent = value;
            }
        }
    });
}

function populateTopbarPresets() {
    const currentPreset = currentSettings.topbar?.preset || 'modern';
    const currentName = currentSettings.topbar?.name || 'Glass Blue';
    
    // Find the current preset index by matching the name
    let currentIndex = 0;
    if (currentSettings.topbar?.name) {
        // Try to find the index by matching the preset name
        const presetMap = {
            'Glass Blue': { preset: 'modern', index: 0 },
            'Glass Purple': { preset: 'modern', index: 1 },
            'Glass White': { preset: 'modern', index: 2 },
            'Clean White': { preset: 'solid', index: 0 },
            'Light Gray': { preset: 'solid', index: 1 },
            'Soft Blue': { preset: 'solid', index: 2 },
            'Ocean Wave': { preset: 'gradient', index: 0 },
            'Sunset Glow': { preset: 'gradient', index: 1 },
            'Purple Dream': { preset: 'gradient', index: 2 },
            'Forest Green': { preset: 'gradient', index: 3 },
            'Light Minimal': { preset: 'minimal', index: 0 },
            'Warm Minimal': { preset: 'minimal', index: 1 },
            'Cool Minimal': { preset: 'minimal', index: 2 },
            'Pure Dark': { preset: 'dark', index: 0 },
            'Dark Blue': { preset: 'dark', index: 1 },
            'Dark Purple': { preset: 'dark', index: 2 },
            'Cyan Neon': { preset: 'neon', index: 0 },
            'Green Neon': { preset: 'neon', index: 1 },
            'Purple Neon': { preset: 'neon', index: 2 }
        };
        
        if (presetMap[currentName]) {
            currentIndex = presetMap[currentName].index;
        }
    }
    
    updateTopbarPresetSelection(currentPreset, currentIndex);
    // Apply the current topbar styles
    applyTopbarStyles();
}

function populatePersonalityInputs() {
    // Communication style
    const styleRadio = document.querySelector(`input[name="communicationStyle"][value="${currentSettings.personality.communicationStyle}"]`);
    if (styleRadio) {
        styleRadio.checked = true;
    }
    
    // Relationship level - only update if element exists
    const relationshipLevel = document.getElementById('relationshipLevel');
    if (relationshipLevel) {
        relationshipLevel.value = currentSettings.personality.relationshipLevel;
    }
    
    // Name - only update if element exists
    const remiName = document.getElementById('remiName');
    if (remiName) {
        remiName.value = currentSettings.personality.name;
    }
}

function populateMobileOptimizations() {
    // Ensure mobile settings exist with defaults
    if (!currentSettings.backgrounds.mobile) {
        currentSettings.backgrounds.mobile = {
            optimizeForMobile: true,
            reduceMotion: false,
            chatOptimization: true,
            mainOptimization: true
        };
    }
    
    // Populate mobile optimization checkboxes
    const chatOptimizeForMobile = document.getElementById('chatOptimizeForMobile');
    if (chatOptimizeForMobile) {
        chatOptimizeForMobile.checked = currentSettings.backgrounds.mobile.chatOptimization || true;
    }

    const mainOptimizeForMobile = document.getElementById('mainOptimizeForMobile');
    if (mainOptimizeForMobile) {
        mainOptimizeForMobile.checked = currentSettings.backgrounds.mobile.mainOptimization || true;
    }

    const chatReduceMotion = document.getElementById('chatReduceMotion');
    if (chatReduceMotion) {
        chatReduceMotion.checked = currentSettings.backgrounds.mobile.reduceMotion || false;
    }

    const mainReduceMotion = document.getElementById('mainReduceMotion');
    if (mainReduceMotion) {
        mainReduceMotion.checked = currentSettings.backgrounds.mobile.reduceMotion || false;
    }
}

function populatePreferences() {
    Object.entries(currentSettings.preferences).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) {
            input.checked = value;
        }
    });
}

function updateBackgroundPreviews() {
    updateBackgroundPreview('chat');
    updateBackgroundPreview('main');
}

function updateThemeSelection() {
    console.log('Updating theme selection for:', currentSettings.theme); // Debug log
    document.querySelectorAll('.theme-option').forEach(option => {
        const isActive = option.dataset.theme === currentSettings.theme;
        option.classList.toggle('active', isActive);
        console.log(`Theme option ${option.dataset.theme}: ${isActive ? 'active' : 'inactive'}`); // Debug log
    });
    applyTheme();
}

function updatePresetSelection(preset) {
    document.querySelectorAll('.preset-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.preset === preset);
    });
}

function updateAvatarSelection() {
    document.querySelectorAll('.avatar-preset').forEach(preset => {
        preset.classList.toggle('selected', preset.dataset.avatar === currentSettings.personality.avatar);
    });
    applyPersonality();
}

function updatePreview() {
    applyPersonality();
    updateThemeSelection();
    updateTopbarPresetSelection(currentSettings.topbar?.preset || 'modern');
}

// ===== ACTION FUNCTIONS =====

function saveCustomization() {
    saveSettings();
    applySettings();
}

function resetToDefaults() {
    if (confirm('Are you sure you want to reset all customizations to default values?')) {
        currentSettings = { ...DEFAULT_SETTINGS };
        populateInterface();
        applySettings();
        saveSettings();
        markAsSaved();
        showNotification('Settings reset to defaults and saved!', 'success');
    }
}

function exportSettings() {
    try {
        const settingsBlob = new Blob([JSON.stringify(currentSettings, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(settingsBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'remi-customization.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Settings exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting settings:', error);
        showNotification('Error exporting settings', 'error');
    }
}

function importSettings() {
    document.getElementById('importInput').click();
}

// ===== NOTIFICATION SYSTEM =====

function showNotification(message, type = 'info', duration = 5000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-hide after specified duration
    setTimeout(() => {
        closeNotification(notification);
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

function closeNotification(buttonOrNotification) {
    let notification;
    if (buttonOrNotification.classList.contains('notification')) {
        notification = buttonOrNotification;
    } else {
        notification = buttonOrNotification.closest('.notification');
    }
    
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// ===== MANUAL SAVE FUNCTIONALITY =====

// Auto-save functionality removed - users must manually save changes via the save button
// This ensures users have full control over when their settings are persisted

// ===== CLEANUP AND UTILITY FUNCTIONS =====

// Clean up object URLs when page unloads to prevent memory leaks
window.addEventListener('beforeunload', function() {
    // Clean up avatar object URL
    if (currentSettings.personality.customAvatarFile && 
        currentSettings.personality.customAvatarFile.objectURL) {
        URL.revokeObjectURL(currentSettings.personality.customAvatarFile.objectURL);
    }
    
    // Clean up background object URLs
    Object.keys(currentSettings.backgrounds).forEach(bgType => {
        const bg = currentSettings.backgrounds[bgType];
        if (bg && bg.objectURL) {
            URL.revokeObjectURL(bg.objectURL);
        }
    });
});

// Function to validate if a custom avatar file exists
function validateCustomAvatar(avatarPath) {
    return new Promise((resolve) => {
        if (!avatarPath.includes('custom_avatar_')) {
            resolve(true); // Not a custom avatar, assume it exists
            return;
        }
        
        const testImage = new Image();
        testImage.onload = () => resolve(true);
        testImage.onerror = () => resolve(false);
        testImage.src = avatarPath;
    });
}

// Function to create a downloadable avatar guide
function showAvatarGuide() {
    const guide = `
# Custom Avatar Setup Guide

To use your custom avatar across all sessions:

1. Copy your uploaded image file to the 'pfp' folder in your Remi directory
2. Rename it to match the filename shown in the success message
3. The avatar will then persist across browser sessions

## Supported formats:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## File size limit: 5MB
## Recommended size: 200x200 pixels or higher

Your current custom avatar: ${currentSettings.personality.customAvatarFile ? currentSettings.personality.customAvatarFile.name : 'None'}
    `.trim();
    
    // Create and download the guide
    const blob = new Blob([guide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'remi_avatar_guide.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Avatar setup guide downloaded!', 'info');
}

// Cleanup old localStorage chunks to free space for other data
async function cleanupOldLocalStorageChunks() {
    try {
        const chunkKeys = [];
        const backgroundKeys = [];
        
        // Find all chunk-related keys
        for (let key in localStorage) {
            if (key.includes('_chunk_') || key.includes('_chunks')) {
                chunkKeys.push(key);
            }
            if (key.startsWith('remiBackground_') && !key.includes('_chunk')) {
                backgroundKeys.push(key);
            }
        }
        
        // Remove all chunks since we're using IndexedDB now
        chunkKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`Failed to remove chunk key ${key}:`, error);
            }
        });
        
        // Remove old direct background storage too
        backgroundKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`Failed to remove background key ${key}:`, error);
            }
        });
        
        if (chunkKeys.length > 0 || backgroundKeys.length > 0) {
            console.log(`Cleaned up ${chunkKeys.length} chunk keys and ${backgroundKeys.length} background keys from localStorage`);
        }
        
        return true;
    } catch (error) {
        console.error('Error cleaning up localStorage chunks:', error);
        return false;
    }
}

// Add a storage management function that users can call
async function clearOldBackgrounds() {
    try {
        const confirmed = confirm('This will remove all saved backgrounds to free up storage space. You will need to re-upload your custom backgrounds. Continue?');
        
        if (!confirmed) {
            return;
        }
        
        let removedCount = 0;
        const keysToRemove = [];
        
        // Find all background-related keys in localStorage
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                if (key.startsWith('remiBackground_') || key.includes('_chunk_') || key.includes('_chunks')) {
                    keysToRemove.push(key);
                }
            }
        }
        
        // Remove all background-related keys from localStorage
        for (const key of keysToRemove) {
            try {
                localStorage.removeItem(key);
                removedCount++;
            } catch (error) {
                console.warn(`Failed to remove ${key}:`, error);
            }
        }
        
        // Clear IndexedDB storage
        const indexedCleared = await largeFileStorage.clear();
        if (indexedCleared) {
            console.log('Cleared IndexedDB background storage');
        }
        
        // Clear backgrounds from current settings
        Object.keys(currentSettings.backgrounds).forEach(bgType => {
            if (currentSettings.backgrounds[bgType]) {
                const bg = currentSettings.backgrounds[bgType];
                if (bg.objectURL) {
                    URL.revokeObjectURL(bg.objectURL);
                }
                currentSettings.backgrounds[bgType] = null;
            }
        });
        
        // Update UI
        populateInterface();
        
        // Save cleared settings
        await saveSettingsEnhanced();
        
        // Get storage info for user feedback
        const indexedInfo = await largeFileStorage.getStorageInfo();
        
        showNotification(`Storage cleared! Removed ${removedCount} localStorage items and ${indexedInfo.count} IndexedDB items. You can now upload new backgrounds.`, 'success');
        
    } catch (error) {
        console.error('Error clearing storage:', error);
        showNotification('Error clearing storage: ' + error.message, 'error');
    }
}

// Make the function globally accessible for console use
window.clearOldBackgrounds = clearOldBackgrounds;

// ===== PURCHASED ITEMS LOADING =====

function loadPurchasedColorPresets() {
    const presetGrid = document.querySelector('.preset-colors .preset-grid');
    if (!presetGrid) return;
    
    // Get purchased items from localStorage
    const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems') || '{}');
    const colorPresets = purchasedItems.colorPresets || [];
    
    // Define available color presets with their properties
    const availablePresets = {
        lavender: {
            name: 'Lavender Dream',
            colors: ['#B37FEB', '#50C9C3', '#FAF7FF']
        },
        ocean: {
            name: 'Deep Ocean',
            colors: ['#0EA5E9', '#06B6D4', '#F0F9FF']
        },
        rose: {
            name: 'Rose Garden',
            colors: ['#F472B6', '#EC4899', '#FDF2F8']
        },
        mint: {
            name: 'Fresh Mint',
            colors: ['#34D399', '#10B981', '#ECFDF5']
        },
        cosmic: {
            name: 'Cosmic Purple',
            colors: ['#6366F1', '#8B5CF6', '#F9FAFB']
        },
        amber: {
            name: 'Golden Amber',
            colors: ['#F59E0B', '#D97706', '#FFFBEB']
        },
        coral: {
            name: 'Coral Reef',
            colors: ['#FF7F7F', '#FF6B6B', '#FFF5F5']
        },
        emerald: {
            name: 'Emerald Forest',
            colors: ['#10B981', '#059669', '#F0FDF4']
        },
        crimson: {
            name: 'Crimson Fire',
            colors: ['#DC2626', '#B91C1C', '#FEF2F2']
        },
        neon: {
            name: 'Neon Nights',
            colors: ['#8B5CF6', '#06B6D4', '#F3F4F6']
        },
        royal: {
            name: 'Royal Purple',
            colors: ['#7C3AED', '#5B21B6', '#FAF5FF']
        },
        sapphire: {
            name: 'Sapphire Blue',
            colors: ['#1E40AF', '#1E3A8A', '#EFF6FF']
        },
        gold: {
            name: 'Golden Luxury',
            colors: ['#F59E0B', '#D97706', '#FFFBEB']
        },
        midnight: {
            name: 'Midnight Sky',
            colors: ['#191970', '#483D8B', '#F8F8FF']
        },
        cherry: {
            name: 'Cherry Blossom',
            colors: ['#FF69B4', '#FF1493', '#FFF0F5']
        }
    };
    
    // Add purchased presets to the grid
    colorPresets.forEach(presetId => {
        if (availablePresets[presetId]) {
            const preset = availablePresets[presetId];
            const presetElement = createColorPresetElement(presetId, preset);
            presetGrid.appendChild(presetElement);
        }
    });
}

function createColorPresetElement(presetId, preset) {
    const presetElement = document.createElement('div');
    presetElement.className = 'preset-option';
    presetElement.setAttribute('data-preset', presetId);
    
    presetElement.innerHTML = `
        <div class="preset-colors-preview">
            ${preset.colors.map(color => `<span style="background: ${color};"></span>`).join('')}
        </div>
        <p>${preset.name}</p>
        <span class="preset-badge purchased">Purchased</span>
    `;
    
    // Add click handler
    presetElement.addEventListener('click', () => {
        applyColorPreset(presetId);
        // Update active state
        document.querySelectorAll('.preset-option').forEach(el => el.classList.remove('active'));
        presetElement.classList.add('active');
    });
    
    return presetElement;
}

function loadPurchasedTopbarThemes() {
    const topbarPresets = document.querySelector('.topbar-presets');
    if (!topbarPresets) return;
    
    // Get unlocked items from coin system
    if (!window.coinSystem) return;
    
    const unlockedItems = JSON.parse(localStorage.getItem('unlockedItems') || '{}');
    const premiumTopbarStyles = unlockedItems.topbarStyles?.premium || [];
    
    // Define available topbar themes organized by category
    const availableThemes = {
        modern: {
            'Glass Purple': {
                name: 'Glass Purple',
                preview: 'rgba(170, 121, 249, 0.15)',
                border: 'rgba(170, 121, 249, 0.3)',
                textColor: '#6B46C1'
            },
            'Glass White': {
                name: 'Glass White',
                preview: 'rgba(255, 255, 255, 0.1)',
                border: 'rgba(255, 255, 255, 0.2)',
                textColor: '#333333'
            }
        },
        solid: {
            'Light Gray': {
                name: 'Light Gray',
                preview: '#F8F9FA',
                border: 'rgba(0, 0, 0, 0.1)',
                textColor: '#495057'
            },
            'Soft Blue': {
                name: 'Soft Blue',
                preview: '#EEF8FF',
                border: 'rgba(103, 197, 255, 0.2)',
                textColor: '#125E8E'
            }
        },
        gradient: {
            'Royal Purple': {
                name: 'Royal Purple',
                preview: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                textColor: '#ffffff'
            },
            'Sunset': {
                name: 'Sunset',
                preview: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                textColor: '#ffffff'
            }
        },
        dark: {
            'Carbon Dark': {
                name: 'Carbon Dark',
                preview: '#1a1a1a',
                border: 'rgba(255, 255, 255, 0.1)',
                textColor: '#ffffff'
            },
            'Midnight': {
                name: 'Midnight',
                preview: '#0f0f23',
                border: 'rgba(255, 255, 255, 0.1)',
                textColor: '#ffffff'
            }
        }
    };
    
    // Add purchased themes to their respective categories
    premiumTopbarStyles.forEach(themeId => {
        for (const [category, themes] of Object.entries(availableThemes)) {
            if (themes[themeId]) {
                addPurchasedTopbarTheme(category, themeId, themes[themeId]);
                break;
            }
        }
    });
}

function addPurchasedTopbarTheme(category, themeId, theme) {
    // Find the category section
    const categorySection = document.querySelector(`[data-category="${category}"]`);
    if (!categorySection) {
        // Create new category section if it doesn't exist
        createTopbarCategorySection(category, themeId, theme);
        return;
    }
    
    const grid = categorySection.querySelector('.topbar-preset-grid');
    if (grid) {
        const themeElement = createTopbarThemeElement(category, themeId, theme);
        grid.appendChild(themeElement);
    }
}

function createTopbarCategorySection(category, themeId, theme) {
    const topbarPresets = document.querySelector('.topbar-presets');
    
    const categorySection = document.createElement('div');
    categorySection.className = 'preset-category';
    categorySection.setAttribute('data-category', category);
    
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    categorySection.innerHTML = `
        <h4>${categoryName} (Purchased)</h4>
        <div class="topbar-preset-grid">
        </div>
    `;
    
    const themeElement = createTopbarThemeElement(category, themeId, theme);
    categorySection.querySelector('.topbar-preset-grid').appendChild(themeElement);
    
    topbarPresets.appendChild(categorySection);
}

function createTopbarThemeElement(category, themeId, theme) {
    const themeElement = document.createElement('div');
    themeElement.className = 'topbar-preset-option';
    themeElement.setAttribute('data-topbar-preset', category);
    themeElement.setAttribute('data-theme-id', themeId);
    
    themeElement.innerHTML = `
        <div class="topbar-preview ${category}-${themeId.toLowerCase().replace(/\s+/g, '-')}">
            <div class="preview-topbar-bg" style="background: ${theme.preview}; ${theme.border ? `border: 1px solid ${theme.border};` : ''}"></div>
            <div class="preview-topbar-nav">
                <div class="preview-nav-item" style="color: ${theme.textColor};"></div>
                <div class="preview-nav-item" style="color: ${theme.textColor};"></div>
            </div>
        </div>
        <p>${theme.name}</p>
        <span class="preset-badge purchased">Purchased</span>
    `;
    
    // Add click handler
    themeElement.addEventListener('click', () => {
        applyTopbarTheme(category, themeId);
        // Update active state
        document.querySelectorAll('.topbar-preset-option').forEach(el => el.classList.remove('active'));
        themeElement.classList.add('active');
    });
    
    return themeElement;
}

// ===== COIN SYSTEM INTEGRATION =====

function initializeCoinSystemIntegration() {
    if (!window.coinSystem) {
        console.log('Coin system not available, retrying in 200ms...');
        setTimeout(initializeCoinSystemIntegration, 200);
        return;
    }
    
    console.log('Initializing coin system integration for customization...');
    
    // Add data attributes to all preset buttons for coin system
    addDataAttributesToPresets();
    
    // Initialize coin system checking
    window.coinSystem.checkUnlocks();
    
    // Listen for purchase events to update UI
    document.addEventListener('coinSystemPurchase', (e) => {
        if (e.detail.category === 'colorPresets') {
            window.coinSystem.updateColorPresetUI();
        } else if (e.detail.category === 'topbarStyles') {
            window.coinSystem.updateTopbarStyleUI();
        }
    });
    
    console.log('Coin system integration initialized');
}

function addDataAttributesToPresets() {
    // Add data-preset attributes to color preset buttons
    document.querySelectorAll('.preset-option').forEach(button => {
        const presetName = button.dataset.preset;
        if (!presetName) {
            // Try to infer from text content or other attributes
            const textContent = button.textContent?.toLowerCase().replace(/\s+/g, '');
            if (textContent) {
                button.dataset.preset = textContent;
            }
        }
    });
    
    // Add data attributes to topbar style buttons
    document.querySelectorAll('.topbar-preset-option').forEach(button => {
        const topbarPreset = button.dataset.topbarPreset;
        const styleName = button.textContent?.trim();
        
        if (topbarPreset && styleName) {
            button.dataset.topbarType = topbarPreset;
            button.dataset.topbarStyle = styleName;
        }
    });
}

// ===== INITIALIZATION =====

// Initialize the customization system
document.addEventListener('DOMContentLoaded', function() {
    console.log('Remi Customization System Loading...');
    
    // Load purchased items
    loadPurchasedColorPresets();
    loadPurchasedTopbarThemes();
    
    // Initialize other systems
    if (typeof initializeCoinSystemIntegration === 'function') {
        initializeCoinSystemIntegration();
    }
    
    console.log('Remi Customization System Loaded');
});

// ===== ENHANCED SHOP INTEGRATION =====

// Initialize shop functionality
function initializeShopIntegration() {
    setupShopCategories();
    loadShopItems();
    updateCoinsDisplay();
}

function setupShopCategories() {
    const shopTabs = document.querySelectorAll('.shop-tab');
    const categoryContents = document.querySelectorAll('.shop-category-content');
    
    shopTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Update active tab
            shopTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide category content
            categoryContents.forEach(content => {
                content.style.display = 'none';
            });
            
            const targetContent = document.getElementById(`${category}-shop`);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });
}

function loadShopItems() {
    loadColorPresetsShop();
    loadTopbarStylesShop();
}

function loadColorPresetsShop() {
    const container = document.querySelector('#color-presets-shop .shop-items-grid');
    if (!container) return;
    
    const colorPresets = [
        // FREE PRESETS
        {
            id: 'default',
            name: 'Ocean Breeze',
            description: 'Default theme with calming blue tones',
            price: 0,
            colors: ['#67C5FF', '#AA79F9', '#EEF8FF'],
            preview: 'linear-gradient(135deg, #67C5FF, #AA79F9)'
        },
        {
            id: 'sunset',
            name: 'Warm Sunset',
            description: 'Cozy reds and teals for relaxation',
            price: 0,
            colors: ['#FF6B6B', '#4ECDC4', '#FFF5E1'],
            preview: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)'
        },
        {
            id: 'forest',
            name: 'Fresh Forest',
            description: 'Natural greens and blues for focus',
            price: 0,
            colors: ['#52C41A', '#1890FF', '#F6FFED'],
            preview: 'linear-gradient(135deg, #52C41A, #1890FF)'
        },
        
        // PREMIUM PRESETS
        {
            id: 'lavender',
            name: 'Lavender Dream',
            description: 'Soft purple tones with calming effects',
            price: 100,
            colors: ['#B37FEB', '#50C9C3', '#FAF7FF'],
            preview: 'linear-gradient(135deg, #B37FEB, #50C9C3)'
        },
        {
            id: 'ocean',
            name: 'Deep Ocean',
            description: 'Rich blues inspired by ocean depths',
            price: 120,
            colors: ['#0B7285', '#15AABF', '#E0F7FA'],
            preview: 'linear-gradient(135deg, #0B7285, #15AABF)'
        },
        {
            id: 'rose',
            name: 'Rose Garden',
            description: 'Elegant pink and coral combination',
            price: 150,
            colors: ['#F06292', '#EC407A', '#FCE4EC'],
            preview: 'linear-gradient(135deg, #F06292, #EC407A)'
        },
        {
            id: 'cosmic',
            name: 'Cosmic Purple',
            description: 'Deep space vibes with stellar effects',
            price: 200,
            colors: ['#6A1B9A', '#AB47BC', '#F3E5F5'],
            preview: 'linear-gradient(135deg, #6A1B9A, #AB47BC)'
        },
        {
            id: 'emerald',
            name: 'Emerald Forest',
            description: 'Rich greens with natural harmony',
            price: 180,
            colors: ['#00695C', '#26A69A', '#E0F2F1'],
            preview: 'linear-gradient(135deg, #00695C, #26A69A)'
        },
        {
            id: 'gold',
            name: 'Golden Sunset',
            description: 'Luxurious gold and amber tones',
            price: 350,
            colors: ['#FFB300', '#FF8F00', '#FFF8E1'],
            preview: 'linear-gradient(135deg, #FFB300, #FF8F00)'
        },
        {
            id: 'crimson',
            name: 'Crimson Fire',
            description: 'Bold red and orange energy',
            price: 220,
            colors: ['#D32F2F', '#FF5722', '#FFEBEE'],
            preview: 'linear-gradient(135deg, #D32F2F, #FF5722)'
        },
        {
            id: 'sapphire',
            name: 'Sapphire Ocean',
            description: 'Deep blue luxury and elegance',
            price: 280,
            colors: ['#1565C0', '#0277BD', '#E3F2FD'],
            preview: 'linear-gradient(135deg, #1565C0, #0277BD)'
        },
        {
            id: 'mint',
            name: 'Fresh Mint',
            description: 'Cool mint greens for productivity',
            price: 100,
            colors: ['#00BCD4', '#4DD0E1', '#E0F7FA'],
            preview: 'linear-gradient(135deg, #00BCD4, #4DD0E1)'
        },
        {
            id: 'amber',
            name: 'Amber Glow',
            description: 'Warm amber and yellow tones',
            price: 130,
            colors: ['#FF8F00', '#FFC107', '#FFFDE7'],
            preview: 'linear-gradient(135deg, #FF8F00, #FFC107)'
        },
        {
            id: 'coral',
            name: 'Coral Reef',
            description: 'Vibrant coral and pink paradise',
            price: 140,
            colors: ['#FF7043', '#FF5722', '#FFF3E0'],
            preview: 'linear-gradient(135deg, #FF7043, #FF5722)'
        },
        {
            id: 'neon',
            name: 'Neon Future',
            description: 'Electric neon colors for night owls',
            price: 250,
            colors: ['#E91E63', '#9C27B0', '#F3E5F5'],
            preview: 'linear-gradient(135deg, #E91E63, #9C27B0)'
        },
        {
            id: 'royal',
            name: 'Royal Purple',
            description: 'Majestic purple and gold combination',
            price: 300,
            colors: ['#673AB7', '#3F51B5', '#EDE7F6'],
            preview: 'linear-gradient(135deg, #673AB7, #3F51B5)'
        },
        {
            id: 'cyberpunk',
            name: 'Cyberpunk',
            description: 'Futuristic neon cyan and magenta',
            price: 320,
            colors: ['#00FFFF', '#FF00FF', '#0D1117'],
            preview: 'linear-gradient(135deg, #00FFFF, #FF00FF)'
        },
        {
            id: 'cherry',
            name: 'Cherry Blossom',
            description: 'Delicate pink and white harmony',
            price: 160,
            colors: ['#E91E63', '#F8BBD9', '#FCE4EC'],
            preview: 'linear-gradient(135deg, #E91E63, #F8BBD9)'
        },
        {
            id: 'galaxy',
            name: 'Galaxy Explorer',
            description: 'Deep space blues and purples',
            price: 240,
            colors: ['#3F51B5', '#9C27B0', '#E8EAF6'],
            preview: 'linear-gradient(135deg, #3F51B5, #9C27B0)'
        },
        {
            id: 'tropical',
            name: 'Tropical Paradise',
            description: 'Vibrant greens and blues of the tropics',
            price: 170,
            colors: ['#4CAF50', '#00BCD4', '#E8F5E8'],
            preview: 'linear-gradient(135deg, #4CAF50, #00BCD4)'
        },
        {
            id: 'volcano',
            name: 'Volcano',
            description: 'Hot reds and oranges like molten lava',
            price: 200,
            colors: ['#FF3D00', '#FF6D00', '#FFF3E0'],
            preview: 'linear-gradient(135deg, #FF3D00, #FF6D00)'
        },
        {
            id: 'midnight',
            name: 'Midnight Sky',
            description: 'Dark blues with silver accents',
            price: 190,
            colors: ['#1A237E', '#303F9F', '#E8EAF6'],
            preview: 'linear-gradient(135deg, #1A237E, #303F9F)'
        },
        {
            id: 'aurora',
            name: 'Aurora Borealis',
            description: 'Magical northern lights colors',
            price: 260,
            colors: ['#4CAF50', '#2196F3', '#E1F5FE'],
            preview: 'linear-gradient(135deg, #4CAF50, #2196F3)'
        },
        {
            id: 'sunset_beach',
            name: 'Sunset Beach',
            description: 'Warm beach sunset vibes',
            price: 150,
            colors: ['#FF7043', '#FFC107', '#FFF8E1'],
            preview: 'linear-gradient(135deg, #FF7043, #FFC107)'
        },
        {
            id: 'mystic',
            name: 'Mystic Forest',
            description: 'Mysterious deep greens and purples',
            price: 210,
            colors: ['#388E3C', '#7B1FA2', '#F3E5F5'],
            preview: 'linear-gradient(135deg, #388E3C, #7B1FA2)'
        },
        {
            id: 'ice',
            name: 'Ice Crystal',
            description: 'Cool blues and whites like ice',
            price: 130,
            colors: ['#81D4FA', '#B3E5FC', '#F1F8E9'],
            preview: 'linear-gradient(135deg, #81D4FA, #B3E5FC)'
        },
        {
            id: 'bronze',
            name: 'Bronze Age',
            description: 'Warm bronze and copper tones',
            price: 140,
            colors: ['#8D6E63', '#A1887F', '#EFEBE9'],
            preview: 'linear-gradient(135deg, #8D6E63, #A1887F)'
        }
    ];
    
    container.innerHTML = '';
    
    colorPresets.forEach(preset => {
        const isOwned = window.coinSystem ? window.coinSystem.hasUnlocked('colorPresets', preset.id) : false;
        const userCoins = window.coinSystem ? window.coinSystem.getCoins() : 0;
        const canAfford = userCoins >= preset.price;
        
        const shopItem = document.createElement('div');
        shopItem.className = `shop-item ${isOwned ? 'owned' : ''}`;
        shopItem.innerHTML = `
            <div class="shop-item-preview" style="background: ${preset.preview};">
                <div class="color-preview-dots">
                    ${preset.colors.map(color => `<div class="color-dot" style="background: ${color}"></div>`).join('')}
                </div>
            </div>
            <div class="shop-item-info">
                <h4>${preset.name}</h4>
                <p>${preset.description}</p>
                <div class="shop-item-price">
                    <div class="price-display">
                        <i class="fas fa-coins"></i>
                        <span>${preset.price}</span>
                    </div>
                    ${isOwned || preset.price === 0 ? 
                        `<button class="shop-buy-btn" onclick="applyColorPreset('${preset.id}')" style="background: #10B981;">
                            <i class="fas fa-check"></i> ${preset.price === 0 ? 'Apply (Free)' : 'Apply'}
                        </button>` :
                        `<button class="shop-buy-btn ${!canAfford ? 'disabled' : ''}" 
                            onclick="purchaseShopItem('colorPresets', '${preset.id}', ${preset.price})"
                            ${!canAfford ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> Buy
                        </button>`
                    }
                </div>
            </div>
        `;
        container.appendChild(shopItem);
    });
}

function loadTopbarStylesShop() {
    const container = document.querySelector('#topbar-styles-shop .shop-items-grid');
    if (!container) return;
    
    const topbarStyles = [
        // FREE STYLES
        {
            id: 'modern-glass-blue',
            name: 'Glass Blue',
            description: 'Modern glass effect with blue accent (Free)',
            price: 0,
            preview: 'linear-gradient(135deg, rgba(103, 197, 255, 0.15), rgba(170, 121, 249, 0.15))',
            border: '1px solid rgba(103, 197, 255, 0.3)'
        },
        
        // PREMIUM STYLES
        {
            id: 'modern-glass-purple',
            name: 'Glass Purple',
            description: 'Modern glass effect with purple accent',
            price: 120,
            preview: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(139, 92, 246, 0.15))',
            border: '1px solid rgba(168, 85, 247, 0.3)'
        },
        {
            id: 'solid-dark',
            name: 'Solid Dark',
            description: 'Clean dark theme with high contrast',
            price: 80,
            preview: '#2D3748',
            border: 'none'
        },
        {
            id: 'gradient-sunset',
            name: 'Sunset Gradient',
            description: 'Beautiful sunset gradient effect',
            price: 150,
            preview: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
            border: 'none'
        },
        {
            id: 'neon-cyber',
            name: 'Neon Cyber',
            description: 'Futuristic neon styling',
            price: 250,
            preview: 'linear-gradient(135deg, #00F5FF, #FF1493)',
            border: '1px solid #00F5FF'
        },
        {
            id: 'glass-emerald',
            name: 'Glass Emerald',
            description: 'Elegant emerald glass effect',
            price: 140,
            preview: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))',
            border: '1px solid rgba(16, 185, 129, 0.3)'
        },
        {
            id: 'gradient-ocean',
            name: 'Ocean Depths',
            description: 'Deep ocean blue gradient',
            price: 130,
            preview: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
            border: 'none'
        },
        {
            id: 'solid-crimson',
            name: 'Crimson Solid',
            description: 'Bold crimson red design',
            price: 110,
            preview: '#DC2626',
            border: 'none'
        },
        {
            id: 'glass-rose',
            name: 'Glass Rose',
            description: 'Romantic rose glass effect',
            price: 160,
            preview: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(236, 72, 153, 0.15))',
            border: '1px solid rgba(244, 63, 94, 0.3)'
        },
        {
            id: 'gradient-cosmic',
            name: 'Cosmic Dream',
            description: 'Space-inspired purple gradient',
            price: 200,
            preview: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
            border: 'none'
        },
        {
            id: 'glass-amber',
            name: 'Glass Amber',
            description: 'Warm amber glass styling',
            price: 120,
            preview: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15))',
            border: '1px solid rgba(245, 158, 11, 0.3)'
        },
        {
            id: 'solid-midnight',
            name: 'Midnight Black',
            description: 'Pure midnight black theme',
            price: 90,
            preview: '#111827',
            border: 'none'
        },
        {
            id: 'gradient-aurora',
            name: 'Aurora Borealis',
            description: 'Northern lights inspired gradient',
            price: 220,
            preview: 'linear-gradient(135deg, #10B981, #3B82F6, #8B5CF6)',
            border: 'none'
        },
        {
            id: 'glass-coral',
            name: 'Glass Coral',
            description: 'Vibrant coral glass effect',
            price: 140,
            preview: 'linear-gradient(135deg, rgba(255, 120, 73, 0.15), rgba(255, 107, 157, 0.15))',
            border: '1px solid rgba(255, 120, 73, 0.3)'
        },
        {
            id: 'metallic-gold',
            name: 'Metallic Gold',
            description: 'Luxurious metallic gold finish',
            price: 300,
            preview: 'linear-gradient(135deg, #FFD700, #FFA500)',
            border: '1px solid #B8860B'
        },
        {
            id: 'gradient-volcano',
            name: 'Volcano Fire',
            description: 'Hot lava gradient effect',
            price: 180,
            preview: 'linear-gradient(135deg, #FF3D00, #FF6D00)',
            border: 'none'
        },
        {
            id: 'glass-ice',
            name: 'Glass Ice',
            description: 'Cool ice crystal effect',
            price: 130,
            preview: 'linear-gradient(135deg, rgba(129, 212, 250, 0.15), rgba(179, 229, 252, 0.15))',
            border: '1px solid rgba(129, 212, 250, 0.3)'
        },
        {
            id: 'solid-forest',
            name: 'Forest Green',
            description: 'Deep forest green solid',
            price: 100,
            preview: '#059669',
            border: 'none'
        },
        {
            id: 'gradient-cherry',
            name: 'Cherry Blossom',
            description: 'Delicate cherry blossom gradient',
            price: 170,
            preview: 'linear-gradient(135deg, #FF69B4, #FFB6C1)',
            border: 'none'
        },
        {
            id: 'metallic-silver',
            name: 'Metallic Silver',
            description: 'Sleek metallic silver finish',
            price: 250,
            preview: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
            border: '1px solid #808080'
        },
        {
            id: 'glass-galaxy',
            name: 'Glass Galaxy',
            description: 'Deep space galaxy effect',
            price: 190,
            preview: 'linear-gradient(135deg, rgba(63, 81, 181, 0.15), rgba(156, 39, 176, 0.15))',
            border: '1px solid rgba(63, 81, 181, 0.3)'
        },
        {
            id: 'gradient-tropical',
            name: 'Tropical Paradise',
            description: 'Vibrant tropical gradient',
            price: 160,
            preview: 'linear-gradient(135deg, #4CAF50, #00BCD4)',
            border: 'none'
        },
        {
            id: 'glass-bronze',
            name: 'Glass Bronze',
            description: 'Warm bronze glass styling',
            price: 140,
            preview: 'linear-gradient(135deg, rgba(141, 110, 99, 0.15), rgba(161, 136, 127, 0.15))',
            border: '1px solid rgba(141, 110, 99, 0.3)'
        },
        {
            id: 'neon-purple',
            name: 'Neon Purple',
            description: 'Electric purple neon effect',
            price: 280,
            preview: 'linear-gradient(135deg, #9333EA, #C084FC)',
            border: '1px solid #9333EA'
        },
        {
            id: 'gradient-mystic',
            name: 'Mystic Forest',
            description: 'Mysterious forest gradient',
            price: 210,
            preview: 'linear-gradient(135deg, #388E3C, #7B1FA2)',
            border: 'none'
        }
    ];
    
    container.innerHTML = '';
    
    topbarStyles.forEach(style => {
        // Use 'premium' as the default category for shop topbar styles
        const styleKey = `premium.${style.id}`;
        const isOwned = window.coinSystem ? window.coinSystem.hasUnlocked('topbarStyles', styleKey) : false;
        const userCoins = window.coinSystem ? window.coinSystem.getCoins() : 0;
        const canAfford = userCoins >= style.price;
        
        const shopItem = document.createElement('div');
        shopItem.className = `shop-item ${isOwned ? 'owned' : ''}`;
        shopItem.innerHTML = `
            <div class="shop-item-preview">
                <div class="topbar-preview-mini" style="background: ${style.preview}; border: ${style.border};">
                    <div class="preview-nav-dots">
                        <div class="nav-dot"></div>
                        <div class="nav-dot"></div>
                        <div class="nav-dot"></div>
                    </div>
                </div>
            </div>
            <div class="shop-item-info">
                <h4>${style.name}</h4>
                <p>${style.description}</p>
                <div class="shop-item-price">
                    <div class="price-display">
                        <i class="fas fa-coins"></i>
                        <span>${style.price}</span>
                    </div>
                    ${isOwned || style.price === 0 ? 
                        `<button class="shop-buy-btn" onclick="applyTopbarStyle('${style.id}')" style="background: #10B981;">
                            <i class="fas fa-check"></i> ${style.price === 0 ? 'Apply (Free)' : 'Apply'}
                        </button>` :
                        `<button class="shop-buy-btn ${!canAfford ? 'disabled' : ''}" 
                            onclick="purchaseShopItem('topbarStyles', '${styleKey}', ${style.price})"
                            ${!canAfford ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> Buy
                        </button>`
                    }
                </div>
            </div>
        `;
        container.appendChild(shopItem);
    });
}

function updateCoinsDisplay() {
    const coinsDisplay = document.getElementById('shopCoinsDisplay');
    if (coinsDisplay && window.coinSystem) {
        coinsDisplay.textContent = window.coinSystem.getCoins();
    }
}

function purchaseShopItem(category, itemId, price) {
    console.log('Purchasing item:', category, itemId, price);
    
    if (!window.coinSystem) {
        showNotification('Coin system not available', 'error');
        return;
    }
    
    const userCoins = window.coinSystem.getCoins();
    if (userCoins < price) {
        showNotification(`Not enough coins! You need ${price - userCoins} more coins.`, 'warning');
        return;
    }
    
    // Make the purchase
    const success = window.coinSystem.purchaseItem(category, itemId, price);
    console.log('Purchase result:', success);
    
    if (success) {
        showNotification(`Successfully purchased! Applied automatically.`, 'success');
        
        // Apply the item immediately
        if (category === 'colorPresets') {
            applyColorPreset(itemId);
        } else if (category === 'topbarStyles') {
            // Extract the actual style ID from premium.styleId format
            const actualStyleId = itemId.includes('.') ? itemId.split('.')[1] : itemId;
            applyTopbarStyle(actualStyleId);
        }
        
        // Refresh the shop display
        loadShopItems();
        updateCoinsDisplay();
        
        // Mark as changed and save
        markAsChanged();
    } else {
        showNotification('Purchase failed. Please try again.', 'error');
    }
}

// ===== ENHANCED TOPBAR CUSTOMIZATION =====

function initializeTopbarCustomization() {
    setupTopbarModeSwitch();
    setupCustomTopbarControls();
    updateTopbarLivePreview();
}

function setupTopbarModeSwitch() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    const modeContents = document.querySelectorAll('.topbar-mode-content');
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            
            // Update active button
            modeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide mode content
            modeContents.forEach(content => {
                content.style.display = 'none';
            });
            
            const targetContent = document.getElementById(`${mode}-mode`);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });
}

function setupCustomTopbarControls() {
    // Background type radio buttons
    const bgTypeRadios = document.querySelectorAll('input[name="topbar-bg-type"]');
    const bgColor2Wrapper = document.getElementById('topbar-bg-color-2-wrapper');
    
    bgTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Show/hide second color for gradient
            if (bgColor2Wrapper) {
                bgColor2Wrapper.style.display = this.value === 'gradient' ? 'block' : 'none';
            }
            updateTopbarLivePreview();
        });
    });
    
    // Color inputs
    const colorInputs = document.querySelectorAll('#custom-mode input[type="color"]');
    colorInputs.forEach(input => {
        input.addEventListener('change', updateTopbarLivePreview);
    });
    
    // Opacity slider
    const opacitySlider = document.getElementById('topbar-opacity');
    const opacityValue = document.getElementById('topbar-opacity-value');
    
    if (opacitySlider && opacityValue) {
        opacitySlider.addEventListener('input', function() {
            opacityValue.textContent = this.value + '%';
            updateTopbarLivePreview();
        });
    }
    
    // Border checkbox
    const borderCheckbox = document.getElementById('topbar-border-enabled');
    const borderColorWrapper = document.getElementById('topbar-border-color-wrapper');
    
    if (borderCheckbox && borderColorWrapper) {
        borderCheckbox.addEventListener('change', function() {
            borderColorWrapper.style.display = this.checked ? 'block' : 'none';
            updateTopbarLivePreview();
        });
    }
    
    // Border color
    const borderColorInput = document.getElementById('topbar-border-color');
    if (borderColorInput) {
        borderColorInput.addEventListener('change', updateTopbarLivePreview);
    }
    
    // Save and reset buttons
    const saveBtn = document.getElementById('save-custom-topbar');
    const resetBtn = document.getElementById('reset-topbar-custom');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCustomTopbar);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTopbarCustom);
    }
}

function updateTopbarLivePreview() {
    const preview = document.getElementById('topbar-live-preview');
    if (!preview) return;
    
    const previewBg = preview.querySelector('.preview-topbar-bg');
    if (!previewBg) return;
    
    // Get current values
    const bgType = document.querySelector('input[name="topbar-bg-type"]:checked')?.value || 'solid';
    const bgColor1 = document.getElementById('topbar-bg-color-1')?.value || '#67C5FF';
    const bgColor2 = document.getElementById('topbar-bg-color-2')?.value || '#AA79F9';
    const opacity = (document.getElementById('topbar-opacity')?.value || 85) / 100;
    const textColor = document.getElementById('topbar-text-color')?.value || '#125E8E';
    const borderEnabled = document.getElementById('topbar-border-enabled')?.checked || false;
    const borderColor = document.getElementById('topbar-border-color')?.value || '#67C5FF';
    
    // Apply background
    let backgroundStyle = '';
    if (bgType === 'solid') {
        const rgb = hexToRgb(bgColor1);
        backgroundStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    } else if (bgType === 'gradient') {
        const rgb1 = hexToRgb(bgColor1);
        const rgb2 = hexToRgb(bgColor2);
        backgroundStyle = `linear-gradient(135deg, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, ${opacity}), rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, ${opacity}))`;
    } else if (bgType === 'glass') {
        const rgb = hexToRgb(bgColor1);
        backgroundStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.6})`;
        previewBg.style.backdropFilter = 'blur(20px)';
    }
    
    previewBg.style.background = backgroundStyle;
    
    // Apply border
    if (borderEnabled) {
        previewBg.style.border = `1px solid ${borderColor}`;
    } else {
        previewBg.style.border = 'none';
    }
    
    // Apply text color
    const navItems = preview.querySelectorAll('.preview-nav-item');
    navItems.forEach(item => {
        item.style.color = textColor;
    });
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function saveCustomTopbar() {
    const bgType = document.querySelector('input[name="topbar-bg-type"]:checked')?.value || 'solid';
    const bgColor1 = document.getElementById('topbar-bg-color-1')?.value || '#67C5FF';
    const bgColor2 = document.getElementById('topbar-bg-color-2')?.value || '#AA79F9';
    const opacity = (document.getElementById('topbar-opacity')?.value || 85) / 100;
    const textColor = document.getElementById('topbar-text-color')?.value || '#125E8E';
    const textColorDark = document.getElementById('topbar-text-color-dark')?.value || '#E5F4FF';
    const borderEnabled = document.getElementById('topbar-border-enabled')?.checked || false;
    const borderColor = document.getElementById('topbar-border-color')?.value || '#67C5FF';
    
    // Create custom topbar settings
    const customTopbar = {
        preset: 'custom',
        name: 'Custom Style',
        style: bgType,
        colors: {
            background: bgType === 'gradient' ? 
                `linear-gradient(135deg, ${bgColor1}, ${bgColor2})` : 
                bgColor1,
            border: borderEnabled ? borderColor : 'transparent',
            text: textColor,
            textDark: textColorDark,
            accent: bgColor1,
            opacity: opacity
        },
        border: borderEnabled,
        bgType: bgType
    };
    
    // Save to settings
    currentSettings.topbar = customTopbar;
    
    // Apply immediately
    applyTopbarStyles();
    
    // Mark as changed
    markAsChanged();
    
    showNotification('Custom topbar style applied!', 'success');
}

function resetTopbarCustom() {
    // Reset to default values
    document.getElementById('topbar-bg-color-1').value = '#67C5FF';
    document.getElementById('topbar-bg-color-2').value = '#AA79F9';
    document.getElementById('topbar-opacity').value = 85;
    document.getElementById('topbar-opacity-value').textContent = '85%';
    document.getElementById('topbar-text-color').value = '#125E8E';
    document.getElementById('topbar-text-color-dark').value = '#E5F4FF';
    document.getElementById('topbar-border-enabled').checked = false;
    document.getElementById('topbar-border-color').value = '#67C5FF';
    
    // Reset radio to solid
    document.querySelector('input[name="topbar-bg-type"][value="solid"]').checked = true;
    
    // Hide gradient color
    const bgColor2Wrapper = document.getElementById('topbar-bg-color-2-wrapper');
    if (bgColor2Wrapper) {
        bgColor2Wrapper.style.display = 'none';
    }
    
    // Update preview
    updateTopbarLivePreview();
    
    showNotification('Topbar customization reset to defaults', 'info');
}

function applyTopbarStyle(styleId) {
    // Free topbar styles that are always available
    const freeTopbarStyles = ['modern-glass-blue'];
    
    // Check if coin system is available and if style is unlocked (skip for free styles)
    const isPremiumStyle = !freeTopbarStyles.includes(styleId);
    const styleKey = isPremiumStyle ? `premium.${styleId}` : styleId;
    
    if (window.coinSystem && isPremiumStyle && !window.coinSystem.hasUnlocked('topbarStyles', styleKey)) {
        // Style is locked - coin system will handle purchase attempt
        return false;
    }
    
    // Define topbar styles
    const topbarStyles = {
        'modern-glass-blue': {
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
        'modern-glass-purple': {
            preset: 'modern',
            name: 'Glass Purple',
            style: 'glass',
            colors: {
                background: 'rgba(168, 85, 247, 0.15)',
                border: 'rgba(168, 85, 247, 0.3)',
                text: '#6B46C1',
                textDark: '#DDD6FE',
                accent: '#A855F7'
            }
        },
        'solid-dark': {
            preset: 'solid',
            name: 'Solid Dark',
            style: 'solid',
            colors: {
                background: '#2D3748',
                border: 'transparent',
                text: '#E2E8F0',
                textDark: '#E2E8F0',
                accent: '#4FD1C7'
            }
        },
        'gradient-sunset': {
            preset: 'gradient',
            name: 'Sunset Gradient',
            style: 'gradient',
            colors: {
                background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
                border: 'transparent',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#FF6B6B'
            }
        },
        'neon-cyber': {
            preset: 'neon',
            name: 'Neon Cyber',
            style: 'neon',
            colors: {
                background: 'linear-gradient(135deg, #00F5FF, #FF1493)',
                border: '1px solid #00F5FF',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#00F5FF'
            }
        },
        'glass-emerald': {
            preset: 'glass',
            name: 'Glass Emerald',
            style: 'glass',
            colors: {
                background: 'rgba(16, 185, 129, 0.15)',
                border: 'rgba(16, 185, 129, 0.3)',
                text: '#047857',
                textDark: '#D1FAE5',
                accent: '#10B981'
            }
        },
        'gradient-ocean': {
            preset: 'gradient',
            name: 'Ocean Depths',
            style: 'gradient',
            colors: {
                background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                border: 'transparent',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#0EA5E9'
            }
        },
        'solid-crimson': {
            preset: 'solid',
            name: 'Crimson Solid',
            style: 'solid',
            colors: {
                background: '#DC2626',
                border: 'transparent',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#FCA5A5'
            }
        },
        'glass-rose': {
            preset: 'glass',
            name: 'Glass Rose',
            style: 'glass',
            colors: {
                background: 'rgba(244, 63, 94, 0.15)',
                border: 'rgba(244, 63, 94, 0.3)',
                text: '#881337',
                textDark: '#FECDD3',
                accent: '#F43F5E'
            }
        },
        'gradient-cosmic': {
            preset: 'gradient',
            name: 'Cosmic Dream',
            style: 'gradient',
            colors: {
                background: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
                border: 'transparent',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#8B5CF6'
            }
        },
        'glass-amber': {
            preset: 'glass',
            name: 'Glass Amber',
            style: 'glass',
            colors: {
                background: 'rgba(245, 158, 11, 0.15)',
                border: 'rgba(245, 158, 11, 0.3)',
                text: '#92400E',
                textDark: '#FEF3C7',
                accent: '#F59E0B'
            }
        },
        'solid-midnight': {
            preset: 'solid',
            name: 'Midnight Black',
            style: 'solid',
            colors: {
                background: '#111827',
                border: 'transparent',
                text: '#F9FAFB',
                textDark: '#F9FAFB',
                accent: '#6B7280'
            }
        },
        'gradient-aurora': {
            preset: 'gradient',
            name: 'Aurora Borealis',
            style: 'gradient',
            colors: {
                background: 'linear-gradient(135deg, #10B981, #3B82F6, #8B5CF6)',
                border: 'transparent',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#10B981'
            }
        },
        'glass-coral': {
            preset: 'glass',
            name: 'Glass Coral',
            style: 'glass',
            colors: {
                background: 'rgba(255, 120, 73, 0.15)',
                border: 'rgba(255, 120, 73, 0.3)',
                text: '#C2410C',
                textDark: '#FFEDD5',
                accent: '#FF7849'
            }
        },
        'metallic-gold': {
            preset: 'metallic',
            name: 'Metallic Gold',
            style: 'metallic',
            colors: {
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                border: '1px solid #B8860B',
                text: '#92400E',
                textDark: '#FFFBEB',
                accent: '#FFD700'
            }
        },
        'gradient-volcano': {
            preset: 'gradient',
            name: 'Volcano Fire',
            style: 'gradient',
            colors: {
                background: 'linear-gradient(135deg, #FF3D00, #FF6D00)',
                border: 'transparent',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#FF3D00'
            }
        },
        'glass-ice': {
            preset: 'glass',
            name: 'Glass Ice',
            style: 'glass',
            colors: {
                background: 'rgba(129, 212, 250, 0.15)',
                border: 'rgba(129, 212, 250, 0.3)',
                text: '#0C4A6E',
                textDark: '#E0F2FE',
                accent: '#81D4FA'
            }
        },
        'solid-forest': {
            preset: 'solid',
            name: 'Forest Green',
            style: 'solid',
            colors: {
                background: '#059669',
                border: 'transparent',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#6EE7B7'
            }
        },
        'gradient-cherry': {
            preset: 'gradient',
            name: 'Cherry Blossom',
            style: 'gradient',
            colors: {
                background: 'linear-gradient(135deg, #FF69B4, #FFB6C1)',
                border: 'transparent',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#FF69B4'
            }
        },
        'metallic-silver': {
            preset: 'metallic',
            name: 'Metallic Silver',
            style: 'metallic',
            colors: {
                background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
                border: '1px solid #808080',
                text: '#374151',
                textDark: '#F9FAFB',
                accent: '#C0C0C0'
            }
        },
        'glass-galaxy': {
            preset: 'glass',
            name: 'Glass Galaxy',
            style: 'glass',
            colors: {
                background: 'rgba(63, 81, 181, 0.15)',
                border: 'rgba(63, 81, 181, 0.3)',
                text: '#283593',
                textDark: '#C5CAE9',
                accent: '#3F51B5'
            }
        },
        'gradient-tropical': {
            preset: 'gradient',
            name: 'Tropical Paradise',
            style: 'gradient',
            colors: {
                background: 'linear-gradient(135deg, #4CAF50, #00BCD4)',
                border: 'transparent',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#4CAF50'
            }
        },
        'glass-bronze': {
            preset: 'glass',
            name: 'Glass Bronze',
            style: 'glass',
            colors: {
                background: 'rgba(141, 110, 99, 0.15)',
                border: 'rgba(141, 110, 99, 0.3)',
                text: '#5D4037',
                textDark: '#D7CCC8',
                accent: '#8D6E63'
            }
        },
        'neon-purple': {
            preset: 'neon',
            name: 'Neon Purple',
            style: 'neon',
            colors: {
                background: 'linear-gradient(135deg, #9333EA, #C084FC)',
                border: '1px solid #9333EA',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#9333EA'
            }
        },
        'gradient-mystic': {
            preset: 'gradient',
            name: 'Mystic Forest',
            style: 'gradient',
            colors: {
                background: 'linear-gradient(135deg, #388E3C, #7B1FA2)',
                border: 'transparent',
                text: '#FFFFFF',
                textDark: '#FFFFFF',
                accent: '#388E3C'
            }
        }
    };
    
    if (topbarStyles[styleId]) {
        currentSettings.topbar = topbarStyles[styleId];
        applyTopbarStyles();
        markAsChanged();
        showNotification(`Applied ${topbarStyles[styleId].name} topbar style!`, 'success');
    }
}

// ===== ENHANCED THEME APPLICATION =====

function applyThemeToAllPages() {
    // Apply to current page
    applyTheme();
    applyColors();
    applyTopbarStyles();
    
    // Store in localStorage for other pages to pick up
    const themeData = {
        theme: currentSettings.theme,
        colors: currentSettings.colors,
        topbar: currentSettings.topbar,
        timestamp: Date.now()
    };
    
    localStorage.setItem('remiThemeSync', JSON.stringify(themeData));
    localStorage.setItem('customizationSettings', JSON.stringify(currentSettings));
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent('remiThemeUpdated', {
        detail: themeData
    }));
    
    // Dispatch event for universal page system
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: {
            settings: currentSettings,
            themeData: themeData
        }
    }));
    
    showNotification('Theme applied to all pages!', 'success');
}

// Listen for theme updates from other pages
window.addEventListener('remiThemeUpdated', function(event) {
    if (event.detail) {
        const { theme, colors, topbar } = event.detail;
        
        // Update current settings if different
        if (JSON.stringify(currentSettings.theme) !== JSON.stringify(theme) ||
            JSON.stringify(currentSettings.colors) !== JSON.stringify(colors) ||
            JSON.stringify(currentSettings.topbar) !== JSON.stringify(topbar)) {
            
            currentSettings.theme = theme;
            currentSettings.colors = colors;
            currentSettings.topbar = topbar;
            
            // Apply without marking as changed (since it came from another page)
            applyTheme();
            applyColors();
            applyTopbarStyles();
            
            // Update interface
            populateInterface();
        }
    }
});

// Initialize all new functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize after a short delay to ensure other systems are loaded
    setTimeout(() => {
        initializeShopIntegration();
        initializeTopbarCustomization();
        
        // Apply theme to all pages on load
        applyThemeToAllPages();
        
        // Backup save button setup in case it wasn't set up properly before
        const saveBtn = document.getElementById('saveCustomizations');
        if (saveBtn && !saveBtn.hasAttribute('data-listener-attached')) {
            console.log('Setting up backup save button listener');
            saveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Backup save button clicked!');
                try {
                    saveSettings();
                    markAsSaved();
                    showNotification('Settings saved successfully!', 'success');
                } catch (error) {
                    console.error('Error saving settings:', error);
                    showNotification('Error saving settings: ' + error.message, 'error');
                }
            });
            saveBtn.setAttribute('data-listener-attached', 'true');
        }
        
        // Backup reset button setup
        const resetBtn = document.getElementById('resetToDefaults');
        if (resetBtn && !resetBtn.hasAttribute('data-listener-attached')) {
            console.log('Setting up backup reset button listener');
            resetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Backup reset button clicked!');
                try {
                    resetToDefaults();
                } catch (error) {
                    console.error('Error resetting to defaults:', error);
                    showNotification('Error resetting settings: ' + error.message, 'error');
                }
            });
            resetBtn.setAttribute('data-listener-attached', 'true');
        }
        
        // Backup export button setup
        const exportBtn = document.getElementById('exportSettings');
        if (exportBtn && !exportBtn.hasAttribute('data-listener-attached')) {
            console.log('Setting up backup export button listener');
            exportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Backup export button clicked!');
                try {
                    exportCustomizations();
                } catch (error) {
                    console.error('Error exporting settings:', error);
                    showNotification('Error exporting settings: ' + error.message, 'error');
                }
            });
            exportBtn.setAttribute('data-listener-attached', 'true');
        }
        
        // Backup import button setup
        const importBtn = document.getElementById('importSettingsBtn');
        if (importBtn && !importBtn.hasAttribute('data-listener-attached')) {
            console.log('Setting up backup import button listener');
            importBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Backup import button clicked!');
                const importInput = document.getElementById('importInput');
                if (importInput) {
                    importInput.click();
                }
            });
            importBtn.setAttribute('data-listener-attached', 'true');
        }
    }, 500);
});

// ===== GLOBAL FUNCTION EXPOSURE =====
// Make functions accessible from HTML onclick handlers
window.selectBackground = selectBackground;
window.removeBackground = removeBackground;
window.removeBackgroundDevice = removeBackgroundDevice;
window.showLockedFeature = showLockedFeature;
window.showNotification = showNotification;
window.purchaseShopItem = purchaseShopItem;
window.applyColorPreset = applyColorPreset;
window.applyTopbarStyle = applyTopbarStyle;
window.applyThemeToAllPages = applyThemeToAllPages;
window.goToShop = function(itemId) {
    const shopUrl = `customization.html#shop`;  // Navigate to shop section within customization
    window.location.href = shopUrl;
};
