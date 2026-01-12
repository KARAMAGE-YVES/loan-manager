import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateCashbookPDF } from "@/lib/pdf/cashbookReport";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cashbookId = params.id;

  if (!params.id) {
    return NextResponse.json(
      { error: "Missing cashbook id" },
      { status: 400 }
    );
  }
  

  /* 1️⃣ Fetch cashbook safely */
  const { data: cashbook, error: cashbookError } = await supabase
    .from("cashbooks")
    .select("*")
    .eq("id", cashbookId)
    .maybeSingle();

  if (cashbookError) {
    return NextResponse.json(
      { error: cashbookError.message },
      { status: 500 }
    );
  }

  if (!cashbook) {
    return NextResponse.json(
      { error: "Cashbook not found" },
      { status: 404 }
    );
  }

  if (!cashbook.locked) {
    return NextResponse.json(
      { error: "Cashbook must be locked first" },
      { status: 403 }
    );
  }

  /* 2️⃣ Fetch receipts */
  const { data: receipts, error: receiptsError } = await supabase
    .from("payments")
    .select(`
      amount,
      paid_at,
      loans (
        borrowers (
          full_name,
          phone
        )
      )
    `)
    .eq("cashbook_id", cashbookId);

  if (receiptsError) {
    return NextResponse.json(
      { error: receiptsError.message },
      { status: 500 }
    );
  }

  /* 3️⃣ Fetch expenses */
  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("description, amount, created_at")
    .eq("cashbook_id", cashbookId);

  if (expensesError) {
    return NextResponse.json(
      { error: expensesError.message },
      { status: 500 }
    );
  }

  /* 4️⃣ Generate PDF */
  const pdfBuffer = generateCashbookPDF({
    cashbook,
    receipts: receipts ?? [],
    expenses: expenses ?? [],
  });

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="William-Loans-${cashbook.date}.pdf"`,
    },
  });
}
