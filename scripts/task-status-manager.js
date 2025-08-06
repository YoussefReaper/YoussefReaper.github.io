// Enhanced Task Status Management Functions

// Get current status of a task based on time and completion
function getTaskCurrentStatus(task) {
    const currentTime = new Date();
    const taskDateTime = new Date(task.date + ' ' + task.time);
    const taskEndTime = new Date(taskDateTime.getTime() + (parseInt(task.duration) * 60000));
    const taskDateEnd = new Date(task.date + ' 23:59:59');
    
    if (task.completed) {
        if (task.lateCompletedAt) {
            return 'late-completed';
        }
        return 'completed';
    }
    
    if (currentTime > taskDateEnd) {
        return 'forgotten';
    } else if (currentTime > taskEndTime) {
        return 'overdue';
    } else if (currentTime > taskDateTime) {
        return 'in-progress';
    } else {
        const timeDiff = taskDateTime - currentTime;
        const hoursUntil = timeDiff / (1000 * 60 * 60);
        
        if (hoursUntil <= 1) {
            return 'due-soon';
        } else if (hoursUntil <= 24) {
            return 'due-today';
        } else {
            return 'upcoming';
        }
    }
}

// Apply status classes to task items
function applyTaskStatusClasses(taskItem, task) {
    const statusClasses = ['completed', 'late-completed', 'forgotten', 'overdue', 'in-progress', 'due-soon', 'due-today', 'upcoming'];
    taskItem.classList.remove(...statusClasses);
    
    const status = task.status || getTaskCurrentStatus(task);
    task.status = status;
    
    taskItem.classList.add(status);
    updateTaskStatusIndicator(taskItem, status);
}

// Update visual status indicator
function updateTaskStatusIndicator(taskItem, status) {
    let existingIndicator = taskItem.querySelector('.task-status-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const statusConfig = {
        'completed': { icon: '✅', text: 'Completed', color: '#10B981' },
        'late-completed': { icon: '⏰', text: 'Completed Late', color: '#F59E0B' },
        'forgotten': { icon: '❌', text: 'Forgotten', color: '#EF4444' },
        'overdue': { icon: '⚠️', text: 'Overdue', color: '#F59E0B' },
        'in-progress': { icon: '🔄', text: 'In Progress', color: '#3B82F6' },
        'due-soon': { icon: '⏰', text: 'Due Soon', color: '#F59E0B' },
        'due-today': { icon: '📅', text: 'Due Today', color: '#8B5CF6' },
        'upcoming': { icon: '📌', text: 'Upcoming', color: '#6B7280' }
    };
    
    const config = statusConfig[status];
    if (config) {
        const indicator = document.createElement('div');
        indicator.className = 'task-status-indicator';
        indicator.innerHTML = `
            <span class="status-icon">${config.icon}</span>
            <span class="status-text">${config.text}</span>
        `;
        indicator.style.color = config.color;
        
        const taskMeta = taskItem.querySelector('.task-meta');
        if (taskMeta) {
            taskMeta.appendChild(indicator);
        }
    }
}

// Animate completed tasks to end of list
function animateTaskToEnd(taskItem, status) {
    if (!taskItem) return;
    
    taskItem.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    
    if (status === 'completed') {
        createCelebrationParticles(taskItem);
        taskItem.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        taskItem.style.borderLeft = '4px solid #10B981';
    } else if (status === 'late-completed') {
        createLateCompletionEffect(taskItem);
        taskItem.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
        taskItem.style.borderLeft = '4px solid #F59E0B';
    }
    
    setTimeout(() => {
        const tasksList = taskItem.parentElement;
        if (tasksList) {
            tasksList.appendChild(taskItem);
            taskItem.style.transform = 'scale(0.98)';
            taskItem.style.opacity = '0.9';
        }
    }, 300);
    
    setTimeout(() => {
        taskItem.style.transition = '';
    }, 1000);
}

// Animate task back to original position
function animateTaskToOriginalPosition(taskItem, task) {
    if (!taskItem) return;
    
    taskItem.style.backgroundColor = '';
    taskItem.style.borderLeft = '';
    taskItem.style.transform = '';
    taskItem.style.opacity = '';
    
    sortTasksByDateTime();
}

// Create late completion visual effect
function createLateCompletionEffect(element) {
    if (!element) return;
    
    try {
        const rect = element.getBoundingClientRect();
        const particles = ['⏰', '⚡', '💫', '⚠️'];
        
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'late-completion-particle';
                particle.textContent = particles[Math.floor(Math.random() * particles.length)];
                particle.style.cssText = `
                    position: fixed;
                    left: ${rect.left + Math.random() * rect.width}px;
                    top: ${rect.top + rect.height / 2}px;
                    font-size: 20px;
                    pointer-events: none;
                    z-index: 1000;
                    animation: lateParticleFloat 2s ease-out forwards;
                `;
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 2000);
            }, i * 200);
        }
    } catch (error) {
        console.warn('Error creating late completion effect:', error);
    }
}

// Sort tasks by completion status and date/time
function sortTasksByDateTime() {
    const tasksList = document.querySelector('.tasks-list');
    if (!tasksList) return;
    
    const taskItems = Array.from(tasksList.querySelectorAll('.task-item:not(.sample-task)'));
    
    taskItems.sort((a, b) => {
        const taskA = tasks.find(t => t.id === a.dataset.taskId);
        const taskB = tasks.find(t => t.id === b.dataset.taskId);
        
        if (!taskA || !taskB) return 0;
        
        if (taskA.completed && !taskB.completed) return 1;
        if (!taskA.completed && taskB.completed) return -1;
        
        if (taskA.completed && taskB.completed) {
            if (taskA.status === 'completed' && taskB.status === 'late-completed') return 1;
            if (taskA.status === 'late-completed' && taskB.status === 'completed') return -1;
        }
        
        const dateTimeA = new Date(taskA.date + ' ' + taskA.time);
        const dateTimeB = new Date(taskB.date + ' ' + taskB.time);
        
        return dateTimeA - dateTimeB;
    });
    
    taskItems.forEach(item => {
        tasksList.appendChild(item);
    });
}

// Check for forgotten tasks
function checkForForgottenTasks() {
    const currentTime = new Date();
    let forgottenCount = 0;
    
    tasks.forEach(task => {
        if (task.completed) return;
        
        const taskDateEnd = new Date(task.date + ' 23:59:59');
        
        if (currentTime > taskDateEnd && task.status !== 'forgotten') {
            task.status = 'forgotten';
            forgottenCount++;
            
            const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
            if (taskElement) {
                applyTaskStatusClasses(taskElement, task);
                
                taskElement.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                taskElement.style.borderLeft = '4px solid #EF4444';
                taskElement.style.opacity = '0.7';
                taskElement.style.animation = 'forgottenPulse 2s ease-in-out infinite';
            }
            
            updateTaskInStorage(task);
        }
    });
    
    if (forgottenCount > 0) {
        showEnhancedNotification(
            `${forgottenCount} task${forgottenCount > 1 ? 's' : ''} marked as forgotten! 📝`, 
            'error'
        );
        updateTaskStatistics();
    }
}

// Enhanced statistics calculation
function updateTaskStatistics() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const lateCompletedTasks = tasks.filter(task => task.status === 'late-completed').length;
    const forgottenTasks = tasks.filter(task => task.status === 'forgotten').length;
    const overdueTasks = tasks.filter(task => task.status === 'overdue').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    
    // Update statistics display
    updateStatisticsDisplay({
        total: totalTasks,
        completed: completedTasks,
        lateCompleted: lateCompletedTasks,
        forgotten: forgottenTasks,
        overdue: overdueTasks,
        inProgress: inProgressTasks,
        completionRate: totalTasks > 0 ? ((completedTasks + lateCompletedTasks) / totalTasks * 100).toFixed(1) : 0,
        onTimeRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0
    });
}

function updateStatisticsDisplay(stats) {
    // Update existing stats displays
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const completionRateEl = document.getElementById('completion-rate');
    
    if (totalTasksEl) totalTasksEl.textContent = stats.total;
    if (completedTasksEl) completedTasksEl.textContent = stats.completed;
    if (completionRateEl) completionRateEl.textContent = stats.completionRate + '%';
    
    // Update new enhanced stats if elements exist
    const lateCompletedEl = document.getElementById('late-completed-tasks');
    const forgottenTasksEl = document.getElementById('forgotten-tasks');
    const onTimeRateEl = document.getElementById('on-time-rate');
    
    if (lateCompletedEl) lateCompletedEl.textContent = stats.lateCompleted;
    if (forgottenTasksEl) forgottenTasksEl.textContent = stats.forgotten;
    if (onTimeRateEl) onTimeRateEl.textContent = stats.onTimeRate + '%';
}

// Run checks periodically
setInterval(checkForForgottenTasks, 60000);

// Initialize status checks on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        checkForForgottenTasks();
        // Update all existing task statuses
        tasks.forEach(task => {
            const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
            if (taskElement) {
                applyTaskStatusClasses(taskElement, task);
            }
        });
        updateTaskStatistics();
    }, 2000);
});
