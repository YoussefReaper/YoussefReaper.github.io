// Schedule Manager
class ScheduleManager {
    constructor() {
        this.currentDate = new Date();
        this.events = this.loadEvents();
        this.currentView = 'day';
        this.focusMode = false;
        
        this.init();
    }

    init() {
        this.initializeElements();
        this.bindEvents();
        this.updateDateDisplay();
        this.renderTimeBlocks();
        this.updateStats();
        this.updateOverview();
        this.loadAISuggestions();
        
        // Auto-update every minute
        setInterval(() => {
            this.updateStats();
            this.updateTimeBlockStatus();
        }, 60000);
    }

    initializeElements() {
        // Navigation elements
        this.prevDayBtn = document.getElementById('prevDay');
        this.nextDayBtn = document.getElementById('nextDay');
        this.currentDateTitle = document.getElementById('currentDateTitle');
        this.currentDateSubtitle = document.getElementById('currentDateSubtitle');
        
        // View toggles
        this.viewBtns = document.querySelectorAll('.view-btn');
        
        // Add event button
        this.addEventBtn = document.getElementById('addEventBtn');
        
        // Quick add panel
        this.quickAddPanel = document.getElementById('quickAddPanel');
        this.quickAddForm = document.getElementById('quickAddForm');
        this.closeQuickAddBtn = document.getElementById('closeQuickAdd');
        
        // Time blocks container
        this.timeBlocksContainer = document.getElementById('timeBlocksContainer');
        
        // Action buttons
        this.optimizeBtn = document.getElementById('optimizeSchedule');
        this.focusModeBtn = document.getElementById('focusMode');
        this.refreshSuggestionsBtn = document.getElementById('refreshSuggestions');
        
        // Modal elements
        this.eventModal = document.getElementById('eventModal');
        this.eventForm = document.getElementById('eventForm');
        this.closeEventModalBtn = document.getElementById('closeEventModal');
        this.deleteEventBtn = document.getElementById('deleteEvent');
        
        // Stats elements
        this.todayHoursEl = document.getElementById('todayHours');
        this.productivityScoreEl = document.getElementById('productivityScore');
        this.completedEventsEl = document.getElementById('completedEvents');
        
        // Overview elements
        this.productivityChart = document.getElementById('productivityChart');
        this.ringValue = document.getElementById('ringValue');
        this.workTimeEl = document.getElementById('workTime');
        this.studyTimeEl = document.getElementById('studyTime');
        this.personalTimeEl = document.getElementById('personalTime');
        this.breakTimeEl = document.getElementById('breakTime');
        
        // Suggestions
        this.suggestionsContent = document.getElementById('suggestionsContent');
        
        // Notification container
        this.notificationContainer = document.getElementById('notificationContainer');
    }

    bindEvents() {
        // Navigation
        this.prevDayBtn.addEventListener('click', () => this.navigateDay(-1));
        this.nextDayBtn.addEventListener('click', () => this.navigateDay(1));
        
        // View toggles
        this.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => this.changeView(btn.dataset.view));
        });
        
        // Quick actions
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Add event
        this.addEventBtn.addEventListener('click', () => this.showQuickAdd());
        
        // Quick add panel
        this.closeQuickAddBtn.addEventListener('click', () => this.hideQuickAdd());
        this.quickAddForm.addEventListener('submit', (e) => this.handleQuickAdd(e));
        
        // Action buttons
        this.optimizeBtn.addEventListener('click', () => this.optimizeSchedule());
        this.focusModeBtn.addEventListener('click', () => this.toggleFocusMode());
        this.refreshSuggestionsBtn.addEventListener('click', () => this.loadAISuggestions());
        
        // Modal
        this.closeEventModalBtn.addEventListener('click', () => this.hideEventModal());
        this.eventModal.addEventListener('click', (e) => {
            if (e.target === this.eventModal) this.hideEventModal();
        });
        this.eventForm.addEventListener('submit', (e) => this.handleEventSave(e));
        this.deleteEventBtn.addEventListener('click', () => this.deleteCurrentEvent());
        
        // Close quick add when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.quickAddPanel.contains(e.target) && 
                !this.addEventBtn.contains(e.target) &&
                !e.target.closest('.quick-action-card')) {
                this.hideQuickAdd();
            }
        });
    }

    // Handle Quick Actions
    handleQuickAction(action) {
        const categoryMap = {
            'add-work': 'work',
            'add-study': 'study',
            'add-break': 'break',
            'add-exercise': 'exercise'
        };

        if (action === 'optimize') {
            this.optimizeSchedule();
        } else if (categoryMap[action]) {
            // Pre-fill quick add form with category
            this.showQuickAdd();
            document.getElementById('eventCategory').value = categoryMap[action];
            
            // Set default titles
            const titleMap = {
                'work': 'Work Session',
                'study': 'Study Time',
                'break': 'Break Time',
                'exercise': 'Exercise'
            };
            document.getElementById('eventTitle').value = titleMap[categoryMap[action]];
        }
    }

    // Date Navigation
    navigateDay(direction) {
        this.currentDate.setDate(this.currentDate.getDate() + direction);
        this.updateDateDisplay();
        this.renderTimeBlocks();
        this.updateStats();
        this.updateOverview();
    }

    updateDateDisplay() {
        const today = new Date();
        const isToday = this.isSameDay(this.currentDate, today);
        const isTomorrow = this.isSameDay(this.currentDate, new Date(today.getTime() + 24 * 60 * 60 * 1000));
        const isYesterday = this.isSameDay(this.currentDate, new Date(today.getTime() - 24 * 60 * 60 * 1000));
        
        let title = '';
        if (isToday) title = 'Today';
        else if (isTomorrow) title = 'Tomorrow';
        else if (isYesterday) title = 'Yesterday';
        else title = this.currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        this.currentDateTitle.textContent = title;
        this.currentDateSubtitle.textContent = this.currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // View Management
    changeView(view) {
        this.currentView = view;
        this.viewBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Update the time blocks display based on view
        this.renderTimeBlocks();
    }

    // Quick Add Functionality
    showQuickAdd() {
        this.quickAddPanel.classList.add('active');
        document.getElementById('eventTitle').focus();
        
        // Set default time to current hour + 1
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        document.getElementById('eventStartTime').value = 
            nextHour.toTimeString().slice(0, 5);
    }

    hideQuickAdd() {
        this.quickAddPanel.classList.remove('active');
        this.quickAddForm.reset();
    }

    handleQuickAdd(e) {
        e.preventDefault();
        
        const title = document.getElementById('eventTitle').value;
        const category = document.getElementById('eventCategory').value;
        const startTime = document.getElementById('eventStartTime').value;
        const duration = parseInt(document.getElementById('eventDuration').value);
        
        const event = this.createEvent(title, category, startTime, duration);
        this.addEvent(event);
        this.hideQuickAdd();
        this.showNotification('Event added successfully!', 'success');
    }

    // Event Management
    createEvent(title, category, startTime, duration) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date(this.currentDate);
        startDate.setHours(hours, minutes, 0, 0);
        
        const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
        
        return {
            id: this.generateId(),
            title,
            category,
            startTime: startDate,
            endTime: endDate,
            status: 'pending',
            priority: 'medium',
            description: ''
        };
    }

    addEvent(event) {
        this.events.push(event);
        this.saveEvents();
        this.renderTimeBlocks();
        this.updateStats();
        this.updateOverview();
    }

    updateEvent(eventId, updatedData) {
        const index = this.events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            this.events[index] = { ...this.events[index], ...updatedData };
            this.saveEvents();
            this.renderTimeBlocks();
            this.updateStats();
            this.updateOverview();
        }
    }

    deleteEvent(eventId) {
        this.events = this.events.filter(e => e.id !== eventId);
        this.saveEvents();
        this.renderTimeBlocks();
        this.updateStats();
        this.updateOverview();
    }

    // Render Time Blocks
    renderTimeBlocks() {
        const todayEvents = this.getTodayEvents();
        
        if (todayEvents.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        todayEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        this.timeBlocksContainer.innerHTML = todayEvents.map(event => 
            this.createTimeBlockHTML(event)
        ).join('');
        
        // Add click listeners to time blocks
        this.timeBlocksContainer.querySelectorAll('.time-block').forEach(block => {
            block.addEventListener('click', () => {
                const eventId = block.dataset.eventId;
                this.showEventModal(eventId);
            });
        });
    }

    createTimeBlockHTML(event) {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        const timeSlot = `${startTime.toTimeString().slice(0, 5)} - ${endTime.toTimeString().slice(0, 5)}`;
        const status = this.getEventStatus(event);
        
        return `
            <div class="time-block ${event.category}" data-event-id="${event.id}">
                <div class="time-slot">${timeSlot}</div>
                <div class="event-content">
                    <div class="event-title">${event.title}</div>
                    <div class="event-category">${event.category}</div>
                </div>
                <div class="event-status ${status}">${status}</div>
            </div>
        `;
    }

    renderEmptyState() {
        this.timeBlocksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <h3>No events scheduled</h3>
                <p>Add your first event to get started!</p>
            </div>
        `;
    }

    // Event Status Management
    getEventStatus(event) {
        const now = new Date();
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        
        if (event.status === 'completed') return 'completed';
        if (now < startTime) return 'pending';
        if (now >= startTime && now <= endTime) return 'in-progress';
        if (now > endTime) return 'completed';
        
        return 'pending';
    }

    updateTimeBlockStatus() {
        const blocks = this.timeBlocksContainer.querySelectorAll('.time-block');
        blocks.forEach(block => {
            const eventId = block.dataset.eventId;
            const event = this.events.find(e => e.id === eventId);
            if (event) {
                const status = this.getEventStatus(event);
                const statusEl = block.querySelector('.event-status');
                statusEl.className = `event-status ${status}`;
                statusEl.textContent = status;
            }
        });
    }

    // Modal Management
    showEventModal(eventId) {
        this.currentEventId = eventId;
        const event = this.events.find(e => e.id === eventId);
        
        if (event) {
            document.getElementById('eventName').value = event.title;
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('startTime').value = new Date(event.startTime).toTimeString().slice(0, 5);
            document.getElementById('endTime').value = new Date(event.endTime).toTimeString().slice(0, 5);
            document.getElementById('category').value = event.category;
            document.getElementById('priority').value = event.priority;
            
            this.eventModal.classList.add('active');
        }
    }

    hideEventModal() {
        this.eventModal.classList.remove('active');
        this.currentEventId = null;
        this.eventForm.reset();
    }

    handleEventSave(e) {
        e.preventDefault();
        
        const updatedData = {
            title: document.getElementById('eventName').value,
            description: document.getElementById('eventDescription').value,
            category: document.getElementById('category').value,
            priority: document.getElementById('priority').value
        };
        
        // Update times
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        const newStartTime = new Date(this.currentDate);
        newStartTime.setHours(startHours, startMinutes, 0, 0);
        
        const newEndTime = new Date(this.currentDate);
        newEndTime.setHours(endHours, endMinutes, 0, 0);
        
        updatedData.startTime = newStartTime;
        updatedData.endTime = newEndTime;
        
        this.updateEvent(this.currentEventId, updatedData);
        this.hideEventModal();
        this.showNotification('Event updated successfully!', 'success');
    }

    deleteCurrentEvent() {
        if (this.currentEventId) {
            this.deleteEvent(this.currentEventId);
            this.hideEventModal();
            this.showNotification('Event deleted successfully!', 'success');
        }
    }

    // Statistics
    updateStats() {
        const todayEvents = this.getTodayEvents();
        const completedEvents = todayEvents.filter(e => e.status === 'completed').length;
        const totalHours = this.calculateTotalHours(todayEvents);
        const productivity = this.calculateProductivity(todayEvents);
        
        this.todayHoursEl.textContent = `${totalHours}h`;
        this.productivityScoreEl.textContent = `${productivity}%`;
        this.completedEventsEl.textContent = completedEvents.toString();
    }

    calculateTotalHours(events) {
        const total = events.reduce((sum, event) => {
            const duration = new Date(event.endTime) - new Date(event.startTime);
            return sum + duration;
        }, 0);
        
        return Math.round(total / (1000 * 60 * 60) * 10) / 10;
    }

    calculateProductivity(events) {
        if (events.length === 0) return 0;
        
        const completedEvents = events.filter(e => e.status === 'completed').length;
        const workEvents = events.filter(e => ['work', 'study'].includes(e.category)).length;
        
        const completionRate = (completedEvents / events.length) * 100;
        const workFocus = workEvents > 0 ? (workEvents / events.length) * 100 : 50;
        
        return Math.round((completionRate + workFocus) / 2);
    }

    // Overview Chart
    updateOverview() {
        const todayEvents = this.getTodayEvents();
        const categoryTimes = this.calculateCategoryTimes(todayEvents);
        
        // Update category times
        this.workTimeEl.textContent = `${categoryTimes.work}h`;
        this.studyTimeEl.textContent = `${categoryTimes.study}h`;
        this.personalTimeEl.textContent = `${categoryTimes.personal}h`;
        this.breakTimeEl.textContent = `${categoryTimes.break}h`;
        
        // Update productivity ring
        const productivity = this.calculateProductivity(todayEvents);
        this.ringValue.textContent = `${productivity}%`;
        
        this.drawProductivityChart(productivity);
    }

    calculateCategoryTimes(events) {
        const times = {
            work: 0,
            study: 0,
            personal: 0,
            break: 0,
            exercise: 0,
            social: 0
        };
        
        events.forEach(event => {
            const duration = (new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60 * 60);
            times[event.category] = (times[event.category] || 0) + duration;
        });
        
        // Round to 1 decimal place
        Object.keys(times).forEach(key => {
            times[key] = Math.round(times[key] * 10) / 10;
        });
        
        return times;
    }

    drawProductivityChart(percentage) {
        const canvas = this.productivityChart;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 60;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Draw progress arc
        const endAngle = (percentage / 100) * 2 * Math.PI - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // AI Suggestions
    loadAISuggestions() {
        // Simulate AI suggestions based on current schedule
        const suggestions = this.generateAISuggestions();
        this.renderSuggestions(suggestions);
    }

    generateAISuggestions() {
        const todayEvents = this.getTodayEvents();
        const suggestions = [];
        
        // Check for gaps in schedule
        if (todayEvents.length < 3) {
            suggestions.push({
                icon: 'fas fa-plus',
                title: 'Fill Your Schedule',
                description: 'You have open time slots. Consider adding productive activities.',
                action: 'schedule'
            });
        }
        
        // Check for break balance
        const breakEvents = todayEvents.filter(e => e.category === 'break');
        if (breakEvents.length === 0) {
            suggestions.push({
                icon: 'fas fa-coffee',
                title: 'Schedule Breaks',
                description: 'Add regular breaks to maintain focus and productivity.',
                action: 'breaks'
            });
        }
        
        // Check for work-life balance
        const workEvents = todayEvents.filter(e => ['work', 'study'].includes(e.category));
        const personalEvents = todayEvents.filter(e => e.category === 'personal');
        
        if (workEvents.length > personalEvents.length * 2) {
            suggestions.push({
                icon: 'fas fa-balance-scale',
                title: 'Work-Life Balance',
                description: 'Consider adding more personal time to balance your day.',
                action: 'balance'
            });
        }
        
        return suggestions;
    }

    renderSuggestions(suggestions) {
        if (suggestions.length === 0) {
            this.suggestionsContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>Great schedule!</h3>
                    <p>Your day looks well-balanced.</p>
                </div>
            `;
            return;
        }
        
        this.suggestionsContent.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <i class="${suggestion.icon} suggestion-icon"></i>
                <div class="suggestion-text">
                    <h4>${suggestion.title}</h4>
                    <p>${suggestion.description}</p>
                </div>
                <button class="suggestion-action" data-action="${suggestion.action}">Apply</button>
            </div>
        `).join('');
        
        // Add event listeners to suggestion buttons
        this.suggestionsContent.querySelectorAll('.suggestion-action').forEach(btn => {
            btn.addEventListener('click', () => this.applySuggestion(btn.dataset.action));
        });
    }

    applySuggestion(action) {
        switch (action) {
            case 'schedule':
                this.showQuickAdd();
                break;
            case 'breaks':
                this.scheduleBreaks();
                break;
            case 'balance':
                this.suggestPersonalTime();
                break;
        }
        
        this.showNotification('Suggestion applied!', 'success');
    }

    scheduleBreaks() {
        const todayEvents = this.getTodayEvents();
        const workEvents = todayEvents.filter(e => ['work', 'study'].includes(e.category));
        
        workEvents.forEach((event, index) => {
            if (index < workEvents.length - 1) {
                const breakStart = new Date(event.endTime);
                const breakEvent = this.createEvent('Coffee Break', 'break', 
                    breakStart.toTimeString().slice(0, 5), 15);
                this.addEvent(breakEvent);
            }
        });
    }

    suggestPersonalTime() {
        const now = new Date();
        const eveningTime = new Date(this.currentDate);
        eveningTime.setHours(18, 0, 0, 0);
        
        if (eveningTime > now) {
            const personalEvent = this.createEvent('Personal Time', 'personal',
                '18:00', 60);
            this.addEvent(personalEvent);
        }
    }

    // Advanced Features
    optimizeSchedule() {
        this.showNotification('Optimizing your schedule...', 'info');
        
        // Simulate AI optimization
        setTimeout(() => {
            this.reorganizeEvents();
            this.showNotification('Schedule optimized successfully!', 'success');
        }, 2000);
    }

    reorganizeEvents() {
        const todayEvents = this.getTodayEvents();
        
        // Sort by priority and category
        todayEvents.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const categoryOrder = { work: 3, study: 2, personal: 1, break: 0 };
            
            return priorityOrder[b.priority] - priorityOrder[a.priority] ||
                   categoryOrder[b.category] - categoryOrder[a.category];
        });
        
        // Redistribute times
        let currentTime = new Date(this.currentDate);
        currentTime.setHours(9, 0, 0, 0);
        
        todayEvents.forEach(event => {
            const duration = new Date(event.endTime) - new Date(event.startTime);
            event.startTime = new Date(currentTime);
            currentTime = new Date(currentTime.getTime() + duration);
            event.endTime = new Date(currentTime);
            
            // Add 15-minute buffer
            currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
        });
        
        this.saveEvents();
        this.renderTimeBlocks();
        this.updateStats();
        this.updateOverview();
    }

    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        document.body.classList.toggle('focus-mode', this.focusMode);
        
        const icon = this.focusModeBtn.querySelector('i');
        icon.className = this.focusMode ? 'fas fa-eye' : 'fas fa-eye-slash';
        
        this.showNotification(
            this.focusMode ? 'Focus mode enabled' : 'Focus mode disabled',
            'info'
        );
    }

    // Utility Functions
    getTodayEvents() {
        return this.events.filter(event => 
            this.isSameDay(new Date(event.startTime), this.currentDate)
        );
    }

    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Notification System
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
            </div>
        `;
        
        this.notificationContainer.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Local Storage
    loadEvents() {
        const stored = localStorage.getItem('schedule_events');
        if (stored) {
            const events = JSON.parse(stored);
            // Convert date strings back to Date objects
            return events.map(event => ({
                ...event,
                startTime: new Date(event.startTime),
                endTime: new Date(event.endTime)
            }));
        }
        return [];
    }

    saveEvents() {
        localStorage.setItem('schedule_events', JSON.stringify(this.events));
    }
}

// Initialize Schedule Manager
document.addEventListener('DOMContentLoaded', () => {
    window.scheduleManager = new ScheduleManager();
});

// Auto-hide navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Auto-collapse on small screens
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
        }
    }
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
});
