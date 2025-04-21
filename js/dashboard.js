// js/dashboard.js

window.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (!isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
  });

  // Load CSV data
  fetch("data/kpi-data.csv")
    .then((response) => response.text())
    .then((csv) => {
      const rows = parseCSV(csv);
      renderTable(rows);
    })
    .catch((err) => {
      document.getElementById("dashboardContent").innerHTML =
        "<p>Failed to load KPI data.</p>";
      console.error(err);
    });
});
