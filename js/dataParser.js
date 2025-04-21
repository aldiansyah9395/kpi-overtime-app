// js/dataParser.js

function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const result = [];

  // Ambil header
  const headers = lines[0].split(",");

  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentLine = lines[i].split(",");

    headers.forEach((header, index) => {
      obj[header.trim()] = currentLine[index].trim();
    });

    result.push(obj);
  }

  return result;
}

function renderTable(data) {
  const table = document.getElementById("kpiTable");
  const tbody = table.querySelector("tbody");

  data.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item["No"]}</td>
      <td>${item["Employee"]}</td>
      <td>${item["Department"]}</td>
      <td>${item["Overtime Hours"]}</td>
      <td>${item["Shift"]}</td>
    `;

    tbody.appendChild(row);
  });

  table.style.display = "table";
}
