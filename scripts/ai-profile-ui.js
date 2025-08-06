/**
 * AI Profile Management UI Controller
 * Handles the user interface for managing AI profiles, memories, and switching
 */

class AIProfileUI {
    constructor() {
        this.profileManager = null;
        this.currentEditingProfile = null;
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeUI());
        } else {
            this.initializeUI();
        }
    }

    async initializeUI() {
        try {
            // Get the AI Profile Manager instance
            this.profileManager = new AIProfileManager();
            await this.profileManager.init();

            // Initialize event listeners
            this.initializeEventListeners();

            // Load initial data
            await this.refreshUI();

            // Listen for memory updates
            window.addEventListener('aiProfileMemoryAdded', () => {
                this.updateActiveProfileDisplay();
                this.loadMemories();
            });

            window.addEventListener('aiProfileMemoryUpdated', () => {
                this.updateActiveProfileDisplay();
                this.loadMemories();
            });

            window.addEventListener('aiProfileMemoryDeleted', () => {
                this.updateActiveProfileDisplay();
                this.loadMemories();
            });

            console.log('AI Profile UI initialized successfully');
        } catch (error) {
            console.error('Error initializing AI Profile UI:', error);
        }
    }

    initializeEventListeners() {
        // Profile management buttons
        const createBtn = document.getElementById('createNewProfileBtn');
        const switchBtn = document.getElementById('switchProfileBtn');
        const memoriesBtn = document.getElementById('manageMemoriesBtn');

        if (createBtn) createBtn.addEventListener('click', () => this.openCreateProfileModal());
        if (switchBtn) switchBtn.addEventListener('click', () => this.openSwitchProfileModal());
        if (memoriesBtn) memoriesBtn.addEventListener('click', () => this.openMemoryModal());

        // Modal controls
        this.initializeModalListeners();

        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSave(e));
        } else {
            // Try to find the form in settings.html instead
            setTimeout(() => {
                const settingsProfileForm = document.querySelector('#profileModal form, .profile-creation-modal form');
                if (settingsProfileForm) {
                    settingsProfileForm.addEventListener('submit', (e) => this.handleProfileSave(e));
                }
            }, 500);
        }

        // Picture option selection
        this.initializePictureOptions();

        // Memory management
        this.initializeMemoryListeners();
    }

    initializeModalListeners() {
        // Close modal buttons
        const closeButtons = document.querySelectorAll('.modal-close, #cancelProfileBtn, #closeSwitcherModalBtn, #closeMemoryModalBtn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    initializePictureOptions() {
        const pictureOptions = document.querySelectorAll('.picture-option');
        pictureOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                pictureOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                option.classList.add('selected');
                // Update the input field
                const profilePictureInput = document.getElementById('profilePicture');
                if (profilePictureInput) {
                    profilePictureInput.value = option.dataset.image;
                }
            });
        });
    }

    initializeMemoryListeners() {
        const addMemoryBtn = document.getElementById('addMemoryBtn');
        const cancelMemoryBtn = document.getElementById('cancelMemoryBtn');
        const saveMemoryBtn = document.getElementById('saveMemoryBtn');
        const categoryFilter = document.getElementById('memoryCategory');

        if (addMemoryBtn) addMemoryBtn.addEventListener('click', () => this.showAddMemoryForm());
        if (cancelMemoryBtn) cancelMemoryBtn.addEventListener('click', () => this.hideAddMemoryForm());
        if (saveMemoryBtn) saveMemoryBtn.addEventListener('click', () => this.saveMemory());
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.filterMemories());
    }

    async refreshUI() {
        await this.updateActiveProfileDisplay();
        await this.loadProfilesGrid();
        await this.loadMemories(); // Also refresh memories
    }

    async updateActiveProfileDisplay() {
        try {
            const activeProfile = this.profileManager.getActiveProfile();
            if (!activeProfile) {
                console.warn('No active profile found');
                return;
            }
            
            // Update active profile card
            const nameEl = document.getElementById('activeProfileName');
            const personalityEl = document.getElementById('activeProfilePersonality');
            const imageEl = document.getElementById('activeProfileImage');
            const conversationsEl = document.getElementById('activeProfileConversations');
            const memoriesEl = document.getElementById('activeProfileMemories');

            if (nameEl) nameEl.textContent = activeProfile.name;
            if (personalityEl) personalityEl.textContent = this.formatPersonality(activeProfile.personality);
            if (imageEl) imageEl.src = activeProfile.profilePicture;

            // Get stats safely
            const history = this.profileManager.getConversationHistory() || [];
            const memories = this.profileManager.getMemories() || [];

            if (conversationsEl) conversationsEl.textContent = history.length;
            if (memoriesEl) memoriesEl.textContent = memories.length;
        } catch (error) {
            console.error('Error updating active profile display:', error);
        }
    }

    async loadProfilesGrid() {
        const grid = document.getElementById('profilesGrid');
        if (!grid) return;

        const profiles = this.profileManager.getAllProfiles();
        const activeProfileId = this.profileManager.getActiveProfile().id;

        grid.innerHTML = '';

        profiles.forEach(profile => {
            const profileCard = this.createProfileCard(profile, profile.id === activeProfileId);
            grid.appendChild(profileCard);
        });
    }

    createProfileCard(profile, isActive = false) {
        const card = document.createElement('div');
        card.className = `profile-card${isActive ? ' active' : ''}`;
        card.dataset.profileId = profile.id;

        const stats = this.getProfileStats(profile.id);

        card.innerHTML = `
            <div class="profile-card-header">
                <div class="profile-card-avatar">
                    <img src="${profile.profilePicture}" alt="${profile.name}">
                </div>
                <div class="profile-card-info">
                    <h4>${profile.name}</h4>
                    <p>${this.formatPersonality(profile.personality)}</p>
                </div>
            </div>
            <div class="profile-card-description">
                ${profile.description}
            </div>
            <div class="profile-stats">
                <span><i class="fas fa-comments"></i> ${stats.conversations} conversations</span>
                <span><i class="fas fa-brain"></i> ${stats.memories} memories</span>
            </div>
            <div class="profile-card-actions">
                <button class="btn btn-primary btn-sm" onclick="aiProfileUI.switchToProfile('${profile.id}')">
                    <i class="fas fa-exchange-alt"></i> Switch
                </button>
                <button class="btn btn-secondary btn-sm" onclick="aiProfileUI.editProfile('${profile.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="aiProfileUI.deleteProfile('${profile.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        return card;
    }

    getProfileStats(profileId) {
        // This would typically come from the profile manager
        // For now, return default values
        return {
            conversations: Math.floor(Math.random() * 50),
            memories: Math.floor(Math.random() * 20)
        };
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

    // Modal Management
    openCreateProfileModal() {
        this.currentEditingProfile = null;
        this.resetProfileForm();
        document.getElementById('modalTitle').textContent = 'Create New AI Profile';
        this.showModal('profileModal');
    }

    openSwitchProfileModal() {
        this.loadSwitcherProfiles();
        this.showModal('switcherModal');
    }

    openMemoryModal() {
        this.loadMemories();
        this.showModal('memoryModal');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
        this.hideAddMemoryForm();
    }

    resetProfileForm() {
        const form = document.getElementById('profileForm');
        if (form) form.reset();
        
        // Clear picture selection
        document.querySelectorAll('.picture-option').forEach(opt => opt.classList.remove('selected'));
    }

    // Profile Management
    async handleProfileSave(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const selectedTraits = Array.from(document.querySelectorAll('.trait-item input:checked')).map(cb => cb.value);

        // Get form values with proper null checks
        const profileNameEl = document.getElementById('profileName');
        const profilePersonalityEl = document.getElementById('profilePersonality');
        const profileDescriptionEl = document.getElementById('profileDescription');
        const profilePictureEl = document.getElementById('profilePicture');

        const profileData = {
            name: formData.get('profileName') || (profileNameEl ? profileNameEl.value : ''),
            personality: formData.get('profilePersonality') || (profilePersonalityEl ? profilePersonalityEl.value : ''),
            description: formData.get('profileDescription') || (profileDescriptionEl ? profileDescriptionEl.value : ''),
            profilePicture: (profilePictureEl ? profilePictureEl.value : null) || 'pfp/Remi-pfp.png',
            traits: selectedTraits
        };

        try {
            if (this.currentEditingProfile) {
                await this.profileManager.updateProfile(this.currentEditingProfile, profileData);
                this.showNotification('Profile updated successfully!', 'success');
            } else {
                await this.profileManager.createProfile(profileData);
                this.showNotification('Profile created successfully!', 'success');
            }

            this.closeModals();
            await this.refreshUI();
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Error saving profile. Please try again.', 'error');
        }
    }

    async switchToProfile(profileId) {
        try {
            await this.profileManager.switchProfile(profileId);
            await this.refreshUI();
            this.showNotification('Profile switched successfully!', 'success');
        } catch (error) {
            console.error('Error switching profile:', error);
            this.showNotification('Error switching profile. Please try again.', 'error');
        }
    }

    editProfile(profileId) {
        const profile = this.profileManager.getProfile(profileId);
        if (!profile) return;

        this.currentEditingProfile = profileId;
        
        // Fill form with profile data
        document.getElementById('profileName').value = profile.name;
        document.getElementById('profilePersonality').value = profile.personality;
        document.getElementById('profileDescription').value = profile.description;
        document.getElementById('profilePicture').value = profile.profilePicture;

        // Select the correct picture option
        const pictureOption = document.querySelector(`[data-image="${profile.profilePicture}"]`);
        if (pictureOption) {
            document.querySelectorAll('.picture-option').forEach(opt => opt.classList.remove('selected'));
            pictureOption.classList.add('selected');
        }

        // Set traits
        if (profile.traits) {
            profile.traits.forEach(trait => {
                const checkbox = document.getElementById(`trait-${trait}`);
                if (checkbox) checkbox.checked = true;
            });
        }

        document.getElementById('modalTitle').textContent = 'Edit AI Profile';
        this.showModal('profileModal');
    }

    async deleteProfile(profileId) {
        const profile = this.profileManager.getProfile(profileId);
        if (!profile) return;

        const confirmDelete = confirm(`Are you sure you want to delete the profile "${profile.name}"? This action cannot be undone.`);
        
        if (confirmDelete) {
            try {
                await this.profileManager.deleteProfile(profileId);
                await this.refreshUI();
                this.showNotification('Profile deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting profile:', error);
                this.showNotification('Error deleting profile. Please try again.', 'error');
            }
        }
    }

    // Switcher Modal
    loadSwitcherProfiles() {
        const container = document.getElementById('switcherProfiles');
        if (!container) return;

        const profiles = this.profileManager.getAllProfiles();
        const activeProfileId = this.profileManager.getActiveProfile().id;

        container.innerHTML = '';

        profiles.forEach(profile => {
            const card = document.createElement('div');
            card.className = `switcher-profile-card${profile.id === activeProfileId ? ' active' : ''}`;
            card.onclick = () => {
                this.switchToProfile(profile.id);
                this.closeModals();
            };

            card.innerHTML = `
                <div class="switcher-profile-avatar">
                    <img src="${profile.profilePicture}" alt="${profile.name}">
                </div>
                <h4 class="switcher-profile-name">${profile.name}</h4>
                <p class="switcher-profile-personality">${this.formatPersonality(profile.personality)}</p>
                <p class="switcher-profile-description">${profile.description}</p>
            `;

            container.appendChild(card);
        });
    }

    // Memory Management
    loadMemories() {
        const container = document.getElementById('memoriesList');
        if (!container) return;

        const memories = this.profileManager.getMemories();
        container.innerHTML = '';

        if (memories.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-color); opacity: 0.6;">No memories stored yet.</p>';
            return;
        }

        memories.forEach(memory => {
            const memoryEl = this.createMemoryElement(memory);
            container.appendChild(memoryEl);
        });
    }

    createMemoryElement(memory) {
        const div = document.createElement('div');
        div.className = 'memory-item';
        div.dataset.memoryId = memory.id;

        div.innerHTML = `
            <div class="memory-header">
                <span class="memory-category">${memory.category}</span>
                <div class="memory-actions">
                    <button class="btn btn-secondary btn-sm" onclick="aiProfileUI.editMemory('${memory.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="aiProfileUI.deleteMemory('${memory.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="memory-content">${memory.content}</div>
            <div class="memory-date">Added ${new Date(memory.createdAt).toLocaleDateString()}</div>
        `;

        return div;
    }

    showAddMemoryForm() {
        const form = document.getElementById('addMemoryForm');
        if (form) {
            form.style.display = 'block';
            document.getElementById('memoryText').focus();
        }
    }

    hideAddMemoryForm() {
        const form = document.getElementById('addMemoryForm');
        if (form) {
            form.style.display = 'none';
            document.getElementById('memoryText').value = '';
            document.getElementById('memoryCat').value = 'personal';
        }
    }

    async saveMemory() {
        const content = document.getElementById('memoryText').value.trim();
        const category = document.getElementById('memoryCat').value;

        if (!content) {
            this.showNotification('Please enter memory content.', 'error');
            return;
        }

        try {
            await this.profileManager.addMemory(content, category);
            this.hideAddMemoryForm();
            this.loadMemories();
            this.showNotification('Memory added successfully!', 'success');
        } catch (error) {
            console.error('Error saving memory:', error);
            this.showNotification('Error saving memory. Please try again.', 'error');
        }
    }

    editMemory(memoryId) {
        const memory = this.profileManager.getMemories().find(m => m.id === memoryId);
        if (!memory) return;

        const newContent = prompt('Edit memory:', memory.content);
        if (newContent && newContent.trim()) {
            try {
                this.profileManager.editMemory(memoryId, newContent.trim());
                this.loadMemories();
                this.showNotification('Memory updated successfully!', 'success');
            } catch (error) {
                console.error('Error updating memory:', error);
                this.showNotification('Error updating memory. Please try again.', 'error');
            }
        }
    }

    async deleteMemory(memoryId) {
        const confirmDelete = confirm('Are you sure you want to delete this memory?');
        
        if (confirmDelete) {
            try {
                await this.profileManager.deleteMemory(memoryId);
                this.loadMemories();
                this.showNotification('Memory deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting memory:', error);
                this.showNotification('Error deleting memory. Please try again.', 'error');
            }
        }
    }

    filterMemories() {
        const category = document.getElementById('memoryCategory').value;
        const memoryItems = document.querySelectorAll('.memory-item');

        memoryItems.forEach(item => {
            const memoryCategory = item.querySelector('.memory-category').textContent.toLowerCase();
            
            if (!category || memoryCategory === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Utility Methods
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
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

        // Set background color based on type
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the UI when the script loads
let aiProfileUI;

// Make it globally available
window.aiProfileUI = aiProfileUI;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        aiProfileUI = new AIProfileUI();
        window.aiProfileUI = aiProfileUI;
    });
} else {
    aiProfileUI = new AIProfileUI();
    window.aiProfileUI = aiProfileUI;
}
