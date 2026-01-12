"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Users, CreditCard, DollarSign, Plus, LogOut } from "lucide-react";
import AddBorrowerModal from "@/components/AddBorrowerModal";

export default function Dashboard() {
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  async function fetchData() {
    setLoading(true);

    const borrowersRes = await fetch("/api/borrowers");
    const borrowersData = await borrowersRes.json();
    setBorrowers(borrowersData);

    const loansRes = await fetch("/api/loans");
    const loansData = await loansRes.json();
    setLoans(loansData);

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  // ------------------------
  // Loan summary calculations
  // ------------------------
  const totalLoans = loans.length;
  const totalOutstanding = loans.reduce((sum, l) => sum + l.remaining, 0);
  const totalRepaid = loans.reduce((sum, l) => sum + l.amount_paid, 0);
  const activeLoans = loans.filter((l) => l.status === "Active").length;

  // ------------------------
  // Borrowers summary
  // ------------------------
  const totalBorrowers = borrowers.length;

  return (
    <div className="p-10 space-y-8 bg-gray-50 min-h-screen">
      {/* ------------------------
          Header
      ------------------------ */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Quick overview of loans & borrowers</p>
        </div>
      </div>

      {/* ------------------------
          Summary Cards
      ------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-indigo-500" size={32} />
            <div>
              <p className="text-gray-400 text-sm">Total Borrowers</p>
              <p className="text-2xl font-bold text-gray-900">{totalBorrowers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="text-indigo-500" size={32} />
            <div>
              <p className="text-gray-400 text-sm">Total Loans</p>
              <p className="text-2xl font-bold text-gray-900">{totalLoans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-500" size={32} />
            <div>
              <p className="text-gray-400 text-sm">Total Repaid</p>
              <p className="text-2xl font-bold text-gray-900">{totalRepaid.toLocaleString()} RWF</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="text-red-500" size={32} />
            <div>
              <p className="text-gray-400 text-sm">Outstanding Balance</p>
              <p className="text-2xl font-bold text-gray-900">{totalOutstanding.toLocaleString()} RWF</p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------
          Borrowers & Loans Cards
      ------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Borrowers */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User /> Borrowers
            </h2>
            <AddBorrowerModal onSuccess={fetchData} />
          </div>

          {loading ? (
            <p className="text-gray-400">Loading borrowers...</p>
          ) : borrowers.length === 0 ? (
            <p className="text-gray-400">No borrowers yet.</p>
          ) : (
            <ul className="space-y-3">
              {borrowers.map((b) => (
                <li
                  key={b.id}
                  className="border border-gray-100 rounded-xl p-3 flex justify-between items-center hover:shadow transition"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{b.full_name}</p>
                    <p className="text-gray-500 text-sm">{b.phone}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Loans */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <CreditCard /> Recent Loans
          </h2>

          {loading ? (
            <p className="text-gray-400">Loading loans...</p>
          ) : loans.length === 0 ? (
            <p className="text-gray-400">No loans yet.</p>
          ) : (
            <ul className="space-y-3">
              {loans.slice(0, 5).map((loan) => (
                <li
                  key={loan.id}
                  className="border border-gray-100 rounded-xl p-3 flex justify-between items-center hover:shadow transition"
                >
                  <div className="flex flex-col">
                  <p className="font-semibold text-gray-900">
  {loan.borrower?.full_name ?? "Unknown borrower"}
</p>

                    <p className="text-gray-500 text-sm">
                      Remaining: {loan.remaining.toLocaleString()} RWF
                    </p>
                    <p className="text-gray-500 text-sm">
                      Status:{" "}
                      <span className={loan.status === "Active" ? "text-green-600" : "text-gray-400"}>
                        {loan.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <DollarSign
                      size={20}
                      className="text-green-500 cursor-pointer hover:text-green-700"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
