// assets/js/draw.js
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let drawing=false, paths=[];
let currentPath=[];

// resize canvas to display size (keeps width responsive)
function fitCanvas(){
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  redraw();
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const toolbar = document.createElement('div');
toolbar.style.display='flex'; toolbar.style.gap='8px'; toolbar.style.marginTop='12px';
toolbar.innerHTML = `
  <button class="btn" id="undo">Undo</button>
  <button class="btn secondary" id="clear">Clear</button>
  <select id="brushSize"><option value="3">Small</option><option value="6" selected>Medium</option><option value="10">Thick</option></select>
  <input type="color" id="color" value="#00bfa6">
`;
canvas.parentNode.appendChild(toolbar);

const brush = document.getElementById('brushSize');
const colorInput = document.getElementById('color');

function getPos(e){
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left);
  const y = (e.clientY - r.top);
  return {x,y};
}

canvas.addEventListener('pointerdown', (e)=>{
  drawing=true; currentPath=[]; canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointerup', (e)=>{
  drawing=false; if(currentPath.length) { paths.push({pts:currentPath.slice(), color: colorInput.value, size: parseInt(brush.value)}); currentPath=[]; }
});
canvas.addEventListener('pointermove', (e)=>{
  if(!drawing) return;
  const p = getPos(e);
  currentPath.push(p);
  drawSegment(p, colorInput.value, parseInt(brush.value));
});

function drawSegment(p, col, size){
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(p.x, p.y, size/2, 0, Math.PI*2);
  ctx.fill();
}
function redraw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // scale corrected already
  for(const stroke of paths){
    ctx.fillStyle = stroke.color;
    for(const pt of stroke.pts){
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, stroke.size/2, 0, Math.PI*2);
      ctx.fill();
    }
  }
}
document.getElementById('undo').onclick = ()=>{
  paths.pop(); redraw();
}
document.getElementById('clear').onclick = ()=>{
  paths=[]; redraw();
}
