"use client";

export default function DeleteLoanModal({ loan, onClose, onSuccess }: any) {
  const submit = async () => {
    await fetch(`/api/loans/${loan.id}`, { method: "DELETE" });
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-semibold text-red-600">Delete Loan</h2>
        <p>This action cannot be undone.</p>

        <div className="flex justify-end gap-3">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={submit}
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
