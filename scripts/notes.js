// Notes & Ideas Management System

class NotesManager {
    constructor() {
        this.notes = this.loadNotes();
        this.currentFilter = 'all';
        this.currentView = 'grid';
        this.currentSort = 'modified';
        this.searchQuery = '';
        this.editingNoteId = null;
        this.tags = new Set();
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadTags();
        this.updateStatistics();
        this.renderNotes();
    }

    initializeElements() {
        // Buttons
        this.createNoteBtn = document.getElementById('createNoteBtn');
        this.createIdeaBtn = document.getElementById('createIdeaBtn');
        this.createFirstNote = document.getElementById('createFirstNote');
        
        // Search and filters
        this.searchInput = document.getElementById('searchNotes');
        this.filterTabs = document.querySelectorAll('.filter-tab');
        this.viewToggles = document.querySelectorAll('.view-toggle');
        this.sortSelect = document.getElementById('sortBy');
        
        // Containers
        this.notesGrid = document.getElementById('notesGrid');
        this.emptyState = document.getElementById('emptyState');
        
        // Modals
        this.noteModal = document.getElementById('noteModal');
        this.noteViewModal = document.getElementById('noteViewModal');
        this.closeModal = document.getElementById('closeModal');
        this.closeViewModal = document.getElementById('closeViewModal');
        
        // Form elements
        this.noteForm = document.getElementById('noteForm');
        this.modalTitle = document.getElementById('modalTitle');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteContent = document.getElementById('noteContent');
        this.tagInput = document.getElementById('tagInput');
        this.tagsList = document.getElementById('tagsList');
        this.isFavorite = document.getElementById('isFavorite');
        this.isPrivate = document.getElementById('isPrivate');
        
        // Task connection elements
        this.taskSelector = document.getElementById('taskSelector');
        this.taskConnectionInfo = document.getElementById('taskConnectionInfo');
        this.disconnectTaskBtn = document.getElementById('disconnectTaskBtn');
        this.connectedTaskName = document.getElementById('connectedTaskName');
        this.saveNote = document.getElementById('saveNote');
        this.cancelNote = document.getElementById('cancelNote');
        
        // Image upload elements
        this.imageUploadBtn = document.getElementById('imageUploadBtn');
        this.imageUploadSection = document.getElementById('imageUploadSection');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.removeImageBtn = document.getElementById('removeImageBtn');
        
        // Note type radios
        this.noteTypeRadios = document.querySelectorAll('input[name="noteType"]');
        
        // Editor toolbar
        this.editorButtons = document.querySelectorAll('.editor-btn');
        
        // View modal elements
        this.viewNoteTitle = document.getElementById('viewNoteTitle');
        this.viewNoteType = document.getElementById('viewNoteType');
        this.viewNoteDate = document.getElementById('viewNoteDate');
        this.viewNoteContent = document.getElementById('viewNoteContent');
        this.viewNoteTags = document.getElementById('viewNoteTags');
        
        // View modal actions
        this.editNoteBtn = document.getElementById('editNoteBtn');
        this.favoriteNoteBtn = document.getElementById('favoriteNoteBtn');
        this.shareNoteBtn = document.getElementById('shareNoteBtn');
        this.deleteNoteBtn = document.getElementById('deleteNoteBtn');
    }

    attachEventListeners() {
        // Create note buttons
        this.createNoteBtn?.addEventListener('click', () => this.openNoteModal('note'));
        this.createIdeaBtn?.addEventListener('click', () => this.openNoteModal('idea'));
        this.createFirstNote?.addEventListener('click', () => this.openNoteModal('note'));
        
        // Search
        this.searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderNotes();
        });
        
        // Filters
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => this.setFilter(tab.dataset.filter));
        });
        
        // View toggles
        this.viewToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.setView(toggle.dataset.view));
        });
        
        // Sort
        this.sortSelect?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderNotes();
        });
        
        // Modal controls
        this.closeModal?.addEventListener('click', () => this.closeNoteModal());
        this.closeViewModal?.addEventListener('click', () => this.closeViewNoteModal());
        this.cancelNote?.addEventListener('click', () => this.closeNoteModal());
        this.saveNote?.addEventListener('click', () => this.saveCurrentNote());
        
        // Form submission
        this.noteForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCurrentNote();
        });
        
        // Tag input
        this.tagInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag();
            }
        });
        
        // Image upload functionality
        this.imageUploadBtn?.addEventListener('click', () => this.toggleImageUploadSection());
        this.imageInput?.addEventListener('change', (e) => this.handleImageUpload(e));
        this.removeImageBtn?.addEventListener('click', () => this.removeImage());
        
        // Task connection functionality
        this.taskSelector?.addEventListener('change', (e) => this.handleTaskConnection(e));
        this.disconnectTaskBtn?.addEventListener('click', () => this.disconnectTask());
        
        // Editor toolbar
        this.editorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.executeEditorCommand(btn.dataset.action);
            });
        });
        
        // View modal actions
        this.editNoteBtn?.addEventListener('click', () => this.editCurrentNote());
        this.favoriteNoteBtn?.addEventListener('click', () => this.toggleCurrentNoteFavorite());
        this.shareNoteBtn?.addEventListener('click', () => this.shareCurrentNote());
        this.deleteNoteBtn?.addEventListener('click', () => this.deleteCurrentNote());
        
        // Close modals on backdrop click
        this.noteModal?.addEventListener('click', (e) => {
            if (e.target === this.noteModal) this.closeNoteModal();
        });
        
        this.noteViewModal?.addEventListener('click', (e) => {
            if (e.target === this.noteViewModal) this.closeViewNoteModal();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openNoteModal('note');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.openNoteModal('idea');
                        break;
                    case 's':
                        if (this.noteModal.classList.contains('active')) {
                            e.preventDefault();
                            this.saveCurrentNote();
                        }
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                if (this.noteModal.classList.contains('active')) {
                    this.closeNoteModal();
                } else if (this.noteViewModal.classList.contains('active')) {
                    this.closeViewNoteModal();
                }
            }
        });
    }

    // ===== DATA MANAGEMENT =====

    loadNotes() {
        try {
            const stored = localStorage.getItem('notes');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading notes:', error);
            return [];
        }
    }

    saveNotes() {
        try {
            localStorage.setItem('notes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving notes:', error);
            this.showNotification('Failed to save notes', 'error');
        }
    }

    loadTags() {
        this.tags.clear();
        this.notes.forEach(note => {
            if (note.tags) {
                note.tags.forEach(tag => this.tags.add(tag));
            }
        });
    }

    generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ===== NOTE CRUD OPERATIONS =====

    createNote(noteData) {
        const note = {
            id: this.generateId(),
            title: noteData.title,
            content: noteData.content,
            type: noteData.type,
            tags: noteData.tags || [],
            isFavorite: noteData.isFavorite || false,
            isPrivate: noteData.isPrivate || false,
            isArchived: false,
            image: noteData.image || null,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.saveNotes();
        this.loadTags();
        this.renderNotes();
        this.showNotification(`${note.type === 'idea' ? 'Idea' : 'Note'} created successfully!`, 'success');
        
        return note;
    }

    updateNote(id, updates) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex === -1) return false;

        this.notes[noteIndex] = {
            ...this.notes[noteIndex],
            ...updates,
            modifiedAt: new Date().toISOString()
        };

        this.saveNotes();
        this.loadTags();
        this.renderNotes();
        this.showNotification('Note updated successfully!', 'success');
        
        return true;
    }

    deleteNote(id) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex === -1) return false;

        const note = this.notes[noteIndex];
        this.notes.splice(noteIndex, 1);
        this.saveNotes();
        this.loadTags();
        this.renderNotes();
        this.showNotification(`${note.type === 'idea' ? 'Idea' : 'Note'} deleted successfully!`, 'success');
        
        return true;
    }

    toggleFavorite(id) {
        const note = this.notes.find(note => note.id === id);
        if (!note) return false;

        note.isFavorite = !note.isFavorite;
        note.modifiedAt = new Date().toISOString();
        this.saveNotes();
        this.renderNotes();
        
        return true;
    }

    archiveNote(id) {
        const note = this.notes.find(note => note.id === id);
        if (!note) return false;

        note.isArchived = !note.isArchived;
        note.modifiedAt = new Date().toISOString();
        this.saveNotes();
        this.renderNotes();
        
        return true;
    }

    // ===== FILTERING AND SORTING =====

    getFilteredNotes() {
        let filtered = [...this.notes];

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(note => 
                note.title.toLowerCase().includes(query) ||
                note.content.toLowerCase().includes(query) ||
                (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }

        // Apply category filter
        switch (this.currentFilter) {
            case 'notes':
                filtered = filtered.filter(note => note.type === 'note');
                break;
            case 'ideas':
                filtered = filtered.filter(note => note.type === 'idea');
                break;
            case 'favorites':
                filtered = filtered.filter(note => note.isFavorite);
                break;
            case 'archived':
                filtered = filtered.filter(note => note.isArchived);
                break;
            default:
                filtered = filtered.filter(note => !note.isArchived);
        }

        // Apply sorting
        switch (this.currentSort) {
            case 'created':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'title':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'type':
                filtered.sort((a, b) => a.type.localeCompare(b.type));
                break;
            default: // modified
                filtered.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
        }

        return filtered;
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        this.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
        
        this.renderNotes();
    }

    setView(view) {
        this.currentView = view;
        
        // Update active view toggle
        this.viewToggles.forEach(toggle => {
            toggle.classList.toggle('active', toggle.dataset.view === view);
        });
        
        // Update grid class
        this.notesGrid.classList.toggle('list-view', view === 'list');
    }

    // ===== RENDERING =====

    renderNotes() {
        const filteredNotes = this.getFilteredNotes();
        
        // Update statistics
        this.updateStatistics();
        
        if (filteredNotes.length === 0) {
            this.notesGrid.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.notesGrid.style.display = 'grid';
            this.emptyState.style.display = 'none';
            
            this.notesGrid.innerHTML = filteredNotes.map(note => this.createNoteCard(note)).join('');
            
            // Attach click listeners to note cards
            this.notesGrid.querySelectorAll('.note-card').forEach(card => {
                card.addEventListener('click', () => {
                    const noteId = card.dataset.noteId;
                    this.viewNote(noteId);
                });
            });
        }
    }

    updateStatistics() {
        const totalNotes = this.notes.filter(note => note.type === 'note' && !note.isArchived).length;
        const totalIdeas = this.notes.filter(note => note.type === 'idea' && !note.isArchived).length;
        const totalFavorites = this.notes.filter(note => note.isFavorite && !note.isArchived).length;
        const totalTags = this.tags.size;

        // Update stat displays
        const totalNotesEl = document.getElementById('totalNotes');
        const totalIdeasEl = document.getElementById('totalIdeas');
        const totalFavoritesEl = document.getElementById('totalFavorites');
        const totalTagsEl = document.getElementById('totalTags');

        if (totalNotesEl) totalNotesEl.textContent = totalNotes;
        if (totalIdeasEl) totalIdeasEl.textContent = totalIdeas;
        if (totalFavoritesEl) totalFavoritesEl.textContent = totalFavorites;
        if (totalTagsEl) totalTagsEl.textContent = totalTags;
    }

    createNoteCard(note) {
        const preview = this.stripHTML(note.content).substring(0, 150) + '...';
        const formattedDate = this.formatDate(note.modifiedAt);
        
        // Check if note is connected to a task
        let taskConnection = '';
        if (note.taskId) {
            let connectedTask = null;
            if (window.modernTaskManager) {
                connectedTask = window.modernTaskManager.tasks.find(t => t.id === note.taskId);
            } else {
                const tasks = JSON.parse(localStorage.getItem('modernTasks')) || 
                            JSON.parse(localStorage.getItem('tasks')) || [];
                connectedTask = tasks.find(t => t.id === note.taskId);
            }
            
            if (connectedTask) {
                taskConnection = `
                    <div class="task-connection-badge">
                        <i class="fas fa-link"></i>
                        <span>${this.escapeHTML(connectedTask.title || connectedTask.name)}</span>
                    </div>
                `;
            }
        }
        
        return `
            <div class="note-card ${note.type} ${note.isFavorite ? 'favorite' : ''}" data-note-id="${note.id}">
                <div class="note-header">
                    <h3 class="note-title">${this.escapeHTML(note.title)}</h3>
                    <span class="note-type-badge ${note.type}">${note.type}</span>
                </div>
                ${taskConnection}
                <div class="note-preview">${this.escapeHTML(preview)}</div>
                <div class="note-footer">
                    <span class="note-date">${formattedDate}</span>
                    <div class="note-tags">
                        ${note.tags ? note.tags.slice(0, 3).map(tag => `<span class="note-tag">${this.escapeHTML(tag)}</span>`).join('') : ''}
                        ${note.tags && note.tags.length > 3 ? `<span class="note-tag">+${note.tags.length - 3}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ===== MODAL MANAGEMENT =====

    openNoteModal(type = 'note') {
        this.editingNoteId = null;
        this.resetForm();
        
        // Set note type
        const typeRadio = document.querySelector(`input[name="noteType"][value="${type}"]`);
        if (typeRadio) typeRadio.checked = true;
        
        // Load available tasks for connection
        this.loadTasksForConnection();
        
        this.modalTitle.textContent = type === 'idea' ? 'Create New Idea' : 'Create New Note';
        this.noteModal.classList.add('active');
        this.noteTitle.focus();
    }

    closeNoteModal() {
        this.noteModal.classList.remove('active');
        this.resetForm();
    }

    resetForm() {
        this.noteForm.reset();
        this.noteContent.innerHTML = '';
        this.renderTags([]);
        this.editingNoteId = null;
        
        // Reset task connection
        if (this.taskSelector) {
            this.taskSelector.value = '';
        }
        this.hideTaskConnection();
        
        // Reset image upload
        this.removeImage();
        if (this.imageUploadSection) {
            this.imageUploadSection.style.display = 'none';
        }
    }

    saveCurrentNote() {
        const title = this.noteTitle.value.trim();
        const content = this.noteContent.innerHTML;
        const type = document.querySelector('input[name="noteType"]:checked')?.value || 'note';
        
        if (!title) {
            this.showNotification('Please enter a title', 'error');
            this.noteTitle.focus();
            return;
        }

        if (!content || content === '<br>' || content === '') {
            this.showNotification('Please enter some content', 'error');
            this.noteContent.focus();
            return;
        }

        const tags = Array.from(this.tagsList.querySelectorAll('.tag-item')).map(item => 
            item.textContent.replace('×', '').trim()
        );

        // Get image data if present
        let imageData = null;
        const previewImg = this.imagePreview.querySelector('img');
        if (previewImg) {
            imageData = previewImg.src;
        }

        // Get task connection data
        let taskId = null;
        if (this.taskConnectionInfo && this.taskConnectionInfo.style.display !== 'none') {
            // Task is connected - find the task ID
            const connectedTaskName = this.connectedTaskName.textContent;
            let tasks = [];
            if (window.modernTaskManager) {
                tasks = window.modernTaskManager.tasks || [];
            } else {
                tasks = JSON.parse(localStorage.getItem('modernTasks')) || 
                       JSON.parse(localStorage.getItem('tasks')) || [];
            }
            const connectedTask = tasks.find(task => 
                (task.title || task.name) === connectedTaskName
            );
            if (connectedTask) {
                taskId = connectedTask.id;
            }
        } else if (this.taskSelector && this.taskSelector.value) {
            taskId = this.taskSelector.value;
        }

        const noteData = {
            title,
            content,
            type,
            tags,
            isFavorite: this.isFavorite.checked,
            isPrivate: this.isPrivate.checked,
            image: imageData,
            taskId: taskId
        };

        if (this.editingNoteId) {
            this.updateNote(this.editingNoteId, noteData);
        } else {
            this.createNote(noteData);
        }

        this.closeNoteModal();
    }

    // ===== NOTE VIEWING =====

    viewNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.currentViewingNote = note;
        
        // Populate view modal
        this.viewNoteTitle.textContent = note.title;
        this.viewNoteType.textContent = note.type;
        this.viewNoteType.className = `note-type-badge ${note.type}`;
        this.viewNoteDate.textContent = `Modified ${this.formatDate(note.modifiedAt)}`;
        this.viewNoteContent.innerHTML = note.content;
        
        // Render tags
        if (note.tags && note.tags.length > 0) {
            this.viewNoteTags.innerHTML = note.tags.map(tag => 
                `<span class="note-tag">${this.escapeHTML(tag)}</span>`
            ).join('');
            this.viewNoteTags.style.display = 'flex';
        } else {
            this.viewNoteTags.style.display = 'none';
        }
        
        // Update favorite button
        this.favoriteNoteBtn.classList.toggle('active', note.isFavorite);
        
        this.noteViewModal.classList.add('active');
    }

    closeViewNoteModal() {
        this.noteViewModal.classList.remove('active');
        this.currentViewingNote = null;
    }

    editCurrentNote() {
        if (!this.currentViewingNote) return;
        
        this.editingNoteId = this.currentViewingNote.id;
        const note = this.currentViewingNote;
        
        // Populate form
        this.noteTitle.value = note.title;
        this.noteContent.innerHTML = note.content;
        
        // Set note type
        const typeRadio = document.querySelector(`input[name="noteType"][value="${note.type}"]`);
        if (typeRadio) typeRadio.checked = true;
        
        // Set tags
        this.renderTags(note.tags || []);
        
        // Set options
        this.isFavorite.checked = note.isFavorite;
        this.isPrivate.checked = note.isPrivate;
        
        this.modalTitle.textContent = `Edit ${note.type === 'idea' ? 'Idea' : 'Note'}`;
        
        this.closeViewNoteModal();
        this.noteModal.classList.add('active');
        this.noteTitle.focus();
    }

    toggleCurrentNoteFavorite() {
        if (!this.currentViewingNote) return;
        
        this.toggleFavorite(this.currentViewingNote.id);
        this.currentViewingNote.isFavorite = !this.currentViewingNote.isFavorite;
        this.favoriteNoteBtn.classList.toggle('active', this.currentViewingNote.isFavorite);
    }

    shareCurrentNote() {
        if (!this.currentViewingNote) return;
        
        const note = this.currentViewingNote;
        const shareText = `${note.title}\n\n${this.stripHTML(note.content)}`;
        
        if (navigator.share) {
            navigator.share({
                title: note.title,
                text: shareText
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Note copied to clipboard!', 'success');
            }).catch(() => {
                this.showNotification('Failed to copy note', 'error');
            });
        }
    }

    deleteCurrentNote() {
        if (!this.currentViewingNote) return;
        
        const note = this.currentViewingNote;
        if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
            this.deleteNote(note.id);
            this.closeViewNoteModal();
        }
    }

    // ===== RICH EDITOR =====

    executeEditorCommand(command) {
        this.noteContent.focus();
        
        switch (command) {
            case 'bold':
            case 'italic':
            case 'underline':
            case 'insertUnorderedList':
            case 'insertOrderedList':
                document.execCommand(command, false, null);
                break;
            case 'link':
                const url = prompt('Enter URL:');
                if (url) {
                    document.execCommand('createLink', false, url);
                }
                break;
            case 'code':
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const code = document.createElement('code');
                    code.appendChild(range.extractContents());
                    range.insertNode(code);
                }
                break;
        }
        
        // Update button states
        this.updateEditorButtonStates();
    }

    updateEditorButtonStates() {
        this.editorButtons.forEach(btn => {
            const command = btn.dataset.action;
            let isActive = false;
            
            try {
                switch (command) {
                    case 'bold':
                    case 'italic':
                    case 'underline':
                    case 'insertUnorderedList':
                    case 'insertOrderedList':
                        isActive = document.queryCommandState(command);
                        break;
                }
            } catch (e) {
                // Ignore errors from queryCommandState
            }
            
            btn.classList.toggle('active', isActive);
        });
    }

    // ===== TAGS MANAGEMENT =====

    addTag() {
        const tag = this.tagInput.value.trim();
        if (!tag) return;
        
        // Get current tags
        const currentTags = Array.from(this.tagsList.querySelectorAll('.tag-item'))
            .map(item => item.textContent.replace('×', '').trim());
        
        // Check if tag already exists
        if (currentTags.includes(tag)) {
            this.tagInput.value = '';
            return;
        }
        
        // Add tag
        currentTags.push(tag);
        this.renderTags(currentTags);
        this.tagInput.value = '';
    }

    renderTags(tags) {
        this.tagsList.innerHTML = tags.map(tag => `
            <div class="tag-item">
                ${this.escapeHTML(tag)}
                <button type="button" class="tag-remove" onclick="this.parentElement.remove()">×</button>
            </div>
        `).join('');
    }

    // ===== UTILITY FUNCTIONS =====

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    stripHTML(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            font-weight: 600;
            color: white;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
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
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Image upload methods
    toggleImageUploadSection() {
        const section = this.imageUploadSection;
        if (section.style.display === 'none' || section.style.display === '') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image size must be less than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            this.showImagePreview(imageUrl);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageUrl) {
        const preview = this.imagePreview;
        preview.innerHTML = `<img src="${imageUrl}" alt="Preview">`;
        preview.classList.add('show');
        this.removeImageBtn.style.display = 'block';
    }

    removeImage() {
        this.imagePreview.innerHTML = '';
        this.imagePreview.classList.remove('show');
        this.imageInput.value = '';
        this.removeImageBtn.style.display = 'none';
    }

    // ===== TASK CONNECTION METHODS =====
    
    loadTasksForConnection() {
        if (!this.taskSelector) return;
        
        // Load tasks from modern task manager
        let tasks = [];
        if (window.modernTaskManager) {
            tasks = window.modernTaskManager.tasks || [];
        } else {
            // Fallback to localStorage
            tasks = JSON.parse(localStorage.getItem('modernTasks')) || 
                   JSON.parse(localStorage.getItem('tasks')) || [];
        }
        
        // Clear existing options
        this.taskSelector.innerHTML = '<option value="">Select a task...</option>';
        
        // Add tasks that are not completed
        const activeTasks = tasks.filter(task => task.status !== 'done' && !task.completed);
        activeTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.title || task.name;
            this.taskSelector.appendChild(option);
        });
        
        // If no active tasks, show disabled option
        if (activeTasks.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No active tasks available';
            option.disabled = true;
            this.taskSelector.appendChild(option);
        }
    }
    
    handleTaskConnection(event) {
        const taskId = event.target.value;
        if (taskId) {
            // Find task details
            let task = null;
            if (window.modernTaskManager) {
                task = window.modernTaskManager.tasks.find(t => t.id === taskId);
            } else {
                const tasks = JSON.parse(localStorage.getItem('modernTasks')) || 
                            JSON.parse(localStorage.getItem('tasks')) || [];
                task = tasks.find(t => t.id === taskId);
            }
            
            if (task) {
                this.showTaskConnection(task);
            }
        } else {
            this.hideTaskConnection();
        }
    }
    
    showTaskConnection(task) {
        if (!this.taskConnectionInfo || !this.connectedTaskName) return;
        
        this.connectedTaskName.textContent = task.title || task.name;
        this.taskConnectionInfo.style.display = 'flex';
        this.taskSelector.style.display = 'none';
    }
    
    hideTaskConnection() {
        if (!this.taskConnectionInfo) return;
        
        this.taskConnectionInfo.style.display = 'none';
        this.taskSelector.style.display = 'block';
    }
    
    disconnectTask() {
        this.taskSelector.value = '';
        this.hideTaskConnection();
    }
}

// Initialize the notes manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.notesManager = new NotesManager();
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotesManager;
}
