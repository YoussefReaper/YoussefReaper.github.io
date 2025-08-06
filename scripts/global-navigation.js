// Global Navigation Management - Enhanced with Sci-Fi Effects
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    setupScigiEffects();
    loadUserProfile();
});

function initializeNavigation() {
    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Update active navigation item
    const navItems = document.querySelectorAll('.nav-item, .sidebar-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            item.classList.add('active');
        }
    });
    
    // Special case for dashboard as homepage
    if (currentPage === 'dashboard.html' || currentPage === 'index.html') {
        const dashboardItem = document.querySelector('a[href="dashboard.html"], a[href="index.html"]');
        if (dashboardItem) {
            dashboardItem.classList.add('active');
        }
    }
    
    // Set up sidebar toggle functionality with default collapsed state
    setupSidebarToggle();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
}

function setupSidebarToggle() {
    const sidebar = document.getElementById('main-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (sidebar) {
        // Start with collapsed state (no expanded class)
        sidebar.classList.remove('expanded');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                sidebar.classList.toggle('expanded');
                
                // For mobile devices, handle open class separately
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('open');
                }
                
                addToggleEffect(toggleBtn);
            });
        }
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                sidebar && 
                !sidebar.contains(e.target) && 
                sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }
}

function addToggleEffect(toggleBtn) {
    toggleBtn.style.transform = 'scale(0.9) rotate(180deg)';
    setTimeout(() => {
        toggleBtn.style.transform = 'scale(1) rotate(0deg)';
    }, 150);
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + B to toggle sidebar
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            const sidebar = document.getElementById('main-sidebar');
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
            }
        }
    });
}

function setupScigiEffects() {
    // Add hover effects to navigation items
    const navItems = document.querySelectorAll('.nav-item, .topbar-nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.setProperty('--glow-intensity', '1');
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.setProperty('--glow-intensity', '0');
        });
    });

    // Add particle effect to brand icon
    const brandIcon = document.querySelector('.brand-icon');
    if (brandIcon) {
        brandIcon.addEventListener('click', () => {
            createParticleEffect(brandIcon);
        });
    }
}

function createParticleEffect(element) {
    const particles = 8;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: linear-gradient(45deg, #a855f7, #3b82f6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${centerX}px;
            top: ${centerY}px;
            opacity: 1;
            animation: particle-burst 0.8s ease-out forwards;
        `;
        
        const angle = (i / particles) * Math.PI * 2;
        const distance = 50 + Math.random() * 30;
        const endX = centerX + Math.cos(angle) * distance;
        const endY = centerY + Math.sin(angle) * distance;
        
        particle.style.setProperty('--end-x', `${endX}px`);
        particle.style.setProperty('--end-y', `${endY}px`);
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 800);
    }
}

// Add particle animation CSS
const particleStyles = document.createElement('style');
particleStyles.textContent = `
    @keyframes particle-burst {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(
                calc(var(--end-x) - var(--start-x, 0px)), 
                calc(var(--end-y) - var(--start-y, 0px))
            ) scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(particleStyles);

// Load and display user profile in the topbar
function loadUserProfile() {
    // Check if GlobalProfileManager is available
    if (window.GlobalProfileManager) {
        // Let GlobalProfileManager handle profile loading
        console.log('Using GlobalProfileManager for profile loading');
        return;
    }
    
    // Fallback to legacy method if GlobalProfileManager is not available
    console.log('Fallback: Loading user profile directly');
    
    // Get user information from localStorage
    let username = localStorage.getItem('userName') || 'User';
    let userInitial = username.charAt(0).toUpperCase();
    
    // Get user profile image if available
    let userImage = localStorage.getItem('userProfileImage');
    
    console.log('Loading user profile:', { username, userImage });
    
    // Update username in topbar
    const usernameElements = document.querySelectorAll('#topbar-username');
    usernameElements.forEach(element => {
        if (element) {
            element.textContent = username;
        }
    });
    
    // Update profile avatar in topbar
    const profilePicElements = document.querySelectorAll('#topbar-profile-pic');
    profilePicElements.forEach(element => {
        if (element) {
            if (userImage) {
                // If we have an image, create and insert img element
                element.innerHTML = `<img src="${userImage}" alt="${username}" />`;
                element.classList.add('has-image');
            } else {
                // Otherwise just show the initial
                element.textContent = userInitial;
                element.classList.remove('has-image');
            }
        }
    });
}

// Auto-redirect index.html to dashboard.html for registered users
function checkAndRedirectToDashboard() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        // Check if user is registered (has profile data)
        const profiles = localStorage.getItem('remiProfiles');
        if (profiles) {
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    }
}

// Initialize redirect check
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    checkAndRedirectToDashboard();
}
