/**
 * 🚀 MODERN TASK MANAGEMENT SYSTEM 🚀
 * Enhanced, efficient, and incredible task management with full integration
 */

class ModernTaskManager {
    constructor() {
        // Core data storage
        this.tasks = JSON.parse(localStorage.getItem('modernTasks')) || [];
        this.milestones = JSON.parse(localStorage.getItem('modernMilestones')) || [];
        this.filters = { priority: [], status: [], category: [] };
        this.currentView = localStorage.getItem('modernTasksView') || 'kanban';
        this.settings = JSON.parse(localStorage.getItem('modernTasksSettings')) || this.getDefaultSettings();
        
        // Performance optimization
        this.debounceTimeout = null;
        this.animationFrameId = null;
        this.isInitialized = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    getDefaultSettings() {
        return {
            autoSave: true,
            notifications: true,
            animations: true,
            soundEffects: false,
            compactMode: false,
            showDueDates: true,
            showPriorities: true,
            defaultView: 'kanban'
        };
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Setup performance optimizations first
            this.setupPerformanceOptimizations();
            
            // Initialize universal page system integration
            await this.initializePageIntegration();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize views
            this.initializeViews();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup auto-save
            this.setupAutoSave();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('🚀 Modern Task Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Modern Task Manager:', error);
            this.showNotification('Failed to initialize task manager', 'error');
        }
    }
    
    async initializePageIntegration() {
        // Wait for universal page system to be available
        if (typeof window.universalPageSystem !== 'undefined') {
            // Integrate with topbar
            this.integrateWithTopbar();
            
            // Listen for theme changes
            window.addEventListener('themeChanged', (e) => {
                this.handleThemeChange(e.detail);
            });
            
            // Update topbar with task stats
            this.updateTopbarStats();
        }
        
        // Setup global stats integration
        if (typeof window.globalStatsManager !== 'undefined') {
            this.statsManager = window.globalStatsManager;
        }
    }
    
    integrateWithTopbar() {
        // Update user info in topbar
        const username = localStorage.getItem('username') || 'User';
        const userPic = localStorage.getItem('userProfilePic') || 'pfp/Remi-pfp.png';
        
        // Update topbar elements (new structure)
        document.querySelectorAll('#topbar-username').forEach(el => {
            if (el) el.textContent = username;
        });
        
        document.querySelectorAll('#topbar-profile-pic').forEach(el => {
            if (el) {
                // For the new structure, it's a div with initial
                if (userPic && userPic !== 'pfp/Remi-pfp.png') {
                    el.style.backgroundImage = `url(${userPic})`;
                    el.style.backgroundSize = 'cover';
                    el.style.backgroundPosition = 'center';
                    el.textContent = '';
                } else {
                    el.textContent = username.charAt(0).toUpperCase();
                }
            }
        });
        
        // Update coins display
        this.updateCoinsDisplay();
    }
    
    updateTopbarStats() {
        const completedToday = this.getTasksCompletedToday();
        const totalTasks = this.tasks.length;
        const activeStreaks = this.calculateActiveStreaks();
        
        // Update topbar with current stats if elements exist
        const statsElements = document.querySelectorAll('.topbar-stats');
        statsElements.forEach(el => {
            el.innerHTML = `
                <span class="stat-item">
                    <i class="fas fa-tasks"></i>
                    <span>${totalTasks}</span>
                </span>
                <span class="stat-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${completedToday}</span>
                </span>
                <span class="stat-item">
                    <i class="fas fa-fire"></i>
                    <span>${activeStreaks}</span>
                </span>
            `;
        });
    }
    
    updateCoinsDisplay() {
        const coins = parseInt(localStorage.getItem('userCoins')) || 0;
        document.querySelectorAll('#userCoins, #coins-amount, #nav-user-coins').forEach(el => {
            if (el) el.textContent = coins;
        });
    }
    
    handleThemeChange(themeData) {
        // Apply theme changes to task elements
        this.applyThemeToElements(themeData);
        
        // Refresh view to apply new styling
        this.refreshCurrentView();
    }
    
    applyThemeToElements(themeData) {
        const root = document.documentElement;
        
        // Update CSS custom properties if theme data is available
        if (themeData && themeData.colors) {
            root.style.setProperty('--accent-primary', themeData.colors.primary || '#4CAF50');
            root.style.setProperty('--accent-secondary', themeData.colors.secondary || '#2196F3');
            root.style.setProperty('--bg-color', themeData.colors.background || '#1a1a2e');
            root.style.setProperty('--text-color', themeData.colors.text || '#ffffff');
        }
    }
    
    setupEventListeners() {
        // View switching
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(btn.dataset.view);
            });
        });
        
        // Task creation
        const createTaskBtn = document.getElementById('create-task-btn');
        if (createTaskBtn) {
            createTaskBtn.addEventListener('click', () => this.openTaskModal());
        }
        
        // Milestone creation
        const createMilestoneBtn = document.getElementById('create-milestone-btn');
        if (createMilestoneBtn) {
            createMilestoneBtn.addEventListener('click', () => this.openMilestoneModal());
        }
        
        // Modal controls
        this.setupModalControls();
        
        // Filter controls
        this.setupFilterControls();
        
        // Form submissions
        this.setupFormSubmissions();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Window events
        window.addEventListener('beforeunload', () => this.saveAllData());
        window.addEventListener('focus', () => this.refreshData());
    }
    
    setupModalControls() {
        // Task modal
        const taskModal = document.getElementById('task-modal');
        const closeTaskModal = document.getElementById('close-task-modal');
        const cancelTask = document.getElementById('cancel-task');
        
        if (closeTaskModal) closeTaskModal.addEventListener('click', () => this.closeTaskModal());
        if (cancelTask) cancelTask.addEventListener('click', () => this.closeTaskModal());
        
        // Milestone modal
        const milestoneModal = document.getElementById('milestone-modal');
        const closeMilestoneModal = document.getElementById('close-milestone-modal');
        const cancelMilestone = document.getElementById('cancel-milestone');
        
        if (closeMilestoneModal) closeMilestoneModal.addEventListener('click', () => this.closeMilestoneModal());
        if (cancelMilestone) cancelMilestone.addEventListener('click', () => this.closeMilestoneModal());
        
        // Close on overlay click
        if (taskModal) {
            taskModal.addEventListener('click', (e) => {
                if (e.target === taskModal) this.closeTaskModal();
            });
        }
        
        if (milestoneModal) {
            milestoneModal.addEventListener('click', (e) => {
                if (e.target === milestoneModal) this.closeMilestoneModal();
            });
        }
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    setupFilterControls() {
        const filterBtn = document.getElementById('filter-btn');
        const filterMenu = document.getElementById('filter-menu');
        
        if (filterBtn && filterMenu) {
            filterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                filterMenu.classList.toggle('active');
            });
        }
        
        // Close filter menu when clicking outside
        document.addEventListener('click', (e) => {
            if (filterMenu && filterBtn && !filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
                filterMenu.classList.remove('active');
            }
        });
        
        // Filter checkboxes
        document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.debounce(() => this.applyFilters(), 300);
            });
        });
    }
    
    setupFormSubmissions() {
        const saveTaskBtn = document.getElementById('save-task');
        const saveMilestoneBtn = document.getElementById('save-milestone');
        
        if (saveTaskBtn) {
            saveTaskBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }
        
        if (saveMilestoneBtn) {
            saveMilestoneBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveMilestone();
            });
        }
        
        // Form validation on input
        document.querySelectorAll('#task-form input, #task-form textarea, #task-form select').forEach(input => {
            input.addEventListener('input', () => this.validateTaskForm());
        });
        
        document.querySelectorAll('#milestone-form input, #milestone-form textarea, #milestone-form select').forEach(input => {
            input.addEventListener('input', () => this.validateMilestoneForm());
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openTaskModal();
                        break;
                    case 'm':
                        e.preventDefault();
                        this.openMilestoneModal();
                        break;
                    case '1':
                        e.preventDefault();
                        this.switchView('kanban');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchView('timeline');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchView('milestones');
                        break;
                }
            }
        });
    }
    
    setupPerformanceOptimizations() {
        // Implement virtual scrolling for large lists
        try {
            this.virtualScrolling = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadVisibleTasks(entry.target);
                    }
                });
            }, { threshold: 0.1 });
        } catch (error) {
            console.warn('IntersectionObserver not supported, falling back to basic scrolling');
            this.virtualScrolling = null;
        }
        
        // Debounce resize events
        window.addEventListener('resize', () => {
            this.debounce(() => this.handleResize(), 250);
        });
    }
    
    setupAutoSave() {
        if (this.settings.autoSave) {
            // Auto-save every 30 seconds
            setInterval(() => {
                this.saveAllData();
            }, 30000);
        }
    }
    
    async loadInitialData() {
        // Load tasks and milestones
        await this.loadTasks();
        await this.loadMilestones();
        
        // Update statistics
        this.updateStats();
        
        // Load demo data if empty
        if (this.tasks.length === 0 && this.milestones.length === 0) {
            await this.loadDemoData();
        }
        
        // Switch to saved view
        this.switchView(this.currentView);
    }
    
    initializeViews() {
        // Setup drag and drop for kanban
        this.setupDragAndDrop();
        
        // Initialize timeline
        this.initializeTimeline();
        
        // Initialize milestones view
        this.initializeMilestonesView();
        
        // Setup quick actions
        this.setupQuickActions();
    }
    
    switchView(view) {
        if (!['kanban', 'timeline', 'milestones'].includes(view)) return;
        
        this.currentView = view;
        localStorage.setItem('modernTasksView', view);
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Update view content
        document.querySelectorAll('.view-content').forEach(content => {
            const isActive = content.id === `${view}-view`;
            content.classList.toggle('active', isActive);
            
            if (isActive && this.settings.animations) {
                content.style.animation = 'fadeIn 0.5s ease';
            }
        });
        
        // Load view-specific content
        this.loadViewContent(view);
        
        // Update URL without reload
        if (history.replaceState) {
            history.replaceState(null, null, `#${view}`);
        }
    }
    
    loadViewContent(view) {
        switch (view) {
            case 'kanban':
                this.loadKanbanView();
                break;
            case 'timeline':
                this.loadTimelineView();
                break;
            case 'milestones':
                this.loadMilestonesView();
                break;
        }
    }
    
    loadKanbanView() {
        const columns = {
            todo: document.getElementById('todo-column'),
            progress: document.getElementById('progress-column'),
            review: document.getElementById('review-column'),
            done: document.getElementById('done-column')
        };
        
        // Clear existing content
        Object.values(columns).forEach(column => {
            if (column) column.innerHTML = '';
        });
        
        // Filter and group tasks
        const filteredTasks = this.getFilteredTasks();
        const tasksByStatus = this.groupTasksByStatus(filteredTasks);
        
        // Render tasks in each column
        Object.entries(tasksByStatus).forEach(([status, tasks]) => {
            const column = columns[status];
            if (!column) return;
            
            if (tasks.length === 0) {
                column.innerHTML = this.getEmptyStateHTML(status);
            } else {
                tasks.forEach(task => {
                    const taskElement = this.createTaskCard(task);
                    column.appendChild(taskElement);
                    
                    // Setup intersection observer for performance (if available)
                    if (this.virtualScrolling) {
                        this.virtualScrolling.observe(taskElement);
                    }
                });
            }
            
            // Update task count
            const countElement = column.closest('.kanban-column')?.querySelector('.task-count');
            if (countElement) {
                countElement.textContent = tasks.length;
                
                // Animate count change
                if (this.settings.animations) {
                    countElement.style.animation = 'bounce 0.5s ease';
                    setTimeout(() => {
                        countElement.style.animation = '';
                    }, 500);
                }
            }
        });
    }
    
    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.taskId = task.id;
        
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
        const timeAgo = this.getTimeAgo(task.createdAt);
        
        card.innerHTML = `
            <div class="task-priority ${task.priority}"></div>
            <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
            ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
                <span class="task-category">${this.escapeHtml(task.category)}</span>
                ${dueDate ? `<span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                    <i class="fas fa-calendar-alt"></i> ${dueDate}
                </span>` : ''}
            </div>
            ${task.tags && task.tags.length ? `
                <div class="task-tags">
                    ${task.tags.map(tag => `<span class="task-tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="task-footer">
                <span class="task-time">${timeAgo}</span>
                <div class="task-actions">
                    <button class="task-action edit-task" data-task-id="${task.id}" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action delete-task" data-task-id="${task.id}" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${task.status !== 'done' ? `<button class="task-action complete-task" data-task-id="${task.id}" title="Complete task">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
                </div>
            </div>
        `;
        
        // Add event listeners
        this.setupTaskCardEvents(card, task);
        
        return card;
    }
    
    setupTaskCardEvents(card, task) {
        // Edit task
        const editBtn = card.querySelector('.edit-task');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editTask(task.id);
            });
        }
        
        // Delete task
        const deleteBtn = card.querySelector('.delete-task');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(task.id);
            });
        }
        
        // Complete task
        const completeBtn = card.querySelector('.complete-task');
        if (completeBtn) {
            completeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.completeTask(task.id);
            });
        }
        
        // Drag events
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', task.id);
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
        
        // Click to view details
        card.addEventListener('click', () => {
            this.showTaskDetails(task);
        });
    }
    
    setupDragAndDrop() {
        const columns = document.querySelectorAll('.column-content');
        
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                column.classList.add('drag-over');
            });
            
            column.addEventListener('drop', (e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.closest('.kanban-column').dataset.status;
                
                if (taskId && newStatus) {
                    this.updateTaskStatus(taskId, newStatus);
                }
                column.classList.remove('drag-over');
            });
            
            column.addEventListener('dragleave', (e) => {
                if (!column.contains(e.relatedTarget)) {
                    column.classList.remove('drag-over');
                }
            });
        });
    }
    
    async updateTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const oldStatus = task.status;
        task.status = newStatus;
        task.updatedAt = new Date().toISOString();
        
        // Handle completion
        if (newStatus === 'done' && oldStatus !== 'done') {
            task.completedAt = new Date().toISOString();
            await this.handleTaskCompletion(task);
        } else if (oldStatus === 'done' && newStatus !== 'done') {
            task.completedAt = null;
        }
        
        // Save and refresh
        this.saveTasksData();
        this.loadKanbanView();
        this.updateStats();
        this.updateTopbarStats();
        
        // Show notification
        const statusNames = {
            todo: 'To Do',
            progress: 'In Progress',
            review: 'In Review',
            done: 'Completed'
        };
        
        this.showNotification(`Task moved to ${statusNames[newStatus]}`, 'success');
    }
    
    async handleTaskCompletion(task) {
        // Calculate coins
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
        const coins = isOverdue ? 5 : 10;
        
        // Award coins
        if (this.statsManager) {
            this.statsManager.addCoins(coins, `Task completed${isOverdue ? ' (late)' : ''}`);
        } else {
            const currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;
            localStorage.setItem('userCoins', currentCoins + coins);
        }
        
        // Update coins display
        this.updateCoinsDisplay();
        
        // Show completion notification
        this.showNotification(`🎉 Task completed! +${coins} coins`, 'success');
        
        // Play sound effect if enabled
        if (this.settings.soundEffects) {
            this.playCompletionSound();
        }
        
        // Update streaks
        this.updateCompletionStreaks();
    }
    
    openTaskModal(defaultStatus = 'todo') {
        const modal = document.getElementById('task-modal');
        if (!modal) return;
        
        modal.classList.add('active');
        
        // Reset form
        this.resetTaskForm();
        
        // Set default status
        const statusSelect = document.getElementById('task-status');
        if (statusSelect) {
            statusSelect.value = defaultStatus;
        }
        
        // Focus on title input
        setTimeout(() => {
            const titleInput = document.getElementById('task-title');
            if (titleInput) titleInput.focus();
        }, 300);
        
        // Update modal title
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Create New Task';
        }
        
        // Update save button
        const saveBtn = document.getElementById('save-task');
        if (saveBtn) {
            saveBtn.textContent = 'Create Task';
            saveBtn.removeAttribute('data-edit-id');
        }
    }
    
    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.classList.remove('active');
            this.resetTaskForm();
        }
    }
    
    resetTaskForm() {
        const form = document.getElementById('task-form');
        if (form) {
            form.reset();
            
            // Reset to defaults
            const statusSelect = document.getElementById('task-status');
            const prioritySelect = document.getElementById('task-priority');
            const categorySelect = document.getElementById('task-category');
            
            if (statusSelect) statusSelect.value = 'todo';
            if (prioritySelect) prioritySelect.value = 'medium';
            if (categorySelect) categorySelect.value = 'personal';
        }
    }
    
    validateTaskForm() {
        const title = document.getElementById('task-title')?.value.trim();
        const saveBtn = document.getElementById('save-task');
        
        if (saveBtn) {
            saveBtn.disabled = !title;
            saveBtn.classList.toggle('disabled', !title);
        }
    }
    
    saveTask() {
        const titleInput = document.getElementById('task-title');
        const title = titleInput?.value.trim();
        
        if (!title) {
            this.showNotification('Please enter a task title', 'error');
            titleInput?.focus();
            return;
        }
        
        const taskData = this.getTaskFormData();
        const editId = document.getElementById('save-task')?.dataset.editId;
        
        if (editId) {
            // Update existing task
            const taskIndex = this.tasks.findIndex(t => t.id === editId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData, updatedAt: new Date().toISOString() };
                this.showNotification('Task updated successfully!', 'success');
            }
        } else {
            // Create new task
            const newTask = {
                id: this.generateId(),
                ...taskData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: taskData.status === 'done' ? new Date().toISOString() : null
            };
            
            this.tasks.push(newTask);
            
            // Award coins for task creation
            if (this.statsManager) {
                this.statsManager.addCoins(2, 'Task created');
            } else {
                const currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;
                localStorage.setItem('userCoins', currentCoins + 2);
            }
            
            this.updateCoinsDisplay();
            this.showNotification('Task created successfully! +2 coins', 'success');
        }
        
        this.saveTasksData();
        this.loadKanbanView();
        this.updateStats();
        this.updateTopbarStats();
        this.closeTaskModal();
        
        // Dispatch task created event for external systems
        if (!taskId) { // Only for new tasks
            this.dispatchTaskEvent('taskCreated', newTask);
        }
    }
    
    // Method for creating tasks programmatically (for AI and external systems)
    createTaskProgrammatically(taskData) {
        const newTask = {
            id: this.generateId(),
            title: taskData.title || 'Untitled Task',
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'todo',
            dueDate: taskData.dueDate || '',
            category: taskData.category || 'personal',
            tags: taskData.tags || [],
            duration: taskData.duration || null,
            difficulty: taskData.difficulty || 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.tasks.push(newTask);
        
        // Award coins for task creation
        if (this.statsManager) {
            this.statsManager.addCoins(2, 'Task created');
        } else {
            const currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;
            localStorage.setItem('userCoins', currentCoins + 2);
        }
        
        this.updateCoinsDisplay();
        this.showNotification('Task created successfully! +2 coins', 'success');
        
        this.saveTasksData();
        this.loadKanbanView();
        this.updateStats();
        this.updateTopbarStats();
        
        // Dispatch task created event
        this.dispatchTaskEvent('taskCreated', newTask);
        
        return newTask;
    }
    
    // Event dispatch system for task management
    dispatchTaskEvent(eventType, taskData) {
        const event = new CustomEvent(eventType, {
            detail: taskData,
            bubbles: true
        });
        window.dispatchEvent(event);
    }
    
    getTaskFormData() {
        return {
            title: document.getElementById('task-title')?.value.trim() || '',
            description: document.getElementById('task-description')?.value.trim() || '',
            priority: document.getElementById('task-priority')?.value || 'medium',
            status: document.getElementById('task-status')?.value || 'todo',
            dueDate: document.getElementById('task-due-date')?.value || '',
            category: document.getElementById('task-category')?.value || 'personal',
            tags: document.getElementById('task-tags')?.value.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
            duration: document.getElementById('task-duration')?.value ? parseInt(document.getElementById('task-duration').value) : null,
            difficulty: document.getElementById('task-difficulty')?.value || 'medium'
        };
    }
    
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Populate form
        const elements = {
            'task-title': task.title,
            'task-description': task.description || '',
            'task-priority': task.priority,
            'task-status': task.status,
            'task-due-date': task.dueDate || '',
            'task-category': task.category,
            'task-tags': (task.tags || []).join(', '),
            'task-duration': task.duration || '',
            'task-difficulty': task.difficulty || 'medium'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
        
        // Update modal
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('save-task');
        
        if (modalTitle) modalTitle.textContent = 'Edit Task';
        if (saveBtn) {
            saveBtn.textContent = 'Update Task';
            saveBtn.dataset.editId = taskId;
        }
        
        this.openTaskModal();
    }
    
    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasksData();
            this.loadKanbanView();
            this.updateStats();
            this.updateTopbarStats();
            this.showNotification('Task deleted successfully', 'info');
        }
    }
    
    completeTask(taskId) {
        this.updateTaskStatus(taskId, 'done');
    }
    
    // Milestone Management
    openMilestoneModal() {
        const modal = document.getElementById('milestone-modal');
        if (!modal) return;
        
        modal.classList.add('active');
        this.resetMilestoneForm();
        
        setTimeout(() => {
            const titleInput = document.getElementById('milestone-title');
            if (titleInput) titleInput.focus();
        }, 300);
    }
    
    closeMilestoneModal() {
        const modal = document.getElementById('milestone-modal');
        if (modal) {
            modal.classList.remove('active');
            this.resetMilestoneForm();
        }
    }
    
    resetMilestoneForm() {
        const form = document.getElementById('milestone-form');
        if (form) form.reset();
    }
    
    validateMilestoneForm() {
        const title = document.getElementById('milestone-title')?.value.trim();
        const targetDate = document.getElementById('milestone-target-date')?.value;
        const saveBtn = document.getElementById('save-milestone');
        
        if (saveBtn) {
            const isValid = title && targetDate;
            saveBtn.disabled = !isValid;
            saveBtn.classList.toggle('disabled', !isValid);
        }
    }
    
    saveMilestone() {
        const title = document.getElementById('milestone-title')?.value.trim();
        const targetDate = document.getElementById('milestone-target-date')?.value;
        
        if (!title || !targetDate) {
            this.showNotification('Please enter a title and target date', 'error');
            return;
        }
        
        const milestone = {
            id: this.generateId(),
            title,
            description: document.getElementById('milestone-description')?.value.trim() || '',
            targetDate,
            category: document.getElementById('milestone-category')?.value || 'personal',
            reward: document.getElementById('milestone-reward')?.value.trim() || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.milestones.push(milestone);
        this.saveMilestonesData();
        this.loadMilestonesView();
        this.updateStats();
        this.updateTopbarStats();
        this.closeMilestoneModal();
        
        // Award coins for milestone creation
        if (this.statsManager) {
            this.statsManager.addCoins(5, 'Milestone created');
        } else {
            const currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;
            localStorage.setItem('userCoins', currentCoins + 5);
        }
        
        this.updateCoinsDisplay();
        this.showNotification('Milestone created successfully! +5 coins', 'success');
    }
    
    // Data Management
    saveTasksData() {
        try {
            localStorage.setItem('modernTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks:', error);
            this.showNotification('Failed to save tasks', 'error');
        }
    }
    
    saveMilestonesData() {
        try {
            localStorage.setItem('modernMilestones', JSON.stringify(this.milestones));
        } catch (error) {
            console.error('Failed to save milestones:', error);
            this.showNotification('Failed to save milestones', 'error');
        }
    }
    
    saveAllData() {
        this.saveTasksData();
        this.saveMilestonesData();
        localStorage.setItem('modernTasksSettings', JSON.stringify(this.settings));
    }
    
    async loadTasks() {
        try {
            const saved = localStorage.getItem('modernTasks');
            if (saved) {
                this.tasks = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.tasks = [];
        }
    }
    
    async loadMilestones() {
        try {
            const saved = localStorage.getItem('modernMilestones');
            if (saved) {
                this.milestones = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load milestones:', error);
            this.milestones = [];
        }
    }
    
    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }
    
    debounce(func, wait) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(func, wait);
    }
    
    showNotification(message, type = 'info') {
        if (!this.settings.notifications) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--glass-bg, rgba(0, 0, 0, 0.9));
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
            max-width: 350px;
            word-wrap: break-word;
        `;
        
        // Add type-specific styling
        if (type === 'success') {
            notification.style.borderLeft = '4px solid #4CAF50';
        } else if (type === 'error') {
            notification.style.borderLeft = '4px solid #F44336';
        } else if (type === 'info') {
            notification.style.borderLeft = '4px solid #2196F3';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Statistics and Analytics
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'done').length;
        const activeMilestones = this.milestones.filter(m => m.status === 'pending').length;
        
        // Update UI elements
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                if (this.settings.animations) {
                    element.style.animation = 'pulse 0.5s ease';
                    setTimeout(() => {
                        element.style.animation = '';
                    }, 500);
                }
            }
        };
        
        updateElement('total-tasks', totalTasks);
        updateElement('completed-tasks', completedTasks);
        updateElement('active-milestones', activeMilestones);
    }
    
    getTasksCompletedToday() {
        const today = new Date().toDateString();
        return this.tasks.filter(task => 
            task.status === 'done' && 
            task.completedAt && 
            new Date(task.completedAt).toDateString() === today
        ).length;
    }
    
    calculateActiveStreaks() {
        // Calculate consecutive days with completed tasks
        const completedDates = this.tasks
            .filter(task => task.status === 'done' && task.completedAt)
            .map(task => new Date(task.completedAt).toDateString())
            .filter((date, index, array) => array.indexOf(date) === index)
            .sort();
        
        if (completedDates.length === 0) return 0;
        
        let streak = 1;
        let currentDate = new Date(completedDates[completedDates.length - 1]);
        
        for (let i = completedDates.length - 2; i >= 0; i--) {
            const prevDate = new Date(completedDates[i]);
            const daysDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                streak++;
                currentDate = prevDate;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    // Additional helper methods
    getFilteredTasks() {
        // Implementation for filtering tasks based on current filters
        return this.tasks.filter(task => {
            // Add filter logic here
            return true;
        });
    }
    
    groupTasksByStatus(tasks) {
        return {
            todo: tasks.filter(t => t.status === 'todo'),
            progress: tasks.filter(t => t.status === 'progress'),
            review: tasks.filter(t => t.status === 'review'),
            done: tasks.filter(t => t.status === 'done')
        };
    }
    
    getEmptyStateHTML(status) {
        const states = {
            todo: { icon: 'fas fa-clipboard-list', text: 'No tasks yet', button: 'Add Task' },
            progress: { icon: 'fas fa-cog fa-spin', text: 'Nothing in progress', button: 'Add Task' },
            review: { icon: 'fas fa-search', text: 'No tasks in review', button: 'Add Task' },
            done: { icon: 'fas fa-trophy', text: 'Complete tasks to see them here', button: null }
        };
        
        const state = states[status];
        return `
            <div class="empty-state">
                <i class="${state.icon}"></i>
                <p>${state.text}</p>
                ${state.button ? `<button class="quick-add-btn" onclick="window.modernTaskManager.openTaskModal('${status}')">
                    <i class="fas fa-plus"></i> ${state.button}
                </button>` : ''}
            </div>
        `;
    }
    
    refreshCurrentView() {
        this.loadViewContent(this.currentView);
    }
    
    refreshData() {
        // Refresh data when window gains focus
        this.loadTasks();
        this.loadMilestones();
        this.refreshCurrentView();
        this.updateStats();
    }
    
    handleResize() {
        // Handle responsive layout changes
        this.refreshCurrentView();
    }
    
    closeAllModals() {
        this.closeTaskModal();
        this.closeMilestoneModal();
    }
    
    // Timeline and Milestones view methods
    loadTimelineView() {
        const container = document.getElementById('timeline-content');
        if (container) {
            container.innerHTML = `
                <div class="timeline-message">
                    <i class="fas fa-calendar-alt"></i>
                    <h4>Timeline View</h4>
                    <p>Timeline visualization coming soon with enhanced features!</p>
                </div>
            `;
        }
    }
    
    loadMilestonesView() {
        const container = document.getElementById('milestones-grid');
        if (!container) return;
        
        if (this.milestones.length === 0) {
            container.innerHTML = `
                <div class="milestone-empty">
                    <i class="fas fa-mountain"></i>
                    <h4>No milestones yet</h4>
                    <p>Create your first milestone to start tracking major goals</p>
                    <button class="quick-add-btn" onclick="window.modernTaskManager.openMilestoneModal()">
                        <i class="fas fa-plus"></i> Create Milestone
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = '';
            this.milestones.forEach(milestone => {
                container.appendChild(this.createMilestoneCard(milestone));
            });
        }
        
        this.updateMilestoneProgress();
    }
    
    createMilestoneCard(milestone) {
        const card = document.createElement('div');
        card.className = 'milestone-card';
        
        const targetDate = new Date(milestone.targetDate).toLocaleDateString();
        const isOverdue = new Date(milestone.targetDate) < new Date() && milestone.status !== 'completed';
        
        card.innerHTML = `
            <div class="milestone-header">
                <h4 class="milestone-title">${this.escapeHtml(milestone.title)}</h4>
                <span class="milestone-status ${milestone.status}">${milestone.status}</span>
            </div>
            ${milestone.description ? `<p class="milestone-description">${this.escapeHtml(milestone.description)}</p>` : ''}
            <div class="milestone-meta">
                <span class="milestone-date ${isOverdue ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i> ${targetDate}
                </span>
                <span class="milestone-category">${this.escapeHtml(milestone.category)}</span>
            </div>
            ${milestone.reward ? `<div class="milestone-reward">
                <i class="fas fa-gift"></i> ${this.escapeHtml(milestone.reward)}
            </div>` : ''}
            <div class="milestone-actions">
                ${milestone.status !== 'completed' ? `<button class="task-action complete-milestone" onclick="window.modernTaskManager.completeMilestone('${milestone.id}')">
                    <i class="fas fa-flag-checkered"></i> Complete
                </button>` : ''}
                <button class="task-action delete-milestone" onclick="window.modernTaskManager.deleteMilestone('${milestone.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        return card;
    }
    
    completeMilestone(milestoneId) {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;
        
        milestone.status = 'completed';
        milestone.completedAt = new Date().toISOString();
        
        this.saveMilestonesData();
        this.loadMilestonesView();
        this.updateStats();
        
        // Award coins for milestone completion
        if (this.statsManager) {
            this.statsManager.addCoins(25, 'Milestone completed!');
        } else {
            const currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;
            localStorage.setItem('userCoins', currentCoins + 25);
        }
        
        this.updateCoinsDisplay();
        this.showNotification('🎉 Milestone completed! +25 coins', 'success');
    }
    
    deleteMilestone(milestoneId) {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;
        
        if (confirm(`Are you sure you want to delete "${milestone.title}"?`)) {
            this.milestones = this.milestones.filter(m => m.id !== milestoneId);
            this.saveMilestonesData();
            this.loadMilestonesView();
            this.updateStats();
            this.showNotification('Milestone deleted successfully', 'info');
        }
    }
    
    updateMilestoneProgress() {
        const completed = this.milestones.filter(m => m.status === 'completed').length;
        const total = this.milestones.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Update progress ring
        const progressBar = document.getElementById('milestone-progress');
        if (progressBar) {
            const circumference = 2 * Math.PI * 50;
            const offset = circumference - (percentage / 100) * circumference;
            progressBar.style.strokeDashoffset = offset;
        }
        
        // Update percentage text
        const percentageEl = document.getElementById('milestone-percentage');
        if (percentageEl) {
            percentageEl.textContent = `${percentage}%`;
        }
        
        // Update milestone stats
        const completedEl = document.getElementById('completed-milestones');
        const pendingEl = document.getElementById('pending-milestones');
        
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = total - completed;
    }
    
    // Demo data loading
    async loadDemoData() {
        const demoTasks = [
            {
                id: this.generateId(),
                title: 'Welcome to Modern Tasks',
                description: 'This is your first task. You can edit, complete, or delete it!',
                priority: 'high',
                status: 'todo',
                category: 'personal',
                tags: ['welcome', 'demo'],
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: this.generateId(),
                title: 'Explore the Timeline View',
                description: 'Check out the timeline feature to visualize your project schedule',
                priority: 'medium',
                status: 'progress',
                category: 'learning',
                tags: ['timeline', 'features'],
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: null
            }
        ];
        
        const demoMilestones = [
            {
                id: this.generateId(),
                title: 'Master Task Management',
                description: 'Learn to effectively organize and complete your daily tasks',
                targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                category: 'personal',
                reward: 'Treat yourself to a nice dinner',
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: null
            }
        ];
        
        this.tasks = demoTasks;
        this.milestones = demoMilestones;
        this.saveAllData();
    }
    
    // Additional methods for enhanced functionality
    initializeTimeline() {
        // Timeline initialization
    }
    
    initializeMilestonesView() {
        // Milestones view initialization
    }
    
    setupQuickActions() {
        // Setup quick action buttons
        document.querySelectorAll('.quick-add-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const status = btn.dataset.status || 'todo';
                this.openTaskModal(status);
            });
        });
    }
    
    applyFilters() {
        // Filter implementation
        this.refreshCurrentView();
    }
    
    loadVisibleTasks(element) {
        // Virtual scrolling implementation
    }
    
    showTaskDetails(task) {
        // Show task details modal or panel
        console.log('Showing task details:', task);
    }
    
    playCompletionSound() {
        // Play completion sound effect
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkeBjiR2O+8diMFl');
            audio.volume = 0.3;
            audio.play().catch(() => {}); // Ignore errors if audio doesn't play
        } catch (error) {
            // Ignore audio errors
        }
    }
    
    updateCompletionStreaks() {
        // Update user completion streaks
        const currentStreak = this.calculateActiveStreaks();
        localStorage.setItem('userCompletionStreak', currentStreak);
        
        // Update UI if streak display exists
        const streakElements = document.querySelectorAll('.completion-streak');
        streakElements.forEach(el => {
            el.textContent = currentStreak;
        });
    }
}

// Global styles for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        pointer-events: auto;
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .notification:hover {
        transform: translateX(-5px);
    }
`;

if (!document.head.querySelector('style[data-notification-styles]')) {
    notificationStyles.setAttribute('data-notification-styles', 'true');
    document.head.appendChild(notificationStyles);
}

// Initialize the task manager when the script loads
window.modernTaskManager = new ModernTaskManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernTaskManager;
}
