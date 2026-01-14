import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { cashbook_id, amount, type, note } = await req.json();

  if (!cashbook_id || !amount || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["CAPITAL_IN", "DRAWING"].includes(type)) {
    return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
  }

  const { data: cashbook } = await supabase
    .from("cashbooks")
    .select("locked")
    .eq("id", cashbook_id)
    .single();

  if (!cashbook) {
    return NextResponse.json({ error: "Cashbook not found" }, { status: 404 });
  }

  if (cashbook.locked) {
    return NextResponse.json({ error: "Cashbook is locked" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("owner_transactions")
    .insert({
      cashbook_id,
      amount,
      type,
      note: note ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
