import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ContextParams {
  params: { id: string };
}

// export async function PATCH(req: NextRequest, context: ContextParams) {
//   try {
//     const { id } = context.params;
//     const { total_receipts, total_payments, locked } = await req.json();

//     const closing_balance = total_receipts - total_payments;

//     const { data: cashbook, error } = await supabase
//       .from("cashbooks")
//       .update({ total_receipts, total_payments, closing_balance, locked })
//       .eq("id", id)
//       .select()
//       .single();

//     if (error) throw error;
//     return NextResponse.json(cashbook);
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// export async function DELETE(req: NextRequest, context: ContextParams) {
//   try {
//     const { id } = context.params;
//     const { error } = await supabase.from("cashbooks").delete().eq("id", id);

//     if (error) throw error;
//     return NextResponse.json({ message: "Cashbook deleted" });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
