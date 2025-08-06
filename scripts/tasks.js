// Validation and utility functions
function validateTaskForm() {
    const taskName = document.getElementById('task-name').value.trim();
    const taskDate = document.getElementById('task-date').value;
    const taskTime = document.getElementById('task-time').value;
    const taskDuration = document.getElementById('task-duration').value;

    if (!taskName) {
        showEnhancedNotification('Please enter a task name', 'error');
        document.getElementById('task-name').focus();
        return false;
    }

    // Date is required, but time is optional
    if (!taskDate) {
        showEnhancedNotification('Please select a date', 'error');
        document.getElementById('task-date').focus();
        return false;
    }

    // If time is provided, validate duration
    if (taskTime && (!taskDuration || taskDuration < 1)) {
        showEnhancedNotification('Please enter a valid duration when time is specified', 'error');
        document.getElementById('task-duration').focus();
        return false;
    }

    // Check if date/time is in the past (except for today) - only if time is specified
    if (taskTime) {
        const selectedDateTime = new Date(taskDate + ' ' + taskTime);
        const now = new Date();
        
        if (selectedDateTime < now) {
            const today = new Date().toISOString().split('T')[0];
            if (taskDate !== today) {
                showEnhancedNotification('Selected date/time is in the past', 'warning');
            }
        }
    }

    return true;
}

function updateEmptyState() {
    const tasksList = document.getElementById('tasksList') || document.querySelector('.tasks-list');
    const emptyState = document.getElementById('emptyState');
    
    if (!tasksList) return;
    
    const taskItems = tasksList.querySelectorAll('.task-item:not(.sample-task)');
    
    if (taskItems.length === 0) {
        tasksList.classList.add('empty');
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    } else {
        tasksList.classList.remove('empty');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }
}

// Global variables
let tasksList;
let tasks = [];

// Task templates for quick creation
const taskTemplates = {
    study: {
        name: 'Study Session',
        description: 'Focused study time',
        duration: '60',
        priority: '2'
    },
    homework: {
        name: 'Complete Homework',
        description: 'Work on assignments',
        duration: '90',
        priority: '3'
    },
    reading: {
        name: 'Reading Assignment',
        description: 'Read course materials',
        duration: '45',
        priority: '2'
    },
    review: {
        name: 'Review Notes',
        description: 'Go over class notes',
        duration: '30',
        priority: '1'
    },
    project: {
        name: 'Project Work',
        description: 'Work on project tasks',
        duration: '120',
        priority: '3'
    },
    exercise: {
        name: 'Exercise/Workout',
        description: 'Physical activity',
        duration: '45',
        priority: '2'
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTaskManager);

function initializeTaskManager() {
    // Get DOM elements
    const advancedToggleButton = document.querySelector('.advanced-toggle-button');
    const advancedOptions = document.querySelector('.advanced-options');
    const taskForm = document.getElementById('task-form');
    const repeatableCheckbox = document.getElementById('task-repeatable-days');
    const dayChoices = document.querySelectorAll('.day-choice');
    
    tasksList = document.querySelector('.tasks-list');
    
    if (!tasksList) {
        console.error('Tasks list element not found! Make sure the HTML has an element with class "tasks-list"');
        return;
    }

    // Initialize enhanced date/time features
    initializeDateTimeEnhancements();

    // Load existing tasks on page load with validation
    loadTasksWithValidation();
    
    // Validate task persistence every 30 seconds
    setInterval(validateTaskPersistence, 30000);

    // Listen for task updates from chat
    window.addEventListener('taskUpdated', (event) => {
        const { action, task } = event.detail;
        
        switch (action) {
            case 'created':
                // Add the task to local tasks array if not already present
                if (!tasks.find(t => t.id === task.id)) {
                    tasks.push(task);
                    createTaskFromStorage(task);
                }
                break;
            case 'updated':
                // Update the task in the DOM
                const taskIndex = tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    tasks[taskIndex] = task;
                    updateTaskInDOM(task);
                }
                break;
            case 'deleted':
                // Remove the task from DOM
                const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                if (taskElement) {
                    taskElement.remove();
                    tasks = tasks.filter(t => t.id !== task.id);
                    updateEmptyState();
                    updateTaskStatistics();
                }
                break;
        }
    });

    // Setup event listeners
    setupEventListeners(advancedToggleButton, advancedOptions, taskForm, repeatableCheckbox, dayChoices);
    
    // Initialize modern features
    initializeModernFeatures();
    
    // Initialize statistics
    setTimeout(updateTaskStatistics, 100);
}

function setupEventListeners(advancedToggleButton, advancedOptions, taskForm, repeatableCheckbox, dayChoices) {
    // Advanced options toggle
    if (advancedToggleButton && advancedOptions) {
        advancedToggleButton.addEventListener('click', () => {
            advancedOptions.classList.toggle('visible');
            advancedToggleButton.innerHTML = advancedOptions.classList.contains('visible') 
                ? '<i class="fas fa-chevron-up"></i> Hide Advanced' 
                : '<i class="fas fa-chevron-down"></i> Advanced Settings';
        });
    }

    // Task form submission
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmission);
    }

    // Repeatable days toggle
    if (repeatableCheckbox) {
        repeatableCheckbox.addEventListener('change', function() {
            dayChoices.forEach(choice => {
                if (this.checked) {
                    choice.classList.add('active');
                } else {
                    choice.classList.remove('active');
                    choice.querySelector('input').checked = false;
                }
            });
        });
    }

    // Sample task event listeners
    const sampleCheckboxes = document.querySelectorAll('.sample-task .task-complete-checkbox');
    sampleCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskItem = this.closest('.task-item');
            taskItem.classList.toggle('completed', this.checked);
        });
    });

    // Milestone dropdown event listener
    const milestoneSelect = document.getElementById('task-milestone');
    const customMilestoneField = document.getElementById('task-custom-milestone');
    
    if (milestoneSelect && customMilestoneField) {
        milestoneSelect.addEventListener('change', function() {
            if (this.value === 'other') {
                customMilestoneField.style.display = 'block';
                customMilestoneField.focus();
            } else {
                customMilestoneField.style.display = 'none';
                customMilestoneField.value = '';
            }
        });
    }
}

function handleTaskSubmission(e) {
    e.preventDefault();
    
    console.log('=== Task Submission Started ==='); // Debug log
    
    if (!validateTaskForm()) {
        console.log('Task form validation failed'); // Debug log
        return;
    }
    
    const task = collectTaskFormData();
    console.log('=== Collected Task Data ===', task); // Debug log
    
    if (!task) {
        console.error('Failed to collect task data');
        return;
    }
    
    if (!task.name) {
        console.error('Task name is missing from collected data:', task);
        return;
    }
    
    // Create event if task has a specific time
    if (task.time && task.time.trim() !== '') {
        const eventId = createEventFromTask(task);
        if (eventId) {
            task.linkedEventId = eventId;
        }
    }
    
    console.log('About to render task with data:', task); // Debug log
    renderTask(task);
    saveTaskToStorage(task);
    clearFormDraft(); // Clear the auto-saved draft
    
    const successMessage = task.time ? 
        'Task created and added to schedule! 🎉📅' : 
        'Task created successfully! 🎉';
    showEnhancedNotification(successMessage, 'success');
    e.target.reset();
    
    console.log('=== Task Creation Complete ==='); // Debug log
    
    // Reset advanced options visibility
    const advancedOptions = document.querySelector('.advanced-options');
    const advancedToggleButton = document.querySelector('.advanced-toggle-button');
    if (advancedOptions && advancedToggleButton) {
        advancedOptions.classList.remove('visible');
        advancedToggleButton.innerHTML = '<i class="fas fa-chevron-down"></i><span>Show Advanced</span>';
    }
}

// Function to create an event from a task
function createEventFromTask(task) {
    try {
        // Check if schedule manager is available
        if (typeof window.scheduleManager === 'undefined') {
            console.log('Schedule manager not available, event will not be created');
            return null;
        }
        
        const [hours, minutes] = task.time.split(':').map(Number);
        const taskDate = new Date(task.date);
        taskDate.setHours(hours, minutes, 0, 0);
        
        const duration = parseInt(task.duration) || 30;
        const endDate = new Date(taskDate.getTime() + duration * 60 * 1000);
        
        // Determine category based on task priority or tags
        let category = 'work'; // default
        if (task.tags) {
            const tags = task.tags.toLowerCase();
            if (tags.includes('study') || tags.includes('homework')) {
                category = 'study';
            } else if (tags.includes('personal') || tags.includes('life')) {
                category = 'personal';
            } else if (tags.includes('exercise') || tags.includes('workout')) {
                category = 'exercise';
            } else if (tags.includes('break') || tags.includes('rest')) {
                category = 'break';
            }
        }
        
        const event = {
            id: generateTaskId(), // Reuse the task ID generator
            title: task.name,
            category: category,
            startTime: taskDate,
            endTime: endDate,
            status: 'pending',
            priority: task.priority === '3' ? 'high' : task.priority === '1' ? 'low' : 'medium',
            description: task.description || '',
            linkedTaskId: task.id // Link back to the task
        };
        
        // Add event to schedule manager
        window.scheduleManager.addEvent(event);
        
        console.log('Created event from task:', event);
        return event.id;
    } catch (error) {
        console.error('Error creating event from task:', error);
        return null;
    }
}

function collectTaskFormData() {
    const taskId = generateTaskId();
    
    // Helper function to safely get element value
    const getElementValue = (id, defaultValue = '') => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : defaultValue;
    };
    
    const getElementChecked = (id, defaultValue = false) => {
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
    };
    
    // Collect repeat days with validation
    const repeatDaysElements = document.querySelectorAll('.repeat-days input[type="checkbox"]:checked');
    const repeatDays = repeatDaysElements ? Array.from(repeatDaysElements).map(day => day.value) : [];
    
    // Collect milestone data
    const milestoneSelect = getElementValue('task-milestone');
    const customMilestone = getElementValue('task-custom-milestone');
    const milestone = customMilestone || milestoneSelect || '';
    
    const taskData = {
        id: taskId,
        name: getElementValue('task-name'),
        description: getElementValue('task-description'),
        date: getElementValue('task-date') || new Date().toISOString().split('T')[0],
        time: getElementValue('task-time') || '', // Optional - empty string if not provided
        duration: getElementValue('task-duration') || '30',
        priority: formatPriority(getElementValue('task-priority')) || '2',
        location: getElementValue('task-location'),
        notes: getElementValue('task-notes'),
        tags: getElementValue('task-tags'),
        color: getElementValue('task-color', '#4299e1'),
        deadline: getElementValue('task-deadline'),
        effort: getElementValue('task-effort', '2'),
        milestone: milestone,
        repeatable: getElementChecked('task-repeatable-days'),
        repeatDays: repeatDays,
        completed: false,
        createdAt: new Date().toISOString(),
        linkedEventId: null // For connecting tasks to events
    };
    
    console.log('Collected task data:', taskData);
    return taskData;
}

function renderTask(task) {
    if (!tasksList) {
        console.error('Cannot render task: tasks list not found');
        return;
    }
    
    if (!task || !task.name) {
        console.error('Cannot render task: invalid task data', task);
        return;
    }
    
    console.log('Rendering task:', task); // Debug log
    
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item new-task';
    taskItem.dataset.taskId = task.id;

    // Get helper values with safe fallbacks
    const priorityText = getPriorityText(task.priority) || '🟡 Medium';
    const effortText = formatEffort(task.effort) || 'Medium';
    const priorityColor = getPriorityColor(task.priority) || '#fbbf24';
    const milestoneText = getMilestoneText(task.milestone) || '';
    
    // Ensure task properties exist with fallbacks
    const taskName = task.name || 'Untitled Task';
    const taskDescription = task.description || 'No description';
    const taskDate = task.date || new Date().toISOString().split('T')[0];
    const taskTime = task.time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const taskDuration = task.duration || '30';
    
    console.log('Task rendering values:', {
        taskName, taskDescription, taskDate, taskTime, taskDuration,
        priorityText, effortText, priorityColor, milestoneText
    }); // Debug log

    taskItem.innerHTML = `
        <div class="task-checkbox-container">
            <input type="checkbox" class="task-complete-checkbox" ${task.completed ? 'checked' : ''}>
            <label><i class="fas fa-check"></i></label>
        </div>
        <div class="task-content">
            <div class="task-header">
                <h3 class="task-name">${taskName}</h3>
                <div class="task-badges">
                    <span class="priority-badge ${String(task.priority || '').toLowerCase()}" style="background-color: ${priorityColor}">
                        ${priorityText}
                    </span>
                    <span class="effort-badge">${effortText}</span>
                    ${task.milestone ? `<span class="milestone-badge">${milestoneText}</span>` : ''}
                </div>
            </div>
            <p class="task-description">${taskDescription}</p>
            <div class="task-meta">
                <div class="task-timing">
                    <i class="fas fa-calendar"></i>
                    <span class="task-date">${formatTaskDateTime(taskDate, taskTime)}</span>
                    <i class="fas fa-clock"></i>
                    <span class="task-duration">${taskDuration} min</span>
                    <span class="remaining-time">${calculateRemainingTime(taskDate, taskTime, taskDuration)}</span>
                    ${task.linkedEventId ? '<span class="linked-event-indicator" title="Linked to schedule event"><i class="fas fa-link"></i> Scheduled</span>' : ''}
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit-task-button" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${!task.linkedEventId && (!task.time || task.time.trim() === '') ? 
                        '<button class="task-action-btn schedule-task-button" title="Add to Schedule"><i class="fas fa-calendar-plus"></i></button>' : 
                        ''}
                    <button class="task-action-btn delete-task-button" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add completed class if task is completed
    if (task.completed) {
        taskItem.classList.add('completed');
    }
    
    // Apply task status classes (late, due today, etc.)
    applyTaskStatusClasses(taskItem, task);

    // Remove new-task class after animation
    setTimeout(() => {
        taskItem.classList.remove('new-task');
    }, 600);

    // Add event listeners
    const checkbox = taskItem.querySelector('.task-complete-checkbox');
    checkbox.addEventListener('change', function () {
        const wasCompleted = task.completed;
        task.completed = this.checked;
        
        // Determine task status when completing
        if (this.checked) {
            const currentTime = new Date();
            const taskDateTime = new Date(task.date + ' ' + task.time);
            const taskEndTime = new Date(taskDateTime.getTime() + (parseInt(task.duration) * 60000));
            
            // Check if task is being completed late
            if (currentTime > taskEndTime) {
                task.status = 'late-completed';
                task.completedAt = new Date().toISOString();
                task.lateCompletedAt = new Date().toISOString();
                
                // Apply status classes and animate
                applyTaskStatusClasses(taskItem, task);
                animateTaskToEnd(taskItem, 'late-completed');
                showEnhancedNotification('Task completed late! ⏰ Better late than never!', 'warning');
            } else {
                task.status = 'completed';
                task.completedAt = new Date().toISOString();
                
                // Apply status classes and animate
                applyTaskStatusClasses(taskItem, task);
                animateTaskToEnd(taskItem, 'completed');
                showEnhancedNotification('Task completed on time! Great job! 🎉', 'success');
            }
        } else {
            // Task unchecked
            delete task.completedAt;
            delete task.lateCompletedAt;
            task.status = getTaskCurrentStatus(task);
            
            // Apply current status and restore position
            applyTaskStatusClasses(taskItem, task);
            animateTaskToOriginalPosition(taskItem, task);
        }
        
        // Update the task in the global tasks array
        let taskIndex = tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...task };
        }
        
        updateTaskInStorage(task);
        updateTaskStatistics();
        
        // Force refresh global stats if available
        if (window.globalStatsManager) {
            window.globalStatsManager.forceRefresh();
        }
    });

    const deleteButton = taskItem.querySelector('.delete-task-button');
    deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTaskFromStorage(task.id);
            taskItem.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                taskItem.remove();
                updateEmptyState();
                updateTaskStatistics();
            }, 300);
            showEnhancedNotification('Task deleted', 'info');
        }
    });

    const editButton = taskItem.querySelector('.edit-task-button');
    editButton.addEventListener('click', () => {
        openEditModal(task);
    });

    // Add schedule button listener if button exists
    const scheduleButton = taskItem.querySelector('.schedule-task-button');
    if (scheduleButton) {
        scheduleButton.addEventListener('click', () => {
            openScheduleTaskModal(task);
        });
    }

    // Initialize task status and apply visual classes
    if (!task.status) {
        task.status = getTaskCurrentStatus(task);
    }
    applyTaskStatusClasses(taskItem, task);

    tasksList.appendChild(taskItem);
    updateEmptyState();
    updateTaskStatistics();
}

// Function to open schedule task modal
function openScheduleTaskModal(task) {
    // Create modal HTML if it doesn't exist
    let modal = document.getElementById('scheduleTaskModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'scheduleTaskModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-calendar-plus"></i> Add Task to Schedule</h3>
                    <button type="button" class="close-modal-btn" id="closeScheduleModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="schedule-task-info">
                        <strong>Task:</strong> <span id="scheduleTaskName"></span>
                    </p>
                    <form id="scheduleTaskForm">
                        <div class="form-group">
                            <label for="scheduleTaskDate">Date:</label>
                            <input type="date" id="scheduleTaskDate" name="date" required>
                        </div>
                        <div class="form-group">
                            <label for="scheduleTaskTime">Time:</label>
                            <input type="time" id="scheduleTaskTime" name="time" required>
                        </div>
                        <div class="form-group">
                            <label for="scheduleTaskDuration">Duration (minutes):</label>
                            <input type="number" id="scheduleTaskDuration" name="duration" 
                                   min="5" max="480" step="5" value="30" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="cancel-btn" id="cancelScheduleTask">Cancel</button>
                            <button type="submit" class="submit-btn">
                                <i class="fas fa-calendar-plus"></i> Add to Schedule
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('closeScheduleModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('cancelScheduleTask').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        document.getElementById('scheduleTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const time = formData.get('time');
            const date = formData.get('date');
            const duration = formData.get('duration');

            // Update task with new time information
            task.time = time;
            task.date = date;
            task.duration = duration;

            // Create event from task
            const eventId = createEventFromTask(task);
            if (eventId) {
                task.linkedEventId = eventId;
                
                // Update the task in storage
                const taskIndex = tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    tasks[taskIndex] = task;
                    saveTasksToLocalStorage();
                }

                // Re-render the task to show the updated UI
                const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                if (taskElement) {
                    taskElement.remove();
                    renderTask(task);
                }

                showEnhancedNotification('Task scheduled successfully! 📅', 'success');
                modal.style.display = 'none';
            } else {
                showEnhancedNotification('Failed to add task to schedule', 'error');
            }
        });
    }

    // Populate modal with task information
    document.getElementById('scheduleTaskName').textContent = task.name;
    document.getElementById('scheduleTaskDate').value = task.date || new Date().toISOString().split('T')[0];
    document.getElementById('scheduleTaskDuration').value = task.duration || '30';
    
    // Show modal
    modal.style.display = 'flex';
}

// Storage functions
function saveTaskToStorage(task) {
    console.log('Saving task to storage:', task);
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    console.log(`Task saved. Total tasks in storage: ${tasks.length}`);
    updateTaskStatistics();
    
    // Dispatch event for cross-page synchronization
    dispatchTaskEvent('created', task);
    
    // Force refresh global stats if available
    if (window.globalStatsManager) {
        window.globalStatsManager.forceRefresh();
    }
}

function updateTaskInStorage(updatedTask) {
    const index = tasks.findIndex(task => task.id === updatedTask.id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updatedTask };
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Dispatch event for cross-page synchronization
        dispatchTaskEvent('updated', tasks[index]);
    }
    updateTaskStatistics();
    
    // Force refresh global stats if available
    if (window.globalStatsManager) {
        window.globalStatsManager.forceRefresh();
    }
}

function deleteTaskFromStorage(taskId) {
    const taskToDelete = tasks.find(task => task.id === taskId);
    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateTaskStatistics();
    
    // Dispatch event for cross-page synchronization
    if (taskToDelete) {
        dispatchTaskEvent('deleted', taskToDelete);
    }
    
    // Force refresh global stats if available
    if (window.globalStatsManager) {
        window.globalStatsManager.forceRefresh();
    }
}

// Event dispatcher for cross-page task synchronization
function dispatchTaskEvent(action, taskData) {
    const event = new CustomEvent('taskUpdated', {
        detail: {
            action: action, // 'created', 'updated', 'deleted'
            task: taskData
        }
    });
    window.dispatchEvent(event);
}

function loadTasks() {
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    // Clear existing tasks (except sample tasks)
    const existingTasks = tasksList.querySelectorAll('.task-item:not(.sample-task)');
    existingTasks.forEach(task => task.remove());
    
    tasks.forEach(task => {
        createTaskFromStorage(task);
    });
    updateTaskStatistics();
}

// Clean up corrupted task data
function cleanupCorruptedTasks() {
    try {
        const storedTasks = localStorage.getItem('tasks');
        if (!storedTasks) return;
        
        let tasks = JSON.parse(storedTasks);
        console.log('Original tasks array:', tasks);
        
        // Filter out any corrupted data (numbers, strings, or malformed objects)
        const cleanTasks = tasks.filter(task => {
            // Task should be an object with required properties
            return task && 
                   typeof task === 'object' && 
                   task.id && 
                   (task.name || task.title) &&
                   typeof task.id === 'string';
        });
        
        console.log(`Cleaned tasks: ${cleanTasks.length} valid out of ${tasks.length} total`);
        
        if (cleanTasks.length !== tasks.length) {
            console.log('Found corrupted task data, cleaning up...');
            localStorage.setItem('tasks', JSON.stringify(cleanTasks));
            
            // Update global tasks array
            window.tasks = cleanTasks;
            
            // Show notification about cleanup
            if (window.showNotification) {
                showNotification(`Cleaned up ${tasks.length - cleanTasks.length} corrupted tasks`, 'info');
            }
        }
        
        return cleanTasks;
    } catch (error) {
        console.error('Error cleaning up tasks:', error);
        // If there's a serious error, reset to empty array
        localStorage.setItem('tasks', JSON.stringify([]));
        return [];
    }
}

// Enhanced task persistence validation
function validateTaskPersistence() {
    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const currentTasks = tasks || [];
    
    console.log('Task persistence validation:', {
        storedCount: storedTasks.length,
        currentCount: currentTasks.length,
        storedTasks: storedTasks.map(t => ({ id: t.id, name: t.name, completed: t.completed })),
        currentTasks: currentTasks.map(t => ({ id: t.id, name: t.name, completed: t.completed }))
    });
    
    // Sync if there's a mismatch
    if (storedTasks.length !== currentTasks.length) {
        console.log('Syncing tasks from localStorage...');
        tasks = storedTasks;
        loadTasks();
        return false;
    }
    
    return true;
}

// Enhanced loadTasks function with better error handling
function loadTasksWithValidation() {
    try {
        // Clean up any corrupted data first
        const cleanTasks = cleanupCorruptedTasks();
        
        const storedTasks = localStorage.getItem('tasks');
        
        if (!storedTasks) {
            console.log('No stored tasks found. Initializing empty array.');
            tasks = [];
            localStorage.setItem('tasks', JSON.stringify(tasks));
            return;
        }
        
        tasks = JSON.parse(storedTasks);
        console.log(`Loaded ${tasks.length} tasks from localStorage`);
        
        // Clear existing tasks (except sample tasks)
        const existingTasks = tasksList.querySelectorAll('.task-item:not(.sample-task)');
        existingTasks.forEach(task => task.remove());
        
        // Render each task
        tasks.forEach((task, index) => {
            try {
                createTaskFromStorage(task);
            } catch (error) {
                console.error(`Error creating task ${index}:`, error, task);
            }
        });
        
        updateTaskStatistics();
        updateEmptyState();
        
        console.log('Tasks loaded successfully');
        
    } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        tasks = [];
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

function createTaskFromStorage(taskObj) {
    if (!tasksList) {
        tasksList = document.querySelector('.tasks-list');
    }
    
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.dataset.taskId = taskObj.id || generateTaskId();

    const priorityText = getPriorityText(taskObj.priority);
    const effortText = typeof taskObj.effort === 'string' && taskObj.effort.includes('😌') ? 
                       taskObj.effort : formatEffort(taskObj.effort);
    const priorityColor = getPriorityColor(taskObj.priority);
    const milestoneText = getMilestoneText(taskObj.milestone);

    taskItem.innerHTML = `
        <div class="task-checkbox-container">
            <input type="checkbox" class="task-complete-checkbox" ${taskObj.completed ? 'checked' : ''}>
            <label><i class="fas fa-check"></i></label>
        </div>
        <div class="task-content">
            <div class="task-header">
                <h3 class="task-name">${taskObj.name}</h3>
                <div class="task-badges">
                    <span class="priority-badge ${taskObj.priority}" style="background-color: ${priorityColor}">
                        ${priorityText}
                    </span>
                    <span class="effort-badge">${effortText}</span>
                    ${taskObj.milestone ? `<span class="milestone-badge">${milestoneText}</span>` : ''}
                </div>
            </div>
            <p class="task-description">${taskObj.description || 'No description'}</p>
            <div class="task-meta">
                <div class="task-timing">
                    <i class="fas fa-calendar"></i>
                    <span class="task-date">${formatTaskDateTime(taskObj.date, taskObj.time)}</span>
                    <i class="fas fa-clock"></i>
                    <span class="task-duration">${taskObj.duration} min</span>
                    <span class="remaining-time">${calculateRemainingTime(taskObj.date, taskObj.time, taskObj.duration)}</span>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit-task-button" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete-task-button" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add completed class if task is completed
    if (taskObj.completed) {
        taskItem.classList.add('completed');
    }
    
    // Apply task status classes (late, due today, etc.)
    applyTaskStatusClasses(taskItem, taskObj);

    // Add event listeners
    const checkbox = taskItem.querySelector('.task-complete-checkbox');
    checkbox.addEventListener('change', function () {
        taskObj.completed = this.checked;
        taskItem.classList.toggle('completed', this.checked);
        
        // Add completion timestamp
        if (this.checked) {
            taskObj.completedAt = new Date().toISOString();
        } else {
            delete taskObj.completedAt;
        }
        
        // Update the task in the global tasks array
        let taskIndex3 = tasks.findIndex(t => t.id === taskObj.id);
        if (taskIndex3 !== -1) {
            tasks[taskIndex3] = { ...tasks[taskIndex3], ...taskObj };
        }
        
        updateTaskInStorage(task);
        
        if (this.checked) {
            const currentTime = new Date();
            const taskDateTime = new Date(task.date + ' ' + task.time);
            const taskEndTime = new Date(taskDateTime.getTime() + (parseInt(task.duration) * 60000));
            
            // Check if task is being completed late
            if (currentTime > taskEndTime) {
                task.status = 'late-completed';
                task.completedAt = new Date().toISOString();
                task.lateCompletedAt = new Date().toISOString();
                
                // Apply late completion styling
                taskItem.classList.remove('completed');
                taskItem.classList.add('late-completed');
                
                // Animate to end with yellow color
                animateTaskToEnd(taskItem, 'late-completed');
                showEnhancedNotification('Task completed late! ⏰ Better late than never!', 'warning');
            } else {
                task.status = 'completed';
                task.completedAt = new Date().toISOString();
                
                // Apply normal completion styling
                taskItem.classList.add('completed');
                taskItem.classList.remove('late-completed', 'forgotten');
                
                // Animate to end with green color
                animateTaskToEnd(taskItem, 'completed');
                showEnhancedNotification('Task completed on time! Great job! 🎉', 'success');
            }
        } else {
            // Task unchecked
            delete taskObj.completedAt;
            delete taskObj.lateCompletedAt;
            task.status = getTaskCurrentStatus(task);
            
            // Remove completion classes and restore original position
            taskItem.classList.remove('completed', 'late-completed');
            applyTaskStatusClasses(taskItem, task);
            
            // Move back to original position
            animateTaskToOriginalPosition(taskItem, task);
        }
        
        // Update the task in the global tasks array
        let taskIndex2 = tasks.findIndex(t => t.id === taskObj.id);
        if (taskIndex2 !== -1) {
            tasks[taskIndex2] = { ...tasks[taskIndex2], ...taskObj };
        }
        
        updateTaskInStorage(taskObj);
    });

    const deleteButton = taskItem.querySelector('.delete-task-button');
    deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTaskFromStorage(taskObj.id);
            taskItem.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                taskItem.remove();
                updateEmptyState();
                updateTaskStatistics();
            }, 300);
            showNotification('Task deleted', 'info');
        }
    });

    const editButton = taskItem.querySelector('.edit-task-button');
    editButton.addEventListener('click', () => {
        openEditModal(taskObj);
    });

    tasksList.appendChild(taskItem);
    updateEmptyState();
}

// Task DOM manipulation functions
function updateTaskInDOM(task) {
    const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
    if (!taskElement) {
        console.warn(`Task element not found for task ID: ${task.id}`);
        return;
    }
    
    // Update task name
    const taskNameEl = taskElement.querySelector('.task-name');
    if (taskNameEl) {
        taskNameEl.textContent = task.name;
    }
    
    // Update task description
    const taskDescEl = taskElement.querySelector('.task-description');
    if (taskDescEl) {
        taskDescEl.textContent = task.description || '';
    }
    
    // Update completion status
    const checkbox = taskElement.querySelector('.task-complete-checkbox');
    if (checkbox) {
        checkbox.checked = task.completed || false;
    }
    
    // Update priority badge
    const priorityBadge = taskElement.querySelector('.priority-badge');
    if (priorityBadge) {
        priorityBadge.textContent = getPriorityText(task.priority);
        priorityBadge.className = `priority-badge ${getPriorityClass(task.priority)}`;
    }
    
    // Update date/time display
    const taskDateEl = taskElement.querySelector('.task-date');
    if (taskDateEl) {
        taskDateEl.textContent = formatTaskDateTime(task.date, task.time);
    }
    
    // Update duration
    const taskDurationEl = taskElement.querySelector('.task-duration');
    if (taskDurationEl) {
        taskDurationEl.textContent = `${task.duration} min`;
    }
    
    // Apply status classes if available
    if (typeof applyTaskStatusClasses === 'function') {
        applyTaskStatusClasses(taskElement, task);
    }
    
    console.log(`Updated task in DOM: ${task.name}`);
}

function getPriorityClass(priority) {
    switch (String(priority)) {
        case "1": return "low";
        case "2": return "medium";
        case "3": return "high";
        default: return "medium";
    }
}

// Date/Time enhancement functions
function initializeDateTimeEnhancements() {
    // Set intelligent defaults for date and time
    setIntelligentDateTimeDefaults();
    
    // Setup date/time validation and helpers
    setupDateTimeValidation();
    
    // Setup quick date selection buttons
    setupQuickDateOptions();
}

function setIntelligentDateTimeDefaults() {
    const dateInput = document.getElementById('task-date');
    const timeInput = document.getElementById('task-time');
    const durationInput = document.getElementById('task-duration');
    
    // Set default date to today
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    // Set default time to next hour
    if (timeInput && !timeInput.value) {
        const now = new Date();
        const nextHour = new Date(now.getTime() + (60 * 60 * 1000));
        nextHour.setMinutes(0, 0, 0); // Round to the hour
        const timeString = nextHour.toTimeString().slice(0, 5);
        timeInput.value = timeString;
    }
    
    // Set default duration
    if (durationInput && !durationInput.value) {
        durationInput.value = '60'; // Default 60 minutes
    }
}

function setupDateTimeValidation() {
    const dateInput = document.getElementById('task-date');
    const timeInput = document.getElementById('task-time');
    const durationInput = document.getElementById('task-duration');
    
    if (dateInput) {
        dateInput.addEventListener('change', () => {
            validateDateInput(dateInput);
            updateDateHelperText(dateInput);
        });
        
        dateInput.addEventListener('focus', () => {
            showEnhancedNotification('💡 Tip: Choose a date when you want to complete this task', 'info', 3000);
        });
    }
    
    if (timeInput) {
        timeInput.addEventListener('change', () => {
            validateTimeInput(timeInput, dateInput);
            updateTimeHelperText(timeInput);
        });
        
        timeInput.addEventListener('focus', () => {
            showEnhancedNotification('⏰ Pick a time when you\'ll be focused and available', 'info', 3000);
        });
    }
    
    if (durationInput) {
        durationInput.addEventListener('input', () => {
            updateDurationHelperText(durationInput);
        });
        
        durationInput.addEventListener('focus', () => {
            showEnhancedNotification('⏱️ How long do you think this task will take?', 'info', 3000);
        });
    }
}

function setupQuickDateOptions() {
    const dateInput = document.getElementById('task-date');
    if (!dateInput) return;
    
    // Find the date input's parent to add quick options
    const dateGroup = dateInput.closest('.form-group');
    if (!dateGroup) return;
    
    // Create quick date options
    const quickOptions = document.createElement('div');
    quickOptions.className = 'quick-date-options';
    quickOptions.innerHTML = `
        <div class="quick-options-label">Quick Select:</div>
        <div class="quick-date-buttons">
            <button type="button" class="quick-date-btn" data-days="0">Today</button>
            <button type="button" class="quick-date-btn" data-days="1">Tomorrow</button>
            <button type="button" class="quick-date-btn" data-days="7">Next Week</button>
        </div>
    `;
    
    // Add CSS for quick options
    const style = document.createElement('style');
    style.textContent = `
        .quick-date-options {
            margin-top: 8px;
            padding: 8px 0;
        }
        .quick-options-label {
            font-size: 0.8rem;
            color: var(--ai-text-color);
            margin-bottom: 5px;
        }
        .quick-date-buttons {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
        }
        .quick-date-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: var(--text-color);
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .quick-date-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
        }
    `;
    
    if (!document.head.querySelector('style[data-quick-dates]')) {
        style.setAttribute('data-quick-dates', 'true');
        document.head.appendChild(style);
    }
    
    dateGroup.appendChild(quickOptions);
    
    // Add event listeners for quick date buttons
    quickOptions.querySelectorAll('.quick-date-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const days = parseInt(btn.dataset.days);
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + days);
            const dateString = targetDate.toISOString().split('T')[0];
            
            dateInput.value = dateString;
            validateDateInput(dateInput);
            updateDateHelperText(dateInput);
            
            showEnhancedNotification(`Date set to ${btn.textContent.toLowerCase()}!`, 'success', 2000);
        });
    });
}

function updateDateHelperText(dateInput) {
    const helperText = document.getElementById('dateHelperText');
    if (!helperText || !dateInput.value) return;
    
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    const diffTime = selectedDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        helperText.textContent = "Today - You've got this! 💪";
    } else if (diffDays === 1) {
        helperText.textContent = "Tomorrow - Good planning ahead! 📅";
    } else if (diffDays > 1 && diffDays <= 7) {
        helperText.textContent = `In ${diffDays} days - Great advance planning! 🗓️`;
    } else if (diffDays > 7) {
        helperText.textContent = "Future date - Long-term planning! 📆";
    } else {
        helperText.textContent = "Past date - Consider rescheduling 📅";
    }
}

function updateTimeHelperText(timeInput) {
    const helperText = document.getElementById('timeHelperText');
    if (!helperText || !timeInput.value) return;
    
    const time = timeInput.value;
    const hour = parseInt(time.split(':')[0]);
    
    if (hour >= 6 && hour < 12) {
        helperText.textContent = "Morning task - Start your day productive! 🌅";
    } else if (hour >= 12 && hour < 17) {
        helperText.textContent = "Afternoon task - Peak productivity time! ☀️";
    } else if (hour >= 17 && hour < 21) {
        helperText.textContent = "Evening task - Wind down with purpose! 🌆";
    } else {
        helperText.textContent = "Late hours - Make sure you're rested! 🌙";
    }
}

function updateDurationHelperText(durationInput) {
    const duration = parseInt(durationInput.value);
    const helperText = durationInput.parentElement.querySelector('.help-text span');
    
    if (!helperText) return;
    
    if (duration <= 15) {
        helperText.textContent = "Quick task - Perfect for small wins! ⚡";
    } else if (duration <= 30) {
        helperText.textContent = "Short task - Easy to fit into your schedule! 🎯";
    } else if (duration <= 60) {
        helperText.textContent = "Standard task - Good focused work session! 📚";
    } else if (duration <= 120) {
        helperText.textContent = "Long task - Consider breaking into smaller parts! 🔄";
    } else {
        helperText.textContent = "Extended task - Plan breaks and stay hydrated! 💧";
    }
}

// Date validation functions
function validateDateInput(dateInput) {
    if (!dateInput || !dateInput.value) return;
    
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time to start of day for comparison
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    if (selectedDate < yesterday) {
        showEnhancedNotification('⚠️ Selected date is in the past. Consider choosing today or a future date.', 'warning', 4000);
        dateInput.style.borderColor = '#F59E0B';
        
        setTimeout(() => {
            dateInput.style.borderColor = '';
        }, 3000);
    } else if (selectedDate.getTime() === today.getTime()) {
        showEnhancedNotification('📅 Great! Task scheduled for today.', 'info', 2000);
    } else {
        // Future date
        const daysDiff = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
            showEnhancedNotification('📅 Task scheduled for tomorrow.', 'info', 2000);
        } else if (daysDiff <= 7) {
            showEnhancedNotification(`📅 Task scheduled for ${daysDiff} days from now.`, 'info', 2000);
        } else {
            showEnhancedNotification('📅 Task scheduled for future date.', 'info', 2000);
        }
    }
}

function validateTimeInput(timeInput, dateInput) {
    if (!timeInput || !timeInput.value || !dateInput || !dateInput.value) return;
    
    const selectedDateTime = new Date(dateInput.value + ' ' + timeInput.value);
    const now = new Date();
    
    if (selectedDateTime < now) {
        const today = new Date().toISOString().split('T')[0];
        if (dateInput.value === today) {
            showEnhancedNotification('⏰ Selected time is in the past. Consider a future time.', 'warning', 3000);
            timeInput.style.borderColor = '#F59E0B';
            
            setTimeout(() => {
                timeInput.style.borderColor = '';
            }, 3000);
        }
    }
}

// Enhanced notification system
function showEnhancedNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notificationContainer') || document.body;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Add icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    notification.innerHTML = `
        ${icon}
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('notification-exit');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, duration);
}

// Format priority function
function formatPriority(priority) {
    if (!priority) return '2'; // Default to medium
    
    // Handle both string and number inputs
    const priorityValue = priority.toString();
    
    // Map different formats to consistent values
    switch (priorityValue.toLowerCase()) {
        case 'high':
        case '3':
        case 'urgent':
            return '3';
        case 'low':
        case '1':
        case 'minor':
            return '1';
        case 'medium':
        case '2':
        case 'normal':
        default:
            return '2';
    }
}

// Additional utility functions for task management
function getPriorityText(priority) {
    switch (String(priority)) {
        case "1":
        case "Low": 
            return "🟢 Low";
        case "2":
        case "Medium": 
            return "🟡 Medium";
        case "3":
        case "High": 
            return "🔴 High";
        default: 
            return "🟡 Medium";
    }
}

function getPriorityColor(priority) {
    switch (String(priority)) {
        case "1":
        case "Low": 
            return "#10B981"; // Green
        case "2":
        case "Medium": 
            return "#F59E0B"; // Yellow
        case "3":
        case "High": 
            return "#EF4444"; // Red
        default: 
            return "#F59E0B"; // Default yellow
    }
}

function getMilestoneText(milestone) {
    if (!milestone || milestone === '') return '';
    
    const milestoneMap = {
        'exam-prep': '📚 Exam Preparation',
        'assignment': '📝 Assignment',
        'project': '🚀 Project',
        'research': '🔍 Research',
        'review': '📖 Review/Study',
        'practice': '💪 Practice',
        'presentation': '🎤 Presentation',
        'reading': '📄 Reading',
        'lab-work': '🧪 Lab Work',
        'group-study': '👥 Group Study',
        'skill-building': '🎯 Skill Building',
        'other': '✨ Other'
    };
    
    return milestoneMap[milestone] || milestone;
}

function generateTaskId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `task_${timestamp}_${random}`;
}

function formatEffort(level) {
    if (typeof level === 'string' && level.includes('😌')) {
        return level; // Already formatted
    }
    
    switch (String(level)) {
        case "1": return "😌 Very Easy";
        case "2": return "🙂 Easy";
        case "3": return "😐 Moderate";
        case "4": return "😰 Hard";
        case "5": return "💀 Very Hard";
        default: return "😐 Moderate";
    }
}

function initializeModernFeatures() {
    // Initialize task templates
    initializeTaskTemplates();
    
    // Initialize advanced UI features
    initializeAdvancedUI();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Initialize tooltips and help system
    initializeHelpSystem();
}

function initializeAdvancedUI() {
    // Initialize filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            filterTasks(filter);
        });
    });
    
    // Initialize sort dropdown
    const sortSelect = document.getElementById('sortTasks');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const sortBy = sortSelect.value;
            sortTasks(sortBy);
        });
    }
    
    // Initialize panel toggles
    const toggleButtons = document.querySelectorAll('.panel-toggle-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const panelContent = btn.closest('.create-task-panel, .milestone-management-panel')
                                   .querySelector('.panel-content');
            const icon = btn.querySelector('i');
            
            if (panelContent) {
                panelContent.style.display = panelContent.style.display === 'none' ? 'block' : 'none';
                icon.style.transform = panelContent.style.display === 'none' ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
    });
}

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+N: Focus on new task input
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            const taskNameInput = document.getElementById('task-name');
            if (taskNameInput) {
                taskNameInput.focus();
                showEnhancedNotification('Ready to create a new task!', 'info', 2000);
            }
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => {
                if (modal.style.display !== 'none') {
                    modal.style.display = 'none';
                }
            });
        }
    });
}

function initializeHelpSystem() {
    // Initialize tooltips for help icons
    const helpIcons = document.querySelectorAll('.field-help');
    helpIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            const tooltip = icon.getAttribute('title');
            if (tooltip) {
                showEnhancedNotification(tooltip, 'info', 3000);
            }
        });
    });
}

function filterTasks(filter) {
    const taskItems = document.querySelectorAll('.task-item:not(.sample-task)');
    
    taskItems.forEach(item => {
        const task = tasks.find(t => t.id === item.dataset.taskId);
        if (!task) return;
        
        let show = true;
        
        switch (filter) {
            case 'completed':
                show = task.completed === true;
                break;
            case 'pending':
                show = task.completed !== true;
                break;
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                show = task.date === today;
                break;
            case 'all':
            default:
                show = true;
                break;
        }
        
        item.style.display = show ? 'block' : 'none';
    });
}

function sortTasks(sortBy) {
    const tasksList = document.querySelector('.tasks-list');
    const taskItems = Array.from(tasksList.querySelectorAll('.task-item:not(.sample-task)'));
    
    taskItems.sort((a, b) => {
        const taskA = tasks.find(t => t.id === a.dataset.taskId);
        const taskB = tasks.find(t => t.id === b.dataset.taskId);
        
        if (!taskA || !taskB) return 0;
        
        switch (sortBy) {
            case 'priority':
                return (taskB.priority || 2) - (taskA.priority || 2);
            case 'name':
                return (taskA.name || '').localeCompare(taskB.name || '');
            case 'duration':
                return (taskA.duration || 0) - (taskB.duration || 0);
            case 'date':
            default:
                const dateA = new Date(taskA.date + ' ' + taskA.time);
                const dateB = new Date(taskB.date + ' ' + taskB.time);
                return dateA - dateB;
        }
    });
    
    // Re-append sorted items
    taskItems.forEach(item => tasksList.appendChild(item));
}

function formatTaskDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) {
        return 'No date set';
    }
    
    try {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        let dateText;
        if (date.toDateString() === today.toDateString()) {
            dateText = "Today";
        } else if (date.toDateString() === tomorrow.toDateString()) {
            dateText = "Tomorrow";
        } else {
            dateText = formatDate(dateStr);
        }
        
        // Format time to 12-hour format
        const time = new Date(`2000-01-01 ${timeStr}`);
        const timeText = time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        return `${dateText}, ${timeText}`;
    } catch (error) {
        console.warn('Error formatting date/time:', error);
        return `${dateStr} ${timeStr}`;
    }
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateStr;
    }
}

function calculateRemainingTime(dateStr, timeStr, duration) {
    if (!dateStr || !timeStr) return '';
    
    try {
        const taskStart = new Date(dateStr + ' ' + timeStr);
        const taskEnd = new Date(taskStart.getTime() + (parseInt(duration || 0) * 60000));
        const now = new Date();
        
        if (now > taskEnd) {
            return '<span style="color: #EF4444;">⏰ Overdue</span>';
        } else if (now > taskStart) {
            return '<span style="color: #F59E0B;">🔄 In Progress</span>';
        } else {
            const timeDiff = taskStart - now;
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 24) {
                const days = Math.floor(hours / 24);
                return `<span style="color: #6B7280;">📅 In ${days} day${days > 1 ? 's' : ''}</span>`;
            } else if (hours > 0) {
                return `<span style="color: #8B5CF6;">⏰ In ${hours}h ${minutes}m</span>`;
            } else {
                return `<span style="color: #F59E0B;">⚡ In ${minutes} min</span>`;
            }
        }
    } catch (error) {
        console.warn('Error calculating remaining time:', error);
        return '';
    }
}

function initializeTaskTemplates() {
    // Add template buttons to the form if they don't exist
    const formSection = document.querySelector('.form-section');
    if (!formSection || formSection.querySelector('.template-section')) {
        return; // Already initialized or form not found
    }
    
    const templateSection = document.createElement('div');
    templateSection.className = 'template-section';
    templateSection.innerHTML = `
        <h4 style="color: var(--ai-text-color); margin-bottom: 10px;">Quick Templates:</h4>
        <div class="template-buttons">
            ${Object.entries(taskTemplates).map(([key, template]) => `
                <button type="button" class="template-btn" data-template="${key}">
                    ${template.name}
                </button>
            `).join('')}
        </div>
    `;
    
    // Add CSS for template buttons if not already added
    if (!document.head.querySelector('style[data-template-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-template-styles', 'true');
        style.textContent = `
            .template-section {
                margin: 15px 0;
                padding: 15px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .template-buttons {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            .template-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: var(--text-color);
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .template-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
        `;
        document.head.appendChild(style);
    }
    
    formSection.appendChild(templateSection);
    
    // Add event listeners for template buttons
    templateSection.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const templateKey = btn.dataset.template;
            const template = taskTemplates[templateKey];
            
            // Fill form with template data
            const taskNameInput = document.getElementById('task-name');
            const taskDescInput = document.getElementById('task-description');
            const taskDurationInput = document.getElementById('task-duration');
            const taskPriorityInput = document.getElementById('task-priority');
            
            if (taskNameInput) taskNameInput.value = template.name;
            if (taskDescInput) taskDescInput.value = template.description;
            if (taskDurationInput) taskDurationInput.value = template.duration;
            if (taskPriorityInput) taskPriorityInput.value = template.priority;
            
            showEnhancedNotification(`Template "${template.name}" applied!`, 'success', 2000);
        });
    });
}