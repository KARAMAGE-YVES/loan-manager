"use client";

import { useEffect, useState } from "react";
import LoansTable from "./LoansTable";
import AddLoanModal from "./AddLoanModal";

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [addOpen, setAddOpen] = useState(false);

  const fetchLoans = async () => {
    const res = await fetch("/api/loans");
    const data = await res.json();
    setLoans(data);
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Loans</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl"
        >
          + Issue Loan
        </button>
      </div>

      <LoansTable loans={loans} refresh={fetchLoans} />

      {addOpen && (
        <AddLoanModal onClose={() => setAddOpen(false)} onSuccess={fetchLoans} />
      )}
    </div>
  );
}
