// assets/js/chat.js

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

const API_URL = "http://localhost:5000/api/chat/message"; // FIXED

function appendMessage(kind, text){
  const wrap = document.createElement('div');
  wrap.className = `message ${kind}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerText = text;
  wrap.appendChild(bubble);
  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping(){
  const t = document.createElement('div');
  t.id = 'typing';
  t.className = 'message bot';
  t.innerHTML = `<div class="bubble">PSYRA is typing <span class="typing">…</span></div>`;
  chatBox.appendChild(t);
  chatBox.scrollTop = chatBox.scrollHeight;
}
function hideTyping(){ const el = document.getElementById('typing'); if(el) el.remove(); }

async function sendMessage(){
  const text = userInput.value.trim();
  if(!text) return;

  appendMessage('user', `You: ${text}`);
  userInput.value = '';
  showTyping();

  try {
    const res = await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ 
        user_id: localStorage.getItem("user_id") || "guest",
        message: text
      })
    });

    hideTyping();
    const responses = await res.json();

    if(!responses || responses.length === 0){
      appendMessage('bot', "Sorry, could you repeat that?");
      return;
    }

    for(const msg of responses){
      appendMessage('bot', msg.text);
    }

  } catch(error){
    console.error(error);
    hideTyping();
    appendMessage('bot', "⚠️ Unable to connect to server.");
  }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e)=>{
  if(e.key === "Enter") sendMessage();
});
