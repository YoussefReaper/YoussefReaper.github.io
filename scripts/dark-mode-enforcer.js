// Dark Mode Enforcer for Tracker and Tasks Pages
// Ensures these pages always load in dark mode regardless of settings

(function() {
    'use strict';
    
    // Force dark theme immediately on script load
    function enforceDarkMode() {
        const body = document.body || document.documentElement;
        const html = document.documentElement;
        
        // Set dark theme attributes
        body.setAttribute('data-theme', 'dark');
        html.setAttribute('data-theme', 'dark');
        
        // Add dark class for additional styling support
        body.classList.add('dark-mode-enforced');
        
        // Remove any light theme classes if they exist
        body.classList.remove('light-mode', 'auto-theme');
        html.classList.remove('light-mode', 'auto-theme');
        
        console.log('🌙 Dark mode enforced on tracker/tasks page');
    }
    
    // Apply immediately
    enforceDarkMode();
    
    // Apply when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enforceDarkMode);
    }
    
    // Override any theme changes from other scripts
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'data-theme' || mutation.attributeName === 'class')) {
                const target = mutation.target;
                if (target === document.body || target === document.documentElement) {
                    // Only enforce if someone tries to change away from dark
                    const currentTheme = target.getAttribute('data-theme');
                    if (currentTheme !== 'dark') {
                        enforceDarkMode();
                    }
                }
            }
        });
    });
    
    // Start observing
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
        subtree: false
    });
    
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
        subtree: false
    });
    
    // Override localStorage theme changes for these pages
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        if (key === 'remiCustomization' || key.includes('theme')) {
            try {
                const data = JSON.parse(value);
                if (data && data.theme) {
                    console.log('🌙 Overriding theme setting to maintain dark mode');
                    data.theme = 'dark';
                    value = JSON.stringify(data);
                }
            } catch (e) {
                // If not JSON, ignore
            }
        }
        return originalSetItem.call(this, key, value);
    };
    
})();
