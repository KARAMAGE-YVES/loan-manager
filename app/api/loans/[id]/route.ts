import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, ctx: Context) {
  const { id } = await ctx.params;
  const body = await req.json();

  const { principal, status, notes } = body;

  const interest = principal * 0.2;
  const total_to_repay = principal + interest;

  const { error } = await supabase
    .from("loans")
    .update({
      principal,
      interest,
      total_to_repay,
      remaining: total_to_repay,
      status,
      notes,
      updated_at: new Date(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, ctx: Context) {
  const { id } = await ctx.params;

  const { error } = await supabase.from("loans").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
