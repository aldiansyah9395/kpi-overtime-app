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

    // ✅ Tambahkan ini untuk handle file name tampil
    const fileInput = document.getElementById("csvFileInput");
    const fileNameDisplay = document.getElementById("fileNameDisplay");
  
    if (fileInput && fileNameDisplay) {
      fileInput.addEventListener("change", () => {
        const fileName = fileInput.files.length ? fileInput.files[0].name : "";
        fileNameDisplay.textContent = fileName;
      });
    }

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
    renderPieChart(sortedRows);


    const loadingEl = document.querySelector("#dashboardContent .loading");
    if (loadingEl) loadingEl.remove();
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

  document.getElementById("uploadCsvBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("csvFileInput");
    const uploadBtn = document.getElementById("uploadCsvBtn");
    const statusDiv = document.getElementById("uploadStatus");

    if (!fileInput.files.length) {
      alert("Pilih file CSV terlebih dahulu.");
      return;
    }

    const file = fileInput.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        const rawRecords = results.data;
        console.log("CSV parsed records:", rawRecords);

        const allowedFields = ["Date", "Name", "Department", "Shift", "Type OT", "Tull"];
        const records = rawRecords.map(record => {
          const clean = {};
          allowedFields.forEach(field => {
            if (record[field] !== undefined) {
              clean[field] = record[field];
            }
          });
          if (clean["Tull"]) {
            clean["Tull"] = parseFloat((clean["Tull"] + "").trim().replace(",", "."));
          }
          return clean;
        }).filter(r => Object.keys(r).length > 0);

        if (records.length === 0) {
          alert("CSV kosong atau tidak valid. Cek ulang format dan kolomnya.");
          console.warn("CSV parse result:", results);
          return;
        }

        try {
          statusDiv.textContent = "⏳ Mengupload data ke Database... Harap tunggu.";
          uploadBtn.disabled = true;

          await resetAirtableData();
          await uploadCsvToAirtable(records);

          statusDiv.textContent = "✅ Upload selesai. Halaman akan direfresh.";
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          console.error("Upload failed:", err);
          statusDiv.textContent = "❌ Gagal upload data. Cek konsol untuk detail.";
          uploadBtn.disabled = false;
        }
      }
    });
  });

  async function resetAirtableData() {
    let offset = "";
    do {
      const res = await fetch(API_URL + (offset ? `?offset=${offset}` : ""), {
        headers: { Authorization: `Bearer ${airtableApiKey}` }
      });
      const json = await res.json();
      const recordIds = json.records.map(r => r.id);
      offset = json.offset;
  
      if (recordIds.length > 0) {
        for (let i = 0; i < recordIds.length; i += 10) {
          const batch = recordIds.slice(i, i + 10);
          const query = batch.map(id => `records[]=${id}`).join("&");
          await fetch(`${API_URL}?${query}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${airtableApiKey}`
            }
          });
        }
      }
    } while (offset);
  }
  

  async function uploadCsvToAirtable(records) {
    if (!records || !records.length) {
      console.warn("Tidak ada record valid untuk di-upload.");
      return;
    }

    for (let i = 0; i < records.length; i += 10) {
      const batch = records.slice(i, i + 10).map(r => ({ fields: r }));
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ records: batch })
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Upload failed: ${errorDetail}`);
      } else {
        console.log("Batch upload success");
      }
    }
  }
});

function parseOvertime(value) {
  if (!value) return 0;
  if (typeof value === "string") {
    value = value.trim().replace(",", ".");
    if (value.includes("T")) return 0;
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

// --- Pie Chart: Persentase total Tull per Shift ---
function renderPieChart(rows) {
  const shiftTotals = {
    "Green Team": 0,
    "Blue Team": 0,
    "Non Shift": 0
  };

  rows.forEach(row => {
    const shift = (row["Shift"] || "").trim();
    const hours = parseOvertime(row["Tull"] || row["Overtime Hours"]);

    if (shift.includes("Green")) shiftTotals["Green Team"] += hours;
    else if (shift.includes("Blue")) shiftTotals["Blue Team"] += hours;
    else shiftTotals["Non Shift"] += hours;
  });

  const labels = Object.keys(shiftTotals);
  const data = Object.values(shiftTotals);
  const total = data.reduce((a, b) => a + b, 0);
  const colors = ["#4CAF50", "#2196F3", "#FF9800"];

  const ctx = document.getElementById("pieChart").getContext("2d");

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        datalabels: {
          color: "#fff",
          font: {
            weight: 'bold',
            size: 14
          },
          formatter: (value, context) => {
            const percentage = ((value / total) * 100).toFixed(1);
            return `${percentage}%`;
          }
        }
      }
    },
    plugins: [ChartDataLabels] // ✅ ← ini WAJIB ditambahkan
  });
}
