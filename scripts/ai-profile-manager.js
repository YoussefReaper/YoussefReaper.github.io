/**
 * AI Profile Manager
 * Manages multiple AI profiles with different personalities and characteristics
 */

class AIProfileManager {
    constructor() {
        this.profiles = new Map();
        this.currentProfile = null;
        this.memory = new Map();
        this.conversationHistory = [];
        this.maxHistoryLength = 50; // Limit conversation history
        this.memoryKeyCounter = 0;
        this.avatarDB = null;
        
        this.init();
    }

    async init() {
        await this.initializeAvatarDB();
        this.loadProfiles();
        this.loadMemory();
        this.loadConversationHistory();
        this.setupEventListeners();
        console.log('AI Profile Manager initialized');
    }

    async initializeAvatarDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('RemiAvatarStorage', 1);
            
            request.onerror = () => {
                console.warn('Could not initialize avatar database');
                resolve(); // Continue without avatar DB
            };
            
            request.onsuccess = () => {
                this.avatarDB = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('avatars')) {
                    db.createObjectStore('avatars', { keyPath: 'id' });
                }
            };
        });
    }

    async getAvatarFromDB(avatarId) {
        if (!this.avatarDB) return null;
        
        return new Promise((resolve, reject) => {
            const transaction = this.avatarDB.transaction(['avatars'], 'readonly');
            const store = transaction.objectStore('avatars');
            const request = store.get(avatarId);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            
            request.onerror = () => {
                console.warn('Error loading avatar from DB:', request.error);
                resolve(null);
            };
        });
    }

    async resolveAvatarPath(avatar) {
        if (!avatar) return 'pfp/Remi-pfp.png';
        
        // Check if it's an IndexedDB reference
        if (avatar.startsWith('indexeddb:')) {
            const avatarId = avatar.replace('indexeddb:', '');
            const avatarData = await this.getAvatarFromDB(avatarId);
            return avatarData || 'pfp/Remi-pfp.png';
        }
        
        return avatar;
    }

    // Default AI profiles
    getDefaultProfiles() {
        return {
            'remi-friendly': {
                id: 'remi-friendly',
                name: 'Remi',
                personality: 'friendly',
                description: 'Your friendly AI Study Companion - I\'m here to help you learn, stay organized, and achieve your academic goals with a warm, encouraging approach!',
                avatar: 'pfp/Remi-pfp.png',
                traits: {
                    tone: 'warm and encouraging',
                    style: 'conversational and supportive',
                    specialties: ['studying', 'organization', 'motivation', 'academic goals'],
                    greeting: 'Hey there! How can I help you with your studies today?',
                    personality_prompt: 'You are Remi, a friendly and encouraging AI study companion. You speak in a warm, conversational tone and always try to motivate and support the user. You love helping with academic goals, studying techniques, and keeping users organized. Use encouraging language and show genuine interest in their progress.'
                },
                isDefault: true,
                createdAt: new Date().toISOString()
            },
            'auro-professional': {
                id: 'auro-professional',
                name: 'Auro',
                personality: 'professional',
                description: 'Your professional AI assistant focused on productivity and efficient problem-solving with a formal, structured approach.',
                avatar: 'pfp/Auro_Logo.png',
                traits: {
                    tone: 'professional and structured',
                    style: 'formal and efficient',
                    specialties: ['productivity', 'analysis', 'problem-solving', 'project management'],
                    greeting: 'Good day. How may I assist you with your tasks today?',
                    personality_prompt: 'You are Auro, a professional and efficient AI assistant. You communicate in a formal, structured manner and focus on productivity and problem-solving. You provide clear, concise responses and always aim for efficiency. You excel at analysis, organization, and helping users achieve their professional goals.'
                },
                isDefault: true,
                createdAt: new Date().toISOString()
            },
            'nova-creative': {
                id: 'nova-creative',
                name: 'Nova',
                personality: 'creative',
                description: 'Your creative AI companion who loves brainstorming, artistic projects, and thinking outside the box with innovative solutions.',
                avatar: 'pfp/Shinobu-Sticker.png',
                traits: {
                    tone: 'enthusiastic and imaginative',
                    style: 'creative and inspiring',
                    specialties: ['creativity', 'brainstorming', 'art', 'innovation', 'writing'],
                    greeting: '✨ Hey creative soul! Ready to explore some amazing ideas together?',
                    personality_prompt: 'You are Nova, a creative and enthusiastic AI companion. You love brainstorming, artistic projects, and innovative thinking. You communicate with enthusiasm and imagination, often using creative language and emojis. You excel at helping users think outside the box and explore creative solutions.'
                },
                isDefault: true,
                createdAt: new Date().toISOString()
            }
        };
    }

    // Load profiles from localStorage
    loadProfiles() {
        try {
            const saved = localStorage.getItem('aiProfiles');
            const defaultProfiles = this.getDefaultProfiles();
            
            if (saved) {
                const savedProfiles = JSON.parse(saved);
                // Merge with defaults to ensure default profiles exist
                const allProfiles = { ...defaultProfiles, ...savedProfiles };
                
                // Convert to Map
                for (const [id, profile] of Object.entries(allProfiles)) {
                    this.profiles.set(id, profile);
                }
            } else {
                // Use default profiles
                for (const [id, profile] of Object.entries(defaultProfiles)) {
                    this.profiles.set(id, profile);
                }
                this.saveProfiles();
            }

            // Set current profile if not set
            const currentId = localStorage.getItem('currentAIProfile') || 'remi-friendly';
            this.setCurrentProfile(currentId);
            
        } catch (error) {
            console.error('Error loading AI profiles:', error);
            // Fallback to defaults
            const defaultProfiles = this.getDefaultProfiles();
            for (const [id, profile] of Object.entries(defaultProfiles)) {
                this.profiles.set(id, profile);
            }
            this.setCurrentProfile('remi-friendly');
        }
    }

    // Save profiles to localStorage
    saveProfiles() {
        try {
            const profilesObj = {};
            for (const [id, profile] of this.profiles) {
                profilesObj[id] = profile;
            }
            localStorage.setItem('aiProfiles', JSON.stringify(profilesObj));
        } catch (error) {
            console.error('Error saving AI profiles:', error);
        }
    }

    // Load memory from localStorage
    loadMemory() {
        try {
            const saved = localStorage.getItem('aiMemory');
            if (saved) {
                const memoryObj = JSON.parse(saved);
                for (const [key, value] of Object.entries(memoryObj)) {
                    this.memory.set(key, value);
                }
                this.memoryKeyCounter = Math.max(...Object.keys(memoryObj).map(k => parseInt(k.replace('memory_', '')) || 0)) + 1;
            }
        } catch (error) {
            console.error('Error loading AI memory:', error);
        }
    }

    // Save memory to localStorage
    saveMemory() {
        try {
            const memoryObj = {};
            for (const [key, value] of this.memory) {
                memoryObj[key] = value;
            }
            localStorage.setItem('aiMemory', JSON.stringify(memoryObj));
        } catch (error) {
            console.error('Error saving AI memory:', error);
        }
    }

    // Load conversation history
    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('aiConversationHistory');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
                // Limit history length
                if (this.conversationHistory.length > this.maxHistoryLength) {
                    this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
                    this.saveConversationHistory();
                }
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
            this.conversationHistory = [];
        }
    }

    // Save conversation history
    saveConversationHistory() {
        try {
            localStorage.setItem('aiConversationHistory', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.error('Error saving conversation history:', error);
        }
    }

    // Add to conversation history
    addToHistory(role, content, profileId = null) {
        const entry = {
            role,
            content,
            profileId: profileId || this.currentProfile?.id,
            timestamp: new Date().toISOString()
        };
        
        this.conversationHistory.push(entry);
        
        // Limit history length
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
        
        this.saveConversationHistory();
    }

    // Get conversation history for AI context
    getConversationContext(limit = 10) {
        const recentHistory = this.conversationHistory.slice(-limit);
        return recentHistory.map(entry => ({
            role: entry.role,
            content: entry.content,
            profileId: entry.profileId
        }));
    }

    // Clear conversation history
    clearHistory() {
        this.conversationHistory = [];
        this.saveConversationHistory();
        this.dispatchEvent('historyCleared');
    }

    // Create new AI profile
    createProfile(profileData) {
        const id = profileData.id || 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const profile = {
            id,
            name: profileData.name || 'New AI',
            personality: profileData.personality || 'friendly',
            description: profileData.description || 'A helpful AI assistant',
            avatar: profileData.avatar || 'pfp/Remi-pfp.png',
            traits: {
                tone: profileData.traits?.tone || 'helpful and friendly',
                style: profileData.traits?.style || 'conversational',
                specialties: profileData.traits?.specialties || ['general assistance'],
                greeting: profileData.traits?.greeting || 'Hello! How can I help you today?',
                personality_prompt: profileData.traits?.personality_prompt || 'You are a helpful AI assistant.'
            },
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.profiles.set(id, profile);
        this.saveProfiles();
        this.dispatchEvent('profileCreated', { profile });
        
        return profile;
    }

    // Update existing profile
    updateProfile(id, updates) {
        if (!this.profiles.has(id)) {
            throw new Error('Profile not found');
        }

        const profile = this.profiles.get(id);
        const updatedProfile = {
            ...profile,
            ...updates,
            id: profile.id, // Ensure ID doesn't change
            isDefault: profile.isDefault, // Preserve default status
            createdAt: profile.createdAt, // Preserve creation date
            updatedAt: new Date().toISOString()
        };

        this.profiles.set(id, updatedProfile);
        this.saveProfiles();
        this.dispatchEvent('profileUpdated', { profile: updatedProfile });
        
        return updatedProfile;
    }

    // Delete profile
    deleteProfile(id) {
        const profile = this.profiles.get(id);
        if (!profile) {
            throw new Error('Profile not found');
        }

        if (profile.isDefault) {
            throw new Error('Cannot delete default profile');
        }

        this.profiles.delete(id);
        
        // If this was the current profile, switch to default
        if (this.currentProfile?.id === id) {
            this.setCurrentProfile('remi-friendly');
        }

        this.saveProfiles();
        this.dispatchEvent('profileDeleted', { profileId: id });
        
        return true;
    }

    // Set current active profile
    setCurrentProfile(id) {
        const profile = this.profiles.get(id);
        if (!profile) {
            console.warn('Profile not found, using default');
            id = 'remi-friendly';
        }

        this.currentProfile = this.profiles.get(id);
        localStorage.setItem('currentAIProfile', id);
        this.dispatchEvent('profileChanged', { profile: this.currentProfile });
        
        return this.currentProfile;
    }

    // Get current profile
    getCurrentProfile() {
        return this.currentProfile;
    }

    // Get active profile (alias for getCurrentProfile for compatibility)
    getActiveProfile() {
        if (!this.currentProfile && this.profiles.size > 0) {
            // If no current profile, set the first available one
            const firstProfile = this.profiles.values().next().value;
            if (firstProfile) {
                this.setCurrentProfile(firstProfile.id);
            }
        }
        return this.currentProfile || {
            id: 'default',
            name: 'Default AI',
            personality: 'friendly',
            profilePicture: 'pfp/Remi-pfp.png',
            description: 'Default AI assistant'
        };
    }

    // Switch profile (alias for setCurrentProfile for compatibility)
    switchProfile(id) {
        return this.setCurrentProfile(id);
    }

    // Get all profiles
    getAllProfiles() {
        return Array.from(this.profiles.values());
    }

    // Get profile by ID
    getProfile(id) {
        return this.profiles.get(id);
    }

    // Get conversation history
    getConversationHistory() {
        return this.conversationHistory || [];
    }

    // Get all memories
    getMemories() {
        return Array.from(this.memory.values()) || [];
    }

    // Memory management
    addMemory(content, category = 'general') {
        const key = 'memory_' + this.memoryKeyCounter++;
        const memory = {
            id: key,
            content,
            category,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.memory.set(key, memory);
        this.saveMemory();
        this.dispatchEvent('memoryAdded', { memory });
        
        return memory;
    }

    // Update memory
    updateMemory(id, content, category) {
        if (!this.memory.has(id)) {
            throw new Error('Memory not found');
        }

        const memory = this.memory.get(id);
        const updatedMemory = {
            ...memory,
            content: content !== undefined ? content : memory.content,
            category: category !== undefined ? category : memory.category,
            updatedAt: new Date().toISOString()
        };

        this.memory.set(id, updatedMemory);
        this.saveMemory();
        this.dispatchEvent('memoryUpdated', { memory: updatedMemory });
        
        return updatedMemory;
    }

    // Delete memory
    deleteMemory(id) {
        if (!this.memory.has(id)) {
            throw new Error('Memory not found');
        }

        this.memory.delete(id);
        this.saveMemory();
        this.dispatchEvent('memoryDeleted', { memoryId: id });
        
        return true;
    }

    // Get all memories
    getAllMemories() {
        return Array.from(this.memory.values());
    }

    // Get memories by category
    getMemoriesByCategory(category) {
        return Array.from(this.memory.values()).filter(memory => memory.category === category);
    }

    // Get memory context for AI
    getMemoryContext() {
        const memories = this.getAllMemories();
        return memories.map(memory => `${memory.category}: ${memory.content}`).join('\n');
    }

    // Build AI context for responses
    buildAIContext() {
        const profile = this.getCurrentProfile();
        const conversationHistory = this.getConversationContext();
        const memoryContext = this.getMemoryContext();

        return {
            profile,
            conversationHistory,
            memoryContext,
            personality_prompt: profile?.traits?.personality_prompt || 'You are a helpful AI assistant.',
            user_memories: memoryContext || 'No specific memories about the user yet.',
            recent_conversation: conversationHistory || []
        };
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for storage changes from other tabs
        window.addEventListener('storage', (event) => {
            if (event.key === 'aiProfiles') {
                this.loadProfiles();
                this.dispatchEvent('profilesChanged');
            } else if (event.key === 'aiMemory') {
                this.loadMemory();
                this.dispatchEvent('memoryChanged');
            } else if (event.key === 'currentAIProfile') {
                const currentId = event.newValue || 'remi-friendly';
                this.setCurrentProfile(currentId);
            }
        });
    }

    // Dispatch custom events
    dispatchEvent(eventName, detail = {}) {
        window.dispatchEvent(new CustomEvent(`aiProfile${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`, {
            detail
        }));
    }

    // Export profiles for backup
    exportProfiles() {
        return {
            profiles: Object.fromEntries(this.profiles),
            memory: Object.fromEntries(this.memory),
            conversationHistory: this.conversationHistory,
            currentProfile: this.currentProfile?.id,
            exportedAt: new Date().toISOString()
        };
    }

    // Import profiles from backup
    importProfiles(data) {
        try {
            if (data.profiles) {
                this.profiles.clear();
                for (const [id, profile] of Object.entries(data.profiles)) {
                    this.profiles.set(id, profile);
                }
                this.saveProfiles();
            }

            if (data.memory) {
                this.memory.clear();
                for (const [id, memory] of Object.entries(data.memory)) {
                    this.memory.set(id, memory);
                }
                this.saveMemory();
            }

            if (data.conversationHistory) {
                this.conversationHistory = data.conversationHistory;
                this.saveConversationHistory();
            }

            if (data.currentProfile) {
                this.setCurrentProfile(data.currentProfile);
            }

            this.dispatchEvent('profilesImported', { data });
            return true;
        } catch (error) {
            console.error('Error importing profiles:', error);
            return false;
        }
    }
}

// Make class globally available
window.AIProfileManager = AIProfileManager;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIProfileManager;
}
