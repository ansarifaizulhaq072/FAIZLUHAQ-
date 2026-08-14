
(function () {

    "use strict";

    console.log(
        "رسید محفوظ نظام: Script لوڈ ہو رہی ہے..."
    );


    // ========================================================
    // GLOBAL APP OBJECT
    // ========================================================

    window.ReceiptSystem =
        window.ReceiptSystem || {};
const app =
    window.ReceiptSystem;
  

    // ========================================================
    // APPLICATION STATE
    // ========================================================

    const state = {

        records: [],

        editIndex: -1,

        ocrRunning: false,

        selectedImage: "",

        currentOCRText: "",

        searchText: ""

    };


    // ========================================================
    // STORAGE KEY
    // ========================================================

    const STORAGE_KEY =
        "receiptRecords";


    // ========================================================
    // OLD STORAGE KEY
    // ========================================================

    const OLD_STORAGE_KEY =
        "receipts";


    // ========================================================
    // ELEMENTS
    // ========================================================

    const elements = {};


    // ========================================================
    // GET ELEMENT
    // ========================================================

    function el(id) {

        return document.getElementById(id);

    }


    // ========================================================
    // CACHE HTML ELEMENTS
    // ========================================================

    function cacheElements() {

        elements.receiptPhoto =
            el("receiptPhoto");

        elements.previewBox =
            el("previewBox");

        elements.receiptPreview =
            el("receiptPreview");

        elements.scanBtn =
            el("scanBtn");

        elements.ocrStatus =
            el("ocrStatus");

        elements.ocrText =
            el("ocrText");

        elements.madarsa =
            el("madarsa");

        elements.jild =
            el("jild");

        elements.safha =
            el("safha");

        elements.receiptNumber =
            el("receiptNumber");

        elements.date =
            el("date");

        elements.donorName =
            el("donorName");

        elements.mobile =
            el("mobile");

        elements.address =
            el("address");

        elements.donationType =
            el("donationType");

        elements.amount =
            el("amount");

        elements.duplicateWarning =
            el("duplicateWarning");

        elements.saveBtn =
            el("saveBtn");

        elements.clearBtn =
            el("clearBtn");

        elements.searchBox =
            el("searchBox");

        elements.recordsList =
            el("recordsList");

    }


    // ========================================================
    // BASIC STRING CLEANER
    // ========================================================

    function cleanString(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }

        return String(value).trim();

    }


    // ========================================================
    // URDU / ARABIC DIGITS TO ENGLISH
    // ========================================================

    function normalizeDigits(value) {

        const map = {

            "۰": "0",
            "۱": "1",
            "۲": "2",
            "۳": "3",
            "۴": "4",
            "۵": "5",
            "۶": "6",
            "۷": "7",
            "۸": "8",
            "۹": "9"

        };


        let text =
            cleanString(value);


        text =
            text.replace(
                /[۰-۹]/g,
                function (digit) {

                    return map[digit];

                }
            );


        text =
            text.replace(
                /[٠-٩]/g,
                function (digit) {

                    return String(
                        "٠١٢٣٤٥٦٧٨٩"
                            .indexOf(digit)
                    );

                }
            );


        return text;

    }


    // ========================================================
    // NORMALIZE TEXT
    // ========================================================

    function normalizeText(text) {

        return normalizeDigits(text)
            .replace(/\r/g, "\n")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

    }


    // ========================================================
    // HTML ESCAPE
    // ========================================================

    function escapeHTML(value) {

        return cleanString(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    // ========================================================
    // CREATE UNIQUE RECORD ID
    // ========================================================

    function createRecordId() {

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );

    }


    // ========================================================
    // FORMAT AMOUNT
    // ========================================================

    function formatAmount(value) {

        const number =
            Number(value);


        if (
            Number.isFinite(number)
        ) {

            return number.toLocaleString(
                "en-IN"
            );

        }


        return cleanString(value);

    }


    // ========================================================
    // OCR STATUS
    // ========================================================

    function setOCRStatus(message) {

        if (
            !elements.ocrStatus
        ) {

            return;

        }


        elements.ocrStatus.textContent =
            message || "";


        elements.ocrStatus.className =
            "status";


        const text =
            String(message || "");


        if (
            text.includes("⚠️") ||
            text.includes("❌")
        ) {

            elements.ocrStatus.classList.add(
                "warning"
            );

        }


        if (
            text.includes("✅")
        ) {

            elements.ocrStatus.classList.add(
                "success-message"
            );

        }

    }


    // ========================================================
    // NORMALIZE RECORD
    // ========================================================

    function normalizeRecord(record) {

        record =
            record || {};


        return {

            id:
                record.id ||
                createRecordId(),

            madarsa:
                cleanString(
                    record.madarsa ||
                    record.madrasa
                ),

            jild:
                cleanString(
                    record.jild
                ),

            safha:
                cleanString(
                    record.safha
                ),

            receiptNumber:
                cleanString(
                    record.receiptNumber ||
                    record.receipt
                ),

            date:
                cleanString(
                    record.date
                ),

            donorName:
                cleanString(
                    record.donorName ||
                    record.name
                ),

            mobile:
                cleanString(
                    record.mobile
                ),

            address:
                cleanString(
                    record.address
                ),

            donationType:
                cleanString(
                    record.donationType ||
                    record.type
                ),

            amount:
                Number(
                    record.amount || 0
                ),

            photo:
                cleanString(
                    record.photo ||
                    record.currentImage
                )

        };

    }


    // ========================================================
    // SAVE RECORDS TO LOCAL STORAGE
    // ========================================================

    function saveRecordsToStorage() {

        try {

            localStorage.setItem(

                STORAGE_KEY,

                JSON.stringify(
                    state.records
                )

            );


            return true;

        } catch (error) {

            console.error(
                "Records Storage Error:",
                error
            );


            setOCRStatus(
                "❌ رسیدیں محفوظ کرنے میں مسئلہ آیا۔"
            );


            return false;

        }

    }


    // ========================================================
    // LOAD RECORDS FROM LOCAL STORAGE
    // ========================================================

    function loadRecordsFromStorage() {

        try {

            let saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            // ------------------------------------------------
            // اگر نئی جگہ ڈیٹا نہیں ہے تو پرانے receipts
            // سے موجودہ ریکارڈ ایک بار منتقل کریں
            // ------------------------------------------------

            if (!saved) {

                const oldSaved =
                    localStorage.getItem(
                        OLD_STORAGE_KEY
                    );


                if (oldSaved) {

                    const oldRecords =
                        JSON.parse(
                            oldSaved
                        );


                    if (
                        Array.isArray(
                            oldRecords
                        )
                    {

                        state.records =
                            oldRecords.map(
                                normalizeRecord
                            );


                        saveRecordsToStorage();


                        console.log(
                            "پرانے receipts ڈیٹا سے " +
                            state.records.length +
                            " ریکارڈ منتقل ہوگئے۔"
                        );


                        return;

                    }

                }


                state.records = [];

                return;

            }


            // ------------------------------------------------
            // JSON READ
            // ------------------------------------------------

            const parsed =
                JSON.parse(
                    saved
                );


            if (
                Array.isArray(
                    parsed
                )
            ) {

                state.records =
                    parsed.map(
                        normalizeRecord
                    );

            } else {

                state.records = [];

            }


        } catch (error) {

            console.error(
                "Records Load Error:",
                error
            );


            state.records = [];

        }

    }


    // ========================================================
    // GLOBAL APP API
    // ========================================================

    app.state =
        state;


    app.elements =
        elements;


    app.STORAGE_KEY =
        STORAGE_KEY;


    app.saveRecordsToStorage =
        saveRecordsToStorage;


    app.loadRecordsFromStorage =
        loadRecordsFromStorage;


    app.setOCRStatus =
        setOCRStatus;


    // ========================================================
    // PART 1 END
    // ========================================================

    console.log(
        "✅ SCRIPT حصہ 1 تیار ہے۔"
    );


// ============================================================
// SCRIPT.JS — حصہ 2 / 8
// Form + Image Preview + Clear + Duplicate Check
// ============================================================


// ========================================================
// GET CURRENT FORM DATA
// ========================================================

function getFormData() {

    return {

        id:
            state.editIndex >= 0 &&
            state.records[state.editIndex]
                ? state.records[state.editIndex].id
                : createRecordId(),

        madarsa:
            cleanString(
                elements.madarsa?.value
            ),

        jild:
            cleanString(
                elements.jild?.value
            ),

        safha:
            cleanString(
                elements.safha?.value
            ),

        receiptNumber:
            normalizeDigits(
                elements.receiptNumber?.value
            ),

        date:
            cleanString(
                elements.date?.value
            ),

        donorName:
            cleanString(
                elements.donorName?.value
            ),

        mobile:
            normalizeDigits(
                elements.mobile?.value
            ),

        address:
            cleanString(
                elements.address?.value
            ),

        donationType:
            cleanString(
                elements.donationType?.value
            ),

        amount:
            Number(
                elements.amount?.value || 0
            ),

        photo:
            state.selectedImage || ""

    };

}


// ========================================================
// FILL FORM
// ========================================================

function fillForm(record) {

    if (!record) {

        return;

    }


    if (elements.madarsa) {

        elements.madarsa.value =
            record.madarsa || "";

    }


    if (elements.jild) {

        elements.jild.value =
            record.jild || "";

    }


    if (elements.safha) {

        elements.safha.value =
            record.safha || "";

    }


    if (elements.receiptNumber) {

        elements.receiptNumber.value =
            record.receiptNumber || "";

    }


    if (elements.date) {

        elements.date.value =
            record.date || "";

    }


    if (elements.donorName) {

        elements.donorName.value =
            record.donorName || "";

    }


    if (elements.mobile) {

        elements.mobile.value =
            record.mobile || "";

    }


    if (elements.address) {

        elements.address.value =
            record.address || "";

    }


    if (elements.donationType) {

        elements.donationType.value =
            record.donationType || "";

    }


    if (elements.amount) {

        elements.amount.value =
            record.amount || "";

    }


    state.selectedImage =
        record.photo || "";


    if (record.photo) {

        showImagePreview(
            record.photo
        );

    }

}


// ========================================================
// CLEAR FORM
// ========================================================

function clearForm() {

    const fields = [

        elements.madarsa,
        elements.jild,
        elements.safha,
        elements.receiptNumber,
        elements.date,
        elements.donorName,
        elements.mobile,
        elements.address,
        elements.donationType,
        elements.amount

    ];


    fields.forEach(
        function (field) {

            if (field) {

                field.value = "";

            }

        }
    );


    state.editIndex =
        -1;


    state.selectedImage =
        "";


    state.currentOCRText =
        "";


    if (elements.receiptPhoto) {

        elements.receiptPhoto.value =
            "";

    }


    if (elements.previewBox) {

        elements.previewBox.style.display =
            "none";

    }


    if (elements.receiptPreview) {

        elements.receiptPreview.src =
            "";

    }


    if (elements.ocrText) {

        elements.ocrText.textContent =
            "ابھی کوئی متن نہیں۔";

    }


    hideDuplicateWarning();


    if (elements.saveBtn) {

        elements.saveBtn.textContent =
            "💾 رسید محفوظ کریں";

    }


    setOCRStatus(
        "فارم صاف ہوگیا۔"
    );

}


// ========================================================
// SHOW IMAGE PREVIEW
// ========================================================

function showImagePreview(fileOrData) {

    if (
        !elements.previewBox ||
        !elements.receiptPreview ||
        !fileOrData
    ) {

        return;

    }


    // ------------------------------------------------
    // اگر پہلے سے Data URL ہے
    // ------------------------------------------------

    if (
        typeof fileOrData ===
        "string"
    ) {

        elements.receiptPreview.src =
            fileOrData;


        elements.previewBox.style.display =
            "block";


        state.selectedImage =
            fileOrData;


        return;

    }


    // ------------------------------------------------
    // اگر File object ہے
    // ------------------------------------------------

    const reader =
        new FileReader();


    reader.onload =
        function () {

            elements.receiptPreview.src =
                reader.result;


            elements.previewBox.style.display =
                "block";


            state.selectedImage =
                reader.result;

        };


    reader.onerror =
        function (error) {

            console.error(
                "Image Read Error:",
                error
            );

            setOCRStatus(
                "❌ تصویر پڑھنے میں مسئلہ آیا۔"
            );

        };


    reader.readAsDataURL(
        fileOrData
    );

}


// ========================================================
// FIND DUPLICATE RECEIPT
// ========================================================

function findDuplicate(record) {

    const receipt =
        normalizeDigits(
            record.receiptNumber
        );


    if (!receipt) {

        return null;

    }


    return state.records.find(
        function (item, index) {

            // موجودہ edit record کو ignore کریں
            if (
                index ===
                state.editIndex
            ) {

                return false;

            }


            const itemReceipt =
                normalizeDigits(
                    item.receiptNumber ||
                    item.receipt
                );


            if (
                itemReceipt !==
                receipt
            ) {

                return false;

            }


            const a =
                normalizeText(
                    item.madarsa
                ).toLowerCase();


            const b =
                normalizeText(
                    record.madarsa
                ).toLowerCase();


            // اگر مدرسہ خالی ہو تو بھی
            // receipt number کو duplicate سمجھیں
            if (
                !a ||
                !b
            ) {

                return true;

            }


            return a === b;

        }
    ) || null;

}


// ========================================================
// SHOW DUPLICATE WARNING
// ========================================================

function showDuplicateWarning(record) {

    if (
        !elements.duplicateWarning
    ) {

        return;

    }


    elements.duplicateWarning.style.display =
        "block";


    elements.duplicateWarning.textContent =

        "⚠️ اس رسید نمبر کی رسید پہلے سے محفوظ ہے۔" +

        (
            record
                ? " نام: " +
                  (record.donorName || "") +
                  "، رقم: " +
                  formatAmount(
                      record.amount
                  )
                : ""
        );

}


// ========================================================
// HIDE DUPLICATE WARNING
// ========================================================

function hideDuplicateWarning() {

    if (
        !elements.duplicateWarning
    ) {

        return;

    }


    elements.duplicateWarning.style.display =
        "none";


    elements.duplicateWarning.textContent =
        "";

}


// ========================================================
// CHECK FORM
// ========================================================

function validateRecord(record) {

    if (
        !record.madarsa
    ) {

        alert(
            "مدرسہ کا نام لکھیں۔"
        );

        return false;

    }


    if (
        !record.receiptNumber
    ) {

        alert(
            "رسید نمبر لکھیں۔"
        );

        return false;

    }


    if (
        !record.donorName
    ) {

        alert(
            "چندہ دینے والے کا نام لکھیں۔"
        );

        return false;

    }


    if (
        !Number.isFinite(
            record.amount
        ) ||
        record.amount <= 0
    ) {

        alert(
            "صحیح رقم لکھیں۔"
        );

        return false;

    }


    return true;

}


// ========================================================
// SAVE RECORD
// ========================================================

function saveRecord() {

    const record =
        getFormData();


    // ------------------------------------------------
    // Validation
    // ------------------------------------------------

    if (
        !validateRecord(
            record
        )
    ) {

        return;

    }


    // ------------------------------------------------
    // Duplicate Check
    // ------------------------------------------------

    const duplicate =
        findDuplicate(
            record
        );


    if (duplicate) {

        showDuplicateWarning(
            duplicate
        );


        const continueSave =
            confirm(
                "یہ رسید نمبر پہلے سے موجود ہے۔\n\n" +
                "کیا آپ پھر بھی یہ رسید محفوظ کرنا چاہتے ہیں؟"
            );


        if (!continueSave) {

            return;

        }

    }


    hideDuplicateWarning();


    // ------------------------------------------------
    // EDIT
    // ------------------------------------------------

    if (
        state.editIndex >= 0 &&
        state.records[
            state.editIndex
        ]
    ) {

        state.records[
            state.editIndex
        ] =
            normalizeRecord(
                record
            );


        setOCRStatus(
            "✅ رسید میں تبدیلی محفوظ ہوگئی۔"
        );

    }


    // ------------------------------------------------
    // NEW RECORD
    // ------------------------------------------------

    else {

        state.records.push(
            normalizeRecord(
                record
            )
        );


        setOCRStatus(
            "✅ رسید محفوظ ہوگئی۔"
        );

    }


    // ------------------------------------------------
    // STORAGE
    // ------------------------------------------------

    const saved =
        saveRecordsToStorage();


    if (!saved) {

        return;

    }


    // ------------------------------------------------
    // RENDER
    // ------------------------------------------------

    if (
        typeof renderRecords ===
        "function"
    ) {

        renderRecords();

    }


    // ------------------------------------------------
    // CLEAR FORM
    // ------------------------------------------------

    clearForm();

}


// ========================================================
// EXPORT PART 2 FUNCTIONS
// ========================================================

app.getFormData =
    getFormData;


app.fillForm =
    fillForm;


app.clearForm =
    clearForm;


app.showImagePreview =
    showImagePreview;


app.findDuplicate =
    findDuplicate;


app.saveRecord =
    saveRecord;


console.log(
    "✅ SCRIPT حصہ 2 تیار ہے۔"
);
// ============================================================
// SCRIPT.JS — حصہ 3 / 8
// Image File + OCR + Text Extraction
// ============================================================


// ========================================================
// SHOW OCR TEXT
// ========================================================

function showOCRText(text) {

    const clean =
        cleanString(text);


    state.currentOCRText =
        clean;


    if (
        elements.ocrText
    ) {

        elements.ocrText.textContent =
            clean ||
            "ابھی کوئی متن نہیں۔";

    }

}


// ========================================================
// SET INPUT VALUE SAFELY
// ========================================================

function setInputValue(
    element,
    value
) {

    if (
        !element
    ) {

        return;

    }


    const clean =
        cleanString(value);


    if (clean) {

        element.value =
            clean;

    }

}


// ========================================================
// EXTRACT MOBILE NUMBER
// ========================================================

function detectMobile(text) {

    const clean =
        normalizeDigits(
            text
        );


    const matches =
        clean.match(
            /(?:\+?91[\s-]?)?[6-9]\d{9}\b/g
        );


    if (
        matches &&
        matches.length
    ) {

        return matches[0]
            .replace(
                /\s+/g,
                ""
            )
            .replace(
                /^91/,
                ""
            );

    }


    // پاکستانی/عمومی 10 یا 11 digit fallback
    const fallback =
        clean.match(
            /\b\d{10,11}\b/g
        );


    return fallback &&
        fallback.length
        ? fallback[0]
        : "";

}


// ========================================================
// EXTRACT DATE
// ========================================================

function detectDate(text) {

    const clean =
        normalizeDigits(
            text
        );


    // YYYY-MM-DD
    let match =
        clean.match(
            /\b(20\d{2})[-\/](\d{1,2})[-\/](\d{1,2})\b/
        );


    if (match) {

        const year =
            match[1];

        const month =
            String(
                match[2]
            ).padStart(
                2,
                "0"
            );

        const day =
            String(
                match[3]
            ).padStart(
                2,
                "0"
            );


        return (
            year +
            "-" +
            month +
            "-" +
            day
        );

    }


    // DD-MM-YYYY / DD/MM/YYYY
    match =
        clean.match(
            /\b(\d{1,2})[-\/](\d{1,2})[-\/](20\d{2})\b/
        );


    if (match) {

        const day =
            String(
                match[1]
            ).padStart(
                2,
                "0"
            );

        const month =
            String(
                match[2]
            ).padStart(
                2,
                "0"
            );

        const year =
            match[3];


        return (
            year +
            "-" +
            month +
            "-" +
            day
        );

    }


    return "";

}


// ========================================================
// EXTRACT RECEIPT NUMBER
// ========================================================

function detectReceiptNumber(text) {

    const clean =
        normalizeDigits(
            text
        );


    const patterns = [

        /(?:رسید|receipt|رقم نمبر|نمبر)[^\d]{0,20}(\d{1,8})/i,

        /(?:no|number|#)[^\d]{0,10}(\d{1,8})/i,

        /\b\d{2,8}\b/

    ];


    for (
        const pattern
        of patterns
    ) {

        const match =
            clean.match(
                pattern
            );


        if (
            match
        ) {

            return (
                match[1] ||
                match[0]
            );

        }

    }


    return "";

}


// ========================================================
// EXTRACT AMOUNT
// ========================================================

function detectAmount(text) {

    const clean =
        normalizeDigits(
            text
        );


    const patterns = [

        /(?:رقم|مبلغ|amount|total|Rs\.?|₹)[^\d]{0,20}([\d,]+(?:\.\d+)?)/i,

        /(?:روپے|rupees)[^\d]{0,20}([\d,]+(?:\.\d+)?)/i

    ];


    for (
        const pattern
        of patterns
    ) {

        const match =
            clean.match(
                pattern
            );


        if (
            match
        ) {

            return Number(
                match[1]
                    .replace(
                        /,/g,
                        ""
                    )
            );

        }

    }


    // آخری fallback:
    // بڑے نمبروں میں سے رقم تلاش کرنے کی کوشش

    const numbers =
        clean.match(
            /\b\d{2,8}(?:,\d{3})*(?:\.\d+)?\b/g
        );


    if (
        numbers &&
        numbers.length
    ) {

        const parsed =
            numbers.map(
                function (item) {

                    return Number(
                        item.replace(
                            /,/g,
                            ""
                        )
                    );

                }
            );


        const valid =
            parsed.filter(
                function (num) {

                    return (
                        Number.isFinite(num) &&
                        num > 0
                    );

                }
            );


        if (
            valid.length
        ) {

            return Math.max(
                ...valid
            );

        }

    }


    return 0;

}


// ========================================================
// EXTRACT NAME
// ========================================================

function detectName(text) {

    const lines =
        normalizeText(
            text
        )
        .split(
            "\n"
        )
        .map(
            function (line) {

                return line.trim();

            }
        )
        .filter(
            function (line) {

                return line.length >= 3;

            }
        );


    const labels = [

        "نام",

        "اسم",

        "نام چندہ دہندہ",

        "donor",

        "name"

    ];


    for (
        const line
        of lines
    ) {

        const lower =
            line.toLowerCase();


        for (
            const label
            of labels
        ) {

            const index =
                lower.indexOf(
                    label.toLowerCase()
                );


            if (
                index !== -1
            ) {

                let value =
                    line.slice(
                        index +
                        label.length
                    );


                value =
                    value
                        .replace(
                            /^[\s:：\-–—]+/,
                            ""
                        )
                        .trim();


                if (
                    value.length >= 2
                ) {

                    return value;

                }

            }

        }

    }


    return "";

}


// ========================================================
// EXTRACT MADARSA
// ========================================================

function detectMadarsa(text) {

    const lines =
        normalizeText(
            text
        )
        .split(
            "\n"
        )
        .map(
            function (line) {

                return line.trim();

            }
        )
        .filter(
            Boolean
        );


    for (
        const line
        of lines
    ) {

        const lower =
            line.toLowerCase();


        if (
            lower.includes(
                "مدرسہ"
            ) ||
            lower.includes(
                "madrasa"
            ) ||
            lower.includes(
                "madarsa"
            ) ||
            lower.includes(
                "madrasah"
            )
        ) {

            return line;

        }

    }


    return "";

}


// ========================================================
// EXTRACT JILD
// ========================================================

function detectJild(text) {

    const clean =
        normalizeDigits(
            text
        );


    const match =
        clean.match(
            /(?:جلد|jild)[^\d]{0,15}(\d{1,4})/i
        );


    return match
        ? match[1]
        : "";

}


// ========================================================
// EXTRACT SAFHA
// ========================================================

function detectSafha(text) {

    const clean =
        normalizeDigits(
            text
        );


    const match =
        clean.match(
            /(?:صفحہ|صفحه|safha|page)[^\d]{0,15}(\d{1,6})/i
        );


    return match
        ? match[1]
        : "";

}


// ========================================================
// APPLY OCR DATA TO FORM
// ========================================================

function applyOCRToForm(text) {

    const clean =
        normalizeText(
            text
        );


    if (!clean) {

        return;

    }


    // ------------------------------------------------
    // MOBILE
    // ------------------------------------------------

    const mobile =
        detectMobile(
            clean
        );


    if (
        mobile
    ) {

        setInputValue(
            elements.mobile,
            mobile
        );

    }


    // ------------------------------------------------
    // DATE
    // ------------------------------------------------

    const date =
        detectDate(
            clean
        );


    if (
        date
    ) {

        setInputValue(
            elements.date,
            date
        );

    }


    // ------------------------------------------------
    // RECEIPT NUMBER
    // ------------------------------------------------

    const receiptNumber =
        detectReceiptNumber(
            clean
        );


    if (
        receiptNumber
    ) {

        setInputValue(
            elements.receiptNumber,
            receiptNumber
        );

    }


    // ------------------------------------------------
    // AMOUNT
    // ------------------------------------------------

    const amount =
        detectAmount(
            clean
        );


    if (
        amount > 0
    ) {

        setInputValue(
            elements.amount,
            amount
        );

    }


    // ------------------------------------------------
    // NAME
    // ------------------------------------------------

    const name =
        detectName(
            clean
        );


    if (
        name
    ) {

        setInputValue(
            elements.donorName,
            name
        );

    }


    // ------------------------------------------------
    // MADARSA
    // ------------------------------------------------

    const madarsa =
        detectMadarsa(
            clean
        );


    if (
        madarsa
    ) {

        setInputValue(
            elements.madarsa,
            madarsa
        );

    }


    // ------------------------------------------------
    // JILD
    // ------------------------------------------------

    const jild =
        detectJild(
            clean
        );


    if (
        jild
    ) {

        setInputValue(
            elements.jild,
            jild
        );

    }


    // ------------------------------------------------
    // SAFHA
    // ------------------------------------------------

    const safha =
        detectSafha(
            clean
        );


    if (
        safha
    ) {

        setInputValue(
            elements.safha,
            safha
        );

    }


    // ------------------------------------------------
    // DUPLICATE CHECK
    // ------------------------------------------------

    const current =
        getFormData();


    const duplicate =
        findDuplicate(
            current
        );


    if (
        duplicate
    ) {

        showDuplicateWarning(
            duplicate
        );

    } else {

        hideDuplicateWarning();

    }

}


// ========================================================
// RUN OCR
// ========================================================

async function runOCR(file) {

    if (
        !file
    ) {

        setOCRStatus(
            "⚠️ پہلے رسید کی تصویر منتخب کریں۔"
        );

        return;

    }


    if (
        typeof Tesseract ===
        "undefined"
    ) {

        setOCRStatus(
            "❌ Tesseract OCR لوڈ نہیں ہوئی۔"
        );

        return;

    }


    if (
        state.ocrRunning
    ) {

        return;

    }


    state.ocrRunning =
        true;


    if (
        elements.scanBtn
    ) {

        elements.scanBtn.disabled =
            true;

        elements.scanBtn.textContent =
            "⏳ رسید پڑھی جا رہی ہے...";

    }


    setOCRStatus(
        "⏳ تصویر سے متن پڑھا جا رہا ہے، تھوڑا انتظار کریں..."
    );


    try {

        const result =
            await Tesseract.recognize(

                file,

                "eng+urd",

                {

                    logger:
                        function (info) {

                            if (
                                info &&
                                typeof info.progress ===
                                "number"
                            ) {

                                const percent =
                                    Math.round(
                                        info.progress *
                                        100
                                    );


                                setOCRStatus(
                                    "⏳ OCR جاری ہے... " +
                                    percent +
                                    "%"
                                );

                            }

                        }

                }

            );


        const text =
            result &&
            result.data
                ? result.data.text
                : "";


        showOCRText(
            text
        );


        if (
            text.trim()
        ) {

            applyOCRToForm(
                text
            );


            setOCRStatus(
                "✅ رسید اسکین ہوگئی۔ معلومات چیک کرکے محفوظ کریں۔"
            );

        } else {

            setOCRStatus(
                "⚠️ OCR کو تصویر میں کوئی واضح متن نہیں ملا۔"
            );

        }


    } catch (error) {

        console.error(
            "OCR Error:",
            error
        );


        setOCRStatus(
            "❌ OCR میں مسئلہ آیا: " +
            (
                error.message ||
                "Unknown error"
            )
        );


    } finally {

        state.ocrRunning =
            false;


        if (
            elements.scanBtn
        ) {

            elements.scanBtn.disabled =
                false;

            elements.scanBtn.textContent =
                "📷 رسید اسکین کریں";

        }

    }

}


// ========================================================
// IMAGE FILE CHANGE
// ========================================================

function handleImageChange(event) {

    const file =
        event &&
        event.target
            ? event.target.files[0]
            : null;


    if (!file) {

        return;

    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        setOCRStatus(
            "❌ براہ کرم تصویر منتخب کریں۔"
        );

        return;

    }


    showImagePreview(
        file
    );


    setOCRStatus(
        "📷 تصویر منتخب ہوگئی۔ اب رسید اسکین کریں۔"
    );

}


// ========================================================
// OCR BUTTON CLICK
// ========================================================

function handleScanClick() {

    if (
        !elements.receiptPhoto
    ) {

        return;

    }


    const file =
        elements.receiptPhoto.files[0];


    runOCR(
        file
    );

}


// ========================================================
// EXPORT PART 3
// ========================================================

app.showOCRText =
    showOCRText;


app.detectMobile =
    detectMobile;


app.detectDate =
    detectDate;


app.detectReceiptNumber =
    detectReceiptNumber;


app.detectAmount =
    detectAmount;


app.detectName =
    detectName;


app.detectMadarsa =
    detectMadarsa;


app.detectJild =
    detectJild;


app.detectSafha =
    detectSafha;


app.applyOCRToForm =
    applyOCRToForm;


app.runOCR =
    runOCR;


app.handleImageChange =
    handleImageChange;


app.handleScanClick =
    handleScanClick;


console.log(
    "✅ SCRIPT حصہ 3 تیار ہے۔"
);
// ============================================================
// SCRIPT.JS — حصہ 4 / 8
// Records Render + Search + Edit + Delete
// ============================================================


// ========================================================
// GET VISIBLE RECORDS
// ========================================================

function getVisibleRecords() {

    const query =
        normalizeText(
            state.searchText
        ).toLowerCase();


    if (!query) {

        return [
            ...state.records
        ];

    }


    return state.records.filter(
        function (record) {

            const searchable = [

                record.receiptNumber,

                record.donorName,

                record.mobile,

                record.madarsa,

                record.jild,

                record.safha,

                record.donationType,

                record.address,

                record.date,

                record.amount

            ]
                .map(
                    function (value) {

                        return normalizeDigits(
                            value
                        ).toLowerCase();

                    }
                )
                .join(" ");


            return searchable.includes(
                query
            );

        }
    );

}


// ========================================================
// CREATE RECORD HTML
// ========================================================

function createRecordHTML(
    record,
    index
) {

    const photoHTML =
        record.photo

            ? `
                <div style="margin-top:12px;text-align:center;">
                    <img
                        src="${escapeHTML(record.photo)}"
                        alt="رسید کی تصویر"
                        style="
                            width:100%;
                            max-height:260px;
                            object-fit:contain;
                            border-radius:10px;
                            border:1px solid #ddd;
                        "
                    >
                </div>
              `

            : "";


    return `

        <div class="record">

            <strong>
                رسید نمبر:
                ${escapeHTML(
                    record.receiptNumber
                )}
            </strong>

            <div style="margin-top:8px;line-height:1.9;">

                <div>
                    <b>نام:</b>
                    ${escapeHTML(
                        record.donorName
                    )}
                </div>

                <div>
                    <b>مدرسہ:</b>
                    ${escapeHTML(
                        record.madarsa
                    )}
                </div>

                <div>
                    <b>رقم:</b>
                    ${escapeHTML(
                        formatAmount(
                            record.amount
                        )
                    )}
                </div>

                <div>
                    <b>تاریخ:</b>
                    ${escapeHTML(
                        record.date
                    )}
                </div>

                ${
                    record.mobile
                        ? `
                            <div>
                                <b>موبائل:</b>
                                ${escapeHTML(
                                    record.mobile
                                )}
                            </div>
                          `
                        : ""
                }

                ${
                    record.jild
                        ? `
                            <div>
                                <b>جلد:</b>
                                ${escapeHTML(
                                    record.jild
                                )}
                            </div>
                          `
                        : ""
                }

                ${
                    record.safha
                        ? `
                            <div>
                                <b>صفحہ:</b>
                                ${escapeHTML(
                                    record.safha
                                )}
                            </div>
                          `
                        : ""
                }

                ${
                    record.donationType
                        ? `
                            <div>
                                <b>چندہ کی مد:</b>
                                ${escapeHTML(
                                    record.donationType
                                )}
                            </div>
                          `
                        : ""
                }

                ${
                    record.address
                        ? `
                            <div>
                                <b>پتہ:</b>
                                ${escapeHTML(
                                    record.address
                                )}
                            </div>
                          `
                        : ""
                }

            </div>

            ${photoHTML}


            <div
                style="
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:8px;
                    margin-top:12px;
                "
            >

                <button
                    type="button"
                    class="edit-record-btn"
                    data-index="${index}"
                    style="
                        background:#1677ff;
                        color:white;
                    "
                >
                    ✏️ ترمیم
                </button>


                <button
                    type="button"
                    class="delete-record-btn"
                    data-index="${index}"
                    style="
                        background:#d93025;
                        color:white;
                    "
                >
                    🗑️ حذف
                </button>

            </div>

        </div>

    `;

}


// ========================================================
// RENDER RECORDS
// ========================================================

function renderRecords() {

    if (
        !elements.recordsList
    ) {

        console.warn(
            "recordsList element نہیں ملا۔"
        );

        return;

    }


    const records =
        getVisibleRecords();


    if (
        !records.length
    ) {

        elements.recordsList.innerHTML = `

            <div class="empty">

                ${
                    state.searchText
                        ? "🔍 تلاش کے مطابق کوئی رسید نہیں ملی۔"
                        : "ابھی کوئی رسید محفوظ نہیں۔"
                }

            </div>

        `;

        return;

    }


    elements.recordsList.innerHTML =
        records
            .map(
                function (record) {

                    const realIndex =
                        state.records.indexOf(
                            record
                        );


                    return createRecordHTML(
                        record,
                        realIndex
                    );

                }
            )
            .join("");


    bindRecordButtons();

}


// ========================================================
// BIND EDIT / DELETE BUTTONS
// ========================================================

function bindRecordButtons() {

    const editButtons =
        elements.recordsList.querySelectorAll(
            ".edit-record-btn"
        );


    editButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    editRecord(
                        index
                    );

                }
            );

        }
    );


    const deleteButtons =
        elements.recordsList.querySelectorAll(
            ".delete-record-btn"
        );


    deleteButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    deleteRecord(
                        index
                    );

                }
            );

        }
    );

}


// ========================================================
// EDIT RECORD
// ========================================================

function editRecord(index) {

    if (
        index < 0 ||
        index >= state.records.length
    ) {

        return;

    }


    const record =
        state.records[index];


    state.editIndex =
        index;


    fillForm(
        record
    );


    if (
        elements.saveBtn
    ) {

        elements.saveBtn.textContent =
            "💾 تبدیلی محفوظ کریں";

    }


    setOCRStatus(
        "✏️ رسید ترمیم کے لیے کھولی گئی۔"
    );


    // صفحہ اوپر لے جائیں
    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ========================================================
// DELETE RECORD
// ========================================================

function deleteRecord(index) {

    if (
        index < 0 ||
        index >= state.records.length
    ) {

        return;

    }


    const record =
        state.records[index];


    const confirmed =
        confirm(

            "کیا آپ یہ رسید حذف کرنا چاہتے ہیں؟\n\n" +

            "رسید نمبر: " +
            (
                record.receiptNumber ||
                ""
            ) +

            "\nنام: " +
            (
                record.donorName ||
                ""
            )

        );


    if (!confirmed) {

        return;

    }


    state.records.splice(
        index,
        1
    );


    saveRecordsToStorage();


    renderRecords();


    setOCRStatus(
        "🗑️ رسید حذف ہوگئی۔"
    );


    if (
        state.editIndex ===
        index
    ) {

        clearForm();

    }

}


// ========================================================
// SEARCH RECORDS
// ========================================================

function searchRecords(value) {

    state.searchText =
        normalizeDigits(
            value
        ).toLowerCase();


    renderRecords();

}


// ========================================================
// EXPORT PART 4
// ========================================================

app.getVisibleRecords =
    getVisibleRecords;


app.renderRecords =
    renderRecords;


app.editRecord =
    editRecord;


app.deleteRecord =
    deleteRecord;


app.searchRecords =
    searchRecords;


console.log(
    "✅ SCRIPT حصہ 4 تیار ہے۔"
);
// ============================================================
// SCRIPT.JS — حصہ 5 / 8
// Backup + Restore + Print
// ============================================================


// ========================================================
// CREATE BACKUP DATA
// ========================================================

function createBackupData() {

    return {

        app:
            "رسید محفوظ نظام",

        version:
            "1.0",

        createdAt:
            new Date().toISOString(),

        records:
            state.records

    };

}


// ========================================================
// DOWNLOAD TEXT FILE
// ========================================================

function downloadTextFile(
    content,
    filename,
    mimeType
) {

    try {

        const blob =
            new Blob(
                [content],
                {
                    type:
                        mimeType ||
                        "text/plain;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            function () {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );


        return true;

    } catch (error) {

        console.error(
            "Download Error:",
            error
        );


        return false;

    }

}


// ========================================================
// BACKUP DATA
// ========================================================

function backupData() {

    try {

        const backup =
            createBackupData();


        const json =
            JSON.stringify(
                backup,
                null,
                2
            );


        const date =
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );


        const filename =
            "receipt-backup-" +
            date +
            ".json";


        const success =
            downloadTextFile(
                json,
                filename,
                "application/json;charset=utf-8"
            );


        if (success) {

            setOCRStatus(
                "✅ بیک اپ فائل تیار ہوگئی۔"
            );

        } else {

            setOCRStatus(
                "❌ بیک اپ بنانے میں مسئلہ آیا۔"
            );

        }


    } catch (error) {

        console.error(
            "Backup Error:",
            error
        );


        setOCRStatus(
            "❌ بیک اپ بنانے میں مسئلہ آیا۔"
        );

    }

}


// ========================================================
// RESTORE BACKUP OBJECT
// ========================================================

function restoreBackupObject(
    data
) {

    let incomingRecords = [];


    // ------------------------------------------------
    // اگر مکمل backup object ہے
    // ------------------------------------------------

    if (
        data &&
        Array.isArray(
            data.records
        )
    ) {

        incomingRecords =
            data.records;

    }


    // ------------------------------------------------
    // اگر سیدھا array ہے
    // ------------------------------------------------

    else if (
        Array.isArray(
            data
        )
    ) {

        incomingRecords =
            data;

    }


    if (
        !incomingRecords.length
    ) {

        alert(
            "اس بیک اپ میں کوئی رسید نہیں ملی۔"
        );

        return false;

    }


    const confirmed =
        confirm(

            "بیک اپ میں " +
            incomingRecords.length +
            " رسیدیں ملی ہیں۔\n\n" +

            "کیا موجودہ رسیدوں کو حذف کرکے " +
            "یہ بیک اپ بحال کرنا ہے؟"

        );


    if (!confirmed) {

        return false;

    }


    state.records =
        incomingRecords.map(
            normalizeRecord
        );


    const saved =
        saveRecordsToStorage();


    if (!saved) {

        return false;

    }


    state.editIndex =
        -1;


    renderRecords();


    clearForm();


    setOCRStatus(
        "✅ بیک اپ کامیابی سے بحال ہوگیا۔"
    );


    return true;

}


// ========================================================
// RESTORE FILE
// ========================================================

async function restoreFile(
    file
) {

    if (!file) {

        return false;

    }


    try {

        const text =
            await file.text();


        const data =
            JSON.parse(
                text
            );


        return restoreBackupObject(
            data
        );

    } catch (error) {

        console.error(
            "Restore Error:",
            error
        );


        alert(
            "❌ بیک اپ فائل درست JSON فائل نہیں ہے۔"
        );


        return false;

    }

}


// ========================================================
// PRINT RECEIPT
// ========================================================

function printReceipt(
    index
) {

    if (
        index < 0 ||
        index >= state.records.length
    ) {

        return;

    }


    const record =
        state.records[index];


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "پرنٹ ونڈو نہیں کھل سکی۔ براہ کرم browser میں popup اجازت دیں۔"
        );

        return;

    }


    const html = `

<!DOCTYPE html>

<html
    lang="ur"
    dir="rtl"
>

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        رسید نمبر ${escapeHTML(
            record.receiptNumber
        )}
    </title>


    <style>

        body {

            font-family:
                Arial,
                "Noto Nastaliq Urdu",
                sans-serif;

            margin: 0;

            padding: 30px;

            color: #222;

        }


        .receipt {

            max-width: 700px;

            margin: auto;

            border: 2px solid #222;

            border-radius: 12px;

            padding: 25px;

        }


        h1 {

            text-align: center;

            margin-top: 0;

        }


        .line {

            display: flex;

            justify-content:
                space-between;

            gap: 20px;

            border-bottom:
                1px solid #ddd;

            padding: 10px 0;

        }


        .label {

            font-weight: bold;

        }


        .photo {

            text-align: center;

            margin-top: 20px;

        }


        .photo img {

            max-width: 100%;

            max-height: 400px;

        }


        @media print {

            body {

                padding: 0;

            }


            .receipt {

                border:
                    1px solid #222;

            }

        }

    </style>

</head>


<body>


<div class="receipt">

    <h1>
        رسید محفوظ نظام
    </h1>


    <div class="line">

        <span class="label">
            مدرسہ
        </span>

        <span>
            ${escapeHTML(
                record.madarsa
            )}
        </span>

    </div>


    <div class="line">

        <span class="label">
            رسید نمبر
        </span>

        <span>
            ${escapeHTML(
                record.receiptNumber
            )}
        </span>

    </div>


    <div class="line">

        <span class="label">
            نام
        </span>

        <span>
            ${escapeHTML(
                record.donorName
            )}
        </span>

    </div>


    <div class="line">

        <span class="label">
            رقم
        </span>

        <span>
            ${escapeHTML(
                formatAmount(
                    record.amount
                )
            )}
        </span>

    </div>


    <div class="line">

        <span class="label">
            تاریخ
        </span>

        <span>
            ${escapeHTML(
                record.date
            )}
        </span>

    </div>


    <div class="line">

        <span class="label">
            موبائل
        </span>

        <span>
            ${escapeHTML(
                record.mobile
            )}
        </span>

    </div>


    <div class="line">

        <span class="label">
            جلد نمبر
        </span>

        <span>
            ${escapeHTML(
                record.jild
            )}
        </span>

    </div>


    <div class="line">

        <span class="label">
            صفحہ نمبر
        </span>

        <span>
            ${escapeHTML(
                record.safha
            )}
        </span>

    </div>


    <div class="line">

        <span class="label">
            چندہ کی مد
        </span>

        <span>
            ${escapeHTML(
                record.donationType
            )}
        </span>

    </div>


    <div class="line">

        <span class="label">
            پتہ
        </span>

        <span>
            ${escapeHTML(
                record.address
            )}
        </span>

    </div>


    ${
        record.photo
            ? `
                <div class="photo">

                    <img
                        src="${escapeHTML(
                            record.photo
                        )}"
                        alt="رسید"
                    >

                </div>
              `
            : ""
    }


</div>


<script>

    window.onload = function () {

        window.print();

    };

</script>


</body>

</html>

`;


    printWindow.document.open();

    printWindow.document.write(
        html
    );

    printWindow.document.close();


}


// ========================================================
// EXPORT PART 5
// ========================================================

app.createBackupData =
    createBackupData;


app.backupData =
    backupData;


app.restoreBackupObject =
    restoreBackupObject;


app.restoreFile =
    restoreFile;


app.printReceipt =
    printReceipt;


console.log(
    "✅ SCRIPT حصہ 5 تیار ہے۔"
);
// ============================================================
// SCRIPT.JS — حصہ 6 / 8
// Event Listeners + Application Initialization
// ============================================================


// ========================================================
// ATTACH EVENT LISTENERS
// ========================================================

function attachEventListeners() {


    // ------------------------------------------------
    // IMAGE SELECT
    // ------------------------------------------------

    if (elements.receiptPhoto) {

        elements.receiptPhoto.addEventListener(
            "change",
            handleImageChange
        );

    }


    // ------------------------------------------------
    // SCAN BUTTON
    // ------------------------------------------------

    if (elements.scanBtn) {

        elements.scanBtn.addEventListener(
            "click",
            handleScanClick
        );

    }


    // ------------------------------------------------
    // SAVE BUTTON
    // ------------------------------------------------

    if (elements.saveBtn) {

        elements.saveBtn.addEventListener(
            "click",
            function () {

                saveRecord();

            }
        );

    }


    // ------------------------------------------------
    // CLEAR BUTTON
    // ------------------------------------------------

    if (elements.clearBtn) {

        elements.clearBtn.addEventListener(
            "click",
            function () {

                clearForm();

            }
        );

    }


    // ------------------------------------------------
    // SEARCH
    // ------------------------------------------------

    if (elements.searchBox) {

        elements.searchBox.addEventListener(
            "input",
            function (event) {

                searchRecords(
                    event.target.value
                );

            }
        );

    }


    // ------------------------------------------------
    // RECEIPT NUMBER CHANGE
    // ------------------------------------------------

    if (elements.receiptNumber) {

        elements.receiptNumber.addEventListener(
            "input",
            function () {

                const record =
                    getFormData();


                const duplicate =
                    findDuplicate(
                        record
                    );


                if (duplicate) {

                    showDuplicateWarning(
                        duplicate
                    );

                } else {

                    hideDuplicateWarning();

                }

            }
        );

    }


    // ------------------------------------------------
    // AMOUNT INPUT
    // ------------------------------------------------

    if (elements.amount) {

        elements.amount.addEventListener(
            "input",
            function () {

                const value =
                    elements.amount.value;


                if (
                    value !== "" &&
                    Number(value) < 0
                ) {

                    elements.amount.value =
                        "0";

                }

            }
        );

    }

}


// ========================================================
// INITIALIZE APPLICATION
// ========================================================

function initializeApp() {

    console.log(
        "رسید محفوظ نظام: initialization شروع..."
    );


    // ------------------------------------------------
    // CACHE ELEMENTS
    // ------------------------------------------------

    cacheElements();


    // ------------------------------------------------
    // LOAD SAVED RECORDS
    // ------------------------------------------------

    loadRecordsFromStorage();


    // ------------------------------------------------
    // EVENT LISTENERS
    // ------------------------------------------------

    attachEventListeners();


    // ------------------------------------------------
    // INITIAL RECORD DISPLAY
    // ------------------------------------------------

    renderRecords();


    // ------------------------------------------------
    // INITIAL STATUS
    // ------------------------------------------------

    if (
        elements.ocrStatus &&
        !elements.ocrStatus.textContent.trim()
    ) {

        setOCRStatus(
            "ابھی رسید اسکین نہیں ہوئی۔"
        );

    }


    console.log(
        "✅ رسید محفوظ نظام تیار ہے۔"
    );


    console.log(
        "محفوظ رسیدوں کی تعداد:",
        state.records.length
    );

}


// ========================================================
// DOM READY
// ========================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();

}


// ========================================================
// GLOBAL API
// ========================================================

window.ReceiptSystem =
    window.ReceiptSystem || {};


window.ReceiptSystem.state =
    state;


window.ReceiptSystem.elements =
    elements;


window.ReceiptSystem.app =
    app;


window.ReceiptSystem.initialize =
    initializeApp;


window.ReceiptSystem.renderRecords =
    renderRecords;


window.ReceiptSystem.saveRecord =
    saveRecord;


window.ReceiptSystem.deleteRecord =
    deleteRecord;


window.ReceiptSystem.editRecord =
    editRecord;


window.ReceiptSystem.clearForm =
    clearForm;


window.ReceiptSystem.runOCR =
    runOCR;


window.ReceiptSystem.backupData =
    backupData;


window.ReceiptSystem.restoreFile =
    restoreFile;


window.ReceiptSystem.printReceipt =
    printReceipt;


console.log(
    "✅ SCRIPT حصہ 6 تیار ہے۔"
);
// ============================================================
// SCRIPT.JS — حصہ 7 / 8
// Utilities + Record Normalization + Formatting
// ============================================================


// ========================================================
// CREATE UNIQUE RECORD ID
// ========================================================

function createRecordId() {

    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );

}


// ========================================================
// CLEAN STRING
// ========================================================

function cleanString(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .trim();

}


// ========================================================
// NORMALIZE DIGITS
// Urdu / Arabic digits → English digits
// ========================================================

function normalizeDigits(value) {

    const text =
        cleanString(
            value
        );


    const map = {

        "۰": "0",
        "۱": "1",
        "۲": "2",
        "۳": "3",
        "۴": "4",
        "۵": "5",
        "۶": "6",
        "۷": "7",
        "۸": "8",
        "۹": "9",

        "٠": "0",
        "١": "1",
        "٢": "2",
        "٣": "3",
        "٤": "4",
        "٥": "5",
        "٦": "6",
        "٧": "7",
        "٨": "8",
        "٩": "9"

    };


    return text.replace(
        /[۰-۹٠-٩]/g,
        function (digit) {

            return map[digit] ||
                digit;

        }
    );

}


// ========================================================
// NORMALIZE TEXT
// ========================================================

function normalizeText(value) {

    return normalizeDigits(
        cleanString(
            value
        )
    )
        .replace(
            /\r/g,
            ""
        )
        .replace(
            /[ \t]+/g,
            " "
        )
        .replace(
            /\n{3,}/g,
            "\n\n"
        )
        .trim();

}


// ========================================================
// ESCAPE HTML
// ========================================================

function escapeHTML(value) {

    const text =
        cleanString(
            value
        );


    return text
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ========================================================
// FORMAT AMOUNT
// ========================================================

function formatAmount(value) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "0";

    }


    return number.toLocaleString(
        "en-IN"
    );

}


// ========================================================
// NORMALIZE RECORD
// ========================================================

function normalizeRecord(
    record
) {

    const item =
        record || {};


    return {

        id:
            item.id ||
            createRecordId(),


        madarsa:
            cleanString(
                item.madarsa ||
                item.madrasa ||
                ""
            ),


        jild:
            normalizeDigits(
                item.jild ||
                ""
            ),


        safha:
            normalizeDigits(
                item.safha ||
                ""
            ),


        receiptNumber:
            normalizeDigits(
                item.receiptNumber ||
                item.receipt ||
                ""
            ),


        date:
            cleanString(
                item.date ||
                ""
            ),


        donorName:
            cleanString(
                item.donorName ||
                item.name ||
                ""
            ),


        mobile:
            normalizeDigits(
                item.mobile ||
                ""
            ),


        address:
            cleanString(
                item.address ||
                ""
            ),


        donationType:
            cleanString(
                item.donationType ||
                item.type ||
                ""
            ),


        amount:
            Number(
                item.amount ||
                0
            ),


        photo:
            item.photo ||
            ""

    };

}


// ========================================================
// NORMALIZE ALL RECORDS
// ========================================================

function normalizeAllRecords() {

    state.records =
        Array.isArray(
            state.records
        )

            ? state.records.map(
                normalizeRecord
            )

            : [];

}


// ========================================================
// GET TOTAL AMOUNT
// ========================================================

function getTotalAmount() {

    return state.records.reduce(
        function (
            total,
            record
        ) {

            const amount =
                Number(
                    record.amount
                );


            return total +
                (
                    Number.isFinite(
                        amount
                    )
                        ? amount
                        : 0
                );

        },
        0
    );

}


// ========================================================
// GET RECORD COUNT
// ========================================================

function getRecordCount() {

    return Array.isArray(
        state.records
    )
        ? state.records.length
        : 0;

}


// ========================================================
// SET OCR STATUS
// ========================================================

function setOCRStatus(
    message
) {

    if (
        !elements.ocrStatus
    ) {

        return;

    }


    elements.ocrStatus.textContent =
        cleanString(
            message
        );

}


// ========================================================
// SAFE JSON PARSE
// ========================================================

function safeJSONParse(
    value,
    fallback
) {

    try {

        return JSON.parse(
            value
        );

    } catch (error) {

        console.warn(
            "JSON Parse Error:",
            error
        );


        return fallback;

    }

}


// ========================================================
// EXPORT UTILITIES TO APP
// ========================================================

app.createRecordId =
    createRecordId;


app.cleanString =
    cleanString;


app.normalizeDigits =
    normalizeDigits;


app.normalizeText =
    normalizeText;


app.escapeHTML =
    escapeHTML;


app.formatAmount =
    formatAmount;


app.normalizeRecord =
    normalizeRecord;


app.normalizeAllRecords =
    normalizeAllRecords;


app.getTotalAmount =
    getTotalAmount;


app.getRecordCount =
    getRecordCount;


app.setOCRStatus =
    setOCRStatus;


app.safeJSONParse =
    safeJSONParse;


console.log(
    "✅ SCRIPT حصہ 7 تیار ہے۔"
);
  // ============================================================
// SCRIPT.JS — حصہ 8 / 8
// Final Setup + Legacy Data + Global API + Close
// ============================================================


// ========================================================
// LOAD LEGACY "receipts" DATA IF NEEDED
// ========================================================

function migrateOldReceiptsIfNeeded() {

    try {

        const current =
            localStorage.getItem(
                STORAGE_KEY
            );


        // اگر نیا storage پہلے ہی موجود ہے
        // تو پرانے data کو نہ چھیڑیں
        if (current) {

            return;

        }


        const old =
            localStorage.getItem(
                "receipts"
            );


        if (!old) {

            return;

        }


        const parsed =
            JSON.parse(
                old
            );


        if (
            Array.isArray(
                parsed
            )
        ) {

            state.records =
                parsed.map(
                    normalizeRecord
                );


            saveRecordsToStorage();


            console.log(
                "✅ پرانا receipts data نئے storage میں منتقل ہوگیا۔"
            );

        }

    } catch (error) {

        console.error(
            "Legacy Data Migration Error:",
            error
        );

    }

}


// ========================================================
// FINAL APPLICATION SETUP
// ========================================================

function finalSetup() {

    console.log(
        "رسید محفوظ نظام: Final Setup شروع..."
    );


    // ------------------------------------------------
    // پرانا data دیکھیں
    // ------------------------------------------------

    migrateOldReceiptsIfNeeded();


    // ------------------------------------------------
    // موجودہ data دوبارہ load کریں
    // ------------------------------------------------

    loadRecordsFromStorage();


    // ------------------------------------------------
    // records کو standard format دیں
    // ------------------------------------------------

    normalizeAllRecords();


    // ------------------------------------------------
    // standard format storage میں محفوظ کریں
    // ------------------------------------------------

    saveRecordsToStorage();


    // ------------------------------------------------
    // records دوبارہ دکھائیں
    // ------------------------------------------------

    renderRecords();


    // ------------------------------------------------
    // Global state
    // ------------------------------------------------

    window.ReceiptSystem =
        window.ReceiptSystem || {};


    window.ReceiptSystem.state =
        state;


    window.ReceiptSystem.elements =
        elements;


    window.ReceiptSystem.app =
        app;


    // ------------------------------------------------
    // اہم functions
    // ------------------------------------------------

    window.ReceiptSystem.save =
        saveRecord;


    window.ReceiptSystem.load =
        loadRecordsFromStorage;


    window.ReceiptSystem.render =
        renderRecords;


    window.ReceiptSystem.search =
        searchRecords;


    window.ReceiptSystem.edit =
        editRecord;


    window.ReceiptSystem.delete =
        deleteRecord;


    window.ReceiptSystem.clear =
        clearForm;


    window.ReceiptSystem.scan =
        runOCR;


    window.ReceiptSystem.backup =
        backupData;


    window.ReceiptSystem.restore =
        restoreFile;


    window.ReceiptSystem.print =
        printReceipt;


    console.log(
        "===================================="
    );


    console.log(
        "✅ رسید محفوظ نظام مکمل طور پر تیار ہے۔"
    );


    console.log(
        "محفوظ رسیدیں:",
        state.records.length
    );


    console.log(
        "کل رقم:",
        getTotalAmount()
    );


    console.log(
        "===================================="
    );

}


// ========================================================
// EXPORT LEGACY MIGRATION
// ========================================================

app.migrateOldReceiptsIfNeeded =
    migrateOldReceiptsIfNeeded;


app.finalSetup =
    finalSetup;


// ========================================================
// FINAL GLOBAL OBJECT
// ========================================================

window.ReceiptSystem =
    window.ReceiptSystem || {};


window.ReceiptSystem.state =
    state;


window.ReceiptSystem.elements =
    elements;


window.ReceiptSystem.app =
    app;


// ========================================================
// RUN FINAL SETUP
// ========================================================

finalSetup();


// ============================================================
// SCRIPT.JS COMPLETE
// ============================================================

console.log(
    "🎉 SCRIPT.JS — تمام 8 حصے مکمل ہوگئے۔"
);



})();
