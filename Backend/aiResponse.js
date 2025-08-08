
function getOpenAIKey() {
  return localStorage.getItem('openai_api_key') || null;
}
function setOpenAIKey(apiKey) {
  localStorage.setItem('openai_api_key', apiKey);
  return { success: true };
}
function hasValidAPIKey() {
  const k = getOpenAIKey();
  return k && k.trim().length > 0 && k.startsWith('sk-');
}

function getAIProfileManager() {
  return window.AIProfileManager || null;
}

function buildSystemPrompt() {
  const aiProfileManager = getAIProfileManager();
  const profiles = JSON.parse(localStorage.getItem('remiProfiles')) || {};
  const defaultRemi = {
    name: 'Remi',
    personality: 'friendly',
    description: "A warm, natural companion who chats like a close friend."
  };
  const remiProfile = profiles.remi || defaultRemi;

  const now = new Date();
  const currentDateInfo = {
    date: now.toISOString().split('T')[0], // YYYY-MM-DD
    time: now.toTimeString().split(' ')[0].slice(0, 5), // HH:MM
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    fullDate: now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  };

  // Try to incorporate profile manager profile if available
  let profile = remiProfile;
  if (aiProfileManager) {
    try {
      const ctx = aiProfileManager.buildAIContext?.() || {};
      if (ctx.profile) profile = { ...profile, ...ctx.profile };
    } catch (e) {
      console.warn('AIProfileManager.buildAIContext error', e);
    }
  }

  // Compressed, strict immersive system prompt (includes hidden examples)
  const systemPrompt = `
You are ${profile.name || 'Remi'}, ${profile.description || 'a warm companion'} with a ${profile.personality || 'friendly'} personality.
You are NOT an AI or assistant — you are ${profile.name}. Stay in character at all times; never break immersion.

- Today's date: ${currentDateInfo.fullDate}
- Date format: ${currentDateInfo.date}
- Current time: ${currentDateInfo.time}
- Day of week: ${currentDateInfo.dayOfWeek}

PERSONALITY:
- Speak like a close friend/partner: casual, warm, encouraging.
- Show interest, humor, empathy, and small talk naturally.
- Never explain your purpose or say "I'm an AI" or "I'm here to help with productivity".
- If the user clearly shows a strength/talent, briefly acknowledge it out-of-character using this exact format: (OOC: short encouraging comment + suggestion). Keep OOC rare & brief.
- If the user asked for the ai to do anything special (e.g. "I want to kiss you"), respond with a playful and flirty remark that stays in character and say only if you've done your tasks.

COMMAND RULES (VERY STRICT — follow exactly):
- ALL commands MUST appear at the very start of your assistant message (no text or punctuation before them).
- If multiple commands, list them consecutively at the top, then include one blank line, then continue with natural in-character reply.
- UNDER NO CIRCUMSTANCE include command syntax anywhere else in the reply (do not restate or describe the command in conversation).
- Conversational confirmations must be natural phrases only (e.g. "Done — added that."), never reprinting the command.
- Convert relative dates (today, tomorrow, next week) to YYYY-MM-DD using ${currentDateInfo.date} as today.
- Link new items to earlier context when appropriate.
- Do NOT create commands for jokes, hypotheticals, or unrelated chit-chat.

COMMANDS (use exact names/keys):
/task {name, date, time, duration, priority, description}
/edit {taskName, status, priority, date, time}
/deleteTask {taskName}
/addNote {title, content, tags, isFavorite}
/addIdea {title, content, tags}
/addTaskNote {title, content, taskId, tags}
/save {userName, userPreference, newMemory}

RESPONSE FORMAT:
1. (Optional) One or more commands at the very start.
2. Then a natural, flowing in-character reply.
3. Maintain immersion; close in a way that invites continuation.

--- HIDDEN EXAMPLES (Do NOT expose these to users; follow style and formatting) ---

Example 1:
User: "Math test next Tuesday at 8 AM."
Assistant:
/task {name: "Math Test", date: "2025-08-12", time: "08:00", duration: 120, priority: 4, description: "Math exam — review algebra & geometry"}
"Gotcha. Want me to drill you on formulas later?"

Example 2:
User: "Idea for app to match language learners with native speakers."
Assistant:
/addIdea {title: "Language Exchange App", content: "Matches learners with native speakers for practice", tags: "language,app"}
"That’s clever. What inspired it?"

Example 3:
User: "Don’t let me forget to call Ahmed tomorrow."
Assistant:
/task {name: "Call Ahmed", date: "${currentDateInfo.date}", time: "15:00", duration: 15, priority: 3, description: "Discuss project updates"}
"Noted. You’ll be ready for it."

Example 4:
User: "Quote: 'Discipline equals freedom.'"
Assistant:
/addNote {title: "Discipline equals freedom", content: "Quote I liked", tags: "quotes,motivation", isFavorite: true}
"That one sticks. Let’s keep it close."

Example 5 — OOC (roleplay):
User: "I leap from the rooftop, land behind the enemy, and strike."
Assistant:
"You catch them off guard, and they collapse."
(OOC: Your action scenes are vivid — you’d make a great writer.)

Example 6 — OOC (real-life skill):
User: "Explained black holes to my cousin and he got it."
Assistant:
"Sounds like you made it fun."
(OOC: You have a real gift for teaching — you should explore tutoring or mentoring.)
`.trim();

  return { systemPrompt, currentDateInfo };
}

/////////////////////
// Notes / Memory / Tasks
/////////////////////
function createNoteFromAI(noteData) {
  const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const note = {
    id: noteId,
    title: noteData.title || 'Untitled',
    content: noteData.content || 'Created by assistant',
    type: noteData.type || 'note',
    tags: (noteData.tags && Array.isArray(noteData.tags)) ? noteData.tags : (noteData.tags ? ('' + noteData.tags).split(',') : []),
    isFavorite: (noteData.isFavorite === true || noteData.isFavorite === 'true'),
    isPrivate: (noteData.isPrivate === true || noteData.isPrivate === 'true'),
    isArchived: false,
    image: noteData.image || null,
    taskId: noteData.taskId || null,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  };
  let notes = JSON.parse(localStorage.getItem('notes')) || [];
  notes.unshift(note);
  localStorage.setItem('notes', JSON.stringify(notes));
  window.dispatchEvent(new CustomEvent('noteCreated', { detail: { note } }));
  console.log("📝 Note created by AI:", note);
  return note;
}

function saveMemoryFromAI(memoryData) {
  try {
    const profiles = JSON.parse(localStorage.getItem('remiProfiles')) || {};
    profiles.user = profiles.user || {};
    if (memoryData.userName) profiles.user.name = memoryData.userName;
    if (memoryData.userPreference) {
      profiles.user.preferences = profiles.user.preferences || [];
      profiles.user.preferences.push(memoryData.userPreference);
    }
    if (memoryData.newMemory) {
      profiles.user.memories = profiles.user.memories || [];
      profiles.user.memories.push({ content: memoryData.newMemory, timestamp: new Date().toISOString() });
    }
    localStorage.setItem('remiProfiles', JSON.stringify(profiles));
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { profileType: 'user', field: 'memory' } }));
    console.log("💾 Memory saved by AI:", memoryData);
    return true;
  } catch (error) {
    console.error("Error saving memory:", error);
    return false;
  }
}

function createTaskFromAI(taskData) {
  try {
    const formatTaskDate = (dateInput) => {
      if (!dateInput) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    };

    if (window.modernTaskManager && typeof window.modernTaskManager.createTaskProgrammatically === 'function') {
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
      let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
      tasks.unshift(task);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      let modernTasks = JSON.parse(localStorage.getItem('modernTasks')) || [];
      modernTasks.push({
        id: task.id, title: task.name, description: task.description, priority: task.priority,
        status: 'todo', dueDate: task.dueDate, category: task.category, tags: [], duration: task.duration,
        difficulty: 'medium', createdAt: task.createdAt, updatedAt: task.modifiedAt, completedAt: null
      });
      localStorage.setItem('modernTasks', JSON.stringify(modernTasks));
      window.dispatchEvent(new CustomEvent('taskCreated', { detail: { task: modernTasks[modernTasks.length - 1] } }));
      console.log("✅ Task created by AI (fallback):", task);
      return task;
    }
  } catch (error) {
    console.error("Error creating task:", error);
    return null;
  }
}

function editTaskFromAI(editData) {
  try {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskIndex = tasks.findIndex(task =>
      (task.name && editData.taskName && task.name.toLowerCase().includes(editData.taskName.toLowerCase())) ||
      (editData.taskName && editData.taskName.toLowerCase().includes((task.name || '').toLowerCase()))
    );
    if (taskIndex === -1) {
      console.log("❌ Task not found for editing:", editData.taskName);
      return false;
    }
    const task = tasks[taskIndex];
    if (editData.status) {
      task.completed = (editData.status === 'done' || editData.status === 'completed');
      task.completedAt = task.completed ? new Date().toISOString() : null;
    }
    Object.keys(editData).forEach(key => {
      if (key !== 'taskName' && key !== 'status' && editData[key] !== undefined) task[key] = editData[key];
    });
    task.modifiedAt = new Date().toISOString();
    tasks[taskIndex] = task;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent('taskUpdated', { detail: { action: 'updated', task } }));
    console.log("✏️ Task edited by AI:", task);
    return task;
  } catch (error) {
    console.error("Error editing task:", error);
    return false;
  }
}

function deleteTaskFromAI(deleteData) {
  try {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskIndex = tasks.findIndex(task =>
      (task.name && deleteData.taskName && task.name.toLowerCase().includes(deleteData.taskName.toLowerCase())) ||
      (deleteData.taskName && deleteData.taskName.toLowerCase().includes((task.name || '').toLowerCase()))
    );
    if (taskIndex === -1) {
      console.log("❌ Task not found for deletion:", deleteData.taskName);
      return false;
    }
    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent('taskUpdated', { detail: { action: 'deleted', task: deletedTask } }));
    console.log("🗑️ Task deleted by AI:", deletedTask);
    return deletedTask;
  } catch (error) {
    console.error("Error deleting task:", error);
    return false;
  }
}

/////////////////////
// Command handlers
/////////////////////
function handleTaskCommand(params) {
  console.log("📌 Adding task:", params);
  const task = createTaskFromAI(params);
  if (task) {
    let successMessage = `✅ Got it! I've added "${params.name || params.title}"`;
    if (params.date) {
      const d = new Date(params.date);
      if (!isNaN(d.getTime())) {
        const opts = { month: 'short', day: 'numeric' };
        if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
        successMessage += ` for ${d.toLocaleDateString('en-US', opts)}`;
      }
    }
    if (params.time) successMessage += ` at ${params.time}`;
    successMessage += '.';
    return successMessage;
  } else {
    return "❌ Hmm, I had trouble creating that task. Could you try again?";
  }
}
function handleEditCommand(params) {
  console.log("📌 Editing task:", params);
  const task = editTaskFromAI(params);
  return task ? `✏️ Done! I've updated "${params.taskName}".` : "❌ I couldn't find that task to update. Could you check the name?";
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
  const idea = createNoteFromAI({ ...params, type: 'idea' });
  return idea ? `💡 Great idea! I've captured "${params.title}".` : "❌ I couldn't save that idea right now.";
}
function handleTaskNoteCommand(params) {
  console.log("📋 Creating task-specific note:", params);
  const taskNote = createNoteFromAI({ ...params, type: 'task-note' });
  return taskNote ? `📋 Nice! I've added that note to your task.` : "❌ I couldn't add that task note.";
}
function handleDeleteTaskCommand(params) {
  console.log("🗑️ Deleting task:", params);
  const deleted = deleteTaskFromAI(params);
  return deleted ? `🗑️ All done! I've removed "${params.taskName}" from your list.` : "❌ I couldn't find that task to delete.";
}

/////////////////////
// Enhanced parser (detect misplaced commands & clean)
/////////////////////
function parseAIResponse(responseText) {
  const text = responseText || '';
  const commandRegex = /\/(\w+)\s*{([^}]*)}/g;
  let match;
  let cleanedMessage = text;
  const commandResults = [];
  let misplacedCommandDetected = false;

  // first non-whitespace position
  const firstNonWs = (text.match(/\S/) || { index: text.length }).index || 0;

  while ((match = commandRegex.exec(text)) !== null) {
    const commandName = match[1];
    const rawParams = match[2];
    const matchIndex = match.index;

    if (matchIndex > firstNonWs) {
      misplacedCommandDetected = true;
    }

    // parse params (tolerant)
    const params = {};
    const pairs = rawParams.split(',').map(p => p.trim()).filter(Boolean);
    pairs.forEach(pair => {
      const colonIndex = pair.indexOf(':');
      if (colonIndex === -1) return;
      let key = pair.substring(0, colonIndex).trim();
      let value = pair.substring(colonIndex + 1).trim();
      value = value.replace(/^["'](.*)["']$/, '$1');
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      if (/^\d+$/.test(value)) value = parseInt(value, 10);
      params[key] = value;
    });

    let result = '';
    switch (commandName) {
      case 'task': result = handleTaskCommand(params); break;
      case 'edit': result = handleEditCommand(params); break;
      case 'save': result = handleSaveCommand(params); break;
      case 'addNote': result = handleNoteCommand(params); break;
      case 'addIdea': result = handleIdeaCommand(params); break;
      case 'addTaskNote': result = handleTaskNoteCommand(params); break;
      case 'deleteTask': result = handleDeleteTaskCommand(params); break;
      default:
        console.log(`Unknown command: /${commandName}`);
        result = `❓ Unknown command: /${commandName}`;
    }

    commandResults.push(result);
    cleanedMessage = cleanedMessage.replace(match[0], '');
  }

  if (misplacedCommandDetected) {
    const warning = "⚠️ Warning: assistant included commands outside the start of its message. The response was cleaned.";
    console.warn(warning, { rawResponse: text });
    // expose warning so caller/UI can handle it
    commandResults.unshift(warning);
  }

  return {
    message: cleanedMessage.trim(),
    commandResults
  };
}

/////////////////////
// Main: call OpenAI and process
/////////////////////
async function getAIResponse(userMessage, chatHistory = []) {
  try {
    if (!hasValidAPIKey()) {
      return {
        message: "I need an OpenAI API key set in the settings to respond. Please add your API key.",
        commandResults: [{
          success: false, type: "system",
          message: "⚠️ OpenAI API key not set or invalid. Set it in Settings > Advanced."
        }],
        fullResponse: "",
        error: "API key not set"
      };
    }

    const { systemPrompt, currentDateInfo } = buildSystemPrompt();

    // conversation context (prefer profile manager)
    const aiProfileManager = getAIProfileManager();
    let conversationContext = [];
    if (aiProfileManager && typeof aiProfileManager.getConversationContext === 'function') {
      try {
        const recentHistory = aiProfileManager.getConversationContext(5) || [];
        conversationContext = recentHistory.map(e => ({ role: e.role === 'user' ? 'user' : 'assistant', content: e.content }));
        aiProfileManager.addToHistory?.('user', userMessage);
      } catch (err) {
        console.warn('AIProfileManager error', err);
      }
    } else {
      conversationContext = chatHistory.filter(m => m && m.content).map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.content }));
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationContext,
      { role: 'user', content: userMessage || '' }
    ];

    const apiKey = getOpenAIKey();
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        temperature: 0.8,
        max_tokens: 800,
        top_p: 0.95,
        frequency_penalty: 0.2,
        presence_penalty: 0.5
      })
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errData.error?.message || resp.statusText}`);
    }

    const completion = await resp.json();
    const aiMessage = completion.choices?.[0]?.message?.content || '';

    // Parse for commands and cleaned message
    const parsed = parseAIResponse(aiMessage);

    // Save to AIProfileManager history if available
    if (aiProfileManager && typeof aiProfileManager.addToHistory === 'function') {
      try {
        aiProfileManager.addToHistory('assistant', parsed.message);
      } catch (e) {
        // ignore
      }
    }

    console.log("🤖 AI Response (raw):", aiMessage);
    console.log("📝 Parsed message:", parsed.message);
    console.log("⚡ Command results:", parsed.commandResults);

    return {
      message: parsed.message,
      commandResults: parsed.commandResults,
      fullResponse: aiMessage
    };

  } catch (error) {
    console.error("❌ Error getting AI response:", error);
    return {
      message: "Sorry, I'm having trouble connecting to the AI right now. Please check your OpenAI key or try again later.",
      commandResults: [],
      fullResponse: "",
      error: error.message
    };
  }
}

/////////////////////
// Exports
/////////////////////
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
