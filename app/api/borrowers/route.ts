import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all borrowers
export async function GET() {
  const { data, error } = await supabase
    .from("borrowers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST add new borrower
export async function POST(req: Request) {
  const body = await req.json();
  const { full_name, phone, national_id, notes } = body;

  if (!full_name || !phone) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("borrowers")
    .insert([{ full_name, phone, national_id, notes }])
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Failed to create borrower" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, borrower: data });
}

// PATCH update borrower
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, full_name, phone, national_id, notes } = body;

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { data, error } = await supabase
    .from("borrowers")
    .update({ full_name, phone, national_id, notes })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Failed to update borrower" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, borrower: data });
}

// DELETE borrower
export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await supabase.from("borrowers").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
