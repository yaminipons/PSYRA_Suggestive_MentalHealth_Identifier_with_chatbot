/**
 * Dashboard Controller for PSYRA
 * Handles personalized emotional category display, recommended activities, and history.
 */

async function loadDashboard() {
  const user = getUser() || { display_name: 'Friend' };
  const userGreetingEl = document.getElementById('userGreeting');
  if (userGreetingEl) {
    userGreetingEl.textContent = `Welcome, ${user.display_name}`;
  }

  // Retrieve current or last assessment result
  let result = AssessmentAPI.getLastResult();

  // If none in local storage, check API history
  if (!result && isAuthenticated()) {
    try {
      const historyData = await AssessmentAPI.getHistory();
      if (historyData.history && historyData.history.length > 0) {
        result = historyData.history[0];
      }
    } catch (_) {}
  }

  // Default fallback if brand new user has not completed check-in yet
  if (!result) {
    renderEmptyAssessmentState();
  } else {
    renderCurrentEmotionResult(result);
  }

  // Load history list
  loadAssessmentHistory();
}

function renderEmptyAssessmentState() {
  const resultCard = document.getElementById('emotionResultCard');
  if (!resultCard) return;

  resultCard.innerHTML = `
    <div style="text-align:center;padding:2rem;">
      <div style="font-size:2.5rem;margin-bottom:0.75rem;">🌿</div>
      <h2 style="margin-bottom:0.5rem;">Take your first wellness check-in</h2>
      <p style="max-width:480px;margin:0 auto 1.5rem;">
        Complete our 5 gentle questions to receive personalized soundscapes, journaling prompts, and self-care recommendations.
      </p>
      <a href="/assessment.html" class="btn btn-primary" style="padding:0.7rem 1.5rem;">
        Start 2-Minute Check-in
      </a>
    </div>
  `;

  // Render neutral exploratory recommendations
  renderRecommendations([
    {
      id: 'default_chat',
      title: 'Chat with Psyra AI',
      category: 'AI Companion',
      description: 'Start a gentle conversation about your thoughts and feelings today.',
      duration: 'Anytime',
      action_url: '/chat.html'
    },
    {
      id: 'default_doodle',
      title: 'Express Yourself on Canvas',
      category: 'Doodle',
      description: 'Draw, sketch, or trace calming patterns with peaceful colors.',
      duration: '5 mins',
      action_url: '/doodle.html'
    },
    {
      id: 'default_music',
      title: 'Listen to Ambient Soundscapes',
      category: 'Music',
      description: 'Play ocean waves, rain on glass, or Tibetan singing bowls.',
      duration: '15 mins',
      action_url: '/music.html'
    }
  ]);
}

function renderCurrentEmotionResult(result) {
  const resultCard = document.getElementById('emotionResultCard');
  if (!resultCard) return;

  const category = result.category || 'Neutral';
  const catLower = category.toLowerCase();

  resultCard.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1.25rem;">
      <div>
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
          <span class="emotion-badge ${catLower}">Current Space: ${category}</span>
          <span style="font-size:0.8rem;color:var(--text-light);" class="tabular-nums">
            ${result.confidence_label || 'Balanced Alignment'}
          </span>
        </div>
        <h2 style="font-size:1.6rem;margin-bottom:0.4rem;">${result.summary}</h2>
      </div>
      <div style="display:flex;gap:0.6rem;">
        <a href="/assessment.html" class="btn btn-secondary" style="font-size:0.82rem;padding:0.45rem 0.9rem;">
          Retake Check-in
        </a>
        <a href="/chat.html" class="btn btn-primary" style="font-size:0.82rem;padding:0.45rem 0.9rem;">
          Talk to Psyra
        </a>
      </div>
    </div>

    <p style="font-size:0.98rem;line-height:1.6;color:var(--text-muted);margin-bottom:1.5rem;padding:1rem;background:var(--bg-subtle);border-radius:var(--radius-sm);border:1px solid var(--border-light);">
      ${result.supportive_message}
    </p>

    <div>
      <h3 style="font-size:1.1rem;margin-bottom:0.25rem;">Recommended for Your Headspace</h3>
      <p style="font-size:0.85rem;color:var(--text-light);margin-bottom:1rem;">
        Choose what feels right for you—there is never any pressure to complete them all.
      </p>
      <div class="activity-grid" id="activityGridContainer">
        <!-- Activities populated below -->
      </div>
    </div>
  `;

  renderRecommendations(result.recommendations || []);
}

function renderRecommendations(recs) {
  const container = document.getElementById('activityGridContainer');
  if (!container) return;

  if (!recs || recs.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);">No specific activities recommended right now.</p>`;
    return;
  }

  container.innerHTML = recs.map(act => `
    <div class="card card-hover activity-card">
      <div>
        <div class="activity-meta">
          <span>${act.category}</span> · <span class="tabular-nums">${act.duration}</span>
        </div>
        <h4 class="activity-title">${act.title}</h4>
        <p class="activity-desc">${act.description}</p>
      </div>
      <a href="${act.action_url || '#'}" class="btn btn-secondary" style="margin-top:auto;width:100%;text-align:center;">
        Start Activity
      </a>
    </div>
  `).join('');
}

async function loadAssessmentHistory() {
  const historyContainer = document.getElementById('assessmentHistoryList');
  if (!historyContainer) return;

  if (!isAuthenticated()) {
    historyContainer.innerHTML = `
      <p style="font-size:0.9rem;color:var(--text-muted);">
        Sign in to save and track your wellness check-ins across multiple days.
      </p>
    `;
    return;
  }

  try {
    const data = await AssessmentAPI.getHistory();
    if (!data.history || data.history.length === 0) {
      historyContainer.innerHTML = `
        <p style="font-size:0.9rem;color:var(--text-muted);">
          Your historical reflections will appear here as you complete check-ins.
        </p>
      `;
      return;
    }

    historyContainer.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${data.history.slice(0, 5).map(item => {
          const dt = new Date(item.created_at);
          const dateStr = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          const timeStr = dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
          const cat = item.category.toLowerCase();

          return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:var(--bg-surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);">
              <div style="display:flex;align-items:center;gap:0.75rem;">
                <span class="emotion-badge ${cat}">${item.category}</span>
                <span style="font-size:0.85rem;color:var(--text-muted);">${item.summary}</span>
              </div>
              <div style="font-size:0.8rem;color:var(--text-light);" class="tabular-nums">
                ${dateStr} · ${timeStr}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    historyContainer.innerHTML = `<p style="font-size:0.85rem;color:var(--text-light);">Could not load history at this moment.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
