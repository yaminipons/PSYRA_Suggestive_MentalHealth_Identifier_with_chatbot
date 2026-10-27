/**
 * Music & Ambient Sound Therapy Controller
 * Includes real Web Audio API ambient soundscape synthesis (Ocean, Rain, Stream, Bowl)
 * and mood-categorized curated recommendations.
 */

let audioCtx = null;
let currentSoundType = null;
let activeSoundNodes = [];
let isPlaying = false;
let globalMasterGain = null;

const AMBIENT_SOUNDSCAPES = {
  ocean: {
    title: "Gentle Ocean Swells",
    icon: "🌊",
    desc: "Soft rhythmic white/pink noise modulated to mirror restorative deep breathing."
  },
  rain: {
    title: "Rain on Window",
    icon: "🌧️",
    desc: "Gentle textured precipitation filter that quiets busy background chatter."
  },
  stream: {
    title: "Babbling Forest Brook",
    icon: "🌿",
    desc: "Layered resonance frequencies of natural water trickling over smooth river stones."
  },
  bowl: {
    title: "Tibetan Singing Bowl (432 Hz)",
    icon: "🔔",
    desc: "Harmonic pure sine waves tuned to release nervous system tension and induce calm."
  }
};

async function initMusicPage() {
  // Check user latest emotion to suggest default category
  const lastResult = AssessmentAPI.getLastResult();
  let defaultCategory = 'calming';
  if (lastResult && lastResult.category) {
    const map = {
      Happy: 'uplifting',
      Neutral: 'calming',
      Stressed: 'relaxation',
      Low: 'relaxation'
    };
    defaultCategory = map[lastResult.category] || 'calming';
  }

  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const paramCat = urlParams.get('category');
  if (paramCat) defaultCategory = paramCat;

  renderCategoryTabs(defaultCategory);
  await loadCategoryRecommendations(defaultCategory);

  // Setup Volume Slider
  const volumeSlider = document.getElementById('soundVolumeSlider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      if (globalMasterGain && audioCtx) {
        globalMasterGain.gain.setValueAtTime(vol, audioCtx.currentTime);
      }
    });
  }
}

function renderCategoryTabs(activeCat) {
  const tabsContainer = document.getElementById('categoryTabsContainer');
  if (!tabsContainer) return;

  const cats = [
    { id: 'uplifting', label: 'Uplifting & Bright' },
    { id: 'calming', label: 'Calming & Mindful' },
    { id: 'focus', label: 'Deep Focus' },
    { id: 'relaxation', label: 'Stress Release & Rest' }
  ];

  tabsContainer.innerHTML = cats.map(c => `
    <button 
      type="button" 
      class="btn ${c.id === activeCat ? 'btn-primary' : 'btn-secondary'}" 
      style="padding:0.45rem 1rem;font-size:0.85rem;" 
      onclick="switchCategory('${c.id}')"
    >
      ${c.label}
    </button>
  `).join('');
}

async function switchCategory(cat) {
  renderCategoryTabs(cat);
  await loadCategoryRecommendations(cat);
}

async function loadCategoryRecommendations(category) {
  const container = document.getElementById('musicListContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="typing-indicator" style="margin:2rem auto;">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;

  try {
    const data = await MusicAPI.getRecommendations(category);
    const tracks = data.tracks || [];

    if (tracks.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);">No recommendations found.</p>`;
      return;
    }

    container.innerHTML = tracks.map(trk => `
      <div class="card card-hover" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:1rem;">
        <div style="max-width:540px;">
          <div style="font-size:0.8rem;color:var(--text-light);margin-bottom:0.25rem;">
            <span>${trk.artist_or_source}</span> · <span class="tabular-nums">${trk.duration_approx}</span>
          </div>
          <h4 style="font-size:1.15rem;margin-bottom:0.35rem;">${trk.title}</h4>
          <p style="font-size:0.88rem;color:var(--text-muted);">${trk.description}</p>
        </div>

        <div style="display:flex;align-items:center;gap:0.75rem;">
          ${trk.ambient_sound_type && AMBIENT_SOUNDSCAPES[trk.ambient_sound_type] ? `
            <button class="btn btn-secondary" style="font-size:0.82rem;" onclick="playSynthesizedAmbient('${trk.ambient_sound_type}')">
              Synthesize Audio 🔊
            </button>
          ` : ''}
          <a href="${trk.external_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="font-size:0.82rem;">
            Listen on YouTube ↗
          </a>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:var(--text-muted);">Could not load music list at this time.</p>`;
  }
}

// Web Audio API Synthesizer (Authentic Zero-Dependency Relaxation Generator)
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    globalMasterGain = audioCtx.createGain();
    globalMasterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    globalMasterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function stopAmbientSound() {
  activeSoundNodes.forEach(node => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch (_) {}
  });
  activeSoundNodes = [];
  isPlaying = false;
  currentSoundType = null;
  updateAmbientStatusUI();
}

function playSynthesizedAmbient(type) {
  const ctx = getAudioContext();
  if (isPlaying && currentSoundType === type) {
    stopAmbientSound();
    return;
  }

  stopAmbientSound();
  currentSoundType = type;
  isPlaying = true;

  if (type === 'bowl') {
    synthesizeSingingBowl(ctx);
  } else if (type === 'rain') {
    synthesizeRain(ctx);
  } else if (type === 'ocean') {
    synthesizeOcean(ctx);
  } else if (type === 'stream') {
    synthesizeStream(ctx);
  } else {
    synthesizeOcean(ctx);
  }

  updateAmbientStatusUI();
  showToast(`Playing ${AMBIENT_SOUNDSCAPES[type]?.title || 'ambient sound'}`, "success");
}

function updateAmbientStatusUI() {
  const statusEl = document.getElementById('activeAmbientStatus');
  const nowPlayingCard = document.getElementById('nowPlayingCard');
  if (!statusEl) return;

  if (isPlaying && currentSoundType) {
    const meta = AMBIENT_SOUNDSCAPES[currentSoundType] || { title: 'Ambient Waves', icon: '🎵' };
    statusEl.innerHTML = `
      <span style="font-size:1.2rem;">${meta.icon}</span>
      <div>
        <strong>Now Synthesizing:</strong> ${meta.title}
        <div style="font-size:0.8rem;color:var(--text-muted);">${meta.desc}</div>
      </div>
    `;
    if (nowPlayingCard) nowPlayingCard.style.display = 'flex';
  } else {
    statusEl.innerHTML = `<span>Select an ambient sound below to begin calming audio synthesis.</span>`;
    if (nowPlayingCard) nowPlayingCard.style.display = 'none';
  }
}

// Synthesizer Algorithms
function synthesizeSingingBowl(ctx) {
  // Fundamental 432Hz + warm harmonic overtones
  const freqs = [432, 864, 1296, 1728];
  const amps = [0.25, 0.08, 0.03, 0.01];

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Subtle gentle vibrato (LFO)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.2 + idx * 0.1, ctx.currentTime);
    lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
    lfo.connect(osc.frequency);
    lfo.start();
    activeSoundNodes.push(lfo);

    gain.gain.setValueAtTime(amps[idx], ctx.currentTime);
    osc.connect(gain);
    gain.connect(globalMasterGain);
    osc.start();

    activeSoundNodes.push(osc, gain);
  });
}

function synthesizeRain(ctx) {
  // Filtered white noise with gentle bandpass
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = buffer;
  whiteNoise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1100, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, ctx.currentTime);

  whiteNoise.connect(filter);
  filter.connect(gain);
  gain.connect(globalMasterGain);
  whiteNoise.start();

  activeSoundNodes.push(whiteNoise, filter, gain);
}

function synthesizeOcean(ctx) {
  // Pink noise buffer with low frequency wave modulation
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(450, ctx.currentTime);

  // Wave swelling gain modulation
  const swellGain = ctx.createGain();
  const swellLfo = ctx.createOscillator();
  swellLfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 sec ocean wave period
  
  const swellLfoGain = ctx.createGain();
  swellLfoGain.gain.setValueAtTime(0.18, ctx.currentTime);
  swellGain.gain.setValueAtTime(0.15, ctx.currentTime);

  swellLfo.connect(swellLfoGain);
  swellLfoGain.connect(swellGain.gain);

  noise.connect(filter);
  filter.connect(swellGain);
  swellGain.connect(globalMasterGain);

  noise.start();
  swellLfo.start();

  activeSoundNodes.push(noise, filter, swellGain, swellLfo, swellLfoGain);
}

function synthesizeStream(ctx) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.Q.setValueAtTime(3.0, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, ctx.currentTime);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(globalMasterGain);
  noise.start();

  activeSoundNodes.push(noise, filter, gain);
}

document.addEventListener('DOMContentLoaded', initMusicPage);
