// Floating Navigation Hub System
class FloatingNavigation {
    constructor() {
        this.hub = document.getElementById('floating-nav-hub');
        this.toggleButton = document.getElementById('nav-hub-button');
        this.background = document.getElementById('floating-nav-background');
        this.options = document.getElementById('nav-options');
        this.isOpen = false;
        this.init();
    }

    init() {
        if (!this.hub || !this.toggleButton) {
            return;
        }

        // Create background if it doesn't exist
        if (!this.background) {
            this.background = document.createElement('div');
            this.background.id = 'floating-nav-background';
            this.background.className = 'floating-nav-background';
            document.body.appendChild(this.background);
        }

        // Add click event to toggle button
        this.toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });

        // Close when clicking background
        this.background.addEventListener('click', () => {
            if (this.isOpen) {
                this.close();
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.hub.contains(e.target) && this.isOpen) {
                this.close();
            }
        });

        // Keyboard shortcut (Ctrl/Cmd + K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
            // Close on Escape
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Add hover effects
        this.addHoverEffects();
        
        // Initialize current page highlighting
        this.highlightCurrentPage();
        
        // Add notification badges if needed
        this.updateNotificationBadges();
        
        // Initialize closed state
        this.close();
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.hub.classList.add('active');
        this.toggleButton.classList.add('active');
        if (this.background) {
            this.background.classList.add('active');
        }
        this.isOpen = true;
        
        // Prevent body scroll when navigation is open
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.hub.classList.remove('active');
        this.toggleButton.classList.remove('active');
        if (this.background) {
            this.background.classList.remove('active');
        }
        this.isOpen = false;
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    addHoverEffects() {
        const options = this.hub.querySelectorAll('.nav-option');
        
        options.forEach(option => {
            option.addEventListener('mouseenter', () => {
                // Add subtle hover sound effect (optional)
                this.playHoverSound();
                
                // Update quick stats based on hovered option
                this.updateQuickStatsForOption(option);
            });
        });
    }

    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        
        // Define the standardized navigation structure
        const navStructure = this.getStandardizedNavigation();
        
        // Update the navigation options if they exist
        if (this.options) {
            // Clear existing options
            this.options.innerHTML = '';
            
            // Add standardized navigation options
            navStructure.forEach(item => {
                const navOption = document.createElement('a');
                navOption.href = item.href;
                navOption.className = 'nav-option';
                
                // Add registered-only class if needed
                if (item.registeredOnly) {
                    navOption.classList.add('registered-only');
                }
                
                // Add current-page class if this is the current page
                if (item.href === currentPage || 
                    (item.href === 'index.html' && currentPage === '') ||
                    (item.alternatePages && item.alternatePages.includes(currentPage))) {
                    navOption.classList.add('current-page');
                }
                
                // Add closed class if the page is closed
                if (item.closed) {
                    navOption.classList.add('closed');
                    navOption.setAttribute('data-closed', 'true');
                    navOption.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showClosedPageNotification(item.name);
                    });
                }
                
                navOption.innerHTML = `
                    <i class="${item.icon}"></i>
                    <span>${item.name}</span>
                    ${item.closed ? '<span class="closed-badge">Closed</span>' : ''}
                `;
                
                this.options.appendChild(navOption);
            });
        }
    }
    
    // Get standardized navigation structure
    getStandardizedNavigation() {
        return [
            {
                name: 'Dashboard',
                href: 'index.html',
                icon: 'fas fa-tachometer-alt',
                registeredOnly: false,
                closed: false
            },
            {
                name: 'Plans',
                href: 'plans.html',
                icon: 'fas fa-map',
                registeredOnly: false,
                closed: true
            },
            {
                name: 'Chat',
                href: 'chat.html',
                icon: 'fas fa-message',
                registeredOnly: true,
                closed: false
            },
            {
                name: 'Tasks',
                href: 'tasks-new.html',
                icon: 'fas fa-tasks',
                registeredOnly: true,
                closed: false,
                alternatePages: ['tasks.html'] // Also highlight for tasks.html
            },
            {
                name: 'Schedule',
                href: 'schedule.html',
                icon: 'fas fa-calendar-alt',
                registeredOnly: true,
                closed: true
            },
            {
                name: 'Achievements',
                href: 'achievements.html',
                icon: 'fas fa-trophy',
                registeredOnly: true,
                closed: true
            },
            {
                name: 'Tracker',
                href: 'super-tracker.html',
                icon: 'fas fa-chart-line',
                registeredOnly: true,
                closed: false,
                alternatePages: ['tracker.html'] // Also highlight for tracker.html
            },
            {
                name: 'Notes',
                href: 'notes.html',
                icon: 'fas fa-sticky-note',
                registeredOnly: true,
                closed: false
            },
            {
                name: 'Customization',
                href: 'customization.html',
                icon: 'fas fa-heart',
                registeredOnly: true,
                closed: false
            },
            {
                name: 'Settings',
                href: 'settings.html',
                icon: 'fas fa-cog',
                registeredOnly: false,
                closed: false
            }
        ];
    }
    
    // Show notification for closed pages
    showClosedPageNotification(pageName) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'closed-page-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-lock"></i>
                <span>${pageName} is currently under development</span>
                <button class="close-notification">×</button>
            </div>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(239, 68, 68, 0.3);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        // Add animation keyframes if not exists
        if (!document.querySelector('#closed-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'closed-notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-close after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }
    
    // Original method, now calls the new standardized one
    highlightCurrentPageOld() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        
        const options = this.hub.querySelectorAll('.nav-option');
        options.forEach(option => {
            const href = option.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                option.classList.add('current-page');
            } else {
                option.classList.remove('current-page');
            }
        });
    }

    updateNotificationBadges() {
        // Check for notifications from various sources
        const notifications = {
            'chat.html': this.getChatNotifications(),
            'tasks.html': this.getTaskNotifications(),
            'achievements.html': this.getAchievementNotifications(),
            'schedule.html': this.getScheduleNotifications()
        };

        Object.entries(notifications).forEach(([page, count]) => {
            if (count > 0) {
                const option = this.hub.querySelector(`[href="${page}"]`);
                if (option) {
                    this.addNotificationBadge(option, count);
                }
            }
        });
    }

    addNotificationBadge(element, count) {
        // Remove existing badge
        const existingBadge = element.querySelector('.notification-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Add new badge
        const badge = document.createElement('div');
        badge.className = 'notification-badge';
        badge.textContent = count > 99 ? '99+' : count;
        element.style.position = 'relative';
        element.appendChild(badge);
    }

    updateQuickStatsForOption(option) {
        const statsOverlay = this.hub.querySelector('.quick-stats-overlay');
        if (!statsOverlay) return;

        const href = option.getAttribute('href');
        let stats = this.getDefaultStats();

        // Customize stats based on the hovered option
        switch (href) {
            case 'tasks.html':
                stats = [
                    { icon: 'fas fa-tasks', text: '5 tasks pending' },
                    { icon: 'fas fa-check', text: '12 completed today' },
                    { icon: 'fas fa-clock', text: '2 overdue' }
                ];
                break;
            case 'chat.html':
                stats = [
                    { icon: 'fas fa-comments', text: '3 new messages' },
                    { icon: 'fas fa-robot', text: 'Auro is online' },
                    { icon: 'fas fa-heart', text: '85% satisfaction' }
                ];
                break;
            case 'achievements.html':
                stats = [
                    { icon: 'fas fa-trophy', text: '7 achievements' },
                    { icon: 'fas fa-star', text: 'Level 3 user' },
                    { icon: 'fas fa-fire', text: '5 day streak' }
                ];
                break;
            default:
                stats = this.getDefaultStats();
        }

        this.updateStatsDisplay(statsOverlay, stats);
    }

    getDefaultStats() {
        return [
            { icon: 'fas fa-fire', text: '5 day streak' },
            { icon: 'fas fa-check-circle', text: '12 tasks done' },
            { icon: 'fas fa-star', text: 'Level 3' }
        ];
    }

    updateStatsDisplay(overlay, stats) {
        overlay.innerHTML = stats.map(stat => `
            <div class="quick-stat">
                <i class="${stat.icon}"></i>
                <span>${stat.text}</span>
            </div>
        `).join('');
    }

    // Notification getters (to be implemented based on your data)
    getChatNotifications() {
        // Return number of unread messages
        return 0; // Placeholder
    }

    getTaskNotifications() {
        // Return number of overdue tasks
        return 0; // Placeholder
    }

    getAchievementNotifications() {
        // Return number of new achievements
        return 0; // Placeholder
    }

    getScheduleNotifications() {
        // Return number of upcoming events
        return 0; // Placeholder
    }

    playHoverSound() {
        // Optional: Add subtle hover sound
        // const audio = new Audio('path/to/hover-sound.mp3');
        // audio.volume = 0.1;
        // audio.play().catch(() => {}); // Ignore errors
    }
}

// Enhanced Theme Integration
class FloatingNavTheme {
    constructor(navigation) {
        this.nav = navigation;
        this.init();
    }

    init() {
        // Listen for theme changes
        document.addEventListener('themeChanged', (e) => {
            this.updateNavTheme(e.detail.theme);
        });

        // Check initial theme
        this.updateNavTheme(this.getCurrentTheme());
    }

    getCurrentTheme() {
        return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    }

    updateNavTheme(theme) {
        const hub = this.nav.hub;
        if (!hub) return;

        if (theme === 'dark') {
            hub.classList.add('dark-mode');
        } else {
            hub.classList.remove('dark-mode');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const floatingNav = new FloatingNavigation();
    const navTheme = new FloatingNavTheme(floatingNav);
    
    // Add smooth scroll for better UX
    document.querySelectorAll('.nav-option').forEach(link => {
        link.addEventListener('click', (e) => {
            // Add loading animation
            link.style.transform = 'scale(0.95)';
            setTimeout(() => {
                link.style.transform = '';
            }, 150);
        });
    });

    // Add intro animation
    setTimeout(() => {
        const hub = document.getElementById('floating-nav-hub');
        if (hub) {
            hub.style.opacity = '0';
            hub.style.transform = 'scale(0.5)';
            setTimeout(() => {
                hub.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                hub.style.opacity = '1';
                hub.style.transform = 'scale(1)';
            }, 500);
        }
    }, 100);
});
