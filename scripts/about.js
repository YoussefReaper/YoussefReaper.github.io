class AboutManager {
    constructor() {
        this.feedback = [];
        this.supporters = [];
        this.stats = {
            totalSupporters: 0,
            monthlySupporters: 0,
            feedbackReceived: 0
        };
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateStats();
        this.loadRecentFeedback();
        this.startAnimations();
        console.log('About Manager initialized successfully');
    }

    setupEventListeners() {
        // Donation buttons
        document.getElementById('paypal-donate')?.addEventListener('click', () => this.handlePayPalDonation());
        document.getElementById('buymeacoffee-donate')?.addEventListener('click', () => this.handleBuyMeACoffeeDonation());

        // Feedback form
        document.getElementById('feedback-form')?.addEventListener('submit', (e) => this.handleFeedbackSubmission(e));
        document.getElementById('clear-feedback')?.addEventListener('click', () => this.clearFeedbackForm());

        // Feature suggestion
        document.getElementById('suggest-feature')?.addEventListener('click', () => this.openFeatureSuggestion());

        // Modal controls
        document.getElementById('close-success-modal')?.addEventListener('click', () => this.closeSuccessModal());
        document.getElementById('close-success-btn')?.addEventListener('click', () => this.closeSuccessModal());
        document.getElementById('join-discord-btn')?.addEventListener('click', () => this.joinDiscord());

        // Social links (you'll need to replace these with actual URLs)
        this.setupSocialLinks();

        console.log('Event listeners setup completed');
    }

    setupSocialLinks() {
        // Update these with actual URLs
        const socialLinks = {
            discord: 'https://discord.gg/your-server', // Replace with actual Discord invite
            github: 'https://github.com/YoussefReaper/Remi', // Replace with actual GitHub
            twitter: 'https://twitter.com/your-handle', // Replace with actual Twitter
            email: 'mailto:3maar@example.com' // Replace with actual email
        };

        Object.entries(socialLinks).forEach(([platform, url]) => {
            const element = document.querySelector(`.social-link.${platform}`);
            if (element) {
                element.href = url;
            }
        });
    }

    loadData() {
        try {
            // Load feedback from localStorage
            const savedFeedback = localStorage.getItem('userFeedback');
            this.feedback = savedFeedback ? JSON.parse(savedFeedback) : [];

            // Load supporter data
            const savedSupporters = localStorage.getItem('supporters');
            this.supporters = savedSupporters ? JSON.parse(savedSupporters) : [];

            // Calculate stats
            this.calculateStats();
        } catch (error) {
            console.error('Error loading data:', error);
            this.initializeSampleData();
        }
    }

    initializeSampleData() {
        // Add some sample feedback for demonstration
        this.feedback = [
            {
                id: '1',
                type: 'compliment',
                title: 'Amazing Work!',
                message: 'Auro has completely transformed my productivity. Thank you for creating such an amazing tool!',
                name: 'Alex',
                isPublic: true,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                type: 'feature-request',
                title: 'Dark Mode Toggle',
                message: 'Would love to see a quick dark mode toggle in the top bar for easier switching.',
                name: 'Sarah',
                isPublic: true,
                createdAt: new Date(Date.now() - 86400000).toISOString() // Yesterday
            }
        ];

        this.saveData();
    }

    calculateStats() {
        this.stats = {
            totalSupporters: this.supporters.length,
            monthlySupporters: this.supporters.filter(s => s.type === 'monthly').length,
            feedbackReceived: this.feedback.length
        };
    }

    updateStats() {
        // Update stats display
        const totalSupportersEl = document.getElementById('total-supporters');
        const monthlySupportersEl = document.getElementById('monthly-supporters');
        const feedbackReceivedEl = document.getElementById('feedback-received');
        const feedbackCountEl = document.getElementById('feedback-count');
        const supporterCountEl = document.getElementById('supporter-count');

        if (totalSupportersEl) totalSupportersEl.textContent = this.stats.totalSupporters;
        if (monthlySupportersEl) monthlySupportersEl.textContent = this.stats.monthlySupporters;
        if (feedbackReceivedEl) feedbackReceivedEl.textContent = `${this.stats.feedbackReceived} feedback received`;
        if (feedbackCountEl) feedbackCountEl.textContent = this.stats.feedbackReceived;
        if (supporterCountEl) supporterCountEl.textContent = this.stats.totalSupporters;
    }

    // Donation handlers
    handlePayPalDonation() {
        // Replace with actual PayPal donation link
        const paypalUrl = 'https://paypal.me/yourusername'; // Replace with actual PayPal.me link
        
        // For demo purposes, we'll show success modal
        this.showDonationSuccess('PayPal');
        
        // Uncomment this line when you have actual PayPal link
        // window.open(paypalUrl, '_blank');
    }

    handleBuyMeACoffeeDonation() {
        // Replace with actual Buy Me A Coffee link
        const buyMeACoffeeUrl = 'https://buymeacoffee.com/yourusername'; // Replace with actual BMAC link
        
        // For demo purposes, we'll show success modal
        this.showDonationSuccess('Buy Me A Coffee');
        
        // Uncomment this line when you have actual BMAC link
        // window.open(buyMeACoffeeUrl, '_blank');
    }

    showDonationSuccess(method) {
        // Add supporter to local storage (in real app, this would be handled by payment processor)
        const supporter = {
            id: Date.now().toString(),
            method: method,
            amount: method === 'PayPal' ? 'Custom' : '$5',
            type: 'one-time',
            createdAt: new Date().toISOString()
        };

        this.supporters.push(supporter);
        this.saveData();
        this.calculateStats();
        this.updateStats();

        // Show success modal
        document.getElementById('success-title').textContent = 'Thank You for Your Support! 🎉';
        document.getElementById('success-message').textContent = 
            `Your ${method} donation means the world to me! You're now eligible for the OG Supporter role on Discord.`;
        
        const modal = document.getElementById('success-modal-overlay');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Feedback handling
    handleFeedbackSubmission(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const feedback = {
            id: Date.now().toString(),
            type: formData.get('type'),
            title: formData.get('title'),
            message: formData.get('message'),
            name: formData.get('name') || 'Anonymous',
            email: formData.get('email'),
            isPublic: formData.has('public'),
            createdAt: new Date().toISOString()
        };

        this.feedback.push(feedback);
        this.saveData();
        this.calculateStats();
        this.updateStats();
        this.loadRecentFeedback();

        // Clear form
        e.target.reset();

        // Show success message
        this.showNotification('Thank you for your feedback! 💙', 'success');

        // Scroll to recent feedback to show the new entry
        setTimeout(() => {
            document.querySelector('.recent-feedback-card')?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 500);
    }

    clearFeedbackForm() {
        document.getElementById('feedback-form').reset();
    }

    openFeatureSuggestion() {
        // Pre-fill feedback form for feature request
        document.getElementById('feedback-type').value = 'feature-request';
        document.getElementById('feedback-title').placeholder = 'What feature would you like to see?';
        document.getElementById('feedback-message').placeholder = 'Describe the feature and how it would help you...';
        
        // Scroll to feedback form
        document.getElementById('feedback-form').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Focus on title field
        setTimeout(() => {
            document.getElementById('feedback-title').focus();
        }, 500);
    }

    loadRecentFeedback() {
        const container = document.getElementById('public-feedback-list');
        if (!container) return;

        const publicFeedback = this.feedback
            .filter(f => f.isPublic)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5); // Show last 5 public feedback

        if (publicFeedback.length === 0) {
            container.innerHTML = `
                <div class="feedback-cta">
                    <p>Be the first to share your thoughts!</p>
                    <button class="btn-small btn-primary" onclick="document.getElementById('feedback-form').scrollIntoView()">
                        Leave Feedback
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = publicFeedback.map(feedback => this.renderFeedbackItem(feedback)).join('');
    }

    renderFeedbackItem(feedback) {
        const typeEmojis = {
            'feature-request': '🚀',
            'bug-report': '🐛',
            'improvement': '💡',
            'compliment': '❤️',
            'general': '💬'
        };

        const timeAgo = this.getTimeAgo(feedback.createdAt);

        return `
            <div class="feedback-item">
                <div class="feedback-header">
                    <span class="feedback-type">${typeEmojis[feedback.type] || '💬'} ${feedback.type.replace('-', ' ')}</span>
                    <span class="feedback-date">${timeAgo}</span>
                </div>
                <h4 class="feedback-title">${feedback.title}</h4>
                <p class="feedback-message">${feedback.message}</p>
                <div class="feedback-author">— ${feedback.name}</div>
            </div>
        `;
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    // Modal controls
    closeSuccessModal() {
        const modal = document.getElementById('success-modal-overlay');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    joinDiscord() {
        // Replace with actual Discord invite link
        const discordInvite = 'https://discord.gg/your-server';
        window.open(discordInvite, '_blank');
        this.closeSuccessModal();
    }

    // Animations
    startAnimations() {
        // Animate creator stats on page load
        this.animateNumbers();
        
        // Add scroll animations for cards
        this.setupScrollAnimations();
    }

    animateNumbers() {
        const numbers = document.querySelectorAll('.creator-stats .stat-number, .supporter-stats .number');
        
        numbers.forEach(numberEl => {
            if (numberEl.textContent === '∞') return; // Skip infinity symbol
            
            const finalNumber = parseInt(numberEl.textContent) || 0;
            let currentNumber = 0;
            const increment = Math.ceil(finalNumber / 50);
            
            const timer = setInterval(() => {
                currentNumber += increment;
                if (currentNumber >= finalNumber) {
                    currentNumber = finalNumber;
                    clearInterval(timer);
                }
                numberEl.textContent = currentNumber;
            }, 40);
        });
    }

    setupScrollAnimations() {
        const cards = document.querySelectorAll('.dashboard-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1
        });

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    // Data persistence
    saveData() {
        try {
            localStorage.setItem('userFeedback', JSON.stringify(this.feedback));
            localStorage.setItem('supporters', JSON.stringify(this.supporters));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    // Utility methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#4CAF50' : 
                       type === 'error' ? '#f44336' : 
                       '#2196F3',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: '10000',
            fontSize: '0.9rem',
            fontWeight: '500',
            maxWidth: '300px',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Time display
    updateTime() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }
}

// Initialize About Manager
let aboutManager;

document.addEventListener('DOMContentLoaded', () => {
    aboutManager = new AboutManager();
    
    // Update time every minute
    setInterval(() => aboutManager.updateTime(), 60000);
    aboutManager.updateTime();
});

// Export for global access
window.aboutManager = aboutManager;
