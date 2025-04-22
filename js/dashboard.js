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
      renderBarChart(sortedRows);
      renderShiftChart(sortedRows);
    })
    .catch((err) => {
      document.getElementById("dashboardContent").innerHTML = "<p>Failed to load KPI data.</p>";
      console.error(err);
    });
});

function sortByOvertimeHours(rows) {
  return rows.sort((a, b) => parseFloat(b["Overtime Hours"]) - parseFloat(a["Overtime Hours"]));
}

function parseCSV(csv) {
  const lines = csv.trim().split("\n");
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

  return rows.map((row, index) => ({
    "No": index + 1,
    "Employee": row["Employee"],
    "Department": row["Department"],
    "Overtime Hours": row["Overtime Hours"],
    "Shift": row["Shift"]
  }));
}

function renderTable(rows) {
  const tableBody = document.querySelector("#kpiTable tbody");
  tableBody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    Object.values(row).forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });

  document.getElementById("kpiTable").style.display = "table";
}

function renderBarChart(rows) {
  const labels = rows.map(row => row["Employee"]);
  const data = rows.map(row => parseFloat(row["Overtime Hours"]) || 0);

  const ctx = document.getElementById("overtimeChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Overtime Hours",
        data: data,
        backgroundColor: "#4CAF50",
        borderColor: "#388E3C",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Overtime Hours by Employee"
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Employee" }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Hours" }
        }
      }
    }
  });
}

function renderShiftChart(rows) {
  const shiftCounts = { Shift1: 0, Shift2: 0, Shift3: 0 };

  rows.forEach(row => {
    const shift = row["Shift"];
    if (shiftCounts[shift] !== undefined) {
      shiftCounts[shift]++;
    }
  });

  const labels = Object.keys(shiftCounts);
  const data = Object.values(shiftCounts);

  const ctx = document.getElementById("shiftPieChart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ["#2196F3", "#FFC107", "#FF5722"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Shift Distribution"
        },
        legend: {
          position: "right"
        },
        datalabels: {
          formatter: (value, context) => {
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.chart.data.labels[context.dataIndex]}: ${value} (${percentage}%)`;
          },
          color: "#fff",
          font: {
            weight: "bold"
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}
