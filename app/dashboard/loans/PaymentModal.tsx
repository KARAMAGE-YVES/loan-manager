"use client";

import { useState } from "react";

export default function PaymentModal({
  loan,
  onClose,
  onSuccess,
}: {
  loan: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      setError("Payment amount must be greater than zero");
      return;
    }

    if (paymentAmount > loan.remaining) {
      setError("Payment exceeds remaining balance");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loan_id: loan.id,
        amount: paymentAmount,
        notes,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Failed to record payment");
      return;
    }
    onClose();
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-5">
        <h2 className="text-xl font-semibold">Record Payment</h2>

        <p className="text-sm text-gray-500">
          Remaining balance:{" "}
          <span className="font-medium text-gray-900">
            {loan.remaining.toLocaleString()} RWF
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            placeholder="Payment amount"
            className="w-full rounded-xl border px-4 py-3"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <textarea
            placeholder="Notes (optional)"
            className="w-full rounded-xl border px-4 py-3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
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
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white"
            >
              {loading ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
