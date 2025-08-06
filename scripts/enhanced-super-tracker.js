// Enhanced Task Tracker - Progressive completion with coin rewards
class EnhancedTaskTracker {
    constructor() {
        // Core timer properties
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.elapsedTime = 0;
        this.sessionElapsedTime = 0;
        this.updateInterval = null;
        
        // Task management
        this.selectedTask = null;
        this.tasks = [];
        this.taskProgress = {}; // Stores detailed progress for each task
        
        // UI elements
        this.progressRings = {
            task: null,
            session: null
        };
        this.circumference = 2 * Math.PI * 120;
        
        // Slide navigation
        this.currentSlide = 'tasks';
        
        // Timer modes
        this.timerModes = {
            'task-focused': { name: 'Task-Focused', icon: 'fas fa-bullseye' },
            'pomodoro': { name: 'Pomodoro', icon: 'fas fa-clock', duration: 25 * 60 },
            'stopwatch': { name: 'Stopwatch', icon: 'fas fa-stopwatch' },
            'custom': { name: 'Custom Timer', icon: 'fas fa-edit' }
        };
        this.currentMode = 'task-focused';
        
        // Stopwatch specific properties
        this.stopwatchStartTime = null;
        this.stopwatchElapsed = 0;
        this.stopwatchHours = 0;
        this.stopwatchCoinsEarned = 0;
        
        // Audio control properties
        this.currentAudio = null;
        this.audioEnabled = false;
        this.autoAudio = false;
        
        // Settings
        this.settings = {
            soundEnabled: true,
            desktopNotifications: true,
            autoSave: true,
            focusMode: true,
            showSeconds: false,
            themeSync: true
        };
        
        // Progress tracking
        this.sessionStartTime = null;
        this.sessionDuration = 0;
        this.completedTasksToday = 0;
        this.coinsEarnedToday = 0;
        this.completeBtnShown = false;
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.loadTaskProgress();
        this.loadDailyStats();
        this.setupEventListeners();
        this.setupProgressRings();
        this.loadTasks();
        this.updateUI();
        console.log('🚀 Enhanced Task Tracker initialized');
    }

    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('trackerSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('trackerSettings', JSON.stringify(this.settings));
    }

    // Load task progress data
    loadTaskProgress() {
        try {
            const saved = localStorage.getItem('enhancedTaskProgress');
            this.taskProgress = saved ? JSON.parse(saved) : {};
            console.log('📊 Task progress loaded:', Object.keys(this.taskProgress).length, 'tasks');
        } catch (error) {
            console.error('Error loading task progress:', error);
            this.taskProgress = {};
        }
    }

    // Save task progress data
    saveTaskProgress() {
        try {
            localStorage.setItem('enhancedTaskProgress', JSON.stringify(this.taskProgress));
            // Only log occasionally to reduce console spam
            if (Math.floor(Date.now() / 1000) % 120 === 0) {
                console.log('💾 Task progress saved to localStorage');
            }
        } catch (error) {
            console.error('Error saving task progress:', error);
        }
    }

    // Load daily statistics
    loadDailyStats() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('dailyTrackerStats');
        const dailyStats = saved ? JSON.parse(saved) : {};
        
        if (dailyStats.date === today) {
            this.completedTasksToday = dailyStats.completedTasks || 0;
            this.coinsEarnedToday = dailyStats.coinsEarned || 0;
        } else {
            this.completedTasksToday = 0;
            this.coinsEarnedToday = 0;
            this.saveDailyStats();
        }
    }

    // Save daily statistics
    saveDailyStats() {
        const today = new Date().toDateString();
        const dailyStats = {
            date: today,
            completedTasks: this.completedTasksToday,
            coinsEarned: this.coinsEarnedToday
        };
        localStorage.setItem('dailyTrackerStats', JSON.stringify(dailyStats));
    }

    // Setup progress ring SVG elements
    setupProgressRings() {
        this.progressRings.task = document.getElementById('task-progress-circle');
        this.progressRings.session = document.getElementById('session-progress-circle');
        
        // Initialize stroke properties
        [this.progressRings.task, this.progressRings.session].forEach(ring => {
            if (ring) {
                ring.style.strokeDasharray = this.circumference;
                ring.style.strokeDashoffset = this.circumference;
            }
        });
    }

    // Load tasks from localStorage
    async loadTasks() {
        try {
            // Try modern tasks first (from tasks-new.html)
            const modernTasks = localStorage.getItem('modernTasks');
            const legacyTasks = localStorage.getItem('tasks');
            
            let allTasks = [];
            
            if (modernTasks) {
                // Use modern tasks system
                allTasks = JSON.parse(modernTasks);
                console.log('📝 Using modern tasks system');
            } else if (legacyTasks) {
                // Fallback to legacy tasks
                allTasks = JSON.parse(legacyTasks);
                console.log('📝 Using legacy tasks system');
            } else {
                // Create sample tasks for demonstration if none exist
                console.log('📝 No tasks found, creating sample tasks for demonstration');
                this.createSampleTasks();
                return;
            }
            
            // Filter for incomplete tasks with duration only
            this.tasks = allTasks.filter(task => 
                !task.completed && 
                task.status !== 'done' && 
                task.duration && 
                task.duration > 0
            );
            
            console.log(`📝 Loaded ${this.tasks.length} trackable tasks (with duration)`);
            
            this.displayTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
            this.displayTasks();
        }
    }

    // Create sample tasks for demonstration
    createSampleTasks() {
        const sampleTasks = [
            {
                id: 'sample-1',
                title: 'Complete Project Documentation',
                description: 'Write comprehensive documentation for the current project',
                priority: 'high',
                status: 'todo',
                category: 'work',
                duration: 90,
                difficulty: 'medium',
                tags: ['documentation', 'project'],
                createdAt: new Date().toISOString()
            },
            {
                id: 'sample-2',
                title: 'Learn New Programming Language',
                description: 'Study and practice a new programming language',
                priority: 'medium',
                status: 'todo',
                category: 'learning',
                duration: 120,
                difficulty: 'hard',
                tags: ['learning', 'programming'],
                createdAt: new Date().toISOString()
            },
            {
                id: 'sample-3',
                title: 'Daily Exercise Routine',
                description: '30 minutes of cardio and strength training',
                priority: 'high',
                status: 'todo',
                category: 'health',
                duration: 30,
                difficulty: 'easy',
                tags: ['health', 'exercise'],
                createdAt: new Date().toISOString()
            }
        ];

        // Store sample tasks in modern tasks format
        localStorage.setItem('modernTasks', JSON.stringify(sampleTasks));
        
        // Load the sample tasks
        this.tasks = sampleTasks;
        console.log('📝 Created 3 sample tasks with duration for demonstration');
        
        this.displayTasks();
        
        // Show notification about sample tasks
        this.showNotification('Sample tasks created! Go to Tasks page to create your own tasks with duration.', 'info');
    }

    // Display tasks in the enhanced task list
    displayTasks() {
        const taskList = document.getElementById('enhanced-task-list');
        const emptyState = document.getElementById('empty-tasks');
        
        if (!taskList) return;
        
        if (this.tasks.length === 0) {
            taskList.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        taskList.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        
        taskList.innerHTML = '';
        
        this.tasks.slice(0, 8).forEach((task, index) => {
            const progress = this.getTaskProgress(task.id);
            const taskElement = this.createTaskElement(task, progress, index);
            taskList.appendChild(taskElement);
        });
    }

    // Create enhanced task element with progress visualization
    createTaskElement(task, progress, index) {
        const taskItem = document.createElement('div');
        taskItem.className = 'enhanced-task-item';
        taskItem.dataset.taskId = task.id;
        
        const progressPercentage = Math.max(0, Math.min(100, progress.percentage || 0));
        const timeSpent = Math.floor((progress.timeSpent || 0) / 60000); // Convert to minutes
        const estimatedTime = task.duration || 60; // Use duration from task
        const timeRemaining = Math.max(0, estimatedTime - timeSpent);
        
        // Difficulty indicator
        const difficultyColors = {
            easy: '#27ae60',
            medium: '#f39c12', 
            hard: '#e74c3c',
            expert: '#9b59b6'
        };
        const difficultyColor = difficultyColors[task.difficulty] || '#f39c12';
        
        taskItem.innerHTML = `
            <div class="task-item-header">
                <div class="task-item-info">
                    <div class="task-item-title">${task.title || 'Untitled Task'}</div>
                    <div class="task-item-meta">
                        <span class="task-priority priority-${task.priority || 'medium'}">
                            ${this.getPriorityIcon(task.priority || 'medium')} ${(task.priority || 'medium').toUpperCase()}
                        </span>
                        <span class="task-difficulty" style="background: ${difficultyColor};">
                            ${(task.difficulty || 'medium').toUpperCase()}
                        </span>
                        <span class="task-time-estimate">⏱️ ${estimatedTime}m</span>
                        ${task.category ? `<span class="task-category">#${task.category}</span>` : ''}
                    </div>
                </div>
                <div class="task-item-actions">
                    <button class="select-task-btn" onclick="taskTracker.selectTask('${task.id}')">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            
            <div class="task-progress-section">
                <div class="task-progress-bar">
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="progress-info">
                        <span class="progress-percentage">${progressPercentage.toFixed(0)}%</span>
                        <span class="progress-time">${timeSpent}m / ${estimatedTime}m</span>
                    </div>
                </div>
                
                <div class="task-status-indicators">
                    <div class="status-indicator ${progressPercentage > 0 ? 'started' : 'not-started'}">
                        <i class="fas fa-play"></i>
                        <span>${progressPercentage > 0 ? 'Started' : 'Not Started'}</span>
                    </div>
                    ${progressPercentage >= 100 ? `
                        <div class="status-indicator completed">
                            <i class="fas fa-check"></i>
                            <span>Ready to Complete</span>
                        </div>
                    ` : `
                        <div class="status-indicator remaining">
                            <i class="fas fa-clock"></i>
                            <span>${timeRemaining}m remaining</span>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        return taskItem;
    }

    // Get priority icon
    getPriorityIcon(priority) {
        const icons = {
            low: '🟢',
            medium: '🟡', 
            high: '🔴',
            urgent: '🚨'
        };
        return icons[priority] || '🟡';
    }

    // Get task progress details
    getTaskProgress(taskId) {
        if (!this.taskProgress[taskId]) {
            const task = this.tasks.find(t => t.id === taskId);
            const estimatedTime = task ? task.duration : 60; // Use duration field
            
            this.taskProgress[taskId] = {
                timeSpent: 0,
                percentage: 0,
                estimatedTime: estimatedTime,
                completed: false,
                sessions: [],
                totalPauses: 0,
                lastUpdated: Date.now()
            };
        }
        
        return this.taskProgress[taskId];
    }

    // Select a task for tracking
    selectTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }
        
        // Stop current timer if running and reset
        if (this.isRunning) {
            this.pauseTimer();
        }
        
        // Reset timer completely for new task
        this.resetTimer();
        
        this.selectedTask = task;
        const progress = this.getTaskProgress(taskId);
        
        console.log(`🎯 Selected task: ${task.title}, previous progress: ${Math.floor((progress.timeSpent || 0) / 60000)}m`);
        
        // Update UI to show selected task
        this.updateTaskDisplay();
        this.updateTimerForTask();
        this.highlightSelectedTask(taskId);
        
        // Show task summary panel
        this.showTaskSummary();
    }

    // Update task display in timer section
    updateTaskDisplay() {
        if (!this.selectedTask) return;
        
        const progress = this.getTaskProgress(this.selectedTask.id);
        const timeSpent = Math.floor((progress.timeSpent || 0) / 60000);
        const estimatedTime = this.selectedTask.duration || 60; // Use duration field
        const timeRemaining = Math.max(0, estimatedTime - timeSpent);
        const progressPercentage = Math.max(0, Math.min(100, progress.percentage || 0));
        
        // Update timer section elements
        const elements = {
            timerTaskName: document.getElementById('timer-task-name'),
            taskCompletionStatus: document.getElementById('task-completion-status'),
            timeSpentDisplay: document.getElementById('time-spent-display'),
            timeRemainingDisplay: document.getElementById('time-remaining-display'),
            estimatedTimeDisplay: document.getElementById('estimated-time-display'),
            overallTaskProgress: document.getElementById('overall-task-progress'),
            overallProgressText: document.getElementById('overall-progress-text'),
            currentSession: document.getElementById('current-session'),
            modeIndicator: document.getElementById('mode-indicator')
        };
        
        if (elements.timerTaskName) elements.timerTaskName.textContent = this.selectedTask.title || 'Untitled Task';
        if (elements.taskCompletionStatus) elements.taskCompletionStatus.textContent = `${progressPercentage.toFixed(0)}% Complete`;
        if (elements.timeSpentDisplay) elements.timeSpentDisplay.textContent = `${timeSpent}m`;
        if (elements.timeRemainingDisplay) elements.timeRemainingDisplay.textContent = `${timeRemaining}m`;
        if (elements.estimatedTimeDisplay) elements.estimatedTimeDisplay.textContent = `${estimatedTime}m`;
        if (elements.overallTaskProgress) elements.overallTaskProgress.style.width = `${progressPercentage}%`;
        if (elements.overallProgressText) elements.overallProgressText.textContent = `${progressPercentage.toFixed(0)}%`;
        if (elements.currentSession) elements.currentSession.textContent = `${this.selectedTask.title || 'Task'} - ${timeRemaining}m remaining`;
        if (elements.modeIndicator) elements.modeIndicator.textContent = progressPercentage >= 100 ? 'Ready to Complete!' : 'Ready to Continue';
        
        // Update progress rings
        this.updateProgressRings();
        
        // Enable start button
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play"></i><span>Start Task</span>';
        }
    }

    // Update timer display for selected task
    updateTimerForTask() {
        if (!this.selectedTask) return;
        
        const progress = this.getTaskProgress(this.selectedTask.id);
        const timeSpent = Math.floor((progress.timeSpent || 0) / 60000);
        const estimatedTime = this.selectedTask.duration || 60; // Use duration field
        const timeRemaining = Math.max(0, estimatedTime - timeSpent);
        
        // Set timer to remaining time
        this.sessionDuration = timeRemaining * 60; // Convert to seconds
        this.elapsedTime = 0;
        this.sessionElapsedTime = 0;
        
        // Update timer display
        this.updateTimerDisplay();
    }

    // Highlight selected task in list
    highlightSelectedTask(taskId) {
        // Remove previous selection
        document.querySelectorAll('.enhanced-task-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Highlight new selection
        const selectedItem = document.querySelector(`[data-task-id="${taskId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }

    // Show task summary panel
    showTaskSummary() {
        const summaryPanel = document.getElementById('task-progress-summary');
        const taskDisplay = document.getElementById('task-progress-display');
        
        if (summaryPanel) summaryPanel.style.display = 'block';
        if (taskDisplay) taskDisplay.style.display = 'block';
    }

    // Start timer for selected task or mode
    startTimer() {
        // Check if we can start based on current mode
        if (this.currentMode === 'task-focused' && !this.selectedTask) {
            this.showNotification('Please select a task first', 'warning');
            return;
        }
        
        if (this.isRunning) return;
        
        // Ensure clean timer state
        if (!this.isPaused) {
            this.elapsedTime = 0;
            this.sessionElapsedTime = 0;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.sessionStartTime = Date.now();
        this.startTime = Date.now() - this.elapsedTime;
        
        // Update UI
        this.updateControlButtons();
        this.updateUI();
        this.updateMaximizeTimer();
        
        // Start update interval
        this.updateInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
        
        // Start auto audio if enabled
        if (this.autoAudio && this.currentMode !== 'task-focused') {
            this.startAutoAudio();
        }
        
        // Different notifications based on mode
        let message;
        switch (this.currentMode) {
            case 'task-focused':
                message = `Started working on: ${this.selectedTask.title}`;
                break;
            case 'pomodoro':
                message = 'Started 25-minute Pomodoro session';
                break;
            case 'stopwatch':
                message = 'Stopwatch started - earn 20 coins per hour!';
                break;
            case 'custom':
                const customMinutes = this.getCustomTime() / 60;
                message = `Started ${customMinutes}-minute custom timer`;
                break;
            default:
                message = 'Timer started';
        }
        
        console.log(`▶️ ${message} - Timer reset to 0`);
        this.showNotification(message, 'success');
    }

    // Pause timer
    pauseTimer() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.isPaused = true;
        
        // Save session progress when pausing (only for task-focused mode)
        if (this.currentMode === 'task-focused' && this.selectedTask) {
            this.saveSessionProgress();
        }
        
        // Stop auto audio if enabled
        if (this.autoAudio) {
            this.stopAutoAudio();
        }
        
        // Clear interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Update UI
        this.updateControlButtons();
        
        console.log('⏸️ Timer paused - Refreshing page');
        this.showNotification('Timer paused - Refreshing...', 'info');
        
        // Refresh the page instantly
        window.location.reload();
    }

    // Resume timer
    resumeTimer() {
        if (this.isRunning || !this.isPaused) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now() - this.elapsedTime;
        
        // Start auto audio if enabled
        if (this.autoAudio) {
            this.startAutoAudio();
        }
        
        // Update UI
        this.updateControlButtons();
        
        // Restart interval
        this.updateInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
        
        console.log('▶️ Timer resumed');
        this.showNotification('Timer resumed', 'success');
    }
    
    // Start auto audio
    startAutoAudio() {
        if (this.currentAudio && this.audioEnabled) {
            this.currentAudio.play().catch(error => {
                console.log('Auto audio play failed:', error);
            });
        }
    }
    
    // Stop auto audio
    stopAutoAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
        }
    }

    // Update timer every second
    updateTimer() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        this.elapsedTime = now - this.startTime;
        this.sessionElapsedTime = now - this.sessionStartTime;
        
        // Update displays
        this.updateTimerDisplay();
        this.updateProgressBars();
        this.updateProgressRings();
        this.updateMaximizeTimer();
        
        // Check for completion based on mode
        this.checkSessionCompletion();
        
        // No auto-save during running sessions to prevent time calculation interference
        // Progress will be saved only when session completes (pause/stop/reset)
    }

    // Update timer display based on current mode
    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (!timerDisplay) return;
        
        let displayTime;
        
        switch (this.currentMode) {
            case 'task-focused':
                if (!this.selectedTask) {
                    timerDisplay.textContent = '00:00';
                    timerDisplay.style.color = '';
                    return;
                }
                
                const progress = this.getTaskProgress(this.selectedTask.id);
                const totalTimeSpent = (progress.timeSpent || 0) + this.elapsedTime;
                const estimatedTime = this.selectedTask.duration || 60;
                const estimatedTimeMs = estimatedTime * 60 * 1000;
                
                // Always show remaining time (can be negative for overtime)
                const remaining = estimatedTimeMs - totalTimeSpent;
                displayTime = this.formatTime(remaining);
                
                if (remaining <= 0) {
                    timerDisplay.style.color = '#f39c12'; // Orange for overtime
                } else {
                    timerDisplay.style.color = ''; // Default color
                }
                break;
                
            case 'pomodoro':
                const pomodoroTime = this.getPomodoroTime() * 1000;
                const pomodoroRemaining = pomodoroTime - this.elapsedTime;
                displayTime = this.formatTime(pomodoroRemaining);
                
                if (pomodoroRemaining <= 0) {
                    timerDisplay.style.color = '#2ecc71'; // Green for completion
                } else {
                    timerDisplay.style.color = ''; // Default color
                }
                break;
                
            case 'stopwatch':
                // Show elapsed time in HH:MM:SS format for stopwatch
                displayTime = this.formatStopwatchTime(this.elapsedTime);
                timerDisplay.style.color = '#3498db'; // Blue for stopwatch
                break;
                
            case 'custom':
                const customTime = this.getCustomTime() * 1000;
                const customRemaining = customTime - this.elapsedTime;
                displayTime = this.formatTime(customRemaining);
                
                if (customRemaining <= 0) {
                    timerDisplay.style.color = '#2ecc71'; // Green for completion
                } else {
                    timerDisplay.style.color = ''; // Default color
                }
                break;
                
            default:
                displayTime = this.formatTime(this.elapsedTime);
                timerDisplay.style.color = '';
                break;
        }
        
        timerDisplay.textContent = displayTime;
    }
    
    // Format time for stopwatch in HH:MM:SS format
    formatStopwatchTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Check for session completion based on mode
    checkSessionCompletion() {
        switch (this.currentMode) {
            case 'task-focused':
                this.checkTaskCompletion();
                break;
                
            case 'pomodoro':
                const pomodoroTime = this.getPomodoroTime() * 1000;
                if (this.elapsedTime >= pomodoroTime) {
                    this.completePomodoroSession();
                }
                break;
                
            case 'stopwatch':
                this.checkStopwatchHourCompletion();
                break;
                
            case 'custom':
                const customTime = this.getCustomTime() * 1000;
                if (this.elapsedTime >= customTime) {
                    this.completeCustomSession();
                }
                break;
        }
    }
    
    // Check for hour completion in stopwatch mode
    checkStopwatchHourCompletion() {
        const hoursInMs = 60 * 60 * 1000; // 1 hour in milliseconds
        const currentHours = Math.floor(this.elapsedTime / hoursInMs);
        
        if (currentHours > this.stopwatchHours) {
            this.stopwatchHours = currentHours;
            this.awardStopwatchCoins();
        }
    }
    
    // Award 20 coins for each hour in stopwatch mode
    awardStopwatchCoins() {
        try {
            if (window.coinSystem && typeof window.coinSystem.addCoins === 'function') {
                window.coinSystem.addCoins(20, `Stopwatch: Completed ${this.stopwatchHours} hour(s)`);
            } else {
                const currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;
                const newCoins = currentCoins + 20;
                localStorage.setItem('userCoins', newCoins.toString());
                
                const coinDisplay = document.querySelector('.coin-count, #coin-count');
                if (coinDisplay) {
                    coinDisplay.textContent = newCoins;
                }
            }
            
            this.coinsEarnedToday += 20;
            this.saveDailyStats();
            
            this.showNotification(`🎉 Hour ${this.stopwatchHours} completed! +20 coins earned!`, 'success');
        } catch (error) {
            console.error('Error awarding stopwatch coins:', error);
        }
    }

    completePomodoroSession() {
        this.pauseTimer();
        this.showNotification('Pomodoro session completed! Time for a break.', 'success');
        
        // Optional: automatically start break timer
        const breakTime = 5 * 60 * 1000; // 5 minutes
        this.showNotification('Take a 5-minute break!', 'info');
        
        // Reset for next session
        setTimeout(() => {
            this.resetTimer();
        }, 1000);
    }

    completeCustomSession() {
        this.pauseTimer();
        this.showNotification('Custom timer session completed!', 'success');
        
        // Reset for next session
        setTimeout(() => {
            this.resetTimer();
        }, 1000);
    }
    
    // Get pomodoro time in seconds
    getPomodoroTime() {
        return this.timerModes.pomodoro.duration || (25 * 60);
    }
    
    // Get custom time in seconds (default to 30 minutes)
    getCustomTime() {
        const customInput = document.getElementById('custom-time-input');
        if (customInput && customInput.value) {
            return parseInt(customInput.value) * 60; // Convert minutes to seconds
        }
        return 30 * 60; // Default 30 minutes
    }

    // Format time in MM:SS format (handles negative time for overtime)
    formatTime(ms) {
        const isNegative = ms < 0;
        const absoluteMs = Math.abs(ms);
        const totalSeconds = Math.floor(absoluteMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        return isNegative ? `-${timeString}` : timeString;
    }

    // Update progress bars based on current mode
    updateProgressBars() {
        let overallPercentage = 0;
        let sessionPercentage = 0;
        let sessionDuration = 0;
        
        switch (this.currentMode) {
            case 'task-focused':
                if (!this.selectedTask) return;
                
                const progress = this.getTaskProgress(this.selectedTask.id);
                const totalTimeSpent = (progress.timeSpent || 0) + this.elapsedTime;
                const estimatedTime = this.selectedTask.duration || 60;
                const estimatedTimeMs = estimatedTime * 60 * 1000;
                
                overallPercentage = Math.min(100, (totalTimeSpent / estimatedTimeMs) * 100);
                sessionDuration = estimatedTime * 60 * 1000;
                sessionPercentage = this.elapsedTime > 0 ? 
                    Math.min(100, (this.elapsedTime / sessionDuration) * 100) : 0;
                break;
                
            case 'pomodoro':
                sessionDuration = this.getPomodoroTime() * 1000;
                overallPercentage = Math.min(100, (this.elapsedTime / sessionDuration) * 100);
                sessionPercentage = overallPercentage;
                break;
                
            case 'custom':
                sessionDuration = this.getCustomTime() * 1000;
                overallPercentage = Math.min(100, (this.elapsedTime / sessionDuration) * 100);
                sessionPercentage = overallPercentage;
                break;
        }
        
        // Update overall task progress
        const overallProgress = document.getElementById('overall-task-progress');
        const overallText = document.getElementById('overall-progress-text');
        if (overallProgress) overallProgress.style.width = `${overallPercentage}%`;
        if (overallText) overallText.textContent = `${overallPercentage.toFixed(0)}%`;
        
        // Update session progress
        const sessionProgress = document.getElementById('current-session-progress');
        const sessionText = document.getElementById('session-progress-text');
        if (sessionProgress) sessionProgress.style.width = `${sessionPercentage}%`;
        if (sessionText) sessionText.textContent = this.isRunning ? `${sessionPercentage.toFixed(0)}%` : 'Paused';
        
        // Update task progress in tracker
        this.updateTaskProgressInStorage(overallPercentage);
    }

    // Update progress rings
    updateProgressRings() {
        if (!this.progressRings.task || !this.progressRings.session) return;
        
        let taskPercentage = 0;
        let sessionPercentage = 0;
        
        switch (this.currentMode) {
            case 'task-focused':
                if (!this.selectedTask) return;
                
                const progress = this.getTaskProgress(this.selectedTask.id);
                const totalTimeSpent = (progress.timeSpent || 0) + this.elapsedTime;
                const estimatedTime = this.selectedTask.duration || 60;
                const estimatedTimeMs = estimatedTime * 60 * 1000;
                
                // Task progress ring (blue) - shows total progress including previous sessions
                taskPercentage = Math.min(100, (totalTimeSpent / estimatedTimeMs) * 100);
                
                // Session progress ring (green) - shows only current session progress relative to total estimated time
                sessionPercentage = Math.min(100, (this.elapsedTime / estimatedTimeMs) * 100);
                break;
                
            case 'pomodoro':
                const pomodoroTime = this.getPomodoroTime() * 1000;
                taskPercentage = Math.min(100, (this.elapsedTime / pomodoroTime) * 100);
                sessionPercentage = taskPercentage; // Same as task for pomodoro
                break;
                
            case 'stopwatch':
                // For stopwatch, show hours completed
                const hoursInMs = 60 * 60 * 1000; // 1 hour in milliseconds
                const currentHourProgress = (this.elapsedTime % hoursInMs) / hoursInMs * 100;
                taskPercentage = Math.min(100, currentHourProgress);
                sessionPercentage = Math.min(100, (this.elapsedTime / hoursInMs) * 100);
                break;
                
            case 'custom':
                const customTime = this.getCustomTime() * 1000;
                taskPercentage = Math.min(100, (this.elapsedTime / customTime) * 100);
                sessionPercentage = taskPercentage;
                break;
        }
        
        // Update task progress ring (blue)
        const taskOffset = this.circumference - (taskPercentage / 100) * this.circumference;
        this.progressRings.task.style.strokeDashoffset = taskOffset;
        
        // Update session progress ring (green)  
        const sessionOffset = this.circumference - (sessionPercentage / 100) * this.circumference;
        this.progressRings.session.style.strokeDashoffset = sessionOffset;
    }

    // Check if task should be marked as complete
    checkTaskCompletion() {
        if (!this.selectedTask) return;
        
        const progress = this.getTaskProgress(this.selectedTask.id);
        const totalTimeSpent = (progress.timeSpent || 0) + this.elapsedTime;
        const estimatedTime = this.selectedTask.duration || 60; // Use duration field
        const estimatedTimeMs = estimatedTime * 60 * 1000;
        
        const percentage = (totalTimeSpent / estimatedTimeMs) * 100;
        
        // Show complete button when 100% reached
        if (percentage >= 100 && !this.completeBtnShown) {
            this.showCompleteButton();
            this.completeBtnShown = true;
        }
    }

    // Show complete task button
    showCompleteButton() {
        const completeBtn = document.getElementById('complete-btn');
        const pauseBtn = document.getElementById('pause-btn');
        
        if (completeBtn) {
            completeBtn.style.display = 'inline-flex';
            completeBtn.classList.add('pulse'); // Add visual emphasis
        }
        
        this.showNotification('🎉 Task ready to complete! Click Complete Task to finish and earn 20 coins!', 'success');
    }

    // Complete current task
    completeTask() {
        if (!this.selectedTask) return;
        
        // Stop timer and save progress
        this.pauseTimer();
        
        // Mark task as completed
        this.markTaskAsCompleted();
        
        // Award coins
        this.awardCompletionCoins();
        
        // Show celebration
        this.showCompletionCelebration();
        
        // Update statistics
        this.updateCompletionStats();
        
        console.log(`✅ Task completed: ${this.selectedTask.title}`);
    }

    // Mark task as completed in storage
    markTaskAsCompleted() {
        if (!this.selectedTask) return;
        
        try {
            // Update task progress
            const progress = this.getTaskProgress(this.selectedTask.id);
            progress.completed = true;
            progress.completedAt = Date.now();
            progress.percentage = 100;
            
            // Update modern tasks storage first
            const modernTasks = localStorage.getItem('modernTasks');
            if (modernTasks) {
                const tasks = JSON.parse(modernTasks);
                const taskIndex = tasks.findIndex(t => t.id === this.selectedTask.id);
                if (taskIndex !== -1) {
                    tasks[taskIndex].status = 'done';
                    tasks[taskIndex].completed = true;
                    tasks[taskIndex].completedAt = new Date().toISOString();
                    localStorage.setItem('modernTasks', JSON.stringify(tasks));
                    console.log('✅ Task marked as completed in modern tasks storage');
                }
            }
            
            // Update legacy tasks storage as fallback
            const legacyTasks = localStorage.getItem('tasks');
            if (legacyTasks) {
                const tasks = JSON.parse(legacyTasks);
                const taskIndex = tasks.findIndex(t => t.id === this.selectedTask.id);
                if (taskIndex !== -1) {
                    tasks[taskIndex].completed = true;
                    tasks[taskIndex].completedAt = Date.now();
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                    console.log('✅ Task marked as completed in legacy tasks storage');
                }
            }
            
            // Save progress
            this.saveTaskProgress();
            
            console.log('📝 Task completion saved successfully');
        } catch (error) {
            console.error('Error marking task as completed:', error);
        }
    }

    // Award 20 coins for task completion
    awardCompletionCoins() {
        try {
            // Use the coin system if available
            if (window.coinSystem && typeof window.coinSystem.addCoins === 'function') {
                window.coinSystem.addCoins(20, `Completed task: ${this.selectedTask.title}`);
            } else {
                // Fallback: manually add coins
                const currentCoins = parseInt(localStorage.getItem('userCoins')) || 0;
                const newCoins = currentCoins + 20;
                localStorage.setItem('userCoins', newCoins.toString());
                
                // Update coin display if available
                const coinDisplay = document.querySelector('.coin-count, #coin-count');
                if (coinDisplay) {
                    coinDisplay.textContent = newCoins;
                }
            }
            
            // Update daily stats
            this.coinsEarnedToday += 20;
            this.saveDailyStats();
            
            console.log('🪙 Awarded 20 coins for task completion');
        } catch (error) {
            console.error('Error awarding coins:', error);
        }
    }

    // Show completion celebration
    showCompletionCelebration() {
        const celebration = document.getElementById('completion-celebration');
        const finalTimeSpent = document.getElementById('final-time-spent');
        
        if (celebration) {
            // Calculate total time spent
            const progress = this.getTaskProgress(this.selectedTask.id);
            const totalTime = Math.floor(((progress.timeSpent || 0) + this.elapsedTime) / 60000);
            
            // Update celebration content
            if (finalTimeSpent) {
                finalTimeSpent.textContent = `${totalTime}m`;
            }
            
            // Show celebration
            celebration.style.display = 'flex';
            celebration.classList.add('show');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideCelebration();
            }, 5000);
        }
    }

    // Hide celebration and reset
    hideCelebration() {
        const celebration = document.getElementById('completion-celebration');
        if (celebration) {
            celebration.style.display = 'none';
            celebration.classList.remove('show');
        }
        
        // Reset for next task
        this.resetTimer();
        this.selectedTask = null;
        this.loadTasks(); // Refresh task list
        this.updateUI();
    }

    // Update completion statistics
    updateCompletionStats() {
        this.completedTasksToday += 1;
        this.saveDailyStats();
        
        // Update progress display
        this.updateProgressStats();
    }

    // Update progress statistics display
    updateProgressStats() {
        const elements = {
            tasksCompletedToday: document.getElementById('tasks-completed-today'),
            timeFocusedToday: document.getElementById('time-focused-today'),
            coinsEarnedToday: document.getElementById('coins-earned-today')
        };
        
        if (elements.tasksCompletedToday) {
            elements.tasksCompletedToday.textContent = this.completedTasksToday;
        }
        
        if (elements.coinsEarnedToday) {
            elements.coinsEarnedToday.textContent = this.coinsEarnedToday;
        }
        
        // Calculate total focus time (simplified)
        if (elements.timeFocusedToday) {
            const totalMinutes = Object.values(this.taskProgress).reduce((total, progress) => {
                return total + Math.floor((progress.timeSpent || 0) / 60000);
            }, 0);
            elements.timeFocusedToday.textContent = `${totalMinutes}m`;
        }
    }

    // Save session progress (simple and clean)
    saveSessionProgress() {
        if (!this.selectedTask || !this.sessionStartTime) return;
        
        const progress = this.getTaskProgress(this.selectedTask.id);
        
        // Calculate the total session time and add it to timeSpent
        const sessionDuration = Date.now() - this.sessionStartTime;
        const previousTimeSpent = progress.timeSpent || 0;
        progress.timeSpent = previousTimeSpent + sessionDuration;
        progress.lastUpdated = Date.now();
        
        // Add session record
        progress.sessions.push({
            startTime: this.sessionStartTime,
            duration: sessionDuration,
            endTime: Date.now()
        });
        
        // Calculate percentage
        const estimatedTime = this.selectedTask.duration || 60;
        const estimatedTimeMs = estimatedTime * 60 * 1000;
        progress.percentage = Math.min(100, (progress.timeSpent / estimatedTimeMs) * 100);
        
        this.saveTaskProgress();
        
        console.log(`📝 Session saved: ${Math.floor(sessionDuration/60000)}m ${Math.floor((sessionDuration%60000)/1000)}s`);
        console.log(`📊 Total time: ${Math.floor(progress.timeSpent/60000)}m (was ${Math.floor(previousTimeSpent/60000)}m)`);
    }

    // Update task progress in storage
    updateTaskProgressInStorage(percentage) {
        if (!this.selectedTask) return;
        
        const progress = this.getTaskProgress(this.selectedTask.id);
        progress.percentage = Math.min(100, percentage);
        progress.lastUpdated = Date.now();
        
        // Save periodically (every 5% change)
        const lastSavedPercentage = progress.lastSavedPercentage || 0;
        if (Math.abs(percentage - lastSavedPercentage) >= 5) {
            progress.lastSavedPercentage = percentage;
            this.saveTaskProgress();
        }
    }

    // Reset timer
    resetTimer() {
        // Save session progress before resetting if there's an active session
        if (this.isRunning && this.currentMode === 'task-focused' && this.selectedTask) {
            this.saveSessionProgress();
        }
        
        // Stop timer
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Reset state
        this.isRunning = false;
        this.isPaused = false;
        this.elapsedTime = 0;
        this.sessionElapsedTime = 0;
        this.sessionStartTime = null;
        this.completeBtnShown = false;
        
        // Update UI
        this.updateControlButtons();
        this.updateTimerDisplay();
        this.updateProgressBars();
        this.updateProgressRings();
        
        console.log('🔄 Timer reset');
    }

    // Update control buttons state
    updateControlButtons() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const completeBtn = document.getElementById('complete-btn');
        
        if (!startBtn || !pauseBtn) return;
        
        if (this.isRunning) {
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-flex';
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
        } else if (this.isPaused) {
            startBtn.style.display = 'inline-flex';
            startBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
            pauseBtn.style.display = 'none';
        } else {
            startBtn.style.display = 'inline-flex';
            startBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
            pauseBtn.style.display = 'none';
        }
        
        // Hide complete button if not ready
        if (completeBtn && !this.completeBtnShown) {
            completeBtn.style.display = 'none';
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Timer controls
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const completeBtn = document.getElementById('complete-btn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.isPaused) {
                    this.resumeTimer();
                } else {
                    this.startTimer();
                }
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseTimer());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetTimer());
        }
        
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeTask());
        }
        
        // Slide navigation
        const slideButtons = document.querySelectorAll('.slide-nav-btn');
        slideButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const slide = btn.dataset.slide;
                this.switchSlide(slide);
            });
        });
        
        // Celebration continue button
        const celebrationContinue = document.getElementById('celebration-continue');
        if (celebrationContinue) {
            celebrationContinue.addEventListener('click', () => this.hideCelebration());
        }
        
        // Refresh tasks button
        const refreshBtn = document.getElementById('refresh-tasks');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadTasks());
        }
        
        // Mode selection
        const modeOptions = document.querySelectorAll('.mode-option');
        modeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const mode = option.dataset.mode;
                this.setTimerMode(mode);
            });
        });
        
        // Settings toggles
        const settingToggles = document.querySelectorAll('.setting-item input[type="checkbox"]');
        settingToggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.updateSetting(toggle.id, toggle.checked);
            });
        });
        
        // Maximize mode button
        const maximizeBtn = document.getElementById('maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => this.enterMaximizeMode());
        }
        
        // Maximize mode controls
        this.setupMaximizeModeControls();
        
        console.log('🎛️ Event listeners setup complete');
    }

    // Switch between slides
    switchSlide(slideId) {
        const slides = document.querySelectorAll('.slide');
        const buttons = document.querySelectorAll('.slide-nav-btn');
        
        // Hide all slides
        slides.forEach(slide => {
            slide.style.display = 'none';
            slide.style.opacity = '0';
            slide.style.transform = 'translateX(-100%)';
            slide.classList.remove('active');
        });
        
        // Show selected slide
        const targetSlide = document.getElementById(`${slideId}-slide`);
        if (targetSlide) {
            targetSlide.style.display = 'block';
            targetSlide.style.opacity = '1';
            targetSlide.style.transform = 'translateX(0)';
            targetSlide.classList.add('active');
        }
        
        // Update button states
        buttons.forEach(btn => btn.classList.remove('active'));
        const activeButton = document.querySelector(`[data-slide="${slideId}"]`);
        if (activeButton) activeButton.classList.add('active');
        
        this.currentSlide = slideId;
        console.log(`📱 Switched to ${slideId} slide`);
    }

    // Set timer mode
    setTimerMode(mode) {
        // Reset timer when switching modes
        if (this.isRunning) {
            this.pauseTimer();
        }
        this.resetTimer();
        
        this.currentMode = mode;
        
        // Update mode options
        document.querySelectorAll('.mode-option').forEach(option => {
            option.classList.remove('active');
        });
        
        const selectedOption = document.querySelector(`[data-mode="${mode}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }
        
        // Show/hide relevant settings
        const customSettings = document.getElementById('custom-timer-settings');
        const taskSelection = document.getElementById('task-selection-section');
        
        if (customSettings) {
            customSettings.style.display = mode === 'custom' ? 'block' : 'none';
        }
        
        if (taskSelection) {
            taskSelection.style.display = mode === 'task-focused' ? 'block' : 'none';
        }
        
        // Update UI based on mode
        this.updateModeSpecificUI();
        
        // Reset stopwatch specific properties when entering stopwatch mode
        if (mode === 'stopwatch') {
            this.stopwatchHours = 0;
            this.stopwatchCoinsEarned = 0;
        }
        
        console.log(`⚙️ Timer mode set to: ${mode}`);
        this.showNotification(`Switched to ${this.timerModes[mode].name} mode`, 'info');
    }
    
    // Update UI based on current mode
    updateModeSpecificUI() {
        const startBtn = document.getElementById('start-btn');
        const timerModeTitle = document.getElementById('timer-mode-title');
        const timerDescription = document.getElementById('timer-description');
        
        if (timerModeTitle) {
            timerModeTitle.textContent = this.timerModes[this.currentMode].name;
        }
        
        // Enable/disable start button based on mode
        if (startBtn) {
            switch (this.currentMode) {
                case 'task-focused':
                    startBtn.disabled = !this.selectedTask;
                    if (timerDescription) {
                        timerDescription.textContent = this.selectedTask ? 
                            `Working on: ${this.selectedTask.title}` : 
                            'Select a task to begin tracking';
                    }
                    break;
                    
                case 'pomodoro':
                    startBtn.disabled = false;
                    if (timerDescription) {
                        timerDescription.textContent = '25-minute focused work session';
                    }
                    break;
                    
                case 'stopwatch':
                    startBtn.disabled = false;
                    if (timerDescription) {
                        timerDescription.textContent = 'Earn 20 coins for every hour completed';
                    }
                    break;
                    
                case 'custom':
                    startBtn.disabled = false;
                    const customTime = this.getCustomTime() / 60; // Convert to minutes
                    if (timerDescription) {
                        timerDescription.textContent = `${customTime}-minute custom session`;
                    }
                    break;
            }
        }
        
        this.updateTimerDisplay();
        this.updateProgressRings();
    }

    // Update setting
    updateSetting(settingId, value) {
        const settingMap = {
            'sound-enabled': 'soundEnabled',
            'desktop-notifications': 'desktopNotifications',
            'auto-save': 'autoSave',
            'focus-mode-enabled': 'focusMode',
            'show-seconds': 'showSeconds',
            'theme-sync': 'themeSync'
        };
        
        const settingKey = settingMap[settingId];
        if (settingKey) {
            this.settings[settingKey] = value;
            this.saveSettings();
            console.log(`⚙️ Setting updated: ${settingKey} = ${value}`);
        }
    }

    // Update UI
    updateUI() {
        this.updateControlButtons();
        this.updateProgressStats();
        
        // Update timer mode title
        const titleElement = document.getElementById('timer-mode-title');
        if (titleElement) {
            titleElement.textContent = this.timerModes[this.currentMode]?.name || 'Task Tracker';
        }
        
        // Update session info
        const sessionElement = document.getElementById('session-progress');
        if (sessionElement) {
            if (this.selectedTask) {
                const progress = this.getTaskProgress(this.selectedTask.id);
                const percentage = progress.percentage || 0;
                sessionElement.textContent = `${percentage.toFixed(0)}% complete`;
            } else {
                sessionElement.textContent = 'Select a task to begin';
            }
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Try to use existing notification system
        if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // ============================================
    // MAXIMIZE MODE FUNCTIONALITY
    // ============================================

    setupMaximizeModeControls() {
        // Exit maximize mode
        const exitBtn = document.getElementById('exit-maximize');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.exitMaximizeMode());
        }

        // Settings panel toggle
        const settingsToggle = document.getElementById('settings-panel-toggle');
        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => this.toggleMaximizeSettings());
        }

        // Close settings button
        const closeSettings = document.getElementById('close-settings-btn');
        if (closeSettings) {
            closeSettings.addEventListener('click', () => this.hideMaximizeSettings());
        }

        // Background preset selection
        const presetBgs = document.querySelectorAll('.preset-bg-option');
        presetBgs.forEach(bg => {
            bg.addEventListener('click', () => this.setMaximizeBackground(bg.dataset.bg));
        });

        // Audio controls
        const audioButtons = document.querySelectorAll('.preset-audio-btn');
        audioButtons.forEach(btn => {
            btn.addEventListener('click', () => this.playMaximizeAudio(btn.dataset.audio));
        });

        // File uploads
        const imageUpload = document.getElementById('maximize-image-upload');
        const videoUpload = document.getElementById('maximize-video-upload');
        const audioUpload = document.getElementById('maximize-audio-upload');

        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        }
        if (videoUpload) {
            videoUpload.addEventListener('change', (e) => this.handleVideoUpload(e));
        }
        if (audioUpload) {
            audioUpload.addEventListener('change', (e) => this.handleAudioUpload(e));
        }

        // Upload buttons
        const uploadImageBtn = document.querySelector('[data-action="upload-image"]');
        const uploadVideoBtn = document.querySelector('[data-action="upload-video"]');
        const uploadAudioBtn = document.querySelector('[data-action="upload-audio"]');

        if (uploadImageBtn) {
            uploadImageBtn.addEventListener('click', () => imageUpload?.click());
        }
        if (uploadVideoBtn) {
            uploadVideoBtn.addEventListener('click', () => videoUpload?.click());
        }
        if (uploadAudioBtn) {
            uploadAudioBtn.addEventListener('click', () => audioUpload?.click());
        }

        // Volume control
        const volumeControl = document.getElementById('enhanced-volume-control');
        if (volumeControl) {
            volumeControl.addEventListener('input', (e) => this.setMaximizeVolume(e.target.value));
        }
        
        // Audio control buttons
        const audioControlBtn = document.getElementById('audio-control-btn');
        const stopAudioBtn = document.getElementById('stop-audio-btn');
        const autoAudioToggle = document.getElementById('auto-audio-toggle');
        
        if (audioControlBtn) {
            audioControlBtn.addEventListener('click', () => this.toggleAudio());
        }
        if (stopAudioBtn) {
            stopAudioBtn.addEventListener('click', () => this.stopAudio());
        }
        if (autoAudioToggle) {
            autoAudioToggle.addEventListener('change', () => this.toggleAutoAudio());
        }

        // Timer opacity and size controls
        const opacityControl = document.getElementById('enhanced-timer-opacity');
        const sizeControl = document.getElementById('enhanced-timer-size');

        if (opacityControl) {
            opacityControl.addEventListener('input', (e) => this.setTimerOpacity(e.target.value));
        }
        if (sizeControl) {
            sizeControl.addEventListener('input', (e) => this.setTimerSize(e.target.value));
        }

        // Enhanced control buttons
        const enhancedPlayBtn = document.getElementById('enhanced-play-btn');
        const enhancedResetBtn = document.getElementById('enhanced-reset-btn');
        const enhancedFullscreenBtn = document.getElementById('enhanced-fullscreen-btn');

        if (enhancedPlayBtn) {
            enhancedPlayBtn.addEventListener('click', () => {
                if (this.isRunning) {
                    this.pauseTimer();
                } else {
                    this.startTimer();
                }
            });
        }
        if (enhancedResetBtn) {
            enhancedResetBtn.addEventListener('click', () => this.resetTimer());
        }
        if (enhancedFullscreenBtn) {
            enhancedFullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // Keyboard shortcuts for maximize mode
        document.addEventListener('keydown', (e) => this.handleMaximizeKeyboard(e));
        
        // Setup mode and task selection for maximize mode
        this.setupMaximizeModeTaskSelection();
    }
    
    setupMaximizeModeTaskSelection() {
        // Mode selection buttons
        const modeBtns = document.querySelectorAll('.maximize-mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setMaximizeMode(btn.dataset.mode));
        });
        
        console.log('✅ Maximize mode task selection setup complete');
        
        // Task selection controls
        const changeTaskBtn = document.getElementById('change-task-btn');
        const closeTaskList = document.getElementById('close-task-list');
        
        if (changeTaskBtn) {
            changeTaskBtn.addEventListener('click', () => this.toggleMaximizeTaskList());
        }
        if (closeTaskList) {
            closeTaskList.addEventListener('click', () => this.hideMaximizeTaskList());
        }
        
        // Custom timer settings
        const customTimerInputs = document.querySelectorAll('#maximize-work-time, #maximize-break-time');
        const applyCustomBtn = document.getElementById('apply-custom-maximize');
        
        customTimerInputs.forEach(input => {
            input.addEventListener('change', () => this.updateMaximizeCustomTimer());
        });
        
        if (applyCustomBtn) {
            applyCustomBtn.addEventListener('click', () => this.applyMaximizeCustomTimer());
        }
        
        // Initialize maximize mode display
        this.updateMaximizeModeDisplay();
        this.loadMaximizeTaskList();
    }
    
    setMaximizeMode(mode) {
        this.currentMode = mode;
        
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Show/hide custom timer settings
        const customSettings = document.getElementById('custom-timer-maximize');
        if (customSettings) {
            customSettings.style.display = mode === 'custom' ? 'block' : 'none';
        }
        
        // Update the main mode selection in the left panel
        this.setTimerMode(mode);
        
        // Update maximize mode display
        this.updateMaximizeModeDisplay();
        
        this.showNotification(`Switched to ${this.timerModes[mode].name} mode`, 'success');
    }
    
    updateMaximizeModeDisplay() {
        const modeIndicator = document.getElementById('maximize-mode-indicator');
        if (modeIndicator) {
            const modeInfo = this.timerModes[this.currentMode];
            modeIndicator.textContent = modeInfo.name;
        }
        
        // Update current task display
        this.updateMaximizeTaskDisplay();
    }
    
    updateMaximizeTaskDisplay() {
        const taskNameEl = document.getElementById('maximize-task-name');
        const taskProgressEl = document.getElementById('maximize-task-progress');
        
        if (this.selectedTask) {
            const progress = this.taskProgress[this.selectedTask.id] || { timeSpent: 0, completed: false };
            const percentage = this.selectedTask.estimatedTime ? 
                Math.round((progress.timeSpent / (this.selectedTask.estimatedTime * 60)) * 100) : 0;
            
            if (taskNameEl) {
                taskNameEl.textContent = this.selectedTask.title || 'Selected Task';
            }
            if (taskProgressEl) {
                taskProgressEl.textContent = `${percentage}% Complete • ${Math.round(progress.timeSpent / 60)}m spent`;
            }
        } else {
            if (taskNameEl) {
                taskNameEl.textContent = 'No task selected';
            }
            if (taskProgressEl) {
                taskProgressEl.textContent = 'Select a task to begin tracking';
            }
        }
    }
    
    toggleMaximizeTaskList() {
        const taskList = document.getElementById('maximize-task-list');
        if (taskList) {
            const isVisible = taskList.style.display !== 'none';
            taskList.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.loadMaximizeTaskList();
            }
        }
    }
    
    hideMaximizeTaskList() {
        const taskList = document.getElementById('maximize-task-list');
        if (taskList) {
            taskList.style.display = 'none';
        }
    }
    
    loadMaximizeTaskList() {
        const container = document.getElementById('maximize-task-items');
        const noTasksMsg = container?.querySelector('.no-tasks-message');
        
        if (!container) return;
        
        // Clear existing task items (but keep no-tasks-message)
        const existingItems = container.querySelectorAll('.task-item-compact');
        existingItems.forEach(item => item.remove());
        
        if (this.tasks.length === 0) {
            if (noTasksMsg) {
                noTasksMsg.style.display = 'block';
            }
            return;
        }
        
        if (noTasksMsg) {
            noTasksMsg.style.display = 'none';
        }
        
        // Add tasks
        this.tasks.forEach(task => {
            const taskItem = this.createMaximizeTaskItem(task);
            container.appendChild(taskItem);
        });
    }
    
    createMaximizeTaskItem(task) {
        const item = document.createElement('div');
        item.className = 'task-item-compact';
        item.dataset.taskId = task.id;
        
        if (this.selectedTask && this.selectedTask.id === task.id) {
            item.classList.add('selected');
        }
        
        const progress = this.taskProgress[task.id] || { timeSpent: 0 };
        const timeSpent = Math.round(progress.timeSpent / 60);
        const estimatedTime = task.estimatedTime || 0;
        
        item.innerHTML = `
            <div class="task-priority ${task.priority || 'medium'}"></div>
            <div class="task-details">
                <div class="task-title">${task.title || 'Untitled Task'}</div>
                <div class="task-time">${timeSpent}m spent${estimatedTime ? ` / ${estimatedTime}m` : ''}</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            this.selectMaximizeTask(task);
            this.hideMaximizeTaskList();
        });
        
        return item;
    }
    
    selectMaximizeTask(task) {
        // Use the existing selectTask function to maintain consistency
        this.selectTask(task.id);
        
        // Update maximize display
        this.updateMaximizeTaskDisplay();
        
        // Update selected state in task list
        document.querySelectorAll('.task-item-compact').forEach(item => {
            item.classList.toggle('selected', item.dataset.taskId === task.id);
        });
        
        this.showNotification(`Selected: ${task.title}`, 'success');
    }
    
    updateMaximizeCustomTimer() {
        const workTimeInput = document.getElementById('maximize-work-time');
        const breakTimeInput = document.getElementById('maximize-break-time');
        
        if (workTimeInput && breakTimeInput) {
            const workTime = parseInt(workTimeInput.value) || 25;
            const breakTime = parseInt(breakTimeInput.value) || 5;
            
            // Update the main custom timer inputs
            const mainWorkInput = document.getElementById('custom-work-time');
            const mainBreakInput = document.getElementById('custom-break-time');
            
            if (mainWorkInput) mainWorkInput.value = workTime;
            if (mainBreakInput) mainBreakInput.value = breakTime;
        }
    }
    
    applyMaximizeCustomTimer() {
        this.updateMaximizeCustomTimer();
        
        // Apply the custom timer settings
        const applyBtn = document.getElementById('apply-custom-timer');
        if (applyBtn) {
            applyBtn.click();
        }
        
        this.showNotification('Custom timer settings applied', 'success');
    }
    
    syncMaximizeCustomTimerInputs() {
        // Sync maximize mode inputs with main inputs
        const mainWorkInput = document.getElementById('custom-work-time');
        const mainBreakInput = document.getElementById('custom-break-time');
        const maxWorkInput = document.getElementById('maximize-work-time');
        const maxBreakInput = document.getElementById('maximize-break-time');
        
        if (mainWorkInput && maxWorkInput) {
            maxWorkInput.value = mainWorkInput.value || 25;
        }
        if (mainBreakInput && maxBreakInput) {
            maxBreakInput.value = mainBreakInput.value || 5;
        }
    }

    enterMaximizeMode() {
        const overlay = document.getElementById('maximize-overlay');
        if (overlay) {
            overlay.style.display = 'block';
            setTimeout(() => overlay.classList.add('active'), 10);
            
            // Update maximize timer display
            this.updateMaximizeTimer();
            
            // Update maximize mode and task display
            this.updateMaximizeModeDisplay();
            
            // Sync mode buttons with current mode
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
            });
            
            // Show/hide custom timer settings based on current mode
            const customSettings = document.getElementById('custom-timer-maximize');
            if (customSettings) {
                customSettings.style.display = this.currentMode === 'custom' ? 'block' : 'none';
            }
            
            // Initialize custom timer inputs with current values
            this.syncMaximizeCustomTimerInputs();
            
            this.showNotification('Entered maximize mode. Press ESC to exit.', 'info');
        }
    }

    exitMaximizeMode() {
        const overlay = document.getElementById('maximize-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.style.display = 'none', 300);
            
            this.showNotification('Exited maximize mode', 'info');
        }
    }

    toggleMaximizeSettings() {
        const panel = document.getElementById('enhanced-settings-panel');
        if (panel) {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
        }
    }

    hideMaximizeSettings() {
        const panel = document.getElementById('enhanced-settings-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    setMaximizeBackground(type) {
        const backgroundDiv = document.getElementById('background-image');
        const backgroundVideo = document.getElementById('background-video');
        
        if (!backgroundDiv || !backgroundVideo) return;

        // Hide video first
        backgroundVideo.style.display = 'none';
        backgroundVideo.pause();

        const backgrounds = {
            'forest': 'linear-gradient(135deg, #134e5e, #71b280)',
            'ocean': 'linear-gradient(135deg, #1e3c72, #2a5298)',
            'space': 'linear-gradient(135deg, #000428, #004e92)',
            'sunset': 'linear-gradient(135deg, #ff6b6b, #feca57)',
            'mountains': 'linear-gradient(135deg, #4a90e2, #7b68ee)',
            'none': 'linear-gradient(135deg, #2a2a2a, #1a1a1a)'
        };

        if (backgrounds[type]) {
            backgroundDiv.style.background = backgrounds[type];
        }

        // Update active state
        document.querySelectorAll('.preset-bg-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-bg="${type}"]`)?.classList.add('active');
    }

    playMaximizeAudio(type) {
        // Stop current audio first
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        // Create new audio based on type
        const audioSources = {
            'rain': 'https://www.soundjay.com/misc/sounds/rain-01.wav', // Replace with actual URLs
            'forest': 'https://www.soundjay.com/nature/sounds/forest-ambient.wav',
            'ocean': 'https://www.soundjay.com/nature/sounds/ocean-waves.wav',
            'fireplace': 'https://www.soundjay.com/misc/sounds/fireplace.wav',
            'coffee-shop': 'https://www.soundjay.com/ambient/sounds/coffee-shop.wav'
        };
        
        if (audioSources[type]) {
            this.currentAudio = new Audio(audioSources[type]);
            this.currentAudio.loop = true;
            this.currentAudio.volume = 0.5; // Default volume
            
            this.currentAudio.play().then(() => {
                this.audioEnabled = true;
                this.showNotification(`Playing ${type} sounds`, 'success');
                this.updateAudioControls();
            }).catch(error => {
                console.log('Audio play failed:', error);
                this.showNotification(`Could not play ${type} sounds`, 'warning');
            });
        } else {
            this.showNotification(`${type} sounds not available`, 'info');
        }
        
        // Update active state
        document.querySelectorAll('.preset-audio-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-audio="${type}"]`)?.classList.add('active');
    }
    
    // Update audio control buttons
    updateAudioControls() {
        const audioBtn = document.getElementById('audio-control-btn');
        const autoAudioToggle = document.getElementById('auto-audio-toggle');
        
        if (audioBtn) {
            if (this.currentAudio && !this.currentAudio.paused) {
                audioBtn.innerHTML = '<i class="fas fa-pause"></i>';
                audioBtn.classList.add('playing');
            } else {
                audioBtn.innerHTML = '<i class="fas fa-play"></i>';
                audioBtn.classList.remove('playing');
            }
        }
        
        if (autoAudioToggle) {
            autoAudioToggle.checked = this.autoAudio;
        }
    }
    
    // Toggle audio play/pause
    toggleAudio() {
        if (!this.currentAudio) {
            this.showNotification('No audio selected', 'warning');
            return;
        }
        
        if (this.currentAudio.paused) {
            this.currentAudio.play().then(() => {
                this.audioEnabled = true;
                this.updateAudioControls();
            }).catch(error => {
                console.log('Audio play failed:', error);
            });
        } else {
            this.currentAudio.pause();
            this.audioEnabled = false;
            this.updateAudioControls();
        }
    }
    
    // Stop audio completely
    stopAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.audioEnabled = false;
            this.updateAudioControls();
            
            // Clear active audio button
            document.querySelectorAll('.preset-audio-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            this.showNotification('Audio stopped', 'info');
        }
    }
    
    // Toggle auto audio setting
    toggleAutoAudio() {
        this.autoAudio = !this.autoAudio;
        this.updateAudioControls();
        
        if (this.autoAudio) {
            this.showNotification('Auto-audio enabled - will start/stop with timer', 'success');
        } else {
            this.showNotification('Auto-audio disabled', 'info');
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const backgroundDiv = document.getElementById('background-image');
                if (backgroundDiv) {
                    backgroundDiv.style.background = `url(${e.target.result}) center/cover`;
                }
                this.showNotification('Background image uploaded', 'success');
            };
            reader.readAsDataURL(file);
        }
    }

    handleVideoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const backgroundVideo = document.getElementById('background-video');
            const backgroundDiv = document.getElementById('background-image');
            
            if (backgroundVideo) {
                const url = URL.createObjectURL(file);
                backgroundVideo.src = url;
                backgroundVideo.style.display = 'block';
                backgroundVideo.play();
                
                // Hide image background
                if (backgroundDiv) {
                    backgroundDiv.style.background = 'none';
                }
                
                this.showNotification('Background video uploaded', 'success');
            }
        }
    }

    handleAudioUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const audio = document.getElementById('background-audio');
            if (audio) {
                const url = URL.createObjectURL(file);
                audio.src = url;
                audio.play();
                this.showNotification('Background audio uploaded and playing', 'success');
            }
        }
    }

    setMaximizeVolume(value) {
        const audio = document.getElementById('background-audio');
        if (audio) {
            audio.volume = parseFloat(value);
        }
        
        // Update volume display
        const volumeValue = document.querySelector('.volume-value');
        if (volumeValue) {
            volumeValue.textContent = Math.round(value * 100) + '%';
        }
    }

    setTimerOpacity(value) {
        const timer = document.querySelector('.transparent-timer-container');
        if (timer) {
            timer.style.opacity = value;
        }
        
        // Update opacity display
        const opacityValue = document.querySelector('.opacity-value');
        if (opacityValue) {
            opacityValue.textContent = Math.round(value * 100) + '%';
        }
    }

    setTimerSize(value) {
        const timer = document.querySelector('.transparent-timer');
        if (timer) {
            timer.style.transform = `scale(${value})`;
        }
        
        // Update size display
        const sizeValue = document.querySelector('.size-value');
        if (sizeValue) {
            sizeValue.textContent = Math.round(value * 100) + '%';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    handleMaximizeKeyboard(event) {
        const overlay = document.getElementById('maximize-overlay');
        if (!overlay || overlay.style.display === 'none') return;

        switch (event.key) {
            case 'Escape':
                this.exitMaximizeMode();
                break;
            case ' ':
                event.preventDefault();
                if (this.isRunning) {
                    this.pauseTimer();
                } else {
                    this.startTimer();
                }
                break;
            case 's':
            case 'S':
                this.toggleMaximizeSettings();
                break;
        }

        // Ctrl combinations
        if (event.ctrlKey) {
            switch (event.key) {
                case 'f':
                    event.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'r':
                    event.preventDefault();
                    this.resetTimer();
                    break;
            }
        }
    }

    updateMaximizeTimer() {
        const maximizeTimer = document.getElementById('maximize-timer');
        const modeIndicator = document.getElementById('maximize-mode-indicator');
        
        // Calculate display time based on current mode
        let displayTime;
        
        switch (this.currentMode) {
            case 'task-focused':
                if (!this.selectedTask) {
                    displayTime = '00:00';
                } else {
                    const progress = this.getTaskProgress(this.selectedTask.id);
                    const totalTimeSpent = (progress.timeSpent || 0) + this.elapsedTime;
                    const estimatedTime = this.selectedTask.estimatedTime || 60;
                    const estimatedTimeMs = estimatedTime * 60 * 1000;
                    const remaining = estimatedTimeMs - totalTimeSpent;
                    displayTime = this.formatTime(Math.max(0, remaining));
                }
                break;
                
            case 'pomodoro':
                const pomodoroTime = this.getPomodoroTime() * 1000;
                const pomodoroRemaining = pomodoroTime - this.elapsedTime;
                displayTime = this.formatTime(Math.max(0, pomodoroRemaining));
                break;
                
            case 'stopwatch':
                displayTime = this.formatStopwatchTime(this.elapsedTime);
                break;
                
            case 'custom':
                const customTime = this.getCustomTime() * 1000;
                const customRemaining = customTime - this.elapsedTime;
                displayTime = this.formatTime(Math.max(0, customRemaining));
                break;
                
            default:
                displayTime = this.formatTime(this.elapsedTime);
                break;
        }
        
        if (maximizeTimer) {
            maximizeTimer.textContent = displayTime;
        }
        
        // Update mode indicator
        if (modeIndicator) {
            switch (this.currentMode) {
                case 'pomodoro':
                    modeIndicator.textContent = 'Pomodoro Session';
                    break;
                case 'stopwatch':
                    modeIndicator.textContent = 'Stopwatch Mode';
                    break;
                case 'custom':
                    modeIndicator.textContent = 'Custom Timer';
                    break;
                case 'task-focused':
                default:
                    if (this.selectedTask) {
                        modeIndicator.textContent = this.selectedTask.title;
                    } else {
                        modeIndicator.textContent = 'Select a task';
                    }
                    break;
            }
        }
        
        // Update maximize progress rings to sync with normal mode
        const maximizeTaskRing = document.getElementById('maximize-task-progress');
        const maximizeSessionRing = document.getElementById('maximize-session-progress');
        
        if (maximizeTaskRing && this.progressRings.task) {
            maximizeTaskRing.style.strokeDashoffset = this.progressRings.task.style.strokeDashoffset;
        }
        if (maximizeSessionRing && this.progressRings.session) {
            maximizeSessionRing.style.strokeDashoffset = this.progressRings.session.style.strokeDashoffset;
        }
        
        // Update maximize task display if it exists
        this.updateMaximizeTaskDisplay();
    }

    // ============================================
    // POMODORO MODE FUNCTIONALITY
    // ============================================

    setTimerMode(mode) {
        this.currentMode = mode;
        
        // Update UI for mode selection
        document.querySelectorAll('.mode-option').forEach(option => {
            option.classList.remove('active');
        });
        
        const selectedOption = document.querySelector(`[data-mode="${mode}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }

        // Show/hide custom timer settings
        const customSettings = document.getElementById('custom-timer-settings');
        if (customSettings) {
            customSettings.style.display = mode === 'custom' ? 'block' : 'none';
        }

        // Update timer mode title
        const modeTitle = document.getElementById('timer-mode-title');
        if (modeTitle) {
            modeTitle.textContent = this.timerModes[mode].name;
        }

        // Reset timer when changing modes
        this.resetTimer();
        
        // Update UI based on mode
        this.updateModeUI();
        
        this.showNotification(`Switched to ${this.timerModes[mode].name} mode`, 'info');
    }

    updateModeUI() {
        const modeIndicator = document.getElementById('mode-indicator');
        const sessionProgress = document.getElementById('session-progress');
        
        if (modeIndicator) {
            switch (this.currentMode) {
                case 'pomodoro':
                    modeIndicator.textContent = 'Pomodoro Session';
                    break;
                case 'custom':
                    modeIndicator.textContent = 'Custom Timer';
                    break;
                case 'task-focused':
                default:
                    if (this.selectedTask) {
                        modeIndicator.textContent = this.selectedTask.title;
                    } else {
                        modeIndicator.textContent = 'Select a task';
                    }
                    break;
            }
        }

        if (sessionProgress) {
            if (this.currentMode === 'pomodoro') {
                sessionProgress.textContent = '25 minute focus session';
            } else if (this.currentMode === 'custom') {
                sessionProgress.textContent = 'Custom timer session';
            } else {
                sessionProgress.textContent = this.selectedTask ? 'Task-focused session' : 'Ready to start';
            }
        }
    }

    getPomodoroTime() {
        return this.timerModes.pomodoro.duration;
    }

    getCustomTime() {
        const workTimeInput = document.getElementById('custom-work-time');
        return workTimeInput ? parseInt(workTimeInput.value) * 60 : 25 * 60;
    }

    getSessionDuration() {
        switch (this.currentMode) {
            case 'pomodoro':
                return this.getPomodoroTime();
            case 'custom':
                return this.getCustomTime();
            case 'task-focused':
            default:
                return this.selectedTask ? this.selectedTask.duration * 60 : 25 * 60;
        }
    }
    
    // Additional maximize mode methods
    handleAudioUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('audio/')) {
            const url = URL.createObjectURL(file);
            this.currentAudio = new Audio(url);
            this.currentAudio.loop = true;
            this.currentAudio.volume = 0.5;
            
            this.currentAudio.play().then(() => {
                this.audioEnabled = true;
                this.updateAudioControls();
                this.showNotification('Custom audio uploaded and playing', 'success');
            }).catch(error => {
                console.log('Custom audio play failed:', error);
                this.showNotification('Could not play uploaded audio', 'warning');
            });
        } else {
            this.showNotification('Please upload a valid audio file', 'warning');
        }
    }

    setMaximizeVolume(value) {
        const volume = parseFloat(value) / 100;
        if (this.currentAudio) {
            this.currentAudio.volume = volume;
        }
        
        // Update volume display
        const volumeDisplay = document.getElementById('volume-display');
        if (volumeDisplay) {
            volumeDisplay.textContent = `${Math.round(volume * 100)}%`;
        }
    }

    setTimerOpacity(value) {
        const opacity = parseFloat(value) / 100;
        const timerContainer = document.getElementById('maximize-timer-container');
        if (timerContainer) {
            timerContainer.style.opacity = opacity;
        }
        
        // Update opacity display
        const opacityDisplay = document.getElementById('opacity-display');
        if (opacityDisplay) {
            opacityDisplay.textContent = `${Math.round(opacity * 100)}%`;
        }
    }

    setTimerSize(value) {
        const scale = parseFloat(value) / 100;
        const timerContainer = document.getElementById('maximize-timer-container');
        if (timerContainer) {
            timerContainer.style.transform = `scale(${scale})`;
        }
        
        // Update size display
        const sizeDisplay = document.getElementById('size-display');
        if (sizeDisplay) {
            sizeDisplay.textContent = `${Math.round(scale * 100)}%`;
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.showNotification('Entered fullscreen mode', 'success');
            }).catch(error => {
                console.log('Fullscreen failed:', error);
            });
        } else {
            document.exitFullscreen().then(() => {
                this.showNotification('Exited fullscreen mode', 'info');
            });
        }
    }

    handleMaximizeKeyboard(event) {
        if (document.getElementById('maximize-overlay').style.display === 'none') return;
        
        switch(event.key) {
            case 'Escape':
                this.exitMaximizeMode();
                break;
            case ' ':
                event.preventDefault();
                if (this.isRunning) {
                    this.pauseTimer();
                } else {
                    this.startTimer();
                }
                break;
            case 'r':
            case 'R':
                this.resetTimer();
                break;
            case 's':
            case 'S':
                this.toggleMaximizeSettings();
                break;
            case 'f':
            case 'F':
                this.toggleFullscreen();
                break;
            case 'a':
            case 'A':
                this.toggleAudio();
                break;
        }
    }
}

// Initialize the enhanced task tracker
window.taskTracker = new EnhancedTaskTracker();

// Legacy compatibility - expose some methods globally  
window.FocusTimer = EnhancedTaskTracker;
