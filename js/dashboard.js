// Import Firebase (gunakan module jika dipakai sebagai type="module")
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Konfigurasi Firebase milikmu (sudah kamu berikan sebelumnya)
const firebaseConfig = {
  apiKey: "AIzaSyDDN5mAK3OQxRmZyaZFKG4LnVZzn_ySa4I",
  authDomain: "overtime-monitoring-plastic.firebaseapp.com",
  projectId: "overtime-monitoring-plastic",
  storageBucket: "overtime-monitoring-plastic.appspot.com",
  messagingSenderId: "926151119878",
  appId: "1:926151119878:web:413ed9f2a5b0dbd5b2034f",
  measurementId: "G-WW9EXD8RPB",
  databaseURL: "https://overtime-monitoring-plastic-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Elemen DOM
const fileInput = document.getElementById("csvFileInput");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const uploadBtn = document.getElementById("uploadCsvBtn");
const uploadStatus = document.getElementById("uploadStatus");
const kpiTable = document.getElementById("kpiTable");
const tableBody = kpiTable.querySelector("tbody");
const loadingText = document.querySelector(".loading");
const pieChartCtx = document.getElementById("pieChart").getContext("2d");
const overtimeChartCtx = document.getElementById("overtimeChart").getContext("2d");

// Tampilkan nama file saat dipilih
fileInput.addEventListener("change", () => {
  fileNameDisplay.textContent = fileInput.files[0]?.name || "Belum ada file";
});

// Upload CSV dan simpan ke Firebase
uploadBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Pilih file CSV terlebih dahulu.");
    return;
  }

  Papa.parse(file, {
    header: true,
    complete: function(results) {
      const data = results.data.filter(row => row.Employee && row["Overtime Hours"]);
      const otRef = ref(db, "overtimeData");
      data.forEach(item => {
        push(otRef, {
          Employee: item.Employee,
          Department: item.Department || "-",
          OvertimeHours: parseFloat(item["Overtime Hours"]) || 0,
          Shift: item.Shift || "Non Shift"
        });
      });
      uploadStatus.textContent = "Upload berhasil!";
      setTimeout(() => uploadStatus.textContent = "", 3000);
    },
    error: function(err) {
      uploadStatus.textContent = "Gagal mengunggah: " + err.message;
    }
  });
});

// Ambil data dari Firebase dan tampilkan
onValue(ref(db, "overtimeData"), snapshot => {
  const data = snapshot.val();
  tableBody.innerHTML = "";
  if (!data) return;

  const shiftCount = {
    "Green Team": 0,
    "Blue Team": 0,
    "Non Shift": 0
  };

  const overtimeByEmployee = {};
  let rowNumber = 1;

  Object.values(data).forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${rowNumber++}</td>
      <td>${item.Employee}</td>
      <td>${item.Department}</td>
      <td>${item.OvertimeHours}</td>
      <td>${item.Shift}</td>
    `;
    tableBody.appendChild(row);

    // Hitung pie chart
    const shift = item.Shift || "Non Shift";
    shiftCount[shift] = (shiftCount[shift] || 0) + item.OvertimeHours;

    // Hitung overtime per karyawan
    const emp = item.Employee;
    overtimeByEmployee[emp] = (overtimeByEmployee[emp] || 0) + item.OvertimeHours;
  });

  // Tampilkan tabel
  loadingText.style.display = "none";
  kpiTable.style.display = "table";

  // Pie Chart
  new Chart(pieChartCtx, {
    type: "pie",
    data: {
      labels: ["Green Team", "Blue Team", "Non Shift"],
      datasets: [{
        data: [
          shiftCount["Green Team"],
          shiftCount["Blue Team"],
          shiftCount["Non Shift"]
        ],
        backgroundColor: ["#28a745", "#007bff", "#f39c12"]
      }]
    },
    options: {
      plugins: {
        datalabels: {
          formatter: (val) => val.toFixed(1) + "h",
          color: "#fff"
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  // Bar Chart Overtime per Employee
  const employeeNames = Object.keys(overtimeByEmployee);
  const employeeHours = Object.values(overtimeByEmployee);

  new Chart(overtimeChartCtx, {
    type: "bar",
    data: {
      labels: employeeNames,
      datasets: [{
        label: "Overtime Hours",
        data: employeeHours,
        backgroundColor: "#007bff"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});

// Cek status login
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html";
  }
});
