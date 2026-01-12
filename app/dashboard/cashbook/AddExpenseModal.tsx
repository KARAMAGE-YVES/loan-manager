"use client";

import { useState } from "react";

export default function AddExpenseModal({
  cashbook,
  onClose,
  onSuccess,
}: {
  cashbook: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashbook_id: cashbook.id, description, amount: Number(amount) }),
    });

    setLoading(false);
    if (res.ok) {
      onClose();
      setDescription("");
      setAmount("");
      onSuccess();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5">
        <h2 className="text-xl font-semibold">Add Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Description"
            className="w-full rounded-xl border px-4 py-3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Amount"
            className="w-full rounded-xl border px-4 py-3"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-red-600 text-white"
            >
              {loading ? "Saving..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
