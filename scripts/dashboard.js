// Dashboard.js - Inspiring and Motivating Dashboard System

// State Management
let dashboardData = {
    mainGoal: null,
    dailyHabits: {
        'morning-routine': false,
        'focus-time': false,
        'reflection': false
    },
    streakData: {
        current: 0,
        best: 0,
        lastUpdate: null
    }
};

// Motivational Quotes Database
const motivationalQuotes = [
    {
        text: "The only impossible journey is the one you never begin.",
        author: "Tony Robbins"
    },
    {
        text: "Discipline is the bridge between goals and accomplishment.",
        author: "Jim Rohn"
    },
    {
        text: "Success is the sum of small efforts repeated day in and day out.",
        author: "Robert Collier"
    },
    {
        text: "The future depends on what you do today.",
        author: "Mahatma Gandhi"
    },
    {
        text: "Excellence is not a skill, it's an attitude.",
        author: "Ralph Marston"
    },
    {
        text: "What you do today can improve all your tomorrows.",
        author: "Ralph Marston"
    },
    {
        text: "The only person you are destined to become is the person you decide to be.",
        author: "Ralph Waldo Emerson"
    },
    {
        text: "Your limitation—it's only your imagination.",
        author: "Anonymous"
    },
    {
        text: "Push yourself, because no one else is going to do it for you.",
        author: "Anonymous"
    },
    {
        text: "Great things never come from comfort zones.",
        author: "Anonymous"
    }
];

// Daily Mantras
const dailyMantras = [
    "Today is another opportunity to become the person you've always wanted to be.",
    "I am capable of achieving extraordinary things through consistent action.",
    "Every challenge I face today makes me stronger and wiser.",
    "I choose progress over perfection, and action over hesitation.",
    "My dedication today creates the success of tomorrow.",
    "I am building something beautiful with every small step I take.",
    "Discipline is my superpower, and I wield it with purpose.",
    "I turn obstacles into opportunities and setbacks into comebacks.",
    "My consistency compounds into unstoppable momentum.",
    "I am the architect of my own success story."
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    updateTimeDisplay();
    loadDashboardData();
    updateGreeting();
    updateMotivationalContent();
    
    // Update time every minute
    setInterval(updateTimeDisplay, 60000);
    
    // Refresh dashboard every 5 minutes
    setInterval(refreshDashboardData, 300000);
});

function initializeDashboard() {
    console.log('🏠 Initializing Dashboard...');
    
    // Load user profile data
    const profiles = getCurrentProfiles();
    updateUserElements(profiles);
    
    // Initialize progress tracking
    calculateAndUpdateProgress();
    
    // Load tasks and achievements
    loadTodaysFocus();
    loadUpcomingTasks();
    loadRecentAchievements();
    
    // Initialize habit tracking
    initializeHabitTracking();
    
    // Add animations
    addEntranceAnimations();
    
    console.log('✅ Dashboard initialized successfully');
}

function getCurrentProfiles() {
    const defaultProfiles = {
        user: { 
            name: 'Champion',
            picture: 'pfp/Google_2015_logo.svg.png'
        },
        remi: { 
            name: 'Remi', 
            picture: 'pfp/Remi-pfp.png'
        }
    };
    
    try {
        const saved = localStorage.getItem('remiProfiles');
        return saved ? { ...defaultProfiles, ...JSON.parse(saved) } : defaultProfiles;
    } catch (error) {
        console.error('Error loading profiles:', error);
        return defaultProfiles;
    }
}

function updateUserElements(profiles) {
    // Update user name
    const userNameElements = document.querySelectorAll('[data-user-name]');
    userNameElements.forEach(element => {
        element.textContent = profiles.user?.name || 'Champion';
    });
    
    // Update user avatar
    const userAvatarElements = document.querySelectorAll('[data-user-avatar]');
    userAvatarElements.forEach(element => {
        element.src = profiles.user?.picture || 'pfp/Google_2015_logo.svg.png';
        element.alt = profiles.user?.name || 'User';
    });
    
    // Update Remi avatar
    const remiAvatarElements = document.querySelectorAll('[data-remi-avatar]');
    remiAvatarElements.forEach(element => {
        element.src = profiles.remi?.picture || 'pfp/Remi-pfp.png';
        element.alt = profiles.remi?.name || 'Remi';
    });
}

function updateTimeDisplay() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        timeElement.textContent = timeString;
    }
}

function updateGreeting() {
    const greetingElement = document.getElementById('greeting');
    if (greetingElement) {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour >= 5 && hour < 12) {
            greeting = 'Good Morning';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'Good Afternoon';
        } else if (hour >= 17 && hour < 21) {
            greeting = 'Good Evening';
        } else {
            greeting = 'Good Evening';
        }
        
        greetingElement.textContent = greeting;
    }
}

function updateMotivationalContent() {
    // Update daily quote
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    
    if (quoteText && quoteAuthor) {
        const today = new Date().toDateString();
        const savedQuoteDate = localStorage.getItem('dailyQuoteDate');
        
        if (savedQuoteDate !== today) {
            // New day, select new quote
            const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
            
            quoteText.textContent = `"${randomQuote.text}"`;
            quoteAuthor.textContent = `- ${randomQuote.author}`;
            
            localStorage.setItem('dailyQuote', JSON.stringify(randomQuote));
            localStorage.setItem('dailyQuoteDate', today);
        } else {
            // Use saved quote for today
            const savedQuote = JSON.parse(localStorage.getItem('dailyQuote') || '{}');
            if (savedQuote.text) {
                quoteText.textContent = `"${savedQuote.text}"`;
                quoteAuthor.textContent = `- ${savedQuote.author}`;
            }
        }
    }
    
    // Update daily mantra
    const mantraElement = document.getElementById('daily-mantra');
    if (mantraElement) {
        const today = new Date().toDateString();
        const savedMantraDate = localStorage.getItem('dailyMantraDate');
        
        if (savedMantraDate !== today) {
            const randomMantra = dailyMantras[Math.floor(Math.random() * dailyMantras.length)];
            mantraElement.textContent = randomMantra;
            
            localStorage.setItem('dailyMantra', randomMantra);
            localStorage.setItem('dailyMantraDate', today);
        } else {
            const savedMantra = localStorage.getItem('dailyMantra');
            if (savedMantra) {
                mantraElement.textContent = savedMantra;
            }
        }
    }
}

function calculateAndUpdateProgress() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const today = new Date().toDateString();
    const thisWeek = getWeekRange();
    
    // Calculate daily progress
    const todayTasks = tasks.filter(task => 
        task.date && new Date(task.date).toDateString() === today
    );
    const completedTodayTasks = todayTasks.filter(task => task.completed);
    const dailyProgress = todayTasks.length > 0 ? 
        Math.round((completedTodayTasks.length / todayTasks.length) * 100) : 0;
    
    // Calculate weekly progress
    const weekTasks = tasks.filter(task => {
        if (!task.date) return false;
        const taskDate = new Date(task.date);
        return taskDate >= thisWeek.start && taskDate <= thisWeek.end;
    });
    const completedWeekTasks = weekTasks.filter(task => task.completed);
    const weeklyProgress = weekTasks.length > 0 ? 
        Math.round((completedWeekTasks.length / weekTasks.length) * 100) : 0;
    
    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTasks = tasks.filter(task => {
        if (!task.date) return false;
        return new Date(task.date) >= thirtyDaysAgo;
    });
    const completedRecentTasks = recentTasks.filter(task => task.completed);
    const completionRate = recentTasks.length > 0 ? 
        Math.round((completedRecentTasks.length / recentTasks.length) * 100) : 0;
    
    // Update UI
    updateProgressBar('daily-progress', dailyProgress);
    updateProgressBar('weekly-progress', weeklyProgress);
    
    // Calculate long-term progress based on main goal
    const longTermProgress = calculateLongTermProgress();
    updateProgressBar('longterm-progress', longTermProgress);
    
    // Update hero stats
    updateElement('completion-rate', `${completionRate}%`);
    updateElement('productivity-score', calculateProductivityScore());
    
    // Update progress insights
    updateProgressInsights(dailyProgress, weeklyProgress, completionRate);
}

function updateProgressBar(elementId, percentage) {
    const fillElement = document.getElementById(`${elementId}-fill`);
    const percentageElement = document.getElementById(elementId);
    
    if (fillElement) {
        fillElement.style.width = `${percentage}%`;
    }
    if (percentageElement) {
        percentageElement.textContent = `${percentage}%`;
    }
}

function updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function calculateProductivityScore() {
    // Complex algorithm to calculate productivity score
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const habits = dashboardData.dailyHabits;
    const streak = dashboardData.streakData.current;
    
    let score = 0;
    
    // Task completion factor (40%)
    const recentTasks = tasks.filter(task => {
        if (!task.date) return false;
        const taskDate = new Date(task.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return taskDate >= weekAgo;
    });
    const completedTasks = recentTasks.filter(task => task.completed);
    const taskScore = recentTasks.length > 0 ? 
        (completedTasks.length / recentTasks.length) * 40 : 0;
    
    // Habit consistency factor (30%)
    const completedHabits = Object.values(habits).filter(Boolean).length;
    const habitScore = (completedHabits / Object.keys(habits).length) * 30;
    
    // Streak factor (20%)
    const streakScore = Math.min(streak * 2, 20);
    
    // Consistency factor (10%) - Calculate based on recent habit completion
    const consistencyScore = calculateConsistencyScore();
    
    score = Math.round(taskScore + habitScore + streakScore + consistencyScore);
    return Math.min(score, 100);
}

// Calculate long-term progress based on main goal and overall achievement
function calculateLongTermProgress() {
    if (dashboardData.mainGoal && dashboardData.mainGoal.deadline) {
        // Calculate progress based on goal timeline and completion
        const startDate = new Date(dashboardData.mainGoal.startDate || Date.now());
        const endDate = new Date(dashboardData.mainGoal.deadline);
        const now = new Date();
        
        const totalTime = endDate - startDate;
        const elapsedTime = now - startDate;
        const timeProgress = Math.max(0, Math.min(100, (elapsedTime / totalTime) * 100));
        
        // Weight time progress with goal completion percentage
        const goalCompletion = dashboardData.mainGoal.progress || 0;
        return Math.round((timeProgress * 0.3) + (goalCompletion * 0.7));
    }
    
    // Fallback: Calculate based on overall task completion rate
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.completed);
    return Math.round((completedTasks.length / tasks.length) * 100);
}

// Calculate consistency score based on habit tracking and daily activity
function calculateConsistencyScore() {
    // Check habit completion over the last 7 days
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        
        const dayHabits = JSON.parse(localStorage.getItem(`dailyHabits_${dateString}`) || '{}');
        const completedCount = Object.values(dayHabits).filter(Boolean).length;
        const totalHabits = Object.keys(dashboardData.dailyHabits).length;
        
        last7Days.push(totalHabits > 0 ? (completedCount / totalHabits) : 0);
    }
    
    // Calculate average consistency over the week
    const averageConsistency = last7Days.reduce((sum, day) => sum + day, 0) / last7Days.length;
    return Math.round(averageConsistency * 10); // Convert to 0-10 scale
}

function updateProgressInsights(daily, weekly, overall) {
    const insightElement = document.getElementById('progress-insight');
    if (!insightElement) return;
    
    let insight = '';
    
    if (overall >= 80) {
        insight = "🔥 Outstanding performance! You're crushing your goals!";
    } else if (overall >= 60) {
        insight = "💪 Great momentum! Keep up the excellent work!";
    } else if (overall >= 40) {
        insight = "📈 Good progress! Push a little harder to reach excellence.";
    } else if (overall >= 20) {
        insight = "🎯 Building momentum. Focus on consistency for better results.";
    } else {
        insight = "🌱 Every expert was once a beginner. Start small, dream big!";
    }
    
    insightElement.textContent = insight;
}

function loadTodaysFocus() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const today = new Date().toDateString();
    
    // Get today's high-priority tasks
    const focusTasks = tasks.filter(task => 
        task.date && 
        new Date(task.date).toDateString() === today && 
        (task.priority === '1' || task.priority === 'high')
    ).slice(0, 3); // Limit to 3 focus tasks
    
    const focusContainer = document.getElementById('focus-tasks');
    if (!focusContainer) return;
    
    if (focusTasks.length === 0) {
        focusContainer.innerHTML = `
            <div class="focus-task">
                <div class="task-checkbox" onclick="showAddTaskModal()">
                    <i class="fas fa-plus"></i>
                </div>
                <div class="task-info">
                    <div class="task-title">Set your focus for today</div>
                    <div class="task-time">Click to add a priority task</div>
                </div>
            </div>
        `;
        return;
    }
    
    focusContainer.innerHTML = focusTasks.map(task => `
        <div class="focus-task ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskCompletion('${task.id}')">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-info">
                <div class="task-title">${escapeHtml(task.name)}</div>
                <div class="task-time">${task.time || 'No time set'}</div>
            </div>
        </div>
    `).join('');
}

function loadUpcomingTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const now = new Date();
    const today = new Date().toDateString();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Get upcoming non-completed tasks
    const upcomingTasks = tasks.filter(task => {
        if (task.completed || !task.date) return false;
        const taskDate = new Date(task.date);
        return taskDate >= now && taskDate <= nextWeek;
    }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
    
    const container = document.getElementById('upcoming-tasks');
    if (!container) return;
    
    if (upcomingTasks.length === 0) {
        container.innerHTML = `
            <div class="upcoming-task">
                <div class="task-details">
                    <div class="task-name">No upcoming tasks</div>
                    <div class="task-due">You're all caught up! 🎉</div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = upcomingTasks.map(task => {
            const taskDate = new Date(task.date);
            const isOverdue = taskDate < now;
            const isDueToday = taskDate.toDateString() === today;
            
            let statusClass = '';
            if (isOverdue) statusClass = 'overdue';
            else if (isDueToday) statusClass = 'due-today';
            
            const priorityClass = task.priority === '1' ? 'high' : 
                                task.priority === '2' ? 'medium' : 'low';
            
            return `
                <div class="upcoming-task ${statusClass}">
                    <div class="task-details">
                        <div class="task-name">${escapeHtml(task.name)}</div>
                        <div class="task-due">${formatTaskDue(task.date, task.time)}</div>
                    </div>
                    <div class="task-priority ${priorityClass}">
                        ${task.priority === '1' ? 'High' : 
                          task.priority === '2' ? 'Medium' : 'Low'}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Update summary stats
    updateTaskSummary(tasks);
}

function updateTaskSummary(tasks) {
    const now = new Date();
    const today = new Date().toDateString();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const dueToday = tasks.filter(task => 
        !task.completed && task.date && 
        new Date(task.date).toDateString() === today
    ).length;
    
    const dueThisWeek = tasks.filter(task => {
        if (task.completed || !task.date) return false;
        const taskDate = new Date(task.date);
        return taskDate > now && taskDate <= nextWeek;
    }).length;
    
    const overdue = tasks.filter(task => 
        !task.completed && task.date && 
        new Date(task.date) < now
    ).length;
    
    updateElement('due-today', dueToday);
    updateElement('due-week', dueThisWeek);
    updateElement('overdue', overdue);
}

function loadRecentAchievements() {
    // Load real achievements from storage
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const recentAchievements = achievements.slice(-3).reverse(); // Get last 3, most recent first
    
    const container = document.getElementById('recent-achievements');
    if (!container) return;
    
    if (recentAchievements.length === 0) {
        container.innerHTML = `
            <div class="achievement-item">
                <div class="achievement-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="achievement-info">
                    <div class="achievement-name">Ready to achieve greatness</div>
                    <div class="achievement-date">Complete your first task!</div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = recentAchievements.map(achievement => `
            <div class="achievement-item">
                <div class="achievement-icon ${achievement.rarity || 'common'}">
                    <i class="fas ${achievement.icon || 'fa-trophy'}"></i>
                </div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.title}</div>
                    <div class="achievement-date">${formatAchievementDate(achievement.unlockedAt)}</div>
                </div>
                <div class="achievement-points">+${achievement.points || 10}</div>
            </div>
        `).join('');
    }
    
    // Update achievement statistics
    const totalPoints = achievements.reduce((sum, ach) => sum + (ach.points || 10), 0);
    const level = Math.floor(totalPoints / 100) + 1; // 100 points per level
    
    updateElement('total-achievements-count', achievements.length);
    updateElement('total-points', totalPoints);
    updateElement('achievement-level', level);
    
    // Update progress ring
    const progressToNextLevel = (totalPoints % 100) / 100 * 100;
    updateProgressRing('achievement-progress-circle', progressToNextLevel);
}

function formatAchievementDate(timestamp) {
    if (!timestamp) return 'Recently';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}

function updateProgressRing(elementId, percentage) {
    const circle = document.getElementById(elementId);
    if (!circle) return;
    
    const circumference = 2 * Math.PI * 30; // radius = 30
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
}

function initializeHabitTracking() {
    loadDailyHabits();
    
    // Check for streak updates
    updateStreakData();
    updateElement('streak-number', dashboardData.streakData.current);
    updateElement('current-streak', dashboardData.streakData.current);
}

function loadDailyHabits() {
    const today = new Date().toDateString();
    const savedHabits = JSON.parse(localStorage.getItem('dailyHabits') || '{}');
    const savedDate = localStorage.getItem('dailyHabitsDate');
    
    if (savedDate === today) {
        dashboardData.dailyHabits = { ...dashboardData.dailyHabits, ...savedHabits };
    } else {
        // New day, reset habits
        dashboardData.dailyHabits = {
            'morning-routine': false,
            'focus-time': false,
            'reflection': false
        };
    }
    
    // Update UI
    Object.keys(dashboardData.dailyHabits).forEach(habit => {
        const checkbox = document.getElementById(`${habit.replace('-', '-')}-check`);
        if (checkbox) {
            checkbox.classList.toggle('completed', dashboardData.dailyHabits[habit]);
        }
    });
}

function toggleHabit(habitKey) {
    dashboardData.dailyHabits[habitKey] = !dashboardData.dailyHabits[habitKey];
    
    // Save to localStorage
    const today = new Date().toDateString();
    localStorage.setItem('dailyHabits', JSON.stringify(dashboardData.dailyHabits));
    localStorage.setItem('dailyHabitsDate', today);
    
    // Update UI
    const checkbox = document.getElementById(`${habitKey.replace('-', '-')}-check`);
    if (checkbox) {
        checkbox.classList.toggle('completed', dashboardData.dailyHabits[habitKey]);
        
        // Add success animation
        if (dashboardData.dailyHabits[habitKey]) {
            checkbox.parentElement.classList.add('success-state');
            setTimeout(() => {
                checkbox.parentElement.classList.remove('success-state');
            }, 1000);
        }
    }
    
    // Recalculate productivity score
    updateElement('productivity-score', calculateProductivityScore());
    
    // Update streak if all habits completed
    if (Object.values(dashboardData.dailyHabits).every(Boolean)) {
        updateStreakData(true);
        showStreakCelebration();
    }
}

function updateStreakData(completed = false) {
    const today = new Date().toDateString();
    const lastUpdate = dashboardData.streakData.lastUpdate;
    
    if (lastUpdate !== today) {
        // New day
        if (completed) {
            dashboardData.streakData.current += 1;
            dashboardData.streakData.best = Math.max(
                dashboardData.streakData.best, 
                dashboardData.streakData.current
            );
        } else {
            // Check if yesterday was completed (for maintaining streak)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (lastUpdate !== yesterdayString) {
                // Streak broken
                dashboardData.streakData.current = 0;
            }
        }
        
        dashboardData.streakData.lastUpdate = today;
        saveDashboardData();
    }
}

function showStreakCelebration() {
    // Create celebration effect
    const celebration = document.createElement('div');
    celebration.className = 'celebration-popup';
    celebration.innerHTML = `
        <div class="celebration-content">
            <i class="fas fa-fire"></i>
            <h3>Streak Maintained!</h3>
            <p>You're on fire! ${dashboardData.streakData.current} days strong!</p>
        </div>
    `;
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
        celebration.remove();
    }, 3000);
}

function setupEventListeners() {
    // Goal modal
    const goalModal = document.getElementById('goal-modal-overlay');
    const editGoalBtn = document.getElementById('edit-main-goal');
    const closeGoalModal = document.getElementById('close-goal-modal');
    const cancelGoal = document.getElementById('cancel-goal');
    const goalForm = document.getElementById('goal-form');
    
    editGoalBtn?.addEventListener('click', () => {
        goalModal.classList.add('active');
        loadGoalFormData();
    });
    
    closeGoalModal?.addEventListener('click', () => {
        goalModal.classList.remove('active');
    });
    
    cancelGoal?.addEventListener('click', () => {
        goalModal.classList.remove('active');
    });
    
    goalForm?.addEventListener('submit', handleGoalFormSubmit);
    
    // Quick actions
    document.getElementById('quick-chat')?.addEventListener('click', () => {
        window.location.href = 'chat.html';
    });
    
    document.getElementById('quick-task')?.addEventListener('click', () => {
        window.location.href = 'tasks-new.html?action=add';
    });
    
    document.getElementById('quick-note')?.addEventListener('click', () => {
        window.location.href = 'notes.html?action=add';
    });
    
    document.getElementById('quick-break')?.addEventListener('click', () => {
        showBreakSuggestion();
    });
    
    // Habit tracking
    document.querySelectorAll('.habit-item').forEach(item => {
        item.addEventListener('click', () => {
            const habit = item.dataset.habit;
            if (habit) {
                toggleHabit(habit);
            }
        });
    });
    
    // Refresh buttons
    document.getElementById('refresh-progress')?.addEventListener('click', () => {
        calculateAndUpdateProgress();
        showToast('Progress refreshed!', 'success');
    });
    
    document.getElementById('new-motivation')?.addEventListener('click', () => {
        updateMotivationalContent();
        showToast('New motivation loaded!', 'success');
    });
}

function loadGoalFormData() {
    const goal = JSON.parse(localStorage.getItem('mainGoal') || 'null');
    
    if (goal) {
        document.getElementById('goal-title-input').value = goal.title || '';
        document.getElementById('goal-description-input').value = goal.description || '';
        document.getElementById('goal-deadline-input').value = goal.deadline || '';
        document.getElementById('goal-category').value = goal.category || 'personal';
    }
}

function handleGoalFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const goal = {
        title: formData.get('goal-title-input') || document.getElementById('goal-title-input').value,
        description: formData.get('goal-description-input') || document.getElementById('goal-description-input').value,
        deadline: formData.get('goal-deadline-input') || document.getElementById('goal-deadline-input').value,
        category: formData.get('goal-category') || document.getElementById('goal-category').value,
        createdAt: new Date().toISOString(),
        progress: 0
    };
    
    // Save goal
    localStorage.setItem('mainGoal', JSON.stringify(goal));
    dashboardData.mainGoal = goal;
    
    // Update UI
    updateMainGoalDisplay();
    
    // Close modal
    document.getElementById('goal-modal-overlay').classList.remove('active');
    
    showToast('Main goal updated successfully!', 'success');
}

function updateMainGoalDisplay() {
    const goal = dashboardData.mainGoal || JSON.parse(localStorage.getItem('mainGoal') || 'null');
    
    const titleElement = document.getElementById('goal-title');
    const descriptionElement = document.getElementById('goal-description');
    const progressElement = document.getElementById('goal-progress-fill');
    const percentageElement = document.getElementById('goal-progress-percentage');
    const deadlineElement = document.getElementById('goal-deadline');
    
    if (goal) {
        titleElement.textContent = goal.title;
        descriptionElement.textContent = goal.description;
        progressElement.style.width = `${goal.progress || 0}%`;
        percentageElement.textContent = `${goal.progress || 0}%`;
        deadlineElement.textContent = goal.deadline ? 
            `Target: ${formatDate(goal.deadline)}` : 'No deadline set';
    }
}

function toggleTaskCompletion(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].completedAt = tasks[taskIndex].completed ? 
            new Date().toISOString() : null;
        
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Refresh dashboard
        loadTodaysFocus();
        calculateAndUpdateProgress();
        
        if (tasks[taskIndex].completed) {
            showToast('Task completed! 🎉', 'success');
        }
    }
}

function showBreakSuggestion() {
    const suggestions = [
        "Take 5 deep breaths and stretch your shoulders",
        "Walk around for 2 minutes to refresh your mind",
        "Drink a glass of water and look out the window",
        "Do 10 jumping jacks to get your blood flowing",
        "Close your eyes and meditate for 3 minutes",
        "Listen to your favorite song",
        "Write down 3 things you're grateful for",
        "Do some neck rolls and shoulder shrugs"
    ];
    
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    showToast(`Break suggestion: ${suggestion}`, 'info', 5000);
}

function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'exclamation-circle' : 
                          'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function addEntranceAnimations() {
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function refreshDashboardData() {
    console.log('🔄 Refreshing dashboard data...');
    calculateAndUpdateProgress();
    loadTodaysFocus();
    loadUpcomingTasks();
    updateElement('productivity-score', calculateProductivityScore());
}

function loadDashboardData() {
    const saved = localStorage.getItem('dashboardData');
    if (saved) {
        dashboardData = { ...dashboardData, ...JSON.parse(saved) };
    }
    
    // Load main goal
    updateMainGoalDisplay();
}

function saveDashboardData() {
    localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTaskDue(date, time) {
    const taskDate = new Date(date);
    const today = new Date().toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (taskDate.toDateString() === today) {
        return `Today${time ? ` at ${time}` : ''}`;
    } else if (taskDate.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow${time ? ` at ${time}` : ''}`;
    } else {
        return `${formatDate(date)}${time ? ` at ${time}` : ''}`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getWeekRange() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { start: startOfWeek, end: endOfWeek };
}

// Listen for external events
window.addEventListener('taskUpdated', (event) => {
    console.log('📋 Task updated, refreshing dashboard...');
    setTimeout(refreshDashboardData, 100);
});

window.addEventListener('profileUpdated', (event) => {
    console.log('👤 Profile updated, refreshing dashboard...');
    const profiles = getCurrentProfiles();
    updateUserElements(profiles);
});

// Add CSS for toast notifications
const toastStyles = `
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 10000;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 300px;
    box-shadow: var(--glass-shadow);
}

.toast.show {
    transform: translateX(0);
    opacity: 1;
}

.toast-success {
    border-left: 4px solid var(--success-color);
    color: var(--success-color);
}

.toast-error {
    border-left: 4px solid var(--error-color);
    color: var(--error-color);
}

.toast-info {
    border-left: 4px solid var(--info-color);
    color: var(--info-color);
}

.celebration-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
    padding: 2rem;
    border-radius: 20px;
    text-align: center;
    z-index: 10001;
    animation: celebrationBounce 0.6s ease-out;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.celebration-content i {
    font-size: 3rem;
    color: #FFD700;
    margin-bottom: 1rem;
    animation: pulse 1s infinite;
}

.celebration-content h3 {
    color: white;
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
}

.celebration-content p {
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
}

@keyframes celebrationBounce {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
    70% { transform: translate(-50%, -50%) scale(0.9); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
`;

// Inject toast styles
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);

console.log('🎯 Dashboard script loaded successfully');
