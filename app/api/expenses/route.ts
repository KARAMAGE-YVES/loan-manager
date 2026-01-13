import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { cashbook_id, description, amount } = await req.json();

    if (!cashbook_id || !description || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔒 Check cashbook lock
    const { data: cashbook, error: cbError } = await supabase
      .from("cashbooks")
      .select("locked")
      .eq("id", cashbook_id)
      .single();

    if (cbError || !cashbook) {
      return NextResponse.json(
        { error: "Cashbook not found" },
        { status: 404 }
      );
    }

    if (cashbook.locked) {
      return NextResponse.json(
        { error: "Cashbook is locked. No expenses allowed." },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("expenses").insert({
      cashbook_id,
      description,
      amount,
      source: "manual",
    });

    if (error) throw error;

    // 🔁 Recalculate cashbook totals
const { data: payments } = await supabase
.from("payments")
.select("amount")
.eq("cashbook_id", cashbook_id);

const { data: expenses } = await supabase
.from("expenses")
.select("amount")
.eq("cashbook_id", cashbook_id);

const total_receipts =
payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

const total_payments =
expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;

const { data: cb } = await supabase
.from("cashbooks")
.select("opening_balance")
.eq("id", cashbook_id)
.single();

const closing_balance =
Number(cb.opening_balance) +
total_receipts -
total_payments;

await supabase
.from("cashbooks")
.update({
  total_receipts,
  total_payments,
  closing_balance,
})
.eq("id", cashbook_id);


    // await fetch(
    //   `${process.env.NEXT_PUBLIC_SITE_URL}/api/cashbooks/${cashbook_id}`,
    //   { method: "PATCH" }
    // );
    

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
