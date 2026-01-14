import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: cashbookId } = await context.params;

  if (!cashbookId) {
    return NextResponse.json({ error: "Missing cashbook ID" }, { status: 400 });
  }

  // 1️⃣ Cashbook
  const { data: cashbook } = await supabase
    .from("cashbooks")
    .select("*")
    .eq("id", cashbookId)
    .single();

  if (!cashbook) {
    return NextResponse.json({ error: "Cashbook not found" }, { status: 404 });
  }

  if (!cashbook.locked) {
    return NextResponse.json(
      { error: "Cashbook must be locked before generating PDF" },
      { status: 400 }
    );
  }

  // 2️⃣ Fetch transactions
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      amount,
      paid_at,
      loan:loans (
        borrower:borrowers ( full_name )
      )
    `)
    .eq("cashbook_id", cashbookId);

  const { data: expenses } = await supabase
    .from("expenses")
    .select("description, amount, created_at")
    .eq("cashbook_id", cashbookId);

  const { data: ownerTx } = await supabase
    .from("owner_transactions")
    .select("type, amount, created_at")
    .eq("cashbook_id", cashbookId);

  // 3️⃣ Normalize into ONE list (mirrors UI)
  const rows = [
    ...(payments || []).map((p) => ({
      time: p.paid_at,
      type: "Receipt",
      description: `${p.loan?.borrower?.full_name ?? "Borrower"} repayment`,
      amount: p.amount,
    })),
    ...(expenses || []).map((e) => ({
      time: e.created_at,
      type: "Expense",
      description: e.description,
      amount: e.amount,
    })),
    ...(ownerTx || []).map((t) => ({
      time: t.created_at,
      type: t.type === "CAPITAL_IN" ? "Capital In" : "Withdraw",
      description:
        t.type === "CAPITAL_IN"
          ? "Owner Injection"
          : "Owner Withdrawal",
      amount: t.amount,
    })),
  ].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  // 4️⃣ PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  const draw = (text: string, x = 50, size = 10, bold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
  };

  // Header
  draw("William Loans", 50, 20, true); y -= 24;
  draw("Daily Cashbook Report", 50, 14, true); y -= 18;
  draw(`Date: ${new Date(cashbook.date).toDateString()}`); y -= 20;

  // Summary
  draw("Summary", 50, 14, true); y -= 16;
  draw(`Opening Balance: ${cashbook.opening_balance.toLocaleString()} RWF`); y -= 14;
  draw(`Receipts: ${cashbook.total_receipts.toLocaleString()} RWF`); y -= 14;
  draw(`Expenses: ${cashbook.total_payments.toLocaleString()} RWF`); y -= 14;
  draw(`Closing Balance: ${cashbook.closing_balance.toLocaleString()} RWF`); y -= 20;

  // Table header
  draw("Description", 50, 11, true);
  draw("Type", 260, 11, true);
  draw("Amount", 350, 11, true);
  draw("Time", 450, 11, true);
  y -= 14;

  // Rows
  for (const r of rows) {
    draw(r.description, 50, 9);
    draw(r.type, 260, 9);
    draw(`${Number(r.amount).toLocaleString()} RWF`, 350, 9);
    draw(new Date(r.time).toLocaleTimeString(), 450, 9);
    y -= 12;
  }

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cashbook-${cashbook.date}.pdf"`,
    },
  });
}
