document.addEventListener("DOMContentLoaded", () => {
  const { ref, set, onValue, push } = window.firebaseRefs;
  const db = window.db;

  const csvInput = document.getElementById("csvFileInput");
  const uploadBtn = document.getElementById("uploadCsvBtn");
  const fileNameDisplay = document.getElementById("fileNameDisplay");
  const status = document.getElementById("uploadStatus");
  const table = document.getElementById("kpiTable");
  const tbody = table.querySelector("tbody");
  const pieChartCtx = document.getElementById("pieChart").getContext("2d");
  const overtimeChartCtx = document.getElementById("overtimeChart").getContext("2d");

  let pieChart, overtimeChart;

  function updateTable(data) {
    tbody.innerHTML = "";
    let index = 1;
    let green = 0, blue = 0, non = 0;
    let overtimeMap = {};

    data.forEach((row) => {
      const { employee, department, hours, shift } = row;

      // Pie count
      if (shift === "Green") green++;
      else if (shift === "Blue") blue++;
      else non++;

      // Bar chart accumulation
      overtimeMap[employee] = (overtimeMap[employee] || 0) + parseFloat(hours);

      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${index++}</td>
                      <td>${employee}</td>
                      <td>${department}</td>
                      <td>${hours}</td>
                      <td>${shift}</td>`;
      tbody.appendChild(tr);
    });

    table.style.display = "table";

    // Pie Chart
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(pieChartCtx, {
      type: "pie",
      data: {
        labels: ["Green", "Blue", "Non Shift"],
        datasets: [{
          data: [green, blue, non],
          backgroundColor: ["#28a745", "#007bff", "#f39c12"]
        }]
      }
    });

    // Bar Chart
    if (overtimeChart) overtimeChart.destroy();
    overtimeChart = new Chart(overtimeChartCtx, {
      type: "bar",
      data: {
        labels: Object.keys(overtimeMap),
        datasets: [{
          label: "Total Overtime",
          data: Object.values(overtimeMap),
          backgroundColor: "#17a2b8"
        }]
      }
    });

    document.querySelector(".loading").style.display = "none";
  }

  function fetchData() {
    const dataRef = ref(db, "overtimeData");
    onValue(dataRef, (snapshot) => {
      const raw = snapshot.val();
      const result = raw ? Object.values(raw) : [];
      updateTable(result);
    });
  }

  csvInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    fileNameDisplay.textContent = file ? file.name : "";
  });

  uploadBtn.addEventListener("click", () => {
    const file = csvInput.files[0];
    if (!file) return alert("Pilih file CSV terlebih dahulu!");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        const data = results.data;
        const dataRef = ref(db, "overtimeData");
        set(dataRef, {}); // clear data
        data.forEach(row => {
          push(dataRef, row);
        });
        status.textContent = "Data berhasil diunggah!";
      }
    });
  });

  fetchData();
});
