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

  const API_URL = "https://script.google.com/macros/s/AKfycbzUP482PmHzwYaY5U2s_gKPWYStSRKmWkKFMQMJlJOHaBQMbxn_FnIomWHT6g7QX00PHw/exec?mode=data"; // Ganti dengan URL kamu

  fetch(API_URL)
    .then((response) => response.json())
    .then((rows) => {
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

function renderTable(rows) {
  const tableBody = document.querySelector("#kpiTable tbody");
  tableBody.innerHTML = "";

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");

    const columns = [
      index + 1,
      row["Employee"] || row["Nama"] || "-",
      row["Department"] || "-",
      row["Overtime Hours"] || "0",
      row["Shift"] || "-"
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
  const labels = rows.map(row => row["Employee"] || row["Nama"] || "-");
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
