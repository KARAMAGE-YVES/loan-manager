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
  const { id } = await ctx.params;

  if (!id) {
    return NextResponse.json({ error: "Missing loan ID" }, { status: 400 });
  }

  const { principal, status, notes } = await req.json();

  const interest = Number(principal) * 0.2;
  const total_to_repay = Number(principal) + interest;

  const { error } = await supabase
    .from("loans")
    .update({
      principal,
      interest,
      total_to_repay,
      remaining: total_to_repay,
      status,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, ctx: Context) {
  const { id } = await ctx.params;

  if (!id) {
    return NextResponse.json({ error: "Missing loan ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("loans")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
