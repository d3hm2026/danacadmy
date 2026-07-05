"use client";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ phone: "", name: "", school: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (form.password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    const nameParts = form.name.trim().split(/\s+/);
    if (nameParts.length < 3) {
      setError("يرجى إدخال الاسم الثلاثي كاملاً");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone, name: form.name.trim(), school: form.school.trim(), password: form.password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "حدث خطأ، حاول مجدداً");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f4f6fb] flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">تم إرسال طلبك</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            سيتم مراجعة طلبك من قِبل الإدارة<br />وسيُفعَّل حسابك قريباً
          </p>
          <Link href="/login" className="block w-full bg-[#1a2e5a] text-white font-semibold py-4 rounded-2xl text-center">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex flex-col items-center justify-center p-4" dir="rtl">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2 overflow-hidden shadow-lg">
          <img src="/logo.svg" alt="أكاديمية دان" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl font-bold text-[#1a2e5a]">أكاديمية دان</h1>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-md p-7">
        <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">إنشاء حساب</h2>
        <p className="text-gray-500 text-sm mb-5 text-center">أدخل بياناتك لتقديم طلب التسجيل</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الثلاثي</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="الاسم الأول الثاني الثالث" required
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المدرسة</label>
            <input name="school" value={form.school} onChange={handleChange} placeholder="اسم المدرسة أو الجهة" required
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الجوال</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="05xxxxxxxx" required dir="ltr"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-left text-base focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">تأكيد كلمة المرور</label>
            <input name="confirm" type="password" value={form.confirm} onChange={handleChange} placeholder="••••••••" required
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] bg-gray-50" />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl text-center">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#c4a052] hover:bg-[#b38e40] active:bg-[#9a7a35] disabled:bg-gray-300 text-white font-semibold py-4 rounded-2xl transition-colors text-base mt-2">
            {loading ? "جاري الإرسال..." : "إرسال طلب التسجيل"}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            لديك حساب؟{" "}
            <Link href="/login" className="text-[#1a2e5a] font-semibold hover:underline">سجّل دخولك</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
