/* ===== ENHANCED PLANS PAGE - JAVASCRIPT ===== */

class PlansManager {
    constructor() {
        this.plans = [];
        this.currentFilter = 'all';
        this.currentSort = 'priority';
        this.fabMenuOpen = false;
        this.activeTab = 'strategic';
        
        this.init();
    }

    init() {
        this.loadPlans();
        this.initEventListeners();
        this.initNavigationTabs();
        this.updateProgressRings();
        this.initCustomization();
        
        // Show success message
        this.showNotification('Plans workspace loaded successfully! 🚀', 'success');
    }

    // ===== DATA MANAGEMENT =====
    loadPlans() {
        // Load from localStorage or initialize with sample data
        const savedPlans = localStorage.getItem('remi_plans');
        if (savedPlans) {
            this.plans = JSON.parse(savedPlans);
        } else {
            this.plans = this.getSamplePlans();
            this.savePlans();
        }
        
        this.renderPlans();
        this.updateStats();
    }

    savePlans() {
        localStorage.setItem('remi_plans', JSON.stringify(this.plans));
        this.updateStats();
    }

    getSamplePlans() {
        return [
            {
                id: 'plan-1',
                title: 'Master Frontend Development',
                category: 'Learning',
                priority: 'high',
                description: 'Complete comprehensive frontend development course including React, Vue, and modern JavaScript frameworks.',
                progress: 65,
                startDate: '2024-01-15',
                endDate: '2024-06-15',
                tags: ['frontend', 'javascript', 'react', 'vue'],
                status: 'active',
                milestones: [
                    { title: 'HTML/CSS Mastery', completed: true },
                    { title: 'JavaScript ES6+', completed: true },
                    { title: 'React Fundamentals', completed: false },
                    { title: 'State Management', completed: false }
                ]
            },
            {
                id: 'plan-2',
                title: 'Build Personal Brand',
                category: 'Career',
                priority: 'medium',
                description: 'Develop a strong online presence through content creation, networking, and professional portfolio.',
                progress: 30,
                startDate: '2024-02-01',
                endDate: '2024-12-31',
                tags: ['branding', 'networking', 'portfolio'],
                status: 'active',
                milestones: [
                    { title: 'Portfolio Website', completed: true },
                    { title: 'LinkedIn Optimization', completed: false },
                    { title: 'Content Strategy', completed: false },
                    { title: 'Speaking Engagements', completed: false }
                ]
            },
            {
                id: 'plan-3',
                title: 'Fitness & Wellness Journey',
                category: 'Health',
                priority: 'high',
                description: 'Establish a consistent fitness routine and improve overall health through exercise and nutrition.',
                progress: 80,
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                tags: ['fitness', 'health', 'wellness'],
                status: 'active',
                milestones: [
                    { title: 'Gym Membership', completed: true },
                    { title: 'Workout Plan', completed: true },
                    { title: 'Nutrition Plan', completed: true },
                    { title: 'Weight Goals', completed: false }
                ]
            }
        ];
    }

    // ===== RENDERING =====
    renderPlans() {
        const filteredPlans = this.filterPlans();
        const sortedPlans = this.sortPlans(filteredPlans);
        
        const planContainer = document.getElementById('plans-grid');
        if (!planContainer) return;

        planContainer.innerHTML = sortedPlans.map(plan => this.createPlanCard(plan)).join('');
        
        // Add event listeners to plan cards
        this.attachPlanCardEvents();
    }

    createPlanCard(plan) {
        const progressPercentage = Math.round(plan.progress);
        const completedMilestones = plan.milestones.filter(m => m.completed).length;
        const totalMilestones = plan.milestones.length;
        
        return `
            <div class="plan-card glass-container" data-plan-id="${plan.id}">
                <div class="plan-header">
                    <div>
                        <h3 class="plan-title">${plan.title}</h3>
                        <span class="plan-category">${plan.category}</span>
                    </div>
                    <span class="plan-priority ${plan.priority}">${plan.priority}</span>
                </div>
                
                <p class="plan-description">${plan.description}</p>
                
                <div class="plan-metrics">
                    <div class="metric-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${this.formatDate(plan.startDate)} - ${this.formatDate(plan.endDate)}</span>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-tasks"></i>
                        <span>${completedMilestones}/${totalMilestones} milestones</span>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-tags"></i>
                        <span>${plan.tags && plan.tags.length ? plan.tags.join(', ') : 'No tags'}</span>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-chart-line"></i>
                        <span>Status: ${plan.status}</span>
                    </div>
                </div>
                
                <div class="plan-progress-section">
                    <div class="progress-header">
                        <span class="progress-label">Progress</span>
                        <span class="progress-percentage">${progressPercentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                
                <div class="plan-actions">
                    <button class="plan-action-btn primary" onclick="plansManager.viewPlan('${plan.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="plan-action-btn" onclick="plansManager.editPlan('${plan.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="plan-action-btn" onclick="plansManager.updateProgress('${plan.id}')">
                        <i class="fas fa-chart-line"></i> Progress
                    </button>
                </div>
            </div>
        `;
    }

    // ===== EVENT LISTENERS =====
    initEventListeners() {
        // Filter and sort listeners
        const statusFilter = document.getElementById('plans-status-filter');
        const categoryFilter = document.getElementById('plans-category-filter');
        const createNewPlan = document.getElementById('create-new-plan');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value || 'all';
                this.renderPlans();
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value || 'all';
                this.renderPlans();
            });
        }

        if (createNewPlan) {
            createNewPlan.addEventListener('click', () => {
                this.showCreatePlanModal();
            });
        }

        // Modal event listeners
        this.initModalListeners();
        
        // Quick actions
        this.initQuickActions();
        
        // Navigation tabs
        this.initNavigationTabs();
    }

    initModalListeners() {
        // Close modal listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }
            if (e.target.classList.contains('modal-close')) {
                this.closeAllModals();
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    initQuickActions() {
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(action => {
            action.addEventListener('click', (e) => {
                e.preventDefault();
                const actionType = action.dataset.action;
                this.handleQuickAction(actionType);
            });
        });
    }

    initNavigationTabs() {
        const navTabs = document.querySelectorAll('.nav-tab');
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const panel = tab.dataset.panel;
                const section = tab.dataset.section;
                
                // Update active tab within the same panel
                const panelTabs = document.querySelectorAll(`.nav-tab[data-panel="${panel}"]`);
                panelTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show/hide content sections
                this.switchContentSection(section, panel);
            });
        });
    }

    switchContentSection(sectionId, panel) {
        // Hide all content sections for this panel
        const contentSections = document.querySelectorAll('.content-section');
        contentSections.forEach(section => {
            if (section.id.includes(panel) || section.id.includes(sectionId)) {
                section.style.display = 'none';
            }
        });
        
        // Show the selected section
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Update plans rendering if on plans section
        if (sectionId === 'plans') {
            this.currentFilter = 'all';
            this.renderPlans();
        }
    }

    // ===== WORKSPACE NAVIGATION =====
    initWorkspaceNavigation() {
        // This method is kept for compatibility but functionality moved to initNavigationTabs
        console.log('Workspace navigation initialized');
    }

    // ===== PLAN ACTIONS =====
    viewPlan(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;
        this.showPlanDetailsModal(plan);
    }

    editPlan(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;
        this.showEditPlanModal(plan);
    }

    updateProgress(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;
        this.showProgressUpdateModal(plan);
    }

    deletePlan(planId) {
        if (confirm('Are you sure you want to delete this plan?')) {
            this.plans = this.plans.filter(p => p.id !== planId);
            this.savePlans();
            this.renderPlans();
            this.showNotification('Plan deleted successfully', 'success');
        }
    }

    // ===== MODALS =====
    showCreatePlanModal() {
        const modal = this.createModal('Create New Plan', this.getCreatePlanForm(), [
            { text: 'Cancel', class: 'btn-secondary', action: 'close' },
            { text: 'Create Plan', class: 'btn-primary', action: 'plansManager.savePlan()' }
        ]);
        
        this.showModal(modal);
    }

    showEditPlanModal(plan) {
        const modal = this.createModal('Edit Plan', this.getEditPlanForm(plan), [
            { text: 'Cancel', class: 'btn-secondary', action: 'close' },
            { text: 'Delete Plan', class: 'btn-secondary', action: `plansManager.deletePlan('${plan.id}')` },
            { text: 'Save Changes', class: 'btn-primary', action: `plansManager.updatePlan('${plan.id}')` }
        ]);
        
        this.showModal(modal);
    }

    showPlanDetailsModal(plan) {
        const content = `
            <div class="plan-details">
                <div class="plan-overview">
                    <h3>${plan.title}</h3>
                    <p>${plan.description}</p>
                    
                    <div class="plan-meta-grid">
                        <div class="meta-item">
                            <strong>Category:</strong> ${plan.category}
                        </div>
                        <div class="meta-item">
                            <strong>Priority:</strong> ${plan.priority}
                        </div>
                        <div class="meta-item">
                            <strong>Status:</strong> ${plan.status}
                        </div>
                        <div class="meta-item">
                            <strong>Progress:</strong> ${plan.progress}%
                        </div>
                    </div>
                </div>
                
                <div class="milestones-section">
                    <h4>Milestones</h4>
                    <div class="milestones-list">
                        ${plan.milestones.map(milestone => `
                            <div class="milestone-item ${milestone.completed ? 'completed' : ''}">
                                <i class="fas ${milestone.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                                <span>${milestone.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="tags-section">
                    <h4>Tags</h4>
                    <div class="tags-list">
                        ${plan.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;

        const modal = this.createModal('Plan Details', content, [
            { text: 'Close', class: 'btn-secondary', action: 'close' },
            { text: 'Edit Plan', class: 'btn-primary', action: `plansManager.editPlan('${plan.id}')` }
        ]);
        
        this.showModal(modal);
    }

    showProgressUpdateModal(plan) {
        const content = `
            <div class="progress-update-form">
                <div class="current-progress">
                    <h4>Current Progress: ${plan.progress}%</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${plan.progress}%"></div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Update Progress</label>
                    <input type="range" id="progress-slider" class="progress-slider"
                           min="0" max="100" value="${plan.progress}">
                    <div class="progress-display">
                        <span id="progress-value">${plan.progress}</span>%
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Progress Notes</label>
                    <textarea id="progress-notes" class="form-textarea"
                              placeholder="Add notes about your progress..."></textarea>
                </div>
                
                <div class="milestones-update">
                    <h4>Update Milestones</h4>
                    ${plan.milestones.map((milestone, index) => `
                        <label class="milestone-checkbox">
                            <input type="checkbox" ${milestone.completed ? 'checked' : ''}
                                   data-milestone="${index}">
                            <span>${milestone.title}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        const modal = this.createModal('Update Progress', content, [
            { text: 'Cancel', class: 'btn-secondary', action: 'close' },
            { text: 'Update Progress', class: 'btn-primary', action: `plansManager.saveProgressUpdate('${plan.id}')` }
        ]);
        
        this.showModal(modal);
        
        // Initialize progress slider
        this.initProgressSlider();
    }

    initProgressSlider() {
        const slider = document.getElementById('progress-slider');
        const display = document.getElementById('progress-value');
        
        if (slider && display) {
            slider.addEventListener('input', (e) => {
                display.textContent = e.target.value;
            });
        }
    }

    // ===== FORM HANDLING =====
    getCreatePlanForm() {
        return `
            <form id="create-plan-form" class="plan-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Plan Title *</label>
                        <input type="text" id="plan-title" class="form-input" required
                               placeholder="Enter plan title">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category *</label>
                        <select id="plan-category" class="form-select" required>
                            <option value="">Select category</option>
                            <option value="Learning">Learning</option>
                            <option value="Career">Career</option>
                            <option value="Health">Health</option>
                            <option value="Finance">Finance</option>
                            <option value="Personal">Personal</option>
                            <option value="Business">Business</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea id="plan-description" class="form-textarea" required
                              placeholder="Describe your plan in detail..."></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Priority *</label>
                        <select id="plan-priority" class="form-select" required>
                            <option value="">Select priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="plan-status" class="form-select">
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Start Date</label>
                        <input type="date" id="plan-start-date" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date</label>
                        <input type="date" id="plan-end-date" class="form-input">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tags (comma-separated)</label>
                    <input type="text" id="plan-tags" class="form-input"
                           placeholder="e.g. javascript, learning, frontend">
                </div>
            </form>
        `;
    }

    getEditPlanForm(plan) {
        return `
            <form id="edit-plan-form" class="plan-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Plan Title *</label>
                        <input type="text" id="plan-title" class="form-input" required
                               value="${plan.title}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category *</label>
                        <select id="plan-category" class="form-select" required>
                            <option value="Learning" ${plan.category === 'Learning' ? 'selected' : ''}>Learning</option>
                            <option value="Career" ${plan.category === 'Career' ? 'selected' : ''}>Career</option>
                            <option value="Health" ${plan.category === 'Health' ? 'selected' : ''}>Health</option>
                            <option value="Finance" ${plan.category === 'Finance' ? 'selected' : ''}>Finance</option>
                            <option value="Personal" ${plan.category === 'Personal' ? 'selected' : ''}>Personal</option>
                            <option value="Business" ${plan.category === 'Business' ? 'selected' : ''}>Business</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea id="plan-description" class="form-textarea" required>${plan.description}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Priority *</label>
                        <select id="plan-priority" class="form-select" required>
                            <option value="low" ${plan.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${plan.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${plan.priority === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="plan-status" class="form-select">
                            <option value="active" ${plan.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="paused" ${plan.status === 'paused' ? 'selected' : ''}>Paused</option>
                            <option value="completed" ${plan.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Start Date</label>
                        <input type="date" id="plan-start-date" class="form-input" value="${plan.startDate}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date</label>
                        <input type="date" id="plan-end-date" class="form-input" value="${plan.endDate}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tags (comma-separated)</label>
                    <input type="text" id="plan-tags" class="form-input" value="${plan.tags.join(', ')}">
                </div>
            </form>
        `;
    }

    // ===== UTILITY FUNCTIONS =====
    createModal(title, content, actions) {
        return `
            <div class="modal-overlay" id="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2 class="modal-title">
                            <i class="fas fa-rocket"></i>
                            ${title}
                        </h2>
                        <button class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        ${content}
                    </div>
                    <div class="modal-actions">
                        ${actions.map(action => `
                            <button class="btn ${action.class}"
                                    ${action.action === 'close' ? 'onclick="plansManager.closeAllModals()"' : 
                                      `onclick="${action.action}"`}>
                                ${action.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    showModal(modalHTML) {
        // Remove existing modals
        this.closeAllModals();
        
        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal with animation
        setTimeout(() => {
            const overlay = document.getElementById('modal-overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
        }, 10);
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
    }

    // ===== DATA PROCESSING =====
    filterPlans() {
        if (this.currentFilter === 'all') {
            return this.plans;
        }
        
        return this.plans.filter(plan => 
            plan.category === this.currentFilter ||
            plan.status === this.currentFilter ||
            plan.priority === this.currentFilter
        );
    }

    sortPlans(plans) {
        return plans.sort((a, b) => {
            switch (this.currentSort) {
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'progress':
                    return b.progress - a.progress;
                case 'date':
                    return new Date(a.startDate) - new Date(b.startDate);
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });
    }

    // ===== STATISTICS & ANALYTICS =====
    updateStats() {
        const stats = this.calculateStats();
        this.updateStatElements(stats);
    }

    calculateStats() {
        return {
            totalPlans: this.plans.length,
            activePlans: this.plans.filter(p => p.status === 'active').length,
            completedPlans: this.plans.filter(p => p.status === 'completed').length,
            averageProgress: Math.round(this.plans.reduce((sum, p) => sum + p.progress, 0) / this.plans.length),
            highPriorityPlans: this.plans.filter(p => p.priority === 'high').length
        };
    }

    updateStatElements(stats) {
        // Update sidebar stats
        const statElements = {
            'active-plans-count': stats.activePlans,
            'total-plans-stat': stats.totalPlans,
            'completed-plans': stats.completedPlans,
            'average-progress': stats.averageProgress + '%',
            'high-priority': stats.highPriorityPlans
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateProgressRings() {
        const stats = this.calculateStats();
        
        // Update main progress ring
        this.updateProgressRing('overall-progress-ring', stats.averageProgress);
        
        // Update progress percentage display
        const progressPercent = document.getElementById('overall-progress-percent');
        if (progressPercent) {
            progressPercent.textContent = stats.averageProgress + '%';
        }
    }

    updateProgressRing(ringId, percentage) {
        const ring = document.getElementById(ringId);
        if (!ring) return;

        const circle = ring.querySelector('#progress-circle');
        
        if (circle) {
            const radius = 25; // Based on the HTML circle r="25"
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = circumference;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            
            circle.style.strokeDasharray = strokeDasharray;
            circle.style.strokeDashoffset = strokeDashoffset;
        }
    }

    // ===== CUSTOMIZATION INTEGRATION =====
    initCustomization() {
        // Apply saved customizations
        if (window.customizationManager) {
            window.customizationManager.applyCustomizations();
        }
        
        // Listen for customization changes
        document.addEventListener('customizationChanged', (e) => {
            this.handleCustomizationChange(e.detail);
        });
    }

    handleCustomizationChange(customization) {
        // Handle specific customization changes for plans page
        if (customization.type === 'background') {
            this.updatePageBackground(customization.value);
        }
    }

    // ===== NOTIFICATIONS =====
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `success-feedback ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ===== EXPORT & IMPORT =====
    exportPlans() {
        const dataStr = JSON.stringify(this.plans, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `remi-plans-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Plans exported successfully! 📄', 'success');
    }

    // ===== HELPER FUNCTIONS =====
    formatDate(dateString) {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    generateId() {
        return 'plan-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // ===== PLAN CRUD OPERATIONS =====
    savePlan() {
        const form = document.getElementById('create-plan-form');
        if (!form) return;

        const plan = {
            id: this.generateId(),
            title: form.querySelector('#plan-title').value,
            category: form.querySelector('#plan-category').value,
            description: form.querySelector('#plan-description').value,
            priority: form.querySelector('#plan-priority').value,
            status: form.querySelector('#plan-status').value || 'active',
            startDate: form.querySelector('#plan-start-date').value,
            endDate: form.querySelector('#plan-end-date').value,
            tags: form.querySelector('#plan-tags').value.split(',').map(t => t.trim()).filter(t => t),
            progress: 0,
            milestones: [],
            createdAt: new Date().toISOString()
        };

        this.plans.push(plan);
        this.savePlans();
        this.renderPlans();
        this.closeAllModals();
        
        this.showNotification('Plan created successfully! 🎉', 'success');
    }

    updatePlan(planId) {
        const form = document.getElementById('edit-plan-form');
        if (!form) return;

        const planIndex = this.plans.findIndex(p => p.id === planId);
        if (planIndex === -1) return;

        this.plans[planIndex] = {
            ...this.plans[planIndex],
            title: form.querySelector('#plan-title').value,
            category: form.querySelector('#plan-category').value,
            description: form.querySelector('#plan-description').value,
            priority: form.querySelector('#plan-priority').value,
            status: form.querySelector('#plan-status').value,
            startDate: form.querySelector('#plan-start-date').value,
            endDate: form.querySelector('#plan-end-date').value,
            tags: form.querySelector('#plan-tags').value.split(',').map(t => t.trim()).filter(t => t),
            updatedAt: new Date().toISOString()
        };

        this.savePlans();
        this.renderPlans();
        this.closeAllModals();
        
        this.showNotification('Plan updated successfully! ✨', 'success');
    }

    saveProgressUpdate(planId) {
        const planIndex = this.plans.findIndex(p => p.id === planId);
        if (planIndex === -1) return;

        const progressSlider = document.getElementById('progress-slider');
        const progressNotes = document.getElementById('progress-notes');
        const milestoneCheckboxes = document.querySelectorAll('[data-milestone]');

        if (progressSlider) {
            this.plans[planIndex].progress = parseInt(progressSlider.value);
        }

        // Update milestones
        milestoneCheckboxes.forEach(checkbox => {
            const milestoneIndex = parseInt(checkbox.dataset.milestone);
            if (this.plans[planIndex].milestones[milestoneIndex]) {
                this.plans[planIndex].milestones[milestoneIndex].completed = checkbox.checked;
            }
        });

        // Add progress note if provided
        if (progressNotes && progressNotes.value.trim()) {
            if (!this.plans[planIndex].progressNotes) {
                this.plans[planIndex].progressNotes = [];
            }
            this.plans[planIndex].progressNotes.push({
                date: new Date().toISOString(),
                note: progressNotes.value.trim()
            });
        }

        this.plans[planIndex].updatedAt = new Date().toISOString();
        this.savePlans();
        this.renderPlans();
        this.closeAllModals();
        
        this.showNotification('Progress updated successfully! 📈', 'success');
    }

    attachPlanCardEvents() {
        // Add any additional event listeners for plan cards
        const planCards = document.querySelectorAll('.plan-card');
        planCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    handleQuickAction(actionType) {
        switch (actionType) {
            case 'template':
                this.showTemplateLibrary();
                break;
            case 'import':
                this.showImportModal();
                break;
            case 'backup':
                this.createBackup();
                break;
            case 'analytics':
                this.showAnalytics();
                break;
        }
    }

    showTemplateLibrary() {
        this.showNotification('Template library coming soon! 📚', 'info');
    }

    showAnalytics() {
        this.showNotification('Advanced analytics coming soon! 📊', 'info');
    }

    createBackup() {
        this.exportPlans();
    }

    showAddMilestoneModal() {
        this.showNotification('Add milestone feature coming soon! 🎯', 'info');
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the plans manager
    window.plansManager = new PlansManager();
    
    // Initialize background customization support
    if (window.backgroundManager) {
        window.backgroundManager.init();
    }
});

// ===== GLOBAL FUNCTIONS FOR HTML =====
function createPlan() {
    window.plansManager.showCreatePlanModal();
}

function viewPlan(planId) {
    window.plansManager.viewPlan(planId);
}

function editPlan(planId) {
    window.plansManager.editPlan(planId);
}

function updateProgress(planId) {
    window.plansManager.updateProgress(planId);
}

function deletePlan(planId) {
    window.plansManager.deletePlan(planId);
}