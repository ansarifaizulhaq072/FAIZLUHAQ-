// Local Storage Base Script (بغیر Firebase کے فوری ٹیسٹنگ کے لیے)
let receipts = JSON.parse(localStorage.getItem('madrasa_receipts')) || [];

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

// Login Demo
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  authContainer.classList.add('hidden');
  appContainer.classList.remove('hidden');
  renderReceipts(receipts);
  updateSummaryAndChart(receipts);
});

// Signup Demo
document.getElementById('signup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('اکاؤنٹ بن گیا! اب لاگ ان کریں۔');
  signupBox.classList.add('hidden');
  loginBox.classList.remove('hidden');
});

// Forgot Demo
document.getElementById('forgot-form').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('پاس ورڈ ری سیٹ کا لنک ای میل کر دیا گیا ہے!');
  forgotBox.classList.add('hidden');
  loginBox.classList.remove('hidden');
});

// Logout
document.getElementById('logout-btn').onclick = () => {
  appContainer.classList.add('hidden');
  authContainer.classList.remove('hidden');
};

// Save Receipt
document.getElementById('receipt-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const receiptData = {
    id: Date.now().toString(),
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

  receipts.push(receiptData);
  localStorage.setItem('madrasa_receipts', JSON.stringify(receipts));
  
  alert("رسید کامیابی سے محفوظ ہو گئی!");
  document.getElementById('receipt-form').reset();
  renderReceipts(receipts);
  updateSummaryAndChart(receipts);
});

// Render Receipts to UI
function renderReceipts(data) {
  const container = document.getElementById('receipts-list');
  container.innerHTML = '';

  if (data.length === 0) {
    container.innerHTML = '<p style="text-align:center;">کوئی رسید نہیں ملی۔</p>';
    return;
  }

  data.forEach(r => {
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
window.deleteReceipt = function(id) {
  if (confirm("کیا آپ اس رسید کو ڈیلیٹ کرنا چاہتے ہیں؟")) {
    receipts = receipts.filter(r => r.id !== id);
    localStorage.setItem('madrasa_receipts', JSON.stringify(receipts));
    renderReceipts(receipts);
    updateSummaryAndChart(receipts);
  }
};

// Search Filter
document.getElementById('search-input').addEventListener('input', (e) => {
  const queryText = e.target.value.toLowerCase();
  const filtered = receipts.filter(r => 
    r.receiptNo.toLowerCase().includes(queryText) || 
    r.donorName.toLowerCase().includes(queryText)
  );
  renderReceipts(filtered);
});

// Summary & Chart Update
let donationChart = null;
function updateSummaryAndChart(data) {
  const totalCount = data.length;
  const totalAmt = data.reduce((sum, r) => sum + r.amount, 0);

  document.getElementById('total-receipts').innerText = totalCount;
  document.getElementById('total-amount').innerText = totalAmt;

  const typeTotals = {};
  data.forEach(r => {
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

// OCR Functionality
document.getElementById('scan-ocr-btn').onclick = async () => {
  const fileInput = document.getElementById('receipt-image');
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("براہ کرم پہلے رسید کی تصویر چنیں۔");
    return;
  }
  
  const file = fileInput.files[0];
  alert("تصویر اسکین کی جا رہی ہے...");

  try {
    const result = await Tesseract.recognize(file, 'eng');
    alert("متن پڑھا گیا:\n" + result.data.text.substring(0, 100) + "...");
  } catch (err) {
    alert("OCR میں غلطی: " + err.message);
  }
};

// Backup & Restore
document.getElementById('backup-btn').onclick = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(receipts));
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
  reader.onload = (evt) => {
    try {
      const importedData = JSON.parse(evt.target.result);
      if (Array.isArray(importedData)) {
        receipts = importedData;
        localStorage.setItem('madrasa_receipts', JSON.stringify(receipts));
        alert("بیک اپ کامیابی سے بحال ہو گیا!");
        renderReceipts(receipts);
        updateSummaryAndChart(receipts);
      }
    } catch (err) {
      alert("فائل غلط ہے: " + err.message);
    }
  };
  reader.readAsText(file);
});
