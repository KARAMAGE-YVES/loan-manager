"use client";

import { useEffect, useState } from "react";
import AddBorrowerModal from "@/components/AddBorrowerModal";
import { Pencil, Trash } from "lucide-react";

// Edit modal: reuse AddBorrowerModal but pass initial values
function EditBorrowerModal({
  borrower,
  onSuccess,
  onClose,
}: {
  borrower: any;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: borrower.full_name,
    phone: borrower.phone,
    national_id: borrower.national_id || "",
    notes: borrower.notes || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/borrowers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: borrower.id, ...form }),
    });

    setLoading(false);
    if (res.ok) {
      onSuccess();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center ml-80">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-xl">
        <h2 className="text-xl font-semibold">Edit Borrower</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Full name"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <input
            placeholder="Phone number"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <input
            placeholder="National ID (optional)"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={form.national_id}
            onChange={(e) =>
              setForm({ ...form, national_id: e.target.value })
            }
          />
          <textarea
            placeholder="Notes (optional)"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BorrowersPage() {
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingBorrower, setEditingBorrower] = useState<any | null>(null);

  async function fetchBorrowers() {
    setLoading(true);
    const res = await fetch("/api/borrowers");
    const data = await res.json();
    setBorrowers(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchBorrowers();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this borrower?")) return;

    const res = await fetch("/api/borrowers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) fetchBorrowers();
  }

  return (
    <div className="p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Borrowers</h1>
          <p className="text-gray-500 mt-1">
            Manage all people you lend money to
          </p>
        </div>
        <AddBorrowerModal onSuccess={fetchBorrowers} />
      </div>

      {/* Borrower Cards */}
      <div className="grid gap-4">
        {loading && (
          <p className="text-gray-400 text-center col-span-full">
            Loading borrowers...
          </p>
        )}

        {!loading && borrowers.length === 0 && (
          <p className="text-gray-400 text-center col-span-full">
            No borrowers yet. Add your first borrower.
          </p>
        )}

        {!loading &&
          borrowers.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl shadow p-6 flex justify-between items-center"
            >
              {/* Borrower info */}
              <div className="flex flex-col gap-1">
                <span className="text-gray-900 font-semibold text-lg">
                  {b.full_name}
                </span>
                <span className="text-gray-500">{b.phone}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Pencil
                  size={20}
                  className="text-indigo-500 hover:text-indigo-700 cursor-pointer"
                  onClick={() => setEditingBorrower(b)}
                />
                <Trash
                  size={20}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                  onClick={() => handleDelete(b.id)}
                />
              </div>
            </div>
          ))}
      </div>

      {/* Edit Modal */}
      {editingBorrower && (
        <EditBorrowerModal
          borrower={editingBorrower}
          onSuccess={fetchBorrowers}
          onClose={() => setEditingBorrower(null)}
        />
      )}
    </div>
  );
}
