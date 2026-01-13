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
    return NextResponse.json(
      { error: "Missing cashbook ID" },
      { status: 400 }
    );
  }

  // 1️⃣ Fetch cashbook
  const { data: cashbook, error: cashbookError } = await supabase
    .from("cashbooks")
    .select("*")
    .eq("id", cashbookId)
    .single();

  if (cashbookError || !cashbook) {
    return NextResponse.json(
      { error: "Cashbook not found" },
      { status: 404 }
    );
  }

  if (!cashbook.locked) {
    return NextResponse.json(
      { error: "Cashbook must be locked before generating PDF" },
      { status: 400 }
    );
  }

  // 2️⃣ Fetch PAYMENTS (receipts)
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      amount,
      paid_at,
      loan:loans (
        borrower:borrowers (
          full_name,
          phone
        )
      )
    `)
    .eq("cashbook_id", cashbookId)
    .order("paid_at", { ascending: true });

  // 3️⃣ Fetch EXPENSES
  const { data: expenses } = await supabase
    .from("expenses")
    .select("description, amount, created_at")
    .eq("cashbook_id", cashbookId)
    .order("created_at", { ascending: true });

  // 4️⃣ Create PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  const drawText = (
    text: string,
    size = 10,
    bold = false,
    x = 50
  ) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
    y -= size + 6;
  };

  // Header
  drawText("William Loans", 20, true);
  drawText("Daily Cashbook Report", 14, true);
  drawText(`Date: ${new Date(cashbook.date).toDateString()}`);
  y -= 10;

  // Summary
  drawText("Summary", 14, true);
  drawText(`Opening Balance: ${Number(cashbook.opening_balance).toLocaleString()} RWF`);
  drawText(`Total Receipts: ${Number(cashbook.total_receipts).toLocaleString()} RWF`);
  drawText(`Total Expenses: ${Number(cashbook.total_payments).toLocaleString()} RWF`);
  drawText(`Closing Balance: ${Number(cashbook.closing_balance).toLocaleString()} RWF`);
  y -= 15;

  // Table header
  page.drawText("Name", { x: 50, y, size: 11, font: boldFont });
  page.drawText("Type", { x: 220, y, size: 11, font: boldFont });
  page.drawText("Amount", { x: 300, y, size: 11, font: boldFont });
  page.drawText("Time", { x: 400, y, size: 11, font: boldFont });
  y -= 12;

  // Receipts
  for (const p of payments || []) {
    page.drawText(
      p.loan?.borrower?.full_name ?? "-",
      { x: 50, y, size: 9, font }
    );
    page.drawText("Receipt", { x: 220, y, size: 9, font });
    page.drawText(
      `${Number(p.amount).toLocaleString()} RWF`,
      { x: 300, y, size: 9, font }
    );
    page.drawText(
      new Date(p.paid_at).toLocaleTimeString(),
      { x: 400, y, size: 9, font }
    );
    y -= 14;
  }

  // Expenses
  for (const e of expenses || []) {
    page.drawText(e.description ?? "-", { x: 50, y, size: 9, font });
    page.drawText("Expense", { x: 220, y, size: 9, font });
    page.drawText(
      `${Number(e.amount).toLocaleString()} RWF`,
      { x: 300, y, size: 9, font }
    );
    page.drawText(
      new Date(e.created_at).toLocaleTimeString(),
      { x: 400, y, size: 9, font }
    );
    y -= 14;
  }

  // 5️⃣ Return PDF (VERCEL-SAFE)
  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cashbook-${cashbook.date}.pdf"`,
    },
  });
}
