# OpenAI API Key Setup

## Important: Replace the API Key

To use the chat functionality, you need to replace the placeholder API key in the file:

**File**: `Backend/aiResponse.js`
**Line**: 5

```javascript
// Change this line:
let OPENAI_API_KEY = "sk-proj-your-openai-api-key-here"; // Replace with actual API key

// To your actual OpenAI API key:
let OPENAI_API_KEY = "sk-proj-ACTUAL_API_KEY_HERE";
```

## How to get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the key and replace the placeholder in the code

## Security Warning

⚠️ **IMPORTANT**: This implementation exposes the API key in client-side code, which is not recommended for production. Consider implementing a backend proxy for production use.

## Features Implemented

✅ **Chat Limits**:
- Maximum 3 chat histories
- Maximum 10 messages per chat
- Automatic oldest chat removal when limit reached
- Chat deletion functionality

✅ **Maximized Mode**:
- 800px width messages wrapper on desktop
- 100% width on mobile/tablet
- Hidden stickers on small screens
- Smaller, organized input wrapper

✅ **Sticker System**:
- Only custom stickers available
- Upload custom sticker functionality
- No shop or pre-existing stickers

✅ **Chat Naming**:
- Chat names based on first user message
- Automatic truncation to 30 characters
- Fallback to timestamp if no message content

✅ **Message Counter**:
- Real-time message count display
- Visual warning as limit approaches
- Prevents sending after 10 messages
