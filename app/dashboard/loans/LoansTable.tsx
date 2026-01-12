"use client";

import { useState } from "react";
import EditLoanModal from "./EditLoanModal";
import DeleteLoanModal from "./DeleteLoanModal";
import PaymentModal from "./PaymentModal";

export default function LoansTable({ loans, refresh, refreshCashbook }: any) {
  const [editLoan, setEditLoan] = useState<any>(null);
  const [deleteLoan, setDeleteLoan] = useState<any>(null);
  const [paymentLoan, setPaymentLoan] = useState<any | null>(null);

  return (
    <>
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Borrower</th>
              <th className="px-4 py-3 text-left">Principal</th>
              <th className="px-4 py-3 text-center">Total</th>
              <th className="px-4 py-3 text-center">Remaining</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loans.map((loan: any) => (
              <tr key={loan.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {loan.borrower?.full_name ?? "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {loan.borrower?.phone}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3">{Number(loan.principal).toLocaleString()}</td>
                <td className="px-4 py-3 text-center">{Number(loan.total_to_repay).toLocaleString()}</td>
                <td className="px-4 py-3 text-center">{Number(loan.remaining).toLocaleString()}</td>

                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      loan.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {loan.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    onClick={() => setPaymentLoan(loan)}
                    className="text-green-600 hover:underline"
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => setEditLoan(loan)}
                    className="text-indigo-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteLoan(loan)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paymentLoan && (
        <PaymentModal
          loan={paymentLoan}
          onClose={() => setPaymentLoan(null)}
          // onSuccess={fetchCashbook}
          onSuccess={() => {
            refresh(); // refresh loans
            refreshCashbook?.(); // refresh cashbook page if provided
          }}
        />
      )}

      {editLoan && (
        <EditLoanModal loan={editLoan} onClose={() => setEditLoan(null)} onSuccess={refresh} />
      )}

      {deleteLoan && (
        <DeleteLoanModal loan={deleteLoan} onClose={() => setDeleteLoan(null)} onSuccess={refresh} />
      )}
    </>
  );
}
