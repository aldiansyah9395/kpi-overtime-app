// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Ganti sesuai config milikmu
const firebaseConfig = {
  apiKey: "AIzaSyARkMjvQJQtmp1DGj6xyIPlXfWDStMCPP4",
  authDomain: "overtime-31816.firebaseapp.com",
  databaseURL: "https://overtime-31816-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "overtime-31816",
  storageBucket: "overtime-31816.firebasestorage.app",
  messagingSenderId: "528991222281",
  appId: "1:528991222281:web:f5b5beeb7bae2ca67f16d8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.db = db;
window.firebaseRefs = { ref, set, onValue, push };
