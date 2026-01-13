"use client";

import { useEffect, useState } from "react";

type CashbookData = {
  cashbook: any;
  payments: any[];
  expenses: any[];
  owner_transactions: any[];
};

export default function CashbookPage() {
  const [data, setData] = useState<CashbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [ownerAmount, setOwnerAmount] = useState("");
  const [downloading, setDownloading] = useState(false);

  const fetchCashbook = async () => {
    setLoading(true);
    const res = await fetch("/api/cashbooks");
    const json = await res.json();
    setData(json?.error ? null : json);
    setLoading(false);
  };

  const lockCashbook = async () => {
    if (!data?.cashbook) return;
    await fetch("/api/cashbooks/lock", { method: "POST" });
    fetchCashbook();
  };

  const downloadPDF = async () => {
    if (!data?.cashbook?.id) return;
    try {
      setDownloading(true);
      const res = await fetch(`/api/cashbooks/${data.cashbook.id}/report`);
      if (!res.ok) {
        const json = await res.json();
        alert(json?.error || "Failed to generate PDF");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cashbook-${data.cashbook.date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Error downloading PDF");
    } finally {
      setDownloading(false);
    }
  };

  const addExpense = async () => {
    if (!data || !desc || !amount || data.cashbook.locked) return;
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

  const handleOwnerTransaction = async (type: "CAPITAL_IN" | "DRAWING") => {
    if (!data || !ownerAmount || data.cashbook.locked) return;

    const res = await fetch("/api/owner_transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cashbook_id: data.cashbook.id,
        amount: Number(ownerAmount),
        type,
      }),
    });

    const json = await res.json();
    if (json.error) {
      alert(json.error);
      return;
    }

    setOwnerAmount("");
    fetchCashbook();
  };

  useEffect(() => {
    fetchCashbook();
  }, []);

  if (loading) return <p className="p-8">Loading cashbook…</p>;
  if (!data?.cashbook) return <p className="p-8">No cashbook available for today</p>;

  const { cashbook, payments = [], expenses = [], owner_transactions = [] } = data;

  // Totals
  const totalReceipts = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalCapitalIn = owner_transactions
    .filter((t) => t.type === "CAPITAL_IN")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalDrawings = owner_transactions
    .filter((t) => t.type === "DRAWING")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const closingBalance =
    Number(cashbook.opening_balance) + totalReceipts - totalExpenses + totalCapitalIn - totalDrawings;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Cashbook – {new Date(cashbook.date).toDateString()}
        </h1>

        <div className="flex gap-3 items-center">
          {!cashbook.locked ? (
            <button
              onClick={lockCashbook}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl"
            >
              Lock Cashbook
            </button>
          ) : (
            <>
              <span className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-semibold">
                LOCKED
              </span>
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="px-4 py-2 bg-black text-white rounded-xl disabled:opacity-50"
              >
                {downloading ? "Generating…" : "Download PDF"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Stat title="Opening Balance" value={cashbook.opening_balance} />
        <Stat title="Receipts" value={totalReceipts} green />
        <Stat title="Expenses" value={totalExpenses} red />
        <Stat title="Closing Balance" value={closingBalance} blue />
      </div>

      {/* Add Expense & Owner Transactions */}
      {!cashbook.locked && (
        <div className="mt-8 space-y-6">
          <div>
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

          <div>
            <h2 className="text-xl font-semibold mb-2">Owner Transactions</h2>
            <div className="flex gap-3">
              <input
                className="px-4 py-2 border rounded-xl w-40"
                type="number"
                placeholder="Amount"
                value={ownerAmount}
                onChange={(e) => setOwnerAmount(e.target.value)}
              />
              <button
                onClick={() => handleOwnerTransaction("CAPITAL_IN")}
                className="px-5 py-2 bg-green-600 text-white rounded-xl"
              >
                Add Capital
              </button>
              <button
                onClick={() => handleOwnerTransaction("DRAWING")}
                className="px-5 py-2 bg-yellow-600 text-white rounded-xl"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Today's Transactions</h2>

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
                <td className="p-3">{p.loan?.borrower?.full_name} repayment</td>
                <td className="p-3">{Number(p.amount).toLocaleString()}</td>
              </tr>
            ))}
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="p-3 text-red-700">Expense</td>
                <td className="p-3">{e.description}</td>
                <td className="p-3">{Number(e.amount).toLocaleString()}</td>
              </tr>
            ))}
            {owner_transactions.map((t) => (
              <tr key={t.id}>
                <td className={`p-3 ${t.type === "CAPITAL_IN" ? "text-green-700" : "text-yellow-700"}`}>
                  {t.type === "CAPITAL_IN" ? "Capital In" : "Withdraw"}
                </td>
                <td className="p-3">{t.type === "CAPITAL_IN" ? "Owner Injection" : "Owner Withdrawal"}</td>
                <td className="p-3">{Number(t.amount).toLocaleString()}</td>
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
        green ? "bg-green-100" : red ? "bg-red-100" : blue ? "bg-blue-100" : "bg-gray-100"
      }`}
    >
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="text-lg font-bold">{Number(value).toLocaleString()} RWF</p>
    </div>
  );
}
