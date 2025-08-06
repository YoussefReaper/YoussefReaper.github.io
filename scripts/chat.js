// Chat Interface Elements
const inputField = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');
const sendBtn = document.querySelector('.send-message-button');
const chatListContainer = document.getElementById('chatListContainer');
const profileContainer = document.querySelector('.ai-profile');

// Panel Elements
const profileToggle = document.getElementById('profileToggle');
const chatHistoryBtn = document.getElementById('chatHistoryBtn');
const newChatBtn = document.getElementById('newChatBtn');
const helpBtn = document.getElementById('helpBtn');
const chatHistoryPanel = document.getElementById('chatHistoryPanel');
const panelOverlay = document.getElementById('panelOverlay');
const closeProfile = document.getElementById('closeProfile');
const closeChatHistory = document.getElementById('closeChatHistory');

// Profile Elements
const closeProfileButton = document.getElementById('close-profile-button');
const mainProfilePic = document.getElementById('mainProfilePic');
const headerAvatar = document.getElementById('headerAvatar');

// Quick Actions
const quickActionCards = document.querySelectorAll('.quick-action-card');
const quickActions = document.getElementById('quickActions');

// Sticker System State
let stickerSystemActive = false;
let userCoins = parseInt(localStorage.getItem('userCoins')) || 0;
let placedStickers = JSON.parse(localStorage.getItem('placedStickers')) || [];
let isDragging = false;
let currentDragSticker = null;
let dragOffset = { x: 0, y: 0 };

// AI State Management
let isAITyping = false;

// Maximize Mode Elements
const maximizeToggle = document.getElementById('maximizeToggle');
const maximizeExitBtn = document.getElementById('maximizeExitBtn');
const maximizeParticles = document.getElementById('maximizeParticles');
const mainContent = document.querySelector('.main-content');
const maximizeStickerPanel = document.getElementById('maximizeStickerPanel');
const maximizeStickerToggle = document.getElementById('maximizeStickerToggle');
const stickerSidebar = document.getElementById('stickerSidebar');
const stickerToggle = document.getElementById('stickerToggle');

// Maximize mode state
let isMaximizeMode = false;

// Mobile toolbar state
let isMobileToolbarVisible = true;
let mobileToolbarTimeout;

// Mobile detection function
function isMobile() {
    return window.innerWidth <= 768;
}

// Chat Data - keeping existing structure
let chats = JSON.parse(localStorage.getItem('chatList')) || [{
    id: '12345',
    name: 'The first chat',
    preview: 'Welcome to the chat!',
    timestamp: new Date().toISOString()
}, {
    id: '67890',
    name: 'The second chat',
    preview: 'Previous conversation...',
    timestamp: new Date().toISOString()
}];

// ===== BACKGROUND MANAGEMENT FOR CHAT =====
function applyChatBackground() {
    try {
        const customization = JSON.parse(localStorage.getItem('remiCustomization') || '{}');
        const chatBackground = customization.backgrounds?.chat;
        
        // Clear any existing background first
        clearChatBackground();
        
        if (chatBackground) {
            if (chatBackground.isTemporary || !chatBackground.url) {
                // Handle temporary background that needs re-upload
                console.log('Chat background was temporary and has been cleared. Please re-upload from customization page.');
                showBackgroundMessage('Background cleared - please re-upload from customization page', 'info');
                return;
            }
            
            if (!isValidBackgroundUrl(chatBackground.url)) {
                console.warn('Invalid chat background URL detected:', chatBackground.url?.substring(0, 50) + '...');
                
                // Clean up invalid background
                try {
                    const settings = JSON.parse(localStorage.getItem('remiCustomization') || '{}');
                    if (settings.backgrounds?.chat) {
                        settings.backgrounds.chat = null;
                        localStorage.setItem('remiCustomization', JSON.stringify(settings));
                        console.log('Cleaned up invalid chat background from settings');
                    }
                } catch (cleanupError) {
                    console.warn('Failed to clean up invalid background:', cleanupError);
                }
                
                showBackgroundMessage('Background was invalid and has been cleared', 'warning');
                return;
            }
            
            // Target the chat messages area specifically
            const chatMessagesWrapper = document.querySelector('.chat-messages-wrapper') ||
                                       document.querySelector('.chat-messages');
            
            if (!chatMessagesWrapper) {
                console.warn('Chat messages container not found');
                return;
            }
            
            // Apply valid background
            if (chatBackground.type === 'video') {
                applyVideoChatBackground(chatMessagesWrapper, chatBackground);
            } else if (chatBackground.type === 'image') {
                applyImageChatBackground(chatMessagesWrapper, chatBackground);
            }
        }
    } catch (error) {
        console.warn('Error applying chat background:', error);
        showBackgroundMessage('Error loading background settings', 'error');
    }
}

// Helper function to validate background URLs
function isValidBackgroundUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Check for valid data URL format
    if (url.startsWith('data:')) {
        return url.match(/^data:(image|video)\/[a-zA-Z0-9+.-]+;base64,/);
    }
    
    // Blob URLs are not valid across page navigations - reject them
    if (url.startsWith('blob:')) {
        console.warn('Blob URL detected - these are not valid across page navigations');
        return false;
    }
    
    // Check for valid HTTP/HTTPS URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    // Check for relative paths (assume valid)
    if (!url.includes('://')) {
        return true;
    }
    
    return false;
}

// Helper function to show background-related messages to user
function showBackgroundMessage(message, type = 'info') {
    // Create a subtle notification for background messages
    console.log(`Background: ${message}`);
    
    // You could add a visual notification here if desired
    // For now, just log to console to avoid cluttering the chat UI
}

// Helper function to clear existing chat background
function clearChatBackground() {
    const chatMessagesWrapper = document.querySelector('.chat-messages-wrapper') ||
                               document.querySelector('.chat-messages');
    
    if (chatMessagesWrapper) {
        // Remove video background
        const existingVideo = chatMessagesWrapper.querySelector('.live-wallpaper-video');
        if (existingVideo) {
            // Clean up object URL if it exists
            if (existingVideo.src && existingVideo.src.startsWith('blob:')) {
                URL.revokeObjectURL(existingVideo.src);
            }
            existingVideo.remove();
        }
        
        // Clear image background
        chatMessagesWrapper.style.backgroundImage = '';
        chatMessagesWrapper.style.backgroundSize = '';
        chatMessagesWrapper.style.backgroundPosition = '';
        chatMessagesWrapper.style.backgroundRepeat = '';
        chatMessagesWrapper.style.backgroundAttachment = '';
    }
}

// Helper function to apply video background
function applyVideoChatBackground(container, backgroundData) {
    const video = document.createElement('video');
    video.className = 'live-wallpaper-video';
    video.src = backgroundData.url;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    video.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        z-index: -1 !important;
        pointer-events: none !important;
        border-radius: 20px;
    `;
    
    // Ensure container has relative positioning
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }
    
    // Enhanced error handling
    video.onerror = (e) => {
        const videoUrl = backgroundData.url;
        console.warn('Chat video background failed to load:', e);
        
        if (videoUrl.startsWith('blob:')) {
            console.warn('Blob URL detected - this URL is no longer valid (likely from a previous session)');
            showBackgroundMessage('Video background was from a previous session and is no longer valid. Please re-upload.', 'info');
        } else {
            console.warn('Video URL:', videoUrl);
            console.warn('Video format:', videoUrl.substring(0, 50) + '...');
        }
        
        video.remove();
        
        // Try to clear the invalid background from settings
        try {
            const settings = JSON.parse(localStorage.getItem('remiCustomization') || '{}');
            if (settings.backgrounds?.chat) {
                settings.backgrounds.chat = null;
                localStorage.setItem('remiCustomization', JSON.stringify(settings));
                console.log('Cleared invalid video background from settings');
            }
        } catch (settingsError) {
            console.warn('Failed to clear invalid background from settings:', settingsError);
        }
    };
    
    // Enhanced play handling
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => {
            console.warn('Video autoplay failed:', e);
            console.warn('This is often due to browser autoplay policies');
            
            // For autoplay failures, keep the video but show a message
            if (e.name === 'NotSupportedError') {
                console.warn('Video format not supported by browser');
                video.remove();
            }
        });
    }
    
    container.appendChild(video);
}

// Helper function to apply image background
function applyImageChatBackground(container, backgroundData) {
    // Test image loading before applying
    const testImg = new Image();
    
    testImg.onload = () => {
        // Image loaded successfully, apply it
        container.style.backgroundImage = `url(${backgroundData.url})`;
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
        container.style.backgroundRepeat = 'no-repeat';
        container.style.backgroundAttachment = 'fixed';
    };
    
    testImg.onerror = () => {
        const imageUrl = backgroundData.url;
        console.warn('Chat image background failed to load');
        
        if (imageUrl.startsWith('blob:')) {
            console.warn('Blob URL detected - this URL is no longer valid (likely from a previous session)');
            showBackgroundMessage('Image background was from a previous session and is no longer valid. Please re-upload.', 'info');
        } else {
            console.warn('Image URL:', imageUrl.substring(0, 50) + '...');
        }
        
        // Try to clear the invalid background from settings
        try {
            const settings = JSON.parse(localStorage.getItem('remiCustomization') || '{}');
            if (settings.backgrounds?.chat) {
                settings.backgrounds.chat = null;
                localStorage.setItem('remiCustomization', JSON.stringify(settings));
                console.log('Cleared invalid image background from settings');
            }
        } catch (settingsError) {
            console.warn('Failed to clear invalid background from settings:', settingsError);
        }
    };
    
    testImg.src = backgroundData.url;
}

let currentChatId = new URLSearchParams(window.location.search).get('id') || 'newChat';
let history = localStorage.getItem(`chatHistory-${currentChatId}`) || '';

// Helper function to update page title
function updatePageTitle() {
    const profiles = getCurrentProfiles();
    const remiName = profiles.remi?.name || 'Remi';
    document.title = `Chat with ${remiName} - AI Student Assistant`;
}

// Helper function to update chat header
function updateChatHeader() {
    const profiles = getCurrentProfiles();
    const remiName = profiles.remi?.name || 'Remi';
    const remiPicture = profiles.remi?.picture || 'pfp/Remi-pfp.png';
    
    // Update chat title
    const chatTitle = document.querySelector('.chat-title[data-remi-name]');
    if (chatTitle) {
        chatTitle.textContent = remiName;
    }
    
    // Update header avatar
    const headerAvatar = document.getElementById('headerAvatar');
    if (headerAvatar) {
        headerAvatar.src = remiPicture;
        headerAvatar.alt = remiName;
    }
    
    // Update any other data-remi-name elements in the header
    const nameElements = document.querySelectorAll('[data-remi-name]');
    nameElements.forEach(element => {
        if (element.tagName === 'IMG') {
            element.alt = remiName;
        } else {
            element.textContent = remiName;
        }
    });
    
    // Update any data-remi-avatar elements
    const avatarElements = document.querySelectorAll('[data-remi-avatar]');
    avatarElements.forEach(element => {
        if (element.tagName === 'IMG') {
            element.src = remiPicture;
            element.alt = remiName;
        }
    });
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Ensure sticker system variables are initialized
    if (typeof userCoins === 'undefined') {
        userCoins = parseInt(localStorage.getItem('userCoins')) || 0;
    }
    if (typeof placedStickers === 'undefined') {
        placedStickers = JSON.parse(localStorage.getItem('placedStickers')) || [];
    }
    if (typeof stickerSystemActive === 'undefined') {
        stickerSystemActive = false;
    }
    
    initializeChat();
    setupEventListeners();
    loadChats();
    initializeMaximizeMode();
    initializeHeaderClickHandlers();
    initializeMobileToolbar(); // Add mobile toolbar functionality
    applyChatBackground(); // Apply custom background/video
    
    // Award daily login bonus
    awardCoinsForActivity('daily');
    
    // Initialize sticker system if available
    if (typeof initializeStickerSystem === 'function') {
        initializeStickerSystem();
    }
    
    // Update page title and chat header with current name
    updatePageTitle();
    updateChatHeader();
    
    // Show welcome message if no history
    if (!history.trim()) {
        displayWelcomeMessage();
    } else {
        chatMessages.innerHTML = history;
        attachAvatarClickEvent();
        // Update message count for existing chat
        updateMessageCountDisplay();
    }
    
    // Listen for profile updates
    window.addEventListener('profileUpdated', (event) => {
        console.log('Profile updated event received:', event.detail);
        const { profileType, field } = event.detail;

        // Always update headers on any profile change
        updateChatHeader();
        if (isMaximizeMode) {
            updateMaximizeHeaders();
        }

        // Handle specific updates for Remi's profile
        if (profileType === 'remi' && (field === 'name' || field === 'picture' || field === 'description')) {
            // Update page title if name changed
            if (field === 'name') {
                console.log('Updating page title for name change');
                updatePageTitle();
            }
            
            // Update the welcome message if it's currently displayed
            const welcomeMessage = document.querySelector('.welcome-message');
            if (welcomeMessage) {
                displayWelcomeMessage();
            }
        }
    });
    
    // Listen for customization updates (backgrounds, themes, etc.)
    window.addEventListener('remiCustomizationUpdated', (event) => {
        console.log('Customization updated event received:', event.detail);
        
        // Reapply chat background when customization changes
        setTimeout(() => {
            applyChatBackground();
        }, 100);
        
        // Update other customization-related elements
        updateChatHeader(); // In case avatar changed
        updatePageTitle(); // In case name changed
    });
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (event) => {
        if (event.key === 'remiCustomization') {
            console.log('Customization storage changed in another tab');
            setTimeout(() => {
                applyChatBackground();
                updateChatHeader();
                updatePageTitle();
            }, 100);
        }
    });
    
    // Listen for stats updates to refresh headers
    window.addEventListener('statsUpdated', () => {
        if (isMaximizeMode) {
            updateProgressBars();
            updateMoodAndStatus();
        }
    });
    
    // Listen for AI-created task and note events
    window.addEventListener('taskCreated', (event) => {
        const { task } = event.detail;
        console.log('✅ Task created by AI system:', task);
        
        // Update task statistics if on tasks page
        if (window.location.pathname.includes('tasks.html') && typeof updateTaskStatistics === 'function') {
            updateTaskStatistics();
        }
        
        // Refresh global stats
        if (window.globalStatsManager) {
            window.globalStatsManager.forceRefresh();
        }
    });
    
    window.addEventListener('noteCreated', (event) => {
        const { note } = event.detail;
        console.log('📝 Note created by AI system:', note);
        
        // Update notes statistics if on notes page
        if (window.location.pathname.includes('notes.html') && typeof updateNotesStatistics === 'function') {
            updateNotesStatistics();
        }
    });
    
    window.addEventListener('taskUpdated', (event) => {
        const { action, task } = event.detail;
        console.log(`📋 Task ${action} by AI system:`, task);
        
        // Update UI based on action
        if (action === 'updated' || action === 'deleted') {
            // Refresh task displays if on tasks page
            if (window.location.pathname.includes('tasks.html')) {
                if (action === 'updated' && typeof updateTaskInDOM === 'function') {
                    updateTaskInDOM(task);
                } else if (action === 'deleted') {
                    const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                    if (taskElement) {
                        taskElement.remove();
                    }
                }
                
                if (typeof updateTaskStatistics === 'function') {
                    updateTaskStatistics();
                }
            }
            
            // Refresh global stats
            if (window.globalStatsManager) {
                window.globalStatsManager.forceRefresh();
            }
        }
    });
});

// Cursor Auto-Hide Functions
let cursorHideTimer;
let isMouseIdle = false;
let showCursorAndResetTimer; // Declare function variable

function startCursorAutoHide() {
    // Clear any existing timer
    clearTimeout(cursorHideTimer);
    
    // Show cursor initially
    document.body.style.cursor = 'default';
    isMouseIdle = false;
    
    // Function to hide cursor
    function hideCursor() {
        document.body.style.cursor = 'none';
        isMouseIdle = true;
    }
    
    // Function to show cursor and reset timer
    showCursorAndResetTimer = function() {
        if (isMouseIdle) {
            document.body.style.cursor = 'default';
            isMouseIdle = false;
        }
        clearTimeout(cursorHideTimer);
        cursorHideTimer = setTimeout(hideCursor, 3000); // Hide after 3 seconds of inactivity
    };
    
    // Add event listeners for mouse movement and clicks
    document.addEventListener('mousemove', showCursorAndResetTimer);
    document.addEventListener('mousedown', showCursorAndResetTimer);
    document.addEventListener('keydown', showCursorAndResetTimer);
    
    // Start the initial timer
    cursorHideTimer = setTimeout(hideCursor, 3000);
}

function stopCursorAutoHide() {
    // Clear the timer
    clearTimeout(cursorHideTimer);
    
    // Show cursor
    document.body.style.cursor = 'default';
    isMouseIdle = false;
    
    // Remove event listeners if they exist
    if (showCursorAndResetTimer) {
        document.removeEventListener('mousemove', showCursorAndResetTimer);
        document.removeEventListener('mousedown', showCursorAndResetTimer);
        document.removeEventListener('keydown', showCursorAndResetTimer);
    }
}

function initializeChat() {
    // Initialize image storage
    if (window.ImageStorage) {
        window.ImageStorage.init().catch(console.error);
    }
    
    // Load profile picture for display only
    loadProfilePicture();
    
    // Setup auto-resize for textarea
    setupAutoResizeTextarea();
    
    // Update send button state
    updateSendButtonState();
}

function setupEventListeners() {
    // Send message events
    sendBtn?.addEventListener('click', handleSendMessage);
    inputField?.addEventListener('keydown', handleKeyPress);
    inputField?.addEventListener('input', handleInputChange);

    // Panel toggles
    profileToggle?.addEventListener('click', () => togglePanel('profile'));
    chatHistoryBtn?.addEventListener('click', () => togglePanel('history'));
    newChatBtn?.addEventListener('click', createNewChat);
    helpBtn?.addEventListener('click', () => sendHelpCommand());
    maximizeToggle?.addEventListener('click', toggleMaximizeMode);
    maximizeExitBtn?.addEventListener('click', exitMaximizeMode);
    stickerToggle?.addEventListener('click', toggleStickerPanel);

    // Global keyboard events
    document.addEventListener('keydown', handleGlobalKeyPress);

    // Panel close buttons
    closeProfile?.addEventListener('click', () => closePanel('profile'));
    closeProfileButton?.addEventListener('click', () => closePanel('profile'));
    closeChatHistory?.addEventListener('click', () => closePanel('history'));
    panelOverlay?.addEventListener('click', closeAllPanels);

    // Quick actions
    quickActionCards.forEach(card => {
        card.addEventListener('click', () => {
            const action = card.dataset.action;
            handleQuickAction(action);
        });
    });
}

function setupAutoResizeTextarea() {
    if (!inputField) return;
    
    inputField.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        updateSendButtonState();
    });
}

function handleInputChange() {
    updateSendButtonState();
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // Only send if AI is not typing
        if (!isAITyping) {
            handleSendMessage();
        }
    }
}

function handleSendMessage() {
    // Prevent sending if AI is currently typing
    if (isAITyping) {
        return;
    }
    
    const message = inputField.value.trim();
    if (!message) return;

    // Check message limit for current chat (10 messages max)
    // Chat history is stored as HTML string, not JSON array
    const currentChatHistory = localStorage.getItem(`chatHistory-${currentChatId}`) || '';
    // Count user messages by counting occurrences of 'user-message' class
    const userMessageMatches = currentChatHistory.match(/user-message/g);
    const userMessages = userMessageMatches ? userMessageMatches.length : 0;
    
    if (userMessages >= 10) {
        // Show message limit warning
        addMessage(`<div class="message-container ai"><div class="ai-message">
            <div class="message-content">
                <p><strong>Message limit reached!</strong> You've sent 10 messages in this chat. Please start a new chat to continue the conversation.</p>
            </div>
        </div></div>`);
        return;
    }

    // Hide quick actions after first message
    if (quickActions && !quickActions.classList.contains('hidden')) {
        quickActions.classList.add('hidden');
    }

    // Add user message using existing function
    addMessage(`<div class="message-container user"><div class="user-message">${escapeHTML(message)}</div></div>`);
    
    // Send message using existing function
    sendMessage(message);
    
    // Clear input and reset height
    inputField.value = '';
    inputField.style.height = 'auto';
    updateSendButtonState();
    
    // Update message count display
    updateMessageCountDisplay();
}

// Function to update message count display
function updateMessageCountDisplay() {
    const currentChatHistory = localStorage.getItem(`chatHistory-${currentChatId}`) || '';
    const userMessageMatches = currentChatHistory.match(/user-message/g);
    const userMessages = userMessageMatches ? userMessageMatches.length : 0;
    const remainingMessages = Math.max(0, 10 - userMessages);
    
    // Remove existing indicator
    const existingIndicator = document.getElementById('message-count-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Don't show indicator for new chats or if no messages
    if (currentChatId === 'newChat' || userMessages === 0) {
        return;
    }
    
    // Create and add new indicator
    const indicator = document.createElement('div');
    indicator.id = 'message-count-indicator';
    indicator.className = 'message-count-indicator';
    
    // Color coding based on remaining messages
    let indicatorClass = '';
    if (remainingMessages <= 2) {
        indicatorClass = 'limit-critical';
    } else if (remainingMessages <= 5) {
        indicatorClass = 'limit-warning';
    } else {
        indicatorClass = 'limit-safe';
    }
    
    indicator.innerHTML = `
        <div class="count-display ${indicatorClass}">
            <i class="fas fa-comment-dots"></i>
            <span>${userMessages}/10 messages (${remainingMessages} remaining)</span>
        </div>
    `;
    
    // Add to chat container
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        chatContainer.appendChild(indicator);
    }
}

function updateSendButtonState() {
    if (!sendBtn || !inputField) return;
    
    const hasText = inputField.value.trim().length > 0;
    const canSend = hasText && !isAITyping;
    
    sendBtn.disabled = !canSend;
    
    // Update input field visual state
    if (isAITyping) {
        inputField.style.opacity = '0.6';
        inputField.placeholder = 'AI is responding...';
        inputField.disabled = true;
    } else {
        inputField.style.opacity = '1';
        inputField.placeholder = 'Type your message...';
        inputField.disabled = false;
    }
    
    if (canSend) {
        sendBtn.style.background = 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))';
        sendBtn.style.opacity = '1';
        sendBtn.style.cursor = 'pointer';
    } else {
        sendBtn.style.background = 'var(--glass-bg)';
        sendBtn.style.opacity = isAITyping ? '0.3' : '0.5';
        sendBtn.style.cursor = isAITyping ? 'not-allowed' : 'default';
    }
}

// Enhanced sendMessage function with AI integration
async function sendMessage(message) {
    // Validate message
    if (!message || typeof message !== 'string') {
        console.error("Invalid message:", message);
        return;
    }
    
    // Set AI typing state and update UI
    isAITyping = true;
    updateSendButtonState();
    
    showTypingIndicator();

    try {
        // Get chat history for context (last 10 messages)
        const chatHistory = getChatHistoryForAI();
        
        // Try to use AI response system if available
        let response;
        if (window.getAIResponse) {
            // Use globally available AI function
            response = await window.getAIResponse(message, chatHistory);
        } else {
            // Try dynamic import as fallback
            try {
                const aiModule = await import('../Backend/aiResponse.js');
                response = await aiModule.getAIResponse(message, chatHistory);
            } catch (importError) {
                console.warn('Dynamic import failed, using fallback system:', importError);
                throw new Error('AI module not available');
            }
        }
        
        removeTypingIndicator();
        
        // Display AI response
        let fullResponse = response.message;
        
        // If there were command results, add them to the response
        if (response.commandResults && response.commandResults.length > 0) {
            const commandSummary = response.commandResults.join('\n');
            fullResponse = `${commandSummary}\n\n${response.message}`;
        }
        
        typeMessageWithHTML(fullResponse);
        
        // Award coins for sending a message (every 5 messages = 10 coins)
        awardCoinsForActivity('message');
        
    } catch (error) {
        console.error("Error getting AI response:", error);
        removeTypingIndicator();
        
        // Fallback to command checking system
        const response = checkForCommands(message);
        typeMessageWithHTML(response);
        
        // Award coins even for fallback responses
        awardCoinsForActivity('message');
    }
}

// Helper function to get chat history in format suitable for AI
function getChatHistoryForAI() {
    const messages = [];
    const chatContainer = document.getElementById('chatMessages');
    
    if (chatContainer) {
        const messageElements = chatContainer.querySelectorAll('.message-container');
        
        // Get last 10 messages
        const recentMessages = Array.from(messageElements).slice(0, 10);
        
        recentMessages.forEach(element => {
            if (element.classList.contains('user')) {
                const userMessage = element.querySelector('.user-message');
                if (userMessage) {
                    const content = userMessage.textContent && userMessage.textContent.trim();
                    messages.unshift({
                        isUser: true,
                        content: content || "Empty message"
                    });
                }
            } else if (element.classList.contains('ai')) {
                const aiMessage = element.querySelector('.ai-message');
                if (aiMessage) {
                    const content = aiMessage.textContent && aiMessage.textContent.trim();
                    messages.unshift({
                        isUser: false,
                        content: content || "Empty response"
                    });
                }
            }
        });
    }
    
    return messages;
}

function addMessage(newMessage) {
    history = `${newMessage} ${history}`;
    chatMessages.innerHTML = history;
    attachAvatarClickEvent();
    scrollToBottom();
    
    // Update message count display
    updateMessageCountDisplay();
    
    if (currentChatId === 'newChat') {
        currentChatId = generateNewChatId();
        chatMessages.dataset.chatId = currentChatId;
        
        // Generate chat name from first message if it's a user message
        let chatName = 'New conversation';
        const messageElement = document.createElement('div');
        messageElement.innerHTML = newMessage;
        
        // Look for user message content in various possible structures
        const userMessageElement = messageElement.querySelector('.user-message');
        if (userMessageElement) {
            const messageContent = userMessageElement.querySelector('.message-content') || userMessageElement;
            const messageText = messageContent.textContent || messageContent.innerText || '';
            const firstWords = messageText.trim().split(/\s+/).slice(0, 5).join(' ');
            if (firstWords.length > 0) {
                chatName = firstWords.length > 30 ? firstWords.substring(0, 30) + '...' : firstWords;
            }
        }
        
        // Manage chat history limit (maximum 3 chats)
        if (chats.length >= 3) {
            // Remove the oldest chat
            const oldestChat = chats.pop();
            // Remove its history from localStorage
            localStorage.removeItem(`chatHistory-${oldestChat.id}`);
            console.log(`Removed oldest chat: ${oldestChat.name}`);
        }
        
        // Add new chat at the beginning
        chats.unshift({
            id: currentChatId,
            name: chatName,
            preview: userMessageElement ? (userMessageElement.textContent || userMessageElement.innerText || '').substring(0, 50) + '...' : 'New conversation...',
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('chatList', JSON.stringify(chats));
        updateChatList(); // Refresh the chat list display
    } else {
        localStorage.setItem(`chatHistory-${currentChatId}`, history);
    }
}

// Function to update message count indicator in UI
function updateMessageCountIndicator(count) {
    // Find or create message count indicator
    let indicator = document.getElementById('message-count-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'message-count-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(168, 85, 247, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 600;
            z-index: 100;
        `;
        
        const chatContainer = document.querySelector('.chat-messages-wrapper');
        if (chatContainer) {
            chatContainer.style.position = 'relative';
            chatContainer.appendChild(indicator);
        }
    }
    
    const remaining = Math.max(0, 10 - count);
    indicator.textContent = `${count}/10 messages (${remaining} remaining)`;
    
    // Change color as limit approaches
    if (remaining <= 2) {
        indicator.style.background = 'rgba(239, 68, 68, 0.8)'; // Red
    } else if (remaining <= 5) {
        indicator.style.background = 'rgba(245, 158, 11, 0.8)'; // Orange
    } else {
        indicator.style.background = 'rgba(168, 85, 247, 0.8)'; // Purple
    }
}

// Function to safely render HTML in AI messages while preventing XSS
function sanitizeAndRenderHTML(htmlString) {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    
    // List of allowed HTML tags for AI responses
    const allowedTags = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'b', 'em', 'i', 'u',
        'ul', 'ol', 'li',
        'code', 'pre',
        'div', 'span',
        'blockquote'
    ];
    
    // List of allowed attributes
    const allowedAttributes = {
        'div': ['style', 'class'],
        'span': ['style', 'class'],
        'code': ['class'],
        'pre': ['class'],
        'h1': ['class'], 'h2': ['class'], 'h3': ['class'], 'h4': ['class'], 'h5': ['class'], 'h6': ['class'],
        'p': ['class', 'style'],
        'ul': ['class'], 'ol': ['class'], 'li': ['class'],
        'strong': ['class'], 'b': ['class'], 'em': ['class'], 'i': ['class'], 'u': ['class'],
        'blockquote': ['class', 'style']
    };
    
    // Set the HTML content
    tempDiv.innerHTML = htmlString;
    
    // Function to clean an element recursively
    function cleanElement(element) {
        const tagName = element.tagName?.toLowerCase();
        
        // Remove disallowed tags
        if (tagName && !allowedTags.includes(tagName)) {
            element.replaceWith(...element.childNodes);
            return;
        }
        
        // Remove disallowed attributes
        if (element.attributes) {
            const attributesToRemove = [];
            for (let attr of element.attributes) {
                const attrName = attr.name.toLowerCase();
                const allowedAttrs = allowedAttributes[tagName] || [];
                
                if (!allowedAttrs.includes(attrName)) {
                    attributesToRemove.push(attr.name);
                }
            }
            
            attributesToRemove.forEach(attrName => {
                element.removeAttribute(attrName);
            });
        }
        
        // Clean child elements
        Array.from(element.children).forEach(cleanElement);
    }
    
    // Clean all elements
    Array.from(tempDiv.children).forEach(cleanElement);
    
    return tempDiv.innerHTML;
}

// Process memory commands in AI responses
function processMemoryCommands(text) {
    if (!text) return text;
    
    // Pattern to match /memory {content}
    const memoryPattern = /\/memory\s*\{([^}]+)\}/gi;
    
    let processedText = text;
    let match;
    
    while ((match = memoryPattern.exec(text)) !== null) {
        const memoryContent = match[1].trim();
        
        if (memoryContent) {
            try {
                // Store memory in localStorage for persistence
                const memories = JSON.parse(localStorage.getItem('aiMemories') || '[]');
                memories.push({
                    content: memoryContent,
                    timestamp: new Date().toISOString(),
                    source: 'chat'
                });
                
                // Keep only last 50 memories
                if (memories.length > 50) {
                    memories.splice(0, memories.length - 50);
                }
                
                localStorage.setItem('aiMemories', JSON.stringify(memories));
                console.log('Memory saved:', memoryContent);
                
                // Replace the command with a confirmation message
                const confirmationMessage = `📝 *Memory saved: "${memoryContent}"*`;
                processedText = processedText.replace(match[0], confirmationMessage);
                
                // Show notification
                showMemoryNotification(`Memory saved: ${memoryContent}`);
                
            } catch (error) {
                console.error('Error saving memory:', error);
                processedText = processedText.replace(match[0], `❌ *Failed to save memory*`);
            }
        } else {
            // Remove invalid memory commands
            processedText = processedText.replace(match[0], '');
        }
    }
    
    return processedText;
}

// Show memory notification
function showMemoryNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'memory-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(16, 185, 129, 0.9));
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-brain" style="color: #10b981;"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add animation keyframes if not already added
    if (!document.querySelector('#memory-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'memory-notification-styles';
        styles.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Enhanced typeMessage function that properly handles HTML for AI responses
function typeMessageWithHTML(text) {
    // Process memory commands before displaying
    text = processMemoryCommands(text);
    
    const profiles = getCurrentProfiles();
    const remiName = profiles.remi?.name || 'Remi';
    const remiPicture = profiles.remi?.picture || 'pfp/Remi-pfp.png';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'message-container ai';
    wrapper.innerHTML = `
        <div class="ai-message-wrapper">
            <div class="ai-avatar">
                <img src="${remiPicture}" alt="${remiName}" data-remi-avatar>
            </div>
            <div class="ai-message"></div>
        </div>
    `;

    const messageText = wrapper.querySelector('.ai-message');
    chatMessages.insertAdjacentElement('afterbegin', wrapper);

    // Check if the text contains HTML tags
    const containsHTML = /<[^>]*>/g.test(text);
    
    if (containsHTML) {
        // For HTML content, sanitize and render directly
        const sanitizedHTML = sanitizeAndRenderHTML(text);
        messageText.innerHTML = sanitizedHTML;
        
        // Clear AI typing state and update UI immediately
        isAITyping = false;
        updateSendButtonState();
        
        history = `${wrapper.outerHTML} ${history}`;
        localStorage.setItem(`chatHistory-${currentChatId}`, history);
        attachAvatarClickEvent();
        scrollToBottom();
    } else {
        // For plain text, use the typing animation with escaping
        let i = 0;
        const interval = setInterval(() => {
            messageText.innerHTML += escapeHTML(text[i]);
            i++;

            scrollToBottom();
            if (i >= text.length) {
                clearInterval(interval);
                
                // Clear AI typing state and update UI
                isAITyping = false;
                updateSendButtonState();
                
                history = `${wrapper.outerHTML} ${history}`;
                localStorage.setItem(`chatHistory-${currentChatId}`, history);
                attachAvatarClickEvent();
            }
        }, 30);
    }
}

// Function to safely sanitize HTML content from user input

function showTypingIndicator() {
    // Remove existing typing indicator
    removeTypingIndicator();
    
    const profiles = getCurrentProfiles();
    const remiName = profiles.remi?.name || 'Remi';
    const remiPicture = profiles.remi?.picture || 'pfp/Remi-pfp.png';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="ai-avatar">
            <img src="${remiPicture}" alt="${remiName}" data-remi-avatar>
        </div>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatMessages.insertAdjacentElement('afterbegin', typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

// Helper function to get current profile data
function getCurrentProfiles() {
    const defaultProfiles = {
        user: { name: 'Student', picture: 'pfp/Google_2015_logo.svg.png' },
        remi: { 
            name: 'Auro', 
            picture: 'pfp/Auro_Logo.png',
            description: 'Your AI Cognitive Assistant'
        }
    };
    
    try {
        const saved = localStorage.getItem('remiProfiles');
        if (!saved) {
            return defaultProfiles;
        }

        const savedProfiles = JSON.parse(saved);

        // Deep merge to ensure all properties are preserved
        const mergedProfiles = {
            user: { ...defaultProfiles.user, ...(savedProfiles.user || {}) },
            remi: { ...defaultProfiles.remi, ...(savedProfiles.remi || {}) }
        };
        
        return mergedProfiles;

    } catch (error) {
        console.error('Error loading profiles:', error);
        return defaultProfiles;
    }
}

function displayWelcomeMessage() {
    // Get current profile data
    const profiles = getCurrentProfiles();
    const remiName = profiles.remi?.name || 'Remi';
    const remiPicture = profiles.remi?.picture || 'pfp/Remi-pfp.png';
    const remiDescription = profiles.remi?.description || 'Your AI Study Companion';
    
    // Get current time for personalized greeting
    const currentHour = new Date().getHours();
    let timeGreeting = '';
    let timeEmoji = '';
    
    if (currentHour >= 5 && currentHour < 12) {
        timeGreeting = 'Good morning';
        timeEmoji = '🌅';
    } else if (currentHour >= 12 && currentHour < 17) {
        timeGreeting = 'Good afternoon';
        timeEmoji = '☀️';
    } else if (currentHour >= 17 && currentHour < 21) {
        timeGreeting = 'Good evening';
        timeEmoji = '🌇';
    } else {
        timeGreeting = 'Good evening';
        timeEmoji = '🌙';
    }
    
    // Add welcome animation to the container
    chatMessages.classList.add('welcome-animation');
    
    setTimeout(() => {
        const welcomeMessage = `
            <div class="message-container ai welcome-message">
                <div class="modern-welcome-card">
                    <div class="welcome-header-section">
                        <div class="avatar-section">
                            <img src="${remiPicture}" alt="${remiName}" class="welcome-avatar" data-remi-avatar>
                            <div class="status-badge">
                                <span class="status-dot"></span>
                                <span class="status-text">Online</span>
                            </div>
                        </div>
                        <div class="greeting-section">
                            <h2 class="main-greeting">${timeEmoji} ${timeGreeting}!</h2>
                            <h3 class="assistant-intro">I'm <span class="name-highlight" data-remi-name>${remiName}</span></h3>
                            <p class="description-text" data-remi-description>${remiDescription}</p>
                        </div>
                    </div>
                    
                    <div class="features-showcase">
                        <div class="feature-highlight">
                            <div class="feature-icon">🎓</div>
                            <div class="feature-content">
                                <h4>Smart Learning Assistant</h4>
                                <p>I can help you study, plan, and achieve your academic goals with personalized guidance.</p>
                            </div>
                        </div>
                        
                        <div class="quick-start-section">
                            <h4 class="quick-start-title">✨ Quick Start</h4>
                            <div class="starter-buttons">
                                <button class="starter-btn" data-action="study">📚 Study Help</button>
                                <button class="starter-btn" data-action="plan">📅 Make a Plan</button>
                                <button class="starter-btn" data-action="explain">💡 Explain Topic</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="welcome-footer">
                        <div class="chat-prompt">
                            <span class="prompt-icon">�</span>
                            <span class="prompt-text">What would you like to learn about today?</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        chatMessages.innerHTML = welcomeMessage;
        chatMessages.classList.remove('welcome-animation');
        attachAvatarClickEvent();
        attachStarterButtonEvents();
        
        // Add entrance animations
        setTimeout(() => {
            document.querySelector('.welcome-header-section')?.classList.add('animate-in');
        }, 200);
        
        setTimeout(() => {
            document.querySelector('.features-showcase')?.classList.add('animate-in');
        }, 500);
        
        setTimeout(() => {
            document.querySelector('.welcome-footer')?.classList.add('animate-in');
        }, 800);
        
    }, 800);

    // Show quick actions after welcome message
    setTimeout(() => {
        if (quickActions) {
            quickActions.classList.remove('hidden');
            quickActions.classList.add('fade-in');
        }
    }, 2500);
}

// Add event listeners for starter buttons
function attachStarterButtonEvents() {
    const starterButtons = document.querySelectorAll('.starter-btn');
    starterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            handleStarterButtonClick(action);
        });
    });
}

// Handle starter button clicks
function handleStarterButtonClick(action) {
    let message = '';
    
    switch(action) {
        case 'study':
            message = 'I need help with studying. Can you help me create a study plan?';
            break;
        case 'plan':
            message = 'I want to create a learning plan. What do you recommend?';
            break;
        case 'explain':
            message = 'Can you explain a topic to me? I have some questions.';
            break;
        default:
            message = 'Hi! I\'d like to get started with learning.';
    }
    
    // Set the message in the input and send it
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = message;
        sendMessage();
    }
}

// Handle capability item clicks
function handleCapabilityItemClick(action) {
    let message = '';
    
    switch (action) {
        case 'study':
            message = 'I want help with study planning and organization';
            break;
        case 'goals':
            message = 'Help me set and track my academic goals';
            break;
        case 'concepts':
            message = 'I need help understanding a concept';
            break;
        case 'questions':
            message = 'I have a question about my studies';
            break;
        case 'schedule':
            message = 'Help me manage my time and schedule';
            break;
        case 'motivation':
            message = 'I need some motivation and encouragement';
            break;
        default:
            message = `Tell me more about ${action}`;
    }
    
    // Auto-fill the input and focus
    if (inputField) {
        inputField.value = message;
        inputField.focus();
        updateSendButtonState();
        
        // Add a subtle animation to indicate the text was filled
        inputField.style.transform = 'scale(1.02)';
        setTimeout(() => {
            inputField.style.transform = 'scale(1)';
        }, 200);
    }
}

// Enhanced Quick Actions
function handleQuickAction(action) {
    // Prevent quick actions while AI is typing
    if (isAITyping) {
        return;
    }
    
    let message = '';
    
    switch (action) {
        case 'help':
            message = '/help';
            break;
        case 'task':
            message = 'I want to create a new task';
            break;
        case 'motivation':
            message = 'I need some motivation';
            break;
        case 'study-tips':
            message = 'Can you give me some study tips?';
            break;
        default:
            message = `Tell me about ${action}`;
    }
    
    // Simulate user typing the message
    inputField.value = message;
    handleSendMessage();
}

function sendHelpCommand() {
    // Prevent help command while AI is typing
    if (isAITyping) {
        return;
    }
    
    inputField.value = '/help';
    handleSendMessage();
}

// Panel Management
function togglePanel(panelType) {
    closeAllPanels();
    
    if (panelType === 'profile') {
        profileContainer?.classList.add('visible');
        showOverlay();
    } else if (panelType === 'history') {
        chatHistoryPanel?.classList.add('show');
        showOverlay();
    }
}

function closePanel(panelType) {
    if (panelType === 'profile') {
        profileContainer?.classList.remove('visible');
    } else if (panelType === 'history') {
        chatHistoryPanel?.classList.remove('show');
    }
    hideOverlay();
}

function closeAllPanels() {
    profileContainer?.classList.remove('visible');
    chatHistoryPanel?.classList.remove('show');
    hideOverlay();
}

function showOverlay() {
    panelOverlay?.classList.add('show');
}

function hideOverlay() {
    panelOverlay?.classList.remove('show');
}

function createNewChat() {
    // Check if user has reached the 3 chat limit
    const existingChats = JSON.parse(localStorage.getItem('chatList')) || [];
    if (existingChats.length >= 3) {
        // Show warning message with delete option
        alert('You can only have 3 chat histories at once. Please delete an existing chat from the chat history panel to create a new one, or the oldest chat will be automatically removed.');
        
        // Automatically remove oldest chat if user proceeds
        if (existingChats.length >= 3) {
            const oldestChat = existingChats[existingChats.length - 1];
            localStorage.removeItem(`chatHistory-${oldestChat.id}`);
            existingChats.pop();
            localStorage.setItem('chatList', JSON.stringify(existingChats));
            console.log(`Auto-removed oldest chat: ${oldestChat.name}`);
        }
    }
    
    currentChatId = 'newChat';
    history = '';
    chatMessages.innerHTML = '';
    inputField.value = '';
    inputField.style.height = 'auto';
    
    // Clear message count indicator
    const indicator = document.getElementById('message-count-indicator');
    if (indicator) {
        indicator.remove();
    }
    
    // Show quick actions for new chat
    if (quickActions) {
        quickActions.classList.remove('hidden');
    }
    
    displayWelcomeMessage();
    closeAllPanels();
    
    // Update URL
    window.history.pushState({}, '', window.location.pathname);
}

// Keep existing functions with enhancements
function checkForCommands(message) {
    const responses = [];

    if (/i love you/i.test(message)) {
        responses.push('I love you toooooo!!! ❤️ You always make me so happy!');
    }

    if (/\/new/i.test(message)) {
        createNewChat();
        responses.push('✨ New chat created! How can I help you today?');
        return responses.join('<br><br>');
    }

    if (/\/help/i.test(message)) {
        responses.push(`
            <h4>🤖 Available Commands:</h4>
            <ul>
                <li><code>/help</code> - Show this help menu</li>
                <li><code>/new</code> - Start a new chat</li>
                <li><code>/tasks</code> - View all your tasks with status</li>
                <li><code>/pending</code> - View only pending tasks</li>
                <li><code>/completed</code> - View only completed tasks</li>
                <li><code>/addTask [task name]</code> - Quick create a task</li>
                <li><code>/editTask [task name] [done/pending]</code> - Update task status</li>
                <li><code>/deleteTask [task name]</code> - Delete a task</li>
                <li><code>/task {name, date, time, duration, priority}</code> - Create detailed task</li>
                <li><code>/notes</code> - Open notes page</li>
                <li><code>/addNote [title]</code> - Quick create a note</li>
                <li><code>/addIdea [title]</code> - Quick create an idea</li>
            </ul>
            <p>💡 <strong>Tips:</strong></p>
            <ul>
                <li>Task names are fuzzy matched - partial names work!</li>
                <li>Use the notes system to capture thoughts and ideas!</li>
                <li>Ask me about study techniques and motivation</li>
                <li>Chat naturally - I understand context!</li>
            </ul>
        `);
    }

    // Task management commands
    if (/\/tasks\b/i.test(message)) {
        const allTasks = getTasksFromStorage();
        responses.push(formatTasksForChat(allTasks));
    }

    // Edit task command: /editTask taskname done|pending
    const editTaskMatch = message.match(/\/editTask\s+(.+?)\s+(done|pending|completed)/i);
    if (editTaskMatch) {
        const [, taskName, status] = editTaskMatch;
        const task = findTaskByName(taskName.trim());
        
        if (task) {
            const isCompleted = status.toLowerCase() === 'done' || status.toLowerCase() === 'completed';
            const updates = { 
                completed: isCompleted,
                ...(isCompleted ? { completedAt: new Date().toISOString() } : {})
            };
            
            // Remove completedAt if marking as pending
            if (!isCompleted && task.completedAt) {
                updates.completedAt = undefined;
            }
            
            const success = updateTaskInStorageWithEvent(task.id, updates);
            
            if (success) {
                const statusText = isCompleted ? 'completed ✅' : 'pending 🔄';
                responses.push(`✅ Task "${task.name}" has been marked as ${statusText}!`);
            } else {
                responses.push(`❌ Failed to update task "${taskName}". Please try again.`);
            }
        } else {
            responses.push(`❌ Task "${taskName}" not found. Use <code>/tasks</code> to see all available tasks.`);
        }
    }

    // Delete task command: /deleteTask taskname
    const deleteTaskMatch = message.match(/\/deleteTask\s+(.+)/i);
    if (deleteTaskMatch) {
        const taskName = deleteTaskMatch[1].trim();
        const task = findTaskByName(taskName);
        
        if (task) {
            const success = deleteTaskFromStorageWithEvent(task.id);
            
            if (success) {
                responses.push(`🗑️ Task "${task.name}" has been deleted successfully!`);
            } else {
                responses.push(`❌ Failed to delete task "${taskName}". Please try again.`);
            }
        } else {
            responses.push(`❌ Task "${taskName}" not found. Use <code>/tasks</code> to see all available tasks.`);
        }
    }

    // Quick task creation command: /addTask taskname
    const quickTaskMatch = message.match(/\/addTask\s+(.+)/i);
    if (quickTaskMatch) {
        const taskName = quickTaskMatch[1].trim();
        const quickTask = createTaskFromChat({
            name: taskName,
            description: 'Quick task created via chat',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            duration: '30',
            priority: '2'
        });
        
        responses.push(`✅ Quick task "<strong>${quickTask.name}</strong>" created successfully! 
                       <br>Use <code>/tasks</code> to view all tasks or visit the tasks page to edit details.`);
    }

    // Show pending tasks only
    if (/\/pending/i.test(message)) {
        const allTasks = getTasksFromStorage();
        const pendingTasks = allTasks.filter(task => !task.completed);
        
        if (pendingTasks.length === 0) {
            responses.push("🎉 Awesome! You have no pending tasks. Great job staying on top of things!");
        } else {
            let response = `<h4>🔄 Pending Tasks (${pendingTasks.length})</h4><ul>`;
            pendingTasks.forEach(task => {
                const priorityEmoji = task.priority === '1' ? '🔴' : task.priority === '2' ? '🟡' : '🟢';
                const deadline = task.deadline ? ` (Due: ${task.deadline})` : '';
                response += `<li>${priorityEmoji} <strong>${task.name}</strong>${deadline}</li>`;
            });
            response += `</ul>`;
            responses.push(response);
        }
    }

    // Show completed tasks only
    if (/\/completed/i.test(message)) {
        const allTasks = getTasksFromStorage();
        const completedTasks = allTasks.filter(task => task.completed);
        
        if (completedTasks.length === 0) {
            responses.push("📝 No completed tasks yet. Keep working - you'll get there!");
        } else {
            let response = `<h4>✅ Completed Tasks (${completedTasks.length})</h4><ul>`;
            completedTasks.slice(0, 10).forEach(task => {
                response += `<li>✅ <strike>${task.name}</strike></li>`;
            });
            if (completedTasks.length > 10) {
                response += `<li><em>... and ${completedTasks.length - 10} more</em></li>`;
            }
            response += `</ul>`;
            responses.push(response);
        }
    }

    // Notes management commands
    if (/\/notes\b/i.test(message)) {
        responses.push(`
            <h4>📝 Notes & Ideas</h4>
            <p>Access your notes and ideas system to capture your thoughts!</p>
            <div style="text-align: center; margin: 1rem 0;">
                <a href="notes.html" style="display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #67c5ff, #7b68ee); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">
                    <i class="fas fa-sticky-note" style="margin-right: 0.5rem;"></i>Open Notes
                </a>
            </div>
            <p><strong>Quick Commands:</strong></p>
            <ul>
                <li><code>/addNote [title]</code> - Quick create a note</li>
                <li><code>/addIdea [title]</code> - Quick create an idea</li>
            </ul>
        `);
    }

    // Quick note creation command: /addNote title
    const quickNoteMatch = message.match(/\/addNote\s+(.+)/i);
    if (quickNoteMatch) {
        const noteTitle = quickNoteMatch[1].trim();
        const quickNote = createNoteFromChat({
            title: noteTitle,
            content: 'Quick note created from chat',
            type: 'note'
        });
        
        responses.push(`📝 Quick note "<strong>${quickNote.title}</strong>" created successfully! 
                       <br>Visit the <a href="notes.html" style="color: var(--accent-primary);">notes page</a> to edit and organize your notes.`);
    }

    // Quick idea creation command: /addIdea title
    const quickIdeaMatch = message.match(/\/addIdea\s+(.+)/i);
    if (quickIdeaMatch) {
        const ideaTitle = quickIdeaMatch[1].trim();
        const quickIdea = createNoteFromChat({
            title: ideaTitle,
            content: 'Quick idea created from chat',
            type: 'idea'
        });
        
        responses.push(`💡 Quick idea "<strong>${quickIdea.title}</strong>" created successfully! 
                       <br>Visit the <a href="notes.html" style="color: var(--accent-primary);">notes page</a> to develop your ideas further.`);
    }

    // Enhanced motivation responses
    if (/motivation|motivate|encourage/i.test(message)) {
        const motivations = [
            "🌟 You're doing amazing! Every study session brings you closer to your goals!",
            "💪 Remember: champions are made when no one is watching. Keep pushing forward!",
            "🚀 Your future self will thank you for the hard work you're putting in today!",
            "✨ Learning is a superpower, and you're developing yours every single day!",
            "🎯 Focus on progress, not perfection. You've got this!"
        ];
        responses.push(motivations[Math.floor(Math.random() * motivations.length)]);
    }

    // Enhanced study tips
    if (/study tip|help study|how to study/i.test(message)) {
        const tips = [
            "📚 <strong>Pomodoro Technique:</strong> Study for 25 minutes, then take a 5-minute break. Your brain will thank you!",
            "🧠 <strong>Active Recall:</strong> Test yourself instead of just re-reading. Quiz yourself on what you've learned!",
            "📝 <strong>Take Notes by Hand:</strong> Writing helps you remember better than typing.",
            "🎯 <strong>Set Specific Goals:</strong> Instead of 'study math', try 'complete 10 algebra problems'."
        ];
        responses.push(tips[Math.floor(Math.random() * tips.length)]);
    }

    // Keep existing task creation logic
    const taskMatches = [...message.matchAll(/\/task\s*\{([^}]+)\}/gi)];
    for (const match of taskMatches) {
        const taskString = match[1];
        const keyValuePairs = taskString.split(',').map(pair => pair.split(':').map(part => part.trim()));
        const taskObj = {};
        keyValuePairs.forEach(([key, value]) => {
            if (key && value) {
                taskObj[key.toLowerCase()] = value;
            }
        });

        const requiredFields = ['name', 'time', 'duration', 'priority'];
        const missingFields = requiredFields.filter(field => !taskObj[field]);

        if (missingFields.length > 0) {
            responses.push(`❌ Missing fields: ${missingFields.join(', ')}. Please provide all required fields.`);
        } else {
            const createdTask = createTaskFromChat({
                name: taskObj.name,
                description: taskObj.description || '',
                date: taskObj.date || new Date().toLocaleDateString(),
                time: taskObj.time,
                duration: taskObj.duration,
                priority: taskObj.priority || '2',
                location: taskObj.location || '',
                milestone: taskObj.milestone || '',
                notes: taskObj.notes || '',
                tags: taskObj.tags ? taskObj.tags.split(',') : [],
                color: taskObj.color || '#6366f1',
                deadline: taskObj.deadline || '',
                effort: taskObj.effort || '1',
                repeatable: taskObj.repeatable === "true",
                repeatDays: taskObj.repeatDays ? taskObj.repeatDays.split(',') : []
            });

            responses.push(`
                <h4>✅ Task Created Successfully!</h4>
                <div style="background: var(--glass-bg); padding: 1rem; border-radius: 10px; margin: 0.5rem 0; border: 1px solid var(--glass-border);">
                    <strong>📋 ${createdTask.name}</strong><br>
                    📅 ${createdTask.date} at ${createdTask.time}<br>
                    ⏱️ Duration: ${createdTask.duration} mins<br>
                    📌 Priority: ${createdTask.priority}<br>
                    ${createdTask.location ? `📍 Location: ${createdTask.location}<br>` : ''}
                    ${createdTask.deadline ? `⏰ Deadline: ${createdTask.deadline}<br>` : ''}
                </div>
                <p>🎉 Great job staying organized! Your task is ready and saved!</p>
            `);
        }
    }

    if (responses.length === 0) {
        // Enhanced default responses
        const defaultResponses = [
            `That's interesting! Tell me more about "${message}" 🤔`,
            `I understand you're talking about "${message}". How can I help you with your studies? 📚`,
            `Great question! Let's explore that together. What specifically would you like to know? 💭`,
            `I'm here to help! Is there anything study-related I can assist you with regarding "${message}"? 🌟`
        ];
        responses.push(defaultResponses[Math.floor(Math.random() * defaultResponses.length)]);
    }

    return responses.join('<br><br>');
}

// Task management functions for chat commands
function getTasksFromStorage() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
}

function updateTaskInStorage(taskId, updates) {
    let tasks = getTasksFromStorage();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Update the task in the tasks page if it's open
        if (window.location.pathname.includes('tasks.html') || typeof updateTaskInDOM === 'function') {
            updateTaskInDOM(tasks[taskIndex]);
        }
        
        return true;
    }
    return false;
}

function deleteTaskFromStorageById(taskId) {
    let tasks = getTasksFromStorage();
    const originalLength = tasks.length;
    tasks = tasks.filter(task => task.id !== taskId);
    
    if (tasks.length < originalLength) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Remove the task from the tasks page if it's open
        if (window.location.pathname.includes('tasks.html')) {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.remove();
            }
        }
        
        return true;
    }
    return false;
}

function findTaskByName(taskName) {
    const tasks = getTasksFromStorage();
    return tasks.find(task => 
        task.name.toLowerCase().includes(taskName.toLowerCase()) ||
        taskName.toLowerCase().includes(task.name.toLowerCase())
    );
}

function formatTasksForChat(tasks) {
    if (tasks.length === 0) {
        return "📝 You don't have any tasks yet! Create some tasks to stay organized.";
    }

    const completedTasks = tasks.filter(task => task.completed);
    const pendingTasks = tasks.filter(task => !task.completed);
    
    // Categorize pending tasks
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const lateTasks = pendingTasks.filter(task => {
        if (!task.date || !task.time) return false;
        const taskDate = new Date(`${task.date} ${task.time}`);
        return taskDate < now;
    });
    
    const dueTodayTasks = pendingTasks.filter(task => {
        if (!task.date) return false;
        const taskDateOnly = new Date(task.date);
        taskDateOnly.setHours(0, 0, 0, 0);
        return taskDateOnly.getTime() === today.getTime() && !lateTasks.includes(task);
    });
    
    const dueTomorrowTasks = pendingTasks.filter(task => {
        if (!task.date) return false;
        const taskDateOnly = new Date(task.date);
        taskDateOnly.setHours(0, 0, 0, 0);
        return taskDateOnly.getTime() === tomorrow.getTime();
    });
    
    const futureTasks = pendingTasks.filter(task => 
        !lateTasks.includes(task) && 
        !dueTodayTasks.includes(task) && 
        !dueTomorrowTasks.includes(task)
    );
    
    let response = `<h4>📋 Your Tasks Summary</h4>`;
    response += `<p><strong>Total:</strong> ${tasks.length} | <strong>Completed:</strong> ${completedTasks.length} | <strong>Pending:</strong> ${pendingTasks.length}</p>`;
    
    // Show late tasks first (highest priority)
    if (lateTasks.length > 0) {
        response += `<h5>⚠️ Late Tasks (${lateTasks.length}):</h5><ul>`;
        lateTasks.forEach(task => {
            const priorityEmoji = task.priority === '1' ? '🔴' : task.priority === '2' ? '🟡' : '🟢';
            response += `<li style="color: #dc3545; font-weight: bold;">⚠️ ${priorityEmoji} <strong>${task.name}</strong>`;
            if (task.date && task.time) {
                response += ` (Was due: ${task.date} at ${task.time})`;
            }
            if (task.description && task.description !== 'No description') {
                response += `<br><em style="color: #6c757d;">${task.description}</em>`;
            }
            response += `</li>`;
        });
        response += `</ul>`;
    }
    
    // Show due today tasks
    if (dueTodayTasks.length > 0) {
        response += `<h5>� Due Today (${dueTodayTasks.length}):</h5><ul>`;
        dueTodayTasks.forEach(task => {
            const priorityEmoji = task.priority === '1' ? '🔴' : task.priority === '2' ? '🟡' : '🟢';
            response += `<li style="color: #ffc107; font-weight: bold;">📅 ${priorityEmoji} <strong>${task.name}</strong>`;
            if (task.time) {
                response += ` (Due at ${task.time})`;
            }
            if (task.description && task.description !== 'No description') {
                response += `<br><em style="color: #6c757d;">${task.description}</em>`;
            }
            response += `</li>`;
        });
        response += `</ul>`;
    }
    
    // Show due tomorrow tasks
    if (dueTomorrowTasks.length > 0) {
        response += `<h5>📋 Due Tomorrow (${dueTomorrowTasks.length}):</h5><ul>`;
        dueTomorrowTasks.forEach(task => {
            const priorityEmoji = task.priority === '1' ? '🔴' : task.priority === '2' ? '🟡' : '🟢';
            response += `<li>${priorityEmoji} <strong>${task.name}</strong>`;
            if (task.time) {
                response += ` (Due at ${task.time})`;
            }
            if (task.description && task.description !== 'No description') {
                response += `<br><em>${task.description}</em>`;
            }
            response += `</li>`;
        });
        response += `</ul>`;
    }
    
    // Show other pending tasks
    if (futureTasks.length > 0) {
        response += `<h5>🔄 Other Pending Tasks (${futureTasks.length}):</h5><ul>`;
        futureTasks.slice(0, 5).forEach(task => {
            const priorityEmoji = task.priority === '1' ? '🔴' : task.priority === '2' ? '🟡' : '🟢';
            const deadline = task.date ? ` (Due: ${task.date}${task.time ? ` at ${task.time}` : ''})` : '';
            response += `<li>${priorityEmoji} <strong>${task.name}</strong>${deadline}`;
            if (task.description && task.description !== 'No description') {
                response += `<br><em>${task.description}</em>`;
            }
            response += `</li>`;
        });
        if (futureTasks.length > 5) {
            response += `<li><em>... and ${futureTasks.length - 5} more future tasks</em></li>`;
        }
        response += `</ul>`;
    }
    
    if (completedTasks.length > 0) {
        response += `<h5>✅ Recently Completed (${completedTasks.length}):</h5><ul>`;
        completedTasks.slice(0, 3).forEach(task => {
            response += `<li>✅ <strike>${task.name}</strike>`;
            if (task.completedAt) {
                const completedDate = new Date(task.completedAt);
                response += ` <em>(Completed: ${completedDate.toLocaleDateString()})</em>`;
            }
            response += `</li>`;
        });
        if (completedTasks.length > 3) {
            response += `<li><em>... and ${completedTasks.length - 3} more completed tasks</em></li>`;
        }
        response += `</ul>`;
    }
    
    response += `<p><strong>💡 Tip:</strong> Use <code>/editTask [task name] [done/pending]</code> to update task status!</p>`;
    
    // Add urgent warnings
    if (lateTasks.length > 0) {
        response += `<p style="color: #dc3545; font-weight: bold;">⚠️ <strong>Warning:</strong> You have ${lateTasks.length} late task${lateTasks.length > 1 ? 's' : ''}! Consider prioritizing these.</p>`;
    }
    
    return response;
}

// Event system for cross-page task updates
function dispatchTaskUpdateEvent(action, taskData) {
    const event = new CustomEvent('taskUpdated', {
        detail: {
            action: action, // 'created', 'updated', 'deleted'
            task: taskData
        }
    });
    window.dispatchEvent(event);
}

// Enhanced task update function with event dispatching
function updateTaskInStorageWithEvent(taskId, updates) {
    let tasks = getTasksFromStorage();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        const oldTask = { ...tasks[taskIndex] };
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Dispatch event for other pages
        dispatchTaskUpdateEvent('updated', tasks[taskIndex]);
        
        // Update the task in the tasks page if it's open
        updateTaskInDOM(tasks[taskIndex]);
        
        // Force refresh global stats if available
        if (window.globalStatsManager) {
            window.globalStatsManager.forceRefresh();
        }
        
        return true;
    }
    return false;
}

// Enhanced task deletion function with event dispatching
function deleteTaskFromStorageWithEvent(taskId) {
    let tasks = getTasksFromStorage();
    const taskToDelete = tasks.find(task => task.id === taskId);
    const originalLength = tasks.length;
    tasks = tasks.filter(task => task.id !== taskId);
    
    if (tasks.length < originalLength) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Dispatch event for other pages
        if (taskToDelete) {
            dispatchTaskUpdateEvent('deleted', taskToDelete);
        }
        
        // Remove the task from the tasks page if it's open
        if (window.location.pathname.includes('tasks.html')) {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.remove();
            }
        }
        
        // Force refresh global stats if available
        if (window.globalStatsManager) {
            window.globalStatsManager.forceRefresh();
        }
        
        return true;
    }
    return false;
}

function loadChats() {
    if (!chatListContainer) return;
    
    chatListContainer.innerHTML = '';

    chats.forEach(item => {
        const chatElement = document.createElement('div');
        chatElement.className = 'chat-item';
        chatElement.innerHTML = `
            <i class="fas fa-comments" style="color: var(--accent-primary);"></i>
            <div class="chat-item-content">
                <div style="font-weight: 500;">${item.name}</div>
                <div style="font-size: 0.8rem; opacity: 0.7;">${item.preview || 'No preview'}</div>
            </div>
            <button class="delete-chat-btn" data-chat-id="${item.id}" title="Delete Chat">
                <i class="fas fa-trash"></i>
            </button>
        `;
        chatElement.dataset.chatId = item.id;

        // Add click event for selecting chat (excluding delete button)
        chatElement.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-chat-btn')) {
                selectChat(item.id);
            }
        });

        // Add delete functionality
        const deleteBtn = chatElement.querySelector('.delete-chat-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(item.id);
        });

        chatListContainer.appendChild(chatElement);
    });
}

// Function to delete a chat
function deleteChat(chatId) {
    if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
        // Remove from chats array
        chats = chats.filter(chat => chat.id !== chatId);
        
        // Remove from localStorage
        localStorage.removeItem(`chatHistory-${chatId}`);
        localStorage.setItem('chatList', JSON.stringify(chats));
        
        // If this was the current chat, switch to a new chat
        if (currentChatId === chatId) {
            createNewChat();
        }
        
        // Refresh the chat list
        updateChatList();
        
        console.log(`Deleted chat: ${chatId}`);
    }
}

// Alias for loadChats to maintain consistency
function updateChatList() {
    loadChats();
}

function selectChat(chatId) {
    currentChatId = chatId;
    history = localStorage.getItem(`chatHistory-${currentChatId}`) || '';
    chatMessages.innerHTML = history;
    attachAvatarClickEvent();
    chatMessages.dataset.chatId = currentChatId;
    
    // Update message count display for the loaded chat
    updateMessageCountDisplay();

    // Update URL without reloading
    historyPush(`?id=${chatId}`);
    
    // Close panels
    closeAllPanels();
    
    // Hide quick actions if there's content
    if (history.trim() && quickActions) {
        quickActions.classList.add('hidden');
    } else if (quickActions) {
        quickActions.classList.remove('hidden');
    }
}

function generateNewChatId() {
    return `${Date.now()}`;
}

function historyPush(query) {
    const newUrl = `${window.location.pathname}${query}`;
    window.history.pushState({}, '', newUrl);
}

// Load profile picture from storage
async function loadProfilePicture() {
    try {
        if (window.ImageStorage) {
            const savedPic = await window.ImageStorage.getImageWithFallback('profilePicture');
            if (savedPic) {
                setProfilePicture(savedPic);
            }
        } else {
            // Fallback to localStorage if ImageStorage is not available
            const savedPic = localStorage.getItem('profilePicture');
            if (savedPic) {
                setProfilePicture(savedPic);
            }
        }
    } catch (error) {
        console.error('Error loading profile picture:', error);
    }
}

function setProfilePicture(src) {
    // Update all avatar images for display only
    if (mainProfilePic) mainProfilePic.src = src;
    if (headerAvatar) headerAvatar.src = src;
    
    const avatars = document.querySelectorAll('.ai-avatar img');
    avatars.forEach(avatar => {
        avatar.src = src;
    });
}

function attachAvatarClickEvent() {
    const avatars = document.querySelectorAll('.ai-avatar');
    avatars.forEach(avatar => {
        avatar.addEventListener('click', () => {
            togglePanel('profile');
        });
    });
}

function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Function to update task in DOM (for tasks page integration)
function updateTaskInDOM(updatedTask) {
    const taskElement = document.querySelector(`[data-task-id="${updatedTask.id}"]`);
    if (taskElement) {
        const checkbox = taskElement.querySelector('.task-complete-checkbox');
        if (checkbox) {
            checkbox.checked = updatedTask.completed;
            taskElement.classList.toggle('completed', updatedTask.completed);
        }
        
        // Update task statistics if the function exists
        if (typeof updateTaskStatistics === 'function') {
            updateTaskStatistics();
        }
    }
}

// Enhanced task creation with better validation and feedback
function createTaskFromChat(taskData) {
    // Generate unique ID
    const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const task = {
        id: taskId,
        name: taskData.name,
        description: taskData.description || '',
        date: taskData.date || new Date().toLocaleDateString(),
        time: taskData.time,
        duration: taskData.duration,
        priority: taskData.priority || '2',
        location: taskData.location || '',
        milestone: taskData.milestone || '',
        notes: taskData.notes || '',
        tags: taskData.tags || [],
        color: taskData.color || '#6366f1',
        deadline: taskData.deadline || '',
        effort: taskData.effort || '1',
        repeatable: taskData.repeatable || false,
        repeatDays: taskData.repeatDays || [],
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    // Save to storage
    let tasks = getTasksFromStorage();
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Dispatch event for other pages
    dispatchTaskUpdateEvent('created', task);
    
    // Update DOM if tasks page is open
    if (window.location.pathname.includes('tasks.html') && typeof renderTask === 'function') {
        renderTask(task);
    }
    
    // Force refresh global stats if available
    if (window.globalStatsManager) {
        window.globalStatsManager.forceRefresh();
    }
    
    return task;
}

// Enhanced note creation for chat commands
function createNoteFromChat(noteData) {
    // Generate unique ID
    const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const note = {
        id: noteId,
        title: noteData.title,
        content: noteData.content || '',
        type: noteData.type || 'note',
        tags: noteData.tags || [],
        isFavorite: noteData.isFavorite || false,
        isPrivate: noteData.isPrivate || false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
    };
    
    // Save to storage
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.unshift(note);
    localStorage.setItem('notes', JSON.stringify(notes));
    
    // Dispatch event for notes page if it's open
    const event = new CustomEvent('noteCreated', {
        detail: { note }
    });
    window.dispatchEvent(event);
    
    return note;
}

// Header Click Functionality for Maximize Mode
// REMOVED: Duplicate sticker function - using sticker-system.js implementation instead
/*
function initializeStickerSystem() {
    const stickerToggle = document.getElementById('stickerToggle');
    const stickerSidebar = document.getElementById('stickerSidebar');
    const closeStickerBtn = document.getElementById('closeStickerBtn');
    const saveStickerBtn = document.getElementById('saveStickerBtn');
    const clearStickersBtn = document.getElementById('clearStickersBtn');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const stickerItems = document.querySelectorAll('.sticker-item');
    const uploadArea = document.getElementById('uploadArea');
    const customStickerInput = document.getElementById('customStickerInput');
    const userCoinsDisplay = document.getElementById('userCoins');
    
    // Update coins display
    updateCoinsDisplay();
    
    // Load saved stickers
    loadSavedStickers();
    
    // Show/hide sticker button based on maximize mode
    const maximizeToggle = document.getElementById('maximizeToggle');
    if (maximizeToggle) {
        const observer = new MutationObserver(() => {
            const isMaximized = document.body.classList.contains('maximize-mode');
            if (stickerToggle) {
                stickerToggle.style.display = isMaximized ? 'inline-flex' : 'none';
            }
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    
    // Sticker sidebar toggle
    if (stickerToggle) {
        stickerToggle.addEventListener('click', () => {
            stickerSystemActive = !stickerSystemActive;
            stickerSidebar.classList.toggle('active', stickerSystemActive);
            
            // Enable/disable sticker dragging
            toggleStickerDragging(stickerSystemActive);
        });
    }
    
    if (closeStickerBtn) {
        closeStickerBtn.addEventListener('click', () => {
            stickerSystemActive = false;
            stickerSidebar.classList.remove('active');
            toggleStickerDragging(false);
        });
    }
    
    // Category switching
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            switchStickerCategory(category);
        });
    });
    
    // Sticker selection
    stickerItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('locked')) return;
            
            const stickerData = item.dataset.sticker;
            const cost = item.querySelector('.sticker-cost');
            
            if (cost) {
                const price = parseInt(cost.textContent.match(/\d+/)[0]);
                if (userCoins >= price) {
                    purchaseSticker(stickerData, price);
                    item.classList.remove('locked');
                    item.querySelector('.sticker-cost').remove();
                    const statusSpan = document.createElement('span');
                    statusSpan.className = 'sticker-status unlocked';
                    statusSpan.textContent = 'Owned';
                    item.querySelector('.sticker-info').appendChild(statusSpan);
                } else {
                    showNotification('Not enough coins!', 'error');
                    return;
                }
            }
            
            addStickerToCanvas(stickerData);
        });
    });
    
    // Save layout
    if (saveStickerBtn) {
        saveStickerBtn.addEventListener('click', () => {
            saveStickerLayout();
            stickerSystemActive = false;
            stickerSidebar.classList.remove('active');
            toggleStickerDragging(false);
            showNotification('Sticker layout saved!', 'success');
        });
    }
    
    // Clear all stickers
    if (clearStickersBtn) {
        clearStickersBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove all stickers?')) {
                clearAllStickers();
                showNotification('All stickers cleared!', 'info');
            }
        });
    }
    
    // Custom sticker upload handled by sticker-system.js
}

// Switch sticker category
function switchStickerCategory(category) {
    const stickerGrid = document.getElementById('stickerGrid');
    const customUploadSection = document.querySelector('.custom-upload-section');
    
    if (category === 'custom') {
        stickerGrid.style.display = 'none';
        customUploadSection.style.display = 'block';
    } else {
        stickerGrid.style.display = 'grid';
        customUploadSection.style.display = 'none';
    }
}

// Add sticker to canvas
function addStickerToCanvas(stickerType) {
    const stickerCanvas = document.getElementById('stickerCanvas');
    const stickerElement = document.createElement('div');
    stickerElement.className = 'placed-sticker new';
    stickerElement.dataset.sticker = stickerType;
    
    // Get sticker emoji/content
    const stickerMap = {
        'heart': '❤️',
        'star': '⭐',
        'smile': '😊',
        'fire': '🔥',
        'rocket': '🚀',
        'unicorn': '🦄'
    };
    
    stickerElement.textContent = stickerMap[stickerType] || '❓';
    
    // Random initial position (avoiding chat area)
    const chatContainer = document.querySelector('.chat-container');
    const chatRect = chatContainer ? chatContainer.getBoundingClientRect() : { left: 0, width: 0 };
    
    let x, y;
    do {
        x = Math.random() * (window.innerWidth - 100);
        y = Math.random() * (window.innerHeight - 100);
    } while (x > chatRect.left - 50 && x < chatRect.left + chatRect.width + 50);
    
    stickerElement.style.left = x + 'px';
    stickerElement.style.top = y + 'px';
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'sticker-remove';
    removeBtn.innerHTML = '×';
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stickerElement.remove();
    });
    stickerElement.appendChild(removeBtn);
    
    // Add drag functionality
    addStickerDragHandlers(stickerElement);
    
    stickerCanvas.appendChild(stickerElement);
    
    // Remove 'new' class after animation
    setTimeout(() => stickerElement.classList.remove('new'), 600);
}

// Add drag handlers to sticker
function addStickerDragHandlers(sticker) {
    sticker.addEventListener('mousedown', (e) => {
        if (!stickerSystemActive) return;
        
        isDragging = true;
        currentDragSticker = sticker;
        sticker.classList.add('dragging');
        
        const rect = sticker.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !currentDragSticker) return;
        
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        
        // Constrain to viewport
        const maxX = window.innerWidth - currentDragSticker.offsetWidth;
        const maxY = window.innerHeight - currentDragSticker.offsetHeight;
        
        currentDragSticker.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        currentDragSticker.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging && currentDragSticker) {
            currentDragSticker.classList.remove('dragging');
            isDragging = false;
            currentDragSticker = null;
        }
    });
}

// Toggle sticker dragging
function toggleStickerDragging(enable) {
    const stickers = document.querySelectorAll('.placed-sticker');
    stickers.forEach(sticker => {
        if (enable) {
            sticker.classList.remove('static');
        } else {
            sticker.classList.add('static');
        }
    });
}

// Purchase sticker
function purchaseSticker(stickerType, cost) {
    userCoins -= cost;
    localStorage.setItem('userCoins', userCoins.toString());
    updateCoinsDisplay();
    showNotification(`Purchased ${stickerType} sticker!`, 'success');
}

// Update coins display
function updateCoinsDisplay() {
    const userCoinsDisplay = document.getElementById('userCoins');
    if (userCoinsDisplay && typeof userCoins !== 'undefined') {
        userCoinsDisplay.textContent = userCoins;
    } else if (userCoinsDisplay) {
        // If userCoins is undefined, get from localStorage
        const coins = parseInt(localStorage.getItem('userCoins')) || 0;
        userCoinsDisplay.textContent = coins;
    }
}

// Award coins for various activities
function awardCoinsForActivity(activityType) {
    const now = Date.now();
    const coinActivities = JSON.parse(localStorage.getItem('coinActivities')) || {};
    
    switch (activityType) {
        case 'message':
            // Award 2 coins every 5 messages
            coinActivities.messageCount = (coinActivities.messageCount || 0) + 1;
            if (coinActivities.messageCount % 5 === 0) {
                addCoins(10, 'Active chatting bonus!');
            }
            break;
            
        case 'daily':
            // Daily login bonus (20 coins)
            const lastDaily = coinActivities.lastDaily || 0;
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (now - lastDaily > oneDayMs) {
                coinActivities.lastDaily = now;
                addCoins(20, 'Daily login bonus!');
            }
            break;
            
        case 'newChat':
            // Starting a new chat (5 coins)
            addCoins(5, 'Started a new conversation!');
            break;
            
        case 'customization':
            // Using customization features (3 coins)
            const lastCustomization = coinActivities.lastCustomization || 0;
            const cooldownMs = 5 * 60 * 1000; // 5 minutes cooldown
            if (now - lastCustomization > cooldownMs) {
                coinActivities.lastCustomization = now;
                addCoins(3, 'Customization activity!');
            }
            break;
    }
    
    localStorage.setItem('coinActivities', JSON.stringify(coinActivities));
}

// Add coins function (integrates with coin system if available)
function addCoins(amount, reason = '') {
    if (window.coinSystem) {
        window.coinSystem.addCoins(amount, reason);
        userCoins = window.coinSystem.coins; // Keep local variable in sync
    } else {
        // Fallback for when coin system isn't loaded
        userCoins += amount;
        localStorage.setItem('userCoins', userCoins.toString());
        updateCoinsDisplay();
        
        if (reason) {
            showNotification(`+${amount} coins! ${reason}`, 'success');
        }
    }
}

// Development functions for testing (accessible via console)
window.giveCoins = function(amount = 100) {
    addCoins(amount, 'Developer bonus');
    console.log(`Added ${amount} coins for testing`);
};

window.resetCoins = function() {
    userCoins = 0;
    localStorage.setItem('userCoins', '0');
    updateCoinsDisplay();
    if (window.coinSystem) {
        window.coinSystem.coins = 0;
        window.coinSystem.saveCoins();
    }
    console.log('Coins reset to 0');
};

window.showCoinInfo = function() {
    console.log(`Current coins: ${userCoins}`);
    console.log(`Coin system available: ${!!window.coinSystem}`);
    const activities = JSON.parse(localStorage.getItem('coinActivities')) || {};
    console.log('Activities:', activities);
};

// Save sticker layout
function saveStickerLayout() {
    const stickers = document.querySelectorAll('.placed-sticker');
    placedStickers = [];
    
    stickers.forEach(sticker => {
        placedStickers.push({
            type: sticker.dataset.sticker,
            content: sticker.textContent.replace('×', ''), // Remove the × from remove button
            x: parseInt(sticker.style.left),
            y: parseInt(sticker.style.top)
        });
    });
    
    localStorage.setItem('placedStickers', JSON.stringify(placedStickers));
}

// Load saved stickers
function loadSavedStickers() {
    const stickerCanvas = document.getElementById('stickerCanvas');
    
    placedStickers.forEach(stickerData => {
        const stickerElement = document.createElement('div');
        stickerElement.className = 'placed-sticker static';
        stickerElement.dataset.sticker = stickerData.type;
        stickerElement.textContent = stickerData.content;
        stickerElement.style.left = stickerData.x + 'px';
        stickerElement.style.top = stickerData.y + 'px';
        
        // Add remove button (hidden when static)
        const removeBtn = document.createElement('button');
        removeBtn.className = 'sticker-remove';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stickerElement.remove();
        });
        stickerElement.appendChild(removeBtn);
        
        addStickerDragHandlers(stickerElement);
        stickerCanvas.appendChild(stickerElement);
    });
}

// Clear all stickers
function clearAllStickers() {
    const stickerCanvas = document.getElementById('stickerCanvas');
    stickerCanvas.innerHTML = '';
    placedStickers = [];
    localStorage.removeItem('placedStickers');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10001;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
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

// Listen for profile updates
    window.addEventListener('profileUpdated', (event) => {
        console.log('Profile updated event received:', event.detail);
        const { profileType, field } = event.detail;

        // Always update headers on any profile change
        updateChatHeader();
        if (isMaximizeMode) {
            updateMaximizeHeaders();
        }

        // Handle specific updates for Remi's profile
        if (profileType === 'remi' && (field === 'name' || field === 'picture' || field === 'description')) {
            // Update page title if name changed
            if (field === 'name') {
                console.log('Updating page title for name change');
                updatePageTitle();
            }
            
            // Update the welcome message if it's currently displayed
            const welcomeMessage = document.querySelector('.welcome-message');
            if (welcomeMessage) {
                displayWelcomeMessage();
            }
        }
    });    // Listen for stats updates to refresh headers
    window.addEventListener('statsUpdated', () => {
        if (isMaximizeMode) {
            updateProgressBars();
            updateMoodAndStatus();
        }
    });
    
    // Listen for profile updates to refresh headers
    window.addEventListener('profileUpdated', (event) => {
        const { field } = event.detail;
        
        // Update chat header
        updateChatHeader();
        
        // Update maximize headers if in maximize mode
        if (isMaximizeMode) {
            updateMaximizeHeaders();
        }
    });
*/

// ===== COIN SYSTEM FUNCTIONS =====

// Award coins for various activities
function awardCoinsForActivity(activityType) {
    const now = Date.now();
    const coinActivities = JSON.parse(localStorage.getItem('coinActivities')) || {};
    
    switch (activityType) {
        case 'message':
            // Award 2 coins every 5 messages
            coinActivities.messageCount = (coinActivities.messageCount || 0) + 1;
            if (coinActivities.messageCount % 5 === 0) {
                addCoins(10, 'Active chatting bonus!');
            }
            break;
            
        case 'daily':
            // Daily login bonus (20 coins)
            const lastDaily = coinActivities.lastDaily || 0;
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (now - lastDaily > oneDayMs) {
                coinActivities.lastDaily = now;
                addCoins(20, 'Daily login bonus!');
            }
            break;
            
        case 'newChat':
            // Starting a new chat (5 coins)
            addCoins(5, 'Started a new conversation!');
            break;
            
        case 'customization':
            // Using customization features (3 coins)
            const lastCustomization = coinActivities.lastCustomization || 0;
            const cooldownMs = 5 * 60 * 1000; // 5 minutes cooldown
            if (now - lastCustomization > cooldownMs) {
                coinActivities.lastCustomization = now;
                addCoins(3, 'Customization activity!');
            }
            break;
    }
    
    localStorage.setItem('coinActivities', JSON.stringify(coinActivities));
}

// Add coins function (integrates with coin system if available)
function addCoins(amount, reason = '') {
    if (window.coinSystem) {
        window.coinSystem.addCoins(amount, reason);
        userCoins = window.coinSystem.coins; // Keep local variable in sync
    } else {
        // Fallback for when coin system isn't loaded
        userCoins += amount;
        localStorage.setItem('userCoins', userCoins.toString());
        updateCoinsDisplay();
        
        if (reason) {
            showNotification(`+${amount} coins! ${reason}`, 'success');
        }
    }
}

// Update coins display
function updateCoinsDisplay() {
    const userCoinsDisplay = document.getElementById('userCoins');
    if (userCoinsDisplay && typeof userCoins !== 'undefined') {
        userCoinsDisplay.textContent = userCoins;
    } else if (userCoinsDisplay) {
        // If userCoins is undefined, get from localStorage
        const coins = parseInt(localStorage.getItem('userCoins')) || 0;
        userCoinsDisplay.textContent = coins;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10001;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
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

// Development functions for testing (accessible via console)
window.giveCoins = function(amount = 100) {
    addCoins(amount, 'Developer bonus');
    console.log(`Added ${amount} coins for testing`);
};

window.resetCoins = function() {
    userCoins = 0;
    localStorage.setItem('userCoins', '0');
    updateCoinsDisplay();
    if (window.coinSystem) {
        window.coinSystem.coins = 0;
        window.coinSystem.saveCoins();
    }
    console.log('Coins reset to 0');
};

window.showCoinInfo = function() {
    console.log(`Current coins: ${userCoins}`);
    console.log(`Coin system available: ${!!window.coinSystem}`);
    const activities = JSON.parse(localStorage.getItem('coinActivities')) || {};
    console.log('Activities:', activities);
};

// Header Click Functionality for Maximize Mode
function initializeHeaderClickHandlers() {
    // Add click handlers to all maximize headers
    const maximizeHeaders = document.querySelectorAll('.maximize-header');
    
    maximizeHeaders.forEach(header => {
        // Add click handler to the entire header
        header.addEventListener('click', (e) => {
            // Prevent event bubbling
            e.stopPropagation();
            
            // Toggle expanded state
            header.classList.toggle('expanded');
            
            // Add a subtle animation feedback
            header.style.transform = 'scale(0.98)';
            setTimeout(() => {
                header.style.transform = '';
            }, 150);
        });
        
        // Add hover effect for better UX
        header.addEventListener('mouseenter', () => {
            if (!header.classList.contains('expanded')) {
                header.style.boxShadow = '0 8px 32px rgba(0, 245, 255, 0.2)';
            }
        });
        
        header.addEventListener('mouseleave', () => {
            if (!header.classList.contains('expanded')) {
                header.style.boxShadow = '';
            }
        });
    });
    
    // Close all headers when clicking outside
    document.addEventListener('click', (e) => {
        const isMaximizeMode = document.body.classList.contains('maximize-mode');
        if (isMaximizeMode) {
            const clickedHeader = e.target.closest('.maximize-header');
            if (!clickedHeader) {
                // Close all expanded headers
                maximizeHeaders.forEach(header => {
                    header.classList.remove('expanded');
                    header.style.boxShadow = '';
                });
            }
        }
    });
    
    // Header click handlers initialized silently
    // console.log('Header click handlers initialized');
}

// Global Key Press Handler
function handleGlobalKeyPress(event) {
    // Handle Escape key
    if (event.key === 'Escape') {
        if (isMaximizeMode) {
            exitMaximizeMode();
        }
    }
}

// Toggle Sticker Panel Function
function toggleStickerPanel() {
    if (typeof window.toggleStickerSystem === 'function') {
        window.toggleStickerSystem();
    } else {
        console.warn('Sticker system not loaded');
    }
}

// Initialize Maximize Mode
function initializeMaximizeMode() {
    if (!maximizeToggle) return;

    // Show/hide sticker button only in maximize mode
    function updateStickerButtonVisibility() {
        const isMaximized = document.body.classList.contains('maximize-mode');
        if (maximizeStickerPanel) {
            maximizeStickerPanel.style.display = isMaximized ? 'block' : 'none';
        }
    }
    updateStickerButtonVisibility();

    // Listen for maximize mode changes
    const observer = new MutationObserver(updateStickerButtonVisibility);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Toggle sticker sidebar when button clicked
    if (maximizeStickerToggle && stickerSidebar) {
        maximizeStickerToggle.addEventListener('click', () => {
            stickerSidebar.classList.toggle('active');
        });
    }

    // Maximize mode initialized silently
    // console.log('Maximize mode initialized');
}

// Update Progress Bars
function updateProgressBars() {
    const stats = window.globalStatsManager ? window.globalStatsManager.getStats() : null;
    
    // Update relationship progress
    const relationshipBar = document.querySelector('.progress-fill-max.relationship');
    if (relationshipBar && stats?.relationship) {
        const level = stats.relationship.level || 65;
        relationshipBar.style.width = level + '%';
        
        const progressText = document.querySelector('.ai-header .progress-text');
        if (progressText) {
            const levelName = level >= 90 ? 'Soulmate' : 
                            level >= 70 ? 'Best Friend' : 
                            level >= 50 ? 'Close Friend' : 
                            level >= 30 ? 'Friend' : 'Acquaintance';
            progressText.textContent = `${levelName} Level - ${level}%`;
        }
    }
    
    // Update productivity progress
    const productivityBar = document.querySelector('.progress-fill-max.productivity');
    if (productivityBar && stats?.productivity) {
        const score = stats.productivity.overall || 78;
        productivityBar.style.width = score + '%';
        
        const progressText = document.querySelector('.user-header .progress-text');
        if (progressText) {
            const performance = score >= 90 ? 'Peak Performance' :
                              score >= 75 ? 'High Performance' :
                              score >= 60 ? 'Good Performance' :
                              score >= 40 ? 'Moderate Performance' : 'Getting Started';
            progressText.textContent = `${performance} - ${score}%`;
        }
    }
}

// Maximize Mode Functions
function toggleMaximizeMode() {
    if (isMaximizeMode) {
        exitMaximizeMode();
    } else {
        enterMaximizeMode();
    }
}

function enterMaximizeMode() {
    isMaximizeMode = true;
    document.body.classList.add('maximize-mode');
    mainContent.classList.add('maximize-mode');
    
    // Update toggle button
    const toggleIcon = maximizeToggle.querySelector('i');
    toggleIcon.className = 'fas fa-compress';
    maximizeToggle.title = 'Exit Maximize Mode';
    
    // Hide sidebar and topbar
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar-menu');
    if (sidebar) sidebar.style.display = 'none';
    if (topbar) topbar.style.display = 'none';
    
    // Center the chat input
    const chatInputContainer = document.querySelector('.chat-input-container');
    if (chatInputContainer) {
        setTimeout(() => {
            chatInputContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'end' 
            });
        }, 300);
    }
    
    // REMOVED: Particle animation (performance optimization)
    // createParticles();
    
    // Update headers with current data
    updateMaximizeHeaders();
    
    // Add enter animation
    document.body.style.overflow = 'hidden';
    
    // Auto-hide cursor after inactivity
    startCursorAutoHide();
    
    console.log('Entered maximize mode');
}

function exitMaximizeMode() {
    isMaximizeMode = false;
    document.body.classList.remove('maximize-mode');
    mainContent.classList.remove('maximize-mode');
    
    // Update toggle button
    const toggleIcon = maximizeToggle.querySelector('i');
    toggleIcon.className = 'fas fa-expand';
    maximizeToggle.title = 'Toggle Maximize Mode';
    
    // Show sidebar and topbar
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar-menu');
    if (sidebar) sidebar.style.display = '';
    if (topbar) topbar.style.display = '';
    
    // Reset chat input positioning
    const chatInputContainer = document.querySelector('.chat-input-container');
    if (chatInputContainer) {
        chatInputContainer.style.position = '';
        chatInputContainer.style.bottom = '';
        chatInputContainer.style.left = '';
        chatInputContainer.style.transform = '';
        chatInputContainer.style.width = '';
        chatInputContainer.style.maxWidth = '';
    }
    
    // REMOVED: Particle animation (performance optimization)
    // clearParticles();
    
    // Restore normal overflow
    document.body.style.overflow = '';
    
    // Stop cursor auto-hide
    stopCursorAutoHide();
    
    console.log('Exited maximize mode');
}

function updateMaximizeHeaders() {
    const profiles = getCurrentProfiles();
    
    // Update AI header - with null checks
    const aiNameEl = document.querySelector('.ai-header [data-remi-name]');
    const aiAvatarEl = document.querySelector('.ai-header [data-remi-avatar]');
    
    if (aiNameEl && aiAvatarEl) {
        const remiName = profiles.remi?.name || 'Remi';
        const remiPicture = profiles.remi?.picture || 'pfp/Remi-pfp.png';
        
        aiNameEl.textContent = remiName;
        aiAvatarEl.src = remiPicture;
    }
    
    // Update user header - with null checks
    const userNameEl = document.querySelector('.user-header [data-user-name]');
    const userAvatarEl = document.querySelector('.user-header [data-user-avatar]');
    
    if (userNameEl && userAvatarEl) {
        const userName = profiles.user?.name || 'Student';
        const userPicture = profiles.user?.picture || 'pfp/Google_2015_logo.svg.png';
        
        userNameEl.textContent = userName;
        userAvatarEl.src = userPicture;
    }
    
    // Update mood and status based on current stats
    updateMoodAndStatus();
}

function updateMoodAndStatus() {
    const stats = window.globalStatsManager ? window.globalStatsManager.getStats() : null;
    
    // AI mood based on relationship
    const relationshipLevel = stats?.relationship?.level || 0;
    const remiMoodElement = document.getElementById('remiMood');
    const remiStatusIndicator = document.querySelector('.ai-header .status-indicator-max');
    
    if (relationshipLevel >= 90) {
        remiMoodElement.textContent = 'Loving & Devoted';
        remiStatusIndicator.className = 'status-indicator-max excited';
    } else if (relationshipLevel >= 70) {
        remiMoodElement.textContent = 'Caring & Supportive';
        remiStatusIndicator.className = 'status-indicator-max happy';
    } else if (relationshipLevel >= 40) {
        remiMoodElement.textContent = 'Friendly & Helpful';
        remiStatusIndicator.className = 'status-indicator-max happy';
    } else {
        remiMoodElement.textContent = 'Professional & Ready';
        remiStatusIndicator.className = 'status-indicator-max focused';
    }
    
    // User mood based on productivity
    const productivityScore = stats?.productivity?.overall || 0;
    const userMoodElement = document.getElementById('userMood');
    if (userMoodElement) {
        if (productivityScore >= 80) {
            userMoodElement.textContent = 'High Energy & Focused';
        } else if (productivityScore >= 60) {
            userMoodElement.textContent = 'Focused & Learning';
        } else if (productivityScore >= 40) {
            userMoodElement.textContent = 'Making Progress';
        } else {
            userMoodElement.textContent = 'Getting Started';
        }
    }
}

// ===== MOBILE OPTIMIZATION AND TOUCH ENHANCEMENTS =====

// Touch event handlers for mobile optimization
if (isMobile()) {
    // Enable mobile optimizations silently
    // console.log('Mobile device detected - enabling mobile optimizations');
    
    // Prevent iOS zoom on input focus
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    // Handle mobile keyboard appearance
    let originalViewportHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight;
        const heightDifference = originalViewportHeight - currentHeight;
        
        // If keyboard is likely open (height reduced significantly)
        if (heightDifference > 150) {
            document.body.classList.add('keyboard-open');
            
            // Ensure input is visible
            if (inputField && document.activeElement === inputField) {
                setTimeout(() => {
                    inputField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        } else {
            document.body.classList.remove('keyboard-open');
        }
    });
    
    // Touch-friendly message interactions
    function addTouchFeedback(element) {
        if (!element) return;
        
        element.addEventListener('touchstart', function(e) {
            this.classList.add('touch-active');
        }, { passive: true });
        
        element.addEventListener('touchend', function(e) {
            this.classList.add('touch-feedback');
            setTimeout(() => {
                this.classList.remove('touch-active', 'touch-feedback');
            }, 150);
        }, { passive: true });
        
        element.addEventListener('touchcancel', function(e) {
            this.classList.remove('touch-active');
        }, { passive: true });
    }
    
    // Apply touch feedback to interactive elements
    document.querySelectorAll('.send-message-button, .attachment-btn, .emoji-btn, .quick-action-card, .chat-message').forEach(addTouchFeedback);
    
    // Swipe gestures for panels
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture();
    }, { passive: true });
    
    function handleSwipeGesture() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const minSwipeDistance = 50;
        
        // Horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                // Swipe right - close right panels
                if (chatListContainer && chatListContainer.classList.contains('show')) {
                    closeChatHistory();
                }
                if (profileContainer && profileContainer.classList.contains('visible')) {
                    closeProfile();
                }
            } else {
                // Swipe left - could open panels or perform other actions
                // Currently no left-swipe actions defined
            }
        }
    }
    
    // Enhanced scroll behavior for mobile
    function optimizeScrolling() {
        if (chatMessages) {
            chatMessages.style.webkitOverflowScrolling = 'touch';
            chatMessages.style.scrollBehavior = 'smooth';
        }
        
        // Auto-scroll to bottom with better mobile handling
        const originalScrollToBottom = scrollToBottom;
        window.scrollToBottom = function() {
            if (chatMessages) {
                // Use requestAnimationFrame for smooth mobile scrolling
                requestAnimationFrame(() => {
                    chatMessages.scrollTo({
                        top: chatMessages.scrollHeight,
                        behavior: 'smooth'
                    });
                });
            }
        };
    }
    
    optimizeScrolling();
    
    // Mobile-specific input handling
    if (inputField) {
        // Prevent double-tap zoom on input
        inputField.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.focus();
        });
        
        // Better mobile typing experience
        inputField.addEventListener('input', function() {
            // Auto-resize input on mobile
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
        
        // Handle Enter key properly on mobile
        inputField.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (this.value.trim()) {
                    sendMessage();
                }
            }
        });
    }
    
    // Mobile-optimized panel handling
    function optimizePanelsForMobile() {
        // Make panels full-screen on mobile
        if (chatListContainer) {
            chatListContainer.style.width = '100vw';
            chatListContainer.style.right = '-100vw';
        }
        
        if (profileContainer) {
            profileContainer.style.width = '100vw';
            profileContainer.style.right = '-100vw';
        }
        
        // Add overlay for mobile panels
        const overlay = document.createElement('div');
        overlay.className = 'mobile-panel-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 150;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(overlay);
        
        // Show overlay when panels are open
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isAnyPanelOpen = chatListContainer?.classList.contains('show') || 
                                         profileContainer?.classList.contains('visible');
                    
                    if (isAnyPanelOpen) {
                        overlay.style.opacity = '1';
                        overlay.style.visibility = 'visible';
                        document.body.style.overflow = 'hidden';
                    } else {
                        overlay.style.opacity = '0';
                        overlay.style.visibility = 'hidden';
                        document.body.style.overflow = '';
                    }
                }
            });
        });
        
        if (chatListContainer) observer.observe(chatListContainer, { attributes: true });
        if (profileContainer) observer.observe(profileContainer, { attributes: true });
        
        // Close panels when clicking overlay
        overlay.addEventListener('click', function() {
            if (chatListContainer?.classList.contains('show')) closeChatHistory();
            if (profileContainer?.classList.contains('visible')) closeProfile();
        });
    }
    
    optimizePanelsForMobile();
    
    // Haptic feedback for supported devices
    function triggerHapticFeedback(intensity = 'light') {
        if (navigator.vibrate) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30, 10, 30]
            };
            navigator.vibrate(patterns[intensity] || patterns.light);
        }
    }
    
    // Add haptic feedback to key interactions
    if (sendBtn) {
        sendBtn.addEventListener('click', () => triggerHapticFeedback('light'));
    }
    
    // Handle device orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            originalViewportHeight = window.innerHeight;
            optimizeScrolling();
            if (chatMessages) scrollToBottom();
        }, 100);
    });
    
    // Prevent context menu on long press for better mobile UX
    document.addEventListener('contextmenu', function(e) {
        if (e.target.closest('.chat-message, .send-message-button, .attachment-btn, .emoji-btn')) {
            e.preventDefault();
        }
    });
    
    // Mobile optimizations initialized silently
    // console.log('Mobile optimizations initialized successfully');
}

// Add mobile-specific CSS classes
document.addEventListener('DOMContentLoaded', function() {
    if (isMobile()) {
        document.body.classList.add('mobile-device');
        
        // Add touch-friendly styles
        const style = document.createElement('style');
        style.textContent = `
            .mobile-device .touch-active {
                transform: scale(0.98);
                opacity: 0.8;
            }
            
            .mobile-device .touch-feedback {
                transform: scale(1.02);
                transition: transform 0.1s ease;
            }
            
            .mobile-device.keyboard-open .chat-input-container {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 1000;
            }
            
            .mobile-device .chat-message {
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
            }
            
            .mobile-device .message-input {
                font-size: 16px !important;
                transform: translateZ(0);
                -webkit-transform: translateZ(0);
            }
        `;
        document.head.appendChild(style);
    }
});

// ===== MOBILE TOOLBAR FUNCTIONALITY =====

function initializeMobileToolbar() {
    if (!isMobile()) return;
    
    // Initially hide toolbar on mobile
    hideMobileToolbar();
    
    // Set up auto-hide functionality
    setupMobileToolbarAutoHide();
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (isMobile()) {
                hideMobileToolbar();
            } else {
                showMobileToolbar();
            }
        }, 100);
    });
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (isMobile()) {
            hideMobileToolbar();
        } else {
            showMobileToolbar();
        }
    });
}

function createMobileToolbarTrigger() {
    // Check if trigger already exists
    if (document.getElementById('mobileToolbarTrigger')) return;
    
    const trigger = document.createElement('button');
    trigger.id = 'mobileToolbarTrigger';
    trigger.innerHTML = '<i class="fas fa-tools"></i>';
    trigger.className = 'mobile-toolbar-trigger';
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .mobile-toolbar-trigger {
            position: fixed;
            bottom: 70px; /* Reduced for smaller input area */
            right: 1rem;
            width: 50px;
            height: 50px;
            background: var(--glass-bg);
            backdrop-filter: blur(15px);
            border: 1px solid var(--glass-border);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 999;
            transition: all var(--transition-normal);
            color: var(--text-primary);
            font-size: 1.2rem;
            box-shadow: var(--glass-shadow);
            opacity: 0.8;
        }
        
        .mobile-toolbar-trigger:hover {
            background: var(--accent-primary);
            color: white;
            transform: scale(1.1);
            opacity: 1;
            box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4);
        }
        
        .mobile-toolbar-trigger:active {
            transform: scale(0.95);
        }
        
        .mobile-toolbar-trigger.hidden {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
        }
        
        .mobile-chat-toolbar.hidden {
            opacity: 0;
            pointer-events: none;
            transform: translateY(20px);
        }
        
        .mobile-chat-toolbar.visible {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }
        
        @media (min-width: 769px) {
            .mobile-toolbar-trigger {
                display: none;
            }
        }
        
        @media (max-width: 480px) {
            .mobile-toolbar-trigger {
                width: 44px;
                height: 44px;
                bottom: 60px; /* Reduced for smaller input area */
                right: 0.5rem;
                font-size: 1.1rem;
            }
        }
        
        @media (max-width: 375px) {
            .mobile-toolbar-trigger {
                width: 40px;
                height: 40px;
                bottom: 55px; /* Reduced for smaller input area */
                right: 0.3rem;
                font-size: 1rem;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add click handler
    trigger.addEventListener('click', toggleMobileToolbar);
    
    // Insert into page
    document.body.appendChild(trigger);
}

function toggleMobileToolbar() {
    const toolbar = document.querySelector('.mobile-chat-toolbar');
    const trigger = document.getElementById('mobileToolbarTrigger');
    
    if (!toolbar) return;
    
    if (isMobileToolbarVisible) {
        hideMobileToolbar();
    } else {
        showMobileToolbar();
    }
}

function showMobileToolbar() {
    const toolbar = document.querySelector('.mobile-chat-toolbar');
    const trigger = document.getElementById('mobileToolbarTrigger');
    
    if (!toolbar) return;
    
    isMobileToolbarVisible = true;
    toolbar.classList.remove('hidden');
    toolbar.classList.add('visible');
    
    if (trigger) {
        trigger.classList.add('hidden');
    }
    
    // Auto-hide after 5 seconds of inactivity
    clearTimeout(mobileToolbarTimeout);
    mobileToolbarTimeout = setTimeout(() => {
        if (isMobile()) {
            hideMobileToolbar();
        }
    }, 5000);
}

function hideMobileToolbar() {
    const toolbar = document.querySelector('.mobile-chat-toolbar');
    const trigger = document.getElementById('mobileToolbarTrigger');
    
    if (!toolbar) return;
    
    isMobileToolbarVisible = false;
    toolbar.classList.remove('visible');
    toolbar.classList.add('hidden');
    
    if (trigger) {
        trigger.classList.remove('hidden');
    }
    
    clearTimeout(mobileToolbarTimeout);
}

function setupMobileToolbarAutoHide() {
    // Show toolbar when user interacts with chat
    const chatInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    
    if (chatInput) {
        chatInput.addEventListener('focus', () => {
            if (isMobile()) showMobileToolbar();
        });
        
        chatInput.addEventListener('blur', () => {
            if (isMobile()) {
                setTimeout(() => hideMobileToolbar(), 3000);
            }
        });
    }
    
    // Hide toolbar when scrolling
    if (chatMessages) {
        let scrollTimeout;
        chatMessages.addEventListener('scroll', () => {
            if (isMobile() && isMobileToolbarVisible) {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    hideMobileToolbar();
                }, 1000);
            }
        });
    }
}

// Show toolbar on touch
document.addEventListener('touchstart', () => {
    if (isMobile() && !isMobileToolbarVisible) {
        clearTimeout(mobileToolbarTimeout);
        mobileToolbarTimeout = setTimeout(() => {
            const trigger = document.getElementById('mobileToolbarTrigger');
            if (trigger && !trigger.classList.contains('hidden')) {
                // Briefly show trigger
                trigger.style.opacity = '1';
                setTimeout(() => {
                    trigger.style.opacity = '0.8';
                }, 2000);
            }
        }, 500);
    }
});