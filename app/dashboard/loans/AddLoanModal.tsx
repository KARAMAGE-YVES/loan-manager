"use client";

import { useEffect, useState } from "react";

export default function AddLoanModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [activeBorrowerIds, setActiveBorrowerIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    borrower_id: "",
    principal: "",
    notes: "",
  });

  const hasActiveLoan = activeBorrowerIds.includes(form.borrower_id);

  useEffect(() => {
    fetchBorrowers();
    fetchActiveLoans();
  }, []);

  async function fetchBorrowers() {
    const res = await fetch("/api/borrowers");
    const data = await res.json();
    setBorrowers(data);
  }

  async function fetchActiveLoans() {
    const res = await fetch("/api/loans");
    const data = await res.json();

    const ids = data
      .filter((l: any) => l.status === "Active")
      .map((l: any) => l.borrower_id);

    setActiveBorrowerIds(ids);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (hasActiveLoan) return;

    setLoading(true);

    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        borrower_id: form.borrower_id,
        principal: Number(form.principal),
        notes: form.notes,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to issue loan");
      return;
    }

    setForm({ borrower_id: "", principal: "", notes: "" });
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">Issue New Loan</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            className="w-full border rounded-xl px-4 py-3"
            value={form.borrower_id}
            onChange={(e) =>
              setForm({ ...form, borrower_id: e.target.value })
            }
            required
          >
            <option value="">Select borrower</option>
            {borrowers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.full_name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={100000}
            placeholder="Principal amount (min 100,000)"
            className="w-full border rounded-xl px-4 py-3"
            value={form.principal}
            onChange={(e) =>
              setForm({ ...form, principal: e.target.value })
            }
            required
          />

          <textarea
            placeholder="Notes (optional)"
            className="w-full border rounded-xl px-4 py-3"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
          />

          {hasActiveLoan && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              ⚠️ This borrower already has an active loan.
              <br />
              Close it before issuing another.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border"
            >
              Cancel
            </button>

            <button
              disabled={loading || hasActiveLoan}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-40"
            >
              {loading ? "Saving..." : "Issue Loan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
