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
  const today = todayISO();

  let { data: cashbook } = await supabase
    .from("cashbooks")
    .select("*")
    .eq("date", today)
    .single();

  if (!cashbook) {
    const { data: lastCashbook } = await supabase
      .from("cashbooks")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    const opening_balance = lastCashbook?.closing_balance ?? 0;

    const { data: created } = await supabase
      .from("cashbooks")
      .insert({
        date: today,
        opening_balance,
        closing_balance: opening_balance,
        locked: false,
      })
      .select()
      .single();

    cashbook = created;
  }

  // Payments (receipts)
  const { data: payments } = await supabase
    .from("payments")
    .select(`*, loan:loans ( borrower:borrowers(full_name) )`)
    .eq("cashbook_id", cashbook.id);

  // Expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("cashbook_id", cashbook.id);

  // Owner transactions
  const { data: ownerTx } = await supabase
    .from("owner_transactions")
    .select("*")
    .eq("cashbook_id", cashbook.id);

  // Merge all transactions for table
  const mergedTransactions = [
    ...(payments ?? []).map(p => ({
      id: p.id,
      type: "RECEIPT",
      description: `${p.loan?.borrower?.full_name} repayment`,
      amount: p.amount,
    })),
    ...(expenses ?? []).map(e => ({
      id: e.id,
      type: "EXPENSE",
      description: e.description,
      amount: e.amount,
    })),
    ...(ownerTx ?? []).map(t => ({
      id: `owner-${t.id}`,
      type: t.type, // CAPITAL_IN or DRAWING
      description:
        t.type === "CAPITAL_IN" ? "Owner Capital Injection" : "Owner Withdrawal",
      amount: t.amount,
    }))
  ];

  // Compute totals
  const totalReceipts = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const totalCapitalIn = (ownerTx ?? []).filter(t => t.type === "CAPITAL_IN")
                        .reduce((s,t)=>s+Number(t.amount),0);
  const totalDrawings = (ownerTx ?? []).filter(t => t.type === "DRAWING")
                        .reduce((s,t)=>s+Number(t.amount),0);

  const closing_balance = Number(cashbook.opening_balance) + totalReceipts - totalExpenses + totalCapitalIn - totalDrawings;

  // Persist computed values
  await supabase.from("cashbooks").update({
    total_receipts: totalReceipts,
    total_payments: totalExpenses,
    closing_balance,
  }).eq("id", cashbook.id);

  return NextResponse.json({
    cashbook: { ...cashbook, total_receipts: totalReceipts, total_payments: totalExpenses, closing_balance },
    transactions: mergedTransactions,
  });
}
