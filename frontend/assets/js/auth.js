// assets/js/auth.js
const base = "http://localhost:5000/api/auth";

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

async function postJSON(url, payload){
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  return res.json();
}

loginBtn?.addEventListener('click', async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if(!username || !password){ alert("Please enter username & password"); return; }
  loginBtn.disabled = true;
  const data = await postJSON(base + "/login", { username, password });
  loginBtn.disabled = false;
  if(data.ok){
    localStorage.setItem("token", data.token);
    localStorage.setItem("user_id", data.user_id);
    window.location.href = "quiz.html";
  } else {
    alert(data.error || "Login failed");
  }
});

registerBtn?.addEventListener('click', async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if(!username || !password){ alert("Please fill both fields"); return; }
  registerBtn.disabled = true;
  const data = await postJSON(base + "/register", { username, password });
  registerBtn.disabled = false;
  if(data.ok){ alert("Registered — please login"); }
  else { alert(data.error || "Register failed"); }
});
