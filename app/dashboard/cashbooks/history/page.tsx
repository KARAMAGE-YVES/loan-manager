"use client";

import { useEffect, useState } from "react";

export default function CashbooksHistoryPage() {
  const [cashbooks, setCashbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    const res = await fetch("/api/cashbooks/history");
    const json = await res.json();
    setCashbooks(json.cashbooks || []);
    setLoading(false);
  };

  

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) return <p className="p-8">Loading cashbooks…</p>;
  if (!cashbooks.length) return <p className="p-8">No past cashbooks found.</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Past Cashbooks</h1>
      <table className="w-full rounded-xl border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Opening Balance</th>
            <th className="p-3 text-left">Closing Balance</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cashbooks.map((c) => (
            <tr key={c.id}>
              <td className="p-3">{new Date(c.date).toDateString()}</td>
              <td className="p-3">{c.opening_balance.toLocaleString()}</td>
              <td className="p-3">{c.closing_balance?.toLocaleString() || 0}</td>
              <td className="p-3">
              <button
  onClick={() => {
    window.open(`/api/cashbooks/${c.id}/report`, "_blank");
  }}
  className="px-3 py-1 bg-blue-600 text-white rounded-xl"
>
  Download PDF
</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
