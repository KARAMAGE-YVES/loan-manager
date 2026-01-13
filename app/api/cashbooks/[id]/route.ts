import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, ctx: Context) {
  try {
    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json({ error: "Missing cashbook ID" }, { status: 400 });
    }

    // 1️⃣ Get cashbook opening balance
    const { data: cashbook, error: cbError } = await supabase
      .from("cashbooks")
      .select("opening_balance")
      .eq("id", id)
      .single();

    if (cbError || !cashbook) {
      return NextResponse.json({ error: "Cashbook not found" }, { status: 404 });
    }

    // 2️⃣ Sum payments (receipts)
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("cashbook_id", id);

    const total_receipts =
      payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

    // 3️⃣ Sum expenses
    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("cashbook_id", id);

    const total_payments =
      expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

    // 4️⃣ Correct accounting formula
    const closing_balance =
      Number(cashbook.opening_balance) +
      total_receipts -
      total_payments;

    // 5️⃣ Update cashbook
    const { data, error } = await supabase
      .from("cashbooks")
      .update({
        total_receipts,
        total_payments,
        closing_balance,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, ctx: Context) {
  try {
    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json({ error: "Missing cashbook ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cashbooks")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
