// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBs44-LZ1HF7mbUfET4jWlSd4MxSCwVuEk",
    authDomain: "madarsa-donation--system.firebaseapp.com",
    databaseURL: "https://madarsa-donation--system-default-rtdb.firebaseio.com",
    projectId: "madarsa-donation--system",
    storageBucket: "madarsa-donation--system.firebasestorage.app",
    messagingSenderId: "312717937743",
    appId: "1:312717937743:web:7fd6f52704d414affb2e3a"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

let receipts = [];
let editingReceiptId = null;

function loginUser() {
    const name = document.getElementById("loginMadarsaName").value.trim();
    const pass = document.getElementById("loginMadarsaPassword").value.trim();
    
    if (!name || !pass) {
        alert("براہ کرم مدرسہ کا نام اور پاس ورڈ درج کریں!");
        return;
    }

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appScreen").style.display = "block";
    
    if (document.getElementById("madarsa")) {
        document.getElementById("madarsa").value = name;
    }

    fetchReceiptsFromFirebase();
}

function logoutUser() {
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("appScreen").style.display = "none";
    receipts = [];
}

function fetchReceiptsFromFirebase() {
    db.collection("receipts").onSnapshot((snapshot) => {
        receipts = [];
        snapshot.forEach((doc) => {
            receipts.push({ id: doc.id, ...doc.data() });
        });
        renderRegisterTable(receipts);
        renderSummaryForData(receipts);
    }, (error) => {
        console.log("ڈیٹا لوڈ کرنے میں ایرر:", error);
    });
}

function renderRegisterTable(dataToRender) {
    const container = document.getElementById("receiptList");
    if (!container) return;

    let rowsHtml = "";
    dataToRender.forEach((r) => {
        rowsHtml += `
            <tr style="border-bottom: 1px solid #f1f5f9; text-align: center;">
                <td style="padding: 8px 4px; font-size: 12px; font-weight: bold;">${r.receipt || '-'}</td>
                <td style="padding: 8px 4px; font-size: 12px; text-align: right;">${r.name || 'نامعلوم'}</td>
                <td style="padding: 8px 4px; font-size: 12px;">${r.type || 'عام چندہ'}</td>
                <td style="padding: 8px 4px; font-size: 12px; font-weight: bold; color: #10b981;">₹${r.amount || 0}</td>
                <td style="padding: 8px 4px; white-space: nowrap;">
                    <button onclick="editReceipt('${r.id}')" style="background:#f59e0b; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">ترمیم</button>
                    <button onclick="deleteReceipt('${r.id}')" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">حذف</button>
                </td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="card" style="padding:0; overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; background:#fff; border-radius:10px;">
                <thead>
                    <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; text-align:center;">
                        <th style="padding:8px 4px; font-size:12px;">رسید #</th>
                        <th style="padding:8px 4px; font-size:12px; text-align:right;">نام</th>
                        <th style="padding:8px 4px; font-size:12px;">مد</th>
                        <th style="padding:8px 4px; font-size:12px;">رقم</th>
                        <th style="padding:8px 4px; font-size:12px;">ایکشن</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || `<tr><td colspan="5" style="text-align:center; padding:15px; color:#94a3b8;">کوئی رسید موجود نہیں ہے۔</td></tr>`}
                </tbody>
            </table>
        </div>
    `;
}

function renderSummaryForData(data) {
    const summaryDiv = document.getElementById("summary");
    if (!summaryDiv) return;

    const totalCount = data.length;
    const totalAmount = data.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    summaryDiv.innerHTML = `
        <div style="background: #f0fdf4; border-radius: 8px; padding: 10px 12px; border: 1px solid #bbf7d0;">
            <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:bold; color:#166534;">
                <span>کل رسیدیں: ${totalCount}</span>
                <span>کل وصولی: ₹ ${totalAmount}</span>
            </div>
        </div>
    `;
}

function saveReceiptData() {
    const madarsaVal = document.getElementById("madarsa").value.trim();
    const receiptVal = document.getElementById("receipt").value.trim();
    const dateVal = document.getElementById("date").value;
    const nameVal = document.getElementById("name").value.trim();
    const amountVal = document.getElementById("amount").value;

    if(!madarsaVal || !receiptVal || !dateVal || !nameVal || !amountVal) {
        return alert("براہ کرم تمام ضروری خانوں کو پر کریں!");
    }

    const receiptData = {
        madarsa: madarsaVal,
        jild: document.getElementById("jild").value.trim(),
        safha: document.getElementById("safha").value.trim(),
        receipt: receiptVal,
        date: dateVal,
        name: nameVal,
        mobile: document.getElementById("mobile").value.trim(),
        address: document.getElementById("address").value.trim(),
        type: document.getElementById("type").value,
        amount: Number(amountVal)
    };

    if (editingReceiptId) {
        db.collection("receipts").doc(editingReceiptId).update(receiptData).then(() => {
            alert("رسید اپڈیٹ ہو گئی!");
            resetForm();
        }).catch(err => alert("ایرر: " + err.message));
    } else {
        db.collection("receipts").add(receiptData).then(() => {
            alert("رسید محفوظ ہو گئی!");
            resetForm();
        }).catch(err => alert("ایرر: " + err.message));
    }
}

function editReceipt(id) {
    const r = receipts.find(item => item.id === id);
    if (!r) return;

    editingReceiptId = id;
    document.getElementById("madarsa").value = r.madarsa || "";
    document.getElementById("jild").value = r.jild || "";
    document.getElementById("safha").value = r.safha || "";
    document.getElementById("receipt").value = r.receipt || "";
    document.getElementById("date").value = r.date || "";
    document.getElementById("name").value = r.name || "";
    document.getElementById("mobile").value = r.mobile || "";
    document.getElementById("address").value = r.address || "";
    document.getElementById("type").value = r.type || "عام چندہ";
    document.getElementById("amount").value = r.amount || "";

    const cancelBtn = document.getElementById("cancelEditBtn");
    if(cancelBtn) cancelBtn.style.display = "block";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteReceipt(id) {
    if (!confirm("کیا آپ واقعی اس رسید کو حذف کرنا چاہتے ہیں؟")) return;
    db.collection("receipts").doc(id).delete().then(() => {
        alert("رسید حذف ہو گئی!");
    }).catch(err => alert("ایرر: " + err.message));
}

function resetForm() {
    const form = document.getElementById("receiptForm");
    if(form) form.reset();
    editingReceiptId = null;
    const cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
}

document.getElementById("searchBox")?.addEventListener("input", function (e) {
    const query = e.target.value.toLowerCase().trim();
    const filtered = receipts.filter(r => 
        (r.name && r.name.toLowerCase().includes(query)) ||
        (r.receipt && r.receipt.toString().includes(query)) ||
        (r.mobile && r.mobile.includes(query))
    );
    renderRegisterTable(filtered);
});
