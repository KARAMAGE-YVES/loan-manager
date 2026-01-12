import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export async function GET() {
  const { data, error } = await supabase
    .from("loans")
    .select(`
      *,
      borrower:borrowers (
        id,
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const { borrower_id, principal, notes } = await req.json();

    if (!borrower_id || !principal) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prevent multiple active loans
    const { data: existingLoan } = await supabase
      .from("loans")
      .select("id")
      .eq("borrower_id", borrower_id)
      .eq("status", "Active")
      .maybeSingle();

    if (existingLoan) {
      return NextResponse.json(
        { error: "Borrower already has an active loan" },
        { status: 409 }
      );
    }

    // Get today's cashbook
    const { data: cashbook, error: cbError } = await supabase
      .from("cashbooks")
      .select("id, locked")
      .eq("date", todayISO())
      .single();

    if (cbError || !cashbook) {
      return NextResponse.json(
        { error: "No cashbook for today" },
        { status: 500 }
      );
    }

    if (cashbook.locked) {
      return NextResponse.json(
        { error: "Cashbook is locked. Cannot issue loan." },
        { status: 403 }
      );
    }

    const processing_fee = 10000;
    const interest = Number(principal) * 0.1;
    const total_to_repay =
      Number(principal) + interest + processing_fee;

    // 1️⃣ Create loan
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .insert({
        borrower_id,
        principal,
        processing_fee,
        interest,
        total_to_repay,
        amount_paid: 0,
        remaining: total_to_repay,
        start_date: new Date(),
        status: "Active",
        notes,
      })
      .select()
      .single();

    if (loanError) throw loanError;

    // 2️⃣ Create expense for loan issued
    const { error: expenseError } = await supabase
      .from("expenses")
      .insert({
        cashbook_id: cashbook.id,
        amount: principal,
        description: "Loan issued",
        source: "loan",
        reference_id: loan.id,
      });

    if (expenseError) throw expenseError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
