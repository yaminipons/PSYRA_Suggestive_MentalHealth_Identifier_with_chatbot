/**
 * 5-Question Emotional Wellness Assessment Logic
 */

const ASSESSMENT_QUESTIONS = [
  {
    index: 1,
    title: "How has your energy level been today?",
    subtitle: "Check in with your physical vitality and wakefulness.",
    options: [
      { text: "Very energetic.", scoreKey: "Happy" },
      { text: "Fairly energetic.", scoreKey: "Happy" },
      { text: "Normal.", scoreKey: "Neutral" },
      { text: "A little tired.", scoreKey: "Stressed" },
      { text: "Completely drained.", scoreKey: "Low" }
    ]
  },
  {
    index: 2,
    title: "How calm or relaxed have you felt today?",
    subtitle: "Notice whether your body and breathing feel spacious or tight.",
    options: [
      { text: "Very calm.", scoreKey: "Happy" },
      { text: "Mostly relaxed.", scoreKey: "Neutral" },
      { text: "Neither calm nor stressed.", scoreKey: "Neutral" },
      { text: "Somewhat stressed.", scoreKey: "Stressed" },
      { text: "Very overwhelmed.", scoreKey: "Stressed" }
    ]
  },
  {
    index: 3,
    title: "How connected have you felt to other people recently?",
    subtitle: "Reflect on feelings of belonging, isolation, or sharing with others.",
    options: [
      { text: "Very connected.", scoreKey: "Happy" },
      { text: "Fairly connected.", scoreKey: "Neutral" },
      { text: "Neutral.", scoreKey: "Neutral" },
      { text: "A little disconnected.", scoreKey: "Low" },
      { text: "Very disconnected.", scoreKey: "Low" }
    ]
  },
  {
    index: 4,
    title: "How would you describe your mood today?",
    subtitle: "Acknowledge whatever emotional tone is present right now.",
    options: [
      { text: "Happy and positive.", scoreKey: "Happy" },
      { text: "Mostly okay.", scoreKey: "Neutral" },
      { text: "Emotionally mixed.", scoreKey: "Neutral" },
      { text: "Worried or stressed.", scoreKey: "Stressed" },
      { text: "Sad or low.", scoreKey: "Low" }
    ]
  },
  {
    index: 5,
    title: "What would help you most right now?",
    subtitle: "Listen to what your mind and body are quietly craving.",
    options: [
      { text: "Something fun and uplifting.", scoreKey: "Happy" },
      { text: "A quiet moment to relax.", scoreKey: "Neutral" },
      { text: "Help organizing my thoughts.", scoreKey: "Stressed" },
      { text: "A way to release stress.", scoreKey: "Stressed" },
      { text: "Someone supportive to talk to.", scoreKey: "Low" }
    ]
  }
];

let currentStep = 0;
const userAnswers = [];

function initAssessment() {
  renderQuestion(currentStep);
}

function renderQuestion(stepIndex) {
  const container = document.getElementById('assessmentContainer');
  if (!container) return;

  const q = ASSESSMENT_QUESTIONS[stepIndex];
  const progressPercent = Math.round(((stepIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100);

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;" class="tabular-nums">
        <span>Question ${stepIndex + 1} of 5</span>
        <span>${progressPercent}% Complete</span>
      </div>
      <div style="height:6px;width:100%;background:var(--bg-subtle);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${progressPercent}%;background:var(--accent-primary);transition:width 0.3s ease;"></div>
      </div>
    </div>

    <div class="card" style="padding:2rem;">
      <h2 style="font-size:1.4rem;margin-bottom:0.5rem;">${q.title}</h2>
      <p style="font-size:0.95rem;color:var(--text-muted);margin-bottom:1.75rem;">${q.subtitle}</p>

      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${q.options.map((opt, idx) => `
          <button 
            type="button" 
            class="option-btn" 
            onclick="selectOption(${stepIndex}, ${idx}, '${opt.text.replace(/'/g, "\\'")}')"
            style="
              text-align:left;
              padding:1rem 1.25rem;
              border:1px solid var(--border-medium);
              border-radius:var(--radius-sm);
              background:var(--bg-surface);
              font-size:0.98rem;
              display:flex;
              align-items:center;
              justify-content:space-between;
              cursor:pointer;
              transition:all 0.15s ease;
            "
          >
            <span>${opt.text}</span>
            <span style="color:var(--text-light);font-size:1.1rem;">→</span>
          </button>
        `).join('')}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2rem;">
        ${stepIndex > 0 ? `
          <button type="button" class="btn btn-secondary" onclick="prevQuestion()">
            ← Previous
          </button>
        ` : `<div></div>`}
        <span style="font-size:0.8rem;color:var(--text-light);">
          All responses are private to your session.
        </span>
      </div>
    </div>
  `;

  // Add hover effect via JS or CSS
  const btns = container.querySelectorAll('.option-btn');
  btns.forEach(b => {
    b.onmouseenter = () => {
      b.style.borderColor = 'var(--accent-primary)';
      b.style.backgroundColor = 'var(--accent-soft)';
      b.style.transform = 'translateX(4px)';
    };
    b.onmouseleave = () => {
      b.style.borderColor = 'var(--border-medium)';
      b.style.backgroundColor = 'var(--bg-surface)';
      b.style.transform = 'translateX(0)';
    };
  });
}

async function selectOption(stepIndex, optionIndex, selectedText) {
  userAnswers[stepIndex] = {
    question_index: stepIndex + 1,
    option_index: optionIndex,
    selected_option: selectedText
  };

  if (stepIndex < ASSESSMENT_QUESTIONS.length - 1) {
    currentStep++;
    renderQuestion(currentStep);
  } else {
    // Complete assessment
    await finishAssessment();
  }
}

function prevQuestion() {
  if (currentStep > 0) {
    currentStep--;
    renderQuestion(currentStep);
  }
}

async function finishAssessment() {
  const container = document.getElementById('assessmentContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="card" style="text-align:center;padding:3rem 2rem;">
      <div class="typing-indicator" style="margin:0 auto 1.5rem;">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
      <h2>Reflecting on your answers...</h2>
      <p style="margin-top:0.5rem;">Psyra is preparing your personalized emotional wellness space.</p>
    </div>
  `;

  try {
    const result = await AssessmentAPI.submit(userAnswers);
    showToast("Assessment completed successfully!", "success");
    // Redirect to dashboard with result
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 800);
  } catch (err) {
    showToast(`Error completing check-in: ${err.message}`, "error");
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:2rem;">
        <h3 style="color:var(--accent-coral);">Could not submit assessment</h3>
        <p style="margin:1rem 0;">${err.message}</p>
        <button class="btn btn-primary" onclick="initAssessment()">Retry Check-in</button>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', initAssessment);
