import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateCashbookPDF } from "@/lib/pdf/cashbookReport";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const cashbookId = context.params.id;

  /* 1️⃣ Fetch cashbook */
  const { data: cashbook, error: cbError } = await supabase
    .from("cashbooks")
    .select("*")
    .eq("id", cashbookId)
    .single();

  if (cbError || !cashbook)
    return NextResponse.json({ error: "Cashbook not found" }, { status: 404 });

  if (!cashbook.locked)
    return NextResponse.json(
      { error: "Cashbook must be locked first" },
      { status: 403 }
    );

  /* 2️⃣ Fetch receipts */
  const { data: receipts } = await supabase
    .from("payments")
    .select(`
      amount,
      paid_at,
      loan:loans (
        borrower_id,
        borrowers (
          full_name,
          phone
        )
      )
    `)
    .eq("cashbook_id", cashbookId);

  /* 3️⃣ Fetch expenses */
  const { data: expenses } = await supabase
    .from("expenses")
    .select("description, amount, created_at")
    .eq("cashbook_id", cashbookId);

  /* 4️⃣ Generate PDF */
  const pdfBuffer = generateCashbookPDF({
    cashbook,
    receipts: receipts ?? [],
    expenses: expenses ?? [],
  });

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cashbook-${cashbook.date}.pdf"`,
    },
  });
}
