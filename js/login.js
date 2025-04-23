document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("errorMessage");

  // Dummy login (ganti dengan autentikasi asli kalau perlu)
  if (username === "admin" && password === "1234") {
    // Simpan status login ke localStorage
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "dashboard.html";
  } else {
    message.textContent = "Invalid username or password.";
  }
});
