import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { loan_id, amount, notes } = await req.json();

    if (!loan_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment data" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    // 1️⃣ Get today's cashbook (NOW ALSO CHECK LOCK)
    const { data: cashbook, error: cashbookError } = await supabase
      .from("cashbooks")
      .select("id, locked")
      .eq("date", today)
      .single();

    if (cashbookError || !cashbook) {
      return NextResponse.json(
        { error: "Today's cashbook not found" },
        { status: 500 }
      );
    }

    // 🔒 BLOCK IF CASHBOOK IS LOCKED
    if (cashbook.locked) {
      return NextResponse.json(
        { error: "Cashbook is locked. No payments allowed." },
        { status: 403 }
      );
    }

    // 2️⃣ Fetch loan
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("remaining, amount_paid")
      .eq("id", loan_id)
      .single();

    if (loanError || !loan) {
      return NextResponse.json(
        { error: "Loan not found" },
        { status: 404 }
      );
    }

    if (amount > loan.remaining) {
      return NextResponse.json(
        { error: "Payment exceeds remaining balance" },
        { status: 400 }
      );
    }

    // 3️⃣ Insert payment (LINKED TO CASHBOOK)
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        loan_id,
        cashbook_id: cashbook.id,
        amount,
        notes,
      });

    if (paymentError) {
      throw paymentError;
    }

    // 4️⃣ Update loan
    const newAmountPaid = loan.amount_paid + amount;
    const newRemaining = loan.remaining - amount;

    await supabase
      .from("loans")
      .update({
        amount_paid: newAmountPaid,
        remaining: newRemaining,
        status: newRemaining === 0 ? "Completed" : "Active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", loan_id);

// 🔁 Recalculate cashbook totals
const { data: payments } = await supabase
  .from("payments")
  .select("amount")
  .eq("cashbook_id", cashbook.id);

const { data: expenses } = await supabase
  .from("expenses")
  .select("amount")
  .eq("cashbook_id", cashbook.id);

const total_receipts =
  payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

const total_payments =
  expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;

// Get opening balance
const { data: cb } = await supabase
  .from("cashbooks")
  .select("opening_balance")
  .eq("id", cashbook.id)
  .single();

const closing_balance =
  Number(cb.opening_balance) +
  total_receipts -
  total_payments;

// Update DB
await supabase
  .from("cashbooks")
  .update({
    total_receipts,
    total_payments,
    closing_balance,
  })
  .eq("id", cashbook.id);



      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/cashbooks/${cashbook.id}`,
        { method: "PATCH" }
      );
      

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
