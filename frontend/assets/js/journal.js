// assets/js/journal.js
const saveBtn = document.getElementById('save');
const contentEl = document.getElementById('content');

async function showToast(text){
  const t = document.createElement('div');
  t.style.position='fixed'; t.style.right='18px'; t.style.bottom='18px';
  t.style.background='#004d40'; t.style.color='white'; t.style.padding='10px 14px';
  t.style.borderRadius='10px'; t.style.boxShadow='0 8px 20px rgba(0,0,0,0.12)'; t.style.opacity='0';
  t.style.transition='opacity 300ms';
  t.innerText = text;
  document.body.appendChild(t);
  requestAnimationFrame(()=> t.style.opacity='1');
  setTimeout(()=> t.style.opacity='0', 2000);
  setTimeout(()=> t.remove(), 2400);
}

saveBtn?.addEventListener('click', async ()=>{
  const content = contentEl.value.trim();
  if(!content) { showToast("Write something first ✍️"); return; }
  saveBtn.disabled = true;
  try{
    const res = await fetch("http://localhost:5000/api/journal/save", {
      method:'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ user_id: localStorage.getItem('user_id'), content })
    });
    const data = await res.json();
    saveBtn.disabled = false;
    if(data.ok) { showToast("Saved successfully ✅"); contentEl.value=''; }
    else showToast(data.error||"Save failed");
  }catch(e){ saveBtn.disabled=false; showToast("Network error"); console.error(e) }
});
