// Script to update all HTML files with floating navigation and remove sidebars
const fs = require('fs');
const path = require('path');

// Template for the topbar HTML
const topbarTemplate = `    <!-- Modern Topbar -->
    <div class="topbar">
        <div class="topbar-left">
            <div class="page-breadcrumb">
                <a href="index.html" class="breadcrumb-item">Home</a>
                <span class="breadcrumb-separator">/</span>
                <span class="breadcrumb-current">{{PAGE_NAME}}</span>
            </div>
        </div>
        
        <div class="topbar-nav">
            <a href="about-me.html" class="topbar-nav-item">
                <i class="fas fa-user"></i>
                <span>About Me</span>
            </a>
            <a href="future-plans.html" class="topbar-nav-item">
                <i class="fas fa-rocket"></i>
                <span>Future Plans</span>
            </a>
            <a href="support-project.html" class="topbar-nav-item">
                <i class="fas fa-heart"></i>
                <span>Support Project</span>
            </a>
            <a href="feedbacks.html" class="topbar-nav-item">
                <i class="fas fa-comments"></i>
                <span>Feedbacks</span>
            </a>
        </div>
        
        <div class="topbar-actions">
            <div class="user-menu">
                <div class="user-trigger">
                    <div class="user-avatar" id="topbar-profile-pic">A</div>
                    <div class="user-info">
                        <span class="user-name" id="topbar-username">Auro User</span>
                        <span class="user-status">Active</span>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

// Template for floating navigation
const floatingNavTemplate = `
    <!-- Floating Navigation Background -->
    <div class="floating-nav-background" id="floating-nav-background"></div>

    <!-- Floating Navigation Hub -->
    <div class="floating-nav-hub" id="floating-nav-hub">
        <button class="nav-hub-button" id="nav-hub-toggle">
            <i class="fas fa-th"></i>
        </button>
        
        <div class="nav-options">
            <a href="index.html" class="nav-option{{HOME_CURRENT}}">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </a>
            <a href="plans.html" class="nav-option{{PLANS_CURRENT}}">
                <i class="fas fa-map"></i>
                <span>Plans</span>
            </a>
            <a href="chat.html" class="nav-option{{CHAT_CURRENT}} registered-only">
                <i class="fas fa-message"></i>
                <span>Chat</span>
            </a>
            <a href="tasks.html" class="nav-option{{TASKS_CURRENT}} registered-only">
                <i class="fas fa-tasks"></i>
                <span>Tasks</span>
            </a>
            <a href="schedule.html" class="nav-option{{SCHEDULE_CURRENT}} registered-only">
                <i class="fas fa-calendar-alt"></i>
                <span>Schedule</span>
            </a>
            <a href="achievements.html" class="nav-option{{ACHIEVEMENTS_CURRENT}} registered-only">
                <i class="fas fa-trophy"></i>
                <span>Achievements</span>
            </a>
            <a href="super-tracker.html" class="nav-option{{TRACKER_CURRENT}} registered-only">
                <i class="fas fa-chart-line"></i>
                <span>Tracker</span>
            </a>
            <a href="customization.html" class="nav-option{{CUSTOMIZATION_CURRENT}} registered-only">
                <i class="fas fa-heart"></i>
                <span>Customize</span>
            </a>
            <a href="shop.html" class="nav-option{{SHOP_CURRENT}} registered-only">
                <i class="fas fa-store"></i>
                <span>Shop</span>
            </a>
            <a href="about.html" class="nav-option{{ABOUT_CURRENT}}">
                <i class="fas fa-user-circle"></i>
                <span>About</span>
            </a>
            <a href="settings.html" class="nav-option{{SETTINGS_CURRENT}}">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </a>
        </div>
    </div>

    <!-- Scripts -->
    <script src="scripts/floating-navigation.js"></script>
    <script src="scripts/global-profile-manager.js"></script>
    <script src="scripts/global-navigation.js"></script>`;

// List of HTML files to update (excluding already updated ones)
const filesToUpdate = [
    'shop.html',
    'schedule.html',
    'achievements.html',
    'super-tracker.html',
    'productivity-economics.html',
    'utilities.html'
];

console.log('Navigation update script created!');
console.log('This script template is ready to help standardize navigation across all pages.');
