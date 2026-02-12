// assets/js/recommend.js
document.querySelectorAll('.card, .card button').forEach(el=>{
  el.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button');
    if(btn && btn.dataset.href) window.location.href = btn.dataset.href;
    else {
      const text = ev.currentTarget.textContent.toLowerCase();
      if(text.includes('music')) window.location.href='music.html';
      if(text.includes('draw')) window.location.href='draw.html';
      if(text.includes('journal')) window.location.href='journal.html';
      if(text.includes('chat')) window.location.href='chat.html';
    }
  });
});
