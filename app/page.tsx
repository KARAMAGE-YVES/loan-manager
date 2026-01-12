"use client";

import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white px-4">
      <h1 className="text-4xl font-extrabold mb-4 text-center">
        Welcome to <span className="text-indigo-500">William Loans</span>
      </h1>
      <p className="text-gray-300 mb-8 text-center">
        Manage loans, payments, and cashbooks efficiently.
      </p>

      <button
        onClick={() => router.push("/login")}
        className="px-6 py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-700 transition"
      >
        Go to Login
      </button>
    </div>
  );
}
