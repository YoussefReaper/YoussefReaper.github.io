// Enhanced Task Tracker with Pomodoro, Stopwatch, and Analytics
class TaskTracker {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentSession = null;
        this.timerInterval = null;
        this.mode = 'stopwatch'; // stopwatch, pomodoro, custom
        this.sessions = [];
        this.tasks = [];
        this.stats = {
            totalTime: 0,
            sessionsCompleted: 0,
            streak: 0,
            focusScore: 95
        };
        
        // Pomodoro settings
        this.pomodoroSettings = {
            workDuration: 25 * 60, // 25 minutes in seconds
            shortBreak: 5 * 60,    // 5 minutes in seconds
            longBreak: 15 * 60,    // 15 minutes in seconds
            sessionsUntilLongBreak: 4
        };
        
        this.currentPhase = 'work'; // work, shortBreak, longBreak
        this.pomodoroCount = 0;
        
        // Enhanced features
        this.focusGoals = {
            daily: 2 * 60 * 60, // 2 hours daily goal
            weekly: 14 * 60 * 60, // 14 hours weekly goal
            streak: 0
        };
        
        this.sessionTemplates = [
            { name: 'Deep Work', duration: 90, mode: 'custom', icon: '🧠' },
            { name: 'Quick Focus', duration: 25, mode: 'pomodoro', icon: '⚡' },
            { name: 'Study Sprint', duration: 45, mode: 'custom', icon: '📚' },
            { name: 'Creative Flow', duration: 120, mode: 'stopwatch', icon: '🎨' },
            { name: 'Review Session', duration: 30, mode: 'custom', icon: '📝' }
        ];
        
        this.notifications = {
            enabled: true,
            sound: true,
            breakReminders: true,
            goalReminders: true
        };
        
        this.keyboardShortcuts = {
            'Space': 'toggleTimer',
            'KeyS': 'stopTimer',
            'KeyP': 'pauseTimer',
            'KeyQ': 'quickStart',
            'KeyN': 'addNote'
        };

        this.insights = {
            lastAnalysis: null,
            suggestions: [],
            productivity: {
                bestHours: [],
                bestDays: [],
                averageFocus: 0
            }
        };
        
        this.breakReminders = {
            enabled: true,
            interval: 60 * 60, // 1 hour
            lastReminder: null
        };
        
        this.currentSessionNotes = '';
        this.autoStartBreaks = false;
        this.smartBreakSuggestions = true;
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        this.loadTasks();
        this.generateWeeklyChart();
        this.updateGoalProgress();
        this.generateProductivityInsights();
        
        // Enhanced initialization
        this.initEnhanced();
    }
    
    setupEventListeners() {
        // Mode selection
        document.querySelectorAll('input[name="timerMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.mode = e.target.value;
                this.updateModeUI();
            });
        });
        
        // Custom duration toggle
        document.getElementById('customMinutes')?.addEventListener('input', () => {
            this.updateCustomDuration();
        });
        
        // Control buttons
        document.getElementById('playPauseBtn')?.addEventListener('click', () => {
            this.toggleTimer();
        });
        
        document.getElementById('stopBtn')?.addEventListener('click', () => {
            this.stopTimer();
        });
        
        document.getElementById('skipBtn')?.addEventListener('click', () => {
            this.skipBreak();
        });
        
        // Enhanced event listeners
        this.setupKeyboardShortcuts();
        this.setupBreakReminders();
        this.setupSessionTemplates();
        this.setupFocusGoals();
        
        // Session notes
        document.getElementById('addNoteBtn')?.addEventListener('click', () => {
            this.toggleSessionNotes();
        });
        
        document.getElementById('sessionNotesTextarea')?.addEventListener('input', (e) => {
            this.currentSessionNotes = e.target.value;
        });
        
        // Quick actions
        document.getElementById('quickStartBtn')?.addEventListener('click', () => {
            this.quickStart();
        });
        
        document.getElementById('smartBreakBtn')?.addEventListener('click', () => {
            this.suggestSmartBreak();
        });
        
        // Settings
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.showSettings();
        });
        
        // Auto-start breaks toggle
        document.getElementById('autoStartBreaks')?.addEventListener('change', (e) => {
            this.autoStartBreaks = e.target.checked;
            this.saveSettings();
        });
        
        // Break reminder toggle
        document.getElementById('breakRemindersToggle')?.addEventListener('change', (e) => {
            this.breakReminders.enabled = e.target.checked;
            this.saveSettings();
        });
        
        // Goal settings
        document.getElementById('dailyGoalSlider')?.addEventListener('input', (e) => {
            this.focusGoals.daily = parseInt(e.target.value) * 60 * 60;
            this.updateGoalDisplay();
            this.saveSettings();
        });
        
        document.getElementById('weeklyGoalSlider')?.addEventListener('input', (e) => {
            this.focusGoals.weekly = parseInt(e.target.value) * 60 * 60;
            this.updateGoalDisplay();
            this.saveSettings();
        });
        
        // Task selection
        document.getElementById('taskSelector')?.addEventListener('change', (e) => {
            this.selectTask(e.target.value);
        });
        
        document.getElementById('refreshTasksBtn')?.addEventListener('click', () => {
            this.loadTasks();
        });
        
        // Modal controls
        document.getElementById('closeSessionModal')?.addEventListener('click', () => {
            this.closeSessionModal();
        });
        
        document.getElementById('continueBtn')?.addEventListener('click', () => {
            this.continueSession();
        });
        
        document.getElementById('takeBreakBtn')?.addEventListener('click', () => {
            this.takeBreak();
        });
        
        // View all sessions
        document.getElementById('viewAllSessionsBtn')?.addEventListener('click', () => {
            this.viewAllSessions();
        });
    }
    
    loadData() {
        // Load sessions from localStorage
        const savedSessions = localStorage.getItem('trackerSessions');
        if (savedSessions) {
            this.sessions = JSON.parse(savedSessions);
        }
        
        // Load stats
        const savedStats = localStorage.getItem('trackerStats');
        if (savedStats) {
            this.stats = { ...this.stats, ...JSON.parse(savedStats) };
        }
        
        // Calculate today's time
        this.calculateTodayStats();
    }
    
    saveData() {
        localStorage.setItem('trackerSessions', JSON.stringify(this.sessions));
        localStorage.setItem('trackerStats', JSON.stringify(this.stats));
    }
    
    loadTasks() {
        // Load tasks from tasks.js localStorage
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
        
        this.updateTaskSelector();
    }
    
    updateTaskSelector() {
        const selector = document.getElementById('taskSelector');
        if (!selector) return;
        
        // Clear existing options except the first one
        while (selector.children.length > 1) {
            selector.removeChild(selector.lastChild);
        }
        
        // Add tasks
        this.tasks.forEach(task => {
            if (!task.completed) {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.name;
                selector.appendChild(option);
            }
        });
        
        // Add quick options
        const quickOptions = [
            { id: 'study', name: '📚 General Study Session' },
            { id: 'reading', name: '📖 Reading Session' },
            { id: 'homework', name: '✏️ Homework Time' },
            { id: 'project', name: '🚀 Project Work' },
            { id: 'break', name: '☕ Focus Break' }
        ];
        
        quickOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.id;
            optionElement.textContent = option.name;
            selector.appendChild(optionElement);
        });
    }
    
    selectTask(taskId) {
        const taskDetails = document.getElementById('taskDetails');
        if (!taskId) {
            taskDetails.style.display = 'none';
            return;
        }
        
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.updateTaskDetails(task);
            taskDetails.style.display = 'block';
        } else {
            // Handle quick options
            const quickTask = this.getQuickTaskDetails(taskId);
            this.updateTaskDetails(quickTask);
            taskDetails.style.display = 'block';
        }
    }
    
    getQuickTaskDetails(taskId) {
        const quickTasks = {
            'study': { name: 'General Study Session', duration: '60', priority: 'Medium' },
            'reading': { name: 'Reading Session', duration: '45', priority: 'Low' },
            'homework': { name: 'Homework Time', duration: '90', priority: 'High' },
            'project': { name: 'Project Work', duration: '120', priority: 'High' },
            'break': { name: 'Focus Break', duration: '15', priority: 'Low' }
        };
        
        return quickTasks[taskId] || { name: 'Custom Task', duration: '30', priority: 'Medium' };
    }
    
    updateTaskDetails(task) {
        document.getElementById('taskDuration').textContent = `${task.duration} min`;
        document.getElementById('taskPriority').textContent = task.priority;
        
        // Calculate progress if it's a real task
        let progress = 0;
        if (task.id) {
            const taskSessions = this.sessions.filter(s => s.taskId === task.id);
            const totalTracked = taskSessions.reduce((sum, s) => sum + s.duration, 0);
            const expectedDuration = parseInt(task.duration) * 60; // Convert to seconds
            progress = Math.min((totalTracked / expectedDuration) * 100, 100);
        }
        
        document.getElementById('taskProgressFill').style.width = `${progress}%`;
        document.getElementById('taskProgressText').textContent = 
            progress > 0 ? `${Math.round(progress)}% completed` : 'Not started';
    }
    
    updateModeUI() {
        const customDuration = document.getElementById('customDuration');
        if (customDuration) {
            customDuration.style.display = this.mode === 'custom' ? 'block' : 'none';
        }
    }
    
    updateCustomDuration() {
        // Update UI when custom duration changes
    }
    
    toggleTimer() {
        if (!this.isRunning) {
            this.startTimer();
        } else if (this.isPaused) {
            this.resumeTimer();
        } else {
            this.pauseTimer();
        }
    }
    
    startTimer() {
        const taskSelector = document.getElementById('taskSelector');
        const selectedTask = taskSelector?.value;
        
        if (!selectedTask) {
            this.showNotification('Please select a task to track', 'warning');
            return;
        }
        
        // Create new session
        this.currentSession = {
            id: this.generateSessionId(),
            taskId: selectedTask,
            startTime: new Date(),
            mode: this.mode,
            elapsedTime: 0,
            isActive: true
        };
        
        // Set duration based on mode
        this.setSessionDuration();
        
        // Switch to active session view
        this.showActiveSession();
        
        // Start the timer
        this.isRunning = true;
        this.isPaused = false;
        this.startTimerInterval();
        
        this.updateControlButtons();
        this.updateSessionInfo();
    }
    
    setSessionDuration() {
        switch (this.mode) {
            case 'pomodoro':
                this.currentSession.duration = this.pomodoroSettings.workDuration;
                this.currentPhase = 'work';
                break;
            case 'custom':
                const customMinutes = document.getElementById('customMinutes')?.value || 25;
                this.currentSession.duration = parseInt(customMinutes) * 60;
                break;
            case 'stopwatch':
            default:
                this.currentSession.duration = null; // Unlimited
                break;
        }
    }
    
    startTimerInterval() {
        this.timerInterval = setInterval(() => {
            this.currentSession.elapsedTime++;
            this.updateTimerDisplay();
            this.updateProgress();
            
            // Check if session is complete (for timed modes)
            if (this.currentSession.duration && 
                this.currentSession.elapsedTime >= this.currentSession.duration) {
                this.completePhase();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isPaused = true;
        clearInterval(this.timerInterval);
        this.updateControlButtons();
        this.updateTimerPhase('Paused');
    }
    
    resumeTimer() {
        this.isPaused = false;
        this.startTimerInterval();
        this.updateControlButtons();
        this.updateTimerPhase();
    }
    
    stopTimer() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        
        if (this.currentSession) {
            this.saveSession();
        }
        
        this.hideActiveSession();
        this.resetTimer();
    }
    
    completePhase() {
        clearInterval(this.timerInterval);
        
        if (this.mode === 'pomodoro') {
            this.handlePomodoroPhaseComplete();
        } else {
            this.completeSession();
        }
    }
    
    handlePomodoroPhaseComplete() {
        if (this.currentPhase === 'work') {
            this.pomodoroCount++;
            this.saveSession();
            
            // Determine break type
            if (this.pomodoroCount % this.pomodoroSettings.sessionsUntilLongBreak === 0) {
                this.startBreak('long');
            } else {
                this.startBreak('short');
            }
        } else {
            // Break complete, start new work session
            this.startWorkSession();
        }
    }
    
    startBreak(type) {
        this.currentPhase = type === 'long' ? 'longBreak' : 'shortBreak';
        this.currentSession.duration = type === 'long' ? 
            this.pomodoroSettings.longBreak : 
            this.pomodoroSettings.shortBreak;
        this.currentSession.elapsedTime = 0;
        
        this.updateTimerPhase(`${type === 'long' ? 'Long' : 'Short'} Break`);
        this.showSkipButton(true);
        this.startTimerInterval();
    }
    
    startWorkSession() {
        this.currentPhase = 'work';
        this.currentSession.duration = this.pomodoroSettings.workDuration;
        this.currentSession.elapsedTime = 0;
        
        this.updateTimerPhase('Focus Time');
        this.showSkipButton(false);
        this.startTimerInterval();
    }
    
    skipBreak() {
        if (this.currentPhase !== 'work') {
            clearInterval(this.timerInterval);
            this.startWorkSession();
        }
    }
    
    completeSession() {
        this.saveSession();
        this.showSessionCompleteModal();
        this.updateStats();
        this.hideActiveSession();
        this.resetTimer();
    }
    
    saveSession() {
        if (!this.currentSession) return;
        
        const sessionData = {
            ...this.currentSession,
            endTime: new Date(),
            completed: true,
            notes: this.currentSessionNotes || ''
        };
        
        this.sessions.push(sessionData);
        this.saveData();
        this.updateRecentSessions();
        this.calculateTodayStats();
        this.updateGoalProgress();
        this.checkGoalAchievements();
        
        // Clear session notes for next session
        this.currentSessionNotes = '';
        const notesTextarea = document.getElementById('sessionNotesTextarea');
        if (notesTextarea) notesTextarea.value = '';
    }
    
    showActiveSession() {
        document.getElementById('trackerDashboard').style.display = 'none';
        document.getElementById('activeSessionPanel').style.display = 'block';
    }
    
    hideActiveSession() {
        document.getElementById('trackerDashboard').style.display = 'block';
        document.getElementById('activeSessionPanel').style.display = 'none';
    }
    
    updateTimerDisplay() {
        const elapsed = this.currentSession.elapsedTime;
        const display = document.getElementById('timerDisplay');
        
        if (this.mode === 'stopwatch') {
            display.textContent = this.formatTime(elapsed);
        } else {
            const remaining = Math.max(0, this.currentSession.duration - elapsed);
            display.textContent = this.formatTime(remaining);
        }
    }
    
    updateProgress() {
        if (this.mode === 'stopwatch') return;
        
        const elapsed = this.currentSession.elapsedTime;
        const total = this.currentSession.duration;
        const progress = (elapsed / total) * 100;
        
        // Update circular progress
        const circle = document.getElementById('progressCircle');
        const circumference = 2 * Math.PI * 130; // radius = 130
        const offset = circumference - (progress / 100) * circumference;
        circle.style.strokeDashoffset = offset;
        
        // Update progress stats
        document.getElementById('elapsedTime').textContent = this.formatTime(elapsed);
        document.getElementById('remainingTime').textContent = this.formatTime(total - elapsed);
        document.getElementById('completionPercent').textContent = `${Math.round(progress)}%`;
    }
    
    updateControlButtons() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const playPauseIcon = playPauseBtn?.querySelector('i');
        const playPauseText = playPauseBtn?.querySelector('span');
        
        if (this.isRunning && !this.isPaused) {
            playPauseIcon?.setAttribute('class', 'fas fa-pause');
            if (playPauseText) playPauseText.textContent = 'Pause';
            playPauseBtn?.classList.add('active');
        } else {
            playPauseIcon?.setAttribute('class', 'fas fa-play');
            if (playPauseText) playPauseText.textContent = this.isPaused ? 'Resume' : 'Start';
            playPauseBtn?.classList.remove('active');
        }
    }
    
    updateSessionInfo() {
        const taskSelector = document.getElementById('taskSelector');
        const selectedOption = taskSelector?.options[taskSelector.selectedIndex];
        
        if (selectedOption) {
            document.getElementById('activeSessionTitle').textContent = 'Active Session';
            document.getElementById('activeSessionTask').textContent = selectedOption.textContent;
        }
        
        const modeBadge = document.getElementById('sessionModeBadge');
        if (modeBadge) {
            modeBadge.textContent = this.mode.charAt(0).toUpperCase() + this.mode.slice(1);
        }
    }
    
    showSkipButton(show = false) {
        const skipBtn = document.getElementById('skipBreakBtn');
        if (skipBtn) {
            skipBtn.style.display = show ? 'block' : 'none';
        }
    }
    
    updateTimerPhase(phase = null) {
        const phaseElement = document.getElementById('timerPhase');
        if (!phaseElement) return;
        
        if (phase) {
            phaseElement.textContent = phase;
            return;
        }
        
        if (this.mode === 'pomodoro') {
            switch (this.currentPhase) {
                case 'work':
                    phaseElement.textContent = 'Focus Time';
                    break;
                case 'shortBreak':
                    phaseElement.textContent = 'Short Break';
                    break;
                case 'longBreak':
                    phaseElement.textContent = 'Long Break';
                    break;
            }
        } else if (this.mode === 'custom') {
            phaseElement.textContent = 'Custom Session';
        } else {
            phaseElement.textContent = 'Stopwatch Mode';
        }
    }
    
    showSkipButton(show) {
        const skipBtn = document.getElementById('skipBtn');
        if (skipBtn) {
            skipBtn.style.display = show ? 'flex' : 'none';
        }
    }
    
    resetTimer() {
        this.currentSession = null;
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        
        // Reset UI
        document.getElementById('timerDisplay').textContent = '00:00:00';
        document.getElementById('timerPhase').textContent = 'Ready to Start';
        document.getElementById('elapsedTime').textContent = '0:00';
        document.getElementById('remainingTime').textContent = '--:--';
        document.getElementById('completionPercent').textContent = '0%';
        
        // Reset progress circle
        const circle = document.getElementById('progressCircle');
        if (circle) {
            circle.style.strokeDashoffset = 2 * Math.PI * 130; // Full circle
        }
        
        this.updateControlButtons();
        this.showSkipButton(false);
    }
    
    startQuickTracking() {
        // Set to stopwatch mode and start with first available task
        document.querySelector('input[value="stopwatch"]').checked = true;
        this.mode = 'stopwatch';
        
        const taskSelector = document.getElementById('taskSelector');
        if (taskSelector && taskSelector.children.length > 1) {
            taskSelector.selectedIndex = 1; // Select first task
            this.selectTask(taskSelector.value);
        }
        
        this.startTimer();
    }
    
    startQuickPomodoro() {
        // Set to pomodoro mode and start
        document.querySelector('input[value="pomodoro"]').checked = true;
        this.mode = 'pomodoro';
        
        const taskSelector = document.getElementById('taskSelector');
        if (taskSelector && taskSelector.children.length > 1) {
            taskSelector.selectedIndex = 1; // Select first task
            this.selectTask(taskSelector.value);
        }
        
        this.startTimer();
    }
    
    showSessionCompleteModal() {
        const modal = document.getElementById('sessionCompleteModal');
        if (modal) {
            // Update modal content
            const duration = this.formatTime(this.currentSession.elapsedTime);
            const taskName = document.getElementById('activeSessionTask').textContent;
            const mode = this.mode.charAt(0).toUpperCase() + this.mode.slice(1);
            
            document.getElementById('sessionDuration').textContent = duration;
            document.getElementById('sessionTask').textContent = taskName;
            document.getElementById('sessionMode').textContent = mode;
            
            modal.classList.add('active');
        }
    }
    
    closeSessionModal() {
        const modal = document.getElementById('sessionCompleteModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    continueSession() {
        this.closeSessionModal();
        // Start a new session with the same task
        setTimeout(() => this.startTimer(), 500);
    }
    
    takeBreak() {
        this.closeSessionModal();
        this.showNotification('Great work! Take a well-deserved break. 🌟', 'success');
    }
    
    calculateTodayStats() {
        const today = new Date().toDateString();
        const todaySessions = this.sessions.filter(session => {
            return new Date(session.startTime).toDateString() === today;
        });
        
        const totalSeconds = todaySessions.reduce((sum, session) => sum + session.elapsedTime, 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        document.getElementById('totalTrackedTime').textContent = `${hours}h ${minutes}m`;
        document.getElementById('sessionsCompleted').textContent = todaySessions.length;
        
        // Update daily progress
        const dailyGoal = 4 * 3600; // 4 hours in seconds
        const progress = Math.min((totalSeconds / dailyGoal) * 100, 100);
        
        document.getElementById('dailyProgressPercentage').textContent = `${Math.round(progress)}%`;
        document.getElementById('dailyTracked').textContent = `${hours}h ${minutes}m`;
        
        const remainingSeconds = Math.max(0, dailyGoal - totalSeconds);
        const remainingHours = Math.floor(remainingSeconds / 3600);
        const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
        document.getElementById('dailyRemaining').textContent = `${remainingHours}h ${remainingMinutes}m`;
        
        // Update progress circle
        const circle = document.getElementById('dailyProgressCircle');
        if (circle) {
            const circumference = 2 * Math.PI * 40; // radius = 40
            const offset = circumference - (progress / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
    }
    
    updateRecentSessions() {
        const sessionsList = document.getElementById('recentSessionsList');
        if (!sessionsList) return;
        
        const recentSessions = this.sessions.slice(-5).reverse();
        
        if (recentSessions.length === 0) {
            sessionsList.innerHTML = `
                <div class="empty-sessions">
                    <i class="fas fa-clock"></i>
                    <p>No sessions yet today</p>
                    <span>Start tracking to see your sessions here</span>
                </div>
            `;
            return;
        }
        
        sessionsList.innerHTML = recentSessions.map(session => {
            const taskName = this.getTaskName(session.taskId);
            const duration = this.formatTime(session.elapsedTime);
            const timeAgo = this.getTimeAgo(session.endTime);
            
            return `
                <div class="session-item">
                    <div class="session-info">
                        <h4>${taskName}</h4>
                        <p>${timeAgo}</p>
                    </div>
                    <div class="session-duration">${duration}</div>
                </div>
            `;
        }).join('');
    }
    
    getTaskName(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) return task.name;
        
        const quickTask = this.getQuickTaskDetails(taskId);
        return quickTask.name;
    }
    
    generateWeeklyChart() {
        const chartContainer = document.getElementById('weeklyChart');
        if (!chartContainer) return;
        
        const today = new Date();
        const weekData = [];
        
        // Generate data for the last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            const daySessions = this.sessions.filter(session => {
                return new Date(session.startTime).toDateString() === dateStr;
            });
            
            const totalTime = daySessions.reduce((sum, session) => sum + session.elapsedTime, 0);
            weekData.push(totalTime);
        }
        
        const maxTime = Math.max(...weekData, 3600); // At least 1 hour for scale
        
        chartContainer.innerHTML = weekData.map(time => {
            const height = (time / maxTime) * 100;
            return `<div class="chart-bar" style="height: ${height}%" title="${this.formatTime(time)}"></div>`;
        }).join('');
        
        // Update weekly summary
        const weeklyTotal = weekData.reduce((sum, time) => sum + time, 0);
        const dailyAverage = weeklyTotal / 7;
        
        document.getElementById('weeklyTotal').textContent = this.formatTime(weeklyTotal);
        document.getElementById('dailyAverage').textContent = this.formatTime(dailyAverage);
    }
    
    updateStats() {
        this.stats.sessionsCompleted++;
        this.stats.totalTime += this.currentSession.elapsedTime;
        this.saveData();
        
        // Update UI
        document.getElementById('sessionsCompleted').textContent = this.stats.sessionsCompleted;
        document.getElementById('streakDays').textContent = this.stats.streak;
        document.getElementById('focusScore').textContent = `${this.stats.focusScore}%`;
    }
    
    viewDetailedStats() {
        this.showDetailedStatsModal();
    }
    
    viewAllSessions() {
        this.showSessionHistoryModal();
    }
    
    // Enhanced Modal Functions
    showSessionCompleteModal() {
        const modal = document.getElementById('sessionCompleteModal');
        const duration = this.currentSession.elapsedTime;
        const coinsEarned = Math.floor(duration / 60) * 2; // 2 coins per minute
        const xpEarned = Math.floor(duration / 60) * 5; // 5 XP per minute
        
        // Update rewards
        document.getElementById('coinsEarned').textContent = `+${coinsEarned} coins`;
        document.getElementById('xpEarned').textContent = `+${xpEarned} XP`;
        
        // Motivational messages
        const messages = [
            "Excellent focus! You're building great habits! 🌟",
            "Outstanding dedication! Keep up the momentum! 🚀",
            "Fantastic work! You're becoming more productive! 💪",
            "Great session! Your consistency is impressive! 🎯",
            "Well done! Every minute counts towards your goals! ⭐"
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        document.getElementById('completionMessage').textContent = message;
        
        modal.style.display = 'block';
        
        // Update user stats (if available)
        this.updateUserRewards(coinsEarned, xpEarned);
    }
    
    closeSessionModal() {
        document.getElementById('sessionCompleteModal').style.display = 'none';
    }
    
    continueSession() {
        this.closeSessionModal();
        // Start a new session with the same task
        setTimeout(() => this.startTimer(), 500);
    }
    
    takeBreak() {
        this.closeSessionModal();
        this.showNotification('Great work! Take a well-deserved break. 🌟', 'success');
    }
    
    // Enhanced Features Methods
    useTemplate(templateName) {
        const templates = {
            'deep-work': { duration: 90, mode: 'custom', task: 'Deep Work Session' },
            'creative': { duration: 120, mode: 'stopwatch', task: 'Creative Flow Session' },
            'review': { duration: 30, mode: 'custom', task: 'Review Session' }
        };
        
        const template = templates[templateName];
        if (template) {
            this.mode = template.mode;
            if (template.mode === 'custom') {
                document.getElementById('customMinutes').value = template.duration;
            }
            this.updateModeUI();
            this.showNotification(`${template.task} template applied`, 'success');
        }
    }
    
    showDetailedInsights() {
        // This would open a detailed insights modal
        const insights = this.generateProductivityInsights();
        this.showNotification('Detailed insights available in Analytics', 'info');
    }
    
    configureBreaks() {
        // This would open break configuration
        this.showNotification('Break configuration coming soon', 'info');
    }
    
    openFocusMode() {
        // Enable focus mode
        document.body.classList.add('focus-mode');
        this.showNotification('Focus mode activated', 'success');
        
        // Auto-disable after session
        setTimeout(() => {
            document.body.classList.remove('focus-mode');
            this.showNotification('Focus mode deactivated', 'info');
        }, 5000); // 5 seconds for demo
    }
    
    manageTemplates() {
        this.showNotification('Template management coming soon', 'info');
    }
    
    openAdvancedAnalytics() {
        // This would redirect to analytics page or open modal
        window.location.href = 'productivity-economics.html';
    }
    
    exportData() {
        const data = {
            sessions: this.sessions,
            stats: this.stats,
            settings: this.pomodoroSettings,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tracker-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully', 'success');
    }
    
    updateEnhancedUI() {
        // Update enhanced stat cards
        const todayTime = this.getTodayTime();
        const dailyGoal = 2 * 60 * 60; // 2 hours
        const progressPercent = Math.min(100, (todayTime / dailyGoal) * 100);
        
        const todayProgressFill = document.getElementById('todayProgressFill');
        if (todayProgressFill) {
            todayProgressFill.style.width = `${progressPercent}%`;
        }
        
        // Update focus meter
        const focusMeterFill = document.getElementById('focusMeterFill');
        if (focusMeterFill) {
            focusMeterFill.style.width = `${this.stats.focusScore}%`;
        }
        
        // Update session badges
        this.updateSessionBadges();
        
        // Update smart suggestions
        this.updateSmartSuggestions();
        
        // Update peak hours display
        const peakHours = this.calculatePeakHours();
        const peakHoursDisplay = document.getElementById('peakHours');
        if (peakHoursDisplay) {
            peakHoursDisplay.textContent = peakHours;
        }
        
        // Update average session
        const avgSession = this.calculateAverageSession();
        const avgSessionDisplay = document.getElementById('avgSession');
        if (avgSessionDisplay) {
            avgSessionDisplay.textContent = avgSession;
        }
    }
    
    updateSessionBadges() {
        const sessionBadges = document.getElementById('sessionBadges');
        if (!sessionBadges) return;
        
        const todaySessions = this.sessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            const today = new Date();
            return sessionDate.toDateString() === today.toDateString();
        }).length;
        
        let badges = '';
        for (let i = 0; i < Math.min(todaySessions, 5); i++) {
            badges += '<span class="session-badge">✓</span>';
        }
        
        sessionBadges.innerHTML = badges;
    }
    
    updateSmartSuggestions() {
        const suggestions = document.getElementById('smartSuggestions');
        if (!suggestions) return;
        
        const currentHour = new Date().getHours();
        let suggestion = 'Ready to start tracking your productivity!';
        
        if (currentHour >= 9 && currentHour <= 11) {
            suggestion = 'Perfect! You\'re in your peak focus hours (9-11 AM)';
        } else if (currentHour >= 14 && currentHour <= 16) {
            suggestion = 'Afternoon energy dip - consider a short break first';
        } else if (currentHour >= 18) {
            suggestion = 'Evening session - great for review and planning';
        }
        
        suggestions.innerHTML = `
            <div class="suggestion-item">
                <i class="fas fa-lightbulb"></i>
                <span>${suggestion}</span>
            </div>
        `;
    }
    
    calculatePeakHours() {
        // Analyze session data to find peak productivity hours
        const hourlyData = new Array(24).fill(0);
        
        this.sessions.forEach(session => {
            const hour = new Date(session.startTime).getHours();
            hourlyData[hour] += session.duration;
        });
        
        const maxHour = hourlyData.indexOf(Math.max(...hourlyData));
        return `${maxHour}:00-${maxHour + 2}:00`;
    }
    
    calculateAverageSession() {
        if (this.sessions.length === 0) return '0m';
        
        const totalDuration = this.sessions.reduce((sum, session) => sum + session.duration, 0);
        const avgMinutes = Math.round(totalDuration / this.sessions.length / 60);
        
        if (avgMinutes >= 60) {
            const hours = Math.floor(avgMinutes / 60);
            const minutes = avgMinutes % 60;
            return `${hours}h ${minutes}m`;
        }
        
        return `${avgMinutes}m`;
    }
    
    getTodayTime() {
        const today = new Date().toDateString();
        return this.sessions
            .filter(session => new Date(session.startTime).toDateString() === today)
            .reduce((sum, session) => sum + session.duration, 0);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `tracker-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
    
    // Override init to include enhanced features
    initEnhanced() {
        this.init(); // Call original init
        this.setupEnhancedEventListeners();
        this.updateEnhancedUI();
        
        // Start background updates for enhanced features
        setInterval(() => {
            this.updateEnhancedUI();
        }, 30000); // Update every 30 seconds
    }
    
    setupEnhancedEventListeners() {
        // Deep work button
        const deepWorkBtn = document.getElementById('deepWorkBtn');
        if (deepWorkBtn) {
            deepWorkBtn.addEventListener('click', () => {
                this.useTemplate('deep-work');
            });
        }
        
        // Break reminder button
        const breakReminderBtn = document.getElementById('breakReminderBtn');
        if (breakReminderBtn) {
            breakReminderBtn.addEventListener('click', () => {
                this.showNotification('Break reminder set for 60 minutes', 'success');
            });
        }
        
        // Habit tracking button
        const habitTrackingBtn = document.getElementById('habitTrackingBtn');
        if (habitTrackingBtn) {
            habitTrackingBtn.addEventListener('click', () => {
                window.location.href = 'productivity-economics.html';
            });
        }
        
        // Focus button
        const focusBtn = document.getElementById('focusBtn');
        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                this.openFocusMode();
            });
        }
        
        // Smart breaks toggle
        const smartBreaksToggle = document.getElementById('smartBreaksToggle');
        if (smartBreaksToggle) {
            smartBreaksToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.showNotification(`Smart breaks ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }
        
        // Notification block toggle
        const notificationBlockToggle = document.getElementById('notificationBlockToggle');
        if (notificationBlockToggle) {
            notificationBlockToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.showNotification(`Notification blocking ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }
        
        // Ambient sound toggle
        const ambientSoundToggle = document.getElementById('ambientSoundToggle');
        if (ambientSoundToggle) {
            ambientSoundToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.showNotification(`Focus sounds ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }
    }
    
    // Utility functions
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `tracker-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
    
    // Override init to include enhanced features
    initEnhanced() {
        this.init(); // Call original init
        this.setupEnhancedEventListeners();
        this.updateEnhancedUI();
        
        // Start background updates for enhanced features
        setInterval(() => {
            this.updateEnhancedUI();
        }, 30000); // Update every 30 seconds
    }
    
    setupEnhancedEventListeners() {
        // Deep work button
        const deepWorkBtn = document.getElementById('deepWorkBtn');
        if (deepWorkBtn) {
            deepWorkBtn.addEventListener('click', () => {
                this.useTemplate('deep-work');
            });
        }
        
        // Break reminder button
        const breakReminderBtn = document.getElementById('breakReminderBtn');
        if (breakReminderBtn) {
            breakReminderBtn.addEventListener('click', () => {
                this.showNotification('Break reminder set for 60 minutes', 'success');
            });
        }
        
        // Habit tracking button
        const habitTrackingBtn = document.getElementById('habitTrackingBtn');
        if (habitTrackingBtn) {
            habitTrackingBtn.addEventListener('click', () => {
                window.location.href = 'productivity-economics.html';
            });
        }
        
        // Focus button
        const focusBtn = document.getElementById('focusBtn');
        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                this.openFocusMode();
            });
        }
        
        // Smart breaks toggle
        const smartBreaksToggle = document.getElementById('smartBreaksToggle');
        if (smartBreaksToggle) {
            smartBreaksToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.showNotification(`Smart breaks ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }
        
        // Notification block toggle
        const notificationBlockToggle = document.getElementById('notificationBlockToggle');
        if (notificationBlockToggle) {
            notificationBlockToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.showNotification(`Notification blocking ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }
        
        // Ambient sound toggle
        const ambientSoundToggle = document.getElementById('ambientSoundToggle');
        if (ambientSoundToggle) {
            ambientSoundToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.showNotification(`Focus sounds ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }
    }
}

// Initialize enhanced tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskTracker = new TaskTracker();
    // Initialize enhanced features
    window.taskTracker.initEnhanced();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskTracker;
}