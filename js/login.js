// login.js
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault(); // Mencegah reload halaman

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  // Data login dummy
  const validUsername = "admin";
  const validPassword = "1234";

  const errorMessage = document.getElementById("errorMessage");

  if (username === validUsername && password === validPassword) {
    // Simulasi sukses login
    errorMessage.style.color = "green";
    errorMessage.textContent = "Login berhasil! Mengalihkan...";
    
    // Redirect atau tindakan lain setelah login berhasil
    setTimeout(() => {
      window.location.href = "dashboard.html"; // ganti sesuai halaman tujuanmu
    }, 1500);
  } else {
    // Tampilkan error
    errorMessage.style.color = "#e74c3c";
    errorMessage.textContent = "Username atau password salah!";
  }
});
