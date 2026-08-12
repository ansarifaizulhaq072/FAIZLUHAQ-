// Firebase Config & Import (Web SDK v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ اپنی Firebase کی تفصیلات یہاں درج کریں (یہاں ابھی آپ کا ٹیسٹ کنفیگ ہے)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginBox = document.getElementById('login-box');
const signupBox = document.getElementById('signup-box');
const forgotBox = document.getElementById('forgot-box');

// Navigation Links
document.getElementById('show-signup').onclick = (e) => { e.preventDefault(); loginBox.classList.add('hidden'); signupBox.classList.remove('hidden'); };
document.getElementById('show-forgot').onclick = (e) => { e.preventDefault(); loginBox.classList.add('hidden'); forgotBox.classList.remove('hidden'); };
document.getElementById('show-login-from-signup').onclick = (e) => { e.preventDefault(); signupBox.classList.add('hidden'); loginBox.classList.remove('hidden'); };
document.getElementById('show-login-from-forgot').onclick = (e) => { e.preventDefault(); forgotBox.classList.add('hidden'); loginBox.classList.remove('hidden'); };

// State Variables
let currentUser = null;
let allReceipts = [];
let donationChart = null;

// Auth State Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    loadReceipts();
  } else {
    currentUser = null;
    appContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
  }
});

// --- Auth Actions ---

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert('لاگ ان کامیاب ہو گیا!');
  } catch (err) {
    alert('لاگ ان میں غلطی: ' + err.message);
  }
});

// Signup
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert('اکاؤنٹ بن گیا!');
  } catch (err) {
    alert('سائن اپ میں غلطی: ' + err.message);
  }
});

// Forgot Password
document.getElementById('forgot-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;
  try {
    await sendPasswordResetEmail(auth, email);
    alert('پاس ورڈ ری سیٹ کا لنک ای میل کر دیا گیا ہے!');
  } catch (err) {
    alert('غلطی: ' + err.message);
  }
});

// Logout
document.getElementById('logout-btn').onclick = () => signOut(auth);

// --- Receipt Actions ---

// Save Receipt
document.getElementById('receipt-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const receiptData = {
    userId: currentUser.uid,
    jildNo: document.getElementById('jild-no').value,
    safhaNo: document.getElementById('safha-no').value,
    receiptNo: document.getElementById('receipt-no').value,
    date: document.getElementById('receipt-date').value,
    donorName: document.getElementById('donor-name').value,
    donorMobile: document.getElementById('donor-mobile').value,
    donorAddress: document.getElementById('donor-address').value,
    type: document.getElementById('donation-type').value,
    amount: Number(document.getElementById('donation-amount').value),
    createdAt: new Date().toISOString()
  };

  try {
    // Firestore میں محفوظ کریں
    await addDoc(collection(db, "receipts"), receiptData);
    alert("رسید کامیا بی سے محفوظ ہو گئی!");
    document.getElementById('receipt-form').reset();
    loadReceipts();
  } catch (err) {
    alert("سیو کرنے میں مسئلہ: " + err.message);
  }
});

// Fetch Receipts from Firestore
async function loadReceipts() {
  if (!currentUser) return;
  
  try {
    const q = query(collection(db, "receipts"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    allReceipts = [];
    querySnapshot.forEach((docSnap) => {
      allReceipts.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    renderReceipts(allReceipts);
    updateSummaryAndChart(allReceipts);
  } catch (err) {
    console.error("డేటా لو کرنے میں مسئلہ:", err);
  }
}

// Render Receipts to UI
function renderReceipts(receipts) {
  const container = document.getElementById('receipts-list');
  container.innerHTML = '';

  if (receipts.length === 0) {
    container.innerHTML = '<p style="text-align:center;">کوئی رسید نہیں ملی۔</p>';
    return;
  }

  receipts.forEach(r => {
    const card = document.createElement('div');
    card.className = 'receipt-item';
    card.innerHTML = `
      <div class="receipt-header">
        <span>رسید # ${r.receiptNo}</span>
        <span>₹ ${r.amount}</span>
      </div>
      <div><strong>نام:</strong> ${r.donorName}</div>
      <div><strong>مد:</strong> ${r.type} | <strong>تاریخ:</strong> ${r.date}</div>
      <div class="receipt-actions">
        <button onclick="deleteReceipt('${r.id}')" class="btn btn-danger btn-sm">حذف کریں</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Delete Receipt
window.deleteReceipt = async function(id) {
  if (confirm("کیا آپ اس رسید کو ڈیلیٹ کرنا چاہتے ہیں؟")) {
    try {
      await deleteDoc(doc(db, "receipts", id));
      alert("رسید ڈیلیٹ ہو گئی!");
      loadReceipts();
    } catch (err) {
      alert("ڈیلیٹ کرنے میں مسئلہ: " + err.message);
    }
  }
};

// Search Filter
document.getElementById('search-input').addEventListener('input', (e) => {
  const queryText = e.target.value.toLowerCase();
  const filtered = allReceipts.filter(r => 
    r.receiptNo.toLowerCase().includes(queryText) || 
    r.donorName.toLowerCase().includes(queryText)
  );
  renderReceipts(filtered);
});

// Summary & Chart Update
function updateSummaryAndChart(receipts) {
  const totalCount = receipts.length;
  const totalAmt = receipts.reduce((sum, r) => sum + r.amount, 0);

  document.getElementById('total-receipts').innerText = totalCount;
  document.getElementById('total-amount').innerText = totalAmt;

  // Group amounts by Type for Chart
  const typeTotals = {};
  receipts.forEach(r => {
    typeTotals[r.type] = (typeTotals[r.type] || 0) + r.amount;
  });

  const ctx = document.getElementById('donationChart').getContext('2d');
  if (donationChart) donationChart.destroy();

  donationChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(typeTotals),
      datasets: [{
        data: Object.values(typeTotals),
        backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545']
      }]
    }
  });
}

// --- OCR Functionality (Tesseract.js) ---
document.getElementById('scan-ocr-btn').onclick = async () => {
  const fileInput = document.getElementById('receipt-image');
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("براہ کرم پہلے رسید کی تصویر چنیں۔");
    return;
  }
  
  const file = fileInput.files[0];
  alert("تصویر اسکین کی جا رہی ہے، براہ کرم چند سیکنڈ انتظار کریں...");

  try {
    const result = await Tesseract.recognize(file, 'eng');
    console.log("OCR Text:", result.data.text);
    alert("اسکین مکمل ہو گیا! متن پڑھا گیا:\n" + result.data.text.substring(0, 100) + "...");
  } catch (err) {
    alert("OCR میں غلطی: " + err.message);
  }
};

// --- Backup & Restore ---
document.getElementById('backup-btn').onclick = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allReceipts));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `madrasa_backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

document.getElementById('restore-btn').onclick = () => {
  document.getElementById('restore-file').click();
};

document.getElementById('restore-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const importedData = JSON.parse(evt.target.result);
      if (Array.isArray(importedData)) {
        for (let r of importedData) {
          delete r.id; // Delete old ID to create new entry
          r.userId = currentUser.uid;
          await addDoc(collection(db, "receipts"), r);
        }
        alert("بیک اپ کامیابی سے بحال ہو گیا!");
        loadReceipts();
      }
    } catch (err) {
      alert("فائل غلط ہے: " + err.message);
    }
  };
  reader.readAsText(file);
});
