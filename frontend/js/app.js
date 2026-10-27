/**
 * Global PSYRA Application Shell & UI Interactions
 */

// Initialize Theme
function initTheme() {
  const saved = localStorage.getItem('psyra_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('psyra_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.innerHTML = theme === 'dark' 
      ? '<span title="Switch to Light Mode">☀</span>' 
      : '<span title="Switch to Dark Mode">☽</span>';
  }
}

// Render Global Header
function renderGlobalHeader() {
  const headerContainer = document.getElementById('siteHeaderContainer');
  if (!headerContainer) return;

  const currentPath = window.location.pathname;
  const isAuth = isAuthenticated();
  const user = getUser();
  const displayName = user ? user.display_name : 'Guest';

  headerContainer.innerHTML = `
    <header class="site-header">
      <div class="container nav-wrap">
        <!-- Zone 1: Single Brand Wordmark -->
        <a href="/index.html" class="brand-link">
          <img src="/src/assets/images/psyra_mascot_1793120890913.jpg" alt="Psyra Mascot" class="brand-icon" onerror="this.style.display='none'">
          <span>PSYRA</span>
        </a>

        <!-- Zone 2: 4-5 Navigation Links -->
        <nav class="main-nav" aria-label="Main Navigation">
          <a href="/dashboard.html" class="nav-item ${currentPath.includes('dashboard') ? 'active' : ''}">Dashboard</a>
          <a href="/assessment.html" class="nav-item ${currentPath.includes('assessment') ? 'active' : ''}">Assessment</a>
          <a href="/chat.html" class="nav-item ${currentPath.includes('chat') ? 'active' : ''}">AI Companion</a>
          <a href="/doodle.html" class="nav-item ${currentPath.includes('doodle') ? 'active' : ''}">Doodle Board</a>
          <a href="/journal.html" class="nav-item ${currentPath.includes('journal') ? 'active' : ''}">Journal</a>
          <a href="/music.html" class="nav-item ${currentPath.includes('music') ? 'active' : ''}">Music</a>
        </nav>

        <!-- Zone 3: Actions & Auth -->
        <div class="header-actions">
          <button id="themeToggleBtn" class="btn-icon" aria-label="Toggle Theme" onclick="toggleTheme()">
            <span>☽</span>
          </button>
          
          ${isAuth ? `
            <div style="display:flex;align-items:center;gap:0.6rem;">
              <span style="font-size:0.85rem;font-weight:500;color:var(--text-muted);" class="tabular-nums">
                ${displayName}
              </span>
              <button class="btn btn-secondary" style="padding:0.4rem 0.8rem;font-size:0.82rem;" onclick="AuthAPI.logout()">
                Log Out
              </button>
            </div>
          ` : `
            <a href="/login.html" class="btn btn-secondary" style="padding:0.4rem 0.8rem;font-size:0.82rem;">Log In</a>
            <a href="/register.html" class="btn btn-primary" style="padding:0.4rem 0.8rem;font-size:0.82rem;">Sign Up</a>
          `}
        </div>
      </div>
    </header>
  `;

  initTheme();
}

// Render Global Footer
function renderGlobalFooter() {
  const footerContainer = document.getElementById('siteFooterContainer');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <footer style="margin-top:auto;padding:2.5rem 0;border-top:1px solid var(--border-light);background-color:var(--bg-subtle);">
      <div class="container" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:1.5rem;">
        <div>
          <div style="font-family:var(--font-display);font-weight:700;color:var(--text-main);margin-bottom:0.25rem;">
            PSYRA (Psychological Relief Assistant)
          </div>
          <p style="font-size:0.85rem;color:var(--text-muted);">
            A safe space holding room for every emotion. Self-reflection & wellness companion.
          </p>
        </div>
        <div style="font-size:0.82rem;color:var(--text-light);text-align:right;">
          <div>Non-clinical wellness reflection tool. Not medical care.</div>
          <div style="margin-top:4px;">In crisis? Call or text <strong>988</strong> anytime.</div>
        </div>
      </div>
    </footer>
  `;
}

// Attach listeners when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  renderGlobalHeader();
  renderGlobalFooter();
});
