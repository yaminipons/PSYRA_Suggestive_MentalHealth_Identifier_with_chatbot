/**
 * Personal Reflection Journal Controller
 * Handles CRUD operations, date filtering, emotion prompt injection, and modal dialogs.
 */

const JOURNAL_PROMPTS = {
  Happy: [
    "What is one tiny ordinary miracle that made you smile today?",
    "Who is someone you are deeply grateful to have crossed paths with recently?",
    "Celebrate a small win: What did you handle better today than you once would have?"
  ],
  Neutral: [
    "What was the quietest, most peaceful moment of your day?",
    "What is something you are curious about or would like to learn more about?",
    "If today was a weather pattern, what kind of sky would it be?"
  ],
  Stressed: [
    "What is one worry on your mind that doesn't actually need to be solved before bedtime?",
    "What is one thing strictly within your control right now, and one thing to surrender?",
    "Where in your body are you holding tension, and what would it feel like to soften it?"
  ],
  Low: [
    "What is one sentence of gentleness you would say to a close friend feeling this way?",
    "What is the simplest comfort you can give yourself in the next 15 minutes?",
    "Remind yourself: You do not have to prove your worth by being productive today."
  ]
};

let currentJournalList = [];
let editingEntryId = null;

async function initJournal() {
  await loadJournalEntries();

  // Populate prompt suggestions based on latest assessment
  const lastResult = AssessmentAPI.getLastResult();
  const currentEmotion = lastResult ? lastResult.category : 'Neutral';
  setupPromptGenerator(currentEmotion);

  // Set default emotion radio or select
  const emotionSelect = document.getElementById('journalEmotion');
  if (emotionSelect && currentEmotion) {
    emotionSelect.value = currentEmotion;
  }
}

async function loadJournalEntries(dateFilter = null) {
  const container = document.getElementById('journalEntriesList');
  if (!container) return;

  container.innerHTML = `
    <div class="typing-indicator" style="margin:2rem auto;">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;

  try {
    const data = await JournalAPI.list(dateFilter);
    currentJournalList = data.entries || [];
    renderJournalList(currentJournalList);
  } catch (err) {
    // If not authenticated or backend unavailable, check local storage cache
    const cached = localStorage.getItem('psyra_local_journal');
    if (cached) {
      currentJournalList = JSON.parse(cached);
      renderJournalList(currentJournalList);
    } else {
      renderEmptyState();
    }
  }
}

function renderJournalList(entries) {
  const container = document.getElementById('journalEntriesList');
  if (!container) return;

  if (!entries || entries.length === 0) {
    renderEmptyState();
    return;
  }

  container.innerHTML = entries.map(entry => {
    const dt = new Date(entry.created_at);
    const dateFormatted = dt.toLocaleDateString(undefined, { 
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
    });
    const timeFormatted = dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const emotionClass = (entry.associated_emotion || 'neutral').toLowerCase();

    return `
      <article class="card card-hover" style="margin-bottom:1.25rem;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.75rem;">
          <div>
            <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.35rem;">
              <span class="emotion-badge ${emotionClass}">${entry.associated_emotion || 'Neutral'}</span>
              <span style="font-size:0.8rem;color:var(--text-light);" class="tabular-nums">
                ${dateFormatted} · ${timeFormatted}
              </span>
            </div>
            <h3 style="font-size:1.2rem;">${escapeHtml(entry.title)}</h3>
          </div>

          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-secondary" style="font-size:0.8rem;padding:0.3rem 0.65rem;" onclick="openEditModal('${entry.id}')">
              Edit
            </button>
            <button class="btn btn-secondary" style="font-size:0.8rem;padding:0.3rem 0.65rem;color:var(--accent-coral);" onclick="confirmDeleteEntry('${entry.id}')">
              Delete
            </button>
          </div>
        </div>

        ${entry.prompt_used ? `
          <div style="font-size:0.82rem;font-style:italic;color:var(--text-light);background:var(--bg-subtle);padding:0.4rem 0.75rem;border-radius:var(--radius-sm);margin-bottom:0.75rem;border-left:3px solid var(--accent-primary);">
            Prompt: "${escapeHtml(entry.prompt_used)}"
          </div>
        ` : ''}

        <div style="font-size:0.95rem;line-height:1.6;color:var(--text-muted);white-space:pre-wrap;">${escapeHtml(entry.content)}</div>
      </article>
    `;
  }).join('');
}

function renderEmptyState() {
  const container = document.getElementById('journalEntriesList');
  if (!container) return;

  container.innerHTML = `
    <div class="card" style="text-align:center;padding:3rem 1.5rem;">
      <div style="font-size:2.2rem;margin-bottom:0.75rem;">📖</div>
      <h3 style="margin-bottom:0.5rem;">Your journal is ready for your thoughts</h3>
      <p style="max-width:440px;margin:0 auto 1.5rem;font-size:0.9rem;">
        Writing down your emotions gives your mind room to breathe. Pick a gentle prompt above or write freely.
      </p>
      <button class="btn btn-primary" onclick="openNewEntryModal()">
        Write First Entry
      </button>
    </div>
  `;
}

function setupPromptGenerator(emotion) {
  const promptContainer = document.getElementById('suggestedPromptBox');
  if (!promptContainer) return;

  const prompts = JOURNAL_PROMPTS[emotion] || JOURNAL_PROMPTS['Neutral'];
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  promptContainer.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
      <span style="font-size:0.8rem;font-weight:600;color:var(--accent-primary);text-transform:uppercase;">
        Suggested for your ${emotion} reflection
      </span>
      <button type="button" class="btn btn-secondary" style="font-size:0.75rem;padding:0.2rem 0.5rem;" onclick="setupPromptGenerator('${emotion}')">
        Shuffle ↺
      </button>
    </div>
    <p id="activePromptText" style="font-size:0.95rem;font-style:italic;color:var(--text-main);margin-bottom:0.75rem;">
      "${randomPrompt}"
    </p>
    <button type="button" class="btn btn-soft" style="font-size:0.82rem;padding:0.35rem 0.75rem;" onclick="applyPromptToForm('${randomPrompt.replace(/'/g, "\\'")}')">
      Use this prompt in entry ↓
    </button>
  `;
}

function applyPromptToForm(promptText) {
  const promptHiddenInput = document.getElementById('journalPromptUsed');
  if (promptHiddenInput) promptHiddenInput.value = promptText;

  const contentArea = document.getElementById('journalContent');
  if (contentArea) {
    if (!contentArea.value.trim()) {
      contentArea.value = `Reflection on: "${promptText}"\n\n`;
    }
    contentArea.focus();
  }
  showToast("Prompt applied to editor.", "info");
}

function openNewEntryModal() {
  editingEntryId = null;
  document.getElementById('modalJournalTitle').textContent = "New Journal Entry";
  document.getElementById('journalEntryForm').reset();
  document.getElementById('journalEntryModal').classList.add('active');
}

function openEditModal(id) {
  const entry = currentJournalList.find(e => e.id === id);
  if (!entry) return;

  editingEntryId = id;
  document.getElementById('modalJournalTitle').textContent = "Edit Journal Entry";
  document.getElementById('journalTitle').value = entry.title;
  document.getElementById('journalContent').value = entry.content;
  document.getElementById('journalEmotion').value = entry.associated_emotion || 'Neutral';
  document.getElementById('journalPromptUsed').value = entry.prompt_used || '';

  document.getElementById('journalEntryModal').classList.add('active');
}

function closeJournalModal() {
  document.getElementById('journalEntryModal').classList.remove('active');
  editingEntryId = null;
}

async function handleJournalFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('journalTitle').value.trim();
  const content = document.getElementById('journalContent').value.trim();
  const emotion = document.getElementById('journalEmotion').value;
  const promptUsed = document.getElementById('journalPromptUsed').value || null;

  if (!title || !content) {
    showToast("Please provide both a title and reflection content.", "error");
    return;
  }

  try {
    if (editingEntryId) {
      await JournalAPI.update(editingEntryId, {
        title,
        content,
        associated_emotion: emotion
      });
      showToast("Journal entry updated successfully.", "success");
    } else {
      await JournalAPI.create(title, content, emotion, promptUsed);
      showToast("Reflection saved to your private journal.", "success");
    }

    closeJournalModal();
    await loadJournalEntries();
  } catch (err) {
    showToast(`Error saving entry: ${err.message}`, "error");
  }
}

function confirmDeleteEntry(id) {
  showConfirmModal(
    "Delete Journal Entry?",
    "This entry will be permanently removed. This action cannot be undone.",
    async () => {
      try {
        await JournalAPI.delete(id);
        showToast("Entry removed.", "info");
        await loadJournalEntries();
      } catch (err) {
        showToast(`Could not delete: ${err.message}`, "error");
      }
    }
  );
}

function filterByDate(input) {
  const dateVal = input.value;
  loadJournalEntries(dateVal || null);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', initJournal);
