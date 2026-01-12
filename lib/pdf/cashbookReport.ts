import PDFDocument from "pdfkit";

export function generateCashbookPDF(data: {
  cashbook: any;
  receipts: any[];
  expenses: any[];
}) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const buffers: Buffer[] = [];

  doc.on("data", buffers.push.bind(buffers));

  const format = (n: number) =>
    `${Number(n).toLocaleString("en-US")} RWF`;

  // ===== HEADER =====
  doc
    .fontSize(22)
    .fillColor("#1e3a8a")
    .text("William Loans", { align: "center" });

  doc
    .moveDown(0.3)
    .fontSize(12)
    .fillColor("#374151")
    .text("Daily Cashbook Report", { align: "center" });

  doc.moveDown(1);

  doc
    .fontSize(10)
    .fillColor("#000")
    .text(`Date: ${data.cashbook.date}`)
    .text(`Status: LOCKED`)
    .text(`Generated at: ${new Date().toLocaleString()}`);

  doc.moveDown(1);

  // ===== CALCULATIONS (SOURCE OF TRUTH) =====
  const totalReceipts = data.receipts.reduce(
    (s, r) => s + Number(r.amount || 0),
    0
  );

  const totalExpenses = data.expenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const closingBalance =
    Number(data.cashbook.opening_balance) +
    totalReceipts -
    totalExpenses;

  // ===== SUMMARY =====
  doc.fontSize(14).text("Summary", { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(11);
  doc.text(`Opening Balance: ${format(data.cashbook.opening_balance)}`);
  doc.fillColor("green").text(`Total Receipts: ${format(totalReceipts)}`);
  doc.fillColor("red").text(`Total Expenses: ${format(totalExpenses)}`);
  doc.fillColor("#000");
  doc
    .fontSize(12)
    .text(`Closing Balance: ${format(closingBalance)}`, {
      underline: true,
    });

  doc.moveDown(1.5);

  // ===== RECEIPTS =====
  doc.fontSize(14).text("Receipts");
  doc.moveDown(0.5);

  data.receipts.forEach((r, i) => {
    doc.fontSize(10).text(
      `${i + 1}. ${r.loans.borrowers.full_name} (${r.loans.borrowers.phone})
Amount: ${format(r.amount)}
Time: ${new Date(r.paid_at).toLocaleTimeString()}`
    );
    doc.moveDown(0.3);
  });

  doc.moveDown(1);

  // ===== EXPENSES =====
  doc.fontSize(14).text("Expenses");
  doc.moveDown(0.5);

  data.expenses.forEach((e, i) => {
    doc.fontSize(10).text(
      `${i + 1}. ${e.description}
Amount: ${format(e.amount)}
Time: ${new Date(e.created_at).toLocaleTimeString()}`
    );
    doc.moveDown(0.3);
  });

  doc.end();

  return Buffer.concat(buffers);
}
