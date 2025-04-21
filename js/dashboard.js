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
    const hoursA = parseFloat(a["Overtime Hours"]) || 0; // Convert to number
    const hoursB = parseFloat(b["Overtime Hours"]) || 0; // Convert to number
    return hoursB - hoursA; // Descending order
  });
}

// Function to parse CSV content
function parseCSV(csv) {
  const lines = csv.split("\n").filter(line => line.trim() !== "");
  const headers = lines[0].split(",");
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const row = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index].trim();
    });

    rows.push(row);
  }

  return rows;
}

// Function to render the table with sorted data
function renderTable(rows) {
  const tableBody = document.querySelector("#kpiTable tbody");
  tableBody.innerHTML = ""; // Clear any existing rows

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    Object.values(row).forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });

  // Show the table after rendering the rows
  document.getElementById("kpiTable").style.display = "table";
}
