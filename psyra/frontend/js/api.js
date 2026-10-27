/**
 * PSYRA API Client & State Management
 * Handles JWT storage, API communications, and toast notifications.
 */

const API_BASE = ''; // Same origin relative requests

// Local State Storage Keys
const TOKEN_KEY = 'psyra_jwt_token';
const USER_KEY = 'psyra_user_data';
const THEME_KEY = 'psyra_theme';
const LAST_ASSESSMENT_KEY = 'psyra_last_assessment';

// Toast Notification Engine
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '•';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'info') icon = 'ℹ';

  toast.innerHTML = `<span style="font-weight:bold;margin-right:4px;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Confirmation Modal Helper
function showConfirmModal(title, message, onConfirm) {
  let modal = document.getElementById('psyraConfirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'psyraConfirmModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <h3 id="modalTitle" style="margin-bottom:0.75rem;">Confirm Action</h3>
        <p id="modalMsg" style="margin-bottom:1.5rem;color:var(--text-muted);"></p>
        <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
          <button id="modalCancel" class="btn btn-secondary">Cancel</button>
          <button id="modalConfirm" class="btn btn-primary">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').textContent = message;

  const cancelBtn = document.getElementById('modalCancel');
  const confirmBtn = document.getElementById('modalConfirm');

  const closeModal = () => {
    modal.classList.remove('active');
  };

  cancelBtn.onclick = closeModal;
  confirmBtn.onclick = () => {
    closeModal();
    if (onConfirm) onConfirm();
  };

  modal.classList.add('active');
}

// Auth State Getters & Setters
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getUser() {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

function setUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function isAuthenticated() {
  return !!getToken();
}

// Core API Fetch Wrapper
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.detail || (data.message) || `Error (${res.status}): Something went wrong`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

// Auth API Methods
const AuthAPI = {
  async register(displayName, email, password, confirmPassword) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        display_name: displayName,
        email,
        password,
        confirm_password: confirmPassword
      })
    });
    setToken(data.access_token);
    setUser(data.user);
    return data;
  },

  async login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.access_token);
    setUser(data.user);
    return data;
  },

  async logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    setToken(null);
    setUser(null);
    window.location.href = '/login.html';
  },

  async getMe() {
    try {
      const user = await apiFetch('/api/auth/me');
      setUser(user);
      return user;
    } catch (e) {
      return null;
    }
  }
};

// Assessment API Methods
const AssessmentAPI = {
  async submit(answers) {
    const data = await apiFetch('/api/assessment', {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
    localStorage.setItem(LAST_ASSESSMENT_KEY, JSON.stringify(data));
    return data;
  },

  getLastResult() {
    const saved = localStorage.getItem(LAST_ASSESSMENT_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  async getHistory() {
    return await apiFetch('/api/assessment/history');
  }
};

// Chat API Methods
const ChatAPI = {
  async sendMessage(message, history, shareEmotionContext = false, emotionCategory = null) {
    return await apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history,
        share_emotion_context: shareEmotionContext,
        current_emotion_category: emotionCategory
      })
    });
  }
};

// Journal API Methods
const JournalAPI = {
  async list(dateFilter = null) {
    const q = dateFilter ? `?date_filter=${encodeURIComponent(dateFilter)}` : '';
    return await apiFetch(`/api/journal${q}`);
  },

  async create(title, content, associatedEmotion = 'Neutral', promptUsed = null) {
    return await apiFetch('/api/journal', {
      method: 'POST',
      body: JSON.stringify({
        title,
        content,
        associated_emotion: associatedEmotion,
        prompt_used: promptUsed
      })
    });
  },

  async update(id, updates) {
    return await apiFetch(`/api/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async delete(id) {
    return await apiFetch(`/api/journal/${id}`, {
      method: 'DELETE'
    });
  }
};

// Music API Methods
const MusicAPI = {
  async getRecommendations(category = null, emotion = null) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (emotion) params.set('emotion', emotion);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch(`/api/music/recommendations${qs}`);
  }
};

// Auto-seed Guest demo account if first time visit to make testing effortless
(function initGuestIfEmpty() {
  if (!getToken()) {
    // If user hasn't registered yet, provide friendly guest mode fallback
    const guestUser = {
      id: 'guest_user_demo',
      display_name: 'Guest Friend',
      email: 'guest@psyra.app',
      created_at: new Date().toISOString(),
      preferred_theme: 'light'
    };
    setUser(guestUser);
  }
})();
