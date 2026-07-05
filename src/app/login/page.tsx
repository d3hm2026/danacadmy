"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", { phone, password, redirect: false });

    if (res?.error) {
      setError("رقم الجوال أو كلمة المرور غير صحيحة");
      setLoading(false);
      return;
    }

    const meRes = await fetch("/api/me");
    const me = await meRes.json();
    router.push(me.role === "admin" ? "/admin" : "/student");
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex flex-col items-center justify-center p-4" dir="rtl">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-3 overflow-hidden shadow-lg">
          <img src="/logo.svg" alt="أكاديمية دان" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a2e5a]">أكاديمية دان</h1>
        <p className="text-gray-500 text-sm mt-1">منصة الاختبارات الذكية</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-md p-7">
        <h2 className="text-xl font-bold text-gray-900 mb-5 text-center">تسجيل الدخول</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الجوال</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              required
              dir="ltr"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-left text-base focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent bg-gray-50"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a2e5a] hover:bg-[#2d4a8a] active:bg-[#0f1e3d] disabled:bg-gray-300 text-white font-semibold py-4 rounded-2xl transition-colors text-base mt-2"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-[#c4a052] font-semibold hover:underline">
              سجّل الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
