// --- FINAL VERSION WITH PAGINATION + ROBUST PARSING ---

let detailMap = {};

window.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const lastActive = localStorage.getItem("lastActive");
  const now = Date.now();

  if (!isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  if (lastActive && now - parseInt(lastActive) > 5 * 60 * 1000) {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("lastActive");
    window.location.href = "login.html";
    return;
  }

  document.addEventListener("mousemove", () => localStorage.setItem("lastActive", Date.now()));
  document.addEventListener("keydown", () => localStorage.setItem("lastActive", Date.now()));
  localStorage.setItem("lastActive", Date.now());

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("lastActive");
    window.location.href = "login.html";
  });

  const airtableApiKey = "patiH2AOAO9YAtJhA.61cafc7228a34200466c4235f324b0a9368cf550d04e83656db17d3374ec35d4";
  const airtableBaseId = "appt1TKEfQeHTq7pc";
  const airtableTableName = "database-ot";
  const API_URL = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;

  fetchAllRecords().then(rows => {
    groupDetailByName(rows);
    const summarized = summarizeOvertimeData(rows);
    const sortedRows = sortByOvertimeHours(summarized);
    renderTable(sortedRows);
    renderChart(sortedRows);
  }).catch(err => {
    document.getElementById("dashboardContent").innerHTML = "<p>Failed to load KPI data.</p>";
    console.error(err);
  });

  async function fetchAllRecords() {
    let allRecords = [];
    let offset = "";
    do {
      const res = await fetch(API_URL + (offset ? `?offset=${offset}` : ""), {
        headers: { Authorization: `Bearer ${airtableApiKey}` }
      });
      const json = await res.json();
      allRecords = allRecords.concat(json.records);
      offset = json.offset;
    } while (offset);
    return allRecords;
  }
});

function parseOvertime(value) {
  if (!value) return 0;
  if (typeof value === "string") {
    value = value.trim().replace(",", ".");
    if (value.includes("T")) return 0; // ignore time strings like 2024-04-16T00:00:00
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
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
    const name = ((row.fields["Name"] || row.fields["Nama"] || row.fields["Employee"] || "") + "").trim();
    const hours = parseOvertime(row.fields["Tull"] || row.fields["Overtime Hours"]);
    if (!name) return;
    if (!summaryMap[name]) {
      summaryMap[name] = {
        Employee: name,
        Department: row.fields["Department"] || "-",
        Shift: row.fields["Shift"] || "-",
        "Overtime Hours": 0
      };
    }
    summaryMap[name]["Overtime Hours"] += hours;
  });
  return Object.values(summaryMap);
}

function groupDetailByName(rows) {
  detailMap = {};
  rows.forEach(row => {
    const name = ((row.fields["Name"] || row.fields["Nama"] || row.fields["Employee"] || "") + "").trim();
    const date = row.fields["Date"];
    const hours = parseOvertime(row.fields["Tull"]);
    const typeOT = row.fields["Type OT"] || "-";
    if (!name || !date || isNaN(hours)) return;
    if (!detailMap[name]) {
      detailMap[name] = [];
    }
    detailMap[name].push({ date, hours, typeOT });
  });
  Object.keys(detailMap).forEach(name => {
    detailMap[name].sort((a, b) => new Date(a.date) - new Date(b.date));
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
    setTimeout(() => existingDetail.remove(), 300);
    return;
  }
  document.querySelectorAll(".detail-row").forEach(row => row.remove());
  const details = detailMap[name] || [];
  const detailTr = document.createElement("tr");
  detailTr.classList.add("detail-row");
  const detailTd = document.createElement("td");
  detailTd.colSpan = 5;
  if (details.length > 0) {
    let tableHTML = `<table style="width: 60%; border-collapse: collapse; margin-top: 5px;"><thead><tr style="background-color: #f2f2f2;"><th style="width: 30%; text-align: left; padding: 6px;">Date</th><th style="width: 40%; text-align: center; padding: 6px;">Type OT</th><th style="width: 30%; text-align: right; padding: 6px;">Tull</th></tr></thead><tbody>`;
    tableHTML += details.map(d => {
      const tgl = new Date(d.date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
      return `<tr><td style="text-align: left; padding: 6px;">${tgl}</td><td style="text-align: center; padding: 6px;">${d.typeOT}</td><td style="text-align: right; padding: 6px;">${d.hours}</td></tr>`;
    }).join("");
    tableHTML += "</tbody></table>";
    detailTd.innerHTML = `<strong>Overtime Detail:</strong>` + tableHTML;
  } else {
    detailTd.innerHTML = `<em>Tidak ada data lembur</em>`;
  }
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
        x: { title: { display: true, text: "Employee" } },
        y: { title: { display: true, text: "Overtime Hours" }, beginAtZero: true }
      }
    }
  });
}
