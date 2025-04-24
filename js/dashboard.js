window.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (!isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  // Mulai session timeout
  startSessionTimeout();

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
  });

  const API_URL = "https://script.google.com/macros/s/AKfycbzUP482PmHzwYaY5U2s_gKPWYStSRKmWkKFMQMJlJOHaBQMbxn_FnIomWHT6g7QX00PHw/exec?mode=data";

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

// Fungsi session timeout
function startSessionTimeout() {
  let timeout;

  function resetTimer() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      alert("Sesi kamu telah habis. Silakan login kembali.");
      localStorage.removeItem("isLoggedIn"); // Bersihkan status login
      window.location.href = "login.html";
    }, 5 * 60 * 1000); // 5 menit
  }

  ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetTimer);
  });

  resetTimer();
}

function parseOvertime(value) {
  if (!value) return 0;
  if (typeof value === "string" && value.includes("T")) return 0;
  return parseFloat(value) || 0;
}

function sortByOvertimeHours(rows) {
  return rows.sort((a, b) => {
    const hoursA = parseOvertime(a["Overtime Hours"]);
    const hoursB = parseOvertime(b["Overtime Hours"]);
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
      parseOvertime(row["Overtime Hours"]),
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
  const overtimeData = rows.map(row => parseOvertime(row["Overtime Hours"]));
  const colors = rows.map(row => {
    const shift = (row["Shift"] || "").toLowerCase();
    if (shift.includes("green")) return "#4CAF50";
    if (shift.includes("blue")) return "#2196F3";
    return "#FF9800";
  });

  const ctx = document.getElementById("overtimeChart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Overtime Hours",
        data: overtimeData,
        backgroundColor: colors,
        borderColor: colors,
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
