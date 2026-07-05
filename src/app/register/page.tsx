"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const [form, setForm] = useState({ phone: "", name: "", school: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">تم إرسال طلبك</h2>
          <p className="text-gray-500 text-sm mb-6">
            سيتم مراجعة طلبك من قِبل الإدارة وسيُفعَّل حسابك قريباً.
          </p>
          <Link href="/login" className="block w-full bg-[#1a2e5a] text-white font-medium py-3 rounded-xl text-center hover:bg-[#2d4a8a] transition-colors">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] items-center justify-center p-12">
        <div className="text-center text-white">
          <Image src="/logo.png" alt="أكاديمية دان" width={200} height={200} className="mx-auto mb-8 drop-shadow-2xl" />
          <h2 className="text-3xl font-bold mb-4">انضم إلى أكاديمية دان</h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            سجّل بياناتك وانتظر موافقة الإدارة<br />للوصول إلى الاختبارات
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.png" alt="أكاديمية دان" width={100} height={100} className="mx-auto mb-3" />
            <h1 className="text-xl font-bold text-[#1a2e5a]">أكاديمية دان</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">إنشاء حساب</h2>
            <p className="text-gray-500 text-sm mb-6">أدخل بياناتك لتقديم طلب التسجيل</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الثلاثي</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="الاسم الأول الثاني الثالث"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المدرسة</label>
                <input
                  name="school"
                  value={form.school}
                  onChange={handleChange}
                  placeholder="اسم المدرسة أو الجهة"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الجوال</label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="05xxxxxxxx"
                  required
                  dir="ltr"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">تأكيد كلمة المرور</label>
                <input
                  name="confirm"
                  type="password"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c4a052] hover:bg-[#b38e40] disabled:bg-gray-400 text-white font-medium py-3 rounded-xl transition-colors"
              >
                {loading ? "جاري الإرسال..." : "إرسال طلب التسجيل"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                لديك حساب بالفعل؟{" "}
                <Link href="/login" className="text-[#1a2e5a] font-medium hover:underline">
                  سجّل دخولك
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
