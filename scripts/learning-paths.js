class LearningPathsManager {
    constructor() {
        this.learningPaths = [];
        this.currentLearningPath = null;
        this.nextPathId = 1;
        this.nextModuleId = 1;
    }

    init() {
        this.loadLearningPaths();
        this.setupEventListeners();
        this.setupPanelTabs();
        this.renderLearningPaths();
        this.updateLearningStats();
        console.log('Learning Paths Manager initialized successfully');
    }

    setupEventListeners() {
        // Template cards
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const template = e.currentTarget.dataset.template;
                this.openCreateLearningPathModal(template);
            });
        });

        // Create learning path button
        const createBtn = document.getElementById('create-learning-path');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateLearningPathModal());
        }

        // Refresh learning paths button
        const refreshBtn = document.getElementById('refresh-learning-paths');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadLearningPaths();
                this.showNotification('Learning paths refreshed!', 'info');
            });
        }

        // Learning path form
        const learningPathForm = document.getElementById('learning-path-form');
        if (learningPathForm) {
            learningPathForm.addEventListener('submit', (e) => this.handleCreateLearningPath(e));
        }

        // Learning module form
        const moduleForm = document.getElementById('learning-module-form');
        if (moduleForm) {
            moduleForm.addEventListener('submit', (e) => this.handleCreateModule(e));
        }

        // Template selection change
        const templateSelect = document.getElementById('learning-path-template');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => this.handleTemplateChange(e.target.value));
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) modal.style.display = 'none';
            });
        });

        // Cancel buttons
        const cancelButtons = ['cancel-learning-path', 'cancel-learning-module'];
        cancelButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    const modal = btn.closest('.modal-overlay');
                    if (modal) modal.style.display = 'none';
                });
            }
        });
    }

    setupPanelTabs() {
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.panelTab;
                const panel = e.target.closest('.panel-container');
                this.switchPanelTab(panel, tabName);
            });
        });
    }

    switchPanelTab(panel, tabName) {
        // Remove active class from all tabs in this panel
        panel.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Hide all panel content in this panel
        panel.querySelectorAll('.panel-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Show selected tab content
        const selectedContent = panel.querySelector(`#${tabName}-panel-content`);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }

        // Activate selected tab
        const selectedTab = panel.querySelector(`[data-panel-tab="${tabName}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Load specific content based on tab
        if (tabName === 'learning-progress') {
            this.loadProgressOverview();
        } else if (tabName === 'ai-recommendations') {
            this.loadAIRecommendations();
        }
    }

    openCreateLearningPathModal(template = '') {
        const modal = document.getElementById('create-learning-path-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            if (template) {
                const templateSelect = document.getElementById('learning-path-template');
                if (templateSelect) {
                    templateSelect.value = template;
                    this.handleTemplateChange(template);
                }
            }
        }
    }

    handleTemplateChange(template) {
        // Hide all template-specific fields
        document.querySelectorAll('.template-specific-fields').forEach(field => {
            field.style.display = 'none';
        });

        // Show selected template fields
        if (template) {
            const templateFields = document.getElementById(`${template}-fields`);
            if (templateFields) {
                templateFields.style.display = 'block';
            }
        }
    }

    handleCreateLearningPath(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const template = formData.get('template');
        
        const newLearningPath = {
            id: `learning_path_${Date.now()}`,
            title: formData.get('title'),
            description: formData.get('description'),
            template: template,
            difficulty: formData.get('difficulty'),
            duration: formData.get('duration'),
            deadline: formData.get('deadline') || null,
            progress: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            modules: [],
            templateData: this.getTemplateData(template, formData)
        };

        this.learningPaths.push(newLearningPath);
        this.saveLearningPaths();
        this.renderLearningPaths();
        this.updateLearningStats();
        
        // Close modal and reset form
        document.getElementById('create-learning-path-modal').style.display = 'none';
        e.target.reset();
        this.handleTemplateChange('');
        
        this.showNotification('Learning path created successfully! 🎉', 'success');
    }

    getTemplateData(template, formData) {
        const templateData = {};
        
        switch(template) {
            case 'program':
                templateData.language = formData.get('language');
                templateData.platform = formData.get('platform');
                break;
            case 'competition':
                templateData.competitionName = formData.get('competitionName');
                templateData.competitionDate = formData.get('competitionDate');
                break;
            case 'education':
                templateData.subject = formData.get('subject');
                templateData.educationLevel = formData.get('educationLevel');
                break;
            case 'custom':
                templateData.structure = formData.get('structure');
                break;
        }
        
        return templateData;
    }

    renderLearningPaths() {
        const container = document.getElementById('learning-paths-list');
        if (!container) return;

        if (this.learningPaths.length === 0) {
            container.innerHTML = this.getLearningEmptyState();
            return;
        }

        container.innerHTML = this.learningPaths.map(path => this.renderLearningPathItem(path)).join('');
    }

    renderLearningPathItem(path) {
        const completedModules = path.modules.filter(m => m.completed).length;
        const totalModules = path.modules.length;
        const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        return `
            <div class="learning-path-item" data-path-id="${path.id}">
                <div class="learning-path-header">
                    <div class="learning-path-info">
                        <h4>${path.title}</h4>
                        <div class="learning-path-meta">
                            <span class="learning-path-tag template-${path.template}">${this.getTemplateLabel(path.template)}</span>
                            <span class="learning-path-tag difficulty-${path.difficulty}">${path.difficulty}</span>
                            ${path.duration ? `<span class="learning-path-tag">⏱️ ${path.duration}</span>` : ''}
                        </div>
                        <p>${path.description || 'No description provided'}</p>
                    </div>
                    <div class="learning-path-actions">
                        <button class="learning-action-btn" onclick="learningPathsManager.openLearningPathDetails('${path.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="learning-action-btn" onclick="learningPathsManager.editLearningPath('${path.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="learning-action-btn danger" onclick="learningPathsManager.deleteLearningPath('${path.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="learning-path-progress">
                    <div class="learning-progress-bar">
                        <div class="learning-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="learning-progress-text">
                        <span>${progress}% complete</span>
                        <span>${completedModules}/${totalModules} modules</span>
                    </div>
                </div>

                ${path.modules.length > 0 ? `
                    <div class="learning-modules">
                        ${path.modules.slice(0, 3).map(module => this.renderLearningModule(module, path.id)).join('')}
                        ${path.modules.length > 3 ? `<p class="more-modules">+${path.modules.length - 3} more modules</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderLearningModule(module, pathId) {
        return `
            <div class="learning-module" data-module-id="${module.id}">
                <div class="module-checkbox ${module.completed ? 'completed' : ''}" 
                     onclick="learningPathsManager.toggleModule('${pathId}', '${module.id}')">
                    ${module.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="module-content">
                    <div class="module-title ${module.completed ? 'completed' : ''}">${module.title}</div>
                    <div class="module-meta">
                        <span class="module-type">${module.type}</span>
                        ${module.duration ? `<span>⏱️ ${module.duration}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getTemplateLabel(template) {
        const labels = {
            'program': '💻 Programming',
            'competition': '🏆 Competition',
            'education': '🎓 Education',
            'custom': '⚙️ Custom'
        };
        return labels[template] || template;
    }

    openLearningPathDetails(pathId) {
        const path = this.learningPaths.find(p => p.id === pathId);
        if (!path) return;

        this.currentLearningPath = path;
        this.populateLearningPathDetailsModal(path);
        
        const modal = document.getElementById('learning-path-details-modal');
        if (modal) modal.style.display = 'flex';
    }

    populateLearningPathDetailsModal(path) {
        document.getElementById('learning-path-details-title').textContent = path.title;
        
        const content = document.getElementById('learning-path-details-content');
        content.innerHTML = `
            <div class="learning-path-details">
                <div class="details-section">
                    <h4>Overview</h4>
                    <p><strong>Description:</strong> ${path.description || 'No description'}</p>
                    <p><strong>Template:</strong> ${this.getTemplateLabel(path.template)}</p>
                    <p><strong>Difficulty:</strong> ${path.difficulty}</p>
                    <p><strong>Duration:</strong> ${path.duration || 'Not specified'}</p>
                    <p><strong>Status:</strong> ${path.status}</p>
                    ${path.deadline ? `<p><strong>Deadline:</strong> ${new Date(path.deadline).toLocaleDateString()}</p>` : ''}
                </div>
                
                ${Object.keys(path.templateData).length > 0 ? `
                    <div class="details-section">
                        <h4>Template Specific Information</h4>
                        ${this.renderTemplateData(path.template, path.templateData)}
                    </div>
                ` : ''}
                
                <div class="details-section">
                    <div class="section-header">
                        <h4>Learning Modules (${path.modules.length})</h4>
                        <button class="btn-primary" onclick="learningPathsManager.openAddModuleModal()">
                            <i class="fas fa-plus"></i> Add Module
                        </button>
                    </div>
                    <div class="modules-list">
                        ${path.modules.length > 0 ? 
                            path.modules.map(module => this.renderDetailedModule(module, path.id)).join('') :
                            '<p class="no-modules">No modules added yet. Add your first module to start learning!</p>'
                        }
                    </div>
                </div>
            </div>
        `;

        // Setup action buttons
        document.getElementById('edit-learning-path-btn').onclick = () => this.editLearningPath(path.id);
        document.getElementById('add-learning-module-btn').onclick = () => this.openAddModuleModal();
        document.getElementById('delete-learning-path-btn').onclick = () => this.deleteLearningPath(path.id);
    }

    renderTemplateData(template, data) {
        switch(template) {
            case 'program':
                return `
                    <p><strong>Programming Language:</strong> ${data.language || 'Not specified'}</p>
                    <p><strong>Platform/Course:</strong> ${data.platform || 'Not specified'}</p>
                `;
            case 'competition':
                return `
                    <p><strong>Competition:</strong> ${data.competitionName || 'Not specified'}</p>
                    <p><strong>Competition Date:</strong> ${data.competitionDate ? new Date(data.competitionDate).toLocaleDateString() : 'Not specified'}</p>
                `;
            case 'education':
                return `
                    <p><strong>Subject:</strong> ${data.subject || 'Not specified'}</p>
                    <p><strong>Education Level:</strong> ${data.educationLevel || 'Not specified'}</p>
                `;
            case 'custom':
                return `
                    <p><strong>Learning Structure:</strong> ${data.structure || 'Not specified'}</p>
                `;
            default:
                return '<p>No additional information</p>';
        }
    }

    renderDetailedModule(module, pathId) {
        return `
            <div class="detailed-module" data-module-id="${module.id}">
                <div class="module-header">
                    <div class="module-checkbox ${module.completed ? 'completed' : ''}" 
                         onclick="learningPathsManager.toggleModule('${pathId}', '${module.id}')">
                        ${module.completed ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="module-info">
                        <h5 class="module-title ${module.completed ? 'completed' : ''}">${module.title}</h5>
                        <div class="module-meta">
                            <span class="module-type">${module.type}</span>
                            ${module.duration ? `<span>⏱️ ${module.duration}</span>` : ''}
                            ${module.completed ? `<span class="completed-date">✅ Completed ${new Date(module.completedAt).toLocaleDateString()}</span>` : ''}
                        </div>
                    </div>
                    <div class="module-actions">
                        <button class="learning-action-btn" onclick="learningPathsManager.editModule('${pathId}', '${module.id}')" title="Edit Module">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="learning-action-btn danger" onclick="learningPathsManager.deleteModule('${pathId}', '${module.id}')" title="Delete Module">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${module.description ? `<p class="module-description">${module.description}</p>` : ''}
                ${module.resources ? `<div class="module-resources"><strong>Resources:</strong> ${module.resources}</div>` : ''}
                ${module.notes ? `<div class="module-notes"><strong>Notes:</strong> ${module.notes}</div>` : ''}
            </div>
        `;
    }

    openAddModuleModal() {
        const modal = document.getElementById('add-learning-module-modal');
        if (modal) modal.style.display = 'flex';
    }

    handleCreateModule(e) {
        e.preventDefault();
        
        if (!this.currentLearningPath) return;
        
        const formData = new FormData(e.target);
        const newModule = {
            id: `module_${Date.now()}`,
            title: formData.get('title'),
            description: formData.get('description'),
            type: formData.get('type'),
            duration: formData.get('duration'),
            resources: formData.get('resources'),
            notes: formData.get('notes'),
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString()
        };

        this.currentLearningPath.modules.push(newModule);
        this.currentLearningPath.updatedAt = new Date().toISOString();
        
        this.saveLearningPaths();
        this.populateLearningPathDetailsModal(this.currentLearningPath);
        this.renderLearningPaths();
        this.updateLearningStats();
        
        // Close modal and reset form
        document.getElementById('add-learning-module-modal').style.display = 'none';
        e.target.reset();
        
        this.showNotification('Module added successfully! 📚', 'success');
    }

    toggleModule(pathId, moduleId) {
        const path = this.learningPaths.find(p => p.id === pathId);
        if (!path) return;

        const module = path.modules.find(m => m.id === moduleId);
        if (!module) return;

        module.completed = !module.completed;
        module.completedAt = module.completed ? new Date().toISOString() : null;
        path.updatedAt = new Date().toISOString();

        this.saveLearningPaths();
        this.renderLearningPaths();
        this.updateLearningStats();

        if (this.currentLearningPath && this.currentLearningPath.id === pathId) {
            this.populateLearningPathDetailsModal(path);
        }

        if (module.completed) {
            this.showNotification('Module completed! 🎉', 'success');
        }
    }

    editLearningPath(pathId) {
        this.showNotification('Edit functionality coming soon!', 'info');
    }

    editModule(pathId, moduleId) {
        this.showNotification('Edit module functionality coming soon!', 'info');
    }

    deleteLearningPath(pathId) {
        if (confirm('Are you sure you want to delete this learning path? This action cannot be undone.')) {
            this.learningPaths = this.learningPaths.filter(p => p.id !== pathId);
            this.saveLearningPaths();
            this.renderLearningPaths();
            this.updateLearningStats();
            
            // Close details modal if open
            const detailsModal = document.getElementById('learning-path-details-modal');
            if (detailsModal) detailsModal.style.display = 'none';
            
            this.showNotification('Learning path deleted successfully!', 'success');
        }
    }

    deleteModule(pathId, moduleId) {
        if (confirm('Are you sure you want to delete this module?')) {
            const path = this.learningPaths.find(p => p.id === pathId);
            if (path) {
                path.modules = path.modules.filter(m => m.id !== moduleId);
                path.updatedAt = new Date().toISOString();
                
                this.saveLearningPaths();
                this.populateLearningPathDetailsModal(path);
                this.renderLearningPaths();
                this.updateLearningStats();
                
                this.showNotification('Module deleted successfully!', 'success');
            }
        }
    }

    updateLearningStats() {
        const totalPaths = this.learningPaths.length;
        const completedPaths = this.learningPaths.filter(p => {
            const totalModules = p.modules.length;
            const completedModules = p.modules.filter(m => m.completed).length;
            return totalModules > 0 && completedModules === totalModules;
        }).length;

        let totalProgress = 0;
        if (totalPaths > 0) {
            totalProgress = Math.round(this.learningPaths.reduce((sum, path) => {
                const pathProgress = path.modules.length > 0 ? 
                    (path.modules.filter(m => m.completed).length / path.modules.length) * 100 : 0;
                return sum + pathProgress;
            }, 0) / totalPaths);
        }

        const totalPathsElement = document.getElementById('total-learning-paths');
        const learningProgressElement = document.getElementById('learning-progress');
        const completedCoursesElement = document.getElementById('completed-courses');

        if (totalPathsElement) totalPathsElement.textContent = totalPaths;
        if (learningProgressElement) learningProgressElement.textContent = `${totalProgress}%`;
        if (completedCoursesElement) completedCoursesElement.textContent = completedPaths;
    }

    loadProgressOverview() {
        const container = document.getElementById('progress-overview');
        if (!container) return;

        container.innerHTML = `
            <div class="progress-section">
                <h4><i class="fas fa-chart-line"></i> Overall Progress</h4>
                <div class="progress-chart">
                    Progress visualization coming soon!
                </div>
            </div>
            
            <div class="progress-section">
                <h4><i class="fas fa-calendar-week"></i> This Week's Activity</h4>
                <div class="progress-chart">
                    Weekly activity tracking coming soon!
                </div>
            </div>
            
            <div class="progress-section">
                <h4><i class="fas fa-trophy"></i> Achievements</h4>
                <div class="progress-chart">
                    Learning achievements coming soon!
                </div>
            </div>
        `;
    }

    loadAIRecommendations() {
        // This will be implemented when AI integration is added
        console.log('AI recommendations tab loaded');
    }

    getLearningEmptyState() {
        return `
            <div class="learning-empty-state">
                <i class="fas fa-graduation-cap"></i>
                <h4>No Learning Paths Yet</h4>
                <p>Start your learning journey by creating your first learning path. Choose from our templates or create a custom one.</p>
                <button class="learning-empty-action" onclick="learningPathsManager.openCreateLearningPathModal()">
                    Create Your First Learning Path
                </button>
            </div>
        `;
    }

    loadLearningPaths() {
        try {
            const savedPaths = localStorage.getItem('userLearningPaths');
            this.learningPaths = savedPaths ? JSON.parse(savedPaths) : [];
        } catch (error) {
            console.error('Error loading learning paths:', error);
            this.learningPaths = [];
        }
    }

    saveLearningPaths() {
        try {
            localStorage.setItem('userLearningPaths', JSON.stringify(this.learningPaths));
        } catch (error) {
            console.error('Error saving learning paths:', error);
        }
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

// Initialize the learning paths manager
let learningPathsManager;
document.addEventListener('DOMContentLoaded', () => {
    learningPathsManager = new LearningPathsManager();
    learningPathsManager.init();
});
