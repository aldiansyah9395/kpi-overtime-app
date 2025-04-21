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
      const sortedRows = sortByOvertimeHours(rows); // Sorting the data
      renderTable(sortedRows);
    })
    .catch((err) => {
      document.getElementById("dashboardContent").innerHTML =
        "<p>Failed to load KPI data.</p>";
      console.error(err);
    });
});

// Function to sort rows by "Overtime Hours" in descending order
function sortByOvertimeHours(rows) {
  return rows.sort((a, b) => {
    const hoursA = parseFloat(a["Overtime Hours"]);
    const hoursB = parseFloat(b["Overtime Hours"]);
    return hoursB - hoursA; // Descending order
  });
}
