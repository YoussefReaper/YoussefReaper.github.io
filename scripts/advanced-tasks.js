// Advanced Sci-Fi Task Management System
class TaskNexusManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('nexus_tasks') || '[]');
        this.milestones = JSON.parse(localStorage.getItem('nexus_milestones') || '[]');
        this.taskStats = JSON.parse(localStorage.getItem('nexus_task_stats') || '{}');
        this.completionHistory = JSON.parse(localStorage.getItem('nexus_completion_history') || '{}');
        this.continuousTasks = JSON.parse(localStorage.getItem('nexus_continuous_tasks') || '[]');
        this.taskReminders = JSON.parse(localStorage.getItem('nexus_task_reminders') || '{}');
        this.lateTaskHistory = JSON.parse(localStorage.getItem('nexus_late_task_history') || '{}');
        
        // Task status tracking
        this.activeNotifications = new Map();
        this.dailyTaskCheck = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeSampleData();
        this.setupDailyTaskSystem();
        this.processTaskStatuses();
        this.generateDailyTasks();
        this.renderTasks();
        this.renderMilestones();
        this.setupAnimations();
        this.updateMilestoneDropdown();
        this.setupMobileOptimizations();
        this.startNotificationSystem();
        this.startRealTimeUpdates();
    }

    // ===== REAL-TIME UI UPDATES =====
    startRealTimeUpdates() {
        // Update UI every 30 seconds for real-time status changes
        this.realTimeUpdateInterval = setInterval(() => {
            this.processTaskStatuses();
            this.updateTaskDisplays();
        }, 30000);
        
        // Update UI every minute for time-sensitive elements
        this.minuteUpdateInterval = setInterval(() => {
            this.updateTimeDisplays();
            this.checkForStatusChanges();
        }, 60000);
    }

    updateTaskDisplays() {
        this.renderTasks();
        this.updateFloatingNavBadges();
        this.updateActiveModals();
    }

    updateTimeDisplays() {
        // Update time displays in task cards
        document.querySelectorAll('.task-card').forEach(card => {
            const taskId = card.getAttribute('data-task-id');
            if (taskId) {
                this.updateTaskCardTime(card, taskId);
            }
        });
    }

    updateTaskCardTime(card, taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const now = new Date();
        const taskDateTime = new Date(`${task.date}T${task.time}`);
        const timeDiff = taskDateTime.getTime() - now.getTime();
        
        // Add countdown or status indicator
        let timeStatus = '';
        if (timeDiff > 0) {
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            timeStatus = `<div class="task-countdown">⏰ Starts in ${hours}h ${minutes}m</div>`;
        } else if (!task.completed && !task.status) {
            timeStatus = '<div class="task-countdown active">🔥 Active Now!</div>';
        }
        
        // Update or add countdown element
        const existingCountdown = card.querySelector('.task-countdown');
        if (existingCountdown) {
            existingCountdown.remove();
        }
        
        if (timeStatus) {
            card.insertAdjacentHTML('afterbegin', timeStatus);
        }
    }

    checkForStatusChanges() {
        const previousStatuses = this.tasks.map(task => ({
            id: task.id,
            status: task.status,
            completed: task.completed
        }));
        
        this.processTaskStatuses();
        
        // Check for status changes and show notifications
        this.tasks.forEach(task => {
            const previous = previousStatuses.find(p => p.id === task.id);
            if (previous && previous.status !== task.status) {
                this.showStatusChangeNotification(task, previous.status, task.status);
            }
        });
    }

    showStatusChangeNotification(task, oldStatus, newStatus) {
        let message = '';
        let type = 'info';
        
        if (newStatus === 'late' && oldStatus !== 'late') {
            message = `⏰ "${task.name}" is now late!`;
            type = 'warning';
        } else if (newStatus === 'late-about-to-miss' && oldStatus !== 'late-about-to-miss') {
            message = `🚨 "${task.name}" is about to be missed!`;
            type = 'error';
        } else if (newStatus === 'missed' && oldStatus !== 'missed') {
            message = `❌ "${task.name}" has been missed`;
            type = 'error';
        }
        
        if (message) {
            this.showNotification(message, type);
            this.updateTaskDisplays();
        }
    }

    updateFloatingNavBadges() {
        const urgentTasks = this.tasks.filter(task => 
            !task.completed && (task.status === 'late' || task.status === 'late-about-to-miss')
        ).length;
        
        // Update floating nav badge if it exists
        const navOption = document.querySelector('.nav-option[href*="tasks"]');
        if (navOption) {
            let badge = navOption.querySelector('.notification-badge');
            
            if (urgentTasks > 0) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'notification-badge';
                    navOption.appendChild(badge);
                }
                badge.textContent = urgentTasks;
            } else if (badge) {
                badge.remove();
            }
        }
    }

    updateActiveModals() {
        // Update task details modal if open
        const taskModal = document.getElementById('taskDetailsModal');
        if (taskModal && taskModal.classList.contains('active')) {
            const taskId = taskModal.getAttribute('data-current-task-id');
            if (taskId) {
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    this.refreshTaskDetailsModal(task);
                }
            }
        }
        
        // Update milestone details modal if open
        const milestoneModal = document.getElementById('milestoneDetailsModal');
        if (milestoneModal && milestoneModal.classList.contains('active')) {
            const milestoneId = milestoneModal.getAttribute('data-current-milestone-id');
            if (milestoneId) {
                const milestone = this.milestones.find(m => m.id === milestoneId);
                if (milestone) {
                    this.refreshMilestoneDetailsModal(milestone);
                }
            }
        }
    }

    refreshTaskDetailsModal(task) {
        const content = document.getElementById('taskDetailsContent');
        if (!content) return;
        
        const stats = this.getTaskStatistics(task.id);
        
        // Update stats without full regeneration
        const statValues = content.querySelectorAll('.stat-value');
        if (statValues.length >= 4) {
            statValues[0].textContent = stats.totalCompletions;
            statValues[1].textContent = stats.currentStreak;
            statValues[2].textContent = stats.bestStreak;
            statValues[3].textContent = `${task.duration}m`;
        }
        
        // Update calendar
        const calendar = content.querySelector('#taskCalendar');
        if (calendar) {
            calendar.innerHTML = this.generateTaskCalendar(task.id);
        }
        
        // Update completion button
        const completeBtn = content.querySelector('.action-btn');
        if (completeBtn && !task.status === 'missed') {
            completeBtn.innerHTML = `
                <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                ${task.completed ? 'Mark Pending' : 'Complete Mission'}
            `;
        }
    }

    refreshMilestoneDetailsModal(milestone) {
        const content = document.getElementById('milestoneDetailsContent');
        if (!content) return;
        
        const tasks = this.getTasksForMilestone(milestone.id);
        const progress = this.calculateMilestoneProgress(milestone.id);
        
        // Update stats
        const statValues = content.querySelectorAll('.stat-value');
        if (statValues.length >= 4) {
            statValues[0].textContent = tasks.total;
            statValues[1].textContent = tasks.completed;
            statValues[2].textContent = tasks.pending;
            statValues[3].textContent = `${progress}%`;
        }
        
        // Update progress bar
        const progressFill = content.querySelector('.milestone-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        // Update milestone tasks list
        const tasksList = content.querySelector('.milestone-tasks-list');
        if (tasksList) {
            tasksList.innerHTML = this.renderMilestoneTasks(milestone.id);
        }
    }

    setupAnimations() {
        // Add floating particles effect
        this.createFloatingParticles();
        
        // Add smooth scroll animations
        this.setupScrollAnimations();
    }

    initializeSampleData() {
        // Add sample data if no tasks exist (for demo purposes)
        if (this.tasks.length === 0 && this.milestones.length === 0) {
            // Create sample milestone
            const sampleMilestone = {
                id: this.generateId(),
                name: 'Academic Excellence',
                description: 'Complete all coursework and maintain high grades',
                icon: '📚',
                deadline: '2025-12-31',
                color: '#8080ff',
                createdAt: new Date().toISOString(),
                totalTasks: 0,
                completedTasks: 0,
                progress: 0
            };
            
            this.milestones.push(sampleMilestone);
            
            // Create sample tasks
            const sampleTasks = [
                {
                    id: this.generateId(),
                    name: 'Complete Mathematics Assignment',
                    description: 'Solve calculus problems chapter 5-7',
                    priority: 'high',
                    date: new Date().toISOString().split('T')[0],
                    time: '14:00',
                    duration: 90,
                    milestone: sampleMilestone.id,
                    tags: ['math', 'assignment', 'calculus'],
                    completed: false,
                    createdAt: new Date().toISOString(),
                    completedAt: null,
                    streak: 0,
                    totalCompletions: 0
                },
                {
                    id: this.generateId(),
                    name: 'Read Research Papers',
                    description: 'Review latest papers on AI and machine learning',
                    priority: 'medium',
                    date: new Date().toISOString().split('T')[0],
                    time: '16:30',
                    duration: 60,
                    milestone: '',
                    tags: ['research', 'ai', 'reading'],
                    completed: false,
                    createdAt: new Date().toISOString(),
                    completedAt: null,
                    streak: 0,
                    totalCompletions: 0
                },
                {
                    id: this.generateId(),
                    name: 'Morning Exercise',
                    description: 'Daily workout routine - cardio and strength training',
                    priority: 'low',
                    date: new Date().toISOString().split('T')[0],
                    time: '07:00',
                    duration: 45,
                    milestone: '',
                    tags: ['fitness', 'health', 'morning'],
                    completed: true,
                    createdAt: new Date().toISOString(),
                    completedAt: new Date().toISOString(),
                    streak: 5,
                    totalCompletions: 12
                }
            ];
            
            this.tasks.push(...sampleTasks);
            
            // Initialize some sample stats and completion history
            sampleTasks.forEach(task => {
                if (task.completed) {
                    this.taskStats[task.id] = {
                        currentStreak: task.streak,
                        bestStreak: task.streak + 2,
                        totalCompletions: task.totalCompletions
                    };
                    
                    // Add some sample completion history
                    this.completionHistory[task.id] = [];
                    for (let i = 0; i < task.totalCompletions; i++) {
                        const date = new Date();
                        date.setDate(date.getDate() - i);
                        this.completionHistory[task.id].push(date.toISOString().split('T')[0]);
                    }
                }
            });
            
            // Save sample data
            this.saveTasks();
            this.saveMilestones();
            this.saveTaskStats();
            this.saveCompletionHistory();
        }
    }

    setupEventListeners() {
        // Design switch functionality
        this.setupDesignSwitch();
        
        // Modal controls
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openCreateTaskModal());
        document.getElementById('addMilestoneBtn').addEventListener('click', () => this.openCreateMilestoneModal());
        document.getElementById('helpBtn').addEventListener('click', () => this.showModal('helpModal'));
        
        // Continuous task form controls
        const continuousCheckbox = document.getElementById('isContinuousTask');
        const frequencySelect = document.getElementById('taskFrequency');
        const continuousOptions = document.getElementById('continuousTaskOptions');
        const weekDaySelector = document.getElementById('weekDaySelector');
        
        if (continuousCheckbox) {
            continuousCheckbox.addEventListener('change', (e) => {
                continuousOptions.style.display = e.target.checked ? 'block' : 'none';
            });
        }
        
        if (frequencySelect) {
            frequencySelect.addEventListener('change', (e) => {
                const showDaySelector = e.target.value === 'weekly' || e.target.value === 'custom';
                weekDaySelector.style.display = showDaySelector ? 'block' : 'none';
            });
        }
        
        // Close modal buttons
        document.getElementById('closeCreateTaskModal').addEventListener('click', () => this.closeModal('createTaskModal'));
        document.getElementById('closeCreateMilestoneModal').addEventListener('click', () => this.closeModal('createMilestoneModal'));
        document.getElementById('closeTaskDetailsModal').addEventListener('click', () => this.closeModal('taskDetailsModal'));
        document.getElementById('closeMilestoneDetailsModal').addEventListener('click', () => this.closeModal('milestoneDetailsModal'));
        document.getElementById('closeNotesModal').addEventListener('click', () => this.closeModal('notesModal'));
        document.getElementById('closeHelpModal').addEventListener('click', () => this.closeModal('helpModal'));
        
        // Cancel buttons
        document.getElementById('cancelCreateTask').addEventListener('click', () => this.closeModal('createTaskModal'));
        document.getElementById('cancelCreateMilestone').addEventListener('click', () => this.closeModal('createMilestoneModal'));
        
        // Form submissions
        document.getElementById('createTaskForm').addEventListener('submit', (e) => this.handleCreateTask(e));
        document.getElementById('createMilestoneForm').addEventListener('submit', (e) => this.handleCreateMilestone(e));
        
        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.openCreateTaskModal();
        }
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            this.openCreateMilestoneModal();
        }
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
            e.preventDefault();
            this.clearAllData();
        }
    }

    clearAllData() {
        if (confirm('⚠️ WARNING: This will delete ALL tasks, milestones, and statistics. This action cannot be undone!\n\nAre you absolutely sure you want to continue?')) {
            localStorage.removeItem('nexus_tasks');
            localStorage.removeItem('nexus_milestones');
            localStorage.removeItem('nexus_task_stats');
            localStorage.removeItem('nexus_completion_history');
            
            this.tasks = [];
            this.milestones = [];
            this.taskStats = {};
            this.completionHistory = {};
            
            this.renderTasks();
            this.renderMilestones();
            this.updateMilestoneDropdown();
            
            this.showNotification('All data cleared successfully! 🗑️', 'info');
        }
    }

    openCreateTaskModal() {
        this.showModal('createTaskModal');
        document.getElementById('taskName').focus();
        this.setDefaultTaskValues();
    }

    openCreateMilestoneModal() {
        this.showModal('createMilestoneModal');
        document.getElementById('milestoneName').focus();
    }

    setDefaultTaskValues() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);
        
        document.getElementById('taskDate').value = today;
        document.getElementById('taskTime').value = time;
        document.getElementById('taskDuration').value = '60';
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset forms
        const form = modal.querySelector('form');
        if (form) form.reset();
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    handleCreateTask(e) {
        e.preventDefault();
        
        // Show immediate form feedback
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Deploying Mission...';
        submitBtn.disabled = true;
        
        const formData = new FormData(e.target);
        const isContinuous = document.getElementById('isContinuousTask').checked;
        
        try {
            if (isContinuous) {
                // Create continuous task
                this.createContinuousTask(formData);
            } else {
                // Create one-time task
                this.createOneTimeTask(formData);
            }
            
            // Reset form with animation
            this.resetFormWithAnimation(e.target);
            
        } catch (error) {
            console.error('Error creating task:', error);
            this.showNotification('Error creating mission. Please try again.', 'error');
        } finally {
            // Reset button state
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1000);
        }
        
        this.closeModal('createTaskModal');
    }

    resetFormWithAnimation(form) {
        // Flash success color
        form.style.transition = 'all 0.3s ease';
        form.style.background = 'rgba(64, 224, 255, 0.1)';
        form.style.borderColor = '#40e0ff';
        
        setTimeout(() => {
            form.reset();
            form.style.background = '';
            form.style.borderColor = '';
        }, 300);
    }

    createOneTimeTask(formData) {
        const task = {
            id: this.generateId(),
            name: formData.get('taskName') || document.getElementById('taskName').value,
            description: formData.get('taskDescription') || document.getElementById('taskDescription').value,
            priority: formData.get('taskPriority') || document.getElementById('taskPriority').value,
            date: formData.get('taskDate') || document.getElementById('taskDate').value,
            time: formData.get('taskTime') || document.getElementById('taskTime').value,
            duration: parseInt(formData.get('taskDuration') || document.getElementById('taskDuration').value),
            milestone: formData.get('taskMilestone') || document.getElementById('taskMilestone').value,
            tags: (formData.get('taskTags') || document.getElementById('taskTags').value).split(',').map(tag => tag.trim()).filter(tag => tag),
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            streak: 0,
            totalCompletions: 0,
            status: null
        };

        this.tasks.push(task);
        this.saveTasks();
        
        // Immediate UI update with animation
        this.addTaskToUIImmediate(task);
        
        // Set up reminders
        this.setupTaskReminders(task.id);
        
        this.showNotification('Mission deployed successfully! 🚀', 'success');
        
        // Update milestone task count
        if (task.milestone) {
            this.updateMilestoneTaskCount(task.milestone);
            this.renderMilestones(); // Update milestones display
        }
        
        // Update floating nav badges
        this.updateFloatingNavBadges();
    }

    addTaskToUIImmediate(task) {
        const container = document.getElementById('tasksGrid');
        if (!container) return;
        
        // Hide empty state if visible
        const emptyState = document.getElementById('tasksEmptyState');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Create and insert task card with animation
        const taskCard = this.createTaskCard(task, 0);
        taskCard.style.opacity = '0';
        taskCard.style.transform = 'translateY(20px)';
        
        // Insert at the beginning for new tasks
        container.insertBefore(taskCard, container.firstChild);
        
        // Animate in
        setTimeout(() => {
            taskCard.style.transition = 'all 0.5s ease';
            taskCard.style.opacity = '1';
            taskCard.style.transform = 'translateY(0)';
        }, 50);
        
        // Add creation celebration
        this.triggerTaskCreationCelebration(taskCard);
    }

    triggerTaskCreationCelebration(taskCard) {
        // Brief glow effect for new task
        taskCard.style.boxShadow = '0 0 30px rgba(64, 224, 255, 0.6)';
        taskCard.style.borderColor = '#40e0ff';
        
        setTimeout(() => {
            taskCard.style.boxShadow = '';
            taskCard.style.borderColor = '';
        }, 1500);
    }

    addContinuousTaskToUIImmediate(continuousTask) {
        const container = document.getElementById('continuousTasksList');
        if (!container) return;
        
        // Hide empty state if visible
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Create and insert continuous task item with animation
        const taskItem = this.createContinuousTaskItem(continuousTask);
        if (!taskItem) return;
        
        taskItem.style.opacity = '0';
        taskItem.style.transform = 'translateX(-20px)';
        
        // Insert at the beginning for new tasks
        container.insertBefore(taskItem, container.firstChild);
        
        // Animate in
        setTimeout(() => {
            taskItem.style.transition = 'all 0.5s ease';
            taskItem.style.opacity = '1';
            taskItem.style.transform = 'translateX(0)';
        }, 50);
        
        // Add creation celebration
        this.triggerContinuousTaskCreationCelebration(taskItem);
    }

    triggerContinuousTaskCreationCelebration(taskItem) {
        // Brief pulse effect for new continuous task
        taskItem.style.background = 'linear-gradient(135deg, rgba(128, 0, 255, 0.2), rgba(64, 224, 255, 0.2))';
        taskItem.style.borderColor = '#8000ff';
        
        setTimeout(() => {
            taskItem.style.background = '';
            taskItem.style.borderColor = '';
        }, 2000);
    }

    removeTaskFromUIImmediate(taskCard) {
        if (!taskCard) return;
        
        // Animate out
        taskCard.style.transition = 'all 0.4s ease';
        taskCard.style.opacity = '0';
        taskCard.style.transform = 'translateX(100px) scale(0.8)';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (taskCard.parentNode) {
                taskCard.parentNode.removeChild(taskCard);
            }
        }, 400);
    }

    removeMilestoneFromUIImmediate(milestoneCard) {
        if (!milestoneCard) return;
        
        // Animate out
        milestoneCard.style.transition = 'all 0.5s ease';
        milestoneCard.style.opacity = '0';
        milestoneCard.style.transform = 'translateY(-30px) scale(0.8)';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (milestoneCard.parentNode) {
                milestoneCard.parentNode.removeChild(milestoneCard);
            }
        }, 500);
    }

    createContinuousTask(formData) {
        const frequency = document.getElementById('taskFrequency').value;
        let weekDays = [];
        
        if (frequency === 'weekly' || frequency === 'custom') {
            const checkboxes = document.querySelectorAll('input[name="weekDays"]:checked');
            weekDays = Array.from(checkboxes).map(cb => parseInt(cb.value));
        }
        
        const continuousTask = {
            id: this.generateId(),
            name: formData.get('taskName') || document.getElementById('taskName').value,
            description: formData.get('taskDescription') || document.getElementById('taskDescription').value,
            priority: formData.get('taskPriority') || document.getElementById('taskPriority').value,
            time: formData.get('taskTime') || document.getElementById('taskTime').value,
            duration: parseInt(formData.get('taskDuration') || document.getElementById('taskDuration').value),
            milestone: formData.get('taskMilestone') || document.getElementById('taskMilestone').value,
            tags: (formData.get('taskTags') || document.getElementById('taskTags').value).split(',').map(tag => tag.trim()).filter(tag => tag),
            frequency: frequency,
            weekDays: weekDays,
            customDays: frequency === 'custom' ? weekDays : null,
            createdAt: new Date().toISOString(),
            active: true
        };

        this.continuousTasks.push(continuousTask);
        this.saveContinuousTasks();
        
        // Generate today's task if applicable
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = new Date().getDay();
        
        if (this.shouldGenerateTaskToday(continuousTask, dayOfWeek)) {
            const newTask = this.createTaskFromContinuous(continuousTask, today);
            this.tasks.push(newTask);
            this.saveTasks();
            
            // Set up reminders for today's task
            this.setupTaskReminders(newTask.id);
        }
        
        this.renderTasks();
        this.showNotification('Continuous mission protocol established! �', 'success');
        
        // Update milestone task count
        if (continuousTask.milestone) {
            this.updateMilestoneTaskCount(continuousTask.milestone);
        }
    }

    setupTaskReminders(taskId) {
        const remindersInput = document.getElementById('taskReminders').value;
        if (!remindersInput.trim()) return;
        
        try {
            const reminderMinutes = remindersInput.split(',')
                .map(r => parseInt(r.trim()))
                .filter(r => !isNaN(r) && r > 0)
                .sort((a, b) => b - a); // Sort descending
            
            if (reminderMinutes.length > 0) {
                this.taskReminders[taskId] = reminderMinutes;
                this.saveTaskReminders();
            }
        } catch (error) {
            console.warn('Error setting up reminders:', error);
        }
    }

    handleCreateMilestone(e) {
        e.preventDefault();
        
        // Show immediate form feedback
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Establishing Milestone...';
        submitBtn.disabled = true;
        
        const formData = new FormData(e.target);
        
        try {
            const milestone = {
                id: this.generateId(),
                name: formData.get('milestoneName') || document.getElementById('milestoneName').value,
                description: formData.get('milestoneDescription') || document.getElementById('milestoneDescription').value,
                icon: formData.get('milestoneIcon') || document.getElementById('milestoneIcon').value,
                deadline: formData.get('milestoneDeadline') || document.getElementById('milestoneDeadline').value,
                color: formData.get('milestoneColor') || document.getElementById('milestoneColor').value,
                createdAt: new Date().toISOString(),
                totalTasks: 0,
                completedTasks: 0,
                progress: 0
            };

            this.milestones.push(milestone);
            this.saveMilestones();
            
            // Immediate UI update - add milestone to grid
            this.addMilestoneToUIImmediate(milestone);
            
            this.updateMilestoneDropdown();
            this.showNotification('Strategic milestone established! 🎯', 'success');
            
            // Update floating nav badges
            this.updateFloatingNavBadges();
            
            // Reset form with animation
            this.resetFormWithAnimation(e.target);
            
        } catch (error) {
            console.error('Error creating milestone:', error);
            this.showNotification('Error creating milestone. Please try again.', 'error');
        } finally {
            // Reset button state
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1000);
        }
        
        this.closeModal('createMilestoneModal');
    }

    renderTasks() {
        const container = document.getElementById('tasksGrid');
        const emptyState = document.getElementById('tasksEmptyState');
        
        // Check if elements exist to prevent errors
        if (!container || !emptyState) {
            console.warn('Tasks container or empty state element not found');
            return;
        }
        
        if (this.tasks.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Separate tasks by status and completion
        const lateTasks = this.tasks.filter(task => 
            !task.completed && (task.status === 'late' || task.status === 'late-about-to-miss')
        );
        const missedTasks = this.tasks.filter(task => task.status === 'missed');
        const normalTasks = this.tasks.filter(task => 
            !lateTasks.includes(task) && !missedTasks.includes(task)
        );
        
        // Sort each category
        const sortedLateTasks = this.sortTasksByPriority(lateTasks);
        const sortedMissedTasks = this.sortTasksByPriority(missedTasks);
        const sortedNormalTasks = this.sortTasksByCompletion(normalTasks);
        
        container.innerHTML = '';
        
        // Render late/missed tasks section if any exist
        if (lateTasks.length > 0 || missedTasks.length > 0) {
            this.renderUrgentTasksSection(container, sortedLateTasks, sortedMissedTasks);
        }
        
        // Render normal tasks
        let index = lateTasks.length + missedTasks.length;
        sortedNormalTasks.forEach((task) => {
            const taskCard = this.createTaskCard(task, index);
            container.appendChild(taskCard);
            index++;
        });
    }

    renderUrgentTasksSection(container, lateTasks, missedTasks) {
        // Create urgent tasks header
        const urgentHeader = document.createElement('div');
        urgentHeader.className = 'urgent-tasks-header';
        urgentHeader.innerHTML = `
            <h3 style="color: #ff6b6b; margin: 0; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i>
                Urgent Attention Required
            </h3>
            <p style="color: rgba(255, 255, 255, 0.7); margin: 5px 0 0 0; font-size: 0.9rem;">
                Tasks requiring immediate action
            </p>
        `;
        urgentHeader.style.cssText = `
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid rgba(255, 107, 107, 0.3);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
        `;
        container.appendChild(urgentHeader);
        
        // Render late tasks
        lateTasks.forEach((task, index) => {
            const taskCard = this.createTaskCard(task, index);
            taskCard.classList.add('urgent-task');
            container.appendChild(taskCard);
        });
        
        // Render missed tasks
        missedTasks.forEach((task, index) => {
            const taskCard = this.createTaskCard(task, lateTasks.length + index);
            taskCard.classList.add('missed-task');
            container.appendChild(taskCard);
        });
    }

    sortTasksByPriority(tasks) {
        return tasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    sortTasksByCompletion(tasks) {
        return tasks.sort((a, b) => {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            if (!a.completed && !b.completed) {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(b.completedAt || 0) - new Date(a.completedAt || 0);
        });
    }

    createTaskCard(task, index) {
        const card = document.createElement('div');
        let cardClass = `task-card ${task.completed ? 'completed' : ''}`;
        
        // Add status-based classes
        if (task.status === 'late') cardClass += ' late-task';
        if (task.status === 'late-about-to-miss') cardClass += ' late-about-to-miss-task';
        if (task.status === 'missed') cardClass += ' missed-task';
        
        card.className = cardClass;
        card.style.animationDelay = `${index * 0.1}s`;
        card.setAttribute('data-task-id', task.id);
        
        const datetime = new Date(`${task.date}T${task.time}`);
        const timeStr = datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = datetime.toLocaleDateString();
        
        const streak = this.getTaskStreak(task.id);
        const completions = this.getTaskCompletions(task.id);
        
        // Status indicator
        let statusIndicator = '';
        if (task.status === 'late') {
            statusIndicator = '<div class="task-status-badge late">⏰ LATE</div>';
        } else if (task.status === 'late-about-to-miss') {
            statusIndicator = '<div class="task-status-badge about-to-miss">⚠️ ABOUT TO MISS</div>';
        } else if (task.status === 'missed') {
            statusIndicator = '<div class="task-status-badge missed">❌ MISSED</div>';
        } else if (task.completedLate) {
            statusIndicator = '<div class="task-status-badge completed-late">🟡 COMPLETED LATE</div>';
        }
        
        // Completion button or missed indicator
        let actionSection = '';
        if (task.status === 'missed') {
            actionSection = '<div class="task-missed-indicator">Task cannot be completed (missed)</div>';
        } else {
            actionSection = `
                <button class="task-complete-btn ${task.completed ? 'completed' : ''}" 
                        onclick="window.taskNexus.completeTask('${task.id}')"
                        ${task.status === 'missed' ? 'disabled' : ''}>
                    <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                    ${task.completed ? 'Undo' : 'Complete'}
                </button>
            `;
        }
        
        card.innerHTML = `
            <div class="task-priority ${task.priority}"></div>
            ${statusIndicator}
            <h3 class="task-name">${task.name}</h3>
            <p class="task-description">${task.description || 'No mission brief provided'}</p>
            <div class="task-meta">
                <div class="task-time">
                    <i class="fas fa-clock"></i>
                    ${dateStr} ${timeStr}
                </div>
                <div class="task-streak">
                    <i class="fas fa-fire"></i>
                    ${streak} streak
                </div>
            </div>
            <div class="task-meta">
                <div class="task-time">
                    <i class="fas fa-hourglass-half"></i>
                    ${task.duration}min
                </div>
                <div class="task-streak">
                    <i class="fas fa-check-circle"></i>
                    ${completions}x done
                </div>
            </div>
            ${actionSection}
        `;
        
        // Make card clickable but prevent event bubbling from buttons
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.openTaskDetails(task);
            }
        });
        
        return card;
    }

    renderMilestones() {
        const container = document.getElementById('milestonesGrid');
        const emptyState = document.getElementById('milestonesEmptyState');
        
        // Check if elements exist to prevent errors
        if (!container || !emptyState) {
            console.warn('Milestones container or empty state element not found');
            return;
        }
        
        if (this.milestones.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        container.innerHTML = '';
        
        this.milestones.forEach((milestone, index) => {
            const milestoneCard = this.createMilestoneCard(milestone, index);
            container.appendChild(milestoneCard);
        });
    }

    createMilestoneCard(milestone, index) {
        const card = document.createElement('div');
        card.className = 'milestone-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const progress = this.calculateMilestoneProgress(milestone.id);
        const tasks = this.getTasksForMilestone(milestone.id);
        
        card.innerHTML = `
            <div class="milestone-header">
                <div class="milestone-name">
                    <span style="font-size: 1.2em; margin-right: 8px;">${milestone.icon}</span>
                    ${milestone.name}
                </div>
                <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
                    ${progress}% complete
                </div>
            </div>
            <div class="milestone-progress">
                <div class="milestone-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="milestone-stats">
                <span>${tasks.completed}/${tasks.total} tasks</span>
                <span>${tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0}% done</span>
            </div>
        `;
        
        card.addEventListener('click', () => this.openMilestoneDetails(milestone));
        
        return card;
    }

    addMilestoneToUIImmediate(milestone) {
        const container = document.getElementById('milestonesGrid');
        const emptyState = document.getElementById('milestonesEmptyState');
        
        if (!container) return;
        
        // Hide empty state if visible
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Create and insert milestone card with animation
        const milestoneCard = this.createMilestoneCard(milestone, 0);
        milestoneCard.style.opacity = '0';
        milestoneCard.style.transform = 'translateY(20px) scale(0.95)';
        
        // Insert at the beginning for new milestones
        container.insertBefore(milestoneCard, container.firstChild);
        
        // Animate in
        setTimeout(() => {
            milestoneCard.style.transition = 'all 0.6s ease';
            milestoneCard.style.opacity = '1';
            milestoneCard.style.transform = 'translateY(0) scale(1)';
        }, 50);
        
        // Add creation celebration
        this.triggerMilestoneCreationCelebration(milestoneCard);
    }

    triggerMilestoneCreationCelebration(milestoneCard) {
        // Brief cosmic glow effect for new milestone
        milestoneCard.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.6), 0 0 60px rgba(128, 0, 255, 0.3)';
        milestoneCard.style.borderColor = '#ffd700';
        
        setTimeout(() => {
            milestoneCard.style.boxShadow = '';
            milestoneCard.style.borderColor = '';
        }, 2500);
    }

    openTaskDetails(task) {
        const modal = document.getElementById('taskDetailsModal');
        const content = document.getElementById('taskDetailsContent');
        
        const stats = this.getTaskStatistics(task.id);
        const completionHistory = this.getTaskCompletionHistory(task.id);
        
        content.innerHTML = `
            <div class="task-detail-header">
                <h2 class="task-detail-title">${task.name}</h2>
                <div class="task-detail-priority ${task.priority}">
                    ${task.priority.toUpperCase()} PRIORITY
                </div>
            </div>
            
            <div class="task-stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${stats.totalCompletions}</span>
                    <div class="stat-label">Total Completions</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.currentStreak}</span>
                    <div class="stat-label">Current Streak</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.bestStreak}</span>
                    <div class="stat-label">Best Streak</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${task.duration}m</span>
                    <div class="stat-label">Duration</div>
                </div>
            </div>
            
            <div class="calendar-container">
                <div class="calendar-header">Mission Completion Calendar</div>
                <div class="calendar-grid" id="taskCalendar">
                    ${this.generateTaskCalendar(task.id)}
                </div>
            </div>
            
            <div class="task-description-section">
                <h3 style="color: #40e0ff; margin-bottom: 10px;">Mission Brief</h3>
                <p style="color: rgba(255, 255, 255, 0.8); line-height: 1.6;">
                    ${task.description || 'No detailed mission brief provided.'}
                </p>
            </div>
            
            <div class="task-actions-grid">
                <button class="action-btn" onclick="window.taskNexus.completeTask('${task.id}')">
                    <i class="fas fa-check"></i>
                    ${task.completed ? 'Mark Pending' : 'Complete Mission'}
                </button>
                <button class="action-btn" onclick="window.taskNexus.editTask('${task.id}')">
                    <i class="fas fa-edit"></i>
                    Edit Mission
                </button>
                <button class="action-btn" onclick="window.taskNexus.viewTaskNotes('${task.id}')">
                    <i class="fas fa-sticky-note"></i>
                    View Notes
                </button>
                <button class="action-btn" onclick="window.taskNexus.deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i>
                    Delete Mission
                </button>
            </div>
        `;
        
        this.showModal('taskDetailsModal');
    }

    openMilestoneDetails(milestone) {
        const modal = document.getElementById('milestoneDetailsModal');
        const content = document.getElementById('milestoneDetailsContent');
        
        const tasks = this.getTasksForMilestone(milestone.id);
        const progress = this.calculateMilestoneProgress(milestone.id);
        
        content.innerHTML = `
            <div class="task-detail-header">
                <h2 class="task-detail-title">
                    <span style="font-size: 1.2em; margin-right: 10px;">${milestone.icon}</span>
                    ${milestone.name}
                </h2>
                <div style="color: #40e0ff; font-size: 1rem;">
                    ${progress}% Complete
                </div>
            </div>
            
            <div class="task-stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${tasks.total}</span>
                    <div class="stat-label">Total Missions</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${tasks.completed}</span>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${tasks.pending}</span>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${progress}%</span>
                    <div class="stat-label">Progress</div>
                </div>
            </div>
            
            <div style="margin: 25px 0;">
                <div class="milestone-progress" style="height: 12px;">
                    <div class="milestone-progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            
            <div class="milestone-description-section">
                <h3 style="color: #40e0ff; margin-bottom: 10px;">Strategic Overview</h3>
                <p style="color: rgba(255, 255, 255, 0.8); line-height: 1.6;">
                    ${milestone.description || 'No strategic description provided.'}
                </p>
            </div>
            
            <div class="milestone-tasks-section">
                <h3 style="color: #40e0ff; margin-bottom: 15px;">Associated Missions</h3>
                <div class="milestone-tasks-list">
                    ${this.renderMilestoneTasks(milestone.id)}
                </div>
            </div>
            
            <div class="task-actions-grid">
                <button class="action-btn" onclick="window.taskNexus.editMilestone('${milestone.id}')">
                    <i class="fas fa-edit"></i>
                    Edit Milestone
                </button>
                <button class="action-btn" onclick="window.taskNexus.viewMilestoneNotes('${milestone.id}')">
                    <i class="fas fa-sticky-note"></i>
                    View Notes
                </button>
                <button class="action-btn" onclick="window.taskNexus.deleteMilestone('${milestone.id}')">
                    <i class="fas fa-trash"></i>
                    Delete Milestone
                </button>
            </div>
        `;
        
        this.showModal('milestoneDetailsModal');
    }

    renderMilestoneTasks(milestoneId) {
        const tasks = this.tasks.filter(task => task.milestone === milestoneId);
        
        if (tasks.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5); text-align: center; padding: 20px;">No missions assigned to this milestone</p>';
        }
        
        return tasks.map(task => `
            <div class="milestone-task-item" style="
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(64, 224, 255, 0.2);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                ${task.completed ? 'opacity: 0.6;' : ''}
            ">
                <div>
                    <div style="color: white; font-weight: 600; margin-bottom: 4px;">${task.name}</div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem;">
                        ${new Date(task.date + 'T' + task.time).toLocaleDateString()} • ${task.duration}min
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="task-priority ${task.priority}" style="width: 8px; height: 8px;"></div>
                    ${task.completed ? '<i class="fas fa-check-circle" style="color: #2ed573;"></i>' : '<i class="fas fa-clock" style="color: #ffa502;"></i>'}
                </div>
            </div>
        `).join('');
    }

    generateTaskCalendar(taskId) {
        const completions = this.getTaskCompletionHistory(taskId);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        let calendar = '';
        
        // Day headers
        const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayHeaders.forEach(day => {
            calendar += `<div style="color: #40e0ff; font-weight: 600; text-align: center; padding: 8px;">${day}</div>`;
        });
        
        // Empty cells for first week
        const startDay = firstDay.getDay();
        for (let i = 0; i < startDay; i++) {
            calendar += '<div class="calendar-day"></div>';
        }
        
        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const completion = completions.find(comp => 
                (typeof comp === 'string' ? comp : comp.date) === dateStr
            );
            
            const isToday = day === today.getDate();
            let dayClass = 'calendar-day';
            let dayStyle = '';
            
            if (completion) {
                const completionType = typeof completion === 'string' ? 'normal' : completion.type;
                if (completionType === 'late') {
                    dayClass += ' completed-late';
                    dayStyle = 'background: #ffa502; color: white;';
                } else {
                    dayClass += ' completed';
                    dayStyle = 'background: #2ed573; color: white;';
                }
            }
            
            if (isToday) {
                dayStyle += ' border: 2px solid #40e0ff;';
            }
            
            calendar += `
                <div class="${dayClass}" style="${dayStyle}">
                    ${day}
                </div>
            `;
        }
        
        return calendar;
    }

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.status === 'missed') return;
        
        const wasCompleted = task.completed;
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        
        // Immediate UI feedback
        this.updateTaskCardImmediate(taskId, task);
        
        if (task.completed) {
            // Determine completion type based on status
            let completionType = 'normal';
            let coinReward = 10; // Normal completion: 10 coins
            
            if (task.status === 'late' || task.status === 'late-about-to-miss') {
                completionType = 'late';
                task.completedLate = true;
                coinReward = 5; // Late completion: 5 coins
            }
            
            this.recordTaskCompletion(taskId, completionType);
            
            // Add coin rewards
            const rewardReason = completionType === 'late' ? 
                'Late task completion' : 'Task completion';
            this.addCoins(coinReward, rewardReason);
            
            // Clear status when completed
            task.status = null;
            
            const message = completionType === 'late' ? 
                `Mission completed late! 🟡 (+${coinReward} coins)` : 
                `Mission completed! 🎯 (+${coinReward} coins)`;
            this.showNotification(message, 'success');
            
            // Celebration animation for normal completion
            if (completionType === 'normal') {
                this.triggerCompletionCelebration(taskId);
            }
        } else {
            // If uncompleting, reprocess status (no coin deduction for uncompleting)
            task.completedLate = false;
            this.processTaskStatuses();
            this.showNotification('Mission marked as pending 📋', 'info');
        }
        
        this.saveTasks();
        this.updateTaskDisplays();
        this.updateMilestoneProgress();
        this.closeModal('taskDetailsModal');
    }

    updateTaskCardImmediate(taskId, task) {
        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskCard) return;
        
        // Update completion state immediately
        if (task.completed) {
            taskCard.classList.add('completed');
        } else {
            taskCard.classList.remove('completed');
        }
        
        // Update completion button if it exists
        const completeBtn = taskCard.querySelector('.task-complete-btn');
        if (completeBtn) {
            completeBtn.innerHTML = `
                <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                ${task.completed ? 'Undo' : 'Complete'}
            `;
            completeBtn.classList.toggle('completed', task.completed);
        }
        
        // Update status badges
        this.updateTaskCardStatus(taskCard, task);
    }

    updateTaskCardStatus(taskCard, task) {
        // Remove existing status badges
        const existingBadges = taskCard.querySelectorAll('.task-status-badge');
        existingBadges.forEach(badge => badge.remove());
        
        // Add new status badge if needed
        let statusBadge = '';
        if (task.status === 'late') {
            statusBadge = '<div class="task-status-badge late">⏰ LATE</div>';
        } else if (task.status === 'late-about-to-miss') {
            statusBadge = '<div class="task-status-badge about-to-miss">⚠️ ABOUT TO MISS</div>';
        } else if (task.status === 'missed') {
            statusBadge = '<div class="task-status-badge missed">❌ MISSED</div>';
        } else if (task.completedLate) {
            statusBadge = '<div class="task-status-badge completed-late">🟡 COMPLETED LATE</div>';
        }
        
        if (statusBadge) {
            taskCard.insertAdjacentHTML('afterbegin', statusBadge);
        }
        
        // Update card classes for styling
        taskCard.classList.toggle('late-task', task.status === 'late');
        taskCard.classList.toggle('late-about-to-miss-task', task.status === 'late-about-to-miss');
        taskCard.classList.toggle('missed-task', task.status === 'missed');
    }

    triggerCompletionCelebration(taskId) {
        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskCard) return;
        
        // Add celebration animation
        taskCard.style.transform = 'scale(1.05)';
        taskCard.style.boxShadow = '0 15px 40px rgba(46, 213, 115, 0.5)';
        taskCard.style.borderColor = '#2ed573';
        
        // Create floating success indicator
        const celebration = document.createElement('div');
        celebration.innerHTML = '🎉';
        celebration.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            z-index: 1000;
            animation: celebrationFloat 1s ease-out forwards;
            pointer-events: none;
        `;
        
        taskCard.style.position = 'relative';
        taskCard.appendChild(celebration);
        
        // Reset after animation
        setTimeout(() => {
            taskCard.style.transform = '';
            taskCard.style.boxShadow = '';
            taskCard.style.borderColor = '';
            if (celebration.parentNode) {
                celebration.remove();
            }
        }, 1000);
    }

    updateMilestoneProgress() {
        // Update all milestones immediately
        this.milestones.forEach(milestone => {
            this.updateMilestoneTaskCount(milestone.id);
        });
        this.renderMilestones();
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this mission? This action cannot be undone.')) {
            // Find the task card before deleting
            const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
            
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            
            // Remove from UI immediately with animation
            if (taskCard) {
                this.removeTaskFromUIImmediate(taskCard);
            }
            
            this.closeModal('taskDetailsModal');
            this.showNotification('Mission deleted successfully', 'info');
            
            // Update floating nav badges
            this.updateFloatingNavBadges();
            
            // Check if no tasks left to show empty state
            setTimeout(() => {
                const container = document.getElementById('tasksGrid');
                const emptyState = document.getElementById('tasksEmptyState');
                if (container && emptyState && container.children.length === 0) {
                    emptyState.style.display = 'block';
                }
            }, 500);
        }
    }

    deleteMilestone(milestoneId) {
        if (confirm('Are you sure you want to delete this milestone? Associated tasks will be unassigned.')) {
            // Find the milestone card before deleting
            const milestoneCard = document.querySelector(`[data-milestone-id="${milestoneId}"]`);
            
            // Unassign tasks from this milestone
            this.tasks.forEach(task => {
                if (task.milestone === milestoneId) {
                    task.milestone = '';
                }
            });
            
            this.milestones = this.milestones.filter(m => m.id !== milestoneId);
            this.saveMilestones();
            this.saveTasks();
            
            // Remove from UI immediately with animation
            if (milestoneCard) {
                this.removeMilestoneFromUIImmediate(milestoneCard);
            }
            
            this.updateMilestoneDropdown();
            this.closeModal('milestoneDetailsModal');
            this.showNotification('Milestone deleted successfully', 'info');
            
            // Update floating nav badges
            this.updateFloatingNavBadges();
            
            // Check if no milestones left to show empty state
            setTimeout(() => {
                const container = document.getElementById('milestonesGrid');
                const emptyState = document.getElementById('milestonesEmptyState');
                if (container && emptyState && container.children.length === 0) {
                    emptyState.style.display = 'block';
                }
            }, 500);
        }
    }

    viewTaskNotes(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        this.closeModal('taskDetailsModal');
        this.openNotesForTask(taskId);
    }

    viewMilestoneNotes(milestoneId) {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;
        
        this.closeModal('milestoneDetailsModal');
        this.openNotesForMilestone(milestoneId);
    }

    openNotesForTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // This would integrate with the notes system
        const modal = document.getElementById('notesModal');
        const content = document.getElementById('notesContent');
        
        const taskNotes = task.notes || [];
        
        let notesListHTML = '';
        if (taskNotes.length > 0) {
            notesListHTML = taskNotes.map(note => `
                <div class="note-item">
                    <div class="note-content">${note.content}</div>
                    <div class="note-meta">
                        <small>Created: ${new Date(note.createdAt).toLocaleString()}</small>
                    </div>
                </div>
            `).join('');
        } else {
            notesListHTML = `
                <div class="note-item">
                    <p>No notes yet for this task.</p>
                    <p>Click "Create Note" to add your first note!</p>
                </div>
            `;
        }
        
        content.innerHTML = `
            <div class="notes-header">
                <h3 style="color: #40e0ff;">Mission Notes: ${task.name}</h3>
                <button class="btn-primary" onclick="window.taskNexus.createNoteForTask('${taskId}')">
                    <i class="fas fa-plus"></i>
                    Create Note
                </button>
            </div>
            <div class="notes-list">
                ${notesListHTML}
            </div>
        `;
        
        this.showModal('notesModal');
    }

    openNotesForMilestone(milestoneId) {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;

        // This would integrate with the notes system
        const modal = document.getElementById('notesModal');
        const content = document.getElementById('notesContent');
        
        const milestoneNotes = milestone.notes || [];
        
        let notesListHTML = '';
        if (milestoneNotes.length > 0) {
            notesListHTML = milestoneNotes.map(note => `
                <div class="note-item">
                    <div class="note-content">${note.content}</div>
                    <div class="note-meta">
                        <small>Created: ${new Date(note.createdAt).toLocaleString()}</small>
                    </div>
                </div>
            `).join('');
        } else {
            notesListHTML = `
                <div class="note-item">
                    <p>No notes yet for this milestone.</p>
                    <p>Click "Create Note" to add your first note!</p>
                </div>
            `;
        }
        
        content.innerHTML = `
            <div class="notes-header">
                <h3 style="color: #40e0ff;">Milestone Notes: ${milestone.name}</h3>
                <button class="btn-primary" onclick="window.taskNexus.createNoteForMilestone('${milestoneId}')">
                    <i class="fas fa-plus"></i>
                    Create Note
                </button>
            </div>
            <div class="notes-list">
                ${notesListHTML}
            </div>
        `;
        
        this.showModal('notesModal');
    }

    recordTaskCompletion(taskId, completionType = 'normal') {
        const today = new Date().toISOString().split('T')[0];
        
        if (!this.completionHistory[taskId]) {
            this.completionHistory[taskId] = [];
        }
        
        // Record completion with type
        const completionRecord = {
            date: today,
            type: completionType, // 'normal', 'late'
            timestamp: new Date().toISOString()
        };
        
        // Remove any existing completion for today and add new one
        this.completionHistory[taskId] = this.completionHistory[taskId].filter(
            record => record.date !== today
        );
        this.completionHistory[taskId].push(completionRecord);
        
        this.saveCompletionHistory();
        this.updateTaskStreak(taskId, completionType);
    }

    updateTaskStreak(taskId, completionType = 'normal') {
        const completions = this.getTaskCompletionHistory(taskId);
        const today = new Date().toISOString().split('T')[0];
        
        let streak = 0;
        let checkDate = new Date();
        
        // Count consecutive days with completions (including today)
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const hasCompletion = completions.some(comp => comp.date === dateStr);
            
            if (hasCompletion) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        if (!this.taskStats[taskId]) {
            this.taskStats[taskId] = {};
        }
        
        this.taskStats[taskId].currentStreak = streak;
        this.taskStats[taskId].bestStreak = Math.max(this.taskStats[taskId].bestStreak || 0, streak);
        this.taskStats[taskId].totalCompletions = completions.length;
        
        this.saveTaskStats();
    }

    getTaskStreak(taskId) {
        return this.taskStats[taskId]?.currentStreak || 0;
    }

    getTaskCompletions(taskId) {
        return this.taskStats[taskId]?.totalCompletions || 0;
    }

    getTaskStatistics(taskId) {
        return {
            currentStreak: this.taskStats[taskId]?.currentStreak || 0,
            bestStreak: this.taskStats[taskId]?.bestStreak || 0,
            totalCompletions: this.taskStats[taskId]?.totalCompletions || 0
        };
    }

    getTaskCompletionHistory(taskId) {
        const history = this.completionHistory[taskId] || [];
        
        // Handle both old format (string dates) and new format (objects with date and type)
        return history.map(record => {
            if (typeof record === 'string') {
                return { date: record, type: 'normal' };
            }
            return record;
        });
    }

    calculateMilestoneProgress(milestoneId) {
        const tasks = this.tasks.filter(task => task.milestone === milestoneId);
        if (tasks.length === 0) return 0;
        
        const completedTasks = tasks.filter(task => task.completed).length;
        return Math.round((completedTasks / tasks.length) * 100);
    }

    getTasksForMilestone(milestoneId) {
        const tasks = this.tasks.filter(task => task.milestone === milestoneId);
        const completed = tasks.filter(task => task.completed).length;
        
        return {
            total: tasks.length,
            completed: completed,
            pending: tasks.length - completed
        };
    }

    updateMilestoneDropdown() {
        const dropdown = document.getElementById('taskMilestone');
        
        // Check if dropdown exists to prevent errors
        if (!dropdown) {
            console.warn('Task milestone dropdown not found');
            return;
        }
        
        const currentValue = dropdown.value;
        
        dropdown.innerHTML = '<option value="">No Milestone</option>';
        
        this.milestones.forEach(milestone => {
            const option = document.createElement('option');
            option.value = milestone.id;
            option.textContent = `${milestone.icon} ${milestone.name}`;
            dropdown.appendChild(option);
        });
        
        dropdown.value = currentValue;
    }

    updateMilestoneTaskCount(milestoneId) {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (milestone) {
            const tasks = this.getTasksForMilestone(milestoneId);
            milestone.totalTasks = tasks.total;
            milestone.completedTasks = tasks.completed;
            milestone.progress = this.calculateMilestoneProgress(milestoneId);
            this.saveMilestones();
        }
    }

    setupMobileOptimizations() {
        // Add touch-friendly interactions for mobile
        if ('ontouchstart' in window) {
            document.querySelectorAll('.task-card, .milestone-card').forEach(card => {
                card.addEventListener('touchstart', function() {
                    this.style.transform = 'scale(0.98)';
                });
                
                card.addEventListener('touchend', function() {
                    this.style.transform = '';
                });
            });
        }
        
        // Optimize for mobile viewport
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
        
        // Add swipe gestures for task completion
        this.setupSwipeGestures();
    }

    setupSwipeGestures() {
        let startX, startY, currentX, currentY;
        
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.task-card')) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (startX && e.target.closest('.task-card')) {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
                
                const diffX = currentX - startX;
                const diffY = currentY - startY;
                
                // Horizontal swipe
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    const taskCard = e.target.closest('.task-card');
                    taskCard.style.transform = `translateX(${diffX * 0.3}px)`;
                    
                    if (diffX > 100) {
                        taskCard.style.background = 'rgba(46, 213, 115, 0.1)';
                    } else if (diffX < -100) {
                        taskCard.style.background = 'rgba(255, 71, 87, 0.1)';
                    }
                }
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (startX && e.target.closest('.task-card')) {
                const diffX = currentX - startX;
                const taskCard = e.target.closest('.task-card');
                
                // Reset styles
                taskCard.style.transform = '';
                taskCard.style.background = '';
                
                // Complete task on right swipe
                if (diffX > 100) {
                    const taskId = taskCard.getAttribute('data-task-id');
                    if (taskId) {
                        this.completeTask(taskId);
                    }
                }
                
                startX = null;
                currentX = null;
            }
        });
    }

    createFloatingParticles() {
        const workspace = document.querySelector('.tasks-workspace');
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 2px;
                height: 2px;
                background: rgba(64, 224, 255, 0.3);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation: float ${5 + Math.random() * 10}s linear infinite;
            `;
            
            document.body.appendChild(particle);
        }
        
        // Add CSS animation for particles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Add loading animations
        this.addLoadingAnimations();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.task-card, .milestone-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    addLoadingAnimations() {
        // Animate workspace elements on load
        const elements = [
            '.workspace-title',
            '.workspace-subtitle',
            '.section-title',
            '.add-task-btn'
        ];
        
        elements.forEach((selector, index) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                
                setTimeout(() => {
                    element.style.transition = 'all 0.8s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 200);
            }
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.task-card, .milestone-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(46, 213, 115, 0.9)' : type === 'error' ? 'rgba(255, 71, 87, 0.9)' : 'rgba(64, 224, 255, 0.9)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-weight: 600;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveTasks() {
        localStorage.setItem('nexus_tasks', JSON.stringify(this.tasks));
    }

    saveMilestones() {
        localStorage.setItem('nexus_milestones', JSON.stringify(this.milestones));
    }

    saveTaskStats() {
        localStorage.setItem('nexus_task_stats', JSON.stringify(this.taskStats));
    }

    saveCompletionHistory() {
        localStorage.setItem('nexus_completion_history', JSON.stringify(this.completionHistory));
    }

    saveContinuousTasks() {
        localStorage.setItem('nexus_continuous_tasks', JSON.stringify(this.continuousTasks));
    }

    saveTaskReminders() {
        localStorage.setItem('nexus_task_reminders', JSON.stringify(this.taskReminders));
    }

    saveLateTaskHistory() {
        localStorage.setItem('nexus_late_task_history', JSON.stringify(this.lateTaskHistory));
    }

    // ===== CONTINUOUS TASK SYSTEM =====
    setupDailyTaskSystem() {
        // Check if we need to cycle daily tasks
        const lastTaskCycle = localStorage.getItem('nexus_last_task_cycle');
        const today = new Date().toISOString().split('T')[0];
        
        if (lastTaskCycle !== today) {
            this.cycleDailyTasks();
            localStorage.setItem('nexus_last_task_cycle', today);
        }
        
        // Set up daily task cycling at midnight
        this.setupMidnightTaskCycle();
    }

    setupMidnightTaskCycle() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.cycleDailyTasks();
            // Set up recurring daily cycle
            setInterval(() => this.cycleDailyTasks(), 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);
    }

    cycleDailyTasks() {
        const today = new Date().toISOString().split('T')[0];
        
        // Process yesterday's incomplete tasks
        this.processIncompleteTasksFromYesterday();
        
        // Clear completed tasks from yesterday
        this.clearCompletedTasksFromYesterday();
        
        // Generate new tasks for today from continuous tasks
        this.generateDailyTasks();
        
        // Update display
        this.renderTasks();
        
        console.log('Daily task cycle completed for', today);
    }

    processIncompleteTasksFromYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Find tasks from yesterday that are incomplete
        const incompleteTasks = this.tasks.filter(task => {
            return task.date === yesterdayStr && !task.completed && !task.status;
        });
        
        const now = new Date();
        
        incompleteTasks.forEach(task => {
            const taskDateTime = new Date(`${task.date}T${task.time}`);
            const taskEndTime = new Date(taskDateTime.getTime() + (task.duration * 60000));
            const lateThreshold = new Date(taskEndTime.getTime() + (2 * 60 * 60 * 1000)); // +2 hours
            const missedThreshold = new Date(taskEndTime.getTime() + (12 * 60 * 60 * 1000)); // +12 hours
            
            if (now > missedThreshold) {
                // Mark as missed
                task.status = 'missed';
                task.missedAt = now.toISOString();
                this.breakTaskStreak(task.id);
            } else if (now > lateThreshold) {
                // Mark as late, about to be missed
                task.status = 'late-about-to-miss';
            }
        });
        
        this.saveTasks();
    }

    clearCompletedTasksFromYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Remove completed tasks from yesterday
        this.tasks = this.tasks.filter(task => {
            return !(task.date === yesterdayStr && task.completed);
        });
        
        this.saveTasks();
    }

    generateDailyTasks() {
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Generate tasks from continuous tasks
        this.continuousTasks.forEach(continuousTask => {
            if (this.shouldGenerateTaskToday(continuousTask, dayOfWeek)) {
                const newTask = this.createTaskFromContinuous(continuousTask, today);
                
                // Check if task already exists for today
                const existingTask = this.tasks.find(task => 
                    task.continuousTaskId === continuousTask.id && task.date === today
                );
                
                if (!existingTask) {
                    this.tasks.push(newTask);
                }
            }
        });
        
        this.saveTasks();
    }

    shouldGenerateTaskToday(continuousTask, dayOfWeek) {
        switch (continuousTask.frequency) {
            case 'daily':
                return true;
            case 'weekly':
                return continuousTask.weekDays && continuousTask.weekDays.includes(dayOfWeek);
            case 'weekdays':
                return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
            case 'weekends':
                return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
            case 'custom':
                return continuousTask.customDays && continuousTask.customDays.includes(dayOfWeek);
            default:
                return false;
        }
    }

    createTaskFromContinuous(continuousTask, date) {
        return {
            id: this.generateId(),
            name: continuousTask.name,
            description: continuousTask.description,
            priority: continuousTask.priority,
            date: date,
            time: continuousTask.time,
            duration: continuousTask.duration,
            milestone: continuousTask.milestone,
            tags: [...continuousTask.tags],
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            streak: 0,
            totalCompletions: 0,
            continuousTaskId: continuousTask.id,
            status: null // null, 'late', 'late-about-to-miss', 'missed'
        };
    }

    // ===== TASK STATUS PROCESSING =====
    processTaskStatuses() {
        const now = new Date();
        
        this.tasks.forEach(task => {
            if (task.completed || task.status === 'missed') return;
            
            const taskDateTime = new Date(`${task.date}T${task.time}`);
            const taskEndTime = new Date(taskDateTime.getTime() + (task.duration * 60000));
            const lateThreshold = new Date(taskEndTime.getTime() + (2 * 60 * 60 * 1000)); // +2 hours
            const missedThreshold = new Date(taskEndTime.getTime() + (12 * 60 * 60 * 1000)); // +12 hours
            
            if (now > missedThreshold) {
                task.status = 'missed';
                task.missedAt = now.toISOString();
                this.breakTaskStreak(task.id);
            } else if (now > lateThreshold) {
                task.status = 'late-about-to-miss';
            } else if (now > taskEndTime) {
                task.status = 'late';
            } else {
                task.status = null; // On time
            }
        });
        
        this.saveTasks();
        
        // Schedule next status check in 5 minutes
        setTimeout(() => this.processTaskStatuses(), 5 * 60 * 1000);
    }

    breakTaskStreak(taskId) {
        if (this.taskStats[taskId]) {
            this.taskStats[taskId].currentStreak = 0;
            this.saveTaskStats();
        }
    }

    // ===== NOTIFICATION SYSTEM =====
    startNotificationSystem() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Check for upcoming tasks every minute
        this.scheduleNotificationChecks();
        setInterval(() => this.scheduleNotificationChecks(), 60000);
    }

    scheduleNotificationChecks() {
        const now = new Date();
        
        this.tasks.forEach(task => {
            if (task.completed || task.status === 'missed') return;
            
            const taskDateTime = new Date(`${task.date}T${task.time}`);
            const timeDiff = taskDateTime.getTime() - now.getTime();
            
            // Check for reminders
            const reminders = this.taskReminders[task.id] || [];
            reminders.forEach(reminderMinutes => {
                const reminderTime = taskDateTime.getTime() - (reminderMinutes * 60000);
                const reminderTimeDiff = reminderTime - now.getTime();
                
                if (reminderTimeDiff > 0 && reminderTimeDiff <= 60000) { // Within next minute
                    this.sendTaskReminder(task, reminderMinutes);
                }
            });
            
            // Check for task start notification
            if (timeDiff > 0 && timeDiff <= 60000) { // Task starts within next minute
                this.sendTaskStartNotification(task);
            }
        });
    }

    sendTaskReminder(task, reminderMinutes) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`⏰ Task Reminder`, {
                body: `"${task.name}" starts in ${reminderMinutes} minutes`,
                icon: '/pfp/Auro.png',
                tag: `reminder-${task.id}-${reminderMinutes}`,
                requireInteraction: true
            });
            
            notification.onclick = () => {
                window.focus();
                this.openTaskDetails(task);
                notification.close();
            };
            
            this.showNotification(`Reminder: "${task.name}" starts in ${reminderMinutes} minutes! ⏰`, 'info');
        }
    }

    sendTaskStartNotification(task) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`🚀 Task Starting Now!`, {
                body: `"${task.name}" is starting now`,
                icon: '/pfp/Auro.png',
                tag: `start-${task.id}`,
                requireInteraction: true
            });
            
            notification.onclick = () => {
                window.focus();
                this.openTaskDetails(task);
                notification.close();
            };
            
            this.showNotification(`"${task.name}" is starting now! 🚀`, 'success');
        }
    }

    // ===== DESIGN SWITCH FUNCTIONALITY =====
    setupDesignSwitch() {
        // Load saved design mode preference
        this.currentDesignMode = localStorage.getItem('nexus_design_mode') || 'control';
        this.applyDesignMode(this.currentDesignMode);
        
        // Setup design switch buttons
        const controlBtn = document.getElementById('controlSystemBtn');
        const modernBtn = document.getElementById('modernSystemBtn');
        
        if (controlBtn && modernBtn) {
            controlBtn.addEventListener('click', () => this.switchDesignMode('control'));
            modernBtn.addEventListener('click', () => this.switchDesignMode('modern'));
            
            // Update active state based on current mode
            this.updateDesignSwitchButtons();
        }
    }

    switchDesignMode(mode) {
        if (this.currentDesignMode === mode) return;
        
        this.currentDesignMode = mode;
        this.applyDesignMode(mode);
        this.updateDesignSwitchButtons();
        this.saveDesignModePreference();
        
        // Show notification
        const modeNames = {
            control: 'Control System',
            modern: 'Modern System'
        };
        
        this.showNotification(`Switched to ${modeNames[mode]} interface! 🎨`, 'success');
    }

    applyDesignMode(mode) {
        const body = document.body;
        
        // Remove existing design mode classes
        body.classList.remove('control-system', 'modern-system');
        
        // Apply new design mode
        if (mode === 'modern') {
            body.classList.add('modern-system');
            this.loadCustomizationTheme();
        } else {
            body.classList.add('control-system');
        }
        
        // Re-render elements to apply new styles
        this.renderTasks();
        this.renderMilestones();
    }

    updateDesignSwitchButtons() {
        const controlBtn = document.getElementById('controlSystemBtn');
        const modernBtn = document.getElementById('modernSystemBtn');
        
        if (controlBtn && modernBtn) {
            controlBtn.classList.toggle('active', this.currentDesignMode === 'control');
            modernBtn.classList.toggle('active', this.currentDesignMode === 'modern');
        }
    }

    loadCustomizationTheme() {
        // Load theme preferences from customization page
        try {
            const savedTheme = localStorage.getItem('selectedTheme');
            const customColors = JSON.parse(localStorage.getItem('customColors') || '{}');
            
            if (savedTheme || Object.keys(customColors).length > 0) {
                // Apply saved theme and custom colors
                this.applyThemeToModernSystem(savedTheme, customColors);
            } else {
                // Apply default modern theme if no customization found
                this.applyPredefinedTheme('dark-blue');
            }
        } catch (error) {
            console.warn('Error loading customization theme:', error);
            // Apply default modern theme as fallback
            this.applyPredefinedTheme('dark-blue');
        }
    }

    applyThemeToModernSystem(themeName, customColors) {
        const root = document.documentElement;
        
        // Apply custom colors if available
        if (customColors.primary) {
            root.style.setProperty('--accent-primary', customColors.primary);
            // Convert hex to RGB for rgba usage
            const rgb = this.hexToRgb(customColors.primary);
            if (rgb) {
                root.style.setProperty('--accent-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            }
        }
        
        if (customColors.secondary) {
            root.style.setProperty('--accent-secondary', customColors.secondary);
        }
        
        if (customColors.background) {
            root.style.setProperty('--background-color', customColors.background);
        }
        
        if (customColors.text) {
            root.style.setProperty('--text-color', customColors.text);
            root.style.setProperty('--title-text-color', customColors.text);
        }
        
        // Apply predefined theme if selected
        if (themeName) {
            this.applyPredefinedTheme(themeName);
        }
    }

    applyPredefinedTheme(themeName) {
        const themes = {
            'dark-blue': {
                primary: '#3b82f6',
                secondary: '#1e40af',
                background: '#0f172a',
                text: '#e2e8f0'
            },
            'dark-purple': {
                primary: '#8b5cf6',
                secondary: '#7c3aed',
                background: '#1e1b4b',
                text: '#e2e8f0'
            },
            'dark-green': {
                primary: '#10b981',
                secondary: '#059669',
                background: '#064e3b',
                text: '#d1fae5'
            },
            'cyberpunk': {
                primary: '#ff0080',
                secondary: '#00ffff',
                background: '#0a0a0f',
                text: '#ffffff'
            }
        };
        
        const theme = themes[themeName];
        if (theme) {
            const root = document.documentElement;
            Object.entries(theme).forEach(([key, value]) => {
                if (key === 'primary') {
                    root.style.setProperty('--accent-primary', value);
                    const rgb = this.hexToRgb(value);
                    if (rgb) {
                        root.style.setProperty('--accent-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
                    }
                } else if (key === 'secondary') {
                    root.style.setProperty('--accent-secondary', value);
                } else if (key === 'background') {
                    root.style.setProperty('--background-color', value);
                } else if (key === 'text') {
                    root.style.setProperty('--text-color', value);
                    root.style.setProperty('--title-text-color', value);
                }
            });
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    saveDesignModePreference() {
        localStorage.setItem('nexus_design_mode', this.currentDesignMode);
    }

    getDesignMode() {
        return this.currentDesignMode || 'control';
    }

    // Notes integration methods
    createNoteForTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            this.showNotification('Task not found', 'error');
            return;
        }

        // Close any open modals first
        this.closeModal('notesModal');
        
        // Create a simple note creation interface
        const noteContent = prompt(`Create a note for task: "${task.name}"\n\nEnter your note:`);
        if (noteContent && noteContent.trim()) {
            // For now, store notes with the task
            if (!task.notes) {
                task.notes = [];
            }
            
            const note = {
                id: this.generateId(),
                content: noteContent.trim(),
                createdAt: new Date().toISOString(),
                type: 'task-note'
            };
            
            task.notes.push(note);
            this.saveTasks();
            
            this.showNotification('Note added successfully! 📝', 'success');
            
            // Refresh the notes view if modal is open
            this.openNotesForTask(taskId);
        }
    }

    createNoteForMilestone(milestoneId) {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (!milestone) {
            this.showNotification('Milestone not found', 'error');
            return;
        }

        // Close any open modals first
        this.closeModal('notesModal');
        
        // Create a simple note creation interface
        const noteContent = prompt(`Create a note for milestone: "${milestone.name}"\n\nEnter your note:`);
        if (noteContent && noteContent.trim()) {
            // For now, store notes with the milestone
            if (!milestone.notes) {
                milestone.notes = [];
            }
            
            const note = {
                id: this.generateId(),
                content: noteContent.trim(),
                createdAt: new Date().toISOString(),
                type: 'milestone-note'
            };
            
            milestone.notes.push(note);
            this.saveMilestones();
            
            this.showNotification('Note added successfully! 📝', 'success');
            
            // Refresh the notes view if modal is open
            this.openNotesForMilestone(milestoneId);
        }
    }

    // Coin rewards system
    addCoins(amount, reason = 'Task completion') {
        if (typeof window.globalStatsManager !== 'undefined' && window.globalStatsManager.addCoins) {
            window.globalStatsManager.addCoins(amount, reason);
        } else {
            // Fallback: store coins in localStorage
            let currentCoins = parseInt(localStorage.getItem('userCoins') || '0');
            currentCoins += amount;
            localStorage.setItem('userCoins', currentCoins.toString());
            
            // Dispatch an event for other systems to listen to
            window.dispatchEvent(new CustomEvent('coinsUpdated', {
                detail: { amount: currentCoins, added: amount, reason }
            }));
            
            this.showNotification(`+${amount} coins earned! 💰 ${reason}`, 'success');
        }
    }

    getCoins() {
        if (typeof window.globalStatsManager !== 'undefined' && window.globalStatsManager.getCoins) {
            return window.globalStatsManager.getCoins();
        } else {
            return parseInt(localStorage.getItem('userCoins') || '0');
        }
    }
}

// Initialize the Task Nexus system
let taskNexus;
document.addEventListener('DOMContentLoaded', () => {
    taskNexus = new TaskNexusManager();
    window.taskNexus = taskNexus; // Make it globally available
});
