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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
