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

  // 1️⃣ Get or create today’s cashbook
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

  // 2️⃣ Fetch payments & expenses
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      loan:loans (
        borrower:borrowers ( full_name )
      )
    `)
    .eq("cashbook_id", cashbook.id);

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("cashbook_id", cashbook.id);

  return NextResponse.json({
    cashbook,
    payments: payments ?? [],
    expenses: expenses ?? [],
  });
}

export async function PATCH(req: Request) {
  const { lock } = await req.json();

  const today = todayISO();

  const { data, error } = await supabase
    .from("cashbooks")
    .update({ locked: lock })
    .eq("date", today)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
