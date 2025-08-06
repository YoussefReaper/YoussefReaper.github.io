/**
 * First-Time Setup Handler
 * Checks if user needs to complete initial profile setup
 */

class FirstTimeSetupManager {
    constructor() {
        this.setupCompleted = false;
        this.init();
    }

    init() {
        // Don't run checks on the settings page itself
        if (window.location.pathname.includes('settings.html')) {
            return;
        }

        // Check if setup is needed
        setTimeout(() => {
            this.checkSetupStatus();
        }, 1500); // Delay to allow page to load
    }

    checkSetupStatus() {
        const hasUserProfile = localStorage.getItem('userProfileSetup');
        const remiProfiles = localStorage.getItem('remiProfiles');
        
        let hasValidAIProfile = false;
        if (remiProfiles) {
            try {
                const profiles = JSON.parse(remiProfiles);
                if (profiles.remi && profiles.remi.name && profiles.remi.description) {
                    hasValidAIProfile = true;
                }
            } catch (error) {
                console.warn('Error checking AI profile:', error);
            }
        }

        // If either profile is missing, prompt setup
        if (!hasUserProfile || !hasValidAIProfile) {
            this.promptFirstTimeSetup();
        }
    }

    promptFirstTimeSetup() {
        // Create a modern notification overlay
        const notification = this.createSetupNotification();
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto-redirect after 8 seconds if no action
        setTimeout(() => {
            if (notification.parentNode) {
                this.redirectToSettings();
            }
        }, 8000);
    }

    createSetupNotification() {
        const notification = document.createElement('div');
        notification.className = 'first-time-setup-notification';
        notification.innerHTML = `
            <div class="setup-notification-content">
                <div class="setup-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h3>Welcome to Remi!</h3>
                <p>Complete your profile setup to get the best experience with your AI assistant.</p>
                <div class="setup-actions">
                    <button class="setup-btn primary" onclick="window.firstTimeSetup.redirectToSettings()">
                        <i class="fas fa-cog"></i> Set Up Now
                    </button>
                    <button class="setup-btn secondary" onclick="window.firstTimeSetup.dismissNotification()">
                        <i class="fas fa-times"></i> Later
                    </button>
                </div>
            </div>
        `;

        // Add styles
        this.addSetupStyles();
        
        return notification;
    }

    addSetupStyles() {
        if (document.querySelector('#first-time-setup-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'first-time-setup-styles';
        styles.textContent = `
            .first-time-setup-notification {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.5s ease;
            }

            .first-time-setup-notification.show {
                opacity: 1;
            }

            .setup-notification-content {
                background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15));
                border: 1px solid rgba(168, 85, 247, 0.3);
                border-radius: 20px;
                padding: 3rem;
                text-align: center;
                max-width: 500px;
                width: 90%;
                backdrop-filter: blur(20px);
                color: white;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                animation: slideInUp 0.6s ease-out;
            }

            @keyframes slideInUp {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .setup-icon {
                font-size: 4rem;
                margin-bottom: 1.5rem;
                background: linear-gradient(135deg, #a855f7, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .setup-notification-content h3 {
                font-size: 2rem;
                margin-bottom: 1rem;
                background: linear-gradient(135deg, #ffffff, #e5e7eb);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .setup-notification-content p {
                font-size: 1.1rem;
                margin-bottom: 2rem;
                opacity: 0.9;
                line-height: 1.6;
            }

            .setup-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }

            .setup-btn {
                padding: 1rem 2rem;
                border: none;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1rem;
                min-width: 150px;
                justify-content: center;
            }

            .setup-btn.primary {
                background: linear-gradient(135deg, #a855f7, #3b82f6);
                color: white;
                box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
            }

            .setup-btn.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(168, 85, 247, 0.6);
            }

            .setup-btn.secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .setup-btn.secondary:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }

            @media (max-width: 600px) {
                .setup-notification-content {
                    padding: 2rem;
                }
                
                .setup-actions {
                    flex-direction: column;
                }
                
                .setup-btn {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    redirectToSettings() {
        this.dismissNotification();
        setTimeout(() => {
            window.location.href = 'settings.html';
        }, 300);
    }

    dismissNotification() {
        const notification = document.querySelector('.first-time-setup-notification');
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 500);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.firstTimeSetup = new FirstTimeSetupManager();
});
