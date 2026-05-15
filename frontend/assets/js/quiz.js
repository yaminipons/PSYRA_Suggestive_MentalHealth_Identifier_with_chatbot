// assets/js/quiz.js
// PSYRA — Quiz logic (backend-integrated + result modal)

(function () {

  /* ── DOM refs ── */
  const form          = document.getElementById('quizForm');
  const overlay       = document.getElementById('resultOverlay');
  const closeBtn      = document.getElementById('modalClose');
  const continueBtn   = document.getElementById('modalContinue');
  const progressFill  = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const QUESTIONS     = ['q1', 'q2', 'q3', 'q4', 'q5'];

  /* ── State / modal config ── */
  const STATES = [
    {
      levels: ['Happy'],
      min: 16, max: 20,
      emoji: '😊', ring: '#00bfa6',
      gradient: 'linear-gradient(135deg,#e0fff9,#fffde7)',
      message: "You're shining! Keep nurturing that positive energy. 💚"
    },
    {
      levels: ['Neutral'],
      min: 11, max: 15,
      emoji: '🙂', ring: '#5bc4b8',
      gradient: 'linear-gradient(135deg,#e8f8f5,#fef9ec)',
      message: "You're doing okay — steady and resilient. One step at a time. 🌿"
    },
    {
      levels: ['Stressed'],
      min: 6, max: 10,
      emoji: '😟', ring: '#ffab66',
      gradient: 'linear-gradient(135deg,#fff4e6,#fffde7)',
      message: "Take a breath. You're not alone — try a calming activity below. 🌸"
    },
    {
      levels: ['Low'],
      min: 0, max: 5,
      emoji: '😔', ring: '#8fb0ac',
      gradient: 'linear-gradient(135deg,#eaf4f4,#f0f4f8)',
      message: "It's okay to not be okay. Be gentle with yourself today. 💙"
    }
  ];

  /* ── Helper: get state config by level string OR score ── */
  function getStateByLevel(level) {
    return STATES.find(s => s.levels.includes(level)) || null;
  }
  function getStateByScore(score) {
    return STATES.find(s => score >= s.min && score <= s.max) || STATES[3];
  }

  /* ── Progress bar ── */
  function updateProgress() {
    const answered = QUESTIONS.filter(
      q => form.querySelector(`input[name="${q}"]:checked`)
    ).length;
    if (progressFill)  progressFill.style.width = (answered / QUESTIONS.length * 100) + '%';
    if (progressLabel) progressLabel.textContent = `${answered} / ${QUESTIONS.length} answered`;
  }

  /* ── Highlight selected option ── */
  form.addEventListener('change', function (e) {
    if (e.target.type === 'radio') {
      document.querySelectorAll(`input[name="${e.target.name}"]`).forEach(r => {
        r.closest('.option-label').classList.remove('selected');
      });
      e.target.closest('.option-label').classList.add('selected');
      updateProgress();
    }
  });

  /* ══════════════════════════════════════════════════════
     FORM SUBMIT  — original backend logic preserved exactly,
     modal layered on top of the success path
     ══════════════════════════════════════════════════════ */
  form?.addEventListener('submit', async function (e) {
    e.preventDefault();

    /* ── Original answer collection ── */
    const answers = QUESTIONS.map(name => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : null;
    });

    /* ── Original validation (enhanced with shake animation) ── */
    if (answers.some(a => a === null)) {
      const firstIdx = answers.indexOf(null);
      const firstQ   = form.querySelectorAll('.question')[firstIdx];
      if (firstQ) {
        firstQ.classList.add('shake');
        firstQ.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => firstQ.classList.remove('shake'), 600);
      } else {
        alert("Please answer all questions");
      }
      return;
    }

    /* ── Original submit button feedback ── */
    const btn          = form.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText  = 'Calculating...';
    btn.disabled   = true;

    /* ── Original backend call (unchanged) ── */
    try {
      const res = await fetch("http://localhost:5000/api/quiz/submit", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('user_id'),
          token:   localStorage.getItem('token'),
          answers
        })
      });
      const data = await res.json();

      if (data.ok) {
        /* ── Original localStorage saves ── */
        localStorage.setItem('last_score', data.score);
        localStorage.setItem('last_level', data.level);

        /* ── NEW: show result modal instead of setTimeout redirect ──
           The Continue button inside the modal does the redirect to recommend.html */
        const score = typeof data.score === 'number' ? data.score : 0;
        const level = data.level || '';
        const pct   = typeof data.percentage === 'number'
                        ? data.percentage
                        : Math.round((score / 20) * 100);

        const state = getStateByLevel(level) || getStateByScore(score);

        btn.innerText = originalText;
        btn.disabled  = false;

        showModal(state, level || state.levels[0], pct);

      } else {
        btn.innerText = originalText;
        btn.disabled  = false;
        alert(data.error || "Submission failed");
      }

    } catch (err) {
      btn.innerText = originalText;
      btn.disabled  = false;
      alert("Network error");
      console.error(err);
    }
  });

  /* ══════════════════════════════
     MODAL LOGIC
     ══════════════════════════════ */
  function showModal(state, levelLabel, pct) {
    document.getElementById('modalEmoji').textContent   = state.emoji;
    document.getElementById('modalState').textContent   = levelLabel;
    document.getElementById('modalMessage').textContent = state.message;
    document.getElementById('scorePct').textContent     = pct + '%';

    const scoreLabels = {
      Happy: 'Wellness', Neutral: 'Balance',
      Stressed: 'Stress Level', Low: 'Mood Level'
    };
    document.getElementById('scoreLabel').textContent =
      scoreLabels[levelLabel] || 'Score';

    // Ring animation
    const ring          = document.getElementById('ringFill');
    const circumference = 314; // 2 * π * 50
    ring.style.stroke           = state.ring;
    ring.style.strokeDashoffset = circumference;

    // Card gradient
    overlay.querySelector('.modal-card').style.background = state.gradient;

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      setTimeout(() => {
        ring.style.strokeDashoffset = circumference - (pct / 100) * circumference;
      }, 200);
    });
  }

  function closeModal() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ── Continue → original redirect destination ── */
  continueBtn.addEventListener('click', () => {
    window.location.href = 'recommend.html';
  });

})();