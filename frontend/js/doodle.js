/**
 * Calming Doodle Board Controller
 * HTML5 Canvas engine with responsive sizing, touch/stylus support, undo stack, and export.
 */

let canvas, ctx;
let isDrawing = false;
let currentColor = '#8C6D58'; // Warm earthy brown
let currentSize = 5;
let isEraser = false;
const undoStack = [];
const MAX_UNDO = 20;

const DOODLE_PALETTE = [
  { name: 'Warm Cream', hex: '#FAF7F2' },
  { name: 'Earthy Clay', hex: '#8C6D58' },
  { name: 'Soft Sage', hex: '#6E8B74' },
  { name: 'Terracotta', hex: '#D97E6A' },
  { name: 'Warm Amber', hex: '#C98B3B' },
  { name: 'Dusty Lavender', hex: '#8F82A3' },
  { name: 'Deep Espresso', hex: '#33261D' },
  { name: 'Muted Slate', hex: '#736154' },
];

function initDoodleBoard() {
  canvas = document.getElementById('doodleCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  setupCanvasSize();
  saveCanvasState(); // Save initial blank state

  // Attach Drawing Events (Mouse, Touch, Stylus)
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);

  // Resize handler
  window.addEventListener('resize', handleCanvasResize);

  // Render Palette
  renderPalette();

  // Size Slider
  const sizeSlider = document.getElementById('brushSizeSlider');
  const sizeValueLabel = document.getElementById('brushSizeValue');
  if (sizeSlider) {
    sizeSlider.addEventListener('input', (e) => {
      currentSize = parseInt(e.target.value, 10);
      if (sizeValueLabel) sizeValueLabel.textContent = `${currentSize}px`;
    });
  }
}

function setupCanvasSize() {
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  
  // Set internal resolution
  canvas.width = rect.width;
  canvas.height = 540;

  // Fill default background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function handleCanvasResize() {
  // Save current image content
  const tempImg = new Image();
  tempImg.src = canvas.toDataURL();
  tempImg.onload = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 540;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempImg, 0, 0);
  };
}

function renderPalette() {
  const container = document.getElementById('paletteContainer');
  if (!container) return;

  container.innerHTML = DOODLE_PALETTE.map((c, idx) => `
    <button 
      type="button" 
      class="color-swatch ${c.hex === currentColor ? 'active' : ''}" 
      style="background-color: ${c.hex};" 
      title="${c.name}"
      onclick="selectColor('${c.hex}', this)"
    ></button>
  `).join('');
}

function selectColor(hex, el) {
  isEraser = false;
  currentColor = hex;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
  const eraserBtn = document.getElementById('eraserBtn');
  if (eraserBtn) eraserBtn.classList.remove('btn-primary');
}

function setEraserMode() {
  isEraser = true;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  const eraserBtn = document.getElementById('eraserBtn');
  if (eraserBtn) eraserBtn.classList.add('btn-primary');
}

function getCanvasCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function startDrawing(e) {
  isDrawing = true;
  const coords = getCanvasCoordinates(e);
  ctx.beginPath();
  ctx.moveTo(coords.x, coords.y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = currentSize;
  ctx.strokeStyle = isEraser ? '#FFFFFF' : currentColor;
}

function draw(e) {
  if (!isDrawing) return;
  const coords = getCanvasCoordinates(e);
  ctx.lineTo(coords.x, coords.y);
  ctx.stroke();
}

function stopDrawing() {
  if (isDrawing) {
    ctx.closePath();
    isDrawing = false;
    saveCanvasState();
  }
}

function handleTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    startDrawing(touch);
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    draw(touch);
  }
}

function saveCanvasState() {
  if (undoStack.length >= MAX_UNDO) {
    undoStack.shift();
  }
  undoStack.push(canvas.toDataURL());
}

function undoDoodle() {
  if (undoStack.length <= 1) {
    showToast("Nothing left to undo.", "info");
    return;
  }
  undoStack.pop(); // Remove current state
  const previousState = undoStack[undoStack.length - 1];
  const img = new Image();
  img.src = previousState;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  showToast("Undone last stroke.", "info");
}

function clearDoodleCanvas() {
  showConfirmModal(
    "Clear Drawing Canvas?",
    "This will wipe your canvas back to a clean sheet. Are you sure you'd like to clear your doodle?",
    () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveCanvasState();
      showToast("Canvas cleared.", "info");
    }
  );
}

function downloadDoodle() {
  const link = document.createElement('a');
  link.download = `psyra-doodle-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast("Drawing downloaded!", "success");
}

document.addEventListener('DOMContentLoaded', initDoodleBoard);
