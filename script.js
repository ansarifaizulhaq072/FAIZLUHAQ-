"use strict";

/* =========================================================
   مدرسہ مینجمنٹ سسٹم
   Login → مدرسہ → شعبے → Donation
   Firebase + LocalStorage
   ========================================================= */


/* =========================================================
   Helper
   ========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   Storage / Firebase
   ========================================================= */

const STORAGE_KEY = "madrasa_v1_records";
const OLD_STORAGE_KEY = "receipts";
const FIREBASE_COLLECTION = "receipts";


/*
  IMPORTANT:
  db پہلے ہی index.html میں بنایا گیا ہے۔

  index.html میں:
  const db = firebase.firestore();

  موجود ہے۔
*/


let records = [];


/* =========================================================
   موجودہ مدرسہ
   ========================================================= */

let currentMadarsa = "دارالعلوم میوانوادہ";


/* =========================================================
   ID بنانا
   ========================================================= */

function createId() {

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );

}


/* =========================================================
   پرانا LocalStorage Data Load
   ========================================================= */

function loadLocalRecords() {

  let newRecords = [];
  let oldRecords = [];


  /* -------------------------------------------------------
     نیا Storage
     ------------------------------------------------------- */

  try {

    newRecords =
      JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

    if (!Array.isArray(newRecords)) {

      newRecords = [];

    }

  }

  catch (error) {

    console.error(
      "نیا LocalStorage Data پڑھنے میں مسئلہ:",
      error
    );

    newRecords = [];

  }



  /* -------------------------------------------------------
     پرانا Storage
     ------------------------------------------------------- */

  try {

    oldRecords =
      JSON.parse(
        localStorage.getItem(OLD_STORAGE_KEY) || "[]"
      );

    if (!Array.isArray(oldRecords)) {

      oldRecords = [];

    }

  }

  catch (error) {

    console.error(
      "پرانا LocalStorage Data پڑھنے میں مسئلہ:",
      error
    );

    oldRecords = [];

  }



  /* -------------------------------------------------------
     پرانے records کو نئے format میں تبدیل کریں
     ------------------------------------------------------- */

  const migratedOldRecords =
    oldRecords.map(
      (old, index) => {

        return {

          id:
            old.id ||
            `old-${Date.now()}-${index}`,

          madrasa:
            old.madrasa ||
            old.madarsa ||
            "دارالعلوم میوانوادہ",

          volume:
            Number(
              old.volume ??
              old.jild ??
              0
            ),

          page:
            Number(
              old.page ??
              old.safha ??
              0
            ),

          no:
            Number(
              old.no ??
              old.receipt ??
              0
            ),

          date:
            old.date ||
            "",

          name:
            old.name ||
            "",

          mobile:
            old.mobile ||
            "",

          address:
            old.address ||
            "",

          amount:
            Number(
              old.amount ||
              0
            ),

          type:
            old.type ||
            "عام چندہ",

          photo:
            old.photo ||
            old.image ||
            ""

        };

      }
    );



  /* -------------------------------------------------------
     نیا + پرانا LocalStorage Data ملائیں
     ------------------------------------------------------- */

  const combined = [
    ...newRecords
  ];


  migratedOldRecords.forEach(
    (oldRecord) => {

      const exists =
        combined.some(
          (record) => {

            return (

              String(
                record.madrasa || ""
              ) ===
              String(
                oldRecord.madrasa || ""
              )

              &&

              Number(
                record.volume || 0
              ) ===
              Number(
                oldRecord.volume || 0
              )

              &&

              Number(
                record.no || 0
              ) ===
              Number(
                oldRecord.no || 0
              )

            );

          }
        );


      if (!exists) {

        combined.push(oldRecord);

      }

    }
  );


  records = combined;


  /* -------------------------------------------------------
     LocalStorage backup
     ------------------------------------------------------- */

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );

  }

  catch (error) {

    console.error(
      "LocalStorage save error:",
      error
    );

  }


  console.log(
    "LocalStorage سے records:",
    records.length
  );


  return records;

}


/* =========================================================
   Firebase سے Records Load
   ========================================================= */

async function loadFirebaseRecords() {

  try {

    console.log(
      "Firebase سے رسیدیں تلاش کی جا رہی ہیں..."
    );


    const snapshot =
      await db
        .collection(FIREBASE_COLLECTION)
        .get();


    const firebaseRecords = [];


    snapshot.forEach(
      (doc) => {

        const data =
          doc.data();


        const record = {

          id:
            doc.id,

          madrasa:
            data.madrasa ||
            data.madarsa ||
            "دارالعلوم میوانوادہ",

          volume:
            Number(
              data.volume ??
              data.jild ??
              0
            ),

          page:
            Number(
              data.page ??
              data.safha ??
              0
            ),

          no:
            Number(
              data.no ??
              data.receipt ??
              0
            ),

          date:
            data.date ||
            "",

          name:
            data.name ||
            "",

          mobile:
            data.mobile ||
            "",

          address:
            data.address ||
            "",

          amount:
            Number(
              data.amount ||
              0
            ),

          type:
            data.type ||
            "عام چندہ",

          photo:
            data.photo ||
            data.image ||
            ""

        };


        firebaseRecords.push(record);

      }
    );


    console.log(
      "Firebase سے کل رسیدیں:",
      firebaseRecords.length
    );


    /* -------------------------------------------------------
       Firebase records کو Local records کے ساتھ ملائیں
       ------------------------------------------------------- */

    firebaseRecords.forEach(
      (firebaseRecord) => {

        const exists =
          records.some(
            (record) => {

              return (

                String(
                  record.madrasa || ""
                ) ===
                String(
                  firebaseRecord.madrasa || ""
                )

                &&

                Number(
                  record.volume || 0
                ) ===
                Number(
                  firebaseRecord.volume || 0
                )

                &&

                Number(
                  record.no || 0
                ) ===
                Number(
                  firebaseRecord.no || 0
                )

              );

            }
          );


        if (!exists) {

          records.push(
            firebaseRecord
          );

        }

      }
    );


    /* -------------------------------------------------------
       Local backup update
       ------------------------------------------------------- */

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );


    console.log(
      "Firebase Data records میں شامل ہوگیا:",
      records.length
    );


    /*
      Donation screen اگر کھلی ہوئی ہے
      تو فوراً دوبارہ دکھائیں
    */

    if (
      typeof render === "function"
    ) {

      render();

    }


  }

  catch (error) {

    console.error(
      "Firebase data load error:",
      error
    );


    console.error(
      "Firebase error code:",
      error.code
    );


    console.error(
      "Firebase error message:",
      error.message
    );

  }

}


/* =========================================================
   پہلے Local Data Load
   ========================================================= */

loadLocalRecords();


/* =========================================================
   پھر Firebase Data Load
   ========================================================= */

loadFirebaseRecords();


/* =========================================================
   Screen System
   ========================================================= */

function showScreen(screenId) {

  const screens = [

    "loginScreen",

    "schoolScreen",

    "mainScreen",

    "donationScreen"

  ];


  screens.forEach(
    (id) => {

      const element =
        $(id);


      if (element) {

        element.classList.add(
          "hidden"
        );

      }

    }
  );


  const target =
    $(screenId);


  if (target) {

    target.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   Login Mode
   ========================================================= */

let loginMode = "email";


document
  .querySelectorAll(".tab")
  .forEach(
    (tab) => {

      tab.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".tab")
            .forEach(
              (item) => {

                item.classList.remove(
                  "active"
                );

              }
            );


          tab.classList.add(
            "active"
          );


          loginMode =
            tab.dataset.login;


          [
            "emailFields",
            "madarsaFields",
            "phoneFields"

          ].forEach(
            (id) => {

              $(id)
                .classList
                .add("hidden");

            }
          );


          const fields =
            $(
              `${loginMode}Fields`
            );


          if (fields) {

            fields.classList.remove(
              "hidden"
            );

          }


          $("loginMsg")
            .textContent = "";

        }
      );

    }
  );


/* =========================================================
   Login
   ========================================================= */

$("loginForm").addEventListener(
  "submit",
  (event) => {

    event.preventDefault();


    $("loginMsg")
      .textContent = "";


    /* -------------------------------------------------------
       Email
       ------------------------------------------------------- */

    if (
      loginMode === "email"
    ) {

      const email =
        $("email")
          .value
          .trim();


      const password =
        $("password")
          .value
          .trim();


      if (!email) {

        $("loginMsg")
          .textContent =
          "ای میل درج کریں";

        return;

      }


      if (!password) {

        $("loginMsg")
          .textContent =
          "پاس ورڈ درج کریں";

        return;

      }

    }


    /* -------------------------------------------------------
       Madrasa ID
       ------------------------------------------------------- */

    if (
      loginMode === "madarsa"
    ) {

      const id =
        $("madarsaId")
          .value
          .trim();


      const password =
        $("madarsaPassword")
          .value
          .trim();


      if (!id) {

        $("loginMsg")
          .textContent =
          "مدرسہ ID درج کریں";

        return;

      }


      if (!password) {

        $("loginMsg")
          .textContent =
          "پاس ورڈ درج کریں";

        return;

      }


      currentMadarsa =
        id;

    }


    /* -------------------------------------------------------
       Phone OTP
       ------------------------------------------------------- */

    if (
      loginMode === "phone"
    ) {

      const phone =
        $("phone")
          .value
          .trim();


      const otp =
        $("otp")
          .value
          .trim();


      if (!phone) {

        $("loginMsg")
          .textContent =
          "موبائل نمبر درج کریں";

        return;

      }


      if (!otp) {

        $("loginMsg")
          .textContent =
          "OTP درج کریں";

        return;

      }


      if (
        otp.length !== 6
      ) {

        $("loginMsg")
          .textContent =
          "OTP چھ ہندسوں کا ہونا چاہیے";

        return;

      }

    }


    /* Login کے بعد مدرسہ */

    openSchoolScreen();

  }
);


/* =========================================================
   OTP
   ========================================================= */

$("sendOtp").addEventListener(
  "click",
  () => {

    const phone =
      $("phone")
        .value
        .trim();


    if (!phone) {

      $("loginMsg")
        .textContent =
        "پہلے موبائل نمبر درج کریں";

      return;

    }


    $("otpWrap")
      .classList
      .remove("hidden");


    $("loginMsg")
      .textContent =
      "OTP بھیج دیا گیا ہے۔ اصل Firebase OTP اگلے مرحلے میں لگے گا۔";

  }
);


/* =========================================================
   مدرسہ Screen
   ========================================================= */

function openSchoolScreen() {

  $("schoolName")
    .textContent =
    currentMadarsa;


  showScreen(
    "schoolScreen"
  );

}


/* =========================================================
   مدرسہ کھولیں
   ========================================================= */

$("openMadarsa").addEventListener(
  "click",
  () => {

    $("mainSchoolName")
      .textContent =
      currentMadarsa;


    showScreen(
      "mainScreen"
    );

  }
);


/* =========================================================
   Main → Donation
   ========================================================= */

$("donationBtn").addEventListener(
  "click",
  () => {

    $("donationSchoolName")
      .textContent =
      currentMadarsa;


    render();


    showScreen(
      "donationScreen"
    );

  }
);


/* =========================================================
   Main Back
   ========================================================= */

$("mainBack").addEventListener(
  "click",
  () => {

    openSchoolScreen();

  }
);


/* =========================================================
   Donation Back
   ========================================================= */

$("donationBack").addEventListener(
  "click",
  () => {

    showScreen(
      "mainScreen"
    );

  }
);


/* =========================================================
   Logout
   ========================================================= */

$("schoolLogout").addEventListener(
  "click",
  logout
);


function logout() {

  currentMadarsa =
    "دارالعلوم میوانوادہ";


  $("loginForm")
    .reset();


  $("otpWrap")
    .classList
    .add("hidden");


  $("loginMsg")
    .textContent = "";


  showScreen(
    "loginScreen"
  );

}
/* =========================================================
   نئی رسید
   ========================================================= */

$("newReceipt").addEventListener(
  "click",
  () => {

    $("receiptForm").reset();

    $("rMadarsa").value =
      currentMadarsa;

    $("rDate").value =
      new Date()
        .toISOString()
        .slice(0, 10);

    $("photoPreview").style.display =
      "none";

    $("photoPreviewImg").src =
      "";

    $("ocrStatus").textContent =
      "";

    $("receiptDialog").showModal();

  }
);


/* =========================================================
   Dialog بند
   ========================================================= */

$("closeDialog").addEventListener(
  "click",
  () => {

    $("receiptDialog").close();

  }
);


/* =========================================================
   Receipt Photo Preview
   ========================================================= */

$("receiptPhoto").addEventListener(
  "change",
  () => {

    const file =
      $("receiptPhoto").files[ 0 ];

    if (!file) {

      $("photoPreview").style.display =
        "none";

      $("photoPreviewImg").src =
        "";

      return;

    }


    const reader =
      new FileReader();


    reader.onload =
      (event) => {

        $("photoPreviewImg").src =
          event.target.result;

        $("photoPreview").style.display =
          "block";

      };


    reader.readAsDataURL(file);

  }
);


/* =========================================================
   نئی رسید Firebase + LocalStorage میں Save
   ========================================================= */

$("receiptForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const volume =
      Number(
        $("rVolume").value
      );


    const page =
      Number(
        $("rPage").value
      ) || 0;


    const receiptNo =
      Number(
        $("rNo").value
      );


    const date =
      $("rDate").value;


    const name =
      $("rName")
        .value
        .trim();


    const mobile =
      $("rMobile")
        .value
        .trim();


    const amount =
      Number(
        $("rAmount").value
      );


    const type =
      $("rType").value;


    /* -------------------------------------------------------
       Validation
       ------------------------------------------------------- */

    if (!volume) {

      alert(
        "جلد نمبر درج کریں"
      );

      return;

    }


    if (!receiptNo) {

      alert(
        "رسید نمبر درج کریں"
      );

      return;

    }


    if (!name) {

      alert(
        "نام درج کریں"
      );

      return;

    }


    if (!date) {

      alert(
        "تاریخ منتخب کریں"
      );

      return;

    }


    if (
      !amount ||
      amount <= 0
    ) {

      alert(
        "صحیح رقم درج کریں"
      );

      return;

    }


    /* -------------------------------------------------------
       Duplicate Check
       جلد + رسید نمبر
       ------------------------------------------------------- */

    const localDuplicate =
      records.some(
        (record) => {

          return (

            String(
              record.madrasa || ""
            ) ===
            String(
              currentMadarsa || ""
            )

            &&

            Number(
              record.volume || 0
            ) ===
            volume

            &&

            Number(
              record.no || 0
            ) ===
            receiptNo

          );

        }
      );


    if (localDuplicate) {

      alert(
        `مدرسہ ${currentMadarsa} میں جلد نمبر ${volume} کی رسید نمبر ${receiptNo} پہلے سے موجود ہے۔`
      );

      return;

    }


    /* -------------------------------------------------------
       Firebase میں بھی Duplicate Check
       ------------------------------------------------------- */

    try {

      const duplicateSnapshot =
        await db
          .collection(
            FIREBASE_COLLECTION
          )
          .where(
            "madrasa",
            "==",
            currentMadarsa
          )
          .where(
            "volume",
            "==",
            volume
          )
          .where(
            "no",
            "==",
            receiptNo
          )
          .limit(1)
          .get();


      if (
        !duplicateSnapshot.empty
      ) {

        alert(
          `جلد نمبر ${volume} میں رسید نمبر ${receiptNo} Firebase میں پہلے سے موجود ہے۔`
        );

        return;

      }


    }

    catch (error) {

      console.error(
        "Firebase duplicate check error:",
        error
      );


      alert(
        "Firebase سے رابطہ نہیں ہو سکا۔ رسید محفوظ نہیں کی گئی۔"
      );

      return;

    }


    /* -------------------------------------------------------
       تصویر
       ------------------------------------------------------- */

    let photo = "";


    const photoFile =
      $("receiptPhoto")
        .files[ 0 ];


    if (photoFile) {

      try {

        photo =
          await fileToDataURL(
            photoFile
          );

      }

      catch (error) {

        console.error(
          "Photo conversion error:",
          error
        );

      }

    }


    /* -------------------------------------------------------
       Record
       ------------------------------------------------------- */

    const record = {

      madrasa:
        currentMadarsa,

      volume:
        volume,

      page:
        page,

      no:
        receiptNo,

      date:
        date,

      name:
        name,

      mobile:
        mobile,

      amount:
        amount,

      type:
        type,

      photo:
        photo,

      createdAt:
        new Date()
          .toISOString()

    };


    /* -------------------------------------------------------
       Save Firebase
       ------------------------------------------------------- */

    try {

      const docRef =
        await db
          .collection(
            FIREBASE_COLLECTION
          )
          .add(
            record
          );


      /* Firebase ID */

      record.id =
        docRef.id;


      /* -----------------------------------------------------
         Local records
         ----------------------------------------------------- */

      records.unshift(
        record
      );


      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records)
      );


      /* -----------------------------------------------------
         Form Reset
         ----------------------------------------------------- */

      $("receiptDialog")
        .close();


      $("receiptForm")
        .reset();


      $("photoPreview")
        .style
        .display =
        "none";


      $("photoPreviewImg")
        .src =
        "";


      $("ocrStatus")
        .textContent =
        "";


      /* -----------------------------------------------------
         Screen Update
         ----------------------------------------------------- */

      render();


      alert(
        "رسید کامیابی سے محفوظ ہو گئی۔"
      );


      console.log(
        "Firebase میں رسید محفوظ:",
        docRef.id
      );


    }

    catch (error) {

      console.error(
        "Firebase Save Error:",
        error
      );


      alert(
        "رسید محفوظ نہیں ہو سکی۔ Firebase کا Error Console میں دیکھیں۔"
      );

    }

  }
);


/* =========================================================
   File → Data URL
   ========================================================= */

function fileToDataURL(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () => {

          resolve(
            reader.result
          );

        };


      reader.onerror =
        () => {

          reject(
            reader.error
          );

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================================================
   LocalStorage Backup Save
   ========================================================= */

function saveRecords() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );

  }

  catch (error) {

    console.error(
      "LocalStorage Save Error:",
      error
    );

  }

}


/* =========================================================
   Money Format
   ========================================================= */

function money(amount) {

  return (
    "₹" +
    Number(
      amount || 0
    )
      .toLocaleString(
        "en-IN"
      )
  );

}


/* =========================================================
   Search
   ========================================================= */

$("search").addEventListener(
  "input",
  render
);


/* =========================================================
   Volume Filter
   ========================================================= */

$("volumeFilter").addEventListener(
  "change",
  render
);
/* =========================================================
   Money + Search کے بعد باقی Donation System
   ========================================================= */


/* =========================================================
   Main Donation Render
   ========================================================= */

function render() {

  const search =
    $("search")
      .value
      .trim()
      .toLowerCase();


  const selectedVolume =
    $("volumeFilter").value;


  /* -------------------------------------------------------
     موجودہ مدرسے کا Data
     ------------------------------------------------------- */

  const madarsaRecords =
    records.filter(
      (record) =>
        String(
          record.madrasa || ""
        ) ===
        String(
          currentMadarsa || ""
        )
    );


  /* -------------------------------------------------------
     Search + Volume Filter
     ------------------------------------------------------- */

  const filtered =
    madarsaRecords.filter(
      (record) => {

        const receiptNumber =
          String(
            record.no || ""
          )
            .toLowerCase();


        const recordName =
          String(
            record.name || ""
          )
            .toLowerCase();


        const matchesSearch =
          !search ||
          receiptNumber.includes(
            search
          ) ||
          recordName.includes(
            search
          );


        const matchesVolume =
          !selectedVolume ||
          String(
            record.volume || ""
          ) ===
          String(
            selectedVolume
          );


        return (
          matchesSearch &&
          matchesVolume
        );

      }
    );


  /* -------------------------------------------------------
     Total Donation
     ------------------------------------------------------- */

  const total =
    madarsaRecords.reduce(
      (sum, record) => {

        return (
          sum +
          Number(
            record.amount || 0
          )
        );

      },
      0
    );


  $("donationTotal")
    .textContent =
    money(total);


  /* -------------------------------------------------------
     Total Receipts
     ------------------------------------------------------- */

  $("totalReceipts")
    .textContent =
    madarsaRecords.length;


  /* -------------------------------------------------------
     Total Volumes
     ------------------------------------------------------- */

  const volumes =
    [
      ...new Set(

        madarsaRecords.map(
          (record) =>
            Number(
              record.volume || 0
            )
        )

      )
    ]
      .filter(
        (volume) =>
          volume > 0
      )
      .sort(
        (a, b) =>
          a - b
      );


  $("totalVolumes")
    .textContent =
    volumes.length;


  /* -------------------------------------------------------
     Volume Filter
     ------------------------------------------------------- */

  updateVolumeFilter(
    volumes,
    selectedVolume
  );


  /* -------------------------------------------------------
     Volume Register
     ------------------------------------------------------- */

  renderVolumes(
    volumes
  );


  /* -------------------------------------------------------
     Receipt List
     ------------------------------------------------------- */

  renderReceipts(
    filtered
  );

}


/* =========================================================
   Volume Filter Options
   ========================================================= */

function updateVolumeFilter(
  volumes,
  selectedVolume
) {

  const select =
    $("volumeFilter");


  select.innerHTML =
    `<option value="">
      تمام جلدیں
    </option>`;


  volumes.forEach(
    (volume) => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        String(
          volume
        );


      option.textContent =
        `جلد نمبر ${volume}`;


      if (
        String(volume) ===
        String(selectedVolume)
      ) {

        option.selected =
          true;

      }


      select.appendChild(
        option
      );

    }
  );

}


/* =========================================================
   جلد وار رجسٹر
   ========================================================= */

function renderVolumes(
  volumes
) {

  const container =
    $("volumeList");


  if (
    !volumes.length
  ) {

    container.innerHTML =
      `
      <p class="demo-note">
        ابھی کوئی جلد موجود نہیں۔
      </p>
      `;

    return;

  }


  container.innerHTML =
    "";


  volumes.forEach(
    (volume) => {

      const volumeRecords =
        records.filter(
          (record) => {

            return (

              String(
                record.madrasa || ""
              ) ===
              String(
                currentMadarsa || ""
              )

              &&

              Number(
                record.volume || 0
              ) ===
              Number(
                volume
              )

            );

          }
        );


      const total =
        volumeRecords.reduce(
          (sum, record) => {

            return (
              sum +
              Number(
                record.amount || 0
              )
            );

          },
          0
        );


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "volume";


      card.innerHTML =
        `
        <strong>
          جلد نمبر ${escapeHTML(volume)}
        </strong>

        <small>
          ${volumeRecords.length}
          رسیدیں
          ·
          ${money(total)}
        </small>

        <span>
          کھولیں →
        </span>
        `;


      card.addEventListener(
        "click",
        () => {

          $("volumeFilter")
            .value =
            String(
              volume
            );


          render();

        }
      );


      container.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   Receipt List
   ========================================================= */

function renderReceipts(
  list
) {

  const container =
    $("receiptList");


  if (
    !list.length
  ) {

    container.innerHTML =
      `
      <p class="demo-note">
        کوئی رسید نہیں ملی۔
      </p>
      `;

    return;

  }


  container.innerHTML =
    "";


  list.forEach(
    (record) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "receipt";


      item.innerHTML =
        `

        <div class="no">

          #${escapeHTML(
          record.no
        )}

          <small>
            جلد
            ${escapeHTML(
          record.volume
        )}
          </small>

        </div>


        <div class="receipt-info">

          <b>
            ${escapeHTML(
          record.name
        )}
          </b>

          <small>
            ${escapeHTML(
          record.date || ""
        )}

            ·

            ${escapeHTML(
          record.type ||
          "عام چندہ"
        )}
          </small>

        </div>


        <div class="amount">

          ${money(
          record.amount
        )}

        </div>

        `;


      /* -----------------------------------------------------
         Receipt Click
         ----------------------------------------------------- */

      item.addEventListener(
        "click",
        () => {

          showReceiptDetails(
            record
          );

        }
      );


      container.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   Receipt Details
   ========================================================= */

function showReceiptDetails(
  record
) {

  const photo =
    record.photo || "";


  let message =
    "رسید نمبر: " +
    record.no;


  message +=
    "\nنام: " +
    (
      record.name ||
      ""
    );


  message +=
    "\nرقم: " +
    money(
      record.amount
    );


  message +=
    "\nتاریخ: " +
    (
      record.date ||
      ""
    );


  message +=
    "\nجلد نمبر: " +
    (
      record.volume ||
      ""
    );


  message +=
    "\nصفحہ نمبر: " +
    (
      record.page ||
      ""
    );


  message +=
    "\nقسم: " +
    (
      record.type ||
      ""
    );


  if (
    record.mobile
  ) {

    message +=
      "\nموبائل: " +
      record.mobile;

  }


  if (
    photo
  ) {

    const viewer =
      document.createElement(
        "div"
      );


    viewer.style.cssText =
      `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.75);
      z-index:9999;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      padding:20px;
      `;


    viewer.innerHTML =
      `

      <div
        style="
          background:white;
          border-radius:18px;
          padding:18px;
          width:min(95%,500px);
          max-height:90vh;
          overflow:auto;
        "
      >

        <h2>
          رسید نمبر
          ${escapeHTML(
        record.no
      )}
        </h2>

        <p>
          <b>نام:</b>
          ${escapeHTML(
        record.name
      )}
        </p>

        <p>
          <b>رقم:</b>
          ${money(
        record.amount
      )}
        </p>

        <img
          src="${photo}"
          alt="رسید"
          style="
            width:100%;
            max-height:60vh;
            object-fit:contain;
            border-radius:12px;
            margin-top:10px;
          "
        >

        <button
          id="closeReceiptViewer"
          class="primary wide"
          style="margin-top:15px"
        >
          بند کریں
        </button>

      </div>

      `;


    document.body.appendChild(
      viewer
    );


    viewer
      .querySelector(
        "#closeReceiptViewer"
      )
      .addEventListener(
        "click",
        () => {

          viewer.remove();

        }
      );


  } else {

    alert(
      message
    );

  }

}


/* =========================================================
   Security
   ========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /[&<>"']/g,
      (character) => {

        const entities = {

          "&":
            "&amp;",

          "<":
            "&lt;",

          ">":
            "&gt;",

          '"':
            "&quot;",

          "'":
            "&#039;"

        };


        return (
          entities[
          character
          ] ||
          character
        );

      }
    );

}
/* =========================================================
   آغاز
   ========================================================= */

/*
   Firebase سے Data آنے کے بعد render خود ہو جائے گا۔
   پہلے خالی/Local Data دکھا دیں۔
*/

try {
  render();
} catch (error) {
  console.error(
    "Initial render error:",
    error
  );
}


/* =========================================================
   Firebase سے پرانی رسیدیں Load
   ========================================================= */

async function loadFirebaseRecords() {

  try {

    console.log(
      "Firebase سے رسیدیں لوڈ ہو رہی ہیں..."
    );


    const snapshot =
      await db
        .collection(
          FIREBASE_COLLECTION
        )
        .get();


    const firebaseRecords = [];


    snapshot.forEach(
      (doc) => {

        const data =
          doc.data();


        firebaseRecords.push({

          id:
            doc.id,

          madrasa:
            data.madrasa ||
            data.madarsa ||
            "دارالعلوم میوانوادہ",

          volume:
            Number(
              data.volume ??
              data.jild ??
              0
            ),

          page:
            Number(
              data.page ??
              data.safha ??
              0
            ),

          no:
            Number(
              data.no ??
              data.receipt ??
              0
            ),

          date:
            data.date ||
            "",

          name:
            data.name ||
            "",

          mobile:
            data.mobile ||
            "",

          address:
            data.address ||
            "",

          amount:
            Number(
              data.amount ||
              0
            ),

          type:
            data.type ||
            "عام چندہ",

          photo:
            data.photo ||
            data.image ||
            "",

          createdAt:
            data.createdAt ||
            ""

        });

      }
    );


    /* -------------------------------------------------------
       Firebase Data کو موجودہ records کے ساتھ ملائیں
       ------------------------------------------------------- */

    firebaseRecords.forEach(
      (firebaseRecord) => {

        const exists =
          records.some(
            (record) => {

              /* اگر Firebase ID موجود ہے */

              if (
                record.id &&
                record.id ===
                firebaseRecord.id
              ) {

                return true;

              }


              /* پرانے Data کے لیے
                 مدرسہ + جلد + رسید نمبر */

              return (

                String(
                  record.madrasa ||
                  ""
                ) ===
                String(
                  firebaseRecord.madrasa ||
                  ""
                )

                &&

                Number(
                  record.volume ||
                  0
                ) ===
                Number(
                  firebaseRecord.volume ||
                  0
                )

                &&

                Number(
                  record.no ||
                  0
                ) ===
                Number(
                  firebaseRecord.no ||
                  0
                )

              );

            }
          );


        if (
          !exists
        ) {

          records.push(
            firebaseRecord
          );

        }

      }
    );


    /* -------------------------------------------------------
       Local Backup
       ------------------------------------------------------- */

    saveRecords();


    console.log(
      "Firebase سے رسیدیں:",
      firebaseRecords.length
    );


    /* -------------------------------------------------------
       موجودہ Screen دوبارہ Render
       ------------------------------------------------------- */

    try {

      render();

    }

    catch (renderError) {

      console.error(
        "Render error:",
        renderError
      );

    }


  }

  catch (error) {

    console.error(
      "Firebase Load Error:",
      error
    );


    /*
       Firebase نہ چلے تو LocalStorage کا
       Data پھر بھی کام کرتا رہے گا۔
    */

    try {

      render();

    }

    catch (renderError) {

      console.error(
        "Local render error:",
        renderError
      );

    }

  }

}


/* =========================================================
   Firebase Load شروع
   ========================================================= */

loadFirebaseRecords();


/* =========================================================
   آخری Screen
   ========================================================= */

showScreen(
  "loginScreen"
);
