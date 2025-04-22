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
      renderChart(sortedRows); // Render the chart
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
    const hoursA = parseFloat(a["Overtime Hours"]) || 0;
    const hoursB = parseFloat(b["Overtime Hours"]) || 0;
    return hoursB - hoursA;
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

    // Gunakan urutan sesuai header CSV yang baru
    ["No", "Employee", "Department", "Overtime Hours", "Shift"].forEach((key) => {
      const td = document.createElement("td");
      td.textContent = row[key];
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });

  document.getElementById("kpiTable").style.display = "table";
}

// Function to render the chart with sorted data
function renderChart(rows) {
  const labels = rows.map(row => row["Employee"]);
  const overtimeData = rows.map(row => parseFloat(row["Overtime Hours"]) || 0);

  const ctx = document.getElementById("overtimeChart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Overtime Hours",
        data: overtimeData,
        backgroundColor: "#4CAF50",
        borderColor: "#388E3C",
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: "x",
      scales: {
        x: {
          title: {
            display: true,
            text: "Employee"
          }
        },
        y: {
          title: {
            display: true,
            text: "Overtime Hours"
          },
          beginAtZero: true
        }
      }
    }
  });
}
