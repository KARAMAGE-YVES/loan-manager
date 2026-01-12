import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const { data: cashbook, error } = await supabase
      .from("cashbooks")
      .select("id, locked")
      .eq("date", today)
      .single();

    if (error || !cashbook) {
      return NextResponse.json(
        { error: "Cashbook not found" },
        { status: 404 }
      );
    }

    if (cashbook.locked) {
      return NextResponse.json(
        { error: "Cashbook already locked" },
        { status: 400 }
      );
    }

    await supabase
      .from("cashbooks")
      .update({
        locked: true,
        locked_at: new Date().toISOString(),
      })
      .eq("id", cashbook.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
