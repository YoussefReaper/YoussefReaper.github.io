/**
 * Chat AI Profile Switcher
 * Handles profile switching functionality in the chat interface
 */

class ChatProfileSwitcher {
    constructor() {
        this.profileManager = null;
        this.isDropdownOpen = false;
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeSwitcher());
        } else {
            this.initializeSwitcher();
        }
    }

    async initializeSwitcher() {
        try {
            // Use the global AI Profile Manager instance or create one
            if (window.AIProfileManager && !window.aiProfileManager) {
                window.aiProfileManager = new window.AIProfileManager();
                await window.aiProfileManager.init();
            }
            this.profileManager = window.aiProfileManager || new AIProfileManager();
            
            // Initialize if not already done
            if (this.profileManager && typeof this.profileManager.init === 'function' && !this.profileManager.profiles) {
                await this.profileManager.init();
            }

            // Initialize event listeners
            this.initializeEventListeners();

            // Update the current profile display
            await this.updateCurrentProfileDisplay();

            // Load available profiles
            await this.loadAvailableProfiles();

            console.log('Chat Profile Switcher initialized successfully');
        } catch (error) {
            console.error('Error initializing Chat Profile Switcher:', error);
        }
    }

    initializeEventListeners() {
        const switchBtn = document.getElementById('profileSwitchBtn');
        const dropdown = document.getElementById('profileDropdown');

        if (switchBtn) {
            switchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.ai-profile-switcher')) {
                this.closeDropdown();
            }
        });

        // Listen for profile changes from other parts of the app
        window.addEventListener('ai-profile-changed', () => {
            this.updateCurrentProfileDisplay();
            this.loadAvailableProfiles();
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen) {
                this.closeDropdown();
            }
        });
    }

    async updateCurrentProfileDisplay() {
        if (!this.profileManager) return;

        const activeProfile = this.profileManager.getActiveProfile();
        if (!activeProfile) {
            console.warn('No active profile found');
            return;
        }
        
        // Resolve avatar path (handle IndexedDB references)
        const avatarSrc = await this.resolveAvatarPath(activeProfile.avatar || activeProfile.profilePicture);
        
        // Update avatar
        const avatarImg = document.getElementById('currentAIAvatar');
        if (avatarImg) {
            avatarImg.src = avatarSrc || 'pfp/Remi-pfp.png';
            avatarImg.alt = activeProfile.name || 'AI';
        }

        // Update name
        const nameEl = document.getElementById('currentAIName');
        if (nameEl) {
            nameEl.textContent = activeProfile.name || 'AI';
        }

        // Update personality
        const personalityEl = document.getElementById('currentAIPersonality');
        if (personalityEl) {
            personalityEl.textContent = this.formatPersonality(activeProfile.personality || 'friendly');
        }
    }

    async resolveAvatarPath(avatar) {
        if (!avatar) return 'pfp/Remi-pfp.png';
        
        // If it's an IndexedDB reference, get the data
        if (avatar.startsWith('indexeddb:')) {
            if (this.profileManager && this.profileManager.resolveAvatarPath) {
                return await this.profileManager.resolveAvatarPath(avatar);
            }
        }
        
        return avatar;
    }

    async loadAvailableProfiles() {
        if (!this.profileManager) return;

        const profilesList = document.getElementById('chatProfilesList');
        if (!profilesList) return;

        const profiles = this.profileManager.getAllProfiles();
        const activeProfile = this.profileManager.getActiveProfile();
        const activeProfileId = activeProfile ? activeProfile.id : null;

        profilesList.innerHTML = '';

        // Create items for all profiles (with async avatar resolution)
        for (const profile of profiles) {
            const profileItem = await this.createProfileDropdownItem(profile, profile.id === activeProfileId);
            profilesList.appendChild(profileItem);
        }
    }

    async createProfileDropdownItem(profile, isActive = false) {
        const item = document.createElement('div');
        item.className = `profile-dropdown-item${isActive ? ' active' : ''}`;
        item.dataset.profileId = profile.id;

        // Calculate truncated description
        const maxDescLength = 60;
        const description = (profile.description || '').length > maxDescLength 
            ? (profile.description || '').substring(0, maxDescLength) + '...'
            : (profile.description || 'AI Assistant');

        // Resolve avatar path
        const avatarSrc = await this.resolveAvatarPath(profile.avatar || profile.profilePicture);

        item.innerHTML = `
            <div class="dropdown-profile-avatar">
                <img src="${avatarSrc || 'pfp/Remi-pfp.png'}" alt="${profile.name || 'AI'}">
            </div>
            <div class="dropdown-profile-info">
                <h5 class="dropdown-profile-name">${profile.name || 'AI'}</h5>
                <p class="dropdown-profile-personality">${this.formatPersonality(profile.personality || 'friendly')}</p>
                <p class="dropdown-profile-description">${description}</p>
            </div>
            <div class="profile-switch-indicator">
                <i class="fas ${isActive ? 'fa-check-circle' : 'fa-arrow-right'}"></i>
            </div>
        `;

        // Add click handler
        item.addEventListener('click', () => {
            if (!isActive) {
                this.switchToProfile(profile.id);
            }
        });

        return item;
    }

    async switchToProfile(profileId) {
        try {
            // Switch the profile
            await this.profileManager.switchProfile(profileId);

            // Update the current display
            await this.updateCurrentProfileDisplay();

            // Reload the profiles list to update active state
            await this.loadAvailableProfiles();

            // Close the dropdown
            this.closeDropdown();

            // Show notification
            const profile = this.profileManager.getProfile(profileId);
            this.showNotification(`Switched to ${profile.name}`, 'success');

            // Trigger a custom event for other parts of the app
            window.dispatchEvent(new CustomEvent('ai-profile-changed', {
                detail: { newProfile: profile }
            }));

            // Clear any existing conversation context for smooth transition
            if (window.chatManager && typeof window.chatManager.clearContext === 'function') {
                window.chatManager.clearContext();
            }

            console.log(`Switched to AI profile: ${profile.name}`);
        } catch (error) {
            console.error('Error switching profile:', error);
            this.showNotification('Error switching profile. Please try again.', 'error');
        }
    }

    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        const dropdown = document.getElementById('profileDropdown');
        const switchBtn = document.getElementById('profileSwitchBtn');

        if (dropdown && switchBtn) {
            dropdown.classList.add('active');
            switchBtn.classList.add('active');
            this.isDropdownOpen = true;

            // Focus management for accessibility
            const firstItem = dropdown.querySelector('.profile-dropdown-item');
            if (firstItem) {
                firstItem.focus();
            }
        }
    }

    closeDropdown() {
        const dropdown = document.getElementById('profileDropdown');
        const switchBtn = document.getElementById('profileSwitchBtn');

        if (dropdown && switchBtn) {
            dropdown.classList.remove('active');
            switchBtn.classList.remove('active');
            this.isDropdownOpen = false;
        }
    }

    formatPersonality(personality) {
        const personalityMap = {
            friendly: 'Friendly & Supportive',
            professional: 'Professional & Focused',
            creative: 'Creative & Imaginative',
            analytical: 'Analytical & Logical',
            enthusiastic: 'Enthusiastic & Motivating',
            wise: 'Wise & Thoughtful',
            casual: 'Casual & Relaxed',
            scholarly: 'Scholarly & Academic'
        };
        return personalityMap[personality] || personality;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `chat-notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '90px', // Below topbar
            right: '20px',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease',
            fontSize: '0.9rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)'
        });

        // Set background color based on type
        const colors = {
            success: 'rgba(34, 197, 94, 0.9)',
            error: 'rgba(239, 68, 68, 0.9)',
            warning: 'rgba(245, 158, 11, 0.9)',
            info: 'rgba(59, 130, 246, 0.9)'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 2.5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2500);
    }

    // Public method to refresh the switcher (useful for external calls)
    async refresh() {
        await this.updateCurrentProfileDisplay();
        await this.loadAvailableProfiles();
    }

    // Public method to get current profile info
    getCurrentProfile() {
        return this.profileManager ? this.profileManager.getActiveProfile() : null;
    }
}

// Initialize the chat profile switcher
let chatProfileSwitcher;

// Make it globally available
window.chatProfileSwitcher = chatProfileSwitcher;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        chatProfileSwitcher = new ChatProfileSwitcher();
        window.chatProfileSwitcher = chatProfileSwitcher;
    });
} else {
    chatProfileSwitcher = new ChatProfileSwitcher();
    window.chatProfileSwitcher = chatProfileSwitcher;
}
