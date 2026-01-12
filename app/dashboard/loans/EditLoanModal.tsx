"use client";

import { useState } from "react";

export default function EditLoanModal({ loan, onClose, onSuccess }: any) {
  const [principal, setPrincipal] = useState(loan.principal);
  const [status, setStatus] = useState(loan.status);
  const [notes, setNotes] = useState(loan.notes || "");

  const submit = async () => {
    await fetch(`/api/loans/${loan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ principal, status, notes }),
    });

    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold">Edit Loan</h2>

        <input
          type="number"
          className="w-full border rounded-lg px-4 py-2"
          value={principal}
          onChange={(e) => setPrincipal(Number(e.target.value))}
        />

        <select
          className="w-full border rounded-lg px-4 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>Active</option>
          <option>Completed</option>
        </select>

        <textarea
          className="w-full border rounded-lg px-4 py-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={submit}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
