/**
 * PSYRA AI Companion Chat Controller
 * Communicates with backend Grok xAI API service.
 */

const CHAT_STORAGE_KEY = 'psyra_chat_history';
let messageHistory = [];
let isSending = false;

function initChat() {
  // Load session chat history from storage if available
  const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
  if (saved) {
    try {
      messageHistory = JSON.parse(saved);
    } catch (_) {
      messageHistory = [];
    }
  }

  // Pre-fill greeting if empty
  if (messageHistory.length === 0) {
    const lastResult = AssessmentAPI.getLastResult();
    let introText = "Hello, friend. I'm Psyra, your non-judgmental wellness companion. I'm here to hold space for whatever is on your mind today. How are you feeling in this moment?";
    if (lastResult && lastResult.category) {
      introText = `Hello, friend. I'm Psyra. I noticed your recent check-in reflected a ${lastResult.category.toLowerCase()} headspace. I'm here beside you to listen, offer a calming exercise, or simply hold quiet space. How can I support you right now?`;
    }
    messageHistory.push({
      role: 'assistant',
      content: introText
    });
    saveChatToSession();
  }

  // Check URL parameters for starter prompt
  const urlParams = new URLSearchParams(window.location.search);
  const starter = urlParams.get('starter');
  
  renderChatMessages();

  // If emotion context available, setup toggle status
  const lastResult = AssessmentAPI.getLastResult();
  const contextIndicator = document.getElementById('emotionContextIndicator');
  const contextToggle = document.getElementById('shareEmotionToggle');
  if (lastResult && lastResult.category && contextIndicator) {
    contextIndicator.textContent = `Current Headspace: ${lastResult.category}`;
    if (contextToggle) contextToggle.checked = true;
  } else if (contextIndicator) {
    contextIndicator.textContent = `No check-in context recorded yet`;
  }

  // Trigger starter if requested via URL
  if (starter) {
    const starterMap = {
      breathing: "Can we try a short breathing exercise?",
      mindfulness: "Can you guide me through a quick mindfulness exercise?",
      support: "I'm feeling down and could use a compassionate ear.",
      celebrate: "I had a small win today that I'd love to share!"
    };
    if (starterMap[starter]) {
      sendChatMessage(starterMap[starter]);
    }
  }
}

function saveChatToSession() {
  sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messageHistory));
}

function renderChatMessages() {
  const container = document.getElementById('chatMessagesContainer');
  if (!container) return;

  container.innerHTML = messageHistory.map(msg => {
    const isBot = msg.role === 'assistant';
    const avatar = isBot 
      ? `<img src="/src/assets/images/psyra_mascot_1793120890913.jpg" class="chat-bot-avatar" style="width:34px;height:34px;margin-right:0.6rem;flex-shrink:0;" alt="Psyra" onerror="this.style.display='none'">`
      : '';

    // Convert markdown bold and linebreaks safely
    const formatted = formatMessageContent(msg.content);

    return `
      <div style="display:flex;align-items:flex-start;${isBot ? '' : 'justify-content:flex-end;'}">
        ${avatar}
        <div class="message-bubble ${isBot ? 'message-bot' : 'message-user'}">
          ${formatted}
        </div>
      </div>
    `;
  }).join('');

  scrollToBottom();
}

function formatMessageContent(text) {
  if (!text) return '';
  // Basic safe markdown parsing
  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text**
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Bullets
  safe = safe.replace(/^•\s+(.*)$/gm, '<li style="margin-left:1rem;">$1</li>');

  // Paragraphs
  const paragraphs = safe.split(/\n\n+/);
  return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

function scrollToBottom() {
  const container = document.getElementById('chatMessagesContainer');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

async function sendChatMessage(customText = null) {
  if (isSending) return;

  const inputEl = document.getElementById('chatInput');
  const messageText = customText || (inputEl ? inputEl.value.trim() : '');

  if (!messageText) return;

  if (inputEl) inputEl.value = '';

  // Append user message
  messageHistory.push({ role: 'user', content: messageText });
  saveChatToSession();
  renderChatMessages();

  // Show typing indicator
  showTypingIndicator();
  isSending = true;

  // Retrieve user emotion context if consented
  const shareContext = document.getElementById('shareEmotionToggle')?.checked || false;
  const lastResult = AssessmentAPI.getLastResult();
  const emotionCategory = (shareContext && lastResult) ? lastResult.category : null;

  try {
    const res = await ChatAPI.sendMessage(
      messageText,
      messageHistory.slice(0, -1), // prior history
      shareContext,
      emotionCategory
    );

    hideTypingIndicator();

    messageHistory.push({ role: 'assistant', content: res.reply });
    saveChatToSession();
    renderChatMessages();

    // If suggestions returned, update suggestion pills
    if (res.suggested_followups && res.suggested_followups.length > 0) {
      renderSuggestionPills(res.suggested_followups);
    }

    if (res.crisis_triggered) {
      showToast("Crisis resources provided. You are never alone.", "info");
    }
  } catch (err) {
    hideTypingIndicator();
    showToast(`Could not connect to Grok: ${err.message}`, "error");

    messageHistory.push({
      role: 'assistant',
      content: "I'm having a little trouble connecting with the network right now, but please take a slow breath. If you need immediate human care or crisis support, remember you can dial 988 anytime. What would be most calming for you right now?"
    });
    saveChatToSession();
    renderChatMessages();
  } finally {
    isSending = false;
  }
}

function showTypingIndicator() {
  const container = document.getElementById('chatMessagesContainer');
  if (!container) return;

  let indicator = document.getElementById('chatTypingIndicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'chatTypingIndicator';
    indicator.style.display = 'flex';
    indicator.style.alignItems = 'center';
    indicator.style.gap = '0.5rem';
    indicator.innerHTML = `
      <img src="/src/assets/images/psyra_mascot_1793120890913.jpg" class="chat-bot-avatar" style="width:30px;height:30px;" alt="Psyra" onerror="this.style.display='none'">
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    container.appendChild(indicator);
  }
  scrollToBottom();
}

function hideTypingIndicator() {
  const indicator = document.getElementById('chatTypingIndicator');
  if (indicator) indicator.remove();
}

function renderSuggestionPills(suggestions) {
  const container = document.getElementById('chatStartersContainer');
  if (!container) return;

  container.innerHTML = suggestions.map(text => `
    <button type="button" class="starter-chip" onclick="sendChatMessage('${text.replace(/'/g, "\\'")}')">
      ${text}
    </button>
  `).join('');
}

function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

function clearChatSession() {
  showConfirmModal(
    "Clear Conversation?",
    "This will clear the current message bubbles on this screen. Your assessments and journal entries will not be affected.",
    () => {
      messageHistory = [{
        role: 'assistant',
        content: "Chat cleared. I'm ready whenever you'd like to share what's on your heart."
      }];
      saveChatToSession();
      renderChatMessages();
      showToast("Conversation refreshed.", "info");
    }
  );
}

document.addEventListener('DOMContentLoaded', initChat);
