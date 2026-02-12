// assets/js/quiz.js
const quizForm = document.getElementById('quizForm');
quizForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const answers = ['q1','q2','q3','q4','q5'].map(name=>{
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  });
  // basic validation
  if(answers.some(a => a===null)) return alert("Please answer all questions");
  // send to backend
  try{
    const res = await fetch("http://localhost:5000/api/quiz/submit", {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ user_id: localStorage.getItem('user_id'), token: localStorage.getItem('token'), answers })
    });
    const data = await res.json();
    if(data.ok){
      localStorage.setItem('last_score', data.score);
      localStorage.setItem('last_level', data.level);
      // playful animation then redirect
      const btn = quizForm.querySelector('button[type="submit"]');
      btn.innerText='Calculating...'; btn.disabled=true;
      setTimeout(()=> window.location.href='recommend.html', 900);
    } else alert(data.error || "Submission failed");
  }catch(e){ alert("Network error"); console.error(e) }
});
