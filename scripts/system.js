const themeToggle = document.querySelector('.toggle-dark-button');
const body = document.body;

// Check if theme toggle exists before trying to access its properties
if (themeToggle) {
    const icon = themeToggle.querySelector('i');

    const currentTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', currentTheme);

    updateIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateIcon(newTheme);
    });

    function updateIcon(theme) {
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
} else {
    // Apply default theme if no toggle exists
    const currentTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', currentTheme);
}

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mainContent = document.querySelector('.main-content');
    
    // Only add sidebar functionality if elements exist
    if (sidebar && sidebarToggle && mainContent) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('expanded');
            
            // Adjust main content when sidebar expands/collapses
            if (sidebar.classList.contains('expanded')) {
                mainContent.style.marginLeft = '250px';
                sidebar.style.width = '250px';
            } else {
                mainContent.style.marginLeft = '60px';
                sidebar.style.width = '70px';
            }
        });
    }
});
