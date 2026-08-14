// ============================================================
// RECEIPTS COMPATIBILITY FIX
// پرانی receipts کو نئے ReceiptSystem format میں sync کرتا ہے
// ============================================================

(function () {

    "use strict";

    console.log("🔧 Receipts Compatibility Fix شروع ہو رہا ہے۔");


    // --------------------------------------------------------
    // پرانا data حاصل کریں
    // --------------------------------------------------------

    let oldRecords = [];

    try {

        oldRecords =
            JSON.parse(
                localStorage.getItem("receipts") || "[]"
            );

    } catch (error) {

        console.error(
            "❌ پرانی receipts پڑھنے میں خرابی:",
            error
        );

        return;

    }


    if (!Array.isArray(oldRecords)) {

        oldRecords = [];

    }


    console.log(
        "📦 پرانی محفوظ رسیدیں:",
        oldRecords.length
    );


    // --------------------------------------------------------
    // پرانے record کو نئے format میں تبدیل کریں
    // --------------------------------------------------------

    const convertedRecords =
        oldRecords.map(
            function (record) {

                return {

                    name:
                        record.name || "",

                    donorName:
                        record.name || "",


                    receipt:
                        record.receipt || "",

                    receiptNumber:
                        record.receipt || "",


                    date:
                        record.date || "",


                    amount:
                        Number(record.amount || 0),


                    madarsa:
                        record.madarsa || "",


                    jild:
                        record.jild || "",


                    safha:
                        record.safha || "",


                    mobile:
                        record.mobile || "",


                    type:
                        record.type || "",

                    donationType:
                        record.type || "",


                    address:
                        record.address || "",


                    photo:
                        record.photo || ""

                };

            }
        );


    // --------------------------------------------------------
    // نئے storage میں محفوظ کریں
    // --------------------------------------------------------

    try {

        localStorage.setItem(
            "receiptRecords",
            JSON.stringify(
                convertedRecords
            )
        );

        console.log(
            "✅ receiptRecords میں sync ہوگئیں:",
            convertedRecords.length
        );

    } catch (error) {

        console.error(
            "❌ نئے records محفوظ نہیں ہو سکے:",
            error
        );

    }


    // --------------------------------------------------------
    // ReceiptSystem میں بھی data ڈالیں
    // --------------------------------------------------------

    if (
        window.ReceiptSystem &&
        window.ReceiptSystem.state
    ) {

        window.ReceiptSystem.state.records =
            convertedRecords;

        console.log(
            "✅ ReceiptSystem state میں بھی records ڈال دیے گئے۔"
        );

    }


    // --------------------------------------------------------
    // Display دوبارہ چلائیں
    // --------------------------------------------------------

    if (
        window.ReceiptSystem &&
        typeof window.ReceiptSystem.renderRecords ===
        "function"
    ) {

        try {

            window.ReceiptSystem.renderRecords(
                convertedRecords
            );

            console.log(
                "✅ محفوظ رسیدیں دوبارہ دکھا دی گئیں۔"
            );

        } catch (error) {

            console.error(
                "❌ Records display error:",
                error
            );

        }

    }


    console.log(
        "🎉 Receipts Compatibility Fix مکمل ہوگیا۔"
    );


})();
