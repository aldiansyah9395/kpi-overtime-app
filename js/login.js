// js/login.js

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("errorMessage"); // disamakan dengan id di HTML

  // Dummy login
  if (username === "admin" && password === "1234") {
    // Simpan status login ke localStorage
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "dashboard.html";
  } else {
    message.style.color = "#e74c3c";
    message.textContent = "Username atau password salah.";
  }
});
