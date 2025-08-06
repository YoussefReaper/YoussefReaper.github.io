// Landing Page JavaScript - Inspiring User Experience

class LandingPageManager {
    constructor() {
        this.isInitialized = false;
        this.mobileMenuOpen = false;
        this.animationObserver = null;
        this.testimonialIndex = 0;
        this.motivationalQuotes = [
            "A goal without a plan is just a wish. Turn your dreams into strategic roadmaps.",
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "The future belongs to those who believe in the beauty of their dreams.",
            "Your limitation—it's only your imagination. Break through with strategic planning.",
            "Great things never come from comfort zones. Start your transformation today.",
            "Dream it. Plan it. Do it. Achieve it. Repeat.",
            "The best time to plant a tree was 20 years ago. The second best time is now.",
            "Success is the sum of small efforts repeated day in and day out."
        ];
        this.motivationalMantras = [
            "Every great achievement starts with a clear plan and unwavering commitment.",
            "Progress, not perfection. Every step forward counts towards your dreams.",
            "Your potential is limitless when you have the right tools and mindset.",
            "Transform chaos into clarity, dreams into reality, goals into achievements.",
            "Small daily improvements lead to stunning long-term results.",
            "Believe in yourself and watch your goals become your reality.",
            "Excellence is not a skill, it's an attitude. Cultivate it daily.",
            "Your journey to success begins with a single strategic decision."
        ];
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('Initializing Landing Page Manager...');
        
        try {
            this.setupEventListeners();
            this.setupScrollAnimations();
            this.startMotivationalUpdates();
            this.setupParticleEffects();
            this.initializeCounters();
            this.setupMobileMenu();
            
            this.isInitialized = true;
            console.log('Landing Page Manager initialized successfully');
        } catch (error) {
            console.error('Error initializing Landing Page Manager:', error);
        }
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', () => this.closeMobileMenu());
        }

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Header scroll effect
        window.addEventListener('scroll', () => this.handleScroll());

        // CTA button interactions
        document.querySelectorAll('.btn-hero-primary, .btn-cta-primary').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCTAClick(e));
        });

        // Demo button click
        const demoBtn = document.querySelector('.btn-hero-secondary');
        if (demoBtn) {
            demoBtn.addEventListener('click', (e) => this.handleDemoClick(e));
        }

        // Feature card hover effects
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('mouseenter', () => this.animateFeatureCard(card, 'enter'));
            card.addEventListener('mouseleave', () => this.animateFeatureCard(card, 'leave'));
        });

        // Pricing card interactions
        document.querySelectorAll('.pricing-card').forEach(card => {
            card.addEventListener('click', () => this.selectPricingPlan(card));
        });

        console.log('Event listeners set up successfully');
    }

    setupScrollAnimations() {
        // Create intersection observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Special animations for different elements
                    if (entry.target.classList.contains('hero-stats')) {
                        this.animateCounters();
                    } else if (entry.target.classList.contains('floating-card')) {
                        this.animateFloatingCard(entry.target);
                    } else if (entry.target.classList.contains('chart-bar')) {
                        this.animateChartBars();
                    }
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animatedElements = document.querySelectorAll(`
            .hero-text, .hero-visual, .problem-item, .feature-card, 
            .step-item, .testimonial-card, .pricing-card, .floating-card,
            .chart-bar, .hero-stats
        `);

        animatedElements.forEach(el => {
            el.classList.add('animate-on-scroll');
            this.animationObserver.observe(el);
        });

        // Add CSS for animations
        this.addScrollAnimationStyles();
    }

    addScrollAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .animate-on-scroll {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .animate-on-scroll.animate-in {
                opacity: 1;
                transform: translateY(0);
            }
            
            .stagger-animation .animate-on-scroll {
                transition-delay: calc(var(--stagger-index, 0) * 0.1s);
            }
        `;
        document.head.appendChild(style);
    }

    startMotivationalUpdates() {
        // Update motivational quote periodically
        this.updateMotivationalQuote();
        this.updateMotivationalMantra();

        // Change quote every 10 seconds
        setInterval(() => {
            this.updateMotivationalQuote();
        }, 10000);

        // Change mantra every 8 seconds
        setInterval(() => {
            this.updateMotivationalMantra();
        }, 8000);
    }

    updateMotivationalQuote() {
        const quoteElement = document.getElementById('planning-quote');
        if (quoteElement) {
            const randomQuote = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
            this.typewriterEffect(quoteElement, randomQuote);
        }
    }

    updateMotivationalMantra() {
        const mantraElement = document.getElementById('planning-mantra');
        if (mantraElement) {
            const randomMantra = this.motivationalMantras[Math.floor(Math.random() * this.motivationalMantras.length)];
            this.fadeTextUpdate(mantraElement, randomMantra);
        }
    }

    typewriterEffect(element, text) {
        element.style.opacity = '0.5';
        element.textContent = '';
        
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
            } else {
                clearInterval(typeInterval);
                element.style.opacity = '1';
            }
        }, 50);
    }

    fadeTextUpdate(element, text) {
        element.style.transition = 'opacity 0.5s ease';
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.textContent = text;
            element.style.opacity = '1';
        }, 500);
    }

    setupParticleEffects() {
        // Create dynamic particle background
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            this.createFloatingParticles(heroSection);
        }
    }

    createFloatingParticles(container) {
        const particles = document.createElement('div');
        particles.className = 'floating-particles';
        particles.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 1;
        `;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: rgba(103, 197, 255, ${Math.random() * 0.5 + 0.2});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${Math.random() * 10 + 10}s ease-in-out infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            particles.appendChild(particle);
        }

        container.appendChild(particles);
    }

    initializeCounters() {
        // Animate statistics counters
        const stats = [
            { element: document.querySelector('.hero-stats .stat-number'), target: 10000, suffix: '+' },
            { element: document.querySelectorAll('.hero-stats .stat-number')[1], target: 94, suffix: '%' },
            { element: document.querySelectorAll('.hero-stats .stat-number')[2], target: 5, suffix: '★' }
        ];

        stats.forEach(stat => {
            if (stat.element) {
                this.animateCounter(stat.element, 0, stat.target, stat.suffix, 2000);
            }
        });
    }

    animateCounter(element, start, end, suffix = '', duration = 2000) {
        const startTime = performance.now();
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * this.easeOutQuint(progress));
            element.textContent = current.toLocaleString() + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
    }

    easeOutQuint(t) {
        return 1 - Math.pow(1 - t, 5);
    }

    animateCounters() {
        // Trigger counter animations when hero stats come into view
        const counters = document.querySelectorAll('.hero-stats .stat-number');
        const targets = [10000, 94, 5];
        const suffixes = ['+', '%', '★'];

        counters.forEach((counter, index) => {
            this.animateCounter(counter, 0, targets[index], suffixes[index], 2000);
        });
    }

    animateFloatingCard(card) {
        card.style.animation = 'float 2s ease-in-out';
        setTimeout(() => {
            card.style.animation = 'float 6s ease-in-out infinite';
        }, 2000);
    }

    animateChartBars() {
        const bars = document.querySelectorAll('.chart-bar');
        bars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.animation = 'chartGrow 1s ease-out forwards';
            }, index * 200);
        });
    }

    setupMobileMenu() {
        // Mobile menu functionality
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.mobileMenuOpen && !mobileMenu.contains(e.target) && !e.target.closest('#mobile-menu-toggle')) {
                    this.closeMobileMenu();
                }
            });

            // Close menu when clicking on links
            mobileMenu.querySelectorAll('.mobile-menu-link').forEach(link => {
                link.addEventListener('click', () => {
                    this.closeMobileMenu();
                });
            });
        }
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            this.mobileMenuOpen = !this.mobileMenuOpen;
            mobileMenu.classList.toggle('active', this.mobileMenuOpen);
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = this.mobileMenuOpen ? 'hidden' : '';
        }
    }

    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            this.mobileMenuOpen = false;
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    handleScroll() {
        const header = document.querySelector('.landing-header');
        const scrollY = window.scrollY;

        if (header) {
            if (scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = 'none';
            }
        }

        // Parallax effect for hero section
        const heroBackground = document.querySelector('.hero-background');
        if (heroBackground) {
            const speed = scrollY * 0.5;
            heroBackground.style.transform = `translateY(${speed}px)`;
        }
    }

    animateFeatureCard(card, action) {
        if (action === 'enter') {
            card.style.transform = 'translateY(-10px) scale(1.02)';
            card.style.boxShadow = '0 20px 40px rgba(103, 197, 255, 0.2)';
        } else {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = 'none';
        }
    }

    selectPricingPlan(card) {
        // Remove previous selections
        document.querySelectorAll('.pricing-card').forEach(c => {
            c.classList.remove('selected');
        });

        // Add selection to clicked card
        card.classList.add('selected');

        // Add pulse animation
        card.style.animation = 'pulse 0.5s ease-out';
        setTimeout(() => {
            card.style.animation = '';
        }, 500);

        // Get plan details
        const planName = card.querySelector('h3').textContent;
        const planPrice = card.querySelector('.price-amount').textContent;
        
        console.log(`Selected plan: ${planName} - ${planPrice}`);
        
        // Could trigger analytics or other tracking here
        this.trackPlanSelection(planName, planPrice);
    }

    handleCTAClick(e) {
        const button = e.target.closest('button, a');
        
        // Add click animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);

        // Track CTA click
        this.trackCTAClick(button.textContent.trim());

        // Show encouraging message
        this.showEncouragingMessage();
    }

    handleDemoClick(e) {
        e.preventDefault();
        
        // For now, scroll to features section
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Show demo preview (could be expanded to actual demo)
        this.showDemoPreview();
    }

    showEncouragingMessage() {
        const messages = [
            "🚀 Great choice! Your transformation journey is about to begin!",
            "✨ You're taking the first step towards achieving your dreams!",
            "💪 Every successful person started with a single decision. This is yours!",
            "🎯 Your future self will thank you for this moment!",
            "🌟 Welcome to a community of achievers and dream-makers!"
        ];

        const message = messages[Math.floor(Math.random() * messages.length)];
        this.showNotification(message, 'success');
    }

    showDemoPreview() {
        this.showNotification("🎬 Demo preview coming soon! For now, explore our amazing features below.", 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(103, 197, 255, 0.3);
            z-index: 9999;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 350px;
            font-weight: 600;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 0; margin-left: auto;">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    trackCTAClick(buttonText) {
        console.log('CTA clicked:', buttonText);
        // Here you would integrate with analytics service
        // Analytics.track('CTA_Click', { button: buttonText, page: 'landing' });
    }

    trackPlanSelection(planName, planPrice) {
        console.log('Plan selected:', planName, planPrice);
        // Here you would integrate with analytics service
        // Analytics.track('Plan_Selected', { plan: planName, price: planPrice });
    }

    // Utility method to create floating success indicators
    createSuccessIndicator(text, element) {
        const indicator = document.createElement('div');
        indicator.textContent = text;
        indicator.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            pointer-events: none;
            z-index: 1000;
            animation: floatUp 2s ease-out forwards;
        `;

        const rect = element.getBoundingClientRect();
        indicator.style.left = rect.left + rect.width / 2 + 'px';
        indicator.style.top = rect.top + 'px';

        document.body.appendChild(indicator);

        // Remove after animation
        setTimeout(() => {
            indicator.remove();
        }, 2000);
    }

    // Add CSS animations for success indicators
    addSuccessAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatUp {
                0% {
                    opacity: 0;
                    transform: translateY(0) translateX(-50%) scale(0.8);
                }
                20% {
                    opacity: 1;
                    transform: translateY(-10px) translateX(-50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-50px) translateX(-50%) scale(0.8);
                }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .pricing-card.selected {
                border-color: var(--accent-primary) !important;
                background: rgba(103, 197, 255, 0.1) !important;
                transform: scale(1.02) !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize Landing Page Manager
const landingPageManager = new LandingPageManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Landing page DOM loaded, initializing Landing Page Manager...');
    landingPageManager.init();
    landingPageManager.addSuccessAnimations();
});

// Handle visibility change to pause/resume animations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when tab is not visible
        document.body.style.animationPlayState = 'paused';
    } else {
        // Resume animations when tab becomes visible
        document.body.style.animationPlayState = 'running';
    }
});

// Export for global access
window.landingPageManager = landingPageManager;
