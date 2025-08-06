/**
 * Productivity Economics JavaScript
 * Advanced time management economics, habit tracking, and productivity analytics
 * Part of Remi AI Student Assistant System
 */

class ProductivityEconomics {
    constructor() {
        this.data = {
            hourlyRate: 25,
            habits: [],
            sessions: [],
            goals: [],
            insights: []
        };
        
        this.charts = {};
        this.updateInterval = null;
        this.animationFrames = [];
        
        this.init();
    }

    init() {
        this.loadStoredData();
        this.setupEventListeners();
        this.initializeCharts();
        this.updateDashboard();
        this.startRealTimeUpdates();
        this.generateTestData(); // For demonstration
        this.integrateWithGlobalStats(); // Connect with global system
        console.log('🏆 Productivity Economics System Initialized');
    }

    loadStoredData() {
        try {
            const stored = localStorage.getItem('productivityEconomics');
            if (stored) {
                this.data = { ...this.data, ...JSON.parse(stored) };
            }
            
            // Load from global stats if available
            if (window.globalStatsManager) {
                const globalStats = window.globalStatsManager.getStats();
                this.data.sessions = globalStats.sessions || [];
                this.data.totalTime = globalStats.totalTime || 0;
            }
        } catch (error) {
            console.warn('Error loading stored data:', error);
        }
    }

    saveData() {
        try {
            localStorage.setItem('productivityEconomics', JSON.stringify(this.data));
        } catch (error) {
            console.warn('Error saving data:', error);
        }
    }

    setupEventListeners() {
        // Hourly rate input
        const hourlyRateInput = document.getElementById('hourlyRate');
        if (hourlyRateInput) {
            hourlyRateInput.value = this.data.hourlyRate;
            hourlyRateInput.addEventListener('input', (e) => {
                this.data.hourlyRate = parseFloat(e.target.value) || 25;
                this.updateValueCalculations();
                this.saveData();
            });
        }

        // Rate suggestion buttons
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rate = parseFloat(e.target.dataset.rate);
                this.data.hourlyRate = rate;
                if (hourlyRateInput) hourlyRateInput.value = rate;
                this.updateValueCalculations();
                this.saveData();
            });
        });

        // Period control buttons
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateDashboardForPeriod(e.target.dataset.period);
            });
        });

        // ROI category filter
        const roiCategory = document.getElementById('roiCategory');
        if (roiCategory) {
            roiCategory.addEventListener('change', (e) => {
                this.updateROIAnalysis(e.target.value);
            });
        }

        // Habit management
        this.setupHabitEventListeners();

        // Insight controls
        document.querySelectorAll('[data-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.showInsightType(e.target.dataset.type);
            });
        });

        // Dark mode toggle
        const darkToggle = document.querySelector('.toggle-dark-button');
        if (darkToggle) {
            darkToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
            });
        }
    }

    setupHabitEventListeners() {
        // Add habit button
        const addHabitBtn = document.getElementById('addHabitBtn');
        const addHabitModal = document.getElementById('addHabitModal');
        const closeHabitModal = document.getElementById('closeHabitModal');
        const cancelHabitBtn = document.getElementById('cancelHabitBtn');
        const createHabitBtn = document.getElementById('createHabitBtn');

        if (addHabitBtn && addHabitModal) {
            addHabitBtn.addEventListener('click', () => {
                addHabitModal.style.display = 'flex';
            });
        }

        if (closeHabitModal && addHabitModal) {
            closeHabitModal.addEventListener('click', () => {
                addHabitModal.style.display = 'none';
            });
        }

        if (cancelHabitBtn && addHabitModal) {
            cancelHabitBtn.addEventListener('click', () => {
                addHabitModal.style.display = 'none';
            });
        }

        if (createHabitBtn) {
            createHabitBtn.addEventListener('click', () => {
                this.createNewHabit();
            });
        }

        // Close modal on outside click
        if (addHabitModal) {
            addHabitModal.addEventListener('click', (e) => {
                if (e.target === addHabitModal) {
                    addHabitModal.style.display = 'none';
                }
            });
        }
    }

    initializeCharts() {
        this.createTimeInvestmentChart();
        this.createROIChart();
        this.createHabitTrendChart();
    }

    createTimeInvestmentChart() {
        const canvas = document.getElementById('timeInvestmentChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        this.charts.timeInvestment = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Productive', 'Neutral', 'Wasteful'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createROIChart() {
        const canvas = document.getElementById('roiChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        this.charts.roi = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'ROI %',
                    data: [120, 150, 180, 220, 190, 160, 140],
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createHabitTrendChart() {
        const canvas = document.getElementById('habitTrendChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        this.charts.habitTrend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Completion Rate',
                    data: [75, 82, 88, 94],
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updateDashboard() {
        this.updateOverviewCards();
        this.updateValueCalculations();
        this.updateHabitsDisplay();
        this.updateInsights();
        this.generateHeatmap();
    }

    updateOverviewCards() {
        const today = new Date();
        const thisWeek = this.getWeekData(today);
        const thisMonth = this.getMonthData(today);

        // Calculate total time value
        const totalValue = thisMonth.productive * this.data.hourlyRate;
        const todayValue = thisWeek.daily[today.getDay()] * this.data.hourlyRate;

        // Update elements
        this.updateElement('totalTimeValue', `$${totalValue.toFixed(0)}`);
        this.updateElement('timeValue', `$${todayValue.toFixed(0)}`);
        this.updateElement('timeValueChange', `+$${(todayValue * 0.15).toFixed(0)} today`);

        // Efficiency score
        const efficiency = Math.min(100, (thisWeek.productive / thisWeek.total) * 100);
        this.updateElement('efficiencyScore', `${efficiency.toFixed(0)}%`);
        this.updateElement('efficiencyChange', `${efficiency > 75 ? '+' : ''}${(efficiency - 70).toFixed(0)}% vs yesterday`);

        // Habit score
        const habitScore = this.calculateHabitScore();
        this.updateElement('habitScore', habitScore.toString());
        this.updateElement('habitChange', `${this.getLongestStreak()} day streak`);

        // Growth rate
        const growthRate = this.calculateGrowthRate();
        this.updateElement('growthRate', `+${growthRate.toFixed(0)}%`);
        this.updateElement('growthChange', 'Weekly trend');

        // ROI
        const roi = this.calculateROI();
        this.updateElement('productivityROI', `+${roi.toFixed(0)}%`);
    }

    updateValueCalculations() {
        const today = new Date();
        const thisWeek = this.getWeekData(today);
        const thisMonth = this.getMonthData(today);

        const todayHours = thisWeek.daily[today.getDay()];
        const weekHours = thisWeek.productive;
        const monthHours = thisMonth.productive;
        const lostHours = thisMonth.wasteful;

        this.updateElement('todayValue', `$${(todayHours * this.data.hourlyRate).toFixed(2)}`);
        this.updateElement('weekValue', `$${(weekHours * this.data.hourlyRate).toFixed(2)}`);
        this.updateElement('monthValue', `$${(monthHours * this.data.hourlyRate).toFixed(2)}`);
        this.updateElement('lostValue', `$${(lostHours * this.data.hourlyRate).toFixed(2)}`);
    }

    updateDashboardForPeriod(period) {
        // Update charts and data based on selected period
        console.log(`Updating dashboard for period: ${period}`);
        
        // This would fetch different data ranges
        switch (period) {
            case 'today':
                this.updateChartsForToday();
                break;
            case 'week':
                this.updateChartsForWeek();
                break;
            case 'month':
                this.updateChartsForMonth();
                break;
            case 'year':
                this.updateChartsForYear();
                break;
        }
    }

    updateChartsForToday() {
        if (this.charts.timeInvestment) {
            this.charts.timeInvestment.data.datasets[0].data = [70, 20, 10];
            this.charts.timeInvestment.update();
        }
    }

    updateChartsForWeek() {
        if (this.charts.timeInvestment) {
            this.charts.timeInvestment.data.datasets[0].data = [65, 25, 10];
            this.charts.timeInvestment.update();
        }
    }

    updateChartsForMonth() {
        if (this.charts.timeInvestment) {
            this.charts.timeInvestment.data.datasets[0].data = [62, 28, 10];
            this.charts.timeInvestment.update();
        }
    }

    updateChartsForYear() {
        if (this.charts.timeInvestment) {
            this.charts.timeInvestment.data.datasets[0].data = [60, 30, 10];
            this.charts.timeInvestment.update();
        }
    }

    updateROIAnalysis(category) {
        const data = this.getROIDataForCategory(category);
        
        this.updateElement('bestROI', `+${data.best}%`);
        this.updateElement('avgROI', `+${data.average}%`);
        this.updateElement('potentialROI', `+${data.potential}%`);
        this.updateElement('bestROIActivity', data.activity);

        if (this.charts.roi) {
            this.charts.roi.data.datasets[0].data = data.weeklyData;
            this.charts.roi.update();
        }
    }

    createNewHabit() {
        const habitName = document.getElementById('habitName').value;
        const habitCategory = document.getElementById('habitCategory').value;
        const habitFrequency = document.getElementById('habitFrequency').value;
        const habitValue = parseFloat(document.getElementById('habitValue').value) || this.data.hourlyRate;
        const habitDuration = parseInt(document.getElementById('habitDuration').value) || 30;

        if (!habitName.trim()) {
            alert('Please enter a habit name');
            return;
        }

        const newHabit = {
            id: Date.now(),
            name: habitName,
            category: habitCategory,
            frequency: habitFrequency,
            value: habitValue,
            duration: habitDuration,
            streak: 0,
            completions: [],
            created: new Date().toISOString()
        };

        this.data.habits.push(newHabit);
        this.saveData();
        this.updateHabitsDisplay();
        
        // Close modal and reset form
        document.getElementById('addHabitModal').style.display = 'none';
        this.resetHabitForm();
    }

    resetHabitForm() {
        document.getElementById('habitName').value = '';
        document.getElementById('habitCategory').value = 'productivity';
        document.getElementById('habitFrequency').value = 'daily';
        document.getElementById('habitValue').value = '';
        document.getElementById('habitDuration').value = '';
    }

    updateHabitsDisplay() {
        const habitsList = document.getElementById('habitsList');
        if (!habitsList) return;

        if (this.data.habits.length === 0) {
            habitsList.innerHTML = `
                <div class="no-habits">
                    <i class="fas fa-plus-circle"></i>
                    <h4>No Habits Yet</h4>
                    <p>Create your first habit to start tracking your productivity economics</p>
                </div>
            `;
            return;
        }

        habitsList.innerHTML = this.data.habits.map(habit => `
            <div class="habit-item" data-habit-id="${habit.id}">
                <div class="habit-header">
                    <div class="habit-info">
                        <h4>${habit.name}</h4>
                        <div class="habit-meta">
                            <span class="category">${habit.category}</span>
                            <span class="frequency">${habit.frequency}</span>
                            <span class="value">$${habit.value}/hr</span>
                        </div>
                    </div>
                    <div class="habit-streak">
                        <div class="streak-number">${habit.streak}</div>
                        <div class="streak-label">day streak</div>
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="habit-btn complete" onclick="productivityEconomics.completeHabit(${habit.id})">
                        <i class="fas fa-check"></i> Complete
                    </button>
                    <button class="habit-btn skip" onclick="productivityEconomics.skipHabit(${habit.id})">
                        <i class="fas fa-forward"></i> Skip
                    </button>
                    <button class="habit-btn delete" onclick="productivityEconomics.deleteHabit(${habit.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="habit-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.getHabitCompletionRate(habit)}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span>${this.getHabitCompletionRate(habit)}% this month</span>
                        <span>$${(habit.value * habit.duration / 60 * habit.completions.length).toFixed(0)} earned</span>
                    </div>
                </div>
            </div>
        `).join('');

        this.updateHabitStats();
    }

    completeHabit(habitId) {
        const habit = this.data.habits.find(h => h.id === habitId);
        if (!habit) return;

        const today = new Date().toDateString();
        if (!habit.completions.includes(today)) {
            habit.completions.push(today);
            habit.streak++;
            this.saveData();
            this.updateHabitsDisplay();
            this.showHabitCompletionNotification(habit);
        }
    }

    skipHabit(habitId) {
        const habit = this.data.habits.find(h => h.id === habitId);
        if (!habit) return;

        habit.streak = 0;
        this.saveData();
        this.updateHabitsDisplay();
    }

    deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit?')) {
            this.data.habits = this.data.habits.filter(h => h.id !== habitId);
            this.saveData();
            this.updateHabitsDisplay();
        }
    }

    updateHabitStats() {
        const activeStreaks = this.data.habits.filter(h => h.streak > 0).length;
        const completionRate = this.getOverallCompletionRate();
        const habitScore = this.calculateHabitScore();
        const strongestStreak = this.getLongestStreak();

        this.updateElement('totalStreaks', activeStreaks.toString());
        this.updateElement('completionRate', `${completionRate}%`);
        this.updateElement('habitScore', habitScore.toString());
        this.updateElement('strongestStreak', strongestStreak.toString());
    }

    generateHeatmap() {
        const heatmap = document.getElementById('habitHeatmap');
        if (!heatmap) return;

        const weeks = 12; // Show 12 weeks
        const daysPerWeek = 7;
        let html = '';

        for (let week = 0; week < weeks; week++) {
            html += '<div class="heatmap-week">';
            for (let day = 0; day < daysPerWeek; day++) {
                const date = new Date();
                date.setDate(date.getDate() - (weeks - week) * 7 + day);
                const completions = this.getCompletionsForDate(date);
                const level = Math.min(4, Math.floor(completions / 2));
                
                html += `<div class="heatmap-day level-${level}" title="${date.toDateString()}: ${completions} completions"></div>`;
            }
            html += '</div>';
        }

        heatmap.innerHTML = html;
    }

    showInsightType(type) {
        console.log(`Showing insights for type: ${type}`);
        // This would filter and show different types of insights
        // For now, we'll just log the action
    }

    updateInsights() {
        // Update the primary insight based on current data
        const insight = this.generatePrimaryInsight();
        this.updateElement('primaryInsight', insight);
    }

    showHabitCompletionNotification(habit) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'habit-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>Habit completed! +$${(habit.value * habit.duration / 60).toFixed(2)}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    startRealTimeUpdates() {
        // Update every minute
        this.updateInterval = setInterval(() => {
            this.updateOverviewCards();
        }, 60000);
    }

    // Integration with Global Stats Manager
    integrateWithGlobalStats() {
        if (window.globalStatsManager) {
            // Get session data from global stats
            const globalStats = window.globalStatsManager.getStats();
            if (globalStats.sessions) {
                this.data.sessions = [...this.data.sessions, ...globalStats.sessions];
            }
            
            // Update global stats with economic data
            window.globalStatsManager.addEconomicData({
                hourlyRate: this.data.hourlyRate,
                totalValue: this.calculateTotalValue(),
                efficiency: this.calculateEfficiency(),
                habits: this.data.habits.length
            });
        }
    }

    calculateTotalValue() {
        return this.data.sessions.reduce((sum, session) => {
            return sum + (session.duration / 60 * (session.value || this.data.hourlyRate));
        }, 0);
    }

    // Export data for integration with other systems
    exportData() {
        return {
            economics: this.data,
            insights: this.getEconomicInsights(),
            habits: this.data.habits,
            totalValue: this.calculateTotalValue(),
            efficiency: this.calculateEfficiency(),
            roi: this.calculateROI()
        };
    }

    // Import session data from other parts of the system
    importSessionData(sessions) {
        if (Array.isArray(sessions)) {
            this.data.sessions = [...this.data.sessions, ...sessions];
            this.saveData();
            this.updateDashboard();
        }
    }

    // Utility functions
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    getWeekData(date) {
        // Mock data - in real app, this would fetch actual user data
        return {
            productive: 28,
            neutral: 8,
            wasteful: 4,
            total: 40,
            daily: [4, 6, 5, 4, 7, 2, 0] // Hours per day
        };
    }

    getMonthData(date) {
        // Mock data
        return {
            productive: 120,
            neutral: 30,
            wasteful: 15,
            total: 165
        };
    }

    calculateHabitScore() {
        if (this.data.habits.length === 0) return 0;
        
        const totalScore = this.data.habits.reduce((sum, habit) => {
            return sum + (habit.streak * 10) + (habit.completions.length * 5);
        }, 0);
        
        return Math.floor(totalScore / this.data.habits.length);
    }

    getLongestStreak() {
        if (this.data.habits.length === 0) return 0;
        return Math.max(...this.data.habits.map(h => h.streak));
    }

    calculateGrowthRate() {
        // Mock calculation - would use historical data
        return 12.5;
    }

    calculateROI() {
        // Mock calculation based on time value vs invested time
        return 156;
    }

    getROIDataForCategory(category) {
        // Mock data that would vary by category
        const data = {
            all: { best: 450, average: 125, potential: 680, activity: 'Deep Learning Sessions', weeklyData: [120, 150, 180, 220, 190, 160, 140] },
            study: { best: 380, average: 110, potential: 520, activity: 'Morning Study Blocks', weeklyData: [100, 130, 160, 200, 170, 140, 120] },
            projects: { best: 520, average: 140, potential: 750, activity: 'Coding Sprints', weeklyData: [140, 170, 200, 240, 210, 180, 160] },
            skills: { best: 340, average: 95, potential: 480, activity: 'Skill Practice', weeklyData: [80, 110, 140, 180, 150, 120, 100] },
            research: { best: 290, average: 85, potential: 420, activity: 'Literature Review', weeklyData: [70, 100, 130, 160, 140, 110, 90] }
        };
        
        return data[category] || data.all;
    }

    getHabitCompletionRate(habit) {
        const daysInMonth = 30;
        const completionsThisMonth = habit.completions.filter(date => {
            const completionDate = new Date(date);
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            return completionDate >= thirtyDaysAgo;
        }).length;
        
        return Math.round((completionsThisMonth / daysInMonth) * 100);
    }

    getOverallCompletionRate() {
        if (this.data.habits.length === 0) return 0;
        
        const rates = this.data.habits.map(habit => this.getHabitCompletionRate(habit));
        return Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
    }

    getCompletionsForDate(date) {
        const dateStr = date.toDateString();
        return this.data.habits.reduce((count, habit) => {
            return count + (habit.completions.includes(dateStr) ? 1 : 0);
        }, 0);
    }

    generatePrimaryInsight() {
        const insights = [
            'Focus on morning productivity sessions',
            'Consider shorter break intervals',
            'Deep work blocks show highest ROI',
            'Afternoon sessions need optimization',
            'Weekend planning boosts weekly performance'
        ];
        
        return insights[Math.floor(Math.random() * insights.length)];
    }

    generateTestData() {
        // Generate some test habits for demonstration
        if (this.data.habits.length === 0) {
            const testHabits = [
                {
                    id: 1,
                    name: 'Morning Deep Work',
                    category: 'productivity',
                    frequency: 'daily',
                    value: 50,
                    duration: 90,
                    streak: 7,
                    completions: this.generateRecentCompletions(7),
                    created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 2,
                    name: 'Skill Development',
                    category: 'learning',
                    frequency: 'daily',
                    value: 35,
                    duration: 60,
                    streak: 12,
                    completions: this.generateRecentCompletions(12),
                    created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            
            this.data.habits = testHabits;
            this.saveData();
        }
    }

    generateRecentCompletions(days) {
        const completions = [];
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            completions.push(date.toDateString());
        }
        return completions;
    }

    // Public API methods
    addSession(duration, category, value) {
        const session = {
            id: Date.now(),
            duration,
            category,
            value: value || this.data.hourlyRate,
            timestamp: new Date().toISOString()
        };
        
        this.data.sessions.push(session);
        this.saveData();
        this.updateDashboard();
    }

    getEconomicInsights() {
        return {
            totalValue: this.data.sessions.reduce((sum, session) => sum + (session.duration / 60 * session.value), 0),
            mostValuableCategory: this.getMostValuableCategory(),
            efficiency: this.calculateEfficiency(),
            recommendations: this.generateRecommendations()
        };
    }

    getMostValuableCategory() {
        const categoryValues = {};
        this.data.sessions.forEach(session => {
            const category = session.category || 'general';
            if (!categoryValues[category]) {
                categoryValues[category] = 0;
            }
            categoryValues[category] += session.duration / 60 * session.value;
        });
        
        return Object.keys(categoryValues).reduce((a, b) => 
            categoryValues[a] > categoryValues[b] ? a : b
        );
    }

    calculateEfficiency() {
        if (this.data.sessions.length === 0) return 0;
        
        const totalValue = this.data.sessions.reduce((sum, session) => sum + (session.duration / 60 * session.value), 0);
        const totalTime = this.data.sessions.reduce((sum, session) => sum + session.duration, 0) / 60;
        
        return totalTime > 0 ? (totalValue / (totalTime * this.data.hourlyRate)) * 100 : 0;
    }

    generateRecommendations() {
        return [
            'Schedule high-value tasks during peak energy hours',
            'Batch similar activities to reduce context switching',
            'Take strategic breaks to maintain productivity',
            'Track time waste to identify improvement opportunities'
        ];
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.animationFrames.forEach(frame => {
            cancelAnimationFrame(frame);
        });
        
        // Clean up chart instances
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productivityEconomics = new ProductivityEconomics();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductivityEconomics;
}
