import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import PdfPrinter from "pdfmake";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// fonts for pdfmake
const fonts = {
  Roboto: {
    normal: Buffer.from(
      require("pdfmake/build/vfs_fonts.js").pdfMake.vfs["Roboto-Regular.ttf"],
      "base64"
    ),
    bold: Buffer.from(
      require("pdfmake/build/vfs_fonts.js").pdfMake.vfs["Roboto-Medium.ttf"],
      "base64"
    ),
    italics: Buffer.from(
      require("pdfmake/build/vfs_fonts.js").pdfMake.vfs["Roboto-Italic.ttf"],
      "base64"
    ),
    bolditalics: Buffer.from(
      require("pdfmake/build/vfs_fonts.js").pdfMake.vfs["Roboto-MediumItalic.ttf"],
      "base64"
    ),
  },
};

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const cashbookId = context.params.id;

  // Fetch cashbook
  const { data: cashbook, error: cbError } = await supabase
    .from("cashbooks")
    .select("*")
    .eq("id", cashbookId)
    .single();

  if (cbError || !cashbook)
    return NextResponse.json({ error: "Cashbook not found" }, { status: 404 });

  if (!cashbook.locked)
    return NextResponse.json(
      { error: "Cashbook must be locked first" },
      { status: 403 }
    );

  // Fetch receipts
  const { data: receipts } = await supabase
    .from("payments")
    .select(`
      amount,
      paid_at,
      loan:loans (
        borrower_id,
        borrowers (
          full_name,
          phone
        )
      )
    `)
    .eq("cashbook_id", cashbookId);

  // Fetch expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("description, amount, created_at")
    .eq("cashbook_id", cashbookId);

  // Build pdf document definition
  const dd: any = {
    content: [
      { text: "William Loans", style: "header" },
      { text: `Daily Cashbook Report - ${cashbook.date}`, style: "subheader" },
      { text: `Generated at: ${new Date().toLocaleString()}\n\n` },

      { text: "Receipts", style: "tableHeader" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto"],
          body: [
            ["Borrower", "Amount", "Time"],
            ...(receipts ?? []).map((r) => [
              `${r.loan?.borrowers?.full_name ?? ""} (${r.loan?.borrowers?.phone ?? ""})`,
              `${Number(r.amount).toLocaleString()} RWF`,
              new Date(r.paid_at).toLocaleTimeString(),
            ]),
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 5, 0, 15],
      },

      { text: "Expenses", style: "tableHeader" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto"],
          body: [
            ["Description", "Amount", "Time"],
            ...(expenses ?? []).map((e) => [
              e.description,
              `${Number(e.amount).toLocaleString()} RWF`,
              new Date(e.created_at).toLocaleTimeString(),
            ]),
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      header: { fontSize: 22, bold: true, alignment: "center", color: "#1e3a8a" },
      subheader: { fontSize: 14, alignment: "center", margin: [0, 5, 0, 15] },
      tableHeader: { bold: true, fontSize: 12, margin: [0, 10, 0, 5] },
    },
    defaultStyle: { font: "Roboto" },
  };

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(dd);
  const chunks: any[] = [];

  return new Promise<NextResponse>((resolve, reject) => {
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(
        new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="cashbook-${cashbook.date}.pdf"`,
          },
        })
      );
    });
    pdfDoc.end();
  });
}
