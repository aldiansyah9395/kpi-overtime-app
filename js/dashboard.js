window.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (!isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
  });

  fetch("data/kpi-data.csv")
    .then((response) => response.text())
    .then((csv) => {
      const rows = parseCSV(csv);
      const sortedRows = sortByOvertimeHours(rows);
      renderTable(sortedRows);
      renderChart(sortedRows);
    })
    .catch((err) => {
      document.getElementById("dashboardContent").innerHTML =
        "<p>Failed to load KPI data.</p>";
      console.error(err);
    });
});

function sortByOvertimeHours(rows) {
  return rows.sort((a, b) => {
    const hoursA = parseFloat(a["Overtime Hours"]) || 0;
    const hoursB = parseFloat(b["Overtime Hours"]) || 0;
    return hoursB - hoursA;
  });
}

function parseCSV(csv) {
  const lines = csv.split("\n").filter(line => line.trim() !== "");
  const headers = lines[0].split(",");
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const row = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || "";
    });

    rows.push(row);
  }

  return rows;
}

function renderTable(rows) {
  const tableBody = document.querySelector("#kpiTable tbody");
  tableBody.innerHTML = "";

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");

    const columns = [
      index + 1,                       // No: generate otomatis
      row["Employee"],
      row["Department"],
      row["Overtime Hours"],
      row["Shift"]
    ];

    columns.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });

  document.getElementById("kpiTable").style.display = "table";
}

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
      indexAxis: 'x',
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
