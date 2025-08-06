/**
 * Global Profile Manager
 * Handles profile updates across all pages
 */

window.GlobalProfileManager = {
    // Default profiles
    defaultProfiles: {
        user: {
            name: 'Student',
            title: 'Student',
            bio: 'Dedicated student working with Auro AI to achieve academic goals.',
            picture: 'pfp/Google_2015_logo.svg.png'
        },
        remi: {
            name: 'Auro',
            personality: 'friendly',
            description: 'Your AI Cognitive Assistant - I\'m here to help you learn, stay organized, and achieve your academic goals!',
            picture: 'pfp/Auro_Logo.png'
        }
    },

    // Initialize profile system
    init() {
        this.loadProfiles();
        this.applyProfiles();
        this.setupProfileListener();
    },

    // Load profiles from localStorage
    loadProfiles() {
        const saved = localStorage.getItem('remiProfiles');
        this.profiles = saved ? 
            { ...this.defaultProfiles, ...JSON.parse(saved) } : 
            JSON.parse(JSON.stringify(this.defaultProfiles));
            
        // Load user data from individual localStorage keys (legacy support)
        const userName = localStorage.getItem('userName');
        const userProfileImage = localStorage.getItem('userProfileImage');
        const userBio = localStorage.getItem('userBio');
        
        // Update user profile with saved data if available
        if (userName || userProfileImage || userBio) {
            this.profiles.user = {
                ...this.profiles.user,
                name: userName || this.profiles.user.name,
                bio: userBio || this.profiles.user.bio,
                picture: userProfileImage || this.profiles.user.picture
            };
        }
    },

    // Apply profiles to current page
    applyProfiles() {
        // Apply Remi profile
        if (this.profiles.remi) {
            // Update Remi name
            document.querySelectorAll('[data-remi-name]').forEach(el => {
                el.textContent = this.profiles.remi.name;
            });
            
            // Update Remi avatar with proper fallback handling
            document.querySelectorAll('[data-remi-avatar]').forEach(el => {
                this.setAvatarWithFallback(el, this.profiles.remi.picture);
            });
            
            // Update Remi description
            document.querySelectorAll('[data-remi-description]').forEach(el => {
                el.textContent = this.profiles.remi.description;
            });
            
            // Update page title
            this.updatePageTitle();
        }

        // Apply user profile
        if (this.profiles.user) {
            // Update user name
            document.querySelectorAll('[data-user-name]').forEach(el => {
                el.textContent = this.profiles.user.name;
            });
            
            // Update topbar user name by ID
            const topbarUserName = document.getElementById('topbar-user-name') || document.getElementById('topbar-username');
            if (topbarUserName) {
                topbarUserName.textContent = this.profiles.user.name;
            }
            
            // Update user status in topbar
            const userStatusElements = document.querySelectorAll('.user-status');
            userStatusElements.forEach(statusEl => {
                const isRegistered = localStorage.getItem('userProfileSetup') === 'true';
                statusEl.textContent = isRegistered ? 'Active' : 'Guest';
                statusEl.className = `user-status ${isRegistered ? 'active' : 'guest'}`;
            });
            
            // Update user avatar
            document.querySelectorAll('[data-user-avatar]').forEach(el => {
                this.setAvatarWithFallback(el, this.profiles.user.picture);
            });
            
            // Update topbar user avatar by ID  
            const topbarAvatar = document.getElementById('topbar-profile-pic');
            if (topbarAvatar) {
                if (this.profiles.user.picture && this.profiles.user.picture !== 'pfp/Google_2015_logo.svg.png') {
                    // User has a custom profile picture
                    if (topbarAvatar.tagName.toLowerCase() === 'img') {
                        this.setAvatarWithFallback(topbarAvatar, this.profiles.user.picture);
                    } else {
                        // For div elements, set as background image
                        topbarAvatar.style.backgroundImage = `url('${this.profiles.user.picture}')`;
                        topbarAvatar.style.backgroundSize = 'cover';
                        topbarAvatar.style.backgroundPosition = 'center';
                        topbarAvatar.style.borderRadius = '50%';
                        topbarAvatar.textContent = ''; // Remove the initial letter
                    }
                } else {
                    // No custom picture, show first letter of name
                    if (topbarAvatar.tagName.toLowerCase() !== 'img') {
                        topbarAvatar.style.backgroundImage = '';
                        topbarAvatar.style.display = 'flex';
                        topbarAvatar.style.alignItems = 'center';
                        topbarAvatar.style.justifyContent = 'center';
                        topbarAvatar.style.fontSize = '18px';
                        topbarAvatar.style.fontWeight = '600';
                        topbarAvatar.textContent = this.profiles.user.name.charAt(0).toUpperCase();
                    }
                }
            }
            
            // Update user title
            document.querySelectorAll('[data-user-title]').forEach(el => {
                el.textContent = this.profiles.user.title;
            });
        }
    },

    // Set avatar with fallback mechanism
    setAvatarWithFallback(element, avatarPath) {
        if (!avatarPath || avatarPath === 'pfp/Google_2015_logo.svg.png') {
            // No avatar or default avatar, show initial letter
            if (element.tagName.toLowerCase() !== 'img') {
                const userName = this.profiles?.user?.name || 'User';
                element.style.backgroundImage = '';
                element.textContent = userName.charAt(0).toUpperCase();
            }
            return;
        }
        
        const testImage = new Image();
        testImage.onload = function() {
            if (element.tagName.toLowerCase() === 'img') {
                element.src = avatarPath;
            } else {
                element.style.backgroundImage = `url('${avatarPath}')`;
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
                element.style.borderRadius = '50%';
                element.textContent = '';
            }
        };
        testImage.onerror = function() {
            console.warn(`Avatar image not found: ${avatarPath}. Using initial letter.`);
            if (element.tagName.toLowerCase() === 'img') {
                element.src = 'pfp/Remi-pfp.png'; // Fallback image for img elements
            } else {
                // For div elements, show initial letter
                const userName = window.GlobalProfileManager?.profiles?.user?.name || 'User';
                element.style.backgroundImage = '';
                element.textContent = userName.charAt(0).toUpperCase();
            }
        };
        testImage.src = avatarPath;
    },

    // Setup listener for profile updates
    setupProfileListener() {
        window.addEventListener('profileUpdated', (event) => {
            this.loadProfiles();
            this.applyProfiles();
        });

        // Listen for storage changes from other tabs
        window.addEventListener('storage', (event) => {
            if (event.key === 'remiProfiles' || event.key === 'userName' || 
                event.key === 'userProfileImage' || event.key === 'userBio') {
                this.loadProfiles();
                this.applyProfiles();
            }
        });
    },

    // Update page title based on current Remi name
    updatePageTitle() {
        const remiName = this.profiles?.remi?.name || 'Remi';
        const currentTitle = document.title;
        
        // Update title on different pages
        if (currentTitle.includes('Chat with')) {
            document.title = `Chat with ${remiName} - AI Student Assistant`;
        } else if (currentTitle.includes('Tasks') || currentTitle.includes('Task')) {
            document.title = `Tasks - ${remiName} AI Assistant`;
        } else if (currentTitle.includes('Schedule')) {
            document.title = `Schedule - ${remiName} AI Assistant`;
        } else if (currentTitle.includes('Tracker')) {
            document.title = `Tracker - ${remiName} AI Assistant`;
        } else if (currentTitle.includes('Achievements')) {
            document.title = `Achievements - ${remiName} AI Assistant`;
        } else if (currentTitle.includes('Shop')) {
            document.title = `Shop - ${remiName} AI Assistant`;
        } else if (currentTitle.includes('Customization')) {
            document.title = `Customization - ${remiName} AI Assistant`;
        } else if (currentTitle.includes('Settings')) {
            document.title = `Settings - ${remiName} AI Assistant`;
        } else if (currentTitle.includes('Remi') || currentTitle.includes('AI Student Assistant')) {
            document.title = `${remiName} - AI Student Assistant`;
        }
    },

    // Update a profile field
    updateProfile(profileType, field, value) {
        if (!this.profiles[profileType]) {
            this.profiles[profileType] = {};
        }
        
        this.profiles[profileType][field] = value;
        localStorage.setItem('remiProfiles', JSON.stringify(this.profiles));
        
        // Update legacy localStorage keys for user profile (for backward compatibility)
        if (profileType === 'user') {
            if (field === 'name') {
                localStorage.setItem('userName', value);
            } else if (field === 'picture') {
                localStorage.setItem('userProfileImage', value);
            } else if (field === 'bio') {
                localStorage.setItem('userBio', value);
            }
        }
        
        // Dispatch update event
        window.dispatchEvent(new CustomEvent('profileUpdated', {
            detail: { profileType, field, value }
        }));
        
        this.applyProfiles();
    },

    // Save profiles to localStorage
    saveProfiles() {
        localStorage.setItem('remiProfiles', JSON.stringify(this.profiles));
        this.applyProfiles();
        this.updateHomepageState(); // Update homepage when profiles change
        
        window.dispatchEvent(new CustomEvent('profileUpdated', {
            detail: { action: 'save', profiles: this.profiles }
        }));
    },

    // Update profile data (bulk update)
    updateProfileData(type, data) {
        if (this.profiles[type]) {
            this.profiles[type] = { ...this.profiles[type], ...data };
            this.saveProfiles();
        }
    },

    // Get current profiles
    getProfiles() {
        return this.profiles;
    },

    // Check if user is registered (has customized data)
    isUserRegistered() {
        try {
            const indicators = [
                localStorage.getItem('remiProfiles'),
                localStorage.getItem('remiCustomization'),
                localStorage.getItem('chatList'),
                localStorage.getItem('tasks'),
                localStorage.getItem('focusStats')
            ];
            
            // User is considered registered if they have any meaningful saved data
            const hasData = indicators.some(indicator => {
                if (!indicator) return false;
                try {
                    const parsed = JSON.parse(indicator);
                    // Check if it's not just empty arrays or default objects
                    if (Array.isArray(parsed)) return parsed.length > 0;
                    if (typeof parsed === 'object') return Object.keys(parsed).length > 0;
                    return true;
                } catch {
                    return false;
                }
            });
            
            return hasData;
        } catch (error) {
            console.error('Error checking registration status:', error);
            return false;
        }
    },

    // Update homepage registration state
    updateHomepageState() {
        if (typeof window.homepageManager !== 'undefined') {
            window.homepageManager.checkUserRegistration();
            window.homepageManager.setupUserInterface();
            if (window.homepageManager.isRegistered) {
                window.homepageManager.loadDashboardData();
            }
        }
        
        // Also trigger a custom event for homepage updates
        window.dispatchEvent(new CustomEvent('registrationStateChanged', {
            detail: { isRegistered: this.isUserRegistered() }
        }));
    },

    // Reset profiles to default
    resetProfiles() {
        this.profiles = JSON.parse(JSON.stringify(this.defaultProfiles));
        localStorage.setItem('remiProfiles', JSON.stringify(this.profiles));
        this.applyProfiles();
        
        // Also clear legacy keys
        localStorage.removeItem('userName');
        localStorage.removeItem('userProfileImage');
        localStorage.removeItem('userBio');
        
        window.dispatchEvent(new CustomEvent('profileUpdated', {
            detail: { action: 'reset' }
        }));
    },
    
    // Force refresh profiles from localStorage (useful after external updates)
    refreshProfiles() {
        this.loadProfiles();
        this.applyProfiles();
    },
    
    // Get current user profile data
    getUserProfile() {
        return this.profiles?.user || this.defaultProfiles.user;
    },
    
    // Get current AI profile data  
    getAIProfile() {
        return this.profiles?.remi || this.defaultProfiles.remi;
    }
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.GlobalProfileManager.init();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.GlobalProfileManager.init();
    });
} else {
    window.GlobalProfileManager.init();
}
