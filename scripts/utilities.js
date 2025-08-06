// Utilities Page - Personal Growth Tools JavaScript

class UtilitiesManager {
    constructor() {
        this.currentSection = 'daily-tools';
        this.data = this.loadData();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupDailyTools();
        this.setupReflection();
        this.setupMotivation();
        this.setupTracking();
        this.setupMindfulness();
        this.setupModals();
        this.loadSavedData();
    }

    // Data Management
    loadData() {
        const saved = localStorage.getItem('utilities-data');
        return saved ? JSON.parse(saved) : {
            dailyPriority: null,
            dailyGoals: [],
            moods: [],
            timeCapsules: [],
            thoughts: [],
            victories: [],
            journeys: [],
            distractions: [],
            worries: [],
            kindnessActs: [],
            affirmations: [],
            brainDumps: []
        };
    }

    saveData() {
        localStorage.setItem('utilities-data', JSON.stringify(this.data));
    }

    // Navigation
    setupNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const section = tab.getAttribute('data-section');
                this.switchSection(section);
            });
        });
    }

    switchSection(section) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');

        this.currentSection = section;
    }

    // Daily Tools
    setupDailyTools() {
        this.setupOneThing();
        this.setupMiniGoals();
        this.setupMoodTracker();
        this.setupTimeCapsule();
    }

    setupOneThing() {
        const commitBtn = document.getElementById('commit-priority');
        const completeBtn = document.getElementById('complete-priority');
        const priorityInput = document.getElementById('daily-priority');
        const priorityStatus = document.getElementById('priority-status');

        commitBtn.addEventListener('click', () => {
            const priority = priorityInput.value.trim();
            if (priority) {
                this.data.dailyPriority = {
                    text: priority,
                    committed: true,
                    completed: false,
                    date: new Date().toDateString()
                };
                this.saveData();
                
                commitBtn.style.display = 'none';
                completeBtn.style.display = 'inline-flex';
                priorityStatus.innerHTML = `<i class="fas fa-handshake"></i> You've committed to: "${priority}"`;
                priorityStatus.classList.add('show');
                priorityInput.disabled = true;
            }
        });

        completeBtn.addEventListener('click', () => {
            if (this.data.dailyPriority) {
                this.data.dailyPriority.completed = true;
                this.saveData();
                
                priorityStatus.innerHTML = `<i class="fas fa-trophy"></i> Congratulations! You completed your priority!`;
                priorityStatus.style.background = 'rgba(16, 185, 129, 0.2)';
                completeBtn.style.display = 'none';
                
                // Add to victories
                this.addVictory(this.data.dailyPriority.text, 'personal');
            }
        });
    }

    setupMiniGoals() {
        const goalChecks = document.querySelectorAll('.goal-check');
        const progressFill = document.getElementById('goals-progress-fill');

        goalChecks.forEach((check, index) => {
            check.addEventListener('click', () => {
                const goalInput = check.previousElementSibling;
                const goalText = goalInput.value.trim();
                
                if (goalText) {
                    check.classList.toggle('completed');
                    this.updateGoalsProgress();
                    
                    if (check.classList.contains('completed')) {
                        goalInput.disabled = true;
                        // Save completed goal
                        if (!this.data.dailyGoals.find(g => g.text === goalText)) {
                            this.data.dailyGoals.push({
                                text: goalText,
                                completed: true,
                                date: new Date().toDateString()
                            });
                            this.saveData();
                        }
                    } else {
                        goalInput.disabled = false;
                        // Remove from completed goals
                        this.data.dailyGoals = this.data.dailyGoals.filter(g => g.text !== goalText);
                        this.saveData();
                    }
                }
            });
        });
    }

    updateGoalsProgress() {
        const completedGoals = document.querySelectorAll('.goal-check.completed').length;
        const totalGoals = document.querySelectorAll('.goal-check').length;
        const percentage = (completedGoals / totalGoals) * 100;
        
        document.getElementById('goals-progress-fill').style.width = `${percentage}%`;
    }

    setupMoodTracker() {
        const moodEmojis = document.querySelectorAll('.mood-emoji');
        const saveMoodBtn = document.getElementById('save-mood');
        const moodNote = document.getElementById('mood-note');
        let selectedMood = null;

        moodEmojis.forEach(emoji => {
            emoji.addEventListener('click', () => {
                moodEmojis.forEach(e => e.classList.remove('selected'));
                emoji.classList.add('selected');
                selectedMood = emoji.getAttribute('data-mood');
            });
        });

        saveMoodBtn.addEventListener('click', () => {
            if (selectedMood) {
                const moodData = {
                    mood: selectedMood,
                    note: moodNote.value.trim(),
                    date: new Date().toDateString(),
                    time: new Date().toLocaleTimeString()
                };
                
                this.data.moods.push(moodData);
                this.saveData();
                
                // Reset form
                moodEmojis.forEach(e => e.classList.remove('selected'));
                moodNote.value = '';
                selectedMood = null;
                
                this.showNotification('Mood saved successfully!', 'success');
            }
        });
    }

    setupTimeCapsule() {
        const sendBtn = document.getElementById('send-capsule');
        const messageInput = document.getElementById('capsule-message');
        const dateInput = document.getElementById('capsule-date');
        const prioritySelect = document.getElementById('capsule-priority');

        sendBtn.addEventListener('click', () => {
            const message = messageInput.value.trim();
            const date = dateInput.value;
            const priority = prioritySelect.value;

            if (message && date) {
                const capsule = {
                    id: Date.now(),
                    message,
                    deliveryDate: date,
                    priority,
                    createdDate: new Date().toDateString()
                };

                this.data.timeCapsules.push(capsule);
                this.saveData();
                this.renderTimeCapsules();

                // Reset form
                messageInput.value = '';
                dateInput.value = '';
                prioritySelect.value = 'low';

                this.showNotification('Time capsule sent to future!', 'success');
            }
        });

        this.renderTimeCapsules();
    }

    renderTimeCapsules() {
        const container = document.querySelector('.capsules-container');
        const today = new Date();
        
        const readyCapsules = this.data.timeCapsules.filter(capsule => {
            const deliveryDate = new Date(capsule.deliveryDate);
            return deliveryDate <= today;
        });

        const futureCapsules = this.data.timeCapsules.filter(capsule => {
            const deliveryDate = new Date(capsule.deliveryDate);
            return deliveryDate > today;
        });

        container.innerHTML = '';

        // Ready capsules
        readyCapsules.forEach(capsule => {
            const capsuleEl = document.createElement('div');
            capsuleEl.className = 'capsule-item ready';
            capsuleEl.innerHTML = `
                <div class="capsule-date">📬 Ready to open!</div>
                <div class="capsule-message">${capsule.message}</div>
                <button class="btn btn-primary btn-sm" onclick="utilitiesManager.openCapsule(${capsule.id})">
                    <i class="fas fa-envelope-open"></i> Open
                </button>
            `;
            container.appendChild(capsuleEl);
        });

        // Future capsules
        futureCapsules.forEach(capsule => {
            const capsuleEl = document.createElement('div');
            capsuleEl.className = 'capsule-item';
            const deliveryDate = new Date(capsule.deliveryDate).toLocaleDateString();
            capsuleEl.innerHTML = `
                <div class="capsule-date">📅 Delivers on ${deliveryDate}</div>
                <div class="capsule-message">${capsule.message.substring(0, 50)}...</div>
            `;
            container.appendChild(capsuleEl);
        });
    }

    openCapsule(id) {
        const capsule = this.data.timeCapsules.find(c => c.id === id);
        if (capsule) {
            alert(`Message from ${capsule.createdDate}:\n\n${capsule.message}`);
            // Remove opened capsule
            this.data.timeCapsules = this.data.timeCapsules.filter(c => c.id !== id);
            this.saveData();
            this.renderTimeCapsules();
        }
    }

    // Reflection Tools
    setupReflection() {
        this.setupOneThought();
        this.setupBrainDump();
        this.setupFutureGratitude();
        this.setupVictoryVault();
    }

    setupOneThought() {
        const saveBtn = document.getElementById('save-thought');
        const thoughtInput = document.getElementById('daily-thought');

        saveBtn.addEventListener('click', () => {
            const thought = thoughtInput.value.trim();
            if (thought) {
                const thoughtData = {
                    text: thought,
                    date: new Date().toDateString(),
                    time: new Date().toLocaleTimeString()
                };

                this.data.thoughts.push(thoughtData);
                this.saveData();
                this.renderThoughts();
                
                thoughtInput.value = '';
                this.showNotification('Thought captured!', 'success');
            }
        });

        this.renderThoughts();
    }

    renderThoughts() {
        const container = document.querySelector('.thoughts-list');
        const recentThoughts = this.data.thoughts.slice(-5).reverse();

        container.innerHTML = recentThoughts.map(thought => `
            <div class="thought-item">
                <div class="thought-text">${thought.text}</div>
                <div class="thought-date">${thought.date}</div>
            </div>
        `).join('');
    }

    setupBrainDump() {
        const clearBtn = document.getElementById('clear-dump');
        const saveBtn = document.getElementById('save-dump');
        const dumpArea = document.getElementById('brain-dump');

        clearBtn.addEventListener('click', () => {
            dumpArea.value = '';
        });

        saveBtn.addEventListener('click', () => {
            const dump = dumpArea.value.trim();
            if (dump) {
                this.data.brainDumps.push({
                    text: dump,
                    date: new Date().toDateString()
                });
                this.saveData();
                dumpArea.value = '';
                this.showNotification('Brain dump saved!', 'success');
            }
        });
    }

    setupFutureGratitude() {
        const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
        const addBtn = document.getElementById('add-gratitude');
        const customInput = document.getElementById('custom-gratitude-item');

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // Auto-save gratitude state
                this.saveData();
            });
        });

        addBtn.addEventListener('click', () => {
            const customItem = customInput.value.trim();
            if (customItem) {
                const newChecklistItem = document.createElement('div');
                newChecklistItem.className = 'checklist-item';
                newChecklistItem.innerHTML = `
                    <input type="checkbox" id="custom-${Date.now()}">
                    <label for="custom-${Date.now()}">${customItem}</label>
                `;
                
                document.querySelector('.gratitude-checklist').appendChild(newChecklistItem);
                customInput.value = '';
            }
        });
    }

    setupVictoryVault() {
        const addBtn = document.getElementById('add-victory');
        const victoryInput = document.getElementById('victory-text');
        const victoryType = document.getElementById('victory-type');

        addBtn.addEventListener('click', () => {
            const text = victoryInput.value.trim();
            const type = victoryType.value;

            if (text) {
                this.addVictory(text, type);
                victoryInput.value = '';
                victoryType.value = 'personal';
            }
        });

        this.renderVictories();
    }

    addVictory(text, type) {
        const victory = {
            text,
            type,
            date: new Date().toDateString()
        };

        this.data.victories.push(victory);
        this.saveData();
        this.renderVictories();
        this.showNotification('Victory added!', 'success');
    }

    renderVictories() {
        const container = document.querySelector('.victories-container');
        const recentVictories = this.data.victories.slice(-10).reverse();

        container.innerHTML = recentVictories.map(victory => `
            <div class="victory-item">
                <div class="victory-type">${victory.type}</div>
                <div class="victory-text">${victory.text}</div>
                <div class="victory-date">${victory.date}</div>
            </div>
        `).join('');
    }

    // Motivation Tools
    setupMotivation() {
        this.setupWheel();
        this.setupKindness();
        this.setupAffirmations();
    }

    setupWheel() {
        const spinBtn = document.getElementById('spin-wheel');
        const wheel = document.getElementById('motivation-wheel');
        const result = document.getElementById('wheel-result');

        const wheelItems = {
            quote: [
                "The only way to do great work is to love what you do. - Steve Jobs",
                "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
                "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
                "It is during our darkest moments that we must focus to see the light. - Aristotle"
            ],
            task: [
                "Write down 3 things you're grateful for",
                "Take a 5-minute walk outside",
                "Send a text to someone you care about",
                "Organize your workspace for 10 minutes"
            ],
            dare: [
                "Compliment a stranger today",
                "Try something new for lunch",
                "Take a selfie and post it",
                "Start a conversation with someone new"
            ],
            challenge: [
                "Do 20 push-ups or jumping jacks",
                "Read for 30 minutes today",
                "No social media for 2 hours",
                "Meditate for 10 minutes"
            ],
            affirmation: [
                "I am capable of amazing things",
                "I choose progress over perfection",
                "I am worthy of love and happiness",
                "I trust in my ability to overcome challenges"
            ],
            activity: [
                "Dance to your favorite song",
                "Draw or doodle for 10 minutes",
                "Do some stretching exercises",
                "Call a friend or family member"
            ]
        };

        spinBtn.addEventListener('click', () => {
            const randomRotation = Math.floor(Math.random() * 360) + 720; // At least 2 full rotations
            wheel.style.transform = `rotate(${randomRotation}deg)`;

            setTimeout(() => {
                const finalRotation = randomRotation % 360;
                const sectionSize = 60; // 360/6 sections
                const sectionIndex = Math.floor(finalRotation / sectionSize);
                const sections = ['quote', 'task', 'dare', 'challenge', 'affirmation', 'activity'];
                const selectedSection = sections[sectionIndex];
                const items = wheelItems[selectedSection];
                const randomItem = items[Math.floor(Math.random() * items.length)];

                result.innerHTML = `
                    <strong>${selectedSection.toUpperCase()}</strong><br>
                    ${randomItem}
                `;
            }, 4000);
        });
    }

    setupKindness() {
        const getBtn = document.getElementById('get-kindness');
        const completeBtn = document.getElementById('complete-kindness');
        const suggestion = document.getElementById('kindness-suggestion');

        const kindnessActs = [
            "Send a compliment to someone today",
            "Thank someone who made a difference in your life",
            "Help a neighbor with groceries",
            "Leave a positive review for a local business",
            "Donate to a charity you care about",
            "Smile at strangers you pass by",
            "Hold the door open for someone",
            "Give up your seat on public transport",
            "Buy coffee for the person behind you",
            "Send an encouraging message to a friend"
        ];

        let currentSuggestion = null;

        getBtn.addEventListener('click', () => {
            currentSuggestion = kindnessActs[Math.floor(Math.random() * kindnessActs.length)];
            suggestion.querySelector('.suggestion-text').textContent = currentSuggestion;
            completeBtn.style.display = 'inline-flex';
        });

        completeBtn.addEventListener('click', () => {
            if (currentSuggestion) {
                this.data.kindnessActs.push({
                    act: currentSuggestion,
                    date: new Date().toDateString()
                });
                this.saveData();
                this.renderKindnessHistory();
                
                completeBtn.style.display = 'none';
                suggestion.querySelector('.suggestion-text').textContent = "Great job! Click below for another kindness idea.";
                currentSuggestion = null;
                
                this.showNotification('Kindness act completed! 💝', 'success');
            }
        });

        this.renderKindnessHistory();
    }

    renderKindnessHistory() {
        const container = document.querySelector('.kindness-list');
        const recentActs = this.data.kindnessActs.slice(-5).reverse();

        container.innerHTML = recentActs.map(act => `
            <div class="kindness-item">
                <div class="kindness-text">${act.act}</div>
                <div class="kindness-date">${act.date}</div>
            </div>
        `).join('');
    }

    setupAffirmations() {
        const generateBtn = document.getElementById('generate-affirmation');
        const saveBtn = document.getElementById('save-affirmation');
        const display = document.getElementById('affirmation-display');

        const affirmations = [
            "I am worthy of love and respect",
            "I choose to focus on what I can control",
            "Every challenge is an opportunity to grow",
            "I am enough, just as I am",
            "I trust in my ability to make good decisions",
            "I am grateful for all the good in my life",
            "I deserve happiness and success",
            "I am strong, capable, and resilient",
            "I choose to see the positive in every situation",
            "I am exactly where I need to be right now"
        ];

        let currentAffirmation = null;

        generateBtn.addEventListener('click', () => {
            currentAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
            display.querySelector('.affirmation-text').textContent = currentAffirmation;
        });

        saveBtn.addEventListener('click', () => {
            if (currentAffirmation) {
                this.data.affirmations.push({
                    text: currentAffirmation,
                    date: new Date().toDateString()
                });
                this.saveData();
                this.renderSavedAffirmations();
                this.showNotification('Affirmation saved!', 'success');
            }
        });

        this.renderSavedAffirmations();
    }

    renderSavedAffirmations() {
        const container = document.querySelector('.affirmations-list');
        const saved = this.data.affirmations.slice(-5).reverse();

        container.innerHTML = saved.map(affirmation => `
            <div class="affirmation-item">
                <div class="affirmation-text">${affirmation.text}</div>
                <div class="affirmation-date">${affirmation.date}</div>
            </div>
        `).join('');
    }

    // Tracking Tools
    setupTracking() {
        this.setupJourneyTracker();
        this.setupDistractionLog();
    }

    setupJourneyTracker() {
        const createBtn = document.getElementById('create-journey');
        const nameInput = document.getElementById('journey-name');

        createBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name) {
                const journey = {
                    id: Date.now(),
                    name,
                    rating: 5,
                    history: [],
                    created: new Date().toDateString()
                };

                this.data.journeys.push(journey);
                this.saveData();
                this.renderJourneys();
                
                nameInput.value = '';
                this.showNotification('Journey started!', 'success');
            }
        });

        this.renderJourneys();
    }

    renderJourneys() {
        const container = document.querySelector('.journeys-container');
        
        container.innerHTML = this.data.journeys.map(journey => `
            <div class="journey-item" data-id="${journey.id}">
                <div class="journey-header">
                    <div class="journey-name">${journey.name}</div>
                    <button class="btn btn-secondary btn-sm" onclick="utilitiesManager.updateJourney(${journey.id})">
                        Update
                    </button>
                </div>
                <div class="journey-rating">
                    <input type="range" min="1" max="10" value="${journey.rating}" 
                           class="rating-slider" data-journey="${journey.id}">
                    <span class="rating-value">${journey.rating}/10</span>
                </div>
                <div class="journey-progress">
                    Started ${journey.created}
                </div>
            </div>
        `).join('');

        // Add event listeners for sliders
        document.querySelectorAll('.rating-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const journeyId = parseInt(e.target.getAttribute('data-journey'));
                const rating = parseInt(e.target.value);
                const journey = this.data.journeys.find(j => j.id === journeyId);
                if (journey) {
                    journey.rating = rating;
                    e.target.nextElementSibling.textContent = `${rating}/10`;
                    this.saveData();
                }
            });
        });
    }

    updateJourney(id) {
        const journey = this.data.journeys.find(j => j.id === id);
        if (journey) {
            journey.history.push({
                rating: journey.rating,
                date: new Date().toDateString()
            });
            this.saveData();
            this.showNotification('Journey updated!', 'success');
        }
    }

    setupDistractionLog() {
        const logBtn = document.getElementById('log-distraction');
        const textInput = document.getElementById('distraction-text');
        const categorySelect = document.getElementById('distraction-category');
        const timeInput = document.getElementById('distraction-time');

        logBtn.addEventListener('click', () => {
            const text = textInput.value.trim();
            const category = categorySelect.value;
            const time = timeInput.value;

            if (text) {
                const distraction = {
                    text,
                    category,
                    time: time || new Date().toLocaleTimeString(),
                    date: new Date().toDateString()
                };

                this.data.distractions.push(distraction);
                this.saveData();
                this.renderDistractionPatterns();

                textInput.value = '';
                timeInput.value = '';
                this.showNotification('Distraction logged!', 'info');
            }
        });

        this.renderDistractionPatterns();
    }

    renderDistractionPatterns() {
        const container = document.querySelector('.patterns-container');
        const recentDistractions = this.data.distractions.slice(-10).reverse();

        container.innerHTML = recentDistractions.map(distraction => `
            <div class="pattern-item">
                <div class="pattern-category">${distraction.category}</div>
                <div class="pattern-text">${distraction.text}</div>
                <div class="pattern-time">${distraction.date} at ${distraction.time}</div>
            </div>
        `).join('');
    }

    // Mindfulness Tools
    setupMindfulness() {
        this.setupWorryTime();
        this.setupEmotionTranslator();
    }

    setupWorryTime() {
        const lockBtn = document.getElementById('lock-worry');
        const worryInput = document.getElementById('worry-text');
        const reviewTime = document.getElementById('worry-review-time');

        lockBtn.addEventListener('click', () => {
            const worry = worryInput.value.trim();
            const reviewDate = reviewTime.value;

            if (worry && reviewDate) {
                const worryData = {
                    id: Date.now(),
                    text: worry,
                    reviewTime: reviewDate,
                    locked: new Date().toDateString()
                };

                this.data.worries.push(worryData);
                this.saveData();
                this.renderWorries();

                worryInput.value = '';
                reviewTime.value = '';
                this.showNotification('Worry locked away!', 'success');
            }
        });

        this.renderWorries();
    }

    renderWorries() {
        const container = document.querySelector('.worries-container');
        
        container.innerHTML = this.data.worries.map(worry => {
            const reviewDate = new Date(worry.reviewTime);
            const now = new Date();
            const isReady = reviewDate <= now;
            
            return `
                <div class="worry-item ${isReady ? 'ready' : ''}">
                    <div class="worry-unlock-time">
                        ${isReady ? '🔓 Ready to review' : `🔒 Locked until ${reviewDate.toLocaleString()}`}
                    </div>
                    <div class="worry-text">${isReady ? worry.text : '***Hidden until review time***'}</div>
                    ${isReady ? `<button class="btn btn-secondary btn-sm" onclick="utilitiesManager.resolveWorry(${worry.id})">Resolve</button>` : ''}
                </div>
            `;
        }).join('');
    }

    resolveWorry(id) {
        this.data.worries = this.data.worries.filter(w => w.id !== id);
        this.saveData();
        this.renderWorries();
        this.showNotification('Worry resolved!', 'success');
    }

    setupEmotionTranslator() {
        const translateBtn = document.getElementById('translate-emotion');
        const emotionInput = document.getElementById('emotion-description');
        const result = document.getElementById('emotion-result');

        const emotionMappings = {
            angry: {
                name: "Anger",
                explanation: "Anger often arises when we feel our boundaries have been crossed or when things don't go as expected.",
                suggestions: "Try deep breathing, physical exercise, or expressing your feelings through journaling."
            },
            sad: {
                name: "Sadness",
                explanation: "Sadness is a natural response to loss, disappointment, or unmet expectations.",
                suggestions: "Allow yourself to feel the emotion, reach out to supportive people, or engage in self-care activities."
            },
            anxious: {
                name: "Anxiety",
                explanation: "Anxiety often stems from worry about future events or uncertainty.",
                suggestions: "Practice grounding techniques, mindfulness, or break down worries into manageable steps."
            },
            happy: {
                name: "Joy",
                explanation: "Joy reflects satisfaction, contentment, or positive experiences.",
                suggestions: "Savor this feeling, share it with others, or use it as motivation for future activities."
            },
            frustrated: {
                name: "Frustration",
                explanation: "Frustration occurs when we feel blocked from achieving our goals.",
                suggestions: "Take a step back, reassess your approach, or break the task into smaller parts."
            }
        };

        translateBtn.addEventListener('click', () => {
            const description = emotionInput.value.trim().toLowerCase();
            
            if (description) {
                // Simple emotion detection based on keywords
                let detectedEmotion = null;
                
                for (const [key, emotion] of Object.entries(emotionMappings)) {
                    if (description.includes(key) || description.includes(emotion.name.toLowerCase())) {
                        detectedEmotion = emotion;
                        break;
                    }
                }

                // Default fallback
                if (!detectedEmotion) {
                    detectedEmotion = {
                        name: "Complex Emotion",
                        explanation: "Your emotions seem complex and unique. This is completely normal.",
                        suggestions: "Consider talking to someone you trust, journaling about your feelings, or practicing mindfulness."
                    };
                }

                result.innerHTML = `
                    <div class="emotion-name">${detectedEmotion.name}</div>
                    <div class="emotion-explanation">${detectedEmotion.explanation}</div>
                    <div class="emotion-suggestions">
                        <h4>Suggestions:</h4>
                        <p>${detectedEmotion.suggestions}</p>
                    </div>
                `;
                result.classList.add('show');
            }
        });
    }

    // Modal Management
    setupModals() {
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeButtons = document.querySelectorAll('.modal-close');

        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('show');
        });

        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('show');
            });
        });

        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
    }

    // Load saved data on init
    loadSavedData() {
        // Load today's priority
        if (this.data.dailyPriority && this.data.dailyPriority.date === new Date().toDateString()) {
            const priorityInput = document.getElementById('daily-priority');
            const commitBtn = document.getElementById('commit-priority');
            const completeBtn = document.getElementById('complete-priority');
            const priorityStatus = document.getElementById('priority-status');

            priorityInput.value = this.data.dailyPriority.text;
            
            if (this.data.dailyPriority.committed) {
                commitBtn.style.display = 'none';
                priorityInput.disabled = true;
                
                if (this.data.dailyPriority.completed) {
                    priorityStatus.innerHTML = `<i class="fas fa-trophy"></i> Completed: "${this.data.dailyPriority.text}"`;
                    priorityStatus.style.background = 'rgba(16, 185, 129, 0.2)';
                } else {
                    completeBtn.style.display = 'inline-flex';
                    priorityStatus.innerHTML = `<i class="fas fa-handshake"></i> Committed to: "${this.data.dailyPriority.text}"`;
                }
                priorityStatus.classList.add('show');
            }
        }

        // Load today's goals
        const todaysGoals = this.data.dailyGoals.filter(g => g.date === new Date().toDateString());
        todaysGoals.forEach(goal => {
            const goalInputs = document.querySelectorAll('.goal-input');
            goalInputs.forEach(input => {
                if (input.value === goal.text) {
                    input.disabled = true;
                    input.nextElementSibling.classList.add('completed');
                }
            });
        });
        this.updateGoalsProgress();
    }

    // Utility functions
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}"></i>
            ${message}
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.utilitiesManager = new UtilitiesManager();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }
    
    .notification-success {
        background: linear-gradient(135deg, #10B981, #059669);
    }
    
    .notification-error {
        background: linear-gradient(135deg, #EF4444, #DC2626);
    }
    
    .notification-info {
        background: linear-gradient(135deg, #3B82F6, #2563EB);
    }
    
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
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
