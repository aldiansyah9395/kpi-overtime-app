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

  const API_URL = "https://script.google.com/macros/s/AKfycbzUP482PmHzwYaY5U2s_gKPWYStSRKmWkKFMQMJlJOHaBQMbxn_FnIomWHT6g7QX00PHw/exec?mode=data";

  fetch(API_URL)
    .then((response) => response.json())
    .then((rows) => {
      detailMap = groupDetailByName(rows);
      const summarized = summarizeOvertimeData(rows);
      const sortedRows = sortByOvertimeHours(summarized);
      renderTable(sortedRows);
      renderChart(sortedRows);
    })
    .catch((err) => {
      document.getElementById("dashboardContent").innerHTML =
        "<p>Failed to load KPI data.</p>";
      console.error(err);
    });
});

let detailMap = {};

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

function summarizeOvertimeData(rows) {
  const summaryMap = {};

  rows.forEach(row => {
    const name = (row["Name"] || row["Nama"] || row["Employee"] || "").trim();
    const hours = parseOvertime(row["Tull"] || row["Overtime Hours"]);

    if (!name) return;

    if (!summaryMap[name]) {
      summaryMap[name] = {
        Employee: name,
        Department: row["Department"] || "-",
        Shift: row["Shift"] || "-",
        "Overtime Hours": 0
      };
    }

    summaryMap[name]["Overtime Hours"] += hours;
  });

  return Object.values(summaryMap);
}

function groupDetailByName(rows) {
  const detailMap = {};

  rows.forEach(row => {
    const name = (row["Name"] || row["Nama"] || row["Employee"] || "").trim();
    const date = row["Date"];
    const hours = parseOvertime(row["Tull"]);

    if (!name || !date || isNaN(hours)) return;

    if (!detailMap[name]) {
      detailMap[name] = [];
    }

    detailMap[name].push({ date, hours });
  });

  return detailMap;
}

function renderTable(rows) {
  const tableBody = document.querySelector("#kpiTable tbody");
  tableBody.innerHTML = "";

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");

    const name = row["Employee"] || row["Nama"] || "-";

    const columns = [
      index + 1,
      name,
      row["Department"] || "-",
      parseOvertime(row["Overtime Hours"]),
      row["Shift"] || "-"
    ];

    columns.forEach((value, i) => {
      const td = document.createElement("td");
      td.textContent = value;

      // Aktifkan klik hanya di kolom nama
      if (i === 1) {
        td.style.cursor = "pointer";
        td.style.color = "#007BFF";
        td.addEventListener("click", () => toggleDetailRow(name, tr));
      }

      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });

  document.getElementById("kpiTable").style.display = "table";
}

function toggleDetailRow(name, parentRow) {
  const existingDetail = parentRow.nextSibling;
  if (existingDetail && existingDetail.classList.contains("detail-row")) {
    existingDetail.classList.remove("show");
setTimeout(() => {
  existingDetail.remove();
}, 300);
 // close jika sudah terbuka
    return;
  }

  // Tutup semua detail lainnya
  document.querySelectorAll(".detail-row").forEach(row => row.remove());

  const details = detailMap[name] || [];

  const detailTr = document.createElement("tr");
  detailTr.classList.add("detail-row");
  const detailTd = document.createElement("td");
  detailTd.colSpan = 5;

  const detailHTML = details.length > 0
    ? `<strong>Detail Lembur:</strong><ul style="margin: 4px 0 0 16px;">
         ${details.map(d => `<li>${d.date}: ${d.hours} jam</li>`).join("")}
       </ul>`
    : `<em>Tidak ada data lembur</em>`;

  detailTd.innerHTML = detailHTML;
  detailTr.appendChild(detailTd);

  parentRow.after(detailTr);
setTimeout(() => {
  detailTr.classList.add("show");
}, 10);

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
