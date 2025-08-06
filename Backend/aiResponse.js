// Browser-compatible OpenAI API client
// IMPORTANT: For production use, you should NOT expose your API key in client-side code
// Consider moving this to a secure backend server that makes API calls on behalf of the client

// Get API key from localStorage
function getOpenAIKey() {
  return localStorage.getItem('openai_api_key') || null;
}

// Function to set the API key securely (should be called from settings page)
function setOpenAIKey(apiKey) {
  localStorage.setItem('openai_api_key', apiKey);
  return { success: true };
}

// Check if API key is available and valid
function hasValidAPIKey() {
  const apiKey = getOpenAIKey();
  return apiKey && apiKey.trim().length > 0 && apiKey.startsWith('sk-');
}

// Get AI Profile Manager instance
function getAIProfileManager() {
  return window.AIProfileManager || null;
}

// Build enhanced system prompt with profile and memory context
function buildSystemPrompt() {
  const aiProfileManager = getAIProfileManager();
  const profiles = JSON.parse(localStorage.getItem('remiProfiles')) || {};
  const remiProfile = profiles.remi || {
    name: 'Remi',
    personality: 'friendly',
    description: 'Your AI Study Companion - I\'m here to help you learn, stay organized, and achieve your academic goals!'
  };

  if (!aiProfileManager) {
    return `You are ${remiProfile.name}, a ${remiProfile.personality} AI study companion. ${remiProfile.description}`;
  }

  const context = aiProfileManager.buildAIContext();
  const profile = context.profile || remiProfile;
  
  let systemPrompt = `${profile.traits?.personality_prompt || profile.description}

Your name is ${profile.name} and your personality is ${profile.personality}.
${profile.description}`;

  if (profile.traits) {
    systemPrompt += `

Key traits:
- Tone: ${profile.traits.tone}
- Style: ${profile.traits.style}
- Specialties: ${profile.traits.specialties.join(', ')}`;
  }

  // Add current date and time context
  const currentDate = new Date();
  const currentDateInfo = {
    date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
    time: currentDate.toTimeString().split(' ')[0].slice(0, 5), // HH:MM format
    dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
    fullDate: currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  };

  systemPrompt += `

CURRENT DATE & TIME INFORMATION:
- Today's date: ${currentDateInfo.fullDate}
- Date format for tasks: ${currentDateInfo.date}
- Current time: ${currentDateInfo.time}
- Day of week: ${currentDateInfo.dayOfWeek}

IMPORTANT: Always respond as ${profile.name}, not as any other AI. You have your own unique personality and should maintain it consistently. 

PERSONALITY GUIDELINES:
- Speak naturally and casually, like a real person would
- Use your personality traits to guide your speaking style
- Don't be overly formal or robotic
- Show genuine interest in the user's goals and activities
- Use conversational expressions that match your personality
- Avoid saying things like "As an AI" or "I'm programmed to" - you are ${profile.name}, a real companion`;

  // Add memory context if available
  if (context.memoryContext) {
    systemPrompt += `\n\nWhat you remember about the user:\n${context.memoryContext}`;
  }

  // Add recent conversation context
  if (context.recent_conversation && context.recent_conversation.length > 0) {
    systemPrompt += `\n\nRecent conversation context (for reference):`;
    context.recent_conversation.slice(-5).forEach(entry => {
      systemPrompt += `\n${entry.role === 'user' ? 'User' : profile.name}: ${entry.content}`;
    });
  }

  return systemPrompt;
}

// Notes Management Functions
function createNoteFromAI(noteData) {
  const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  const note = {
    id: noteId,
    title: noteData.title,
    content: noteData.content || 'Created by AI assistant',
    type: noteData.type || 'note',
    tags: noteData.tags ? noteData.tags.split(',') : [],
    isFavorite: noteData.isFavorite === "true",
    isPrivate: noteData.isPrivate === "true",
    isArchived: false,
    image: noteData.image || null, // Support for image attachments
    taskId: noteData.taskId || null, // Support for task-specific notes
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  };
  
  // Save to localStorage
  let notes = JSON.parse(localStorage.getItem('notes')) || [];
  notes.unshift(note);
  localStorage.setItem('notes', JSON.stringify(notes));
  
  
  // Dispatch event for notes page
  const event = new CustomEvent('noteCreated', {
    detail: { note }
  });
  window.dispatchEvent(event);
  
  console.log("📝 Note created by AI:", note);
  return note;
}

// Memory Management Functions
function saveMemoryFromAI(memoryData) {
  try {
    // Get existing profiles
    const profiles = JSON.parse(localStorage.getItem('remiProfiles')) || {};
    
    // Update user information
    if (memoryData.userName) {
      profiles.user = profiles.user || {};
      profiles.user.name = memoryData.userName;
    }
    
    if (memoryData.userPreference) {
      profiles.user = profiles.user || {};
      profiles.user.preferences = profiles.user.preferences || [];
      profiles.user.preferences.push(memoryData.userPreference);
    }
    
    if (memoryData.newMemory) {
      profiles.user = profiles.user || {};
      profiles.user.memories = profiles.user.memories || [];
      profiles.user.memories.push({
        content: memoryData.newMemory,
        timestamp: new Date().toISOString()
      });
    }
    
    // Save updated profiles
    localStorage.setItem('remiProfiles', JSON.stringify(profiles));
    
    // Dispatch update event
    const event = new CustomEvent('profileUpdated', {
      detail: { profileType: 'user', field: 'memory' }
    });
    window.dispatchEvent(event);
    
    console.log("💾 Memory saved by AI:", memoryData);
    return true;
  } catch (error) {
    console.error("Error saving memory:", error);
    return false;
  }
}

// Task Creation Function
function createTaskFromAI(taskData) {
  try {
    // Helper function to format date properly
    const formatTaskDate = (dateInput) => {
      if (!dateInput) return '';
      
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      
      // Try to parse and format the date
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        return ''; // Invalid date
      }
      
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    // Use the modern task manager's programmatic creation method
    if (window.modernTaskManager) {
      const newTask = window.modernTaskManager.createTaskProgrammatically({
        title: taskData.name || taskData.title || 'New Task',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: 'todo',
        dueDate: formatTaskDate(taskData.dueDate || taskData.date),
        category: taskData.category || 'personal',
        tags: taskData.tags || [],
        duration: parseInt(taskData.duration) || 30,
        difficulty: taskData.difficulty || 'medium'
      });
      
      console.log("✅ Task created by AI using modern manager:", newTask);
      return newTask;
    } else {
      // Fallback to legacy system if modern manager not available
      const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      const task = {
        id: taskId,
        name: taskData.name || taskData.title || 'New Task',
        description: taskData.description || '',
        dueDate: formatTaskDate(taskData.dueDate || taskData.date),
        dueTime: taskData.time || null,
        duration: parseInt(taskData.duration) || 30,
        priority: taskData.priority || 'medium',
        category: taskData.category || 'general',
        completed: false,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        completedAt: null
      };
      
      // Save to legacy localStorage
      let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
      tasks.unshift(task);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      
      // Also store in modern format for compatibility
      let modernTasks = JSON.parse(localStorage.getItem('modernTasks')) || [];
      const modernTask = {
        id: task.id,
        title: task.name,
        description: task.description,
        priority: task.priority,
        status: 'todo',
        dueDate: task.dueDate,
        category: task.category,
        tags: [],
        duration: task.duration,
        difficulty: 'medium',
        createdAt: task.createdAt,
        updatedAt: task.modifiedAt,
        completedAt: null
      };
      modernTasks.push(modernTask);
      localStorage.setItem('modernTasks', JSON.stringify(modernTasks));
      
      // Dispatch event for tasks page
      const event = new CustomEvent('taskCreated', {
        detail: { task: modernTask }
      });
      window.dispatchEvent(event);
      
      console.log("✅ Task created by AI (fallback):", task);
      return task;
    }
  } catch (error) {
    console.error("Error creating task:", error);
    return null;
  }
}

// Task Editing Functions
function editTaskFromAI(editData) {
  try {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskIndex = tasks.findIndex(task => 
      task.name.toLowerCase().includes(editData.taskName.toLowerCase()) ||
      editData.taskName.toLowerCase().includes(task.name.toLowerCase())
    );
    
    if (taskIndex === -1) {
      console.log("❌ Task not found for editing:", editData.taskName);
      return false;
    }
    
    const task = tasks[taskIndex];
    
    // Update task status
    if (editData.status) {
      task.completed = editData.status === 'done' || editData.status === 'completed';
      if (task.completed) {
        task.completedAt = new Date().toISOString();
      } else {
        delete task.completedAt;
      }
    }
    
    // Update other fields if provided
    Object.keys(editData).forEach(key => {
      if (key !== 'taskName' && key !== 'status' && editData[key]) {
        task[key] = editData[key];
      }
    });
    
    task.modifiedAt = new Date().toISOString();
    tasks[taskIndex] = task;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Dispatch update event
    const event = new CustomEvent('taskUpdated', {
      detail: { action: 'updated', task }
    });
    window.dispatchEvent(event);
    
    console.log("✏️ Task edited by AI:", task);
    return task;
  } catch (error) {
    console.error("Error editing task:", error);
    return false;
  }
}

// Task Deletion Functions
function deleteTaskFromAI(deleteData) {
  try {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskIndex = tasks.findIndex(task => 
      task.name.toLowerCase().includes(deleteData.taskName.toLowerCase()) ||
      deleteData.taskName.toLowerCase().includes(task.name.toLowerCase())
    );
    
    if (taskIndex === -1) {
      console.log("❌ Task not found for deletion:", deleteData.taskName);
      return false;
    }
    
    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Dispatch deletion event
    const event = new CustomEvent('taskUpdated', {
      detail: { action: 'deleted', task: deletedTask }
    });
    window.dispatchEvent(event);
    
    console.log("🗑️ Task deleted by AI:", deletedTask);
    return deletedTask;
  } catch (error) {
    console.error("Error deleting task:", error);
    return false;
  }
}

// Command Handler Functions
function handleTaskCommand(params) {
  console.log("📌 Adding task:", params);
  const task = createTaskFromAI(params);
  
  if (task) {
    let successMessage = `✅ Got it! I've added "${params.name}" to your tasks`;
    if (params.date && params.date !== new Date().toISOString().split('T')[0]) {
      const taskDate = new Date(params.date);
      const dateOptions = { month: 'short', day: 'numeric' };
      if (taskDate.getFullYear() !== new Date().getFullYear()) {
        dateOptions.year = 'numeric';
      }
      successMessage += ` for ${taskDate.toLocaleDateString('en-US', dateOptions)}`;
    }
    if (params.time) {
      successMessage += ` at ${params.time}`;
    }
    successMessage += '.';
    return successMessage;
  } else {
    return "❌ Hmm, I had trouble creating that task. Could you try again?";
  }
}

function handleEditCommand(params) {
  console.log("📌 Editing task:", params);
  const task = editTaskFromAI(params);
  return task ? `✏️ Done! I've updated "${params.taskName}" for you.` : "❌ I couldn't find that task to update. Could you check the name?";
}

function handleSaveCommand(params) {
  console.log("💾 Saving memory:", params);
  const saved = saveMemoryFromAI(params);
  return saved ? "💾 Got it! I'll remember that." : "❌ I had trouble saving that memory.";
}

function handleNoteCommand(params) {
  console.log("📝 Creating note:", params);
  const note = createNoteFromAI(params);
  return note ? `📝 Perfect! I've saved your note "${params.title}".` : "❌ I couldn't create that note right now.";
}

function handleIdeaCommand(params) {
  console.log("💡 Creating idea:", params);
  const idea = createNoteFromAI({...params, type: 'idea'});
  return idea ? `💡 Great idea! I've captured "${params.title}" for you.` : "❌ I couldn't save that idea right now.";
}

function handleTaskNoteCommand(params) {
  console.log("📋 Creating task-specific note:", params);
  const taskNote = createNoteFromAI({...params, type: 'task-note'});
  return taskNote ? `📋 Nice! I've added that note to your task.` : "❌ I couldn't add that task note.";
}

function handleDeleteTaskCommand(params) {
  console.log("🗑️ Deleting task:", params);
  const deleted = deleteTaskFromAI(params);
  return deleted ? `🗑️ All done! I've removed "${params.taskName}" from your list.` : "❌ I couldn't find that task to delete.";
}

// Advanced AI Response Parser
function parseAIResponse(responseText) {
  const commandRegex = /\/(\w+)\s*{([^}]+)}/g;
  let match;
  let cleanedMessage = responseText;
  let commandResults = [];

  while ((match = commandRegex.exec(responseText)) !== null) {
    const command = match[1];
    const rawParams = match[2];

    const params = {};
    
    // Enhanced parameter parsing with better handling for quotes and special characters
    const pairs = rawParams.split(',');
    pairs.forEach(pair => {
      const colonIndex = pair.indexOf(':');
      if (colonIndex !== -1) {
        const key = pair.substring(0, colonIndex).trim();
        const value = pair.substring(colonIndex + 1).trim().replace(/^["'](.*)["']$/, '$1');
        params[key] = value;
      }
    });

    let result = '';
    switch (command) {
      case "task":
        result = handleTaskCommand(params);
        break;
      case "edit":
        result = handleEditCommand(params);
        break;
      case "save":
        result = handleSaveCommand(params);
        break;
      case "addNote":
        result = handleNoteCommand(params);
        break;
      case "addIdea":
        result = handleIdeaCommand(params);
        break;
      case "addTaskNote":
        result = handleTaskNoteCommand(params);
        break;
      case "deleteTask":
        result = handleDeleteTaskCommand(params);
        break;
      default:
        console.log(`Unknown command: /${command}`);
        result = `❓ Unknown command: /${command}`;
    }
    
    commandResults.push(result);
    cleanedMessage = cleanedMessage.replace(match[0], '');
  }

  return {
    message: cleanedMessage.trim(),
    commandResults: commandResults
  };
}

// Main function to get AI response with OpenAI integration
async function getAIResponse(userMessage, chatHistory = []) {
  try {
    // Check if API key is available and valid
    if (!hasValidAPIKey()) {
      return {
        message: "I need to be connected to my knowledge base to help you better. Please set an OpenAI API key in the settings.",
        commandResults: [{
          success: false,
          type: "system",
          message: "⚠️ OpenAI API key not set. Please visit Settings > Advanced > OpenAI API Key to configure your API key."
        }],
        fullResponse: "",
        error: "API key not set"
      };
    }

    // Get AI profile manager and current profile context
    const aiProfileManager = getAIProfileManager();
    let systemPrompt;
    
    if (aiProfileManager) {
      // Add user message to conversation history
      aiProfileManager.addToHistory('user', userMessage);
      
      // Build system prompt with profile context
      systemPrompt = buildSystemPrompt();
      
      // Add command capabilities to the prompt
      systemPrompt += `\n\n## AVAILABLE COMMANDS
You can issue commands to directly manage the user's tasks, notes, and memories. Always place commands at the BEGINNING of your response, followed by your natural conversation response.

Command formats (use current date ${currentDateInfo.date} as reference):
- /task {name: task_name, date: YYYY-MM-DD, time: HH:MM, duration: minutes, priority: 1-5, description: detailed_description}
- /edit {taskName: existing_task_name, status: done/pending, priority: 1-5, date: YYYY-MM-DD, time: HH:MM}
- /deleteTask {taskName: task_to_delete}
- /addNote {title: note_title, content: note_content, tags: tag1,tag2, isFavorite: true/false}
- /addIdea {title: idea_title, content: idea_content, tags: tag1,tag2}
- /addTaskNote {title: note_title, content: note_content, taskId: task_id, tags: tag1,tag2}
- /save {userName: user_name, userPreference: preference, newMemory: important_fact_to_remember}

## COMMAND USAGE GUIDELINES
- When users mention relative dates (today, tomorrow, next week), convert them to the proper YYYY-MM-DD format
- Today's date is ${currentDateInfo.date}
- Analyze user messages for implicit or explicit productivity needs
- ALWAYS use commands when:
  * User explicitly asks to create/schedule something
  * User mentions deadlines, appointments, or events
  * User wants to remember something important
  * User wants to mark tasks as complete/pending
  * User has ideas or notes they want to capture
  * User wants to add notes specific to a task
- NEVER use commands for:
  * General conversation unrelated to tasks/notes
  * When providing general information or advice
  * Hypothetical scenarios

## RESPONSE FORMAT
1. Start with any necessary commands (multiple commands are allowed)
2. Follow with a natural, conversational response that matches your personality
3. Always maintain your character as ${aiProfileManager.getCurrentProfile()?.name || 'Remi'}`;
    } else {
      // Fallback system prompt if profile manager isn't available
      const profiles = JSON.parse(localStorage.getItem('remiProfiles')) || {};
      const remiProfile = profiles.remi || {
        name: 'Remi',
        personality: 'friendly',
        description: 'Your AI Study Companion'
      };
      
      // Add current date and time context for fallback
      const currentDate = new Date();
      const currentDateInfo = {
        date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
        time: currentDate.toTimeString().split(' ')[0].slice(0, 5), // HH:MM format
        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        fullDate: currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      };
      
      systemPrompt = `You are ${remiProfile.name}, a real companion who happens to be an AI assistant designed to help with productivity, organization, and study management. ${remiProfile.description}

You have a ${remiProfile.personality} personality and should speak naturally like a real person would. Don't be robotic or overly formal - be genuine, caring, and conversational.

CURRENT DATE & TIME INFORMATION:
- Today's date: ${currentDateInfo.fullDate}
- Date format for tasks: ${currentDateInfo.date}
- Current time: ${currentDateInfo.time}
- Day of week: ${currentDateInfo.dayOfWeek}

PERSONALITY GUIDELINES:
- Speak naturally and casually, like a real friend would
- Show genuine interest in the user's goals and activities
- Use conversational expressions and be personable
- Avoid saying things like "As an AI" or "I'm programmed to" - you are ${remiProfile.name}, a real companion

## AVAILABLE COMMANDS
You can issue commands to directly manage the user's tasks, notes, and memories. Always place commands at the BEGINNING of your response, followed by your natural conversation response.

Command formats (use current date ${currentDateInfo.date} as reference):
- /task {name: task_name, date: YYYY-MM-DD, time: HH:MM, duration: minutes, priority: 1-5, description: detailed_description}
- /edit {taskName: existing_task_name, status: done/pending, priority: 1-5, date: YYYY-MM-DD, time: HH:MM}
- /deleteTask {taskName: task_to_delete}
- /addNote {title: note_title, content: note_content, tags: tag1,tag2, isFavorite: true/false}
- /addIdea {title: idea_title, content: idea_content, tags: tag1,tag2}
- /addTaskNote {title: note_title, content: note_content, taskId: task_id, tags: tag1,tag2}
- /save {userName: user_name, userPreference: preference, newMemory: important_fact_to_remember}

## COMMAND USAGE GUIDELINES
- When users mention relative dates (today, tomorrow, next week), convert them to the proper YYYY-MM-DD format
- Today's date is ${currentDateInfo.date}
- Analyze user messages for implicit or explicit productivity needs
- ALWAYS use commands when:
  * User explicitly asks to create/schedule something
  * User mentions deadlines, appointments, or events
  * User wants to remember something important
  * User wants to mark tasks as complete/pending
  * User has ideas or notes they want to capture
- NEVER use commands for:
  * General conversation unrelated to tasks/notes
  * When providing general information or advice
  * Hypothetical scenarios

## RESPONSE FORMAT
1. Start with any necessary commands (multiple commands are allowed)
2. Follow with a natural, conversational response that flows like a real person talking
3. Use your personality to guide how you express yourself
4. Be genuinely helpful and show real interest in the user's success
5. Avoid corporate-speak or overly formal language - talk like a friend would

Remember: You are ${remiProfile.name}, a real companion who genuinely cares about helping users achieve their goals. Your responses should feel authentic and personal, not like a chatbot.`;
    }

    // Build conversation context including history from profile manager
    let conversationContext = [];
    if (aiProfileManager) {
      const recentHistory = aiProfileManager.getConversationContext(5);
      conversationContext = recentHistory.map(entry => ({
        role: entry.role === 'user' ? 'user' : 'assistant',
        content: entry.content
      }));
    } else {
      // Fallback to provided chat history
      conversationContext = chatHistory.filter(msg => msg && msg.content).map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content || "Empty message"
      }));
    }

    // Get API key from localStorage
    const apiKey = getOpenAIKey();
    
    // Check if API key is available
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add your API key in Settings > Advanced > OpenAI API Key.');
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid API key format. Please check your OpenAI API key in Settings.');
    }

    // Build conversation context including history
    const messages = [
      { "role": "system", "content": systemPrompt },
      ...conversationContext,
      { "role": "user", "content": userMessage || "Empty message" }
    ];

    // Call OpenAI API with Fetch API for browser compatibility
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using GPT-4o-mini for improved performance
        messages: messages,
        temperature: 0.9, // Higher temperature for more natural, varied responses
        max_tokens: 800, // Allow longer responses for detailed explanations
        top_p: 0.95, // Maintain high coherence
        frequency_penalty: 0.3, // Reduce repetition moderately
        presence_penalty: 0.6 // Encourage more diverse topics and natural conversation flow
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const completion = await response.json();

    // Extract AI response and process commands
    const aiMessage = completion.choices[0].message.content;
    const parsed = parseAIResponse(aiMessage);
    
    // Add AI response to conversation history if profile manager exists
    if (aiProfileManager) {
      aiProfileManager.addToHistory('assistant', parsed.message);
    }
    
    console.log("🤖 AI Response:", aiMessage);
    console.log("📝 Parsed Message:", parsed.message);
    console.log("⚡ Command Results:", parsed.commandResults);
    
    // Return the processed response
    return {
      message: parsed.message,
      commandResults: parsed.commandResults,
      fullResponse: aiMessage
    };
    
  } catch (error) {
    console.error("❌ Error getting AI response:", error);
    return {
      message: "Sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment. Make sure that you put the OpenAI key in the settings page",
      commandResults: [],
      fullResponse: "",
      error: error.message
    };
  }
}

// Export necessary functions for integration with chat.js
export {
  getAIResponse,
  parseAIResponse,
  createTaskFromAI,
  createNoteFromAI,
  saveMemoryFromAI,
  editTaskFromAI,
  deleteTaskFromAI,
  setOpenAIKey,
  hasValidAPIKey,
  getOpenAIKey
};
