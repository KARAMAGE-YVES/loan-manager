import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { total_receipts, total_payments, locked } = await req.json();

    const { data: cashbook, error } = await supabase
      .from("cashbooks")
      .update({ total_receipts, total_payments, closing_balance: total_receipts - total_payments, locked })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(cashbook);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { error } = await supabase.from("cashbooks").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ message: "Cashbook deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
