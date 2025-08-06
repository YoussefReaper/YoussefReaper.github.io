/**
 * Homepage JavaScript - Handles user registration state, customization, and dashboard
 */

class HomepageManager {
    constructor() {
        this.isRegistered = false;
        this.userData = null;
        this.customizationSettings = null;
        
        this.init();
    }

    init() {
        console.log('🏠 Initializing Homepage Manager...');
        
        // Check user registration status
        this.checkUserRegistration();
        
        // Apply customization settings
        this.loadCustomizationSettings();
        
        // Setup user interface based on registration status
        this.setupUserInterface();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load dashboard data for registered users
        if (this.isRegistered) {
            this.loadDashboardData();
        }
        
        // Apply customization compatibility
        this.setupCustomizationCompatibility();
        
        console.log('✨ Homepage Manager ready!');
    }

    // ===== USER REGISTRATION DETECTION =====
    
    checkUserRegistration() {
        try {
            // Check for various indicators of user registration
            const indicators = [
                localStorage.getItem('remiProfiles'),
                localStorage.getItem('remiCustomization'),
                localStorage.getItem('chatList'),
                localStorage.getItem('tasks'),
                localStorage.getItem('focusStats')
            ];
            
            // User is considered registered if they have any saved data
            const hasData = indicators.some(indicator => indicator && indicator !== '[]' && indicator !== '{}');
            
            // Check for specific profile data
            const profiles = localStorage.getItem('remiProfiles');
            const hasCustomProfile = profiles && profiles !== JSON.stringify({});
            
            this.isRegistered = hasData || hasCustomProfile;
            
            // Load user data if registered
            if (this.isRegistered) {
                this.loadUserData();
            }
            
            console.log(`👤 User registration status: ${this.isRegistered ? 'Registered' : 'New User'}`);
            
        } catch (error) {
            console.error('Error checking user registration:', error);
            this.isRegistered = false;
        }
    }
    
    loadUserData() {
        try {
            // Load user profile
            const profiles = localStorage.getItem('remiProfiles');
            if (profiles) {
                const parsedProfiles = JSON.parse(profiles);
                this.userData = parsedProfiles.user || {
                    name: 'Student',
                    title: 'Student',
                    bio: 'Learning with AI',
                    picture: 'pfp/Google_2015_logo.svg.png'
                };
            }
            
            console.log('📋 User data loaded:', this.userData);
        } catch (error) {
            console.error('Error loading user data:', error);
            this.userData = null;
        }
    }

    // ===== CUSTOMIZATION SYSTEM =====
    
    loadCustomizationSettings() {
        try {
            const saved = localStorage.getItem('remiCustomization');
            if (saved) {
                this.customizationSettings = JSON.parse(saved);
                console.log('🎨 Customization settings loaded');
            }
        } catch (error) {
            console.error('Error loading customization settings:', error);
        }
    }
    
    setupCustomizationCompatibility() {
        // Listen for customization updates
        window.addEventListener('remiCustomizationUpdated', (event) => {
            this.customizationSettings = event.detail;
            this.applyCustomizationSettings();
        });

        // Apply existing settings
        if (this.customizationSettings) {
            this.applyCustomizationSettings();
        }
    }
    
    applyCustomizationSettings() {
        if (!this.customizationSettings) return;

        console.log('🎨 Applying homepage customization...');

        // Apply theme
        if (this.customizationSettings.theme) {
            const body = document.body;
            if (this.customizationSettings.theme === 'auto') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                body.setAttribute('data-theme', isDark ? 'dark' : 'light');
            } else {
                body.setAttribute('data-theme', this.customizationSettings.theme);
            }
        }

        // Apply custom colors
        if (this.customizationSettings.colors) {
            const root = document.documentElement;
            Object.entries(this.customizationSettings.colors).forEach(([key, value]) => {
                if (key === 'accentPrimary') root.style.setProperty('--accent-primary', value);
                if (key === 'accentSecondary') root.style.setProperty('--accent-secondary', value);
                if (key === 'backgroundColor') root.style.setProperty('--background-color', value);
                if (key === 'textColor') root.style.setProperty('--text-color', value);
                if (key === 'successColor') root.style.setProperty('--success-color', value);
                if (key === 'warningColor') root.style.setProperty('--warning-color', value);
                if (key === 'errorColor') root.style.setProperty('--error-color', value);
            });
        }

        // Apply background if available
        if (this.customizationSettings.backgrounds?.main) {
            document.body.style.backgroundImage = `url('${this.customizationSettings.backgrounds.main}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        }
    }

    // ===== USER INTERFACE SETUP =====
    
    setupUserInterface() {
        // Add body class for CSS state management
        document.body.classList.remove('user-registered', 'user-unregistered');
        document.body.classList.add(this.isRegistered ? 'user-registered' : 'user-unregistered');
        
        // Show/hide elements based on registration status
        const registeredElements = document.querySelectorAll('.registered-only');
        const unregisteredElements = document.querySelectorAll('.unregistered-only');
        
        if (this.isRegistered) {
            // Show registered user interface
            registeredElements.forEach(el => el.style.display = '');
            unregisteredElements.forEach(el => el.style.display = 'none');
            
            this.setupRegisteredUserInterface();
        } else {
            // Show unregistered user interface
            registeredElements.forEach(el => el.style.display = 'none');
            unregisteredElements.forEach(el => el.style.display = '');
            
            this.setupUnregisteredUserInterface();
        }
        
        // Update user status indicator
        this.updateUserStatusIndicator();
    }
    
    setupRegisteredUserInterface() {
        // Update current date
        const currentDateEl = document.getElementById('current-date');
        if (currentDateEl) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            currentDateEl.textContent = now.toLocaleDateString('en-US', options);
        }
        
        // Apply user data to page elements
        if (this.userData) {
            document.querySelectorAll('[data-user-name]').forEach(el => {
                el.textContent = this.userData.name;
            });
        }
        
        console.log('🏠 Registered user interface setup complete');
    }
    
    setupUnregisteredUserInterface() {
        console.log('👋 Unregistered user interface setup complete');
    }
    
    updateUserStatusIndicator() {
        const userStatus = document.getElementById('user-status');
        if (!userStatus) return;
        
        if (this.isRegistered && this.userData) {
            userStatus.innerHTML = `
                <div class="user-profile">
                    <img src="${this.userData.picture}" alt="Profile" class="user-avatar-small" data-user-avatar>
                    <span class="user-name-small" data-user-name>${this.userData.name}</span>
                </div>
            `;
        } else {
            userStatus.innerHTML = `
                <div class="guest-status">
                    <i class="fas fa-user-circle"></i>
                    <span>Guest</span>
                </div>
            `;
        }
    }

    // ===== DASHBOARD DATA =====
    
    loadDashboardData() {
        try {
            // Load chat statistics
            this.updateChatStats();
            
            // Load task statistics
            this.updateTaskStats();
            
            // Load focus time statistics
            this.updateFocusStats();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    updateChatStats() {
        try {
            const chatList = JSON.parse(localStorage.getItem('chatList')) || [];
            const chatCount = chatList.length;
            
            const chatCountEl = document.getElementById('chat-count');
            if (chatCountEl) {
                chatCountEl.textContent = chatCount;
            }
            
        } catch (error) {
            console.error('Error updating chat stats:', error);
        }
    }
    
    updateTaskStats() {
        try {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const completedTasks = tasks.filter(task => task.completed).length;
            
            const taskCountEl = document.getElementById('task-count');
            if (taskCountEl) {
                taskCountEl.textContent = completedTasks;
            }
            
        } catch (error) {
            console.error('Error updating task stats:', error);
        }
    }
    
    updateFocusStats() {
        try {
            const focusStats = JSON.parse(localStorage.getItem('focusStats')) || {};
            const totalMinutes = focusStats.totalMinutes || 0;
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            
            let focusTimeText;
            if (hours > 0) {
                focusTimeText = `${hours}h ${minutes}m`;
            } else {
                focusTimeText = `${minutes}m`;
            }
            
            const focusTimeEl = document.getElementById('focus-time');
            if (focusTimeEl) {
                focusTimeEl.textContent = focusTimeText;
            }
            
        } catch (error) {
            console.error('Error updating focus stats:', error);
        }
    }

    // ===== EVENT LISTENERS =====
    
    setupEventListeners() {
        // Get Started button for unregistered users
        const getStartedBtn = document.getElementById('get-started-btn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => this.startOnboarding());
        }
        
        // Learn More button
        const learnMoreBtn = document.getElementById('learn-more-btn');
        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', () => this.showFeatures());
        }
        
        // Registration button in sidebar
        const startRegistrationBtn = document.getElementById('start-registration');
        if (startRegistrationBtn) {
            startRegistrationBtn.addEventListener('click', () => this.startOnboarding());
        }
        
        // Prevent navigation to restricted pages for unregistered users
        this.setupNavigationRestriction();
        
        // Listen for storage changes (from other tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'remiProfiles' || e.key === 'remiCustomization') {
                this.checkUserRegistration();
                this.setupUserInterface();
                if (this.isRegistered) {
                    this.loadDashboardData();
                }
            }
        });
    }
    
    setupNavigationRestriction() {
        if (!this.isRegistered) {
            const restrictedLinks = document.querySelectorAll('.registered-only a, a.registered-only');
            restrictedLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showRegistrationRequiredMessage();
                });
            });
        }
    }
    
    showRegistrationRequiredMessage() {
        const message = document.createElement('div');
        message.className = 'registration-required-notification';
        message.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-lock"></i>
                <h3>Account Required</h3>
                <p>Please create your profile to access this feature.</p>
                <button class="notification-btn" onclick="this.parentElement.parentElement.remove(); window.homepageManager.startOnboarding();">
                    Get Started
                </button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Remove after 5 seconds if not clicked
        setTimeout(() => {
            if (message.parentNode) {
                document.body.removeChild(message);
            }
        }, 5000);
    }
    
    // ===== USER ONBOARDING =====
    
    startOnboarding() {
        // Create a simple onboarding flow
        this.showOnboardingModal();
    }
    
    showOnboardingModal() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'onboarding-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="onboarding-header">
                    <h2>Welcome to Auro!</h2>
                    <p>Let's set up your AI companion in just a few steps.</p>
                </div>
                
                <div class="onboarding-steps">
                    <div class="onboarding-step">
                        <div class="step-icon">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="step-content">
                            <h3>What's your name?</h3>
                            <input type="text" id="user-name-input" placeholder="Enter your name" class="onboarding-input">
                        </div>
                    </div>
                    
                    <div class="onboarding-step">
                        <div class="step-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="step-content">
                            <h3>What should I call your AI companion?</h3>
                            <input type="text" id="ai-name-input" placeholder="Default: Auro" class="onboarding-input">
                        </div>
                    </div>
                </div>
                
                <div class="onboarding-actions">
                    <button class="btn-secondary" id="skip-onboarding">Skip for now</button>
                    <button class="btn-primary" id="complete-onboarding">Get Started!</button>
                </div>
                
                <button class="close-modal" id="close-onboarding">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('complete-onboarding').addEventListener('click', () => {
            this.completeOnboarding(modal);
        });
        
        document.getElementById('skip-onboarding').addEventListener('click', () => {
            this.skipOnboarding(modal);
        });
        
        document.getElementById('close-onboarding').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close on overlay click
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('user-name-input').focus();
        }, 100);
    }
    
    completeOnboarding(modal) {
        const userName = document.getElementById('user-name-input').value.trim() || 'Student';
        const aiName = document.getElementById('ai-name-input').value.trim() || 'Auro';
        
        // Create initial profile data
        const profiles = {
            user: {
                name: userName,
                title: 'Student',
                bio: `${userName} is working with ${aiName} to achieve great things!`,
                picture: 'pfp/Google_2015_logo.svg.png'
            },
            remi: {
                name: aiName,
                personality: 'friendly',
                description: `Your AI Study Companion - I'm here to help you learn, stay organized, and achieve your goals!`,
                picture: 'pfp/Remi-pfp.png'
            }
        };
        
        // Save profiles
        localStorage.setItem('remiProfiles', JSON.stringify(profiles));
        
        // Create initial customization settings
        const customization = {
            theme: 'auto',
            colors: {
                accentPrimary: '#67C5FF',
                accentSecondary: '#AA79F9'
            },
            personality: {
                name: aiName,
                communicationStyle: 'friendly',
                relationshipLevel: 50
            }
        };
        
        localStorage.setItem('remiCustomization', JSON.stringify(customization));
        
        // Remove modal
        document.body.removeChild(modal);
        
        // Show success message
        this.showSuccessMessage(userName, aiName);
        
        // Refresh the page state
        setTimeout(() => {
            this.checkUserRegistration();
            this.setupUserInterface();
            this.loadDashboardData();
            
            // Trigger global profile update
            window.dispatchEvent(new CustomEvent('profileUpdated'));
        }, 1000);
    }
    
    skipOnboarding(modal) {
        // Create minimal profile to mark as registered
        const profiles = {
            user: {
                name: 'Student',
                title: 'Student',
                bio: 'Getting started with AI assistance',
                picture: 'pfp/Google_2015_logo.svg.png'
            },
            remi: {
                name: 'Auro',
                personality: 'friendly',
                description: 'Your AI Study Companion',
                picture: 'pfp/Remi-pfp.png'
            }
        };
        
        localStorage.setItem('remiProfiles', JSON.stringify(profiles));
        
        // Remove modal
        document.body.removeChild(modal);
        
        // Refresh the page state
        this.checkUserRegistration();
        this.setupUserInterface();
        this.loadDashboardData();
    }
    
    showSuccessMessage(userName, aiName) {
        const message = document.createElement('div');
        message.className = 'success-notification';
        message.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <h3>Welcome aboard, ${userName}!</h3>
                <p>Your AI companion ${aiName} is ready to help you succeed.</p>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (message.parentNode) {
                document.body.removeChild(message);
            }
        }, 3000);
    }
    
    showFeatures() {
        // Scroll to features section
        const featuresSection = document.querySelector('.features-grid');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.homepageManager = new HomepageManager();
});

// Global functions for other scripts
window.updateHomepageDashboard = function() {
    if (window.homepageManager && window.homepageManager.isRegistered) {
        window.homepageManager.loadDashboardData();
    }
};
