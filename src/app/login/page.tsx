"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
    <div className="min-h-screen flex" dir="rtl">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] items-center justify-center p-12">
        <div className="text-center text-white">
          <Image src="/logo.png" alt="أكاديمية دان" width={200} height={200} className="mx-auto mb-8 drop-shadow-2xl" onError={(e) => { (e.target as HTMLImageElement).src = "/logo.svg"; }} />
          <h2 className="text-3xl font-bold mb-4">منصة الاختبارات الذكية</h2>
          <p className="text-blue-200 text-lg leading-relaxed">اختبر قدراتك وطوّر مهاراتك<br />مع أكاديمية دان</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.png" alt="أكاديمية دان" width={90} height={90} className="mx-auto mb-3" onError={(e) => { (e.target as HTMLImageElement).src = "/logo.svg"; }} />
            <h1 className="text-xl font-bold text-[#1a2e5a]">أكاديمية دان</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">تسجيل الدخول</h2>
            <p className="text-gray-500 text-sm mb-6">أدخل بياناتك للمتابعة</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الجوال</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" required dir="ltr"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent" />
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

              <button type="submit" disabled={loading}
                className="w-full bg-[#1a2e5a] hover:bg-[#2d4a8a] disabled:bg-gray-400 text-white font-medium py-3 rounded-xl transition-colors">
                {loading ? "جاري الدخول..." : "دخول"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                ليس لديك حساب؟{" "}
                <Link href="/register" className="text-[#c4a052] font-medium hover:underline">سجّل الآن</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
