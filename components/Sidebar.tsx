"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Borrowers", href: "/dashboard/borrowers", icon: Users },
  { label: "Loans", href: "/dashboard/loans", icon: CreditCard },
  { label: "Reports", href: "/dashboard/cashbook", icon: BarChart3 },
  { label: "History", href: "/dashboard/cashbooks/history", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className="w-80 h-screen fixed top-0 left-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex flex-col px-6 py-8 overflow-y-auto">
      {/* Brand */}
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight">
          William<span className="text-indigo-500">Loans</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">Elite Lending Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all
              ${
                active
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Card */}
      <div className="mt-10 p-5 rounded-2xl bg-gray-800 border border-gray-700 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
            Y
          </div>
          <div>
            <p className="font-semibold">William</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
