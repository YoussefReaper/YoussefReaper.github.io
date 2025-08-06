class PlansManager {
    constructor() {
        this.plans = [];
        this.visionData = {};
        this.currentView = 'overview';
        this.nextPlanId = 1;
        this.nextMilestoneId = 1;
        this.nextEventId = 1;
    }

    init() {
        this.loadPlans();
        this.loadVisionData();
        this.setupEventListeners();
        this.loadPlans();
        this.updateStats();
        this.loadQuickActions();
        this.loadTimeline();
        this.loadVisionBoard();
        console.log('Plans Manager initialized successfully');
    }

    setupEventListeners() {
        // Basic modal controls
        this.setupModalControls();
        
        // Form submissions
        this.setupFormHandlers();
        
        // Tab switching
        this.setupTabHandlers();
        
        // Filter handlers
        this.setupFilterHandlers();
        
        console.log('Event listeners setup completed');
    }

    setupModalControls() {
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) modal.style.display = 'none';
            });
        });

        // Modal overlay clicks
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                }
            });
        });
    }

    setupFormHandlers() {
        // Create plan form
        const createPlanForm = document.getElementById('create-plan-form');
        if (createPlanForm) {
            createPlanForm.addEventListener('submit', (e) => this.handleCreatePlan(e));
        }

        // Milestone form
        const milestoneForm = document.getElementById('milestone-form');
        if (milestoneForm) {
            milestoneForm.addEventListener('submit', (e) => this.handleCreateMilestone(e));
        }

        // Event form
        const eventForm = document.getElementById('event-form');
        if (eventForm) {
            eventForm.addEventListener('submit', (e) => this.handleCreateEvent(e));
        }
    }

    setupTabHandlers() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    setupFilterHandlers() {
        const statusFilter = document.getElementById('status-filter');
        const categoryFilter = document.getElementById('category-filter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterPlans());
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterPlans());
        }
    }

    loadPlans() {
        try {
            const savedPlans = localStorage.getItem('userPlans');
            this.plans = savedPlans ? JSON.parse(savedPlans) : [];
            
            if (this.plans.length === 0) {
                this.initializeSampleData();
            }
            
            this.renderPlans();
        } catch (error) {
            console.error('Error loading plans:', error);
            this.plans = [];
            this.initializeSampleData();
        }
    }

    loadVisionData() {
        try {
            const savedVision = localStorage.getItem('visionData');
            this.visionData = savedVision ? JSON.parse(savedVision) : {};
        } catch (error) {
            console.error('Error loading vision data:', error);
            this.visionData = {};
        }
    }

    initializeSampleData() {
        this.plans = [
            {
                id: 'plan_1',
                title: 'Master Full-Stack Development',
                description: 'Become proficient in modern web development technologies',
                category: 'career',
                priority: 'high',
                status: 'active',
                progress: 35,
                deadline: '2025-12-31',
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-15T00:00:00Z',
                parentId: null,
                milestones: [
                    {
                        id: 'm1',
                        title: 'Complete React Fundamentals',
                        description: 'Learn React.js basics',
                        dueDate: '2025-08-15',
                        completed: true,
                        completedAt: '2025-07-20T00:00:00Z'
                    },
                    {
                        id: 'm2',
                        title: 'Build Portfolio Website',
                        description: 'Create a professional portfolio',
                        dueDate: '2025-09-30',
                        completed: false,
                        completedAt: null
                    }
                ],
                events: [
                    {
                        id: 'e1',
                        title: 'React Course Deadline',
                        type: 'deadline',
                        date: '2025-08-15',
                        time: '23:59',
                        description: 'Complete React course'
                    }
                ],
                subPlans: []
            },
            {
                id: 'plan_2',
                title: 'Fitness Transformation',
                description: 'Get in the best shape of my life',
                category: 'health',
                priority: 'medium',
                status: 'active',
                progress: 20,
                deadline: '2025-11-30',
                createdAt: '2025-02-01T00:00:00Z',
                updatedAt: '2025-02-15T00:00:00Z',
                parentId: null,
                milestones: [
                    {
                        id: 'm3',
                        title: 'Lose 10 pounds',
                        description: 'First weight loss milestone',
                        dueDate: '2025-09-01',
                        completed: false,
                        completedAt: null
                    }
                ],
                events: [
                    {
                        id: 'e2',
                        title: 'Gym Membership Renewal',
                        type: 'reminder',
                        date: '2025-08-01',
                        time: '12:00',
                        description: 'Renew gym membership'
                    }
                ],
                subPlans: []
            }
        ];
        
        this.savePlans();
    }

    renderPlans() {
        const container = document.getElementById('plans-list');
        if (!container) return;

        const mainPlans = this.plans.filter(plan => !plan.parentId);
        
        if (mainPlans.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = mainPlans.map(plan => this.renderPlanItem(plan)).join('');
    }

    renderPlanItem(plan) {
        const subPlans = this.plans.filter(p => p.parentId === plan.id);
        const milestoneProgress = this.calculateMilestoneProgress(plan);
        
        return `
            <div class="plan-item" data-plan-id="${plan.id}">
                <div class="plan-header">
                    <div class="plan-info">
                        <h3 class="plan-title">${plan.title}</h3>
                        <p class="plan-description">${plan.description}</p>
                        <div class="plan-meta">
                            <span class="plan-category ${plan.category}">${plan.category}</span>
                            <span class="plan-priority ${plan.priority}">${plan.priority}</span>
                            <span class="plan-status ${plan.status}">${plan.status}</span>
                        </div>
                    </div>
                    <div class="plan-actions">
                        <button class="btn-icon" onclick="plansManager.openPlanDetailsModal('${plan.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="plansManager.editPlan('${plan.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="plansManager.deletePlan('${plan.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="plan-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${plan.progress}%"></div>
                    </div>
                    <span class="progress-text">${plan.progress}% complete</span>
                </div>

                <div class="plan-sections">
                    ${plan.milestones && plan.milestones.length > 0 ? `
                        <div class="plan-section">
                            <button class="section-header expand-toggle" onclick="plansManager.toggleSection(this, 'milestones-${plan.id}')">
                                <span>Milestones (${plan.milestones.filter(m => m.completed).length}/${plan.milestones.length})</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="milestones-container" id="milestones-${plan.id}" style="display: none;">
                                ${plan.milestones.map(milestone => this.renderMilestone(milestone, plan.id)).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${plan.events && plan.events.length > 0 ? `
                        <div class="plan-section">
                            <button class="section-header expand-toggle" onclick="plansManager.toggleSection(this, 'events-${plan.id}')">
                                <span>Events (${plan.events.length})</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="events-container" id="events-${plan.id}" style="display: none;">
                                ${plan.events.map(event => this.renderEvent(event)).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${subPlans.length > 0 ? `
                        <div class="plan-section">
                            <button class="section-header expand-toggle" onclick="plansManager.toggleSection(this, 'sub-plans-${plan.id}')">
                                <span>Sub-Plans (${subPlans.length})</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="sub-plans-container" id="sub-plans-${plan.id}" style="display: none;">
                                ${subPlans.map(subPlan => this.renderSubPlan(subPlan)).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderSubPlan(subPlan) {
        return `
            <div class="sub-plan-item" data-plan-id="${subPlan.id}">
                <div class="sub-plan-info">
                    <h4 class="sub-plan-title">${subPlan.title}</h4>
                    <p class="sub-plan-description">${subPlan.description}</p>
                    <div class="sub-plan-progress">
                        <div class="progress-bar small">
                            <div class="progress-fill" style="width: ${subPlan.progress}%"></div>
                        </div>
                        <span class="progress-text">${subPlan.progress}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderMilestone(milestone, planId) {
        const tasks = this.getTasksForMilestone(milestone.id);
        const completedTasks = tasks.filter(task => task.completed).length;
        const isCompleted = milestone.completed || (tasks.length > 0 && completedTasks === tasks.length);

        return `
            <div class="milestone-item" data-milestone-id="${milestone.id}">
                <div class="milestone-checkbox ${isCompleted ? 'completed' : ''}" 
                     onclick="plansManager.toggleMilestone('${planId}', '${milestone.id}')"></div>
                <div class="milestone-content">
                    <div class="milestone-title ${isCompleted ? 'completed' : ''}">${milestone.title}</div>
                    ${milestone.description ? `<div class="milestone-description">${milestone.description}</div>` : ''}
                    ${milestone.dueDate ? `<div class="milestone-due">Due: ${new Date(milestone.dueDate).toLocaleDateString()}</div>` : ''}
                    
                    ${tasks.length > 0 ? `
                        <div class="milestone-tasks">
                            <strong>Related Tasks (${completedTasks}/${tasks.length}):</strong>
                            ${tasks.map(task => `
                                <div class="milestone-task">
                                    <div class="task-checkbox ${task.completed ? 'completed' : ''}"></div>
                                    <span class="task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderEvent(event) {
        return `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-icon ${event.type}">
                    ${this.getEventIcon(event.type)}
                </div>
                <div class="event-content">
                    <div class="event-title">${event.title}</div>
                    <div class="event-datetime">
                        ${new Date(event.date + ' ' + event.time).toLocaleString()}
                    </div>
                    ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                </div>
            </div>
        `;
    }

    getEventIcon(type) {
        const icons = {
            deadline: '⏰',
            milestone: '🎯',
            review: '🔍',
            meeting: '👥',
            reminder: '🔔',
            celebration: '🎉'
        };
        return icons[type] || '📅';
    }

    // Modal methods
    openCreatePlanModal() {
        const modal = document.getElementById('create-plan-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.switchTab('basic-info');
        }
    }

    closeCreatePlanModal() {
        const modal = document.getElementById('create-plan-modal');
        if (modal) {
            modal.style.display = 'none';
            this.resetCreatePlanForm();
        }
    }

    openMilestoneModal() {
        const modal = document.getElementById('milestone-modal');
        if (modal) modal.style.display = 'flex';
    }

    closeMilestoneModal() {
        const modal = document.getElementById('milestone-modal');
        if (modal) modal.style.display = 'none';
    }

    openEventModal() {
        const modal = document.getElementById('event-modal');
        if (modal) modal.style.display = 'flex';
    }

    closeEventModal() {
        const modal = document.getElementById('event-modal');
        if (modal) modal.style.display = 'none';
    }

    openPlanDetailsModal(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;

        this.populatePlanDetailsModal(plan);
        
        const modal = document.getElementById('plan-details-modal');
        if (modal) modal.style.display = 'flex';
    }

    closePlanDetailsModal() {
        const modal = document.getElementById('plan-details-modal');
        if (modal) modal.style.display = 'none';
    }

    // Tab switching
    switchTab(tabName) {
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Activate selected tab button
        const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
    }

    // Form handlers
    handleCreatePlan(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newPlan = {
            id: `plan_${Date.now()}`,
            title: formData.get('plan-title'),
            description: formData.get('plan-description'),
            category: formData.get('plan-category'),
            priority: formData.get('plan-priority'),
            status: 'planning',
            progress: 0,
            deadline: formData.get('plan-deadline') || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentId: formData.get('parent-plan') || null,
            milestones: this.collectMilestones(),
            events: this.collectEvents(),
            subPlans: []
        };

        this.plans.push(newPlan);
        this.savePlans();
        this.loadPlans();
        this.updateStats();
        this.closeCreatePlanModal();
        this.showNotification('Plan created successfully! 🎉', 'success');
        
        // Notify tasks page about new milestones
        this.notifyTasksPageOfMilestones();
    }

    handleCreateMilestone(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const milestone = {
            id: `milestone_${Date.now()}`,
            title: formData.get('milestone-title'),
            description: formData.get('milestone-description'),
            dueDate: formData.get('milestone-due-date'),
            completed: false,
            completedAt: null
        };

        // Add to current plan being created
        this.addMilestoneToCurrentPlan(milestone);
        this.closeMilestoneModal();
        this.showNotification('Milestone added!', 'success');
    }

    handleCreateEvent(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const event = {
            id: `event_${Date.now()}`,
            title: formData.get('event-title'),
            type: formData.get('event-type'),
            date: formData.get('event-date'),
            time: formData.get('event-time'),
            description: formData.get('event-description')
        };

        // Add to current plan being created
        this.addEventToCurrentPlan(event);
        this.closeEventModal();
        this.showNotification('Event added!', 'success');
    }

    collectMilestones() {
        // Collect milestones from the temporary storage during plan creation
        return this.tempMilestones || [];
    }

    collectEvents() {
        // Collect events from the temporary storage during plan creation
        return this.tempEvents || [];
    }

    addMilestoneToCurrentPlan(milestone) {
        if (!this.tempMilestones) this.tempMilestones = [];
        this.tempMilestones.push(milestone);
        this.updateMilestonesList();
    }

    addEventToCurrentPlan(event) {
        if (!this.tempEvents) this.tempEvents = [];
        this.tempEvents.push(event);
        this.updateEventsList();
    }

    updateMilestonesList() {
        const container = document.getElementById('milestones-list');
        if (container && this.tempMilestones) {
            container.innerHTML = this.tempMilestones.map(milestone => `
                <div class="milestone-preview">
                    <span>${milestone.title}</span>
                    <button onclick="plansManager.removeTempMilestone('${milestone.id}')" class="btn-icon btn-small">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    updateEventsList() {
        const container = document.getElementById('events-list');
        if (container && this.tempEvents) {
            container.innerHTML = this.tempEvents.map(event => `
                <div class="event-preview">
                    <span>${event.title} (${event.type})</span>
                    <button onclick="plansManager.removeTempEvent('${event.id}')" class="btn-icon btn-small">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    removeTempMilestone(milestoneId) {
        if (this.tempMilestones) {
            this.tempMilestones = this.tempMilestones.filter(m => m.id !== milestoneId);
            this.updateMilestonesList();
        }
    }

    removeTempEvent(eventId) {
        if (this.tempEvents) {
            this.tempEvents = this.tempEvents.filter(e => e.id !== eventId);
            this.updateEventsList();
        }
    }

    resetCreatePlanForm() {
        document.getElementById('create-plan-form').reset();
        this.tempMilestones = [];
        this.tempEvents = [];
        this.updateMilestonesList();
        this.updateEventsList();
    }

    // Utility methods
    toggleSection(button, sectionId) {
        const section = document.getElementById(sectionId);
        const icon = button.querySelector('i');
        
        if (section.style.display === 'none') {
            section.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
        } else {
            section.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
        }
    }

    toggleExpandAll() {
        const expandBtn = document.getElementById('expand-all-btn');
        const allExpandables = document.querySelectorAll('.milestones-container > div[id], .events-container > div[id], .sub-plans-container > div[id]');
        const allButtons = document.querySelectorAll('.expand-toggle');
        
        const isExpanded = expandBtn.textContent.includes('Collapse');
        
        allExpandables.forEach(section => {
            section.style.display = isExpanded ? 'none' : 'block';
        });
        
        allButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            icon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        });
        
        expandBtn.innerHTML = isExpanded ? 
            '<i class="fas fa-expand-alt"></i> Expand All' : 
            '<i class="fas fa-compress-alt"></i> Collapse All';
    }

    toggleMilestone(planId, milestoneId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;

        const milestone = plan.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;

        milestone.completed = !milestone.completed;
        milestone.completedAt = milestone.completed ? new Date().toISOString() : null;

        this.savePlans();
        this.loadPlans();
        this.updateStats();

        if (milestone.completed) {
            this.showNotification('Milestone completed! 🎉', 'success');
        }
    }

    calculateMilestoneProgress(plan) {
        if (!plan.milestones || plan.milestones.length === 0) return 0;
        const completed = plan.milestones.filter(m => m.completed).length;
        return Math.round((completed / plan.milestones.length) * 100);
    }

    getTasksForMilestone(milestoneId) {
        // Get tasks from localStorage that are linked to this milestone
        const tasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
        return tasks.filter(task => task.milestoneId === milestoneId);
    }

    filterPlans() {
        const statusFilter = document.getElementById('status-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        
        let filteredPlans = this.plans.filter(plan => !plan.parentId); // Only main plans
        
        if (statusFilter && statusFilter !== 'all') {
            filteredPlans = filteredPlans.filter(plan => plan.status === statusFilter);
        }
        
        if (categoryFilter && categoryFilter !== 'all') {
            filteredPlans = filteredPlans.filter(plan => plan.category === categoryFilter);
        }
        
        const container = document.getElementById('plans-list');
        container.innerHTML = filteredPlans.map(plan => this.renderPlanItem(plan)).join('');
    }

    populatePlanDetailsModal(plan) {
        document.getElementById('plan-details-title').textContent = plan.title;
        document.getElementById('plan-details-description').textContent = plan.description || 'No description';
        document.getElementById('plan-details-category').textContent = plan.category;
        document.getElementById('plan-details-status').textContent = plan.status;
        document.getElementById('plan-details-priority').textContent = plan.priority;
        document.getElementById('plan-details-progress').textContent = `${plan.progress}%`;
        document.getElementById('plan-details-created').textContent = new Date(plan.createdAt).toLocaleDateString();
        document.getElementById('plan-details-updated').textContent = new Date(plan.updatedAt).toLocaleDateString();

        // Setup action buttons
        document.getElementById('edit-plan-btn').onclick = () => this.editPlan(plan.id);
        document.getElementById('duplicate-plan-btn').onclick = () => this.duplicatePlan(plan.id);
        document.getElementById('delete-plan-btn').onclick = () => this.deletePlan(plan.id);
    }

    editPlan(planId) {
        // Implementation for editing plans
        this.showNotification('Edit functionality coming soon!', 'info');
    }

    duplicatePlan(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;

        const duplicatedPlan = {
            ...plan,
            id: `plan_${Date.now()}`,
            title: `${plan.title} (Copy)`,
            progress: 0,
            status: 'planning',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            milestones: plan.milestones ? plan.milestones.map(m => ({
                ...m,
                id: `milestone_${Date.now()}_${Math.random()}`,
                completed: false,
                completedAt: null
            })) : []
        };

        this.plans.push(duplicatedPlan);
        this.savePlans();
        this.loadPlans();
        this.updateStats();
        this.showNotification('Plan duplicated successfully!', 'success');
        this.closePlanDetailsModal();
    }

    deletePlan(planId) {
        if (confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
            // Also delete sub-plans
            this.plans = this.plans.filter(p => p.id !== planId && p.parentId !== planId);
            this.savePlans();
            this.loadPlans();
            this.updateStats();
            this.showNotification('Plan deleted successfully!', 'success');
            this.closePlanDetailsModal();
        }
    }

    updateStats() {
        const stats = {
            total: this.plans.length,
            active: this.plans.filter(p => p.status === 'active').length,
            completed: this.plans.filter(p => p.status === 'completed').length,
            avgProgress: this.plans.length > 0 ? 
                Math.round(this.plans.reduce((sum, p) => sum + p.progress, 0) / this.plans.length) : 0
        };

        const totalElement = document.getElementById('total-plans');
        const activeElement = document.getElementById('active-plans');
        const completedElement = document.getElementById('completed-plans');
        const avgElement = document.getElementById('avg-progress');

        if (totalElement) totalElement.textContent = stats.total;
        if (activeElement) activeElement.textContent = stats.active;
        if (completedElement) completedElement.textContent = stats.completed;
        if (avgElement) avgElement.textContent = `${stats.avgProgress}%`;
    }

    loadQuickActions() {
        // Populate plan select in event creation
        const planSelect = document.getElementById('event-plan');
        if (planSelect) {
            planSelect.innerHTML = `
                <option value="">Select a plan (optional)</option>
                ${this.plans.map(plan => `
                    <option value="${plan.id}">${plan.title}</option>
                `).join('')}
            `;
        }

        // Populate parent plan select
        const parentPlanSelect = document.getElementById('parent-plan');
        if (parentPlanSelect) {
            parentPlanSelect.innerHTML = `
                <option value="">No parent plan</option>
                ${this.plans.filter(p => !p.parentId).map(plan => `
                    <option value="${plan.id}">${plan.title}</option>
                `).join('')}
            `;
        }
    }

    loadTimeline() {
        const container = document.getElementById('timeline-container');
        if (!container) return;

        const allEvents = [];
        
        // Collect all events from all plans
        this.plans.forEach(plan => {
            if (plan.events) {
                plan.events.forEach(event => {
                    allEvents.push({
                        ...event,
                        planTitle: plan.title
                    });
                });
            }
            
            // Add milestones as events
            if (plan.milestones) {
                plan.milestones.forEach(milestone => {
                    if (milestone.dueDate) {
                        allEvents.push({
                            id: `milestone-${milestone.id}`,
                            title: milestone.title,
                            type: 'milestone',
                            date: milestone.dueDate,
                            time: '00:00',
                            planTitle: plan.title,
                            isMilestone: true
                        });
                    }
                });
            }
        });

        // Sort events by date
        allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (allEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <div class="empty-state-title">No upcoming events</div>
                    <div class="empty-state-description">Create events and milestones to see them here</div>
                </div>
            `;
            return;
        }

        container.innerHTML = allEvents.map(event => `
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${new Date(event.date).toLocaleDateString()}</div>
                    <div class="timeline-title">
                        ${this.getEventIcon(event.type)} ${event.title}
                        ${event.isMilestone ? ' (Milestone)' : ''}
                    </div>
                    <div class="timeline-description">
                        Plan: ${event.planTitle}
                        ${event.time && event.time !== '00:00' ? ` at ${event.time}` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadVisionBoard() {
        const visionItems = ['life-vision', 'year-goals', 'core-values'];
        visionItems.forEach(item => {
            const element = document.getElementById(`${item}-text`);
            if (element) {
                const text = this.visionData[item] || '';
                element.textContent = text || 'Click to add your vision...';
                element.classList.toggle('empty', !text);
                
                element.addEventListener('click', () => {
                    const newText = prompt(`Enter your ${item.replace('-', ' ')}:`, text);
                    if (newText !== null) {
                        this.visionData[item] = newText;
                        localStorage.setItem('visionData', JSON.stringify(this.visionData));
                        element.textContent = newText || 'Click to add your vision...';
                        element.classList.toggle('empty', !newText);
                    }
                });
            }
        });
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <div class="empty-state-title">No plans yet</div>
                <div class="empty-state-description">Create your first plan to start your roadmap journey</div>
                <button class="empty-state-action" onclick="plansManager.openCreatePlanModal()">
                    Create Your First Plan
                </button>
            </div>
        `;
    }

    savePlans() {
        localStorage.setItem('userPlans', JSON.stringify(this.plans));
    }

    notifyTasksPageOfMilestones() {
        const plans = JSON.parse(localStorage.getItem('userPlans') || '[]');
        const milestones = [];
        
        plans.forEach(plan => {
            if (plan.milestones) {
                plan.milestones.forEach(milestone => {
                    milestones.push({
                        id: milestone.id,
                        title: milestone.title,
                        planTitle: plan.title,
                        planId: plan.id
                    });
                });
            }
        });
        
        localStorage.setItem('availableMilestones', JSON.stringify(milestones));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
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
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the plans manager when the page loads
let plansManager;
document.addEventListener('DOMContentLoaded', () => {
    plansManager = new PlansManager();
});
