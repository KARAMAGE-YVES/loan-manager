"use client";

import { useEffect, useState } from "react";

export default function CashbookPage() {
  const [data, setData] = useState<{
    cashbook: any;
    payments: any[];
    expenses: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  const fetchCashbook = async () => {
    setLoading(true);
    const res = await fetch("/api/cashbooks");
    const json = await res.json();
    setData(json.error ? null : json);
    setLoading(false);
  };

  const lockCashbook = async () => {
    await fetch("/api/cashbooks/lock", { method: "POST" });
    fetchCashbook();
    console.log("CASHBOOK ID:", cashbook.id);

  };

  const addExpense = async () => {
    if (!desc || !amount || data?.cashbook.locked) return;

    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cashbook_id: data.cashbook.id,
        description: desc,
        amount: Number(amount),
      }),
    });

    setDesc("");
    setAmount("");
    fetchCashbook();
  };

  useEffect(() => {
    fetchCashbook();
  }, []);

  if (loading) return <p className="p-8">Loading cashbook…</p>;
  if (!data?.cashbook)
    return <p className="p-8">No cashbook available for today</p>;

  const { cashbook, payments, expenses } = data;

  const totalReceipts = payments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0
  );
  const totalExpenses = expenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );
  const closingBalance =
    Number(cashbook.opening_balance) +
    totalReceipts -
    totalExpenses;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Cashbook – {new Date(cashbook.date).toDateString()}
        </h1>

        {!cashbook.locked ? (
          <button
            onClick={lockCashbook}
            
            className="px-4 py-2 bg-gray-900 text-white rounded-xl"
          >
            Lock Cashbook
          </button>
        ) : (
          <span className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-semibold">
            LOCKED
          </span>
        )}

{cashbook.locked && cashbook.id && (
  <button
    onClick={() =>
      window.open(
        `/api/cashbooks/${cashbook.id}/report`,
        "_blank"
      )
    }
    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
  >
    Download Daily Report (PDF)
  </button>
)}
        {/* {cashbook.locked && (
  <button
    onClick={async () => {
      const res = await fetch("/api/cashbooks/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cashbook_id: cashbook.id }),
      });
      const json = await res.json();
      if (json.pdfDataUri) {
        const link = document.createElement("a");
        link.href = json.pdfDataUri;
        link.download = `Cashbook-${cashbook.date}.pdf`;
        link.click();
      }
    }}
    className="px-4 py-2 bg-blue-700 text-white rounded-xl ml-2"
  >
    Generate PDF
  </button>
)} */}

      </div>

      <div className="grid grid-cols-4 gap-6">
        <Stat title="Opening Balance" value={cashbook.opening_balance} />
        <Stat title="Receipts" value={totalReceipts} green />
        <Stat title="Expenses" value={totalExpenses} red />
        <Stat title="Closing Balance" value={closingBalance} blue />
      </div>

      {!cashbook.locked && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Add Expense</h2>
          <div className="flex gap-3">
            <input
              className="px-4 py-2 border rounded-xl flex-1"
              placeholder="Description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <input
              className="px-4 py-2 border rounded-xl w-40"
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              onClick={addExpense}
              className="px-5 py-2 bg-red-600 text-white rounded-xl"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">
          Today's Transactions
        </h2>

        <table className="w-full rounded-xl border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="p-3 text-green-700">Receipt</td>
                <td className="p-3">
                  {p.loan?.borrower?.full_name} repayment
                </td>
                <td className="p-3">
                  {Number(p.amount).toLocaleString()}
                </td>
              </tr>
            ))}
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="p-3 text-red-700">Expense</td>
                <td className="p-3">{e.description}</td>
                <td className="p-3">
                  {Number(e.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ title, value, green, red, blue }: any) {
  return (
    <div
      className={`p-4 rounded-xl ${
        green
          ? "bg-green-100"
          : red
          ? "bg-red-100"
          : blue
          ? "bg-blue-100"
          : "bg-gray-100"
      }`}
    >
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="text-lg font-bold">
        {Number(value).toLocaleString()} RWF
      </p>
    </div>
  );
}
